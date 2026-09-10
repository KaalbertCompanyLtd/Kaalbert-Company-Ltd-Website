import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn(), update: vi.fn() },
    adminBackupCode: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("otplib", () => ({
  generateURI: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/auth/totp", () => ({
  generateTotpSecret: vi.fn(),
}));

vi.mock("@/lib/auth/totp-encryption", () => ({
  encryptTotpSecret: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
}));

import { generateURI, verify } from "otplib";

import { hashPassword } from "@/lib/auth/password";
import {
  confirmTotpSetup,
  issueSetupToken,
  resolvePendingTotpSetup,
  TotpSetupError,
} from "@/lib/auth/totp-setup";
import { decryptTotpSecret, encryptTotpSecret } from "@/lib/auth/totp-encryption";
import { generateTotpSecret } from "@/lib/auth/totp";
import { prisma } from "@/lib/prisma";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const updateMock = vi.mocked(prisma.adminUser.update);
const createManyMock = vi.mocked(prisma.adminBackupCode.createMany);
const transactionMock = vi.mocked(prisma.$transaction);
const generateURIMock = vi.mocked(generateURI);
const verifyMock = vi.mocked(verify);
const generateTotpSecretMock = vi.mocked(generateTotpSecret);
const encryptTotpSecretMock = vi.mocked(encryptTotpSecret);
const decryptTotpSecretMock = vi.mocked(decryptTotpSecret);
const hashPasswordMock = vi.mocked(hashPassword);

const BASE_USER = {
  id: 1,
  name: "Test Partner",
  email: "partner@example.invalid",
  passwordHash: "hash",
  role: "partner",
  totpSecret: null as string | null,
  totpEnabled: false,
  createdAt: new Date(),
  lastLoginAt: null,
  setupToken: "opaque-token",
  setupTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
};

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset().mockResolvedValue({} as never);
  createManyMock.mockReset().mockResolvedValue({ count: 8 } as never);
  transactionMock.mockReset().mockResolvedValue([] as never);
  generateURIMock.mockReset().mockReturnValue("otpauth://totp/stub");
  verifyMock.mockReset();
  generateTotpSecretMock.mockReset().mockReturnValue("RAWSECRETBASE32");
  encryptTotpSecretMock.mockReset().mockReturnValue("encrypted-ciphertext");
  decryptTotpSecretMock.mockReset().mockReturnValue("RAWSECRETBASE32");
  hashPasswordMock.mockReset().mockImplementation(async (value) => `hashed:${value}`);
});

describe("resolvePendingTotpSetup", () => {
  it("returns null when no admin_user matches the token", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(resolvePendingTotpSetup("bad-token")).resolves.toBeNull();
  });

  it("returns null when the account already completed setup", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpEnabled: true } as never);

    await expect(resolvePendingTotpSetup("opaque-token")).resolves.toBeNull();
  });

  it("returns null when the setup link has expired", async () => {
    findUniqueMock.mockResolvedValue({
      ...BASE_USER,
      setupTokenExpiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(resolvePendingTotpSetup("opaque-token")).resolves.toBeNull();
  });

  it("generates and stores a new encrypted secret on first visit", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpSecret: null } as never);

    const pending = await resolvePendingTotpSetup("opaque-token");

    expect(generateTotpSecretMock).toHaveBeenCalledOnce();
    expect(encryptTotpSecretMock).toHaveBeenCalledWith("RAWSECRETBASE32");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: BASE_USER.id },
      data: { totpSecret: "encrypted-ciphertext" },
    });
    expect(pending).toMatchObject({
      adminUserId: BASE_USER.id,
      manualKey: "RAWSECRETBASE32",
      otpauthUri: "otpauth://totp/stub",
    });
  });

  it("reuses the already-pending secret on a later visit, without regenerating it", async () => {
    findUniqueMock.mockResolvedValue({
      ...BASE_USER,
      totpSecret: "already-encrypted",
    } as never);

    await resolvePendingTotpSetup("opaque-token");

    expect(generateTotpSecretMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(decryptTotpSecretMock).toHaveBeenCalledWith("already-encrypted");
  });
});

describe("confirmTotpSetup — deliberate failed attempts", () => {
  it("rejects a missing/invalid token without leaking why", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(confirmTotpSetup("bad-token", "123456")).rejects.toBeInstanceOf(TotpSetupError);
  });

  it("rejects an already-completed setup token", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpEnabled: true } as never);

    await expect(confirmTotpSetup("opaque-token", "123456")).rejects.toBeInstanceOf(TotpSetupError);
  });

  it("rejects an expired setup token", async () => {
    findUniqueMock.mockResolvedValue({
      ...BASE_USER,
      totpSecret: "encrypted",
      setupTokenExpiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(confirmTotpSetup("opaque-token", "123456")).rejects.toBeInstanceOf(TotpSetupError);
  });

  it("rejects an incorrect code and never includes the raw secret or code in the thrown error", async () => {
    const rawCode = "999999";
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpSecret: "encrypted" } as never);
    verifyMock.mockResolvedValue({ valid: false });

    try {
      await confirmTotpSetup("opaque-token", rawCode);
      expect.unreachable("confirmTotpSetup should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TotpSetupError);
      expect((error as Error).message).not.toContain(rawCode);
      expect((error as Error).message).not.toContain("RAWSECRETBASE32");
    }
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("confirms a correct code: enables TOTP, stores 8 hashed backup codes, and consumes the token", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpSecret: "encrypted" } as never);
    verifyMock.mockResolvedValue({ valid: true, delta: 0 });

    const backupCodes = await confirmTotpSetup("opaque-token", "123456");

    expect(backupCodes).toHaveLength(8);
    for (const code of backupCodes) {
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
    // Every code is unique.
    expect(new Set(backupCodes).size).toBe(8);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: BASE_USER.id },
      data: { totpEnabled: true, setupToken: null, setupTokenExpiresAt: null },
    });
    expect(createManyMock).toHaveBeenCalledWith({
      data: backupCodes.map((code) => ({
        adminUserId: BASE_USER.id,
        codeHash: `hashed:${code}`,
      })),
    });
  });
});

describe("issueSetupToken", () => {
  it("generates a fresh token, stores it with a future expiry, and returns the full URL", async () => {
    const url = await issueSetupToken(BASE_USER.id, { baseUrl: "https://kaalbert.com" });

    expect(url).toMatch(/^https:\/\/kaalbert\.com\/admin\/setup-2fa\?token=[a-f0-9]{48}$/);
    expect(updateMock).toHaveBeenCalledOnce();
    const call = updateMock.mock.calls[0][0];
    expect(call.where).toEqual({ id: BASE_USER.id });
    expect(typeof call.data.setupToken).toBe("string");
    expect((call.data.setupTokenExpiresAt as Date).getTime()).toBeGreaterThan(Date.now());
  });

  it("defaults to a relative URL when no baseUrl is given", async () => {
    const url = await issueSetupToken(BASE_USER.id);

    expect(url).toMatch(/^\/admin\/setup-2fa\?token=[a-f0-9]{48}$/);
  });
});
