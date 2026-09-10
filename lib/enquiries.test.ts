import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { create: vi.fn() },
  },
}));

vi.mock("@/lib/contact", () => ({
  resolveServiceContext: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/insights-subscription", () => ({
  subscribeToInsights: vi.fn(),
}));

vi.mock("@/lib/attribution", () => ({
  resolveAttributionId: vi.fn(),
}));

import { resolveAttributionId } from "@/lib/attribution";
import { subscribeToInsights } from "@/lib/insights-subscription";
import { prisma } from "@/lib/prisma";
import { ContactValidationError, createContactEnquiry } from "@/lib/enquiries";

const createMock = vi.mocked(prisma.enquiryRecord.create);
const subscribeMock = vi.mocked(subscribeToInsights);
const resolveAttributionIdMock = vi.mocked(resolveAttributionId);

const VALID_INPUT = {
  name: "Ama Owusu",
  email: "ama@example.com",
  message: "Need help with our books.",
  contactConsent: true,
};

beforeEach(() => {
  createMock.mockReset();
  subscribeMock.mockReset();
  subscribeMock.mockResolvedValue(undefined);
  createMock.mockResolvedValue({ id: 1 } as never);
  resolveAttributionIdMock.mockReset();
  resolveAttributionIdMock.mockResolvedValue(null);
});

describe("createContactEnquiry", () => {
  it("rejects a submission without contact consent, before touching the database", async () => {
    await expect(
      createContactEnquiry({ ...VALID_INPUT, contactConsent: false }),
    ).rejects.toBeInstanceOf(ContactValidationError);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not subscribe to Insights when marketing consent is absent", async () => {
    await createContactEnquiry(VALID_INPUT);

    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("subscribes to Insights when marketing consent is checked — the form's own copy names Insights specifically", async () => {
    await createContactEnquiry({ ...VALID_INPUT, marketingConsent: true });

    expect(subscribeMock).toHaveBeenCalledWith({ email: "ama@example.com", consent: true });
  });

  it("still returns the created enquiry even if the Insights subscription call fails", async () => {
    subscribeMock.mockRejectedValue(new Error("db down"));

    await expect(createContactEnquiry({ ...VALID_INPUT, marketingConsent: true })).resolves.toEqual(
      { id: 1 },
    );
  });

  it("resolves and links the enquiry to its attribution row when a payload is supplied (T5.4)", async () => {
    resolveAttributionIdMock.mockResolvedValue(7);
    const rawAttribution = { sessionId: "abc", landingPage: "/", firstSeen: "2026-09-01" };

    await createContactEnquiry({ ...VALID_INPUT, attribution: rawAttribution });

    expect(resolveAttributionIdMock).toHaveBeenCalledWith(rawAttribution);
    const createArgs = createMock.mock.calls[0][0] as { data: { attributionId: number | null } };
    expect(createArgs.data.attributionId).toBe(7);
  });

  it("links no attribution (null) when the payload is absent — never blocks submission", async () => {
    await createContactEnquiry(VALID_INPUT);

    const createArgs = createMock.mock.calls[0][0] as { data: { attributionId: number | null } };
    expect(createArgs.data.attributionId).toBeNull();
  });
});
