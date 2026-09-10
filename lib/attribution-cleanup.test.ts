import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    attribution: { deleteMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteExpiredAttributionRows } from "@/lib/attribution-cleanup";

const deleteManyMock = vi.mocked(prisma.attribution.deleteMany);

beforeEach(() => {
  deleteManyMock.mockReset();
  deleteManyMock.mockResolvedValue({ count: 3 } as never);
});

describe("deleteExpiredAttributionRows", () => {
  it("deletes only rows older than 90 days with no referencing enquiry, and returns the count", async () => {
    await expect(deleteExpiredAttributionRows()).resolves.toBe(3);

    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    const call = deleteManyMock.mock.calls[0][0] as {
      where: { firstSeen: { lt: Date }; enquiries: { none: object } };
    };

    // Never deletes a row referenced by any real enquiry_record, regardless of age — this
    // task's own explicit acceptance criterion.
    expect(call.where.enquiries).toEqual({ none: {} });

    // The cutoff is ~90 days in the past (allowing a small margin for test execution time).
    const daysAgo = (Date.now() - call.where.firstSeen.lt.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeGreaterThan(89.9);
    expect(daysAgo).toBeLessThan(90.1);
  });
});
