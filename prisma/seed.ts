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
import type { ArticleBodyBlock } from "../lib/insights";
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

/**
 * T3.6/T7.7 (session 22) — the visitor-facing score bands `app/diagnostic/results/page.tsx`
 * reads via `lib/diagnostic-flow.ts`'s `getScoreBand`. Carried over verbatim from
 * `ui/mockups/c-diagnostic/diagnostic-results.html`'s own `BANDS` array (labels + statements),
 * which that mockup's own comment already flags as illustrative placeholder reserved to firm
 * authorship — same treatment as the question set (T3.3): not fabricated fresh, not presented
 * as final. Upserted by fixed literal `id` (no natural key), same convention as
 * `DIAGNOSTIC_DIMENSIONS`/`DIAGNOSTIC_THRESHOLDS` above.
 */
const DIAGNOSTIC_SCORE_BANDS: Array<{
  id: number;
  minScore: number;
  label: string;
  statement: string;
  emailDetail: string;
}> = [
  {
    id: 1,
    minScore: 80,
    label: "Strong Foundation",
    statement:
      "This is a business whose numbers could support a serious conversation with a lender or investor today. The firm's attention here would sharpen the edges, not rebuild the foundation.",
    emailDetail:
      "Structure, records and cash control are all above the mark that typically satisfies a lender or investor's opening questions. That doesn't mean every gap is closed — it usually means the remaining ones are specific rather than structural: a missing management account for the current quarter, an owner-dependence issue that only shows up once someone tries to step away, or a funding application that would move faster with one or two documents already prepared.\n\nA partner reviewing this result would usually start with whichever dimension scored lowest above, since that is almost always where the next real question comes from — not from a business that looks weak overall, but from the one specific area a due-diligence process would test first.",
  },
  {
    id: 2,
    minScore: 60,
    label: "Developing, With Real Gaps",
    statement:
      "The basics are mostly in place, but at least one area — often exactly the one flagged below — is the kind of gap a lender or credit committee tests first.",
    emailDetail:
      "A score in this range usually means the day-to-day running of the business is sound, but the paperwork and structure a lender, investor or serious buyer would ask for hasn't caught up to how the business actually operates.\n\nThis is the range where the same conversation repeats itself most often: an owner who knows every number in their head, but can't yet hand over a document that proves it to someone else. The weakest dimension flagged above is typically the one that surfaces first in a facility application or a buyer's due-diligence request — closing that specific gap is usually a matter of weeks of focused work, not a rebuild of the business.",
  },
  {
    id: 3,
    minScore: 40,
    label: "Workable, Not Yet Provable",
    statement:
      "The business runs day to day, but several of the things a lender, investor or serious buyer would ask for aren't yet in a form you could hand over.",
    emailDetail:
      "The business functions — sales happen, obligations get met, decisions get made — but much of what makes it functional currently depends on the owner's own knowledge and judgement rather than a record or process a third party could review.\n\nAt this range, a lender, investor or credit committee would typically stop at the first request for evidence, not because the business is unhealthy, but because nothing yet demonstrates that health independently of the person running it. The dimensions flagged above are usually the fastest, highest-leverage places to start — not because they're the only gaps, but because they're the ones most likely to be asked about next.",
  },
  {
    id: 4,
    minScore: 0,
    label: "Running on Memory",
    statement:
      "Common, and fixable — but right now, much of what keeps this business running exists in memory rather than in a record anyone else could pick up.",
    emailDetail:
      "This range is common, and rarely a sign the business itself is in trouble — it usually means the business has grown past the point where memory and informal habit can keep up, and the systems around it haven't caught up yet.\n\nThe risk isn't today's operations; it's what happens the first time someone outside the business — a lender, a new partner, a buyer, even a key employee's sudden absence — needs something the business currently can't produce on paper. The dimensions flagged above are the ones creating the most exposure right now, and are usually where a firm would start.",
  },
];

async function seedDiagnosticScoreBands() {
  for (const band of DIAGNOSTIC_SCORE_BANDS) {
    await prisma.diagnosticScoreBand.upsert({
      where: { id: band.id },
      update: {
        minScore: band.minScore,
        label: band.label,
        statement: band.statement,
        emailDetail: band.emailDetail,
        isPlaceholder: true,
      },
      create: { ...band, isPlaceholder: true },
    });
  }
}

/**
 * T4.2 — the Insights index's own hero copy, via the shared `page` entity (same pattern as
 * capabilities/our-method/about/contact — CLAUDE.md's Recurring Patterns: "the home for a
 * marketing page's own copy when it has no other entity to attach to"). Sourced verbatim from
 * `ui/mockups/b-insights/insights-index.html`'s `.page-hero` section — treated as accepted
 * real copy, not placeholder, same as every other page-hero seeded so far. This task seeds no
 * `article`/`category`/`author` content itself (T4.4's own job); this is only the static
 * hero/meta chrome around the (possibly still-empty) article list.
 */
async function seedInsightsPage() {
  await prisma.page.upsert({
    where: { slug: "insights" },
    update: {},
    create: {
      slug: "insights",
      heroKicker: "Insights",
      heroHeading: "What we'd tell you in a first meeting — written down",
      heroLead:
        "Analysis from the partners themselves, on the specific problems that bring a founder to us in the first place. Not generic advice — the questions this market actually asks.",
      introCopy: null,
      metaTitle: "Insights — Kaalbert & Company Ltd",
      metaDescription:
        "Analysis from Kaalbert & Company's own partners on the specific problems that bring a founder to an advisory firm in the first place.",
      isPlaceholder: false,
    },
  });
}

/**
 * T4.4 (session 27) — the firm's real Insights content: 8 completed articles across two
 * editorial volumes (Document 13.03 §7/§13; full source at `Company Docs/11 Thought
 * Leadership/11.02`–`11.10 Insight *.docx`), reproduced verbatim from the firm's own written
 * copy. `isPlaceholder: false` on every row — this is real, firm-authored content, not the
 * mockup's illustrative stand-in.
 *
 * Two things Document 13.03 §13 itself flags as still outstanding at the time this content
 * was written are resolved here as editorial judgement calls, not fabrication: `authorId`
 * attribution (the source text is attributed generically to "Kaalbert & Company Ltd", not a
 * named partner — §13's own line: "Requires web formatting, author attribution, search
 * titles and preview images") is assigned per article by subject-matter fit against the
 * firm's five real practice areas, and `categorySlug` groups the 8 articles under 6 real,
 * non-fabricated categories reflecting the editorial note's own stated themes (see the
 * `INSIGHTS_CATEGORIES` list below) rather than 8 one-article categories or the mockup's
 * fictional two-category split. Full per-article mapping and reasoning in
 * `memory/decision-log.md` (session 27).
 *
 * `previewImage` stays null for every row — §13 lists "preview images" as still outstanding
 * (a photographer/designer deliverable, not something this seed script can produce) — falling
 * back to the site's default OG image (`lib/seo.ts`'s `buildPageMetadata`) until real ones
 * exist, same graceful-degradation precedent as `SiteSettings.responseTimeCommitment`.
 *
 * `nextStepCta` per article is adapted (condensed, not invented) from that same article's own
 * "How Kaalbert can help" closing section in the source document — the seed's `body` array
 * deliberately excludes that section (and the trailing "general guidance" disclaimer
 * paragraph) so it isn't rendered twice.
 *
 * `publishedAt` dates are spread biweekly from 2026-06-01 to 2026-09-01, matching Document
 * 13.03 §7's stated "two articles per month" launch cadence — a seed-time construct (the
 * articles are being seeded together, not published incrementally as this cadence implies)
 * so the index/Home's "most recent" ordering and pagination have real, distinct dates to sort
 * against rather than 8 identical timestamps.
 */
const INSIGHTS_CATEGORIES = [
  { name: "Structure & Formalisation", slug: "structure-formalisation" },
  { name: "Funding & Capital", slug: "funding-capital" },
  { name: "Growth & Strategy", slug: "growth-strategy" },
  { name: "Leadership & Team", slug: "leadership-team" },
  { name: "Cash & Financial Discipline", slug: "cash-financial-discipline" },
  { name: "Customers & Decisions", slug: "customers-decisions" },
] as const;

type ArticleBodyBlockSeed = ArticleBodyBlock;

const INSIGHTS_ARTICLES: Array<{
  slug: string;
  title: string;
  excerpt: string;
  body: ArticleBodyBlockSeed[];
  authorName: string;
  categorySlug: string;
  publishedAt: string;
  nextStepCta: { heading: string; body: string; label: string; href: string };
}> = [
  {
    slug: "structure-is-the-real-capital",
    title: "Structure Is the Real Capital",
    excerpt:
      "Why the unglamorous work of formalising a business is the first capital it ever raises.",
    authorName: "Evans Agyemang",
    categorySlug: "structure-formalisation",
    publishedAt: "2026-06-01",
    nextStepCta: {
      heading: "If this sounds familiar, start with a free Business Health Check",
      body: "We help businesses formalise properly — not just registered, but structured: legal identity, clean finances, basic governance, and a compliance rhythm that keeps you in good standing.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "Across Ghana, capable founders spend their energy chasing money they cannot get — a loan that never comes, an investor who never commits, a grant that never lands — while overlooking the one thing that would make all of it reachable. Before a business can raise capital, it must first become the kind of business that capital can recognise. That transformation has a name. We call it structure, and it is the first capital any enterprise ever raises.",
      },
      { kind: "heading", text: "The certificate is not the point" },
      {
        kind: "paragraph",
        text: "When most owners think about formalising their business, they picture a single document: a certificate that turns a hustle into a company. The certificate matters, but it is the smallest part of the story, and treating it as the destination is why so many newly registered businesses look formal on paper and remain informal in every way that counts.",
      },
      {
        kind: "paragraph",
        text: "Real formalisation is not a piece of paper; it is an architecture. It is a legal identity that exists independently of its owner, so the business can own, contract, borrow, and be trusted in its own name. It is a set of ordered finances, so that the money flowing through the enterprise can be seen, trusted, and explained. It is a basic frame of governance, so that decisions are made deliberately rather than improvised. And it is a rhythm of compliance, so that the business stays in good standing rather than drifting quietly into penalty and risk. The certificate is merely the front door to that architecture. Walking through the door and building nothing behind it is the most common, and most costly, mistake we see.",
      },
      { kind: "heading", text: "The hidden cost of staying informal" },
      {
        kind: "paragraph",
        text: "Informality feels free. It is anything but. An informal business pays a tax that never appears on any return — the tax of being invisible, fragile, and capped.",
      },
      {
        kind: "paragraph",
        text: "It is invisible to finance. A bank cannot lend against a business it cannot see, and it cannot see a business whose money moves through a personal account, whose records live in the owner's head, and whose existence it cannot verify. The most common reason a Ghanaian SME is refused a loan is not that the business is bad; it is that the business is illegible — there is simply nothing for a lender to assess.",
      },
      {
        kind: "paragraph",
        text: "It is fragile. When the business and the owner are legally the same person, the owner's personal assets stand behind every debt and every dispute. A single bad year, a single legal claim, a single difficult partner can reach straight through to the owner's home and savings. The structure that informality avoids is precisely the structure that would have protected the owner.",
      },
      {
        kind: "paragraph",
        text: "And it is capped. An informal business cannot easily take on a serious partner, cannot be cleanly sold, cannot bid for the contracts that require a registered entity and a tax clearance, and cannot scale beyond what the founder can personally hold together. Informality does not just expose a business to risk; it places a ceiling on how large and how valuable that business can ever become.",
      },
      {
        kind: "quote",
        text: "Informality is not a way of saving money. It is a way of paying — quietly, and at the worst possible moments — for the structure you chose not to build.",
      },
      { kind: "heading", text: "What formalisation actually involves in Ghana today" },
      {
        kind: "paragraph",
        text: "Formalising a business in Ghana has become considerably more modern than its reputation suggests. Company registration is now handled by the Office of the Registrar of Companies, an autonomous body established under the Companies Act, 2019 (Act 992) and separated from the older Registrar-General's Department, which now concentrates on matters such as intellectual property, marriages under special licence, and the administration of estates. The Act consolidated and modernised Ghana's company law, simplified the formation process, embraced electronic filing, and lowered the age at which a person may form a company. A private company limited by shares now carries the designation “Limited” or “LTD”, and on incorporation receives a Certificate of Incorporation rather than the older two-stage certification.",
      },
      {
        kind: "paragraph",
        text: "Registration, though, is only the first of several connected steps, and the ones that follow are where many businesses stop too soon. Modern Ghanaian company law requires a business to disclose its beneficial owners — the real human beings who ultimately own or control it — under the Companies Regulations, 2023 (LI 2473), part of a wider drive toward transparency and against illicit finance. A registered company must keep proper records, file annual returns, and remain in good standing on the register rather than lapsing into the quiet non-compliance that catches up with owners later. Alongside the company itself, the business must be registered for tax with the Ghana Revenue Authority and operate through the formal tax system, and depending on its activity it may need sector licences or permits from the relevant regulators.",
      },
      {
        kind: "paragraph",
        text: "None of this is the point of this article — the specific steps and fees change, and the right path depends on the particular business. The point is the shape of the thing: formalisation is not a single act but a connected set of disciplines — legal identity, ownership transparency, tax standing, record-keeping, and compliance — that together make a business real in the eyes of the law, the regulators, and the market.",
      },
      { kind: "heading", text: "Why structure behaves like capital" },
      {
        kind: "paragraph",
        text: "Here is the idea that changes how a founder should see all of this. Structure does not merely protect a business; it actively creates value, in the same way that capital does. It makes the enterprise legible — capable of being read, trusted, and backed by people who were not present at its creation.",
      },
      {
        kind: "paragraph",
        text: "A bank can lend to a structured business because it can finally see what it is lending to. An investor can take a stake because there is a real entity, with clear ownership, to take a stake in. A serious customer or a larger partner can contract with confidence because there is a legal person standing behind the promise. A buyer can one day purchase the business because there is something definable to buy. Each of these is a door that structure opens and that informality keeps shut. The founder who builds structure is not spending money on bureaucracy; they are manufacturing the trust that every future relationship will depend on. That is why we say, without exaggeration, that structure is the first capital a business raises — and the one that makes all other capital possible.",
      },
      { kind: "heading", text: "The myths that keep businesses informal" },
      {
        kind: "paragraph",
        text: "If the case for structure is so strong, why do so many capable businesses remain informal? Usually because of a handful of persistent myths.",
      },
      {
        kind: "paragraph",
        text: "The first is that the business is too small to bother. In truth, the earlier a business builds structure, the cheaper and easier it is — untangling years of mixed personal and business finances is far harder than keeping them clean from the start. The second is that formalising is too expensive; in reality the direct cost of registration is modest relative to the finance, contracts, and protection it unlocks, and the true expense is almost always the cost of staying informal. The third is the fear that formalising is a trap that simply invites tax; but operating informally does not remove tax obligations, it merely converts them into accumulating risk, while formality is what allows a business to manage its tax position properly, claim what it is entitled to, and earn the clean standing that finance and contracts require. The fourth, and most damaging, is later — the belief that structure is something to attend to once the business has grown. It is precisely backwards. Structure is not the reward for growth; it is the precondition for it.",
      },
      { kind: "heading", text: "Build in the right order" },
      {
        kind: "paragraph",
        text: "Because formalisation is an architecture rather than an act, it pays to build it in sequence rather than in a panic. Establish the legal entity properly, with ownership and governance set up cleanly from the start. Separate the business's money from the owner's, and put in place even the simplest reliable system for recording what comes in and what goes out — the single discipline that does more than any other to make a business fundable. Register for tax and treat compliance as a calendar rather than a crisis, so that obligations are met on time rather than discovered late. And put a basic frame of governance around decisions, so the business is run deliberately. Done in this order, each step reinforces the next, and within a few months an informal hustle becomes a legible, fundable, defensible enterprise.",
      },
      {
        kind: "paragraph",
        text: "This is unglamorous work. It will never feel as exciting as a new product or a big sale. But it is the work that determines whether the product and the sale ever add up to a business that lasts — and it is, in our experience, the highest-return work a founder can do.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Capital is not only money. It is anything that makes a business more capable, more trusted, and more able to grow — and by that measure, structure is the first and most fundamental capital any enterprise raises. It is the architecture that makes a business visible to finance, protected from risk, and ready to scale. The founders who understand this stop chasing money they cannot yet reach, and start building the structure that brings the money within reach. The certificate is where it begins. The architecture behind it is where the value lives.",
      },
    ],
  },
  {
    slug: "speaking-the-language-of-capital",
    title: "Speaking the Language of Capital",
    excerpt:
      "Why good businesses get refused funding — and how to become the kind that gets a yes.",
    authorName: "Albert Kwakye Amponsah",
    categorySlug: "funding-capital",
    publishedAt: "2026-06-15",
    nextStepCta: {
      heading: "If you're preparing to raise, the Funding-Readiness Pack is built for exactly this",
      body: "We make businesses fundable — clean financials and a reliable financial history, realistic and defensible projections, and the documentation funders expect.",
      label: "See the Funding-Readiness Pack",
      href: "/offers/funding-readiness-pack",
    },
    body: [
      {
        kind: "paragraph",
        text: "A founder walks into a bank with a profitable business and a genuine need, and walks out with a refusal. It happens every day across Ghana, and the lesson most owners draw from it is the wrong one. They conclude that funding is impossible, or that the system is closed to businesses like theirs. The truth is usually narrower and far more fixable: the business was sound, but it could not yet speak the language that capital understands. That language can be learned — and learning it is often the difference between a no and a yes.",
      },
      { kind: "heading", text: "A good business and a fundable business are not the same thing" },
      {
        kind: "paragraph",
        text: "This is the idea most founders miss, and it is worth stating plainly. A business can be genuinely good — profitable, growing, serving real customers well — and still be unfundable. The two qualities are related but not identical. Being good is about how the business performs. Being fundable is about whether an outsider, with no prior knowledge and money at risk, can look at the business and arrive at confidence. Many excellent Ghanaian businesses are turned down not because they are weak, but because they have never been made legible to the people who might back them.",
      },
      {
        kind: "paragraph",
        text: "The encouraging consequence of this is that fundability is largely within the owner's control. You cannot always change how good a year you have had, but you can almost always change how clearly and credibly your business can be understood by a lender, an investor, or a grant-maker. That work — becoming fundable — is what this article is about.",
      },
      { kind: "heading", text: "The four questions every funder is silently asking" },
      {
        kind: "paragraph",
        text: "Whatever the funder and whatever the form, the same handful of questions sit beneath every funding decision. A founder who understands them can prepare for them; a founder who does not will answer the wrong ones.",
      },
      {
        kind: "paragraph",
        text: "The first is: can I trust these numbers? A funder needs to believe that the financial picture in front of them is accurate and complete. The second is: will I get my money back, with a return appropriate to the risk? A lender wants to see how they will be repaid; an investor wants to see how the business will grow enough to reward their stake. The third is: who am I really backing? Capital is given to people as much as to businesses, and funders look hard at the credibility, character, and command of the founder. The fourth is: what could go wrong, and has this founder thought about it? A founder who has honestly considered the risks is more trusted than one who pretends there are none. Almost everything that makes a business fundable is, at root, a clear and credible answer to these four questions.",
      },
      {
        kind: "quote",
        text: "Funders do not back the business you know yours to be. They back the business they can see, understand, and trust from the outside. Your task is to close the gap between the two.",
      },
      { kind: "heading", text: "Why good businesses get refused" },
      {
        kind: "paragraph",
        text: "When we examine why a sound business has been turned away, the reasons cluster into a few recurring failures — and none of them is about the quality of the business itself.",
      },
      {
        kind: "paragraph",
        text: "The numbers are illegible. The money runs through personal accounts, the records are incomplete or live in the founder's memory, and there is no reliable financial history a funder can assess. Faced with numbers it cannot trust, a funder does not investigate further; it simply declines. Closely related is the absence of credible projections: either there is no forward view at all, or there is one built on hope rather than evidence — a hockey-stick of revenue with no explanation of where it comes from. A funder reads optimistic, unsupported projections not as ambition but as a warning sign.",
      },
      {
        kind: "paragraph",
        text: "The ask is vague. The founder knows they need money but cannot say precisely how much, for exactly what, or what it will achieve — and a funder cannot back a request it cannot pin down. The founder cannot speak to their own numbers, stumbling when asked about margins, costs, or cash flow, which undermines confidence in everything else. And there is no documentation — no business plan, no financial statements, no registration and tax standing in order — so that even a willing funder has nothing to work with. Each of these is a failure of presentation and preparation, not of the underlying business. And each is fixable.",
      },
      { kind: "heading", text: "Match the money to the need" },
      {
        kind: "paragraph",
        text: "Part of speaking the language of capital is knowing which kind of capital you are actually asking for, because the major sources answer to very different logics and seeking the wrong one wastes everyone's time.",
      },
      {
        kind: "paragraph",
        text: "Debt — a bank loan or similar — must be repaid on a schedule regardless of how the business performs, so a lender focuses on certainty: reliable cash flow to service the repayments, security or collateral to fall back on, and the clean standing — registration, tax, records — that signals a dependable borrower. In the Ghanaian context, the weight placed on collateral and on demonstrable cash flow is real, and a business that cannot evidence either will struggle with debt no matter how promising it is. Equity — selling a share of the business to an investor — carries no repayment schedule, but the investor takes on the risk of the business in exchange for a share of its future, and so cares above all about growth, scalability, and a clear, clean ownership structure they can buy into. Grants — from development partners, foundations, or public programmes — answer to yet another logic: they fund a mission or an outcome, and they demand evidence of impact, sound governance, and the accountability to report on how the money was used.",
      },
      {
        kind: "paragraph",
        text: "Seeking equity for a steady, modest business that will never offer an investor a large return is as mismatched as seeking a loan for a venture with no cash flow to service it. Knowing which language you are speaking — and to whom — is the first act of fundraising, not an afterthought.",
      },
      { kind: "heading", text: "The language, learned" },
      {
        kind: "paragraph",
        text: "If those are the failures, the remedy is their mirror image. A fundable business is one that has done the unglamorous work of making itself legible and credible before it asks.",
      },
      {
        kind: "paragraph",
        text: "It has clean books and a real financial history — money that runs through the business's own accounts, records kept reliably, and statements that a funder can trust. It has projections that are realistic and defensible, built from stated assumptions a sceptical reader can follow, so that the forward view reads as judgement rather than wishful thinking. It has a clear, specific ask: a precise amount, for a defined purpose, with an honest account of what the money will achieve and how the funder is rewarded or repaid. It has the documentation a funder expects — a coherent plan, financial statements, and its registration and tax affairs in order — assembled and ready rather than scrambled together under pressure. And it has a founder who knows their own numbers cold, who can explain the business simply and answer hard questions without flinching, because nothing builds a funder's confidence faster than an owner in command of their own enterprise.",
      },
      {
        kind: "paragraph",
        text: "Increasingly, serious funders also expect to find this material assembled in one orderly place — a data room — so that diligence is a matter of reading rather than chasing. A business that can hand over a clean, complete set of information signals, before a single question is asked, that it is run by people who take it seriously.",
      },
      { kind: "heading", text: "The narrative and the numbers must agree" },
      {
        kind: "paragraph",
        text: "There is a craft to fundraising that sits above the documents, and it is this: the story and the numbers must tell the same truth. A compelling narrative with numbers that do not support it reads as salesmanship; rigorous numbers with no narrative to give them meaning read as a spreadsheet. The businesses that raise capital well are those whose story — what they do, why it matters, where it is going — is borne out, line by line, in the evidence behind it. The narrative earns attention; the numbers earn trust; and funding is given only where both are present.",
      },
      { kind: "heading", text: "Readiness is built before you ask" },
      {
        kind: "paragraph",
        text: "The deepest mistake in fundraising is to begin preparing only once the money is needed. By then the timeline is short, the records cannot be rebuilt retroactively, and the pressure shows. Fundability is the product of disciplines installed long before the ask — the clean accounts kept all along, the registration and tax standing maintained from the start, the habit of knowing one's own numbers. The founder who builds these quietly, in the ordinary course of running the business, is the one who, when the opportunity or the need arrives, is ready to walk into the room and speak the language of capital fluently. The work done in calm is what pays in the moment of asking.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Funding is refused far more often for how a business presents than for what it is. The good news in that hard fact is that presentation and preparation are within the founder's control. Becoming fundable is not about changing the nature of your business; it is about making it legible, credible, and ready — answering, before they are asked, the four questions every funder carries into the room. Learn the language of capital, and a great many doors that felt permanently closed turn out merely to have been locked from the inside.",
      },
    ],
  },
  {
    slug: "growth-is-a-discipline-not-a-burst",
    title: "Growth Is a Discipline, Not a Burst",
    excerpt:
      "Why so many businesses break at the very moment they begin to succeed — and how to grow on purpose.",
    authorName: "Ama Wiafe",
    categorySlug: "growth-strategy",
    publishedAt: "2026-06-29",
    nextStepCta: {
      heading: "Not sure where your own growth constraint really is?",
      body: "We help owners grow on purpose — finding the real constraint, choosing where to grow, and building a practical, costed growth plan with owners, timelines, and measures.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "We tend to picture growth as a moment — the big order that changes everything, the month the phone would not stop ringing, the season the business finally took off. It is a seductive picture, and a dangerous one. The businesses that grow and last do not rely on the lucky burst; they build the discipline to grow on purpose. And the cruel irony many owners discover too late is that the moment of apparent success is precisely the moment a poorly prepared business is most likely to break.",
      },
      { kind: "heading", text: "The seductive myth of the burst" },
      {
        kind: "paragraph",
        text: "Almost every founder has felt it: the surge. A large contract lands, demand spikes, revenue jumps, and for a while it feels as though the business has arrived. We celebrate these moments, and we should — they are real opportunities. But we make a quiet error when we mistake the surge for growth itself. A spike is an event. Growth is a trajectory. The two can look identical for a month and could not be more different over a year.",
      },
      {
        kind: "paragraph",
        text: "We have seen the pattern often enough to recognise its shape. The big order that everyone celebrated turns out to require more cash up front than the business has, more capacity than it can deliver, and more management attention than the founder can spare — and the very contract that was meant to make the business ends up nearly breaking it. The surge was not the problem. The absence of the discipline to absorb it was.",
      },
      { kind: "heading", text: "Why businesses break when they grow" },
      {
        kind: "paragraph",
        text: "It is counter-intuitive, but growth does not strengthen a weak business; it exposes it. Every weakness that a business can tolerate at a small scale — the loose cash management, the processes that live in the founder's head, the quality that depends on personal oversight, the single supplier or single customer — becomes magnified and, eventually, fatal as volume rises. Growth is a stress test, and a business that has not built strength in advance fails the test exactly when the stakes are highest.",
      },
      {
        kind: "paragraph",
        text: "The most common way to die from success is to run out of cash while growing. This surprises owners, because the business is profitable on paper and busier than ever. But growth consumes cash before it returns it: you must buy the stock, pay the staff, and fund the work long before the customer pays you. A business growing faster than its cash can support will hit a wall while its order book is full — a phenomenon painful enough to have its own name among advisers: growing broke. Alongside cash, the other constraints bite in turn. Systems that worked when the founder could see everything collapse when they cannot. Quality slips when volume outruns the capacity to deliver well, and the reputation built over years erodes in weeks. And the founder, trying to hold it all together personally, becomes the bottleneck through which every decision must pass. None of these is a failure of ambition. Each is a failure of preparation.",
      },
      {
        kind: "quote",
        text: "Growth does not fix a fragile business. It magnifies it. The weaknesses you tolerate at a small scale are the ones that break you at a larger one.",
      },
      { kind: "heading", text: "Growth is a system, not luck" },
      {
        kind: "paragraph",
        text: "If the burst is a myth and growth exposes weakness, what does deliberate growth actually look like? It looks like a system — a set of disciplines that a business installs so that growth, when it comes, is something the business can carry rather than something that carries it away. The owner who treats growth as a discipline asks a different set of questions from the one who waits for the surge. Not simply how do I sell more, but: what is actually holding my business back; where, specifically, should I grow; can I fund it; can I deliver it well; and how will I know it is working? Those questions, taken seriously, turn growth from a hope into a plan.",
      },
      { kind: "heading", text: "Find the one thing holding you back" },
      {
        kind: "paragraph",
        text: "Every business has a binding constraint — the single factor that, more than any other, caps how much it can grow right now. It might be cash. It might be the founder's own time. It might be production capacity, a shortage of skilled people, a weak sales process, or a quality problem that limits repeat business. The discipline of growth begins with finding that constraint honestly, because effort poured anywhere else is largely wasted. A business that doubles its marketing when its real constraint is delivery capacity will simply generate orders it cannot fulfil — spending money to damage its own reputation. Growth accelerates when you identify the true bottleneck and concentrate your effort there; once it is relieved, a new constraint emerges, and the discipline repeats. Growth, properly understood, is the patient business of finding and lifting one ceiling after another.",
      },
      { kind: "heading", text: "Choose where to grow — and where not to" },
      {
        kind: "paragraph",
        text: "Growth is also a series of choices, and focus beats scatter every time. Broadly, a business can grow by selling more of what it already sells to the customers it already has; by selling the same thing to new customers; by offering new things to its existing customers; or by entering entirely new products and new markets at once. These paths are not equal in risk. Doing more of what already works, for people who already buy, is the surest ground; venturing into new products and new markets simultaneously is the riskiest, because the business is learning everything at once. There is no single right answer — but there is a discipline: choose deliberately, concentrate your limited resources on a small number of growth moves, and resist the temptation to chase every opportunity at once. A business pursuing five directions with the resources for one grows in none of them.",
      },
      { kind: "heading", text: "Fund the growth before it starves you" },
      {
        kind: "paragraph",
        text: "Because growth consumes cash before it returns it, no growth plan is complete without a clear answer to how it will be funded. This is the discipline owners most often skip, and the one that most often proves fatal. Before committing to a growth move, a serious owner works out how much cash it will absorb and for how long — the stock to be bought, the wages to be paid, the gap between doing the work and being paid for it — and ensures the business can cover that gap from its own reserves, from managed terms with suppliers and customers, or from external finance arranged in advance. Growth funded on a hope that the cash will somehow appear is the most common way a thriving business fails. The discipline is simple to state and hard to keep: never commit to growth you have not funded.",
      },
      { kind: "heading", text: "Grow only as fast as you can grow well" },
      {
        kind: "paragraph",
        text: "There is a speed limit to healthy growth, and it is set by the business's ability to deliver at the standard its reputation depends on. A business that grows past that limit — taking on more than it can serve well — trades short-term revenue for long-term damage, as disappointed customers, slipping quality, and an overstretched team erode the very thing that made the business worth growing. The discipline here is restraint: to match the pace of growth to the pace at which the business can build the capacity, the systems, and the people to support it. Sometimes the most valuable growth decision a founder makes is to say not yet — to turn down an opportunity the business cannot yet honour, in order to protect the reputation on which all future opportunities depend.",
      },
      { kind: "heading", text: "Make it a plan, not a hope" },
      {
        kind: "paragraph",
        text: "Finally, deliberate growth is written down. A growth ambition that lives only in the founder's head is a wish; a growth plan is a costed sequence of moves, each with an owner, a timeline, a budget, and a measure of success, reviewed honestly as it unfolds. The plan need not be elaborate — for most businesses, a clear page that names the constraint to be lifted, the growth move chosen, the cash required, who is responsible, by when, and how progress will be judged is worth more than a hundred pages of strategy that no one acts on. What matters is that growth becomes something the business manages on purpose, with the evidence in front of it, rather than something it reacts to after the fact.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "The lucky burst makes a good story, but it makes a poor strategy. Durable growth is a discipline: the discipline of finding the real constraint, choosing where to grow, funding it before it starves you, growing only as fast as you can grow well, and managing the whole as a plan rather than a hope. Businesses that internalise this stop waiting for the surge and start building the system that turns opportunity into lasting growth — and, just as importantly, stop breaking at the very moment they begin to succeed.",
      },
    ],
  },
  {
    slug: "the-business-that-can-run-without-you",
    title: "The Business That Can Run Without You",
    excerpt:
      "Why founder dependence is the hidden ceiling on most owner-led businesses — and how to lift it.",
    authorName: "Joseph Bordoh",
    categorySlug: "leadership-team",
    publishedAt: "2026-07-13",
    nextStepCta: {
      heading: "Not sure how much your business depends on you?",
      body: "We help founders build the business beyond themselves — documenting how the business runs, designing roles and delegation that actually free your time, and putting systems in place so quality no longer depends on you.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "There is a simple, uncomfortable test that reveals more about the health of a business than any financial statement: what would happen if the founder disappeared for a month? For a great many otherwise successful businesses in Ghana, the honest answer is that everything would slow, falter, and eventually stop. The business does not really run; the founder runs it, and the business is the shadow they cast. Building a business that can run without you is the work that turns a demanding job into a durable asset — and it is, for most owners, the single most valuable transformation they will ever make.",
      },
      { kind: "heading", text: "The hidden ceiling" },
      {
        kind: "paragraph",
        text: "Most owner-led businesses have a ceiling, and the ceiling is the owner. In the early days this is not only natural but necessary — the founder does everything because there is no one else, and their energy, judgement, and relationships are the business. The trouble comes when the business grows but the dependence does not change. The founder remains the person who makes every decision, holds every key relationship, carries every important piece of knowledge, and personally guarantees the quality of the work. The business can grow only as far as one person can stretch, and one person, however capable, does not stretch very far.",
      },
      {
        kind: "paragraph",
        text: "This is the trap of being indispensable. It feels like strength — the owner is needed, in control, at the centre of everything. In reality it is the most binding limit on the business's future. A founder who cannot be removed from the daily running of the business has not built a company; they have built a job that depends entirely on them, and a job cannot be scaled, cannot be easily sold, and cannot survive its holder.",
      },
      { kind: "heading", text: "Are you the bottleneck?" },
      {
        kind: "paragraph",
        text: "The symptoms of founder dependence are not hard to spot once you look for them. Every meaningful decision routes through you, and work stalls when you are unavailable. You cannot take a genuine break without the business suffering, because there is no one who can hold it in your absence. The most important knowledge — how things are really done, who the key relationships are with, why decisions were made — lives in your head rather than in any system. Customers and suppliers ask for you by name and will deal with no one else. And growth has quietly stalled at the level of your personal capacity, because the business simply cannot do more than you can personally oversee. If several of these are true, the business has reached its founder's ceiling, and no amount of working harder will raise it — working harder only confirms the dependence.",
      },
      {
        kind: "quote",
        text: "If your business cannot run for a month without you, you do not own a business. You own a job that owns you.",
      },
      { kind: "heading", text: "Why it happens" },
      {
        kind: "paragraph",
        text: "Founder dependence is not a character flaw; it is the natural residue of how businesses begin. At the start the founder genuinely is the business — the salesperson, the bookkeeper, the quality controller, the decision-maker — and the habits formed in that period are hard to break. Doing it yourself feels faster and safer than explaining it to someone else, and in the short term it often is. There is pride in being needed, and a quiet fear that no one else will do it to the same standard. In many Ghanaian businesses, founder-led and family-owned, these instincts are reinforced by culture and by the weight of personal responsibility the owner carries for staff and family alike. All of this is understandable. None of it changes the fact that the instinct which built the business in its first phase is the very instinct that will cap it in its next.",
      },
      { kind: "heading", text: "The cost of being indispensable" },
      {
        kind: "paragraph",
        text: "The price of founder dependence is paid in several currencies. The business cannot grow past the founder, because the founder is the bottleneck through which everything must pass. It is dangerously fragile: an illness, an emergency, or simply exhaustion can bring the whole enterprise to a halt, and the business has no resilience independent of one person's presence. It cannot be sold for what it should be worth, because a buyer is not purchasing a business — they are purchasing the founder, who will not come with the sale, and they price that risk ruthlessly or walk away. It is harder to fund, because lenders and investors recognise key-person risk and discount for it. And it exacts a personal cost that owners rarely admit: the founder can never truly rest, never step back, never be free, because the machine stops when they do. The ultimate irony is that the indispensable founder has worked relentlessly to build something that looks like success but functions like a trap.",
      },
      { kind: "heading", text: "Building the business beyond yourself" },
      {
        kind: "paragraph",
        text: "Lifting the founder ceiling is not a single act but four connected shifts, each of which moves a piece of the business from the founder's person into the business itself.",
      },
      {
        kind: "paragraph",
        text: "The first is to document it — to get the business out of your head and into the open. The knowledge that lives only in the founder's memory must be written down: how the core work is done, who the key relationships are and on what terms, the standards that define acceptable quality, the reasons behind important decisions. Documentation is the foundation of everything that follows, because nothing can be delegated, systematised, or governed while it exists only as the founder's private knowledge.",
      },
      {
        kind: "paragraph",
        text: "The second is to delegate it — and to delegate responsibility, not merely tasks. Handing someone a list of instructions while keeping every decision for yourself changes nothing; it simply makes the founder a bottleneck with helpers. Real delegation means giving capable people ownership of outcomes, the authority to make the decisions that go with them, and — hardest of all — the room to do things differently and occasionally to get them wrong. A founder who can only delegate work they would have done identically has not delegated at all. The discipline is to define the outcome and the boundaries, and then to let go of the method.",
      },
      {
        kind: "paragraph",
        text: "The third is to systematise it — to build processes so that quality and consistency do not depend on the founder's personal oversight. When the way work is done is captured in clear, repeatable systems, the business can deliver to a reliable standard whether or not the owner is watching, and new people can be brought up to that standard quickly. Systems are what allow a business to be the same business on a day the founder is absent as on a day they are present.",
      },
      {
        kind: "paragraph",
        text: "The fourth is to govern it — to put in place the decision-making structures that let the business steer itself. This means clear rules about who can decide what, a team capable of making sound decisions without the founder, and, as the business matures, a genuine governance layer — a leadership team, and in time an advisory board or board — that holds the business to its direction and standards. Governance is what finally separates the business as an institution from the founder as an individual.",
      },
      { kind: "heading", text: "The founder's changing role" },
      {
        kind: "paragraph",
        text: "These shifts demand something difficult of the founder: a change in their own role. The work that built the business — doing everything personally — is not the work that grows it. As the business matures, the founder's job must move from doing the work to building the organisation that does the work; from being the business to leading it; from working in the business to working on it. This is not a demotion but a promotion, and it is the only path by which a founder-led venture becomes a company that can outgrow and outlast its founder. The founders who make this shift discover that they have not made themselves redundant — they have made themselves leaders.",
      },
      { kind: "heading", text: "The payoff" },
      {
        kind: "paragraph",
        text: "A business that can run without its founder is transformed in every dimension that matters. It is resilient, able to weather the absence, illness, or eventual succession of any individual. It is valuable and sellable, because a buyer is purchasing a functioning enterprise rather than betting on one irreplaceable person. It is more fundable, because the key-person risk that frightens lenders and investors has been deliberately reduced. It can scale, because it is no longer capped by a single person's capacity. And it gives the founder something they may have forgotten was possible: the freedom to step back, to think, to start something new, or simply to rest — secure in the knowledge that what they built will stand without them. That is the difference between owning a job and owning an asset.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "The ultimate test of a business is whether it can run without you, and for most owner-led businesses the honest answer, at first, is no. That is not a verdict on the founder's ability; it is the natural condition of a business that has not yet been built beyond its owner. Lifting the founder ceiling — by documenting, delegating, systematising, and governing — is the work that turns a demanding job into a durable institution. It is rarely urgent, which is exactly why it is so often neglected. But it is, in the end, the work that determines whether what you have built is a business at all, or merely a very impressive way of being indispensable.",
      },
    ],
  },
  {
    slug: "cash-is-the-truth",
    title: "Cash Is the Truth",
    excerpt:
      "Why profit can lie, why cash cannot, and how to manage the lifeblood of a Ghanaian business.",
    authorName: "John Dogbey",
    categorySlug: "cash-financial-discipline",
    publishedAt: "2026-07-27",
    nextStepCta: {
      heading:
        "If your numbers don't reconcile to your bank balance, the Financial Clarity Pack is built for exactly this",
      body: "We help businesses see and manage their cash — building simple cash-flow forecasts, tightening the cash conversion cycle, and putting in place the receivables, inventory and supplier disciplines that quietly free up money the business already has.",
      label: "See the Financial Clarity Pack",
      href: "/offers/financial-clarity-pack",
    },
    body: [
      {
        kind: "paragraph",
        text: "Many profitable businesses fail. That sentence sounds like a contradiction, and it is among the most important things an owner can understand. Few businesses fail because they were unprofitable on paper; most fail because, at some moment, they simply ran out of cash. In Ghana, where credit is expensive and customers pay late, cash is the quiet constraint that decides which businesses survive long enough to prove their profit.",
      },
      { kind: "heading", text: "Profit is an opinion; cash is a fact" },
      {
        kind: "paragraph",
        text: "Profit is an accounting construct. It depends on judgements — when a sale is counted, how costs are spread, what is treated as an asset. A business can show a healthy profit while its bank account runs dry, because that profit is sitting in unpaid invoices and unsold stock rather than in money it can use. Cash is different. Cash is simply what is in the account. It cannot be massaged, deferred or assumed. The owners who survive are the ones who watch cash as closely as they watch sales.",
      },
      { kind: "heading", text: "The cash conversion cycle" },
      {
        kind: "paragraph",
        text: "Every business spends cash before it earns it. It buys stock, pays staff and covers costs, and only later does the customer pay. The gap between cash going out and cash coming back is the cash conversion cycle, and it is the single most important number most owners have never calculated. The longer that gap, the more cash the business must find to fund its own operations, and the more vulnerable it is to a single slow month. Shortening the cycle frees up cash without raising a single cedi from anyone.",
      },
      { kind: "heading", text: "Where Ghanaian businesses lose cash" },
      {
        kind: "paragraph",
        text: "Cash leaks in predictable places. It sits in receivables, when goods and services are sold on credit and customers are slow to pay. It sits in inventory, on shelves and in storerooms, as money the business cannot touch. It leaks through supplier terms, when a business pays too early while it is paid too late. It is caught out by tax and obligations that arrive on a timetable the business did not plan for. And, in a cruel paradox, it is consumed by growth itself: a fast-growing business buys more stock and extends more credit ahead of the cash it will eventually earn, and can grow itself straight into a crisis.",
      },
      { kind: "heading", text: "Managing cash deliberately" },
      {
        kind: "paragraph",
        text: "Managing cash is a discipline, not a talent, and it begins with seeing it. Forecast cash, not just profit — a simple rolling view of the next ninety days is enough to turn surprises into decisions. Invoice the moment work is done, and collect with polite persistence. Negotiate terms in both directions: faster from customers, slower from suppliers. Hold a buffer for the lean months that every business has. And treat a sale as unfinished until the money has actually landed.",
      },
      {
        kind: "quote",
        text: "A sale is not a sale until the money is in the account. Until then, it is a hope with paperwork.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Profit pays the ego; cash pays the bills. The owner who manages cash as deliberately as sales builds a business that survives the thin months and lives long enough to enjoy the profitable ones. Watch the cash, and the business earns the chance to prove the profit.",
      },
    ],
  },
  {
    slug: "pricing-is-strategy",
    title: "Pricing Is Strategy",
    excerpt: "The most powerful lever most businesses never deliberately pull.",
    authorName: "Ama Wiafe",
    categorySlug: "growth-strategy",
    publishedAt: "2026-08-10",
    nextStepCta: {
      heading: "Not sure if you're leaving margin on the table?",
      body: "We help businesses price with intent — understanding their true costs and margins, the value they create for customers, and what the market will bear, then building pricing that protects profit without losing the customers who matter.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "Ask a business owner how they set their prices, and many will describe something closer to instinct than strategy: cost plus a little, or whatever the competitor charges, or whatever the market seems willing to bear this week. Yet price is the most powerful lever a business has. A small change in price, if customers stay, flows almost entirely to profit — far more directly than a comparable effort on cost or volume. For a lever that powerful, it deserves far more thought than most businesses give it.",
      },
      { kind: "heading", text: "Price is a decision, not an accident" },
      {
        kind: "paragraph",
        text: "Most owners agonise over costs and chase sales, while setting price almost casually — as if it were handed down by the market rather than chosen by the business. But price is a choice, and one of the most consequential a business makes. A ten per cent increase in price, if volume holds, can transform profitability in a way a ten per cent cut in costs rarely matches, because price falls straight to the bottom line. Price deserves at least as much deliberate thought as the costs owners scrutinise so carefully.",
      },
      { kind: "heading", text: "What underpricing really costs" },
      {
        kind: "paragraph",
        text: "Underpricing feels generous, even safe. It is neither. It is a tax the business levies on its own future. It starves the business of the margin it needs to invest, to pay its people well, and to withstand a shock. It quietly signals that the business is worth less than it is. And it is painfully hard to undo, because customers anchor to the low price and resent its correction. Many busy businesses are busy and broke at the same time, and the reason is almost always the same: they are underpriced.",
      },
      { kind: "heading", text: "Cost-plus is not a strategy" },
      {
        kind: "paragraph",
        text: "Pricing up from cost ignores the only thing that matters to the customer: value. Two businesses with identical costs can command very different prices, depending on the value they create and the confidence they project. Cost tells you the floor below which you must not go; it tells you nothing about the ceiling. The question that sets a price is not ‘what did this cost me?’ but ‘what is this worth to the customer?’",
      },
      { kind: "heading", text: "Pricing with intent" },
      {
        kind: "paragraph",
        text: "Pricing well is a discipline. Know your value — what problem you solve, and what it is worth to the people you solve it for. Recognise that not all customers are the same; some will pay more for more, and serving them well is not greed but good business. Have the courage to charge for quality rather than apologising for it. And review prices deliberately and regularly, rather than only when forced to. Raising a price is uncomfortable; remaining underpriced is, in time, fatal.",
      },
      {
        kind: "quote",
        text: "Underpricing is not a gift to your customers. It is a loan to them, repaid out of your business’s future.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Price is where strategy meets the bank account. The owner who prices with intent — from value rather than cost alone, and with the nerve to charge what the work is worth — gives the business the margin it needs to grow, invest and endure. The price you set is the strategy you have chosen, whether you meant to choose it or not.",
      },
    ],
  },
  {
    slug: "evidence-over-instinct",
    title: "Evidence Over Instinct",
    excerpt: "Why the founders who win are the ones who let the market correct them.",
    authorName: "Albert Kwakye Amponsah",
    categorySlug: "customers-decisions",
    publishedAt: "2026-08-24",
    nextStepCta: {
      heading: "Deciding on evidence, not instinct, starts with an honest read of where you stand",
      body: "We help businesses decide with evidence — understanding their customers and markets through research and feasibility work, testing the assumptions behind important decisions, and turning what the market is telling them into clear, confident choices.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "Every business is built on assumptions — about what customers want, what they will pay, how they will behave. Most of those assumptions are never tested; they are simply believed, often deeply. And the most expensive mistakes a business makes are rarely the decisions that turn out wrong after careful thought. They are the assumptions it never thought to question at all.",
      },
      { kind: "heading", text: "The most expensive assumption is the one you never test" },
      {
        kind: "paragraph",
        text: "Founders fall in love with their idea of the customer. They build for the market they imagine — the one that thinks like them, values what they value, and behaves as they would. Then they meet the market that actually exists, which is stubbornly its own. The gap between the imagined customer and the real one is where money, time and effort quietly disappear, and it is widest precisely where the founder is most certain.",
      },
      { kind: "heading", text: "Selling to the market you have" },
      {
        kind: "paragraph",
        text: "The market does not care what a business intended. It responds only to what is offered, in the terms it understands. The discipline is to study the market you actually have rather than the one in your head — who really buys, and why; what they value and what they ignore; what makes them choose you, and what makes them leave. A business that listens to that market, and sells to it, will outperform a cleverer business that is busy arguing with it.",
      },
      { kind: "heading", text: "Cheap ways to learn the truth" },
      {
        kind: "paragraph",
        text: "Learning the truth does not require a research budget. Talk to customers — and listen, rather than pitch. Watch what people do, not only what they say, because behaviour is far more honest than opinion. Test small before betting big: a modest experiment can save a costly mistake. And pay particular attention to the customers who leave, because they will tell you, in their absence, what the ones who stay are too polite to say.",
      },
      { kind: "heading", text: "Deciding with evidence" },
      {
        kind: "paragraph",
        text: "Deciding well is mostly a matter of honesty. Separate what you actually know from what you merely assume. Identify the few assumptions on which a decision truly rests, and test those before you commit. And then let the evidence change your mind when it should. The strongest founders are not the most certain; they are the ones who hold their ideas firmly and their assumptions loosely.",
      },
      {
        kind: "quote",
        text: "The market is the only opinion that pays. Everything else is a guess wearing confidence.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Instinct gets a business started; evidence keeps it from going wrong. The owner who treats the market as a teacher rather than a judge — who tests, listens, and allows reality to correct them early — makes fewer expensive mistakes and notices opportunities the merely confident miss. In business, being corrected early is cheap. Being corrected by failure is not.",
      },
    ],
  },
  {
    slug: "people-are-the-plan",
    title: "People Are the Plan",
    excerpt: "Why the hardest part of growing a business is becoming the leader it needs.",
    authorName: "Joseph Bordoh",
    categorySlug: "leadership-team",
    publishedAt: "2026-09-01",
    nextStepCta: {
      heading: "Not sure where your business depends on you most?",
      body: "We help businesses build their people — from organisation design, roles and recruitment to performance systems, delegation, and the shift from a founder-led business to a team-led one.",
      label: "Take the free Business Health Check",
      href: "/diagnostic",
    },
    body: [
      {
        kind: "paragraph",
        text: "There comes a point in the life of every growing business when the founder becomes the constraint. The very thing that built the business — the founder doing everything, deciding everything, holding everything together — becomes the thing that limits it. Beyond that point, the business can no longer grow on the founder’s effort. It can only grow on other people.",
      },
      { kind: "heading", text: "A business can only grow as far as its people" },
      {
        kind: "paragraph",
        text: "A business is, in the end, the sum of what its people can do. A capable founder can carry a business to a certain size alone, through sheer effort and long hours. But past that size, every further step depends on building people who can carry parts of the load, and carry them well. The ceiling on a growing business is rarely the market or the money. It is usually the people, and the founder’s willingness to build them.",
      },
      { kind: "heading", text: "From doing to leading" },
      {
        kind: "paragraph",
        text: "The hardest transition a founder ever makes is from doing the work to leading those who do it. It means letting go of tasks the founder does better and faster than anyone — not because they have stopped mattering, but so the founder can do the one thing only they can do, which is to lead. Many businesses stall at exactly this point, with a talented founder trapped doing a hundred jobs, none of which is the job of building the business.",
      },
      { kind: "heading", text: "Hiring, delegating, developing" },
      {
        kind: "paragraph",
        text: "Building people is a discipline with three parts. Hire for what the business will need, not only for today’s gap, and hire deliberately rather than in a panic. Delegate real responsibility, not merely tasks — and accept that it will not be done exactly as the founder would do it, which is both the price and the point of delegation. And develop people on purpose: too many businesses hire and hope, when they should hire and grow, turning ordinary recruits into capable people over time.",
      },
      { kind: "heading", text: "Building a team that does not need you for everything" },
      {
        kind: "paragraph",
        text: "The goal is not a team that depends on the founder, but one that can run well when the founder is not in the room. That requires systems and standards people can follow, decisions they are trusted to make, and a culture that holds when no one is watching. It is the quiet, unglamorous work of turning a personal hustle into an institution — and it is, in the end, the truest measure of a founder’s success: how well the business runs without them.",
      },
      {
        kind: "quote",
        text: "The founder who cannot be replaced has not built a business. They have built a job they cannot leave.",
      },
      { kind: "heading", text: "The bottom line" },
      {
        kind: "paragraph",
        text: "Strategy, cash and pricing all matter — but every one of them is executed by people, and a business rises or falls on them. The founder who learns to hire, lead, trust and develop a team turns a personal effort into an enterprise that can grow, endure, and one day continue without them. People are not a cost of the plan. They are the plan.",
      },
    ],
  },
];

async function seedInsightsContent() {
  for (const category of INSIGHTS_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, isPlaceholder: false },
    });
  }

  for (const article of INSIGHTS_ARTICLES) {
    const author = await prisma.author.findFirst({ where: { name: article.authorName } });
    if (!author) {
      throw new Error(
        `seedInsightsContent: author "${article.authorName}" not found — run seedAuthors first.`,
      );
    }
    const category = await prisma.category.findUnique({ where: { slug: article.categorySlug } });
    if (!category) {
      throw new Error(`seedInsightsContent: category "${article.categorySlug}" not found.`);
    }

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        authorId: author.id,
        categoryId: category.id,
        publishedAt: new Date(article.publishedAt),
        metaTitle: `${article.title} — Kaalbert & Company Ltd`,
        metaDescription: article.excerpt,
        nextStepCta: article.nextStepCta,
        isPlaceholder: false,
      },
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
  await seedDiagnosticScoreBands();
  await seedInsightsPage();
  await seedInsightsContent();
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
