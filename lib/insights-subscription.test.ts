import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriber: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  EmailSendError: class EmailSendError extends Error {},
  sendTransactionalEmail: vi.fn(),
}));

import { EmailSendError, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  SubscriptionValidationError,
  subscribeToInsights,
  unsubscribeFromInsights,
} from "@/lib/insights-subscription";

const upsertMock = vi.mocked(prisma.subscriber.upsert);
const findUniqueMock = vi.mocked(prisma.subscriber.findUnique);
const updateMock = vi.mocked(prisma.subscriber.update);
const sendEmailMock = vi.mocked(sendTransactionalEmail);

beforeEach(() => {
  upsertMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
  sendEmailMock.mockReset();
  sendEmailMock.mockResolvedValue(undefined);
  upsertMock.mockResolvedValue({
    id: 1,
    email: "founder@example.com",
    consent: true,
    unsubscribeToken: "tok_abc123",
    subscribedAt: new Date(),
    unsubscribedAt: null,
  } as never);
});

describe("subscribeToInsights", () => {
  it("rejects a missing email without touching the database", async () => {
    await expect(subscribeToInsights({ email: "", consent: true })).rejects.toBeInstanceOf(
      SubscriptionValidationError,
    );
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects consent that isn't explicitly true", async () => {
    await expect(
      subscribeToInsights({ email: "founder@example.com", consent: false }),
    ).rejects.toBeInstanceOf(SubscriptionValidationError);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("upserts by email (lowercased/trimmed), clearing unsubscribedAt on re-confirmation", async () => {
    await subscribeToInsights({ email: "  Founder@Example.com  ", consent: true });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { email: "founder@example.com" },
      update: { consent: true, unsubscribedAt: null },
      create: { email: "founder@example.com", consent: true },
    });
  });

  it("sends a confirmation email containing the unsubscribe link built from the subscriber's own token", async () => {
    await subscribeToInsights({ email: "founder@example.com", consent: true });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const call = sendEmailMock.mock.calls[0][0];
    expect(call.to).toEqual([{ email: "founder@example.com" }]);
    expect(call.htmlContent).toContain("tok_abc123");
    expect(call.htmlContent).toContain("/api/insights/unsubscribe");
  });

  it("does not throw when the confirmation email fails to send — the subscriber row already succeeded", async () => {
    sendEmailMock.mockRejectedValue(new EmailSendError("no API key configured"));

    await expect(
      subscribeToInsights({ email: "founder@example.com", consent: true }),
    ).resolves.toBeUndefined();
  });

  it("re-throws a non-EmailSendError from the send call", async () => {
    sendEmailMock.mockRejectedValue(new Error("unexpected"));

    await expect(
      subscribeToInsights({ email: "founder@example.com", consent: true }),
    ).rejects.toThrow("unexpected");
  });
});

describe("unsubscribeFromInsights", () => {
  it("sets unsubscribedAt for a token that resolves to a real subscriber", async () => {
    findUniqueMock.mockResolvedValue({ id: 7, unsubscribeToken: "tok_abc123" } as never);

    await unsubscribeFromInsights("tok_abc123");

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { unsubscribedAt: expect.any(Date) },
    });
  });

  it("is a no-op (never throws) for an unknown token", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(unsubscribeFromInsights("does-not-exist")).resolves.toBeUndefined();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
