import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MethodStage, OfferFaq } from "@/lib/offers";

export class OfferValidationError extends Error {}

export interface OfferSummary {
  slug: string;
  name: string;
  isTiered: boolean;
}

export interface OfferTierEditRow {
  id: number;
  name: string;
  isFeatured: boolean;
  durationLabel: string;
  scopeLabel: string;
  scopeCap: string;
  feeAmountMin: number;
  feeAmountMax: number;
  feeCurrency: string;
  deliverables: string[];
  clientInputs: string[];
}

export interface OfferEditData {
  slug: string;
  name: string;
  teaser: string;
  problemStatement: string;
  whoFor: string;
  whoNotFor: string;
  methodStages: MethodStage[];
  deliverables: string[];
  clientInputs: string[];
  indicativeTimeline: string | null;
  feeAmountMin: number;
  feeAmountMax: number;
  feeCurrency: string;
  scopeCap: string;
  outOfScopeNote: string;
  faqs: OfferFaq[];
  ctaHref: string;
  ctaLabel: string;
  metaTitle: string;
  metaDescription: string;
  isPlaceholder: boolean;
  /** Empty for a single-tier offer (Financial Clarity Pack, Funding-Readiness Pack). */
  tiers: OfferTierEditRow[];
}

export interface OfferSaveInput {
  name: string;
  teaser: string;
  problemStatement: string;
  whoFor: string;
  whoNotFor: string;
  methodStages: MethodStage[];
  deliverables: string[];
  clientInputs: string[];
  indicativeTimeline: string | null;
  feeAmountMin: number;
  feeAmountMax: number;
  feeCurrency: string;
  scopeCap: string;
  outOfScopeNote: string;
  faqs: OfferFaq[];
  ctaHref: string;
  ctaLabel: string;
  metaTitle: string;
  metaDescription: string;
  complianceChecked: boolean;
  tiers: {
    id: number;
    name: string;
    isFeatured: boolean;
    durationLabel: string;
    scopeLabel: string;
    scopeCap: string;
    feeAmountMin: number;
    feeAmountMax: number;
    feeCurrency: string;
    deliverables: string[];
    clientInputs: string[];
  }[];
}

export interface AdvisoryRetainerEditData {
  feeAmount: number;
  feeCurrency: string;
  billingPeriod: string;
  description: string;
}

export interface AdvisoryRetainerSaveInput extends AdvisoryRetainerEditData {
  complianceChecked: boolean;
}

/** The three core offers, in `getOfferNavLinks`' own `id asc` order, for the editor's picker. */
export async function getOfferList(): Promise<OfferSummary[]> {
  const offers = await prisma.offer.findMany({
    orderBy: { id: "asc" },
    select: { slug: true, name: true, _count: { select: { tiers: true } } },
  });
  return offers.map((offer) => ({
    slug: offer.slug,
    name: offer.name,
    isTiered: offer._count.tiers > 0,
  }));
}

export async function getOfferForEdit(slug: string): Promise<OfferEditData | null> {
  const offer = await prisma.offer.findUnique({
    where: { slug },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!offer) {
    return null;
  }

  return {
    slug: offer.slug,
    name: offer.name,
    teaser: offer.teaser,
    problemStatement: offer.problemStatement,
    whoFor: offer.whoFor,
    whoNotFor: offer.whoNotFor,
    methodStages: offer.methodStages as unknown as MethodStage[],
    deliverables: offer.deliverables,
    clientInputs: offer.clientInputs,
    indicativeTimeline: offer.indicativeTimeline,
    feeAmountMin: offer.feeAmountMin,
    feeAmountMax: offer.feeAmountMax,
    feeCurrency: offer.feeCurrency,
    scopeCap: offer.scopeCap,
    outOfScopeNote: offer.outOfScopeNote,
    faqs: offer.faqs as unknown as OfferFaq[],
    ctaHref: offer.ctaHref,
    ctaLabel: offer.ctaLabel,
    metaTitle: offer.metaTitle,
    metaDescription: offer.metaDescription,
    isPlaceholder: offer.isPlaceholder,
    tiers: offer.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      isFeatured: tier.isFeatured,
      durationLabel: tier.durationLabel,
      scopeLabel: tier.scopeLabel,
      scopeCap: tier.scopeCap,
      feeAmountMin: tier.feeAmountMin,
      feeAmountMax: tier.feeAmountMax,
      feeCurrency: tier.feeCurrency,
      deliverables: tier.deliverables,
      clientInputs: tier.clientInputs,
    })),
  };
}

function requireNonBlank(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new OfferValidationError(message);
  }
  return trimmed;
}

function cleanStringList(values: string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

function validateMethodStages(stages: MethodStage[]): MethodStage[] {
  if (stages.length === 0) {
    throw new OfferValidationError("At least one method stage is required.");
  }
  return stages.map((stage) => ({
    title: requireNonBlank(stage.title, "Every method stage needs a title."),
    description: requireNonBlank(stage.description, "Every method stage needs a description."),
  }));
}

function validateFaqs(faqs: OfferFaq[]): OfferFaq[] {
  return faqs.map((faq) => ({
    question: requireNonBlank(faq.question, "Every FAQ needs a question."),
    answer: requireNonBlank(faq.answer, "Every FAQ needs an answer."),
  }));
}

/**
 * `content-management-admin.md`'s edge case: "the API rejects a fee update missing the scope
 * cap" — checked here, not only client-side, so this is the one place the rule can never be
 * bypassed. Applies identically to a single-tier offer's own fee band and to each
 * `OfferTier`'s fee band (`core-offer-pages.md`: "Resolves the Business Health Check two-tier
 * pricing gap ... only Business Health Check has rows here").
 */
function validateFeeBand(
  feeAmountMin: number,
  feeAmountMax: number,
  feeCurrency: string,
  scopeCap: string,
  context: string,
): { feeAmountMin: number; feeAmountMax: number; feeCurrency: string; scopeCap: string } {
  const trimmedScopeCap = scopeCap.trim();
  if (!trimmedScopeCap) {
    throw new OfferValidationError(
      `${context}: this fee band cannot be saved without a scope cap — a fee published without ` +
        "its cap is a commitment the firm cannot hold (Document 13.03, Section 13).",
    );
  }
  const trimmedCurrency = requireNonBlank(feeCurrency, `${context}: currency is required.`);
  if (!Number.isFinite(feeAmountMin) || !Number.isFinite(feeAmountMax) || feeAmountMin <= 0) {
    throw new OfferValidationError(`${context}: fee amounts must be positive numbers.`);
  }
  if (feeAmountMax < feeAmountMin) {
    throw new OfferValidationError(`${context}: the upper fee bound can't be less than the lower.`);
  }
  return {
    feeAmountMin,
    feeAmountMax,
    feeCurrency: trimmedCurrency,
    scopeCap: trimmedScopeCap,
  };
}

/**
 * Saves the shared narrative fields (problem statement, who for/not for, method stages, out of
 * scope note, FAQs, CTA, meta) plus — depending on whether `slug` is a tiered offer (Business
 * Health Check) or a single-tier one (Financial Clarity Pack, Funding-Readiness Pack) — either
 * each `OfferTier` row's own fee/deliverables/client-inputs, or the parent `Offer` row's own
 * top-level fee/deliverables/client-inputs/indicative-timeline fields directly
 * (`core-offer-pages.md`'s doc-comment: a tiered offer's own top-level fee fields "go
 * unused," so they're left untouched here rather than overwritten with stale form values).
 */
export async function updateOffer(slug: string, input: OfferSaveInput): Promise<void> {
  const existing = await prisma.offer.findUnique({
    where: { slug },
    include: { tiers: true },
  });
  if (!existing) {
    throw new OfferValidationError(`No offer found for slug "${slug}".`);
  }
  if (!input.complianceChecked) {
    throw new OfferValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }

  const name = requireNonBlank(input.name, "Offer name is required.");
  const teaser = requireNonBlank(input.teaser, "Teaser is required.");
  const problemStatement = requireNonBlank(
    input.problemStatement,
    "Problem statement is required.",
  );
  const whoFor = requireNonBlank(input.whoFor, "Who it's for is required.");
  const whoNotFor = requireNonBlank(input.whoNotFor, "Who it's not for is required.");
  const outOfScopeNote = requireNonBlank(input.outOfScopeNote, "Out-of-scope note is required.");
  const ctaHref = requireNonBlank(input.ctaHref, "CTA link is required.");
  const ctaLabel = requireNonBlank(input.ctaLabel, "CTA label is required.");
  const metaTitle = requireNonBlank(input.metaTitle, "Meta title is required.");
  const metaDescription = requireNonBlank(input.metaDescription, "Meta description is required.");
  const methodStages = validateMethodStages(input.methodStages);
  const faqs = validateFaqs(input.faqs);

  const isTiered = existing.tiers.length > 0;

  const sharedData = {
    name,
    teaser,
    problemStatement,
    whoFor,
    whoNotFor,
    methodStages: methodStages as unknown as Prisma.InputJsonValue,
    outOfScopeNote,
    faqs: faqs as unknown as Prisma.InputJsonValue,
    ctaHref,
    ctaLabel,
    metaTitle,
    metaDescription,
  };

  if (isTiered) {
    if (input.tiers.length !== existing.tiers.length) {
      throw new OfferValidationError(
        `Expected ${existing.tiers.length} tier(s) for "${name}" — tiers aren't added or removed here.`,
      );
    }
    const existingTierIds = new Set(existing.tiers.map((t) => t.id));
    const featuredCount = input.tiers.filter((t) => t.isFeatured).length;
    if (featuredCount !== 1) {
      throw new OfferValidationError(
        "Exactly one tier must be marked as the featured/published tier.",
      );
    }

    const validatedTiers = input.tiers.map((tier) => {
      if (!existingTierIds.has(tier.id)) {
        throw new OfferValidationError(`Unknown tier id ${tier.id} for offer "${slug}".`);
      }
      const feeBand = validateFeeBand(
        tier.feeAmountMin,
        tier.feeAmountMax,
        tier.feeCurrency,
        tier.scopeCap,
        `Tier "${tier.name || tier.id}"`,
      );
      const deliverables = cleanStringList(tier.deliverables);
      if (deliverables.length === 0) {
        throw new OfferValidationError(`Tier "${tier.name}" needs at least one deliverable.`);
      }
      const clientInputs = cleanStringList(tier.clientInputs);
      if (clientInputs.length === 0) {
        throw new OfferValidationError(`Tier "${tier.name}" needs its required client inputs.`);
      }
      return {
        id: tier.id,
        name: requireNonBlank(tier.name, "Every tier needs a name."),
        isFeatured: tier.isFeatured,
        durationLabel: requireNonBlank(
          tier.durationLabel,
          `Tier "${tier.name}" needs a duration label.`,
        ),
        scopeLabel: requireNonBlank(tier.scopeLabel, `Tier "${tier.name}" needs a scope label.`),
        ...feeBand,
        deliverables,
        clientInputs,
      };
    });

    await prisma.$transaction([
      prisma.offer.update({ where: { slug }, data: sharedData }),
      ...validatedTiers.map((tier) =>
        prisma.offerTier.update({
          where: { id: tier.id },
          data: {
            name: tier.name,
            isFeatured: tier.isFeatured,
            durationLabel: tier.durationLabel,
            scopeLabel: tier.scopeLabel,
            scopeCap: tier.scopeCap,
            feeAmountMin: tier.feeAmountMin,
            feeAmountMax: tier.feeAmountMax,
            feeCurrency: tier.feeCurrency,
            deliverables: tier.deliverables,
            clientInputs: tier.clientInputs,
          },
        }),
      ),
    ]);
    return;
  }

  const feeBand = validateFeeBand(
    input.feeAmountMin,
    input.feeAmountMax,
    input.feeCurrency,
    input.scopeCap,
    `"${name}"`,
  );
  const deliverables = cleanStringList(input.deliverables);
  if (deliverables.length === 0) {
    throw new OfferValidationError("At least one deliverable is required.");
  }
  const clientInputs = cleanStringList(input.clientInputs);
  if (clientInputs.length === 0) {
    throw new OfferValidationError("Required client inputs can't be left blank.");
  }
  const indicativeTimeline = requireNonBlank(
    input.indicativeTimeline ?? "",
    "Indicative timeline is required.",
  );

  await prisma.offer.update({
    where: { slug },
    data: {
      ...sharedData,
      deliverables,
      clientInputs,
      indicativeTimeline,
      ...feeBand,
    },
  });
}

export async function getAdvisoryRetainerForEdit(): Promise<AdvisoryRetainerEditData> {
  const retainer = await prisma.advisoryRetainer.findFirst({ orderBy: { id: "asc" } });
  if (!retainer) {
    throw new Error("advisory_retainer has no row — run `npm run db:seed` (see prisma/seed.ts).");
  }
  return {
    feeAmount: retainer.feeAmount,
    feeCurrency: retainer.feeCurrency,
    billingPeriod: retainer.billingPeriod,
    description: retainer.description,
  };
}

/**
 * The Advisory Retainer is priced as a single recurring figure, not a min/max band
 * (`capabilities-page.md`'s `AdvisoryRetainer` doc-comment) — so there's no scope-cap gate
 * here, but the same structured-field discipline (amount + currency + billing period, never
 * free text) and the same FR-5.4 10.05-compliance sign-off as the three core offers apply,
 * since its `description` is real published copy shown on `/capabilities`.
 */
export async function updateAdvisoryRetainer(input: AdvisoryRetainerSaveInput): Promise<void> {
  if (!input.complianceChecked) {
    throw new OfferValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }
  const feeCurrency = requireNonBlank(input.feeCurrency, "Currency is required.");
  const billingPeriod = requireNonBlank(input.billingPeriod, "Billing period is required.");
  const description = requireNonBlank(input.description, "Description is required.");
  if (!Number.isFinite(input.feeAmount) || input.feeAmount <= 0) {
    throw new OfferValidationError("Fee amount must be a positive number.");
  }

  const existing = await prisma.advisoryRetainer.findFirst({ orderBy: { id: "asc" } });
  if (!existing) {
    throw new Error("advisory_retainer has no row — run `npm run db:seed` (see prisma/seed.ts).");
  }
  await prisma.advisoryRetainer.update({
    where: { id: existing.id },
    data: {
      feeAmount: input.feeAmount,
      feeCurrency,
      billingPeriod,
      description,
    },
  });
}
