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

import { PrismaClient } from "../generated/prisma/client";
import { createDatabaseAdapter } from "../lib/db-adapter";

const adapter = createDatabaseAdapter(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

/**
 * T2.1/T2.9 (docs/tasks/02-public-presentation.md) — the home page's own content. Sourced
 * from ui/mockups/a-public-site/home.html, which the epic's own opening paragraph treats as
 * a real content source (not placeholder) alongside Company Docs. `isPlaceholder: false`
 * throughout: every field here is real, shipped copy, not draft/illustrative text.
 *
 * Only the fields docs/features/home-page.md's "Data requirements" section actually names
 * are seeded here — the mockup's hero kicker, hero facts sidebar, method-strip step copy, and
 * trust band are rendered as fixed template chrome by app/(public)/page.tsx, not sourced from
 * this row (see prisma/schema.prisma's HomePageContent doc-comment and
 * memory/decision-log.md).
 */
async function seedHomePageContent() {
  await prisma.homePageContent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroStatement:
        "Get your numbers, systems and plans into the shape banks, investors and boards expect.",
      primaryCtaLabel: "Start the Business Health Check",
      primaryCtaHref: "/diagnostic",
      seniorAttentionCopy:
        "Five partners, five practice areas, no bench of associates quietly doing the actual work. It is a genuine difference from larger firms, and it is one of the reasons clients come back.",
      featuredArticleIds: [],
      metaTitle: "Kaalbert & Company Ltd — Business Advisory, Ghana",
      metaDescription:
        "Get your numbers, systems and plans into the shape banks, investors and boards expect. Take the free, six-minute Business Health Check.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.1/T2.9 — the three core offers' home-page card fields only (see
 * prisma/schema.prisma's Offer doc-comment for what's deliberately deferred to T2.2). Sourced
 * from each offer's own mockup page (ui/mockups/a-public-site/offer-*.html) plus
 * home.html's card copy, all real content per the epic's sourcing note.
 *
 * Business Health Check's fee band is provisional: the real offer has two tiers (Express
 * GHS 1,000–2,000; Full GHS 3,000–6,500, the mockup's own "published fee band"). This single
 * min/max/scope_cap shape can't represent two tiers — feeAmountMin/Max here span Express's
 * floor to Full's ceiling so the home card's real "From GHS 1,000" renders correctly, and
 * scopeCap notes the tier split in prose. T2.2 must resolve this properly (see
 * memory/technical-debt.md — "Business Health Check's two-tier pricing has no real data
 * model yet").
 */
async function seedOffers() {
  const offers = [
    {
      slug: "business-health-check",
      name: "Business Health Check",
      teaser:
        "A structured, partner-led read of where your business really stands before you take it to a bank or a board.",
      feeAmountMin: 1000,
      feeAmountMax: 6500,
      feeCurrency: "GHS",
      scopeCap:
        "Two tiers: Express (single-location business, one working session, 5 working days) or Full (up to 3 locations or business lines, 12 months of available records, 2 weeks) — the published band above spans Express's floor to Full's ceiling",
    },
    {
      slug: "financial-clarity-pack",
      name: "Financial Clarity Pack",
      teaser:
        "Management accounts that actually reconcile to your bank balance, and that a lender will trust on sight.",
      feeAmountMin: 4500,
      feeAmountMax: 9500,
      feeCurrency: "GHS",
      scopeCap: "Up to 12 months of records, up to 3 bank or mobile money accounts",
    },
    {
      slug: "funding-readiness-pack",
      name: "Funding-Readiness Pack",
      teaser:
        "Everything a facility application needs, assembled and reviewed before a lender ever sees it.",
      feeAmountMin: 9000,
      feeAmountMax: 19000,
      feeCurrency: "GHS",
      scopeCap: "One facility, up to 3 lenders or funders approached",
    },
  ];

  for (const offer of offers) {
    await prisma.offer.upsert({
      where: { slug: offer.slug },
      update: {},
      create: { ...offer, isPlaceholder: false },
    });
  }
}

async function main() {
  // Later epics add their seedX() calls here, in dependency order, as their tables
  // are added to prisma/schema.prisma.
  await seedHomePageContent();
  await seedOffers();
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
