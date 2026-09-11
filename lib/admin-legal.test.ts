import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    legalPage: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    footerContent: { findFirstOrThrow: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  LegalValidationError,
  getLegalAdminData,
  getLegalPageForEdit,
  updateFooterContent,
  updateLegalPage,
} from "@/lib/admin-legal";

const legalFindManyMock = vi.mocked(prisma.legalPage.findMany);
const legalFindUniqueMock = vi.mocked(prisma.legalPage.findUnique);
const legalUpdateMock = vi.mocked(prisma.legalPage.update);
const footerFindFirstOrThrowMock = vi.mocked(prisma.footerContent.findFirstOrThrow);
const footerUpdateMock = vi.mocked(prisma.footerContent.update);

beforeEach(() => {
  legalFindManyMock.mockReset();
  legalFindUniqueMock.mockReset();
  legalUpdateMock.mockReset();
  footerFindFirstOrThrowMock.mockReset();
  footerUpdateMock.mockReset();
});

describe("getLegalAdminData", () => {
  it("orders pages by LEGAL_PAGE_SLUGS's fixed order, not query order", async () => {
    legalFindManyMock.mockResolvedValueOnce([
      { slug: "terms-of-use", title: "Terms of Use", isPlaceholder: true, lastRevisedAt: null },
      { slug: "privacy-notice", title: "Privacy Notice", isPlaceholder: true, lastRevisedAt: null },
    ] as never);
    footerFindFirstOrThrowMock.mockResolvedValueOnce({
      scopeOfPracticeStatement: "Statement",
      companyRegistrationDetails: null,
    } as never);

    const result = await getLegalAdminData();

    expect(result.legalPages.map((p) => p.slug)).toEqual(["privacy-notice", "terms-of-use"]);
  });
});

describe("getLegalPageForEdit", () => {
  it("returns null for a slug outside the four fixed ones", async () => {
    await expect(getLegalPageForEdit("not-a-real-slug")).resolves.toBeNull();
    expect(legalFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns null when the row doesn't exist", async () => {
    legalFindUniqueMock.mockResolvedValueOnce(null);
    await expect(getLegalPageForEdit("privacy-notice")).resolves.toBeNull();
  });
});

describe("updateLegalPage", () => {
  it("rejects a slug outside the four fixed ones", async () => {
    await expect(
      updateLegalPage("not-a-real-slug", {
        title: "T",
        metaDescription: "D",
        isPlaceholder: false,
        body: [{ kind: "statement", text: "x" }],
      }),
    ).rejects.toThrow(LegalValidationError);
  });

  it("rejects an empty body", async () => {
    await expect(
      updateLegalPage("privacy-notice", {
        title: "T",
        metaDescription: "D",
        isPlaceholder: false,
        body: [],
      }),
    ).rejects.toThrow(LegalValidationError);
  });

  it("sets lastRevisedAt when saving with isPlaceholder: false", async () => {
    legalUpdateMock.mockResolvedValueOnce({} as never);

    await updateLegalPage("privacy-notice", {
      title: "T",
      metaDescription: "D",
      isPlaceholder: false,
      body: [{ kind: "statement", text: "x" }],
    });

    const updateArgs = legalUpdateMock.mock.calls[0][0] as { data: { lastRevisedAt?: Date } };
    expect(updateArgs.data.lastRevisedAt).toBeInstanceOf(Date);
  });

  it("never sets lastRevisedAt when saving with isPlaceholder: true — still a draft", async () => {
    legalUpdateMock.mockResolvedValueOnce({} as never);

    await updateLegalPage("privacy-notice", {
      title: "T",
      metaDescription: "D",
      isPlaceholder: true,
      body: [{ kind: "statement", text: "x" }],
    });

    const updateArgs = legalUpdateMock.mock.calls[0][0] as { data: { lastRevisedAt?: Date } };
    expect(updateArgs.data.lastRevisedAt).toBeUndefined();
  });
});

describe("updateFooterContent", () => {
  it("rejects a blank scope-of-practice statement", async () => {
    await expect(
      updateFooterContent({ scopeOfPracticeStatement: "  ", companyRegistrationDetails: null }),
    ).rejects.toThrow(LegalValidationError);
  });

  it("saves and nulls a blank companyRegistrationDetails", async () => {
    footerFindFirstOrThrowMock.mockResolvedValueOnce({ id: 1 } as never);
    footerUpdateMock.mockResolvedValueOnce({} as never);

    await updateFooterContent({
      scopeOfPracticeStatement: "Statement",
      companyRegistrationDetails: "",
    });

    const updateArgs = footerUpdateMock.mock.calls[0][0] as {
      data: { companyRegistrationDetails: string | null };
    };
    expect(updateArgs.data.companyRegistrationDetails).toBeNull();
  });
});
