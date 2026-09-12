import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn(), update: vi.fn() },
    adminSession: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("./password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { ChangePasswordError, changeOwnPassword } from "./change-password";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const transactionMock = vi.mocked(prisma.$transaction);
const hashPasswordMock = vi.mocked(hashPassword);
const verifyPasswordMock = vi.mocked(verifyPassword);

beforeEach(() => {
  findUniqueMock.mockReset();
  transactionMock.mockReset();
  hashPasswordMock.mockReset();
  verifyPasswordMock.mockReset();
  transactionMock.mockImplementation(((ops: unknown[]) => Promise.all(ops)) as never);
});

describe("changeOwnPassword", () => {
  it("rejects when the account doesn't exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(changeOwnPassword(1, "current", "a-new-long-password")).rejects.toThrow(
      ChangePasswordError,
    );
  });

  it("rejects a wrong current password", async () => {
    findUniqueMock.mockResolvedValue({ id: 1, passwordHash: "hash" } as never);
    verifyPasswordMock.mockResolvedValue(false);

    await expect(changeOwnPassword(1, "wrong", "a-new-long-password")).rejects.toThrow(
      "Current password is incorrect.",
    );
  });

  it("rejects a new password shorter than the minimum length", async () => {
    findUniqueMock.mockResolvedValue({ id: 1, passwordHash: "hash" } as never);
    verifyPasswordMock.mockResolvedValue(true);

    await expect(changeOwnPassword(1, "current", "short")).rejects.toThrow(
      "at least 12 characters",
    );
  });

  it("accepts a correct current password and a valid new one, and ends every session", async () => {
    findUniqueMock.mockResolvedValue({ id: 1, passwordHash: "hash" } as never);
    verifyPasswordMock.mockResolvedValue(true);
    hashPasswordMock.mockResolvedValue("new-hash");

    await changeOwnPassword(1, "current", "a-new-long-password");

    expect(prisma.adminUser.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { passwordHash: "new-hash" },
    });
    expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({ where: { adminUserId: 1 } });
  });
});
