import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn(), update: vi.fn() },
    adminSession: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  EmailSendError: class EmailSendError extends Error {},
  sendTransactionalEmail: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  assertNotFlooded: vi.fn(),
  assertNotRateLimited: vi.fn(),
  recordAttempt: vi.fn(),
  AdminLoginAttemptKind: {
    password_reset_request: "password_reset_request",
    password_reset_confirm: "password_reset_confirm",
  },
  RateLimitError: class RateLimitError extends Error {},
}));

import { sendTransactionalEmail } from "@/lib/email";
import { hashPassword } from "@/lib/auth/password";
import { assertNotFlooded, assertNotRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import {
  confirmPasswordReset,
  issuePasswordResetToken,
  PasswordResetError,
  requestPasswordReset,
  resolvePasswordReset,
} from "@/lib/auth/password-reset";
import { prisma } from "@/lib/prisma";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const updateMock = vi.mocked(prisma.adminUser.update);
const deleteManyMock = vi.mocked(prisma.adminSession.deleteMany);
const transactionMock = vi.mocked(prisma.$transaction);
const sendEmailMock = vi.mocked(sendTransactionalEmail);
const hashPasswordMock = vi.mocked(hashPassword);
const assertNotFloodedMock = vi.mocked(assertNotFlooded);
const assertNotRateLimitedMock = vi.mocked(assertNotRateLimited);
const recordAttemptMock = vi.mocked(recordAttempt);

const BASE_USER = {
  id: 7,
  name: "Ama Wiafe",
  email: "ama@example.invalid",
  active: true,
  passwordResetToken: "sometoken",
  passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
};

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset().mockResolvedValue({} as never);
  deleteManyMock.mockReset().mockResolvedValue({ count: 0 } as never);
  transactionMock.mockReset().mockResolvedValue([] as never);
  sendEmailMock.mockReset().mockResolvedValue(undefined);
  hashPasswordMock.mockReset().mockResolvedValue("hashed");
  assertNotFloodedMock.mockReset().mockResolvedValue(undefined);
  assertNotRateLimitedMock.mockReset().mockResolvedValue(undefined);
  recordAttemptMock.mockReset().mockResolvedValue(undefined);
});

describe("issuePasswordResetToken", () => {
  it("writes a fresh token/expiry and returns the full reset URL", async () => {
    const url = await issuePasswordResetToken(7, { baseUrl: "https://kaalbert.com" });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        passwordResetToken: expect.any(String),
        passwordResetTokenExpiresAt: expect.any(Date),
      },
    });
    expect(url).toMatch(/^https:\/\/kaalbert\.com\/admin\/reset-password\?token=/);
  });
});

describe("requestPasswordReset", () => {
  it("sends a reset email when the account exists and is active", async () => {
    findUniqueMock.mockResolvedValue(BASE_USER as never);

    await requestPasswordReset("ama@example.invalid", { baseUrl: "https://kaalbert.com" });

    expect(assertNotFloodedMock).toHaveBeenCalledWith(
      "ama@example.invalid",
      "password_reset_request",
    );
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({
      to: [{ email: "ama@example.invalid", name: "Ama Wiafe" }],
    });
  });

  it("silently no-ops for an email with no matching account (no enumeration)", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      requestPasswordReset("nobody@example.invalid", { baseUrl: "https://kaalbert.com" }),
    ).resolves.toBeUndefined();

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("silently no-ops for a deactivated account", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, active: false } as never);

    await requestPasswordReset("ama@example.invalid", { baseUrl: "https://kaalbert.com" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("normalizes the email before flood-checking and looking up the account", async () => {
    findUniqueMock.mockResolvedValue(null);

    await requestPasswordReset("  AMA@Example.Invalid  ");

    expect(assertNotFloodedMock).toHaveBeenCalledWith(
      "ama@example.invalid",
      "password_reset_request",
    );
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: "ama@example.invalid" } });
  });
});

describe("resolvePasswordReset", () => {
  it("returns the pending reset for a valid, unexpired token", async () => {
    findUniqueMock.mockResolvedValue(BASE_USER as never);

    await expect(resolvePasswordReset("sometoken")).resolves.toEqual({
      adminUserId: 7,
      name: "Ama Wiafe",
      email: "ama@example.invalid",
    });
  });

  it("returns null for a missing token", async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(resolvePasswordReset("bad-token")).resolves.toBeNull();
  });

  it("returns null for an expired token", async () => {
    findUniqueMock.mockResolvedValue({
      ...BASE_USER,
      passwordResetTokenExpiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(resolvePasswordReset("sometoken")).resolves.toBeNull();
  });

  it("returns null for a deactivated account", async () => {
    findUniqueMock.mockResolvedValue({ ...BASE_USER, active: false } as never);
    await expect(resolvePasswordReset("sometoken")).resolves.toBeNull();
  });
});

describe("confirmPasswordReset", () => {
  it("hashes the new password, consumes the token, and invalidates every session", async () => {
    findUniqueMock.mockResolvedValue(BASE_USER as never);

    await confirmPasswordReset("sometoken", "a-strong-new-password");

    expect(hashPasswordMock).toHaveBeenCalledWith("a-strong-new-password");
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing/invalid token", async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(confirmPasswordReset("bad-token", "a-strong-new-password")).rejects.toBeInstanceOf(
      PasswordResetError,
    );
  });

  it("rejects an expired token", async () => {
    findUniqueMock.mockResolvedValue({
      ...BASE_USER,
      passwordResetTokenExpiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(confirmPasswordReset("sometoken", "a-strong-new-password")).rejects.toBeInstanceOf(
      PasswordResetError,
    );
  });

  it("rejects a password shorter than the minimum length", async () => {
    findUniqueMock.mockResolvedValue(BASE_USER as never);

    await expect(confirmPasswordReset("sometoken", "tooshort")).rejects.toBeInstanceOf(
      PasswordResetError,
    );
    expect(transactionMock).not.toHaveBeenCalled();
    expect(recordAttemptMock).toHaveBeenCalledWith(
      "ama@example.invalid",
      "password_reset_confirm",
      false,
    );
  });

  it("checks rate limiting before doing any work", async () => {
    findUniqueMock.mockResolvedValue(BASE_USER as never);

    await confirmPasswordReset("sometoken", "a-strong-new-password");

    expect(assertNotRateLimitedMock).toHaveBeenCalledWith(
      "ama@example.invalid",
      "password_reset_confirm",
    );
  });
});
