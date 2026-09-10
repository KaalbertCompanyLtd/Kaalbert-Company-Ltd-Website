import { prisma } from "@/lib/prisma";

/**
 * Matches `prisma/schema.prisma`'s `LandingPage.bodyContent` `Json` shape — same
 * `kind`-discriminated-union convention as `lib/legal.ts`'s `LegalPageBlock` and
 * `lib/insights.ts`'s `ArticleBodyBlock`. Covers exactly the block kinds the three accepted
 * mockups actually use: `landing-business-health-check.html`'s `.proof-row` (`stats`),
 * `landing-financial-clarity-pack.html`'s `.stage-row` (`steps`),
 * `landing-funding-readiness-checklist.html`'s `.whats-inside` list (`heading` + `list`), and
 * the reassurance line every mockup's repeat-CTA section carries (`paragraph`).
 */
export type LandingPageBodyBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "stats"; items: { value: string; label: string }[] }
  | { kind: "steps"; items: { title: string; description: string }[] };

/**
 * Returns `null` for a slug with no matching row — the caller (`app/lp/[slug]/page.tsx`)
 * turns that into a standard 404, same `null`-means-404 contract as `lib/offers.ts`'s
 * `getOfferBySlug` / `lib/legal.ts`'s `getLegalPageBySlug`.
 */
export async function getLandingPageBySlug(slug: string) {
  return prisma.landingPage.findUnique({ where: { slug } });
}
