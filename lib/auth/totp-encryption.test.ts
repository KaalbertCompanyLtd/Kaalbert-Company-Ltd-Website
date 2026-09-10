import { randomBytes } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  TotpEncryptionError,
  decryptTotpSecret,
  encryptTotpSecret,
} from "@/lib/auth/totp-encryption";
import { generateTotpSecret } from "@/lib/auth/totp";

beforeEach(() => {
  process.env.ADMIN_TOTP_ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

describe("encryptTotpSecret / decryptTotpSecret", () => {
  it("round-trips a real otplib-generated secret", () => {
    const rawSecret = generateTotpSecret();

    const encrypted = encryptTotpSecret(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted).not.toContain(rawSecret);
    expect(decryptTotpSecret(encrypted)).toBe(rawSecret);
  });

  it("uses a fresh random IV each call, so the same secret never encrypts to the same value twice", () => {
    const rawSecret = generateTotpSecret();

    expect(encryptTotpSecret(rawSecret)).not.toBe(encryptTotpSecret(rawSecret));
  });

  it("fails closed with a generic error — never the raw secret — on tampered ciphertext", () => {
    const rawSecret = generateTotpSecret();
    const encrypted = encryptTotpSecret(rawSecret);
    const tampered = `${encrypted.slice(0, -2)}${encrypted.slice(-2) === "AA" ? "BB" : "AA"}`;

    try {
      decryptTotpSecret(tampered);
      expect.unreachable("decryptTotpSecret should have thrown on tampered ciphertext");
    } catch (error) {
      expect(error).toBeInstanceOf(TotpEncryptionError);
      expect((error as Error).message).not.toContain(rawSecret);
      expect((error as Error).message).not.toContain(encrypted);
    }
  });

  it("throws a clear, secret-free error when the encryption key is not configured", () => {
    const rawSecret = generateTotpSecret();
    delete process.env.ADMIN_TOTP_ENCRYPTION_KEY;

    expect(() => encryptTotpSecret(rawSecret)).toThrow(TotpEncryptionError);
  });

  it("throws a clear, secret-free error when the encryption key is the wrong length", () => {
    const rawSecret = generateTotpSecret();
    process.env.ADMIN_TOTP_ENCRYPTION_KEY = "not-64-hex-chars";

    expect(() => encryptTotpSecret(rawSecret)).toThrow(TotpEncryptionError);
  });
});
