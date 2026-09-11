import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriber: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSubscriberList, removeSubscriber } from "@/lib/admin-subscribers";

const findManyMock = vi.mocked(prisma.subscriber.findMany);
const findUniqueMock = vi.mocked(prisma.subscriber.findUnique);
const updateMock = vi.mocked(prisma.subscriber.update);

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
});

describe("getSubscriberList", () => {
  it("returns every row, subscribed and unsubscribed alike", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: 1,
        email: "a@example.com",
        consent: true,
        subscribedAt: new Date("2026-01-01"),
        unsubscribedAt: null,
      },
      {
        id: 2,
        email: "b@example.com",
        consent: true,
        subscribedAt: new Date("2026-02-01"),
        unsubscribedAt: new Date("2026-03-01"),
      },
    ] as never);

    const result = await getSubscriberList();

    expect(result).toHaveLength(2);
    expect(result[1].unsubscribedAt).toEqual(new Date("2026-03-01"));
  });
});

describe("removeSubscriber", () => {
  it("looks up the row's token and reuses unsubscribeFromInsights — same underlying update as the visitor path", async () => {
    const row = { id: 1, email: "a@example.com", unsubscribeToken: "tok_123" };
    // First call: removeSubscriber's own lookup by id. Second call: the token-based lookup
    // inside the reused `unsubscribeFromInsights` — same mocked `prisma` module, two calls.
    findUniqueMock.mockResolvedValueOnce(row as never).mockResolvedValueOnce(row as never);
    updateMock.mockResolvedValueOnce({} as never);

    await removeSubscriber(1);

    expect(findUniqueMock).toHaveBeenNthCalledWith(1, { where: { id: 1 } });
    expect(findUniqueMock).toHaveBeenNthCalledWith(2, { where: { unsubscribeToken: "tok_123" } });
    const updateArgs = updateMock.mock.calls[0][0] as {
      where: { id: number };
      data: { unsubscribedAt: Date };
    };
    expect(updateArgs.where).toEqual({ id: 1 });
    expect(updateArgs.data.unsubscribedAt).toBeInstanceOf(Date);
  });

  it("is a no-op for an id with no matching row", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await removeSubscriber(999);

    expect(updateMock).not.toHaveBeenCalled();
  });
});
