/**
 * Seed script convention (T1.2 baseline).
 *
 * Run via `npm run db:seed` (delegates to `prisma db seed`, configured by the
 * `migrations.seed` field in prisma7.config.ts). `prisma migrate reset` also runs this
 * automatically.
 *
 * Convention every later epic's tasks follow when they add real seed data:
 * - One `seed<Area>()` function per feature area (e.g. `seedOffers()`, `seedSiteSettings()`),
 *   called from `main()` below in dependency order.
 * - Every seed write is an idempotent `upsert` (never a bare `create`) keyed on a stable
 *   natural key, so re-running the seed script against a database that already has data
 *   never throws or duplicates rows.
 * - Firm-supplied content that doesn't exist yet at seed-authoring time is seeded as
 *   placeholder text with the entity's `is_placeholder` field set `true` (see
 *   docs/tasks/02-public-presentation.md T2.9) — never fabricated as if it were final copy.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Later epics add their seedX() calls here, in dependency order, as their tables
  // are added to prisma/schema.prisma. Nothing to seed yet — T1.2 has no models.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
