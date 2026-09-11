import { NextResponse } from "next/server";

import { OfferValidationError, updateOffer } from "@/lib/admin-offers";
import type { OfferSaveInput } from "@/lib/admin-offers";

function parseMethodStages(value: unknown): OfferSaveInput["methodStages"] | null {
  if (!Array.isArray(value)) return null;
  const stages: OfferSaveInput["methodStages"] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (typeof r.title !== "string" || typeof r.description !== "string") return null;
    stages.push({ title: r.title, description: r.description });
  }
  return stages;
}

function parseFaqs(value: unknown): OfferSaveInput["faqs"] | null {
  if (!Array.isArray(value)) return null;
  const faqs: OfferSaveInput["faqs"] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (typeof r.question !== "string" || typeof r.answer !== "string") return null;
    faqs.push({ question: r.question, answer: r.answer });
  }
  return faqs;
}

function parseStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) return null;
  return value as string[];
}

function parseTiers(value: unknown): OfferSaveInput["tiers"] | null {
  if (!Array.isArray(value)) return null;
  const tiers: OfferSaveInput["tiers"] = [];
  for (const row of value) {
    const t = row as Record<string, unknown>;
    const deliverables = parseStringList(t.deliverables);
    const clientInputs = parseStringList(t.clientInputs);
    if (
      typeof t.id !== "number" ||
      typeof t.name !== "string" ||
      typeof t.isFeatured !== "boolean" ||
      typeof t.durationLabel !== "string" ||
      typeof t.scopeLabel !== "string" ||
      typeof t.scopeCap !== "string" ||
      typeof t.feeAmountMin !== "number" ||
      typeof t.feeAmountMax !== "number" ||
      typeof t.feeCurrency !== "string" ||
      !deliverables ||
      !clientInputs
    ) {
      return null;
    }
    tiers.push({
      id: t.id,
      name: t.name,
      isFeatured: t.isFeatured,
      durationLabel: t.durationLabel,
      scopeLabel: t.scopeLabel,
      scopeCap: t.scopeCap,
      feeAmountMin: t.feeAmountMin,
      feeAmountMax: t.feeAmountMax,
      feeCurrency: t.feeCurrency,
      deliverables,
      clientInputs,
    });
  }
  return tiers;
}

function parseInput(body: unknown): OfferSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;

  const methodStages = parseMethodStages(c.methodStages);
  const faqs = parseFaqs(c.faqs);
  const deliverables = parseStringList(c.deliverables);
  const clientInputs = parseStringList(c.clientInputs);
  const tiers = parseTiers(c.tiers);

  if (
    typeof c.name !== "string" ||
    typeof c.teaser !== "string" ||
    typeof c.problemStatement !== "string" ||
    typeof c.whoFor !== "string" ||
    typeof c.whoNotFor !== "string" ||
    !methodStages ||
    !deliverables ||
    !clientInputs ||
    (c.indicativeTimeline !== null && typeof c.indicativeTimeline !== "string") ||
    typeof c.feeAmountMin !== "number" ||
    typeof c.feeAmountMax !== "number" ||
    typeof c.feeCurrency !== "string" ||
    typeof c.scopeCap !== "string" ||
    typeof c.outOfScopeNote !== "string" ||
    !faqs ||
    typeof c.ctaHref !== "string" ||
    typeof c.ctaLabel !== "string" ||
    typeof c.metaTitle !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.complianceChecked !== "boolean" ||
    !tiers
  ) {
    return null;
  }

  return {
    name: c.name,
    teaser: c.teaser,
    problemStatement: c.problemStatement,
    whoFor: c.whoFor,
    whoNotFor: c.whoNotFor,
    methodStages,
    deliverables,
    clientInputs,
    indicativeTimeline: c.indicativeTimeline as string | null,
    feeAmountMin: c.feeAmountMin,
    feeAmountMax: c.feeAmountMax,
    feeCurrency: c.feeCurrency,
    scopeCap: c.scopeCap,
    outOfScopeNote: c.outOfScopeNote,
    faqs,
    ctaHref: c.ctaHref,
    ctaLabel: c.ctaLabel,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    complianceChecked: c.complianceChecked,
    tiers,
  };
}

/**
 * `PATCH /api/admin/offers/[slug]` — request: `OfferSaveInput`; response: `{status}`. Keyed
 * by slug (not id) to match `lib/offers.ts`'s `getOfferBySlug` and the admin-legal precedent
 * (`PATCH /api/admin/legal/[slug]`) — every validation/gating rule, including the fee-band-
 * needs-a-scope-cap check, lives in `lib/admin-offers.ts`'s `updateOffer`.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateOffer(slug, input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof OfferValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
