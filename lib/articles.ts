import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/categories";
import type { ArticleBodyBlock, ArticleNextStepCta } from "@/lib/insights";

export class ArticleValidationError extends Error {}

/**
 * Defensive parse of an untrusted `POST`/`PATCH` request body — shared by both
 * `app/api/admin/articles/route.ts` and `app/api/admin/articles/[id]/route.ts` rather than
 * duplicated, same "parse the untrusted payload in `lib/`" precedent as
 * `lib/attribution.ts`'s `parseAttributionCapture`. Returns `null` for anything
 * structurally wrong; the route handler maps that to a 400.
 */
export function parseArticleSaveInput(body: unknown): ArticleSaveInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const candidate = body as Record<string, unknown>;
  const cta = candidate.nextStepCta as Record<string, unknown> | undefined;

  if (
    typeof candidate.title !== "string" ||
    typeof candidate.excerpt !== "string" ||
    typeof candidate.metaTitle !== "string" ||
    typeof candidate.metaDescription !== "string" ||
    typeof candidate.authorId !== "number" ||
    !Array.isArray(candidate.body) ||
    typeof candidate.complianceChecked !== "boolean" ||
    !cta ||
    typeof cta.heading !== "string" ||
    typeof cta.body !== "string" ||
    typeof cta.label !== "string" ||
    typeof cta.href !== "string"
  ) {
    return null;
  }

  return {
    title: candidate.title,
    excerpt: candidate.excerpt,
    categoryId: typeof candidate.categoryId === "number" ? candidate.categoryId : null,
    authorId: candidate.authorId,
    metaTitle: candidate.metaTitle,
    metaDescription: candidate.metaDescription,
    previewImage: typeof candidate.previewImage === "string" ? candidate.previewImage : null,
    body: candidate.body as ArticleSaveInput["body"],
    nextStepCta: {
      heading: cta.heading,
      body: cta.body,
      label: cta.label,
      href: cta.href,
    },
    complianceChecked: candidate.complianceChecked,
  };
}

export interface AdminArticleListItem {
  id: number;
  title: string;
  authorName: string;
  categoryName: string | null;
  status: "published" | "draft";
  publishedAt: Date | null;
}

export interface ArticleFormOptions {
  authors: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}

export interface AdminArticleDetail {
  id: number;
  title: string;
  excerpt: string;
  categoryId: number | null;
  authorId: number;
  metaTitle: string;
  metaDescription: string;
  previewImage: string | null;
  body: ArticleBodyBlock[];
  nextStepCta: ArticleNextStepCta;
  publishedAt: Date | null;
  revisedAt: Date | null;
}

export interface ArticleSaveInput {
  title: string;
  excerpt: string;
  categoryId: number | null;
  authorId: number;
  metaTitle: string;
  metaDescription: string;
  previewImage: string | null;
  body: ArticleBodyBlock[];
  nextStepCta: ArticleNextStepCta;
  /** Required `true` only when `publish: true` — see `saveArticle`'s own validation. */
  complianceChecked: boolean;
}

/** `content-management-admin.md`'s Articles list — reused for both admin list and Server Component page data. */
export async function getArticleList(): Promise<AdminArticleListItem[]> {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, category: { select: { name: true } } },
  });

  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    authorName: article.author.name,
    categoryName: article.category?.name ?? null,
    status: article.publishedAt ? "published" : "draft",
    publishedAt: article.publishedAt,
  }));
}

/** Option lists for the editor's Author/Category selects — every author regardless of `published`, since assigning a byline is a valid step before that author's own profile is complete. */
export async function getArticleFormOptions(): Promise<ArticleFormOptions> {
  const [authors, categories] = await Promise.all([
    prisma.author.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { authors, categories };
}

export async function getArticleForEdit(id: number): Promise<AdminArticleDetail | null> {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return null;
  }

  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    categoryId: article.categoryId,
    authorId: article.authorId,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    previewImage: article.previewImage,
    body: article.body as unknown as ArticleBodyBlock[],
    nextStepCta: article.nextStepCta as unknown as ArticleNextStepCta,
    publishedAt: article.publishedAt,
    revisedAt: article.revisedAt,
  };
}

/**
 * Slug is derived from the title once, at creation, and never changes on a later retitle —
 * `insights-engine.md` treats a published article's URL as a stable, shareable/indexable
 * thing (OG previews, search-engine links), so silently moving it on every title edit would
 * break both. A slug collision (two articles that happen to slugify the same) appends a
 * numeric suffix rather than rejecting the save — unlike `Category.slug` (partner-authored,
 * partner-visible, worth surfacing a collision inline), an article's slug is an incidental
 * side effect of its title, not content a partner is directly naming.
 */
async function generateUniqueArticleSlug(title: string): Promise<string> {
  const base = slugify(title) || "article";
  let candidate = base;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function validateCommonFields(input: ArticleSaveInput): void {
  if (!input.title.trim()) {
    throw new ArticleValidationError("Title is required.");
  }
  if (!input.excerpt.trim()) {
    throw new ArticleValidationError("Excerpt is required.");
  }
  if (!input.metaTitle.trim()) {
    throw new ArticleValidationError("Meta title is required.");
  }
  if (!input.metaDescription.trim()) {
    throw new ArticleValidationError("Meta description is required.");
  }
  if (!Number.isInteger(input.authorId)) {
    throw new ArticleValidationError("An author is required.");
  }
  const cta = input.nextStepCta;
  if (!cta.heading.trim() || !cta.body.trim() || !cta.label.trim() || !cta.href.trim()) {
    throw new ArticleValidationError(
      'Every next-step field (heading, body, button label, and link) is required — every article must end with a specific next step, never a generic "contact us" (FR-3.4).',
    );
  }
}

/**
 * `content-management-admin.md`'s publish gate (FR-5.4, `insights-engine.md`'s OG-image
 * requirement): a preview image and an explicit 10.05-compliance confirmation, checked here —
 * not only via the editor's disabled Publish button — so a direct API call can't bypass
 * either rule.
 */
function validatePublishGate(input: ArticleSaveInput): void {
  if (!input.previewImage) {
    throw new ArticleValidationError(
      "A preview image is required before this article can be published.",
    );
  }
  if (!input.complianceChecked) {
    throw new ArticleValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before publishing.",
    );
  }
}

/**
 * Creates a new `article` row. `publish: true` sets `publishedAt` immediately (a brand-new
 * article can be published on its very first save, not forced through an intermediate draft
 * step); `publish: false` leaves it `null`.
 */
export async function createArticle(
  input: ArticleSaveInput,
  options: { publish: boolean },
): Promise<{ id: number }> {
  validateCommonFields(input);
  if (options.publish) {
    validatePublishGate(input);
  }

  const slug = await generateUniqueArticleSlug(input.title);
  const article = await prisma.article.create({
    data: {
      slug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      categoryId: input.categoryId,
      authorId: input.authorId,
      metaTitle: input.metaTitle.trim(),
      metaDescription: input.metaDescription.trim(),
      previewImage: input.previewImage,
      body: input.body as unknown as Prisma.InputJsonValue,
      nextStepCta: input.nextStepCta as unknown as Prisma.InputJsonValue,
      publishedAt: options.publish ? new Date() : null,
    },
  });

  return { id: article.id };
}

/**
 * Updates an existing `article` row. `publish: true` on an article with no `publishedAt` yet
 * sets it (first publish); on an already-published article it instead sets `revisedAt` —
 * `prisma/schema.prisma`'s own `Article.revisedAt` doc-comment ("content substantively
 * revised after first publish... populated by the admin publish flow (Milestone 7)"), this
 * being that flow. `publish: false` ("Save draft") never touches either timestamp — it only
 * saves field edits, so it can never accidentally unpublish an already-live article; this
 * task builds no separate unpublish action (not named in any acceptance criterion here).
 */
export async function updateArticle(
  id: number,
  input: ArticleSaveInput,
  options: { publish: boolean },
): Promise<{ id: number }> {
  validateCommonFields(input);
  if (options.publish) {
    validatePublishGate(input);
  }

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { publishedAt: true },
  });
  if (!existing) {
    throw new ArticleValidationError("Article not found.");
  }

  const publishedAt = options.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt;
  const revisedAt = options.publish && existing.publishedAt ? new Date() : undefined;

  const article = await prisma.article.update({
    where: { id },
    data: {
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      categoryId: input.categoryId,
      authorId: input.authorId,
      metaTitle: input.metaTitle.trim(),
      metaDescription: input.metaDescription.trim(),
      previewImage: input.previewImage,
      body: input.body as unknown as Prisma.InputJsonValue,
      nextStepCta: input.nextStepCta as unknown as Prisma.InputJsonValue,
      publishedAt,
      ...(revisedAt ? { revisedAt } : {}),
    },
  });

  return { id: article.id };
}
