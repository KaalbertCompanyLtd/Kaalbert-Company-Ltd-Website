import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn(), update: vi.fn() },
    adminBackupCode: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("otplib", () => ({
  verify: vi.fn(),
}));

vi.mock("@/lib/auth/challenge-token", () => ({
  issueChallengeToken: vi.fn(),
  verifyChallengeToken: vi.fn(),
  ChallengeTokenError: class ChallengeTokenError extends Error {},
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  assertNotRateLimited: vi.fn(),
  recordAttempt: vi.fn(),
  AdminLoginAttemptKind: {
    password: "password",
    totp: "totp",
    setup_confirm: "setup_confirm",
    backup_code: "backup_code",
  },
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));

vi.mock("@/lib/auth/totp-encryption", () => ({
  decryptTotpSecret: vi.fn(),
}));

vi.mock("@/lib/auth/totp-setup", () => ({
  issueSetupToken: vi.fn(),
}));

import { verify } from "otplib";

import {
  ChallengeTokenError,
  issueChallengeToken,
  verifyChallengeToken,
} from "@/lib/auth/challenge-token";
import {
  LoginError,
  loginWithPassword,
  verifyBackupCodeLogin,
  verifyTotpLogin,
} from "@/lib/auth/login";
import { verifyPassword } from "@/lib/auth/password";
import { assertNotRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { decryptTotpSecret } from "@/lib/auth/totp-encryption";
import { issueSetupToken } from "@/lib/auth/totp-setup";
import { prisma } from "@/lib/prisma";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const updateMock = vi.mocked(prisma.adminUser.update);
const backupCodeUpdateMock = vi.mocked(prisma.adminBackupCode.update);
const transactionMock = vi.mocked(prisma.$transaction);
const verifyMock = vi.mocked(verify);
const issueChallengeTokenMock = vi.mocked(issueChallengeToken);
const verifyChallengeTokenMock = vi.mocked(verifyChallengeToken);
const verifyPasswordMock = vi.mocked(verifyPassword);
const assertNotRateLimitedMock = vi.mocked(assertNotRateLimited);
const recordAttemptMock = vi.mocked(recordAttempt);
const createSessionMock = vi.mocked(createSession);
const decryptTotpSecretMock = vi.mocked(decryptTotpSecret);
const issueSetupTokenMock = vi.mocked(issueSetupToken);

const BASE_USER = {
  id: 7,
  name: "Test Partner",
  email: "partner@example.invalid",
  passwordHash: "hash",
  role: "partner",
  totpSecret: "encrypted-secret",
  totpEnabled: true,
  createdAt: new Date(),
  lastLoginAt: null,
  setupToken: null,
  setupTokenExpiresAt: null,
  lastVerifiedTotpStep: null as number | null,
  active: true,
};

const UNUSED_BACKUP_CODES = [
  { id: 101, adminUserId: 7, codeHash: "hash-1", usedAt: null },
  { id: 102, adminUserId: 7, codeHash: "hash-2", usedAt: null },
];

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset().mockResolvedValue({} as never);
  backupCodeUpdateMock.mockReset().mockResolvedValue({} as never);
  transactionMock.mockReset().mockResolvedValue([] as never);
  verifyMock.mockReset();
  issueChallengeTokenMock.mockReset().mockReturnValue("challenge-token-value");
  verifyChallengeTokenMock.mockReset();
  verifyPasswordMock.mockReset();
  assertNotRateLimitedMock.mockReset().mockResolvedValue(undefined);
  recordAttemptMock.mockReset().mockResolvedValue(undefined);
  createSessionMock.mockReset().mockResolvedValue({
    token: "session-token",
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  });
  decryptTotpSecretMock.mockReset().mockReturnValue("RAWSECRETBASE32");
  issueSetupTokenMock.mockReset().mockResolvedValue("/admin/setup-2fa?token=fresh-token");
});

describe("loginWithPassword — deliberate failed attempts", () => {
  it("rejects a nonexistent email with the same generic message as a wrong password", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(loginWithPassword("nobody@example.invalid", "whatever")).rejects.toThrow(
      "Invalid email or password.",
    );
    expect(verifyPasswordMock).not.toHaveBeenCalled();
    expect(recordAttemptMock).toHaveBeenCalledWith("nobody@example.invalid", "password", false);
  });

  it("rejects a real email with a wrong password using the same generic message", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER } as never);
    verifyPasswordMock.mockResolvedValue(false);

    const rawPassword = "wrong-password-attempt";
    await expect(loginWithPassword(BASE_USER.email, rawPassword)).rejects.toThrow(
      "Invalid email or password.",
    );
    try {
      await loginWithPassword(BASE_USER.email, rawPassword);
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).not.toContain(rawPassword);
    }
  });

  it("checks the rate limiter before doing any password work, keyed by normalized email", async () => {
    const { RateLimitError } = { RateLimitError: class extends Error {} };
    assertNotRateLimitedMock.mockRejectedValue(new RateLimitError("blocked"));

    await expect(loginWithPassword("  Partner@Example.INVALID ", "pw")).rejects.toThrow("blocked");
    expect(assertNotRateLimitedMock).toHaveBeenCalledWith("partner@example.invalid", "password");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects an account that hasn't completed TOTP setup, with a distinct message", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, totpEnabled: false } as never);
    verifyPasswordMock.mockResolvedValue(true);

    await expect(loginWithPassword(BASE_USER.email, "correct-password")).rejects.toThrow(
      "hasn't completed two-factor setup",
    );
  });

  it("rejects a deactivated account, with a distinct message, only after the password is confirmed correct", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, active: false } as never);
    verifyPasswordMock.mockResolvedValue(true);

    await expect(loginWithPassword(BASE_USER.email, "correct-password")).rejects.toThrow(
      "This account has been deactivated.",
    );
  });
});

describe("loginWithPassword — success", () => {
  it("returns a challenge token and records a successful attempt", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER } as never);
    verifyPasswordMock.mockResolvedValue(true);

    const token = await loginWithPassword(BASE_USER.email, "correct-password");

    expect(token).toBe("challenge-token-value");
    expect(issueChallengeTokenMock).toHaveBeenCalledWith(BASE_USER.id);
    expect(recordAttemptMock).toHaveBeenCalledWith(BASE_USER.email, "password", true);
  });
});

describe("verifyTotpLogin — deliberate failed attempts", () => {
  it("rejects an expired/tampered challenge token", async () => {
    verifyChallengeTokenMock.mockImplementation(() => {
      throw new ChallengeTokenError("bad token");
    });

    await expect(verifyTotpLogin("bad-challenge", "123456")).rejects.toThrow(
      "This login attempt has expired",
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects an incorrect code and never leaks the raw code or secret in the error", async () => {
    const rawCode = "999999";
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER } as never);
    verifyMock.mockResolvedValue({ valid: false });

    try {
      await verifyTotpLogin("challenge-token-value", rawCode);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(LoginError);
      expect((error as Error).message).not.toContain(rawCode);
      expect((error as Error).message).not.toContain("RAWSECRETBASE32");
    }
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(recordAttemptMock).toHaveBeenCalledWith(BASE_USER.email, "totp", false);
  });

  it("passes the account's last-verified time step as afterTimeStep (replay protection)", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER, lastVerifiedTotpStep: 41152263 } as never);
    verifyMock.mockResolvedValue({ valid: true, delta: 0, timeStep: 41152264, epoch: 0 });

    await verifyTotpLogin("challenge-token-value", "123456");

    expect(verifyMock).toHaveBeenCalledWith(expect.objectContaining({ afterTimeStep: 41152263 }));
  });

  it("checks the rate limiter before verifying the code", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER } as never);
    const { RateLimitError } = { RateLimitError: class extends Error {} };
    assertNotRateLimitedMock.mockRejectedValue(new RateLimitError("blocked"));

    await expect(verifyTotpLogin("challenge-token-value", "123456")).rejects.toThrow("blocked");
    expect(verifyMock).not.toHaveBeenCalled();
  });
});

describe("verifyTotpLogin — success", () => {
  it("creates a session, records the new time step, and updates lastLoginAt", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER } as never);
    verifyMock.mockResolvedValue({ valid: true, delta: 0, timeStep: 41152300, epoch: 0 });

    const result = await verifyTotpLogin("challenge-token-value", "123456");

    expect(result.token).toBe("session-token");
    expect(createSessionMock).toHaveBeenCalledWith(BASE_USER.id);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: BASE_USER.id },
      data: expect.objectContaining({ lastVerifiedTotpStep: 41152300 }),
    });
    expect(recordAttemptMock).toHaveBeenCalledWith(BASE_USER.email, "totp", true);
  });
});

describe("verifyBackupCodeLogin — deliberate failed attempts", () => {
  it("rejects an expired/tampered challenge token", async () => {
    verifyChallengeTokenMock.mockImplementation(() => {
      throw new ChallengeTokenError("bad token");
    });

    await expect(verifyBackupCodeLogin("bad-challenge", "ABCD-1234")).rejects.toThrow(
      "This login attempt has expired",
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("checks the rate limiter before matching any codes", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER, backupCodes: UNUSED_BACKUP_CODES } as never);
    const { RateLimitError } = { RateLimitError: class extends Error {} };
    assertNotRateLimitedMock.mockRejectedValue(new RateLimitError("blocked"));

    await expect(verifyBackupCodeLogin("challenge-token-value", "ABCD-1234")).rejects.toThrow(
      "blocked",
    );
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });

  it("rejects a code that matches none of the account's unused codes, never leaking the raw code", async () => {
    const rawCode = "WRNG-CODE";
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER, backupCodes: UNUSED_BACKUP_CODES } as never);
    verifyPasswordMock.mockResolvedValue(false);

    try {
      await verifyBackupCodeLogin("challenge-token-value", rawCode);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(LoginError);
      expect((error as Error).message).not.toContain(rawCode);
    }
    expect(verifyPasswordMock).toHaveBeenCalledTimes(UNUSED_BACKUP_CODES.length);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(recordAttemptMock).toHaveBeenCalledWith(BASE_USER.email, "backup_code", false);
  });

  it("gives a distinct 'contact another administrator' message when no unused codes remain", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER, backupCodes: [] } as never);

    await expect(verifyBackupCodeLogin("challenge-token-value", "ABCD-1234")).rejects.toThrow(
      "contact another administrator",
    );
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });
});

describe("verifyBackupCodeLogin — success", () => {
  it("consumes the matching code, resets TOTP state, and returns a session plus a setup URL", async () => {
    verifyChallengeTokenMock.mockReturnValue(BASE_USER.id);
    findUniqueMock.mockResolvedValue({ ...BASE_USER, backupCodes: UNUSED_BACKUP_CODES } as never);
    // Only the second code matches.
    verifyPasswordMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await verifyBackupCodeLogin("challenge-token-value", "ABCD-1234");

    expect(result.session.token).toBe("session-token");
    expect(result.setupUrl).toBe("/admin/setup-2fa?token=fresh-token");
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(backupCodeUpdateMock).toHaveBeenCalledWith({
      where: { id: UNUSED_BACKUP_CODES[1].id },
      data: { usedAt: expect.any(Date) },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: BASE_USER.id },
      data: { totpEnabled: false, totpSecret: null, lastLoginAt: expect.any(Date) },
    });
    expect(createSessionMock).toHaveBeenCalledWith(BASE_USER.id);
    expect(issueSetupTokenMock).toHaveBeenCalledWith(BASE_USER.id);
    expect(recordAttemptMock).toHaveBeenCalledWith(BASE_USER.email, "backup_code", true);
  });
});
