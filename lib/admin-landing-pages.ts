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
 * `landing-page-template.md`'s FR-4.3 acceptance bar: a non-technical partner creates a new
 * `/lp/` instance without vendor involvement. Create-only — this task's own Interfaces line
 * names `POST /api/admin/landing-pages` alone, no `PATCH`; editing an already-live campaign
 * page isn't this task's scope. The 10.05-compliance checkbox gates this the same way it
 * gates every other promotional-copy save in this admin (`content-management-admin.md`'s
 * FR-5.4) — a landing page is paid-ad destination copy, the literal case that rule names.
 * `isPlaceholder` is never set here (always created `false`): unlike the three seeded
 * mockup-derived instances, a landing page a partner builds through this form is real content
 * they wrote and signed off via the compliance checkbox, not illustrative placeholder text.
 */
export async function createLandingPage(input: LandingPageCreateInput): Promise<{ slug: string }> {
  if (!input.complianceChecked) {
    throw new LandingPageValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }

  const slug = slugify(input.slug);
  if (!slug) {
    throw new LandingPageValidationError("A URL slug is required.");
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

  const existing = await prisma.landingPage.findUnique({ where: { slug } });
  if (existing) {
    throw new LandingPageValidationError(
      `A landing page with the URL slug "${slug}" already exists — choose a different one.`,
    );
  }

  await prisma.landingPage.create({
    data: {
      slug,
      kicker,
      headline,
      openingParagraph,
      bodyContent: bodyContent as unknown as Prisma.InputJsonValue,
      ctaLabel,
      ctaHref,
      downloadFileUrl: input.downloadFileUrl,
      campaignReference,
      metaTitle,
      metaDescription,
      isPlaceholder: false,
    },
  });

  return { slug };
}
