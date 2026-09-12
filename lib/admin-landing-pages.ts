import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/categories";
import type { LandingPageBodyBlock } from "@/lib/landing-pages";

export class LandingPageValidationError extends Error {}

export interface LandingPageSummary {
  slug: string;
  headline: string;
  campaignReference: string;
  updatedAt: Date;
}

/** `content-management-admin.md`'s "Landing pages list" screen (#32, `AdminDataTable`). */
export async function getLandingPageList(): Promise<LandingPageSummary[]> {
  return prisma.landingPage.findMany({
    orderBy: { id: "asc" },
    select: { slug: true, headline: true, campaignReference: true, updatedAt: true },
  });
}

export interface LandingPageCreateInput {
  /** Raw partner-entered value — normalized via `slugify()` before the uniqueness check. */
  slug: string;
  kicker: string;
  headline: string;
  openingParagraph: string;
  bodyContent: LandingPageBodyBlock[];
  ctaLabel: string;
  ctaHref: string;
  /** Optional — the checklist/download file, null when this campaign's CTA is an ordinary link. */
  downloadFileUrl: string | null;
  campaignReference: string;
  metaTitle: string;
  metaDescription: string;
  complianceChecked: boolean;
}

/**
 * Every editable field except `slug` — deliberately excluded, not merely unused: see
 * `updateLandingPage`'s own doc-comment for why the URL is fixed once a page is created.
 */
export type LandingPageUpdateInput = Omit<LandingPageCreateInput, "slug">;

export interface LandingPageDetail extends LandingPageUpdateInput {
  slug: string;
}

function parseBodyBlockInput(row: Record<string, unknown>): LandingPageBodyBlock | null {
  switch (row.kind) {
    case "heading":
    case "paragraph":
      return typeof row.text === "string" ? { kind: row.kind, text: row.text } : null;
    case "list": {
      if (!Array.isArray(row.items) || row.items.some((v) => typeof v !== "string")) return null;
      return { kind: "list", items: row.items as string[] };
    }
    case "stats": {
      if (!Array.isArray(row.items)) return null;
      const items: { value: string; label: string }[] = [];
      for (const item of row.items) {
        const i = item as Record<string, unknown>;
        if (typeof i.value !== "string" || typeof i.label !== "string") return null;
        items.push({ value: i.value, label: i.label });
      }
      return { kind: "stats", items };
    }
    case "steps": {
      if (!Array.isArray(row.items)) return null;
      const items: { title: string; description: string }[] = [];
      for (const item of row.items) {
        const i = item as Record<string, unknown>;
        if (typeof i.title !== "string" || typeof i.description !== "string") return null;
        items.push({ title: i.title, description: i.description });
      }
      return { kind: "steps", items };
    }
    default:
      return null;
  }
}

/**
 * Every field `LandingPageCreateInput`/`LandingPageUpdateInput` share (everything except
 * `slug`, which only a create request carries — the create route reads it separately, the
 * update route takes it from the URL). Shared between `POST /api/admin/landing-pages` and
 * `PATCH /api/admin/landing-pages/[slug]`, same convention as `lib/articles.ts`'s
 * `parseArticleSaveInput` being imported by both its create and edit routes.
 */
export function parseLandingPageContentInput(body: unknown): LandingPageUpdateInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;

  if (
    typeof c.kicker !== "string" ||
    typeof c.headline !== "string" ||
    typeof c.openingParagraph !== "string" ||
    !Array.isArray(c.bodyContent) ||
    typeof c.ctaLabel !== "string" ||
    typeof c.ctaHref !== "string" ||
    (c.downloadFileUrl !== null && typeof c.downloadFileUrl !== "string") ||
    typeof c.campaignReference !== "string" ||
    typeof c.metaTitle !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.complianceChecked !== "boolean"
  ) {
    return null;
  }

  const bodyContent: LandingPageBodyBlock[] = [];
  for (const row of c.bodyContent) {
    const block = parseBodyBlockInput(row as Record<string, unknown>);
    if (!block) return null;
    bodyContent.push(block);
  }

  return {
    kicker: c.kicker,
    headline: c.headline,
    openingParagraph: c.openingParagraph,
    bodyContent,
    ctaLabel: c.ctaLabel,
    ctaHref: c.ctaHref,
    downloadFileUrl: c.downloadFileUrl as string | null,
    campaignReference: c.campaignReference,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    complianceChecked: c.complianceChecked,
  };
}

function requireNonBlank(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new LandingPageValidationError(message);
  }
  return trimmed;
}

/**
 * `lib/landing-pages.ts`'s `LandingPageBodyBlock` — a `kind`-discriminated union, same
 * convention as `LegalPageBlock`/`ArticleBodyBlock`. Trims every text field and rejects a
 * block whose required content is blank, same rigor `updateOffer`'s FAQ/method-stage
 * validation already applies to a different ordered-block shape.
 */
function validateBodyBlock(block: LandingPageBodyBlock): LandingPageBodyBlock {
  switch (block.kind) {
    case "heading":
    case "paragraph":
      return { kind: block.kind, text: requireNonBlank(block.text, "Every block needs text.") };
    case "list":
      if (block.items.length === 0) {
        throw new LandingPageValidationError("A list block needs at least one item.");
      }
      return {
        kind: "list",
        items: block.items.map((item) => requireNonBlank(item, "A list item can't be blank.")),
      };
    case "stats":
      if (block.items.length === 0) {
        throw new LandingPageValidationError("A stats block needs at least one item.");
      }
      return {
        kind: "stats",
        items: block.items.map((item) => ({
          value: requireNonBlank(item.value, "Every stat needs a value."),
          label: requireNonBlank(item.label, "Every stat needs a label."),
        })),
      };
    case "steps":
      if (block.items.length === 0) {
        throw new LandingPageValidationError("A steps block needs at least one item.");
      }
      return {
        kind: "steps",
        items: block.items.map((item) => ({
          title: requireNonBlank(item.title, "Every step needs a title."),
          description: requireNonBlank(item.description, "Every step needs a description."),
        })),
      };
  }
}

/**
 * Every non-slug field, validated the same way for both a create and an edit save — the
 * 10.05-compliance checkbox gates both identically (`content-management-admin.md`'s FR-5.4:
 * a landing page is paid-ad destination copy, the literal case that rule names, and editing
 * it is still a promotional-copy save).
 */
function validateLandingPageContent(input: LandingPageUpdateInput) {
  if (!input.complianceChecked) {
    throw new LandingPageValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }

  const kicker = requireNonBlank(input.kicker, "Kicker is required.");
  const headline = requireNonBlank(input.headline, "Headline is required.");
  const openingParagraph = requireNonBlank(
    input.openingParagraph,
    "Opening paragraph is required.",
  );
  const ctaLabel = requireNonBlank(input.ctaLabel, "Call-to-action label is required.");
  const ctaHref = requireNonBlank(input.ctaHref, "Call-to-action link is required.");
  const campaignReference = requireNonBlank(
    input.campaignReference,
    "Campaign reference is required.",
  );
  const metaTitle = requireNonBlank(input.metaTitle, "Meta title is required.");
  const metaDescription = requireNonBlank(input.metaDescription, "Meta description is required.");

  if (input.bodyContent.length === 0) {
    throw new LandingPageValidationError("At least one body content block is required.");
  }
  const bodyContent = input.bodyContent.map(validateBodyBlock);

  return {
    kicker,
    headline,
    openingParagraph,
    bodyContent,
    ctaLabel,
    ctaHref,
    downloadFileUrl: input.downloadFileUrl,
    campaignReference,
    metaTitle,
    metaDescription,
  };
}

/**
 * `landing-page-template.md`'s FR-4.3 acceptance bar: a non-technical partner creates a new
 * `/lp/` instance without vendor involvement. `isPlaceholder` is never set here (always
 * created `false`): unlike the three seeded mockup-derived instances, a landing page a
 * partner builds through this form is real content they wrote and signed off via the
 * compliance checkbox, not illustrative placeholder text.
 */
export async function createLandingPage(input: LandingPageCreateInput): Promise<{ slug: string }> {
  const content = validateLandingPageContent(input);

  const slug = slugify(input.slug);
  if (!slug) {
    throw new LandingPageValidationError("A URL slug is required.");
  }

  const existing = await prisma.landingPage.findUnique({ where: { slug } });
  if (existing) {
    throw new LandingPageValidationError(
      `A landing page with the URL slug "${slug}" already exists — choose a different one.`,
    );
  }

  await prisma.landingPage.create({
    data: {
      slug,
      ...content,
      bodyContent: content.bodyContent as unknown as Prisma.InputJsonValue,
      isPlaceholder: false,
    },
  });

  return { slug };
}

/**
 * `content-management-admin.md`'s Landing Pages editor screen — returns `null` for a slug
 * with no matching row, same `null`-means-404 contract as `lib/landing-pages.ts`'s own
 * public-facing `getLandingPageBySlug`.
 */
export async function getLandingPageForEdit(slug: string): Promise<LandingPageDetail | null> {
  const landingPage = await prisma.landingPage.findUnique({ where: { slug } });
  if (!landingPage) {
    return null;
  }

  return {
    slug: landingPage.slug,
    kicker: landingPage.kicker,
    headline: landingPage.headline,
    openingParagraph: landingPage.openingParagraph,
    bodyContent: landingPage.bodyContent as unknown as LandingPageBodyBlock[],
    ctaLabel: landingPage.ctaLabel,
    ctaHref: landingPage.ctaHref,
    downloadFileUrl: landingPage.downloadFileUrl,
    campaignReference: landingPage.campaignReference,
    metaTitle: landingPage.metaTitle,
    metaDescription: landingPage.metaDescription,
    complianceChecked: false,
  };
}

/**
 * Edits an already-live campaign page — added session 60, correcting T7.5's original
 * create-only scope (`memory/decision-log.md`, session 48): that decision traced back to
 * `landing-page-template.md`'s Interfaces line naming only `POST`, which in turn just
 * reflected FR-4.3's literal acceptance bar ("a partner can create a new instance") — nobody
 * ever asked for editing to be *excluded*, and a live campaign needing a copy fix or a
 * corrected CTA link is the ordinary case, not the exception. The URL `slug` is deliberately
 * still not editable here — same reasoning `lib/articles.ts`'s `generateUniqueArticleSlug`
 * doc-comment already gives for an article's slug: it's the actual destination printed on an
 * ad, a QR code, or campaign copy, so changing it after launch would silently break whatever
 * already points at it. A partner who genuinely needs a new URL creates a new landing page
 * instead. `isPlaceholder` is set to `false` on every save, same as `createLandingPage` — an
 * edit a partner makes and signs off via the compliance checkbox is real content, even if the
 * row started as one of the three seeded, mockup-derived placeholder instances.
 */
export async function updateLandingPage(
  slug: string,
  input: LandingPageUpdateInput,
): Promise<void> {
  const content = validateLandingPageContent(input);

  const existing = await prisma.landingPage.findUnique({ where: { slug } });
  if (!existing) {
    throw new LandingPageValidationError(`No landing page found with the URL slug "${slug}".`);
  }

  await prisma.landingPage.update({
    where: { slug },
    data: {
      ...content,
      bodyContent: content.bodyContent as unknown as Prisma.InputJsonValue,
      isPlaceholder: false,
    },
  });
}
