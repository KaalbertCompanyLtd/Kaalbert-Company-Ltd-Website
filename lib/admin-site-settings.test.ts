import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSiteSettingsForEdit, updateSiteSettings } from "@/lib/admin-site-settings";

const findUniqueMock = vi.mocked(prisma.siteSettings.findUnique);
const updateMock = vi.mocked(prisma.siteSettings.update);

const settingsRow = {
  id: 1,
  phonePrimary: "0558 480 001",
  phoneSecondary: "0257 784 686",
  email: "kaalberto777@gmail.com",
  whatsappNumber: "233558480001",
  address: "House No. 13 Gbenjin Gbe Avenue\nEast Legon-ARS, Accra, Ghana",
  responseTimeCommitment: null,
  socialProfileUrls: [] as string[],
  isPlaceholder: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset();
});

describe("getSiteSettingsForEdit", () => {
  it("shapes the singleton row for the form", async () => {
    findUniqueMock.mockResolvedValueOnce(settingsRow as never);

    const result = await getSiteSettingsForEdit();

    expect(result).toEqual({
      phonePrimary: "0558 480 001",
      phoneSecondary: "0257 784 686",
      email: "kaalberto777@gmail.com",
      whatsappNumber: "233558480001",
      address: "House No. 13 Gbenjin Gbe Avenue\nEast Legon-ARS, Accra, Ghana",
      responseTimeCommitment: null,
      socialProfileUrls: [],
    });
  });
});

describe("updateSiteSettings", () => {
  it("saves a blank required field as an empty string rather than rejecting the save", async () => {
    updateMock.mockResolvedValueOnce({} as never);

    await updateSiteSettings({
      phonePrimary: "  ",
      phoneSecondary: null,
      email: "",
      whatsappNumber: "",
      address: "",
      responseTimeCommitment: null,
      socialProfileUrls: [],
    });

    const updateArgs = updateMock.mock.calls[0][0] as {
      data: { phonePrimary: string; email: string };
    };
    expect(updateArgs.data.phonePrimary).toBe("");
    expect(updateArgs.data.email).toBe("");
  });

  it("nulls a blank phoneSecondary/responseTimeCommitment rather than storing an empty string", async () => {
    updateMock.mockResolvedValueOnce({} as never);

    await updateSiteSettings({
      phonePrimary: "0558 480 001",
      phoneSecondary: "  ",
      email: "kaalberto777@gmail.com",
      whatsappNumber: "233558480001",
      address: "House No. 13 Gbenjin Gbe Avenue",
      responseTimeCommitment: "",
      socialProfileUrls: [],
    });

    const updateArgs = updateMock.mock.calls[0][0] as {
      data: { phoneSecondary: string | null; responseTimeCommitment: string | null };
    };
    expect(updateArgs.data.phoneSecondary).toBeNull();
    expect(updateArgs.data.responseTimeCommitment).toBeNull();
  });

  it("drops blank lines from socialProfileUrls rather than storing them in the array", async () => {
    updateMock.mockResolvedValueOnce({} as never);

    await updateSiteSettings({
      phonePrimary: "0558 480 001",
      phoneSecondary: null,
      email: "kaalberto777@gmail.com",
      whatsappNumber: "233558480001",
      address: "House No. 13 Gbenjin Gbe Avenue",
      responseTimeCommitment: null,
      socialProfileUrls: ["https://linkedin.com/company/kaalbert", "  ", ""],
    });

    const updateArgs = updateMock.mock.calls[0][0] as {
      data: { socialProfileUrls: string[] };
    };
    expect(updateArgs.data.socialProfileUrls).toEqual(["https://linkedin.com/company/kaalbert"]);
  });
});
