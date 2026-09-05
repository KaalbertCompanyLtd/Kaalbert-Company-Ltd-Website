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

import { Prisma, PrismaClient } from "../generated/prisma/client";
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
    practiceArea: string;
    credentials: string | null;
    personalStatement: string;
    order: number;
  }> = [
    {
      name: "Albert Kwakye Amponsah",
      photoUrl: null,
      practiceArea: "Lead Partner · Lead Consultant",
      credentials: null,
      personalStatement:
        "A Ghanaian accounting and finance professional with over fifteen years of disciplined, sector-diverse experience spanning corporate finance, fund administration, real estate, education administration, wood-processing manufacturing and consultancy. Albert brings hands-on expertise in financial modelling, business intelligence, strategic planning and complex data analysis using modern tools and languages.",
      order: 1,
    },
    {
      name: "Ama Wiafe",
      photoUrl: null,
      practiceArea: "Growth, Markets & Clients",
      credentials: null,
      personalStatement:
        "An accomplished operations and finance professional with ten years of experience in financial administration and executive support. Ama's expertise lies in enhancing operational controls while facilitating business growth across multifunctional teams.",
      order: 2,
    },
    {
      name: "Joseph Bordoh",
      photoUrl: null,
      practiceArea: "Technology & Operations",
      credentials: null,
      personalStatement:
        "An IT support and network professional with over ten years of hands-on experience in systems administration, network infrastructure, information security and IT service management. Joseph is skilled in Windows Server, Active Directory, Office 365, VLANs, IP telephony, ERP support and user training, with a proven record of keeping business systems stable and reliable.",
      order: 3,
    },
    {
      name: "John Dogbey",
      photoUrl: null,
      practiceArea: "Financial Reporting & Tax",
      credentials: "Chartered Accountant",
      personalStatement:
        "A chartered accountant and MBA Finance graduate with over ten years of experience in financial reporting, tax compliance, management and cost accounting, and in-depth financial analysis across regulatory and commercial environments. John prepares IFRS-compliant financial statements, establishes internal controls, builds budgets with variance analysis and forecasts cash flow, working fluently in Power BI and Tableau to turn numbers into decisions.",
      order: 4,
    },
    {
      name: "Evans Agyemang",
      photoUrl: null,
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
