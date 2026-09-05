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

import { DiagnosticResponseType, Prisma, PrismaClient } from "../generated/prisma/client";
import { createDatabaseAdapter } from "../lib/db-adapter";
import type { LegalPageBlock } from "../lib/legal";

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

/** Ordered method-stage entry — see prisma/schema.prisma's `Offer.methodStages` doc-comment. */
interface MethodStageSeed {
  title: string;
  description: string;
}

/** Ordered FAQ entry — see prisma/schema.prisma's `Offer.faqs` doc-comment. */
interface OfferFaqSeed {
  question: string;
  answer: string;
}

const OUT_OF_SCOPE_NOTE_STANDARD =
  "Statutory audit, tax filing, and legal advice are not part of this engagement. Kaalbert & Company Ltd is a business advisory firm, not a licensed audit, tax or legal practice — where any of these is required, we connect you to a licensed practitioner.";

/**
 * T2.1/T2.9 — the three core offers, now with every `core-offer-pages.md` field (T2.2).
 * Sourced from each offer's own mockup page (ui/mockups/a-public-site/offer-*.html), plus
 * `Company Docs/05.04 Rate Card.docx` for `indicativeTimeline` specifically — the two
 * single-tier offers' mockups don't surface a distinct timeline section visually, but
 * FR-4.1 requires one, and the Rate Card's own "Offer / Duration / Fee / Scope" table gives
 * the real figure (Financial Clarity Pack: "3 to 5 weeks"; Funding-Readiness Pack: "3 to 6
 * weeks") — not fabricated, not placeholder (see memory/decision-log.md, T2.2).
 *
 * Business Health Check's two-tier pricing (memory/technical-debt.md, resolved at T2.2) is
 * modelled via `seedOfferTiers()` below rather than this offer's own
 * deliverables/clientInputs/indicativeTimeline fields, which are left empty/null for it —
 * see prisma/schema.prisma's `Offer` doc-comment.
 */
async function seedOffers() {
  const offers: Array<{
    slug: string;
    name: string;
    teaser: string;
    problemStatement: string;
    whoFor: string;
    whoNotFor: string;
    methodStages: MethodStageSeed[];
    deliverables: string[];
    clientInputs: string[];
    indicativeTimeline: string | null;
    feeAmountMin: number;
    feeAmountMax: number;
    feeCurrency: string;
    scopeCap: string;
    outOfScopeNote: string;
    faqs: OfferFaqSeed[];
    ctaHref: string;
    ctaLabel: string;
    metaTitle: string;
    metaDescription: string;
  }> = [
    {
      slug: "business-health-check",
      name: "Business Health Check",
      teaser:
        "A structured, partner-led read of where your business really stands before you take it to a bank or a board.",
      problemStatement:
        "You know something isn't quite right — the numbers, the controls, or how dependent the business is on you personally — but not exactly what, or what it's costing you. This gives you a partner-led answer, at a level sized to your business.",
      whoFor:
        "Founder-led businesses turning over roughly GHS 500,000–20 million, preparing for a bank conversation, a board, or simply tired of not trusting their own numbers.",
      whoNotFor:
        "A business that already has clear, current management accounts and needs deeper financial control specifically — the Financial Clarity Pack is the more targeted next step.",
      methodStages: [
        {
          title: "Discover",
          description:
            "A structured walkthrough of your records, controls and reporting as they actually run today.",
        },
        {
          title: "Diagnose",
          description: "We name the constraints actually limiting growth or funding readiness.",
        },
        {
          title: "Design",
          description:
            "A ranked, costed action plan, sized to what your team can realistically run.",
        },
        {
          title: "Deliver",
          description:
            "The written assessment and a presentation — not a document that sits unread.",
        },
      ],
      deliverables: [],
      clientInputs: [],
      indicativeTimeline: null,
      feeAmountMin: 1000,
      feeAmountMax: 6500,
      feeCurrency: "GHS",
      scopeCap:
        "Two tiers: Express (single-location business, one working session, 5 working days) or Full (up to 3 locations or business lines, 12 months of available records, 2 weeks) — the published band above spans Express's floor to Full's ceiling",
      outOfScopeNote: OUT_OF_SCOPE_NOTE_STANDARD,
      faqs: [
        {
          question: "How is this different from an audit?",
          answer:
            "An audit gives an opinion on historical financial statements. This gives you a forward-looking, practical read on structure, controls and readiness — it is not an assurance engagement and doesn't carry audit-level assurance.",
        },
        {
          question: "Which level should I start with?",
          answer:
            "If you're deciding whether to engage the firm at all, Express is built for exactly that — a real result, a small commitment. Businesses that already know they need a fuller picture, or that operate across more than one location, go straight to Full.",
        },
        {
          question: "Is the fee negotiable?",
          answer:
            "The published bands reflect the standard scope. Above GHS 5,000, engagements can be spread across up to four monthly instalments — the deposit still applies, but the fee itself isn't discounted. A materially smaller scope is a different conversation, and never the same scope at a lower rate.",
        },
      ],
      ctaHref: "/diagnostic",
      ctaLabel: "Start with the free Health Check",
      metaTitle: "Business Health Check — Kaalbert & Company Ltd",
      metaDescription:
        "A structured, partner-led read of where your business really stands before you take it to a bank or a board. Two tiers from GHS 1,000, or take the free six-minute preview first.",
    },
    {
      slug: "financial-clarity-pack",
      name: "Financial Clarity Pack",
      teaser:
        "Management accounts that actually reconcile to your bank balance, and that a lender will trust on sight.",
      problemStatement:
        "Your numbers exist somewhere, but not in a form anyone would trust — not you, not a lender, not a board. This is where records become a monthly management accounts pack you can actually run the business on.",
      whoFor:
        "A business whose records exist but aren't consistent, reconciled or current — and that needs ongoing control of its numbers, not a one-off read.",
      whoNotFor:
        "A business that just wants a first, honest read of where it stands — start with the Business Health Check instead. One that already has clean monthly accounts and is ready to approach lenders goes straight to the Funding-Readiness Pack.",
      methodStages: [
        {
          title: "Discover",
          description: "We map your records as they actually exist today, across every account.",
        },
        {
          title: "Diagnose",
          description: "We identify exactly where the records break down or stop reconciling.",
        },
        {
          title: "Design",
          description: "We rebuild the records on one consistent basis, with controls that hold.",
        },
        {
          title: "Deliver",
          description:
            "A monthly management accounts pack you can maintain yourself, handed over properly.",
        },
      ],
      deliverables: [
        "Up to twelve months of records reconstructed on one consistent basis",
        "Up to three bank or mobile money accounts reconciled",
        "A monthly management accounts pack you can maintain",
        "A working twelve-month cash flow, plus the controls that keep it right",
      ],
      clientInputs: [
        "Access to your bank and mobile money statements for the period covered, whatever existing records you have (even incomplete ones), and time for two working sessions with the team.",
      ],
      indicativeTimeline: "3 to 5 weeks",
      feeAmountMin: 4500,
      feeAmountMax: 9500,
      feeCurrency: "GHS",
      scopeCap: "Up to 12 months of records, up to 3 bank or mobile money accounts",
      outOfScopeNote: OUT_OF_SCOPE_NOTE_STANDARD,
      faqs: [
        {
          question: "My records are a mess. Is that a problem?",
          answer:
            "No — that's the usual starting point, and it's exactly what this pack fixes. Records that don't yet reconcile are the reason to start here, not a reason to wait.",
        },
        {
          question: "Can I maintain the accounts myself after the engagement?",
          answer:
            "Yes — the pack is specifically designed to hand over a format and a process you can run monthly on your own, not something that quietly requires us again next month.",
        },
        {
          question: "Does this lead into a retainer?",
          answer:
            "For many clients, yes — this is where the Advisory Retainer naturally picks up, since keeping the numbers right is ongoing work. It's never assumed; it's offered once you've seen what the pack actually produces.",
        },
      ],
      ctaHref: "/contact?service=financial-clarity-pack",
      ctaLabel: "Start a conversation",
      metaTitle: "Financial Clarity Pack — Kaalbert & Company Ltd",
      metaDescription:
        "Management accounts that actually reconcile to your bank balance, and that a lender will trust on sight. Published fee band GHS 4,500–9,500.",
    },
    {
      slug: "funding-readiness-pack",
      name: "Funding-Readiness Pack",
      teaser:
        "Everything a facility application needs, assembled and reviewed before a lender ever sees it.",
      problemStatement:
        "You need a facility, and you know your business is stronger than your paperwork makes it look. This turns your numbers into a case a credit committee can actually test.",
      whoFor:
        "A business seeking a specific facility, with reasonably current records, ready to approach a lender or funder within the next few months.",
      whoNotFor:
        "A business whose records aren't under control yet — start with the Financial Clarity Pack first. Facilities above GHS 1,000,000 and multi-entity groups are scoped separately, not covered by this published band.",
      methodStages: [
        {
          title: "Discover",
          description:
            "We map your current financial position and what the target facility actually requires.",
        },
        {
          title: "Diagnose",
          description:
            "We identify the gaps between what you can show today and what a credit committee will test.",
        },
        {
          title: "Design",
          description:
            "We build the business case, forecasts and sensitivity analysis to close those gaps.",
        },
        {
          title: "Deliver",
          description:
            "The complete document pack, ready for the lenders or funders you've identified.",
        },
      ],
      deliverables: [
        "A defensible business case",
        "Three-year forecasts a credit committee can test",
        "Sensitivity analysis",
        "The complete document pack, for up to three lenders or funders",
      ],
      clientInputs: [
        "Your current financial records, details of the facility you're seeking, and time with management to build the business case and test the forecasts together.",
      ],
      indicativeTimeline: "3 to 6 weeks",
      feeAmountMin: 9000,
      feeAmountMax: 19000,
      feeCurrency: "GHS",
      scopeCap: "One facility, up to 3 lenders or funders approached",
      outOfScopeNote:
        "Statutory audit, tax filing, and legal advice are not part of this engagement. Kaalbert & Company Ltd is a business advisory firm, not a licensed audit, tax or legal practice — where any of these is required, we connect you to a licensed practitioner. We do not guarantee approval by any lender or funder.",
      faqs: [
        {
          question: "Can you guarantee my facility will be approved?",
          answer:
            "No — no adviser honestly can, and we'd tell you not to trust anyone who does. What we can do is make sure your case is one a credit committee can actually test, which is the single biggest reason strong businesses get declined.",
        },
        {
          question: "What if my facility is larger than GHS 1,000,000?",
          answer:
            "The published band assumes a facility at or below that size and a single entity. Larger facilities and multi-entity groups are scoped and quoted individually, since the work involved genuinely differs.",
        },
        {
          question: "My records aren't in great shape yet — can I still start here?",
          answer:
            "You can, but we'll likely recommend the Financial Clarity Pack first. A funding case built on records that don't hold up under questioning does more harm than good in front of a lender.",
        },
      ],
      ctaHref: "/contact?service=funding-readiness-pack",
      ctaLabel: "Start a conversation",
      metaTitle: "Funding-Readiness Pack — Kaalbert & Company Ltd",
      metaDescription:
        "Everything a facility application needs, assembled and reviewed before a lender ever sees it. Published fee band GHS 9,000–19,000.",
    },
  ];

  for (const offer of offers) {
    const { methodStages, faqs, ...rest } = offer;
    const data = {
      ...rest,
      methodStages: methodStages as unknown as Prisma.InputJsonValue,
      faqs: faqs as unknown as Prisma.InputJsonValue,
      isPlaceholder: false,
    };
    await prisma.offer.upsert({
      where: { slug: offer.slug },
      update: data,
      create: data,
    });
  }
}

/**
 * New at T2.2 — resolves Business Health Check's two-tier pricing (memory/technical-debt.md).
 * Sourced from ui/mockups/a-public-site/offer-business-health-check.html's tier cards, with
 * `durationLabel` cross-checked against `Company Docs/05.04 Rate Card.docx`'s own
 * Offer/Duration/Fee/Scope table (Express "5 working days", Full "2 weeks" — matches exactly).
 * Only Business Health Check has tiers; the other two offers' `tiers` relation stays empty.
 */
async function seedOfferTiers() {
  const bhc = await prisma.offer.findUnique({ where: { slug: "business-health-check" } });
  if (!bhc) {
    throw new Error(
      "seedOfferTiers: business-health-check offer not found — run seedOffers first.",
    );
  }

  const tiers = [
    {
      name: "Express",
      isFeatured: false,
      durationLabel: "5 working days",
      scopeLabel: "single-location business",
      scopeCap: "single-location business",
      feeAmountMin: 1000,
      feeAmountMax: 2000,
      feeCurrency: "GHS",
      deliverables: [
        "Structured diagnostic questionnaire",
        "One working session, up to two hours",
        "A written assessment naming what's holding the business back and the three actions that matter most",
      ],
      clientInputs: [
        "One working session, up to two hours, and whatever records you already have on hand for that session.",
      ],
      sortOrder: 1,
    },
    {
      name: "Full",
      isFeatured: true,
      durationLabel: "2 weeks",
      scopeLabel: "up to three locations or business lines",
      scopeCap: "up to 3 locations or business lines, 12 months of available records",
      feeAmountMin: 3000,
      feeAmountMax: 6500,
      feeCurrency: "GHS",
      deliverables: [
        "All four diagnostic instruments",
        "Review of the last twelve months of available records",
        "Two working sessions",
        "A full written assessment with a ranked and costed action plan",
        "A presentation to the owner or board",
      ],
      clientInputs: [
        "Your last twelve months of available records, and two working sessions with the team.",
      ],
      sortOrder: 2,
    },
  ];

  for (const tier of tiers) {
    await prisma.offerTier.upsert({
      where: { offerId_sortOrder: { offerId: bhc.id, sortOrder: tier.sortOrder } },
      update: { ...tier, offerId: bhc.id },
      create: { ...tier, offerId: bhc.id },
    });
  }
}

/**
 * T2.3 (docs/tasks/02-public-presentation.md) — the capabilities page's own hero copy, via
 * the shared `page` entity (prisma/schema.prisma's `Page` model). Sourced verbatim from
 * ui/mockups/a-public-site/capabilities.html's `<section class="page-hero">`, which the
 * epic's own opening paragraph treats as a real content source (not placeholder), same as
 * home.html at T2.1. `metaTitle`/`metaDescription` aren't shown in the mockup (a bare
 * `<title>` tag only) — written fresh here in the same style as `seedOffers`'s per-offer meta
 * tags, `isPlaceholder: false` since the copy itself is real, just not mockup-sourced
 * verbatim for these two fields specifically.
 */
async function seedCapabilitiesPage() {
  await prisma.page.upsert({
    where: { slug: "capabilities" },
    update: {},
    create: {
      slug: "capabilities",
      heroKicker: "Capabilities",
      heroHeading: "The wider service line, in summary",
      heroLead:
        "Three offers get the firm's senior attention this year — the eight capabilities below cover everything else we do, so an adjacent need doesn't go unanswered. Each one routes straight to a partner, not to a thin page of its own.",
      introCopy: null,
      metaTitle: "Capabilities — Kaalbert & Company Ltd",
      metaDescription:
        "The wider service line beyond our three core offers, from financial advisory to digital transformation — each one routes straight to a partner.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.3 — the 8 `capability` rows. Names, order and short-description copy sourced verbatim
 * from ui/mockups/a-public-site/capabilities.html's 8 `.cap-card` entries, cross-checked
 * against `Company Docs/05.03 Core Offer Focus Note.docx`'s Section 5 "Treatment of every
 * service line" table (same 8 service lines, same order, same Core/Supporting/Available
 * framing) — confirming the mockup copy as the real, accepted content, not placeholder (same
 * verification approach as T2.2's Rate Card cross-check, see memory/decision-log.md).
 * `slug` is each card's `?service=` query-param value, carried through unchanged to the
 * `/contact?service=[slug]` link (capabilities-page.md's FR-1.2).
 */
async function seedCapabilities() {
  const capabilities: Array<{
    name: string;
    slug: string;
    shortDescription: string;
    order: number;
  }> = [
    {
      name: "Financial Advisory, Tax and Audit Support",
      slug: "financial-advisory-tax-audit",
      shortDescription:
        "Structured financial advisory, with tax and audit needs referred to a licensed practitioner where that's what's required.",
      order: 1,
    },
    {
      name: "Grants, Funding and Investment Readiness",
      slug: "grants-funding-investment",
      shortDescription:
        "Grant and investment-readiness work, built on the same preparation that underpins our Funding-Readiness Pack.",
      order: 2,
    },
    {
      name: "SME Growth and Business Development",
      slug: "sme-growth-development",
      shortDescription:
        "Positioning, pricing and growth planning for a business ready to move past its first structure.",
      order: 3,
    },
    {
      name: "Regulatory, Compliance and Registration",
      slug: "regulatory-compliance-registration",
      shortDescription:
        "Business formalisation, registration support, and a compliance calendar you can actually run.",
      order: 4,
    },
    {
      name: "Strategy and Corporate Advisory",
      slug: "strategy-corporate-advisory",
      shortDescription:
        "Strategic and corporate advisory work, taken on where the mandate is well defined.",
      order: 5,
    },
    {
      name: "Market Research and Feasibility",
      slug: "market-research-feasibility",
      shortDescription:
        "Market research and feasibility studies, scoped tightly and priced for the research effort involved.",
      order: 6,
    },
    {
      name: "HR, Recruitment and Training",
      slug: "hr-recruitment-training",
      shortDescription:
        "HR foundations, training and recruitment support, delivered where an existing client's team needs it.",
      order: 7,
    },
    {
      name: "Digital Transformation and Operations",
      slug: "digital-transformation-operations",
      shortDescription:
        "Process and operations work, including our Applied Intelligence practice for clients ready for it.",
      order: 8,
    },
  ];

  for (const capability of capabilities) {
    await prisma.capability.upsert({
      where: { slug: capability.slug },
      update: { ...capability, isPlaceholder: false },
      create: { ...capability, isPlaceholder: false },
    });
  }
}

/**
 * T2.3 — the Advisory Retainer singleton. `feeAmount`/`billingPeriod` sourced from
 * ui/mockups/a-public-site/capabilities.html's retainer panel ("From GHS 1,500 / month"),
 * which matches the Essential tier's floor in `Company Docs/05.04 Rate Card.docx`'s own
 * Advisory Retainer table (Essential 1,500/month, Standard 2,800/month, Full 5,000/month) —
 * capabilities-page.md's Data requirements section models this as a single amount, not
 * `OfferTier`'s multi-tier shape, so the three-tier detail from the Rate Card isn't
 * represented here; only the entry-level figure the mockup itself publishes.
 */
async function seedAdvisoryRetainer() {
  await prisma.advisoryRetainer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      feeAmount: 1500,
      feeCurrency: "GHS",
      billingPeriod: "month",
      description:
        "For a business that wants ongoing partner access rather than a single engagement — monthly review, a standing call, and hands-on support as needed.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.4 (docs/tasks/02-public-presentation.md) — the our-method page's own hero + intro copy,
 * via the shared `page` entity. Hero copy sourced verbatim from
 * ui/mockups/a-public-site/our-method.html's `<section class="page-hero">`. `introCopy` is
 * the mockup's "One journey, not three separate products" paragraph, sourced verbatim; stays
 * plain text (no embedded markup, same as every other content field in this project) even
 * though the mockup links its two offer-name mentions inline — app/our-method/page.tsx's
 * `renderIntroCopyWithOfferLinks` re-links any of `getOfferNavLinks()`'s live offer names it
 * finds in this string at render time, so the mockup's linking behaviour is preserved without
 * requiring markup in the database field itself (see memory/decision-log.md, T2.4). The
 * section's own kicker ("One journey, not three separate products") is rendered as fixed
 * chrome by app/our-method/page.tsx, same treatment as capabilities.html's "Continuing
 * arrangement" kicker in seedCapabilitiesPage above — not part of this doc's named fields.
 */
async function seedOurMethodPage() {
  await prisma.page.upsert({
    where: { slug: "our-method" },
    update: {},
    create: {
      slug: "our-method",
      heroKicker: "Our Method",
      heroHeading: "Discover, Diagnose, Design, Deliver",
      heroLead:
        "Four stages, each with a defined input, output and decision point — not a slogan. This is the firm's strongest differentiator.",
      introCopy:
        "The three core offers — Business Health Check, Financial Clarity Pack, Funding-Readiness Pack — are one sequence the firm sells, not three separate products. Every stage below runs inside each of them.",
      metaTitle: "Our Method — Kaalbert & Company Ltd",
      metaDescription:
        "The four-stage method behind every Kaalbert & Company engagement — Discover, Diagnose, Design, Deliver — including how capability transfers back to the client at the end.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.4 — the 4 `method_stage` rows. Sourced verbatim from
 * ui/mockups/a-public-site/our-method.html's four `.stage-block` entries, which the epic's own
 * opening paragraph treats as a real content source, same as capabilities.html at T2.3.
 * `capabilityTransferNote` is populated only for Deliver (order 4), per our-method-page.md's
 * business rule — null for the other three.
 */
async function seedMethodStages() {
  const stages: Array<{
    name: string;
    order: number;
    description: string;
    whatHappens: string;
    clientSees: string;
    decisionPoint: string;
    capabilityTransferNote: string | null;
  }> = [
    {
      name: "Discover",
      order: 1,
      description:
        "We map the business as it actually runs today — records, controls, reporting, decisions — rather than as the org chart or the founder's own account of it claims. This stage is deliberately evidence-first.",
      whatHappens:
        "A structured review of records and a working session with the owner or finance lead.",
      clientSees: "Direct questions, grounded in their own numbers — not a generic checklist.",
      decisionPoint: "Agreement on what the diagnosis actually needs to cover.",
      capabilityTransferNote: null,
    },
    {
      name: "Diagnose",
      order: 2,
      description:
        "We name the two or three constraints actually limiting growth or funding readiness — not a long list that overwhelms rather than directs.",
      whatHappens:
        "Analysis against the specific offer's method — scoring, reconciliation, or case-testing.",
      clientSees: "A ranked, specific set of findings, not a generic report.",
      decisionPoint:
        "The client sees clearly what the real constraint is, and agrees the priority.",
      capabilityTransferNote: null,
    },
    {
      name: "Design",
      order: 3,
      description:
        "We build the specific structure that closes the gap — an action plan, a monthly accounts format, a funding case — sized to what the team can realistically run, not an idealised version nobody will maintain.",
      whatHappens: "The firm builds the deliverable named on the relevant offer page.",
      clientSees: "Drafts reviewed together, not delivered cold at the end.",
      decisionPoint: "Sign-off on the design before it's finalised.",
      capabilityTransferNote: null,
    },
    {
      name: "Deliver",
      order: 4,
      description:
        "The finished deliverable, handed over properly — and, critically, the capability to keep running it without the firm.",
      whatHappens:
        "A closing session walking the client through the deliverable and how to maintain it.",
      clientSees:
        "The named documents from the offer, plus a working process they can run themselves.",
      decisionPoint:
        "What comes next — the following offer in the sequence, a retainer, or nothing further.",
      capabilityTransferNote:
        "Every engagement ends with the client able to run what we built without us — a monthly accounts process they can maintain, a scoring framework they understand, a document pack they could update themselves. The firm advises clients to own their own systems, and holds itself to the same standard in how it hands work back.",
    },
  ];

  for (const stage of stages) {
    await prisma.methodStage.upsert({
      where: { order: stage.order },
      update: { ...stage, isPlaceholder: false },
      create: { ...stage, isPlaceholder: false },
    });
  }
}

/**
 * T2.5 (docs/tasks/02-public-presentation.md) — the about page's own hero copy, via the
 * shared `page` entity. Sourced verbatim from ui/mockups/a-public-site/about.html's
 * `<section class="page-hero">`. `metaTitle`/`metaDescription` aren't shown in the mockup (a
 * bare `<title>` tag only) — written fresh here, same treatment as `seedCapabilitiesPage`.
 */
async function seedAboutPage() {
  await prisma.page.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      heroKicker: "About & Partners",
      heroHeading: "A firm built to make your business organised, sound and ready to grow",
      heroLead:
        "Where a business is informal, we help it become structured. Where it's struggling to manage money, we help it gain control. Where it wants funding, we help it become fundable — and where it wants to grow but doesn't know how, we give it a clear plan and help it execute.",
      introCopy: null,
      metaTitle: "About & Partners — Kaalbert & Company Ltd",
      metaDescription:
        "The firm's founding statement, values and standard, and the five partners you'd actually work with — named, credentialed, and accountable.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.5 — the `firm_statement` singleton. Sourced verbatim from
 * ui/mockups/a-public-site/about.html's "What we stand on", "What we're building toward" and
 * "What we are not" sections — see prisma/schema.prisma's `FirmStatement` doc-comment for why
 * this is decomposed into named fields rather than one rich-text blob.
 */
async function seedFirmStatement() {
  await prisma.firmStatement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      standingIntro:
        "We work with you, not just for you. Four values are simple and non-negotiable — the standard every engagement is held to, whoever on the team is running it.",
      values: ["Integrity", "Excellence", "Partnership", "Impact"],
      forwardHeading: "Senior attention on every engagement, for as long as the firm exists",
      forwardBody:
        "Kaalbert & Company is a young firm with an old-fashioned standard: every engagement gets senior partner-level attention, never passed down and forgotten. We implement alongside our clients rather than handing over a report and leaving, and we're honest about what sits outside our remit — connecting clients to the licensed accountants, tax agents and lawyers a piece of work actually requires, rather than overreaching. That standard is what we're asking to be judged against as the firm grows.",
      scopeBody:
        "Kaalbert & Company is not a licensed or chartered accounting firm, not licensed tax practitioners, and not a law firm. We do not audit or sign statutory accounts, act as your tax agent of record, or give legal opinions. Where the law requires a licensed professional, we prepare you thoroughly — and connect you to certified accountants, tax agents and lawyers we trust. We work hand in hand with them; we do not replace them.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.5 — the 5 `author` rows. Names, roles and bio copy sourced verbatim from
 * ui/mockups/a-public-site/about.html's partner-feature/partner-grid entries (the firm's own
 * supplied content, not placeholder — see this task's session-11 summary). Titles corrected
 * per explicit firm direction (session 11, 2026-09-05): "Founder/CEO" → "Lead Partner",
 * "Co-Founder" → "Partner" (memory/decision-log.md).
 *
 * `title`/`practiceArea` split (session 11 follow-up): the mockup only combined rank and
 * responsibility into one string for the featured partner ("Lead Partner · Lead
 * Consultant") and showed no rank at all for the other four — a real gap the user flagged,
 * not something to preserve. Every partner now gets both fields distinctly: `title` is the
 * rank (rendered as a visually distinct badge), `practiceArea` is just the responsibility.
 *
 * `photoUrl: null` for all five — no partner photography exists yet (checked `public/` and
 * `ui/mockups/assets/`, neither has one). Per the revised policy (memory/decision-log.md,
 * session 11), this does NOT block `published` — every other required field is complete and
 * real, so all five publish now with an initials-avatar fallback (app/about/page.tsx's
 * `PartnerAvatar`), swapped for a real photo the moment one is uploaded.
 *
 * `credentials` is set only for John Dogbey and Evans Agyemang ("Chartered Accountant"),
 * copied verbatim from their own bio text below — the other three partners' bios don't state
 * a formal professional designation, so `credentials` stays null rather than inventing one
 * (never fabricated, per CLAUDE.md).
 *
 * `personalStatement`/`bio` are seeded with the same paragraph: the mockup and Company Docs
 * supply exactly one paragraph per partner, written in third person rather than two distinct
 * first-person/byline texts. `personalStatement` is what this page renders (per
 * about-and-partners-page.md's user flow); `bio` is duplicated for `insights-engine.md`'s own
 * future use (article bylines, not built yet) rather than left empty — see
 * memory/decision-log.md.
 */
async function seedAuthors() {
  const authors: Array<{
    name: string;
    photoUrl: string | null;
    title: string;
    practiceArea: string;
    credentials: string | null;
    personalStatement: string;
    order: number;
  }> = [
    {
      name: "Albert Kwakye Amponsah",
      photoUrl: null,
      title: "Lead Partner",
      practiceArea: "Lead Consultant",
      credentials: null,
      personalStatement:
        "A Ghanaian accounting and finance professional with over fifteen years of disciplined, sector-diverse experience spanning corporate finance, fund administration, real estate, education administration, wood-processing manufacturing and consultancy. Albert brings hands-on expertise in financial modelling, business intelligence, strategic planning and complex data analysis using modern tools and languages.",
      order: 1,
    },
    {
      name: "Ama Wiafe",
      photoUrl: null,
      title: "Partner",
      practiceArea: "Growth, Markets & Clients",
      credentials: null,
      personalStatement:
        "An accomplished operations and finance professional with ten years of experience in financial administration and executive support. Ama's expertise lies in enhancing operational controls while facilitating business growth across multifunctional teams.",
      order: 2,
    },
    {
      name: "Joseph Bordoh",
      photoUrl: null,
      title: "Partner",
      practiceArea: "Technology & Operations",
      credentials: null,
      personalStatement:
        "An IT support and network professional with over ten years of hands-on experience in systems administration, network infrastructure, information security and IT service management. Joseph is skilled in Windows Server, Active Directory, Office 365, VLANs, IP telephony, ERP support and user training, with a proven record of keeping business systems stable and reliable.",
      order: 3,
    },
    {
      name: "John Dogbey",
      photoUrl: null,
      title: "Partner",
      practiceArea: "Financial Reporting & Tax",
      credentials: "Chartered Accountant",
      personalStatement:
        "A chartered accountant and MBA Finance graduate with over ten years of experience in financial reporting, tax compliance, management and cost accounting, and in-depth financial analysis across regulatory and commercial environments. John prepares IFRS-compliant financial statements, establishes internal controls, builds budgets with variance analysis and forecasts cash flow, working fluently in Power BI and Tableau to turn numbers into decisions.",
      order: 4,
    },
    {
      name: "Evans Agyemang",
      photoUrl: null,
      title: "Partner",
      practiceArea: "Financial Control & Compliance",
      credentials: "Chartered Accountant",
      personalStatement:
        "A chartered accountant with more than seven years of experience delivering financial and reporting solutions across corporate, regulatory and public-sector environments. Evans brings depth in financial reporting, analysis, reconciliations, cost control and regulatory compliance, with a proven record of managing complex multi-entity operations and producing accurate, audit-ready results under strict deadlines.",
      order: 5,
    },
  ];

  for (const author of authors) {
    const data = {
      adminUserId: null,
      name: author.name,
      photoUrl: author.photoUrl,
      title: author.title,
      practiceArea: author.practiceArea,
      credentials: author.credentials,
      personalStatement: author.personalStatement,
      bio: author.personalStatement,
      order: author.order,
      published: true,
      isPlaceholder: false,
    };
    const existing = await prisma.author.findFirst({ where: { name: author.name } });
    if (existing) {
      await prisma.author.update({ where: { id: existing.id }, data });
    } else {
      await prisma.author.create({ data });
    }
  }
}

/**
 * T2.6 (docs/tasks/02-public-presentation.md) — the contact page's own hero copy, via the
 * shared `page` entity — same pattern as capabilities/our-method/about, decided at this task
 * since `ui/mockups/a-public-site/contact.html`'s `<section class="page-hero">` matches that
 * shape exactly. Sourced verbatim from the mockup. `metaTitle`/`metaDescription` aren't shown
 * in the mockup (a bare `<title>` tag only) — written fresh, same treatment as
 * `seedCapabilitiesPage`/`seedAboutPage`.
 */
async function seedContactPage() {
  await prisma.page.upsert({
    where: { slug: "contact" },
    update: {},
    create: {
      slug: "contact",
      heroKicker: "Contact",
      heroHeading: "Tell us where the business is, and where you want it to be",
      heroLead:
        "A short form, or WhatsApp, phone and email if you'd rather talk directly. No fee, no obligation, for a first conversation.",
      introCopy: null,
      metaTitle: "Contact — Kaalbert & Company Ltd",
      metaDescription:
        "Reach Kaalbert & Company Ltd by form, WhatsApp, phone or email — no fee, no obligation, for a first conversation.",
      isPlaceholder: false,
    },
  });
}

/**
 * T2.6 — the `site_settings` singleton, first materialized at this task (see
 * prisma/schema.prisma's `SiteSettings` doc-comment). Phone numbers, WhatsApp number, email
 * and address sourced verbatim from `ui/mockups/a-public-site/contact.html`'s channel cards
 * and footer, matching every other public-site mockup's footer content exactly (same numbers
 * `components/site-footer.tsx`'s callers currently hardcode — see the technical-debt entry
 * for why those callers aren't switched to read this row as part of this task).
 * `whatsappNumber` is stored in the same digits-only, country-code-prefixed form the
 * mockup's own `wa.me/233558480001` link uses, so `WhatsAppLinkButton` can build the link
 * directly without reformatting. `responseTimeCommitment` is seeded `null` — the firm has not
 * yet confirmed a response-time commitment it can actually keep (contact-and-enquiry.md's
 * business rule); the mockup's own "Response-time commitment: pending." note is a
 * mockup-authoring annotation, not real visitor copy, so it is not carried into the seed (same
 * treatment as the photo-pending caption removed from `/about` at T2.5 — see
 * memory/decision-log.md). `socialProfileUrls` stays empty — no firm social profiles supplied
 * yet.
 */
async function seedSiteSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phonePrimary: "0558 480 001",
      phoneSecondary: "0257 784 686",
      email: "kaalberto777@gmail.com",
      whatsappNumber: "233558480001",
      address: "House No. 13 Gbenjin Gbe Avenue\nEast Legon-ARS, Accra, Ghana",
      responseTimeCommitment: null,
      socialProfileUrls: [],
      isPlaceholder: false,
    },
  });
}

/**
 * T2.7 (docs/tasks/02-public-presentation.md) — the four fixed legal pages, sourced verbatim
 * from `ui/mockups/e-legal/*.html` (structure and copy exactly, per that task's own
 * architecture constraint). Privacy Notice/Cookie Notice/Terms of Use are genuine structural
 * placeholders — their own mockups say so explicitly ("This page is a structural
 * placeholder... drafted by the firm with counsel") — seeded `isPlaceholder: true`,
 * `lastRevisedAt: null`. Scope of Practice is real, firm-supplied content: the same
 * `../Company Docs/07.10 Scope of Practice and Regulatory Boundary Policy.docx` text already
 * verified and seeded into `FirmStatement.scopeBody`/`ScopeOfPracticeNote` at T2.5 (session
 * 11 follow-up, memory/decision-log.md) — seeded `isPlaceholder: false`, with its mockup's own
 * real revision date.
 */
async function seedLegalPages() {
  const pages: {
    slug: string;
    title: string;
    body: LegalPageBlock[];
    metaDescription: string;
    lastRevisedAt: Date | null;
    isPlaceholder: boolean;
  }[] = [
    {
      slug: "privacy-notice",
      title: "Privacy Notice",
      body: [
        {
          kind: "statement",
          text: "Kaalbert & Company Ltd is the data controller for personal information collected through this site, once the firm's Data Protection Commission registration is complete (Document 13.03, Section 9).",
        },
        {
          kind: "prose",
          text: "This page is a structural placeholder, not a real privacy notice. The actual wording is drafted by the firm with counsel and cannot be written by the build team (Document 13.03, Section 13) — it must be complete before the site is publicly reachable. The sections below are the required content areas, each pending its real text; the shape is fixed, edited in admin once supplied.",
        },
        {
          kind: "pending",
          heading: "What we collect",
          text: "Pending — the diagnostic responses, contact-form details, and Insights subscription data this site collects, stated plainly.",
        },
        {
          kind: "pending",
          heading: "Why we collect it",
          text: "Pending — the specific purpose for each category of information collected.",
        },
        {
          kind: "pending",
          heading: "How long we keep it",
          text: "Pending — a documented retention period per data category (Document 13.03, Section 9).",
        },
        {
          kind: "pending",
          heading: "Who it's shared with",
          text: "Pending — named third parties, if any, and confirmation that diagnostic responses are never transmitted to an advertising platform (Document 13.03, Section 9).",
        },
        {
          kind: "pending",
          heading: "How to request deletion",
          text: "Pending — the concrete steps a visitor takes to request their data be deleted.",
        },
      ],
      metaDescription:
        "How Kaalbert & Company Ltd collects, uses and protects personal information submitted through this site. Final wording pending the firm's legal review.",
      lastRevisedAt: null,
      isPlaceholder: true,
    },
    {
      slug: "cookie-notice",
      title: "Cookie Notice",
      body: [
        {
          kind: "statement",
          text: "This site uses cookies for analytics and, where you consent, advertising. Non-essential cookies are held until you give consent — declining does not block the site from working (Document 13.03, Section 9, Section 11.1).",
        },
        {
          kind: "prose",
          text: "This page is a structural placeholder. The specific cookie list and retention periods are drafted by the firm with counsel (Document 13.03, Section 13) — the categories below are fixed by the site's actual measurement setup and populated once the tag container is configured.",
        },
        {
          kind: "table",
          heading: "Cookie categories on this site",
          headers: ["Category", "Purpose", "Consent required"],
          rows: [
            ["Essential", "Session state, security, form functionality", "No — always active"],
            ["Analytics", "Google Analytics 4, via the site's single tag container", "Yes"],
            ["Advertising", "Meta Pixel, Google Ads, LinkedIn Insight Tag", "Yes"],
          ],
        },
        {
          kind: "prose",
          heading: "How consent works",
          text: 'A consent banner appears on your first visit. Choosing "decline" keeps analytics and advertising cookies off; your choice is passed to the tag container so measurement degrades gracefully rather than firing regardless.',
        },
        {
          kind: "pending",
          heading: "Changing your choice",
          text: "Pending — the mechanism for a returning visitor to change their consent choice after the first visit.",
        },
      ],
      metaDescription:
        "The cookie categories kaalbert.com uses, how consent works, and how to change your choice. Final wording pending the firm's legal review.",
      lastRevisedAt: null,
      isPlaceholder: true,
    },
    {
      slug: "terms-of-use",
      title: "Terms of Use",
      body: [
        {
          kind: "prose",
          text: "This page is a structural placeholder, not real terms. The wording is drafted by the firm with counsel (Document 13.03, Section 13) and cannot be written by the build team. The sections below are the standard content areas a terms-of-use page holds; each is pending its real text.",
        },
        {
          kind: "pending",
          heading: "Acceptance of terms",
          text: "Pending — what using this site means you agree to.",
        },
        {
          kind: "pending",
          heading: "Use of the site",
          text: "Pending — permitted and prohibited use of the site's content and tools, including the Business Health Check.",
        },
        {
          kind: "pending",
          heading: "Intellectual property",
          text: "Pending — ownership of the site's content, brand and Insights articles.",
        },
        {
          kind: "pending",
          heading: "Disclaimers",
          text: "Pending — the site's content, including diagnostic results, is informational and not professional advice (consistent with the Scope of Practice page).",
        },
        {
          kind: "pending",
          heading: "Governing law",
          text: "Pending — the jurisdiction these terms are governed by.",
        },
      ],
      metaDescription:
        "The terms governing use of kaalbert.com. Final wording pending the firm's legal review.",
      lastRevisedAt: null,
      isPlaceholder: true,
    },
    {
      slug: "scope-of-practice",
      title: "Scope of Practice",
      body: [
        {
          kind: "statement",
          text: "Kaalbert & Company Ltd is a business advisory firm. It is not a licensed audit, tax or legal practice, and connects clients to licensed practitioners where such work is required.",
        },
        {
          kind: "prose",
          heading: "What Kaalbert is",
          text: "Kaalbert & Company Ltd is a business advisory and consulting firm. It advises, analyses, structures, prepares, designs, trains and supports implementation — helping a client understand their position, decide what to do, build the systems to do it, and produce the documents they need to act. Everything the firm does is done for the client and remains the client's own act: the firm prepares, the client adopts, approves and files.",
        },
        {
          kind: "prose",
          heading: "What Kaalbert is not",
          text: "The firm holds no practising licence of any kind. Where a partner holds an individual professional qualification, that qualification is personal to them and does not extend to the firm — the firm does not lend it to work it is not licensed to perform.",
        },
        {
          kind: "table",
          headers: ["The firm is not", "And therefore does not"],
          rows: [
            [
              "An audit firm",
              "Express an audit opinion, issue an assurance or review report, hold itself out as auditor, or describe any work it performs as an audit.",
            ],
            [
              "A licensed tax practice",
              "Act as a client's tax agent before the Ghana Revenue Authority, sign or file a return on a client's behalf, or represent a client in a tax audit, objection or appeal.",
            ],
            [
              "A law firm",
              "Give a legal opinion, advise on the legal effect of a document, or represent a client in any proceeding or negotiation as its legal adviser.",
            ],
            [
              "A licensed financial or investment adviser",
              "Advise on the merits of buying or selling securities, arrange or promote an investment, or hold, receive or handle client money.",
            ],
          ],
        },
        {
          kind: "prose",
          variant: "muted",
          text: "The firm also does not act as company secretary, does not certify or attest documents, and does not hold client funds in any account under its control.",
        },
        {
          kind: "prose",
          heading: "Where the firm refers you on",
          text: "Where an engagement needs licensed audit, tax representation, legal advice, or investment advice, the firm says so plainly and connects you to a licensed practitioner it trusts. The firm works alongside that practitioner; it does not replace them.",
        },
      ],
      metaDescription:
        "What Kaalbert & Company Ltd is and is not, and where the firm refers clients to a licensed practitioner. A business advisory firm, not a licensed audit, tax or legal practice.",
      lastRevisedAt: new Date("2026-08-26"),
      isPlaceholder: false,
    },
  ];

  for (const page of pages) {
    const { body, ...rest } = page;
    const data = { ...rest, body: body as unknown as Prisma.InputJsonValue };
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: data,
      create: data,
    });
  }
}

/**
 * T2.7 — the `footer_content` singleton (`prisma/schema.prisma`'s `FooterContent`
 * doc-comment). `scopeOfPracticeStatement` matches `components/scope-of-practice-note.tsx`'s
 * currently-hardcoded text verbatim (not yet wired live — see that model's doc-comment and
 * memory/technical-debt.md). `companyRegistrationDetails` stays null — not yet supplied
 * (FR-5.2's edge case).
 */
async function seedFooterContent() {
  await prisma.footerContent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      scopeOfPracticeStatement:
        "Kaalbert & Company Ltd is a business advisory firm. It is not a licensed audit, tax or legal practice, and connects clients to licensed practitioners where such work is required.",
      companyRegistrationDetails: null,
      isPlaceholder: false,
    },
  });
}

/**
 * T3.3 (docs/tasks/03-diagnostic.md) — the Business Health Check's launch dimension/question/
 * threshold set. Sourced verbatim from `ui/mockups/c-diagnostic/diagnostic-flow.html`'s own
 * inline `QUESTIONS` array, which that mockup's own comment already flags: "Illustrative
 * question set — real wording, scoring and result copy are reserved to firm authorship
 * (Document 13.03, Section 13: Evans Agyemang with Albert Kwakye Amponsah, derived from the
 * firm's own business and financial diagnostic tools)." Not fabricated fresh here — carried
 * over as-is — and not presented as final: every question below is flagged `is_placeholder:
 * true` in this comment, per docs/tasks/03-diagnostic.md T3.3's own acceptance criterion.
 * There is no queryable `is_placeholder` column on `diagnostic_question` itself (unlike every
 * other content-bearing model in this schema) — `docs/features/business-health-check-
 * diagnostic.md`'s Data requirements section never named one, matching T3.1's already-migrated
 * schema — so this comment is the only flag available today; see
 * `memory/technical-debt.md` → "`diagnostic_question` has no queryable `is_placeholder`
 * column" for the gap this leaves for Milestone 7's admin UI.
 *
 * `DiagnosticDimension`/`DiagnosticThreshold` have no unique natural key beyond `id` (unlike
 * `MethodStage.order`'s precedent above), so every row below is upserted by a fixed literal
 * `id` — the same fixed-id convention this file's singleton seeds already use
 * (`HomePageContent`, `SiteSettings`, ...), generalized here to a small known set of rows
 * rather than one. `DiagnosticQuestion` does have a real natural key
 * (`@@unique([dimensionId, order])`), so its own upserts use that instead.
 *
 * Dimension weights are seeded equal (1 each) — a real, considered default (not a
 * placeholder zero), pending the firm's own tuned weighting once supplied; scoring weights
 * are configuration data the firm can revise without a deployment, but only the build team
 * adjusts the scoring algorithm itself (`docs/features/business-health-check-diagnostic.md`'s
 * business rules).
 *
 * Threshold values/priority levels are similarly a real, considered illustrative default:
 * a per-dimension threshold at 50 ("High") generalizes the mockup's own hard-coded
 * weak-dimension cutoff (`d.score < 75`) into real per-dimension data — tightened to 50 since
 * `lib/diagnostic-scoring.ts`'s `weakestDimensions` already guarantees 2–3 names regardless of
 * whether a threshold trips, so the threshold itself is reserved for a more urgent signal.
 * Two overall bands (40 → "High", 70 → "Medium") give `EnquiryRecord.triageFlag` (T3.5) a
 * real multi-tier signal to work with.
 *
 * `choice`-type questions have no schema column to store an option's label-to-value mapping
 * (decided at T3.2 — every answer, regardless of `responseType`, is a plain numeric string
 * pre-normalized to 0–1, see `lib/diagnostic-scoring.ts`'s and `prisma/schema.prisma`'s
 * `DiagnosticResponse.answerValue` doc-comments) — so each choice question's real option set
 * and values is documented inline below, carried over verbatim from the mockup's own
 * per-question `options` array, for T3.4's client flow to read from directly.
 */
const DIAGNOSTIC_DIMENSIONS: Array<{ id: number; name: string; weight: number }> = [
  { id: 1, name: "Structure", weight: 1 },
  { id: 2, name: "Records", weight: 1 },
  { id: 3, name: "Cash Control", weight: 1 },
  { id: 4, name: "Funding Readiness", weight: 1 },
  { id: 5, name: "Owner Dependence", weight: 1 },
];

async function seedDiagnosticDimensions() {
  for (const dimension of DIAGNOSTIC_DIMENSIONS) {
    await prisma.diagnosticDimension.upsert({
      where: { id: dimension.id },
      update: { name: dimension.name, weight: dimension.weight },
      create: dimension,
    });
  }
}

const DIAGNOSTIC_QUESTIONS: Array<{
  dimensionId: number;
  order: number;
  promptText: string;
  responseType: DiagnosticResponseType;
}> = [
  // Dimension 1: Structure
  {
    dimensionId: 1,
    order: 1,
    // Choice options (label → normalized value): "Yes" → 1, "In progress" → 0.5, "Not yet" → 0.
    promptText:
      "Is the business formally registered — incorporated, or a registered business name?",
    responseType: DiagnosticResponseType.choice,
  },
  {
    dimensionId: 1,
    order: 2,
    promptText: "Do the people working in the business have clearly defined roles?",
    responseType: DiagnosticResponseType.scale,
  },
  {
    dimensionId: 1,
    order: 3,
    promptText: "Is there a written plan the business is working from, even a simple one?",
    responseType: DiagnosticResponseType.boolean,
  },
  // Dimension 2: Records
  {
    dimensionId: 2,
    order: 1,
    // Choice options: "Regular record-keeping" → 1, "Rough notes" → 0.5, "No record" → 0.
    promptText: "Do you keep a record of sales — even a notebook or a spreadsheet?",
    responseType: DiagnosticResponseType.choice,
  },
  {
    dimensionId: 2,
    order: 2,
    promptText: "Are business costs and expenses tracked separately from personal spending?",
    responseType: DiagnosticResponseType.scale,
  },
  {
    dimensionId: 2,
    order: 3,
    // Choice options: "12 months or more" → 1, "3–12 months" → 0.66, "1–3 months" → 0.33,
    // "Less than 1 month" → 0.
    promptText: "How many months back could you produce a reasonably complete financial picture?",
    responseType: DiagnosticResponseType.choice,
  },
  // Dimension 3: Cash Control
  {
    dimensionId: 3,
    order: 1,
    promptText:
      "Is money moving between you and the business tracked separately from business cash?",
    responseType: DiagnosticResponseType.scale,
  },
  {
    dimensionId: 3,
    order: 2,
    promptText: "Do you know, roughly, how much customers currently owe the business?",
    responseType: DiagnosticResponseType.boolean,
  },
  {
    dimensionId: 3,
    order: 3,
    promptText: "Do you know, roughly, what the business owes suppliers or lenders?",
    responseType: DiagnosticResponseType.boolean,
  },
  {
    dimensionId: 3,
    order: 4,
    promptText:
      "Does the business use a bank or mobile money account separate from your personal one?",
    responseType: DiagnosticResponseType.boolean,
  },
  // Dimension 4: Funding Readiness
  {
    dimensionId: 4,
    order: 1,
    // Choice options: "Applied, successful" → 1, "Applied, not successful" → 0.5,
    // "Never applied" → 0.
    promptText: "Has the business applied for a loan, grant or investment before?",
    responseType: DiagnosticResponseType.choice,
  },
  {
    dimensionId: 4,
    order: 2,
    promptText:
      "If a lender asked for twelve months of financial statements today, could you produce them?",
    responseType: DiagnosticResponseType.scale,
  },
  {
    dimensionId: 4,
    order: 3,
    promptText:
      "Do you have a clear, specific reason you'd want funding — equipment, stock, expansion?",
    responseType: DiagnosticResponseType.boolean,
  },
  // Dimension 5: Owner Dependence
  {
    dimensionId: 5,
    order: 1,
    promptText: "Could the business run for two weeks without you being reachable?",
    responseType: DiagnosticResponseType.scale,
  },
  {
    dimensionId: 5,
    order: 2,
    promptText:
      "Is there anyone besides you who could make a significant business decision if needed?",
    responseType: DiagnosticResponseType.boolean,
  },
];

async function seedDiagnosticQuestions() {
  for (const question of DIAGNOSTIC_QUESTIONS) {
    await prisma.diagnosticQuestion.upsert({
      where: { dimensionId_order: { dimensionId: question.dimensionId, order: question.order } },
      update: {
        promptText: question.promptText,
        responseType: question.responseType,
        active: true,
      },
      create: { ...question, active: true },
    });
  }
}

const DIAGNOSTIC_THRESHOLDS: Array<{
  id: number;
  dimensionId: number | null;
  thresholdValue: number;
  triagePriorityLevel: string;
}> = [
  // Overall bands (dimensionId: null) — the tightest-fitting band a score falls under wins
  // (lib/diagnostic-scoring.ts's resolveTriageBand).
  { id: 1, dimensionId: null, thresholdValue: 40, triagePriorityLevel: "High" },
  { id: 2, dimensionId: null, thresholdValue: 70, triagePriorityLevel: "Medium" },
  // One per-dimension band each, keyed to DIAGNOSTIC_DIMENSIONS' fixed ids above.
  { id: 3, dimensionId: 1, thresholdValue: 50, triagePriorityLevel: "High" },
  { id: 4, dimensionId: 2, thresholdValue: 50, triagePriorityLevel: "High" },
  { id: 5, dimensionId: 3, thresholdValue: 50, triagePriorityLevel: "High" },
  { id: 6, dimensionId: 4, thresholdValue: 50, triagePriorityLevel: "High" },
  { id: 7, dimensionId: 5, thresholdValue: 50, triagePriorityLevel: "High" },
];

async function seedDiagnosticThresholds() {
  for (const threshold of DIAGNOSTIC_THRESHOLDS) {
    await prisma.diagnosticThreshold.upsert({
      where: { id: threshold.id },
      update: {
        dimensionId: threshold.dimensionId,
        thresholdValue: threshold.thresholdValue,
        triagePriorityLevel: threshold.triagePriorityLevel,
      },
      create: threshold,
    });
  }
}

async function main() {
  // Later epics add their seedX() calls here, in dependency order, as their tables
  // are added to prisma/schema.prisma.
  await seedHomePageContent();
  await seedOffers();
  await seedOfferTiers();
  await seedCapabilitiesPage();
  await seedCapabilities();
  await seedAdvisoryRetainer();
  await seedOurMethodPage();
  await seedMethodStages();
  await seedAboutPage();
  await seedFirmStatement();
  await seedAuthors();
  await seedContactPage();
  await seedSiteSettings();
  await seedLegalPages();
  await seedFooterContent();
  await seedDiagnosticDimensions();
  await seedDiagnosticQuestions();
  await seedDiagnosticThresholds();
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
