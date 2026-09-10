import { prisma } from "@/lib/prisma";

const RETENTION_DAYS = 90;

/**
 * The 90-day `attribution` retention job (T5.4, `measurement-and-attribution.md`'s edge case
 * — the retention window itself was decided in `docs/tasks/05-landing-and-measurement.md`'s
 * own opening note: 90 days, matching GA4's/Meta's own standard attribution lookback). Ages
 * off `firstSeen`, not `createdAt` — the row's own meaningful timestamp is when the visitor
 * actually first landed, which `firstSeen` captures and `createdAt` merely approximates.
 *
 * `enquiries: { none: {} }` is the entire safety mechanism: a row still referenced by any
 * real `enquiry_record` is never deleted here regardless of its own age — this task's own
 * explicit acceptance criterion, and enquiry retention itself is a separate, longer policy
 * under FR-6.4 this job does not override.
 */
export async function deleteExpiredAttributionRows(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const result = await prisma.attribution.deleteMany({
    where: {
      firstSeen: { lt: cutoff },
      enquiries: { none: {} },
    },
  });

  return result.count;
}
