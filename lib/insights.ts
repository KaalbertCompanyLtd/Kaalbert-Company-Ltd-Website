import { prisma } from "@/lib/prisma";

/**
 * `ui/mockups/b-insights/insights-index.html`'s own `PAGE_SIZE` — kept identical so the grid
 * behaves the same once real pagination replaces the mockup's client-only slice.
 */
export const INSIGHTS_PAGE_SIZE = 6;

export interface InsightsCategory {
  name: string;
  slug: string;
}

export interface InsightsArticleCard {
  slug: string;
  title: string;
  excerpt: string;
  previewImage: string | null;
  category: InsightsCategory | null;
  authorName: string;
  authorPracticeArea: string;
}

export interface InsightsIndexQuery {
  /** A `category.slug`, or `undefined` for "All". An unknown slug simply matches nothing. */
  category?: string;
  /** Free-text search over title/excerpt, or `undefined`/empty for none. */
  q?: string;
  /** 1-based. Out-of-range values are clamped, never thrown. */
  page?: number;
}

export interface InsightsIndexResult {
  articles: InsightsArticleCard[];
  categories: InsightsCategory[];
  /** Echoes back the query actually applied, after clamping — e.g. `page` after clamping. */
  page: number;
  totalPages: number;
  totalCount: number;
}

/**
 * All admin-manageable categories, for the index's filter row (`content-management-admin.md`:
 * a partner creates/renames/retires these directly — this always reflects the live set, never
 * a developer-fixed list). Ordered by name since there's no admin-assigned display order for
 * categories, unlike `Capability.order`/`MethodStage.order`.
 */
export async function getInsightsCategories(): Promise<InsightsCategory[]> {
  return prisma.category.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/**
 * The index's filtered/searched/paginated article list. `publishedAt: { not: null }` is the
 * only visibility check anywhere in this query (T4.1: `published_at` is the sole source of
 * truth) — a draft is excluded here the same way it will be everywhere else that reads this
 * table (T4.3's article route, Home's featured section). `category`/`q` are independent
 * filters, combined with AND, matching the mockup's own `getMatches()` behaviour. An unknown
 * `category` slug resolves to zero matches (the documented empty state), not a thrown error —
 * a mistyped or stale query param is a normal, recoverable visitor state, not a 404-worthy one
 * the way a draft article's own `/insights/[slug]` is (T4.3's different, stricter rule).
 */
export async function getInsightsIndex({
  category,
  q,
  page = 1,
}: InsightsIndexQuery): Promise<InsightsIndexResult> {
  const trimmedQuery = q?.trim() ?? "";

  const where = {
    publishedAt: { not: null },
    ...(category ? { category: { slug: category } } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" as const } },
            { excerpt: { contains: trimmedQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalCount, categories] = await Promise.all([
    prisma.article.count({ where }),
    getInsightsCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / INSIGHTS_PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const rows = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (clampedPage - 1) * INSIGHTS_PAGE_SIZE,
    take: INSIGHTS_PAGE_SIZE,
    include: { author: true, category: true },
  });

  const articles = rows.map(shapeArticleCard);

  return { articles, categories, page: clampedPage, totalPages, totalCount };
}

export interface ArticleCardRow {
  slug: string;
  title: string;
  excerpt: string;
  previewImage: string | null;
  category: { name: string; slug: string } | null;
  author: { name: string; practiceArea: string };
}

/**
 * Shared row → `InsightsArticleCard` shaping, used by the index, related articles, and (T2.1
 * follow-up, session 27) `lib/home.ts`'s featured-Insights section — exported so Home's own
 * query can produce a card in exactly the same shape the shared `ArticleCard` component
 * (`components/insights-article-card.tsx`) expects, rather than a second, drifting shape.
 */
export function shapeArticleCard(row: ArticleCardRow): InsightsArticleCard {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    previewImage: row.previewImage,
    category: row.category ? { name: row.category.name, slug: row.category.slug } : null,
    authorName: row.author.name,
    authorPracticeArea: row.author.practiceArea,
  };
}

const RELATED_ARTICLES_COUNT = 3;

/**
 * insights-engine.md's edge case: an article's related articles are other published articles
 * sharing its category; an article with no category (or a category too thin to fill 3 slots)
 * falls back to most-recently-published — "an article with no assigned category ... included
 * in search and 'related articles'" is only satisfiable if this fallback path is real, not
 * skipped for the no-category case.
 */
export async function getRelatedArticles(
  article: { id: number; categoryId: number | null },
  limit: number = RELATED_ARTICLES_COUNT,
): Promise<InsightsArticleCard[]> {
  const sameCategory = article.categoryId
    ? await prisma.article.findMany({
        where: {
          publishedAt: { not: null },
          categoryId: article.categoryId,
          id: { not: article.id },
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        include: { author: true, category: true },
      })
    : [];

  const remaining = limit - sameCategory.length;
  const fallback =
    remaining > 0
      ? await prisma.article.findMany({
          where: {
            publishedAt: { not: null },
            id: { notIn: [article.id, ...sameCategory.map((row) => row.id)] },
          },
          orderBy: { publishedAt: "desc" },
          take: remaining,
          include: { author: true, category: true },
        })
      : [];

  return [...sameCategory, ...fallback].map(shapeArticleCard);
}

/**
 * Matches `prisma/schema.prisma`'s `Article.body` `Json` shape — defined here at T4.3 (the
 * first task that actually renders it), same "no admin editor yet to justify full relational
 * modelling" precedent as `lib/legal.ts`'s `LegalPageBlock`, whose `kind`-discriminated-union
 * convention this mirrors. Covers exactly the block kinds the accepted mockup
 * (`ui/mockups/b-insights/insight-owner-drawings.html`) actually uses: paragraphs, `<h2>`
 * subheadings, a pull-quote, a bulleted list, and a data table.
 */
export type ArticleBodyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

/**
 * Matches `Article.nextStepCta`'s `Json` shape, revised at T4.3 from T4.1's original
 * `{label, href}` — see `prisma/schema.prisma`'s `Article` doc-comment and
 * `memory/decision-log.md` (session 26) for why.
 */
export interface ArticleNextStepCta {
  heading: string;
  body: string;
  label: string;
  href: string;
}

export interface ArticleResourceItem {
  id: number;
  label: string;
  fileUrl: string;
}

export interface ArticleDetail {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: ArticleBodyBlock[];
  previewImage: string | null;
  metaTitle: string;
  metaDescription: string;
  publishedAt: Date;
  revisedAt: Date | null;
  nextStepCta: ArticleNextStepCta;
  category: InsightsCategory | null;
  categoryId: number | null;
  author: {
    name: string;
    photoUrl: string | null;
    title: string;
    practiceArea: string;
    bio: string;
  };
  resources: ArticleResourceItem[];
}

/**
 * Returns `null` both when no row matches `slug` *and* when a row matches but is a draft
 * (`publishedAt: null`) — T4.1's rule that a draft 404s for a visitor exactly as if it never
 * existed, same `null`-means-404 contract as `lib/offers.ts`'s `getOfferBySlug` /
 * `lib/legal.ts`'s `getLegalPageBySlug`. The caller (`app/insights/[slug]/page.tsx`) turns
 * `null` into `notFound()`.
 */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      resources: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!article || !article.publishedAt) {
    return null;
  }

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body as unknown as ArticleBodyBlock[],
    previewImage: article.previewImage,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    publishedAt: article.publishedAt,
    revisedAt: article.revisedAt,
    nextStepCta: article.nextStepCta as unknown as ArticleNextStepCta,
    category: article.category
      ? { name: article.category.name, slug: article.category.slug }
      : null,
    categoryId: article.categoryId,
    author: {
      name: article.author.name,
      photoUrl: article.author.photoUrl,
      title: article.author.title,
      practiceArea: article.author.practiceArea,
      bio: article.author.bio,
    },
    resources: article.resources.map((resource) => ({
      id: resource.id,
      label: resource.label,
      fileUrl: resource.fileUrl,
    })),
  };
}

export interface ArticleShareLinks {
  whatsapp: string;
  linkedin: string;
  facebook: string;
}

/**
 * Deliberately not `components/whatsapp-link-button.tsx` — that component fires the fixed
 * `whatsapp_opened` conversion event for a visitor opening a conversation with the firm, and
 * targets the firm's own number. Sharing an article link is a different action (no target
 * number, an open `wa.me/?text=` share) with no measurement event of its own — subscribing to
 * Insights is already documented as deliberately *not* one of Document 13.03's six fixed
 * events (`insights-engine.md`'s own business rules); inventing a share event isn't this
 * task's call either.
 */
export function buildArticleShareLinks(article: { title: string; url: string }): ArticleShareLinks {
  const shareText = `${article.title} — a Kaalbert & Company Insight`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${article.url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}`,
  };
}

/**
 * insights-engine.md's edge case: "a downloadable resource file is removed after an article
 * referencing it is already published: the article's download link must fail gracefully with
 * a clear message, not a broken link with no explanation." No object storage (Cloudflare R2,
 * ADR 0004) is provisioned yet to answer this more cheaply (e.g. a presigned-URL existence
 * check) — this does a live `HEAD` request against the file's own URL at render time as a
 * pragmatic interim check. Treats a network error/timeout the same as a non-2xx response
 * (unreachable either way from the visitor's perspective) rather than distinguishing them.
 */
export async function isResourceReachable(fileUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(fileUrl, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
