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

import { subscribeToInsights } from "@/lib/insights-subscription";
import { prisma } from "@/lib/prisma";
import { ContactValidationError, createContactEnquiry } from "@/lib/enquiries";

const createMock = vi.mocked(prisma.enquiryRecord.create);
const subscribeMock = vi.mocked(subscribeToInsights);

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
});
