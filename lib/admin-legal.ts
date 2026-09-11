import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LEGAL_PAGE_SLUGS } from "@/lib/legal";
import type { LegalPageBlock } from "@/lib/legal";

export class LegalValidationError extends Error {}

export interface LegalPageSummary {
  slug: string;
  title: string;
  isPlaceholder: boolean;
  lastRevisedAt: Date | null;
}

export interface LegalPageEditData {
  slug: string;
  title: string;
  metaDescription: string;
  isPlaceholder: boolean;
  lastRevisedAt: Date | null;
  body: LegalPageBlock[];
}

export interface LegalPageSaveInput {
  title: string;
  metaDescription: string;
  isPlaceholder: boolean;
  body: LegalPageBlock[];
}

export interface FooterContentData {
  scopeOfPracticeStatement: string;
  companyRegistrationDetails: string | null;
}

/**
 * The "second panel" screen (`content-management-admin.md`'s Pages content area, T7.3's own
 * "Build" line) — all four fixed legal-page rows plus the shared footer_content singleton,
 * together on one screen, reached from the main Pages screen's inline link, not a separate
 * sidebar item (CLAUDE.md's "one nav entry, second screen via inline link" pattern, the same
 * one T7.2 already used for Categories reached from Articles).
 */
export async function getLegalAdminData(): Promise<{
  legalPages: LegalPageSummary[];
  footerContent: FooterContentData;
}> {
  const [legalPages, footerContent] = await Promise.all([
    prisma.legalPage.findMany({
      where: { slug: { in: [...LEGAL_PAGE_SLUGS] } },
      select: { slug: true, title: true, isPlaceholder: true, lastRevisedAt: true },
    }),
    prisma.footerContent.findFirstOrThrow(),
  ]);

  const bySlug = new Map(legalPages.map((page) => [page.slug, page]));
  const ordered = LEGAL_PAGE_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (page): page is (typeof legalPages)[number] => Boolean(page),
  );

  return {
    legalPages: ordered,
    footerContent: {
      scopeOfPracticeStatement: footerContent.scopeOfPracticeStatement,
      companyRegistrationDetails: footerContent.companyRegistrationDetails,
    },
  };
}

export async function getLegalPageForEdit(slug: string): Promise<LegalPageEditData | null> {
  if (!LEGAL_PAGE_SLUGS.includes(slug as (typeof LEGAL_PAGE_SLUGS)[number])) {
    return null;
  }
  const page = await prisma.legalPage.findUnique({ where: { slug } });
  if (!page) {
    return null;
  }

  return {
    slug: page.slug,
    title: page.title,
    metaDescription: page.metaDescription,
    isPlaceholder: page.isPlaceholder,
    lastRevisedAt: page.lastRevisedAt,
    body: page.body as unknown as LegalPageBlock[],
  };
}

/**
 * No 10.05-compliance checkbox here, unlike T7.3's marketing-page (`updateCapabilitiesPage`/
 * `updateOurMethodPage`) and T7.2's article saves — that gate is specifically FR-5.4's
 * Positioning and Claims review for promotional copy; legal text goes through a different
 * real review process the `isPlaceholder`/"Draft — pending legal review" marker (T2.7)
 * already gates. `lastRevisedAt` is set to now only when a save leaves the page NOT a
 * placeholder — the field means "genuinely legally reviewed," per `lib/legal.ts`'s
 * `formatRevisedDate` doc-comment ("once the firm has actually revised the page"), not
 * "last edited"; a save that keeps `isPlaceholder: true` hasn't cleared that bar yet.
 */
export async function updateLegalPage(slug: string, input: LegalPageSaveInput): Promise<void> {
  if (!LEGAL_PAGE_SLUGS.includes(slug as (typeof LEGAL_PAGE_SLUGS)[number])) {
    throw new LegalValidationError("Not a recognised legal page.");
  }
  if (!input.title.trim() || !input.metaDescription.trim()) {
    throw new LegalValidationError("Title and meta description are required.");
  }
  if (input.body.length === 0) {
    throw new LegalValidationError("At least one content block is required.");
  }

  await prisma.legalPage.update({
    where: { slug },
    data: {
      title: input.title.trim(),
      metaDescription: input.metaDescription.trim(),
      isPlaceholder: input.isPlaceholder,
      body: input.body as unknown as Prisma.InputJsonValue,
      ...(input.isPlaceholder ? {} : { lastRevisedAt: new Date() }),
    },
  });
}

export async function updateFooterContent(input: FooterContentData): Promise<void> {
  if (!input.scopeOfPracticeStatement.trim()) {
    throw new LegalValidationError("The scope-of-practice statement is required.");
  }

  const existing = await prisma.footerContent.findFirstOrThrow();
  await prisma.footerContent.update({
    where: { id: existing.id },
    data: {
      scopeOfPracticeStatement: input.scopeOfPracticeStatement.trim(),
      companyRegistrationDetails: input.companyRegistrationDetails?.trim() || null,
    },
  });
}
