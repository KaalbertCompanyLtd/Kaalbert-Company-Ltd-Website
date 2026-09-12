import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    landingPage: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createLandingPage,
  getLandingPageForEdit,
  getLandingPageList,
  LandingPageValidationError,
  parseLandingPageContentInput,
  updateLandingPage,
} from "@/lib/admin-landing-pages";
import type { LandingPageCreateInput, LandingPageUpdateInput } from "@/lib/admin-landing-pages";

const findManyMock = vi.mocked(prisma.landingPage.findMany);
const findUniqueMock = vi.mocked(prisma.landingPage.findUnique);
const createMock = vi.mocked(prisma.landingPage.create);
const updateMock = vi.mocked(prisma.landingPage.update);

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
});

function validInput(overrides: Partial<LandingPageCreateInput> = {}): LandingPageCreateInput {
  return {
    slug: "Spring 2026 Promo",
    kicker: "Limited-time",
    headline: "A stronger case, faster",
    openingParagraph: "Everything you need to approach a lender with confidence.",
    bodyContent: [{ kind: "heading", text: "Why now" }],
    ctaLabel: "Start a conversation",
    ctaHref: "/contact?service=funding-readiness-pack",
    downloadFileUrl: null,
    campaignReference: "SM/2026-10",
    metaTitle: "Spring 2026 Promo — Kaalbert & Company Ltd",
    metaDescription: "A stronger case, faster.",
    complianceChecked: true,
    ...overrides,
  };
}

function validUpdateInput(overrides: Partial<LandingPageUpdateInput> = {}): LandingPageUpdateInput {
  return {
    kicker: "Limited-time",
    headline: "A stronger case, faster",
    openingParagraph: "Everything you need to approach a lender with confidence.",
    bodyContent: [{ kind: "heading", text: "Why now" }],
    ctaLabel: "Start a conversation",
    ctaHref: "/contact?service=funding-readiness-pack",
    downloadFileUrl: null,
    campaignReference: "SM/2026-10",
    metaTitle: "Spring 2026 Promo — Kaalbert & Company Ltd",
    metaDescription: "A stronger case, faster.",
    complianceChecked: true,
    ...overrides,
  };
}

describe("getLandingPageList", () => {
  it("returns the seeded rows as-is", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        slug: "business-health-check",
        headline: "Headline",
        campaignReference: "SM/2026-09",
        updatedAt: new Date("2026-09-01"),
      },
    ] as never);

    const result = await getLandingPageList();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("business-health-check");
  });
});

describe("createLandingPage", () => {
  it("rejects a save with the 10.05 compliance box unchecked", async () => {
    await expect(createLandingPage(validInput({ complianceChecked: false }))).rejects.toThrow(
      LandingPageValidationError,
    );
  });

  it("rejects a blank slug", async () => {
    await expect(createLandingPage(validInput({ slug: "   " }))).rejects.toThrow(/slug/i);
  });

  it("normalizes the slug the same way lib/categories.ts's slugify does", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({} as never);

    await createLandingPage(validInput({ slug: "Spring 2026 Promo!!" }));

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { slug: "spring-2026-promo" } });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "spring-2026-promo" }) }),
    );
  });

  it("rejects a duplicate slug inline instead of silently creating a second campaign page", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 1 } as never);
    await expect(createLandingPage(validInput())).rejects.toThrow(/already exists/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an empty body content array", async () => {
    await expect(createLandingPage(validInput({ bodyContent: [] }))).rejects.toThrow(
      /body content/i,
    );
  });

  it("rejects a list block with an empty items array", async () => {
    await expect(
      createLandingPage(validInput({ bodyContent: [{ kind: "list", items: [] }] })),
    ).rejects.toThrow(LandingPageValidationError);
  });

  it("rejects a stats block with a blank value", async () => {
    await expect(
      createLandingPage(
        validInput({ bodyContent: [{ kind: "stats", items: [{ value: "", label: "Minutes" }] }] }),
      ),
    ).rejects.toThrow(LandingPageValidationError);
  });

  it("creates a real, non-placeholder row on a valid input", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({} as never);

    const result = await createLandingPage(validInput());

    expect(result.slug).toBe("spring-2026-promo");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPlaceholder: false, downloadFileUrl: null }),
      }),
    );
  });
});

describe("getLandingPageForEdit", () => {
  it("returns null for a slug with no matching row", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getLandingPageForEdit("no-such-slug")).toBeNull();
  });

  it("returns the row's fields with complianceChecked reset to false", async () => {
    findUniqueMock.mockResolvedValueOnce({
      slug: "business-health-check",
      kicker: "Kicker",
      headline: "Headline",
      openingParagraph: "Opening.",
      bodyContent: [{ kind: "heading", text: "Why now" }],
      ctaLabel: "Start",
      ctaHref: "/contact",
      downloadFileUrl: null,
      campaignReference: "SM/2026-09",
      metaTitle: "Meta title",
      metaDescription: "Meta description.",
    } as never);

    const result = await getLandingPageForEdit("business-health-check");
    expect(result?.slug).toBe("business-health-check");
    expect(result?.complianceChecked).toBe(false);
  });
});

describe("updateLandingPage", () => {
  it("rejects a save with the 10.05 compliance box unchecked", async () => {
    await expect(
      updateLandingPage("business-health-check", validUpdateInput({ complianceChecked: false })),
    ).rejects.toThrow(LandingPageValidationError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an update for a slug with no matching row", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(updateLandingPage("no-such-slug", validUpdateInput())).rejects.toThrow(
      /no landing page found/i,
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("never accepts a slug field — the URL is fixed once a page is created", () => {
    const input = validUpdateInput();
    expect(input).not.toHaveProperty("slug");
  });

  it("updates the row and always resets isPlaceholder to false on a valid save", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 1 } as never);
    updateMock.mockResolvedValueOnce({} as never);

    await updateLandingPage("business-health-check", validUpdateInput());

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "business-health-check" },
        data: expect.objectContaining({
          isPlaceholder: false,
          headline: "A stronger case, faster",
        }),
      }),
    );
  });
});

describe("parseLandingPageContentInput", () => {
  it("returns null for a missing required field", () => {
    expect(parseLandingPageContentInput({ kicker: "Only this" })).toBeNull();
    expect(parseLandingPageContentInput(null)).toBeNull();
  });

  it("returns null for a malformed body content block", () => {
    expect(
      parseLandingPageContentInput({
        ...validUpdateInput(),
        bodyContent: [{ kind: "list", items: [1, 2] }],
      }),
    ).toBeNull();
  });

  it("parses a valid payload, defaulting downloadFileUrl through as given", () => {
    const result = parseLandingPageContentInput(validUpdateInput());
    expect(result).toEqual(validUpdateInput());
  });
});
