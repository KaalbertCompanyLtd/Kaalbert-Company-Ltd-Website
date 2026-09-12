import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminBackupCode: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("./password", () => ({ hashPassword: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";
import { generateHashedBackupCodes, regenerateBackupCodes } from "./backup-codes";

const transactionMock = vi.mocked(prisma.$transaction);
const hashPasswordMock = vi.mocked(hashPassword);

beforeEach(() => {
  transactionMock.mockReset();
  hashPasswordMock.mockReset();
  hashPasswordMock.mockImplementation(async (value) => `hashed:${value}`);
  transactionMock.mockImplementation(((ops: unknown[]) => Promise.all(ops)) as never);
});

describe("generateHashedBackupCodes", () => {
  it("generates 8 unique, dash-formatted codes and their hashes", async () => {
    const { plaintext, hashed } = await generateHashedBackupCodes();

    expect(plaintext).toHaveLength(8);
    expect(new Set(plaintext).size).toBe(8);
    for (const code of plaintext) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
    expect(hashed).toEqual(plaintext.map((code) => `hashed:${code}`));
  });
});

describe("regenerateBackupCodes", () => {
  it("retires unused codes and stores a fresh hashed batch, returning the plaintext codes", async () => {
    const codes = await regenerateBackupCodes(7);

    expect(codes).toHaveLength(8);
    expect(prisma.adminBackupCode.deleteMany).toHaveBeenCalledWith({
      where: { adminUserId: 7, usedAt: null },
    });
    expect(prisma.adminBackupCode.createMany).toHaveBeenCalledWith({
      data: codes.map((code) => ({ adminUserId: 7, codeHash: `hashed:${code}` })),
    });
  });
});
