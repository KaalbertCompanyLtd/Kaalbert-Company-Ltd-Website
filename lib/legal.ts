import { prisma } from "@/lib/prisma";

/**
 * Matches `prisma/schema.prisma`'s `LegalPage.body` Json shape — see that model's
 * doc-comment for why an ordered block list, not one opaque string, was chosen. `variant:
 * "muted"` on a `prose` block reproduces `ui/mockups/e-legal/scope-of-practice.html`'s one
 * smaller/muted paragraph (the "does not act as company secretary..." aside) without a fifth
 * block kind.
 */
export type LegalPageBlock =
  | { kind: "statement"; text: string }
  | { kind: "prose"; heading?: string; text: string; variant?: "muted" }
  | { kind: "pending"; heading: string; text: string }
  | { kind: "table"; heading?: string; headers: string[]; rows: string[][] };

/** The four fixed slugs `legal-and-compliance-pages.md` names — no others are ever created. */
export const LEGAL_PAGE_SLUGS = [
  "privacy-notice",
  "cookie-notice",
  "terms-of-use",
  "scope-of-practice",
] as const;

/**
 * Returns `null` for a slug outside the four fixed ones — the caller (`app/legal/[slug]/
 * page.tsx`) turns that into a standard 404, same pattern as `lib/offers.ts`'s
 * `getOfferBySlug`.
 */
export async function getLegalPageBySlug(slug: string) {
  return prisma.legalPage.findUnique({ where: { slug } });
}

/**
 * The `footer_content` singleton row — same `findFirst` pattern as `lib/site-settings.ts`'s
 * `getSiteSettings`. Read by every public `SiteFooter` call site (T7.8) to source
 * `ScopeOfPracticeNote`'s statement/company-registration-details live, instead of that
 * component's own hard-coded fallback copy (memory/technical-debt.md → "SiteFooter/
 * ScopeOfPracticeNote not wired into footer_content").
 */
export async function getFooterContent() {
  const content = await prisma.footerContent.findFirst();
  if (!content) {
    throw new Error(`footer_content has no row — run \`npm run db:seed\` (see prisma/seed.ts).`);
  }
  return content;
}

/**
 * "Last revised 26 August 2026" once the firm has actually revised the page (`scope-of-
 * practice`'s real, non-placeholder row), or the mockups' own "Pending first publication"
 * copy while `lastRevisedAt` is null (every page still in draft).
 */
export function formatRevisedDate(lastRevisedAt: Date | null): string {
  if (!lastRevisedAt) {
    return "Pending first publication — see note below";
  }
  return `Last revised ${lastRevisedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}
