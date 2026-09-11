import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminLoginAttempt: { count: vi.fn(), create: vi.fn() },
  },
}));

import {
  AdminLoginAttemptKind,
  assertNotFlooded,
  assertNotRateLimited,
  RateLimitError,
  recordAttempt,
} from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

const countMock = vi.mocked(prisma.adminLoginAttempt.count);
const createMock = vi.mocked(prisma.adminLoginAttempt.create);

beforeEach(() => {
  countMock.mockReset();
  createMock.mockReset().mockResolvedValue({} as never);
});

describe("assertNotRateLimited", () => {
  it("passes when recent failures are under the threshold", async () => {
    countMock.mockResolvedValue(4);

    await expect(
      assertNotRateLimited("partner@example.invalid", AdminLoginAttemptKind.password),
    ).resolves.toBeUndefined();
  });

  it("throws RateLimitError once recent failures reach the threshold", async () => {
    countMock.mockResolvedValue(5);

    await expect(
      assertNotRateLimited("partner@example.invalid", AdminLoginAttemptKind.totp),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("only counts failures within the recent window, scoped to the identifier/kind", async () => {
    await assertNotRateLimited("partner@example.invalid", AdminLoginAttemptKind.setup_confirm);

    expect(countMock).toHaveBeenCalledWith({
      where: {
        identifier: "partner@example.invalid",
        kind: AdminLoginAttemptKind.setup_confirm,
        success: false,
        createdAt: { gte: expect.any(Date) },
      },
    });
  });
});

describe("assertNotFlooded", () => {
  it("passes when recent attempts are under the threshold", async () => {
    countMock.mockResolvedValue(2);

    await expect(
      assertNotFlooded("partner@example.invalid", AdminLoginAttemptKind.password_reset_request),
    ).resolves.toBeUndefined();
  });

  it("throws RateLimitError once recent attempts reach the threshold", async () => {
    countMock.mockResolvedValue(3);

    await expect(
      assertNotFlooded("partner@example.invalid", AdminLoginAttemptKind.password_reset_request),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("counts every attempt in the window, not just failures", async () => {
    await assertNotFlooded("partner@example.invalid", AdminLoginAttemptKind.password_reset_request);

    expect(countMock).toHaveBeenCalledWith({
      where: {
        identifier: "partner@example.invalid",
        kind: AdminLoginAttemptKind.password_reset_request,
        createdAt: { gte: expect.any(Date) },
      },
    });
  });
});

describe("recordAttempt", () => {
  it("records the attempt with the given identifier, kind, and outcome", async () => {
    await recordAttempt("partner@example.invalid", AdminLoginAttemptKind.password, true);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        identifier: "partner@example.invalid",
        kind: AdminLoginAttemptKind.password,
        success: true,
      },
    });
  });
});
