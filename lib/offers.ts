import { prisma } from "@/lib/prisma";

/** Matches prisma/schema.prisma's `Offer.methodStages` Json shape. */
export interface MethodStage {
  title: string;
  description: string;
}

/** Matches prisma/schema.prisma's `Offer.faqs` Json shape. */
export interface OfferFaq {
  question: string;
  answer: string;
}

/**
 * Resolves one core offer page's full data, including its tiers (empty array for a
 * single-tier offer). Returns `null` for a slug that doesn't exist — the caller (`app/
 * offers/[slug]/page.tsx`) is responsible for turning that into a standard 404
 * (`core-offer-pages.md`'s edge case: never a silently-generated thin page).
 */
export async function getOfferBySlug(slug: string) {
  return prisma.offer.findUnique({
    where: { slug },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * Live replacement for `components/site-header.tsx`'s previously hard-coded `CORE_OFFERS`
 * fee hints (T1.5's own explicit note, closed out here per T2.2's architecture constraints).
 */
export async function getOfferNavLinks(): Promise<
  { name: string; href: string; feeHint: string }[]
> {
  const offers = await prisma.offer.findMany({ orderBy: { id: "asc" } });
  return offers.map((offer) => ({
    name: offer.name,
    href: `/offers/${offer.slug}`,
    feeHint: formatFeeHint(offer.feeAmountMin, offer.feeCurrency),
  }));
}

/** "From GHS 1,000" — the nav dropdown/mobile-menu and home-card fee hint format. */
export function formatFeeHint(feeAmountMin: number, feeCurrency: string): string {
  return `From ${feeCurrency} ${feeAmountMin.toLocaleString("en-US")}`;
}

/** "GHS 3,000 – 6,500" — the fee-panel band format (core-offer-pages.md: always a range). */
export function formatFeeBand(
  feeAmountMin: number,
  feeAmountMax: number,
  feeCurrency: string,
): string {
  return `${feeCurrency} ${feeAmountMin.toLocaleString("en-US")} – ${feeAmountMax.toLocaleString("en-US")}`;
}
