import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: { findUnique: vi.fn() },
    footerContent: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSiteFooterContent, splitAddressLines, toTelHref } from "@/lib/site-settings";

const siteSettingsFindUniqueMock = vi.mocked(prisma.siteSettings.findUnique);
const footerContentFindFirstMock = vi.mocked(prisma.footerContent.findFirst);

beforeEach(() => {
  siteSettingsFindUniqueMock.mockReset();
  footerContentFindFirstMock.mockReset();
});

describe("splitAddressLines", () => {
  it("drops blank lines", () => {
    expect(splitAddressLines("Line 1\n\nLine 2")).toEqual(["Line 1", "Line 2"]);
  });

  it("returns an empty array for a blank address", () => {
    expect(splitAddressLines("")).toEqual([]);
  });
});

describe("toTelHref", () => {
  it("converts a local trunk-prefix number to a +233 tel: href", () => {
    expect(toTelHref("0558 480 001")).toBe("tel:+233558480001");
  });
});

describe("getSiteFooterContent", () => {
  it("combines site_settings and footer_content into SiteFooter's exact prop shape", async () => {
    siteSettingsFindUniqueMock.mockResolvedValueOnce({
      phonePrimary: "0558 480 001",
      address: "House No. 13 Gbenjin Gbe Avenue\nEast Legon-ARS, Accra, Ghana",
    } as never);
    footerContentFindFirstMock.mockResolvedValueOnce({
      scopeOfPracticeStatement: "Statement",
      companyRegistrationDetails: null,
    } as never);

    const result = await getSiteFooterContent();

    expect(result).toEqual({
      addressLine1: "House No. 13 Gbenjin Gbe Avenue",
      addressLine2: "East Legon-ARS, Accra, Ghana",
      phonePrimary: "0558 480 001",
      scopeOfPracticeStatement: "Statement",
      companyRegistrationDetails: null,
    });
  });

  it("returns empty address lines when site_settings.address is blank, not undefined", async () => {
    siteSettingsFindUniqueMock.mockResolvedValueOnce({
      phonePrimary: "",
      address: "",
    } as never);
    footerContentFindFirstMock.mockResolvedValueOnce({
      scopeOfPracticeStatement: "Statement",
      companyRegistrationDetails: "RC No. 12345",
    } as never);

    const result = await getSiteFooterContent();

    expect(result.addressLine1).toBe("");
    expect(result.addressLine2).toBe("");
    expect(result.companyRegistrationDetails).toBe("RC No. 12345");
  });
});
