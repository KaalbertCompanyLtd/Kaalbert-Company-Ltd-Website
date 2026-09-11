import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    offer: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    offerTier: { update: vi.fn() },
    advisoryRetainer: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  OfferValidationError,
  getAdvisoryRetainerForEdit,
  getOfferForEdit,
  getOfferList,
  updateAdvisoryRetainer,
  updateOffer,
} from "@/lib/admin-offers";
import type { AdvisoryRetainerSaveInput, OfferSaveInput } from "@/lib/admin-offers";

const offerFindManyMock = vi.mocked(prisma.offer.findMany);
const offerFindUniqueMock = vi.mocked(prisma.offer.findUnique);
const offerUpdateMock = vi.mocked(prisma.offer.update);
const offerTierUpdateMock = vi.mocked(prisma.offerTier.update);
const advisoryRetainerFindFirstMock = vi.mocked(prisma.advisoryRetainer.findFirst);
const advisoryRetainerUpdateMock = vi.mocked(prisma.advisoryRetainer.update);
const transactionMock = vi.mocked(prisma.$transaction);

beforeEach(() => {
  offerFindManyMock.mockReset();
  offerFindUniqueMock.mockReset();
  offerUpdateMock.mockReset();
  offerTierUpdateMock.mockReset();
  advisoryRetainerFindFirstMock.mockReset();
  advisoryRetainerUpdateMock.mockReset();
  transactionMock.mockReset();
});

const singleTierOfferRow = {
  slug: "funding-readiness-pack",
  name: "Funding-Readiness Pack",
  teaser: "Teaser",
  problemStatement: "Problem",
  whoFor: "Who for",
  whoNotFor: "Who not for",
  methodStages: [{ title: "Discover", description: "We map things." }],
  deliverables: ["A defensible business case"],
  clientInputs: ["Your records"],
  indicativeTimeline: "3–6 weeks",
  feeAmountMin: 9000,
  feeAmountMax: 19000,
  feeCurrency: "GHS",
  scopeCap: "One facility",
  outOfScopeNote: "Statutory audit is out of scope.",
  faqs: [{ question: "Q?", answer: "A." }],
  ctaHref: "/contact",
  ctaLabel: "Start a conversation",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
  isPlaceholder: false,
  tiers: [],
};

function tierRow(overrides: Partial<{ id: number; isFeatured: boolean; sortOrder: number }> = {}) {
  return {
    id: overrides.id ?? 1,
    offerId: 1,
    name: "Express",
    isFeatured: overrides.isFeatured ?? false,
    durationLabel: "5 working days",
    scopeLabel: "single-location business",
    scopeCap: "up to one location",
    feeAmountMin: 1000,
    feeAmountMax: 2000,
    feeCurrency: "GHS",
    deliverables: ["Deliverable"],
    clientInputs: ["Records"],
    sortOrder: overrides.sortOrder ?? 1,
  };
}

function validSingleTierInput(overrides: Partial<OfferSaveInput> = {}): OfferSaveInput {
  return {
    name: singleTierOfferRow.name,
    teaser: singleTierOfferRow.teaser,
    problemStatement: singleTierOfferRow.problemStatement,
    whoFor: singleTierOfferRow.whoFor,
    whoNotFor: singleTierOfferRow.whoNotFor,
    methodStages: singleTierOfferRow.methodStages,
    deliverables: singleTierOfferRow.deliverables,
    clientInputs: singleTierOfferRow.clientInputs,
    indicativeTimeline: singleTierOfferRow.indicativeTimeline,
    feeAmountMin: singleTierOfferRow.feeAmountMin,
    feeAmountMax: singleTierOfferRow.feeAmountMax,
    feeCurrency: singleTierOfferRow.feeCurrency,
    scopeCap: singleTierOfferRow.scopeCap,
    outOfScopeNote: singleTierOfferRow.outOfScopeNote,
    faqs: singleTierOfferRow.faqs,
    ctaHref: singleTierOfferRow.ctaHref,
    ctaLabel: singleTierOfferRow.ctaLabel,
    metaTitle: singleTierOfferRow.metaTitle,
    metaDescription: singleTierOfferRow.metaDescription,
    complianceChecked: true,
    tiers: [],
    ...overrides,
  };
}

describe("getOfferList", () => {
  it("flags a tiered offer via its tiers count", async () => {
    offerFindManyMock.mockResolvedValueOnce([
      { slug: "business-health-check", name: "Business Health Check", _count: { tiers: 2 } },
      { slug: "financial-clarity-pack", name: "Financial Clarity Pack", _count: { tiers: 0 } },
    ] as never);

    const result = await getOfferList();

    expect(result).toEqual([
      { slug: "business-health-check", name: "Business Health Check", isTiered: true },
      { slug: "financial-clarity-pack", name: "Financial Clarity Pack", isTiered: false },
    ]);
  });
});

describe("getOfferForEdit", () => {
  it("returns null for an unknown slug", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(null);
    expect(await getOfferForEdit("does-not-exist")).toBeNull();
  });

  it("maps a single-tier offer's fields, including an empty tiers array", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(singleTierOfferRow as never);
    const result = await getOfferForEdit("funding-readiness-pack");
    expect(result?.tiers).toEqual([]);
    expect(result?.scopeCap).toBe("One facility");
  });
});

describe("updateOffer — single-tier offer", () => {
  it("rejects a save with the 10.05 compliance box unchecked", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({ ...singleTierOfferRow, tiers: [] } as never);
    await expect(
      updateOffer("funding-readiness-pack", validSingleTierInput({ complianceChecked: false })),
    ).rejects.toThrow(OfferValidationError);
  });

  it("rejects a fee band submitted without a scope cap — the literal task this rule was written for", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({ ...singleTierOfferRow, tiers: [] } as never);
    await expect(
      updateOffer("funding-readiness-pack", validSingleTierInput({ scopeCap: "   " })),
    ).rejects.toThrow(/scope cap/);
  });

  it("rejects an upper fee bound below the lower bound", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({ ...singleTierOfferRow, tiers: [] } as never);
    await expect(
      updateOffer(
        "funding-readiness-pack",
        validSingleTierInput({ feeAmountMin: 20000, feeAmountMax: 9000 }),
      ),
    ).rejects.toThrow(OfferValidationError);
  });

  it("rejects an empty deliverables list", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({ ...singleTierOfferRow, tiers: [] } as never);
    await expect(
      updateOffer("funding-readiness-pack", validSingleTierInput({ deliverables: ["   "] })),
    ).rejects.toThrow(OfferValidationError);
  });

  it("saves a valid single-tier offer, updating the offer row's own fee fields directly", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({ ...singleTierOfferRow, tiers: [] } as never);
    offerUpdateMock.mockResolvedValueOnce({} as never);

    await updateOffer("funding-readiness-pack", validSingleTierInput());

    expect(offerUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "funding-readiness-pack" },
        data: expect.objectContaining({
          feeAmountMin: 9000,
          feeAmountMax: 19000,
          scopeCap: "One facility",
          deliverables: ["A defensible business case"],
        }),
      }),
    );
  });
});

describe("updateOffer — tiered offer (Business Health Check)", () => {
  const tieredOfferRow = {
    ...singleTierOfferRow,
    slug: "business-health-check",
    name: "Business Health Check",
    tiers: [tierRow({ id: 1, isFeatured: false }), tierRow({ id: 2, isFeatured: true })],
  };

  function tieredInput(
    overrides: Partial<OfferSaveInput> = {},
    tierOverrides: Partial<OfferSaveInput["tiers"][number]>[] = [],
  ): OfferSaveInput {
    return validSingleTierInput({
      tiers: tieredOfferRow.tiers.map((t, i) => ({
        id: t.id,
        name: t.name,
        isFeatured: t.isFeatured,
        durationLabel: t.durationLabel,
        scopeLabel: t.scopeLabel,
        scopeCap: t.scopeCap,
        feeAmountMin: t.feeAmountMin,
        feeAmountMax: t.feeAmountMax,
        feeCurrency: t.feeCurrency,
        deliverables: t.deliverables,
        clientInputs: t.clientInputs,
        ...tierOverrides[i],
      })),
      ...overrides,
    });
  }

  it("leaves the parent offer row's own fee/deliverables fields untouched", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(tieredOfferRow as never);
    transactionMock.mockResolvedValueOnce([] as never);

    await updateOffer("business-health-check", tieredInput());

    expect(offerUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "business-health-check" } }),
    );
    const savedData = offerUpdateMock.mock.calls[0][0].data as Record<string, unknown>;
    expect(savedData).not.toHaveProperty("feeAmountMin");
    expect(savedData).not.toHaveProperty("deliverables");
  });

  it("rejects a tier's fee band submitted without a scope cap", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(tieredOfferRow as never);
    await expect(
      updateOffer("business-health-check", tieredInput({}, [{ scopeCap: "" }])),
    ).rejects.toThrow(/scope cap/);
  });

  it("rejects a save where more than one tier is marked featured", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(tieredOfferRow as never);
    await expect(
      updateOffer("business-health-check", tieredInput({}, [{ isFeatured: true }])),
    ).rejects.toThrow(/exactly one tier/i);
  });

  it("rejects a save where no tier is marked featured", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(tieredOfferRow as never);
    await expect(
      updateOffer("business-health-check", tieredInput({}, [{}, { isFeatured: false }])),
    ).rejects.toThrow(/exactly one tier/i);
  });

  it("saves each tier's fields via a transaction alongside the shared offer fields", async () => {
    offerFindUniqueMock.mockResolvedValueOnce(tieredOfferRow as never);
    transactionMock.mockResolvedValueOnce([] as never);

    await updateOffer("business-health-check", tieredInput());

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(offerTierUpdateMock).toHaveBeenCalledTimes(2);
    expect(offerTierUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    expect(offerTierUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 2 } }));
  });
});

describe("getAdvisoryRetainerForEdit / updateAdvisoryRetainer", () => {
  const retainerRow = {
    id: 1,
    feeAmount: 1500,
    feeCurrency: "GHS",
    billingPeriod: "month",
    description: "Ongoing advisory support.",
  };

  it("returns the singleton row's fields", async () => {
    advisoryRetainerFindFirstMock.mockResolvedValueOnce(retainerRow as never);
    const result = await getAdvisoryRetainerForEdit();
    expect(result).toEqual({
      feeAmount: 1500,
      feeCurrency: "GHS",
      billingPeriod: "month",
      description: "Ongoing advisory support.",
    });
  });

  it("rejects a save with the 10.05 compliance box unchecked", async () => {
    const input: AdvisoryRetainerSaveInput = {
      feeAmount: 1500,
      feeCurrency: "GHS",
      billingPeriod: "month",
      description: "Ongoing advisory support.",
      complianceChecked: false,
    };
    await expect(updateAdvisoryRetainer(input)).rejects.toThrow(OfferValidationError);
  });

  it("saves a valid update", async () => {
    advisoryRetainerFindFirstMock.mockResolvedValueOnce(retainerRow as never);
    advisoryRetainerUpdateMock.mockResolvedValueOnce({} as never);

    await updateAdvisoryRetainer({
      feeAmount: 1800,
      feeCurrency: "GHS",
      billingPeriod: "month",
      description: "Updated description.",
      complianceChecked: true,
    });

    expect(advisoryRetainerUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        feeAmount: 1800,
        feeCurrency: "GHS",
        billingPeriod: "month",
        description: "Updated description.",
      },
    });
  });
});
