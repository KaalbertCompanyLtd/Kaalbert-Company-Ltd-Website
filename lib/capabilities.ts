import { prisma } from "@/lib/prisma";

/** All 8 `capability` rows, in the mockup's defined display order. */
export async function getCapabilities() {
  return prisma.capability.findMany({ orderBy: { order: "asc" } });
}

/**
 * The Advisory Retainer is a singleton (same findFirst-by-fixed-id pattern as
 * `lib/home.ts`'s `getHomePageContent`). Throws if missing — a missing singleton row is a
 * seed/migration bug, not a real "no content yet" state.
 */
export async function getAdvisoryRetainer() {
  const retainer = await prisma.advisoryRetainer.findFirst({ orderBy: { id: "asc" } });
  if (!retainer) {
    throw new Error("advisory_retainer has no row — run `npm run db:seed` (see prisma/seed.ts).");
  }
  return retainer;
}

/** "GHS 1,500 / month" — the retainer panel's fee format. */
export function formatRetainerFee(
  feeAmount: number,
  feeCurrency: string,
  billingPeriod: string,
): string {
  return `${feeCurrency} ${feeAmount.toLocaleString("en-US")} / ${billingPeriod}`;
}
