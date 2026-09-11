import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    landingPage: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createLandingPage,
  getLandingPageList,
  LandingPageValidationError,
} from "@/lib/admin-landing-pages";
import type { LandingPageCreateInput } from "@/lib/admin-landing-pages";

const findManyMock = vi.mocked(prisma.landingPage.findMany);
const findUniqueMock = vi.mocked(prisma.landingPage.findUnique);
const createMock = vi.mocked(prisma.landingPage.create);

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
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
