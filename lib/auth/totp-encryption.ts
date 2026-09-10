import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Thrown for any encrypt/decrypt failure — missing/malformed key, malformed ciphertext, or a
 * failed authentication-tag check (tampered/corrupted data). The message never includes the
 * raw secret or the ciphertext itself (`docs/tasks/06-admin-auth.md` T6.1's acceptance
 * criterion: no raw TOTP secret is ever written to logs, including via an error message).
 */
export class TotpEncryptionError extends Error {}

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32; // AES-256
const IV_LENGTH_BYTES = 12; // GCM's recommended nonce length

/**
 * `admin_user.totp_secret` must be recoverable in plaintext at verification time (TOTP code
 * computation needs the live secret), unlike `password_hash`/`code_hash`, which only ever
 * need one-way comparison — so this is reversible symmetric encryption, not hashing. AES-256-
 * GCM via Node's own built-in `crypto` module is the encryption *primitive*; nothing here
 * hand-rolls a cipher, satisfying ADR 0007's "never hand-rolled crypto" the same way `otplib`
 * (`lib/auth/totp.ts`) does for the RFC 6238 core itself — this module only manages the key
 * and the encrypt/decrypt call shape, a real design decision this task resolves per its own
 * architecture constraints (see `memory/decision-log.md`, T6.1). The key is a single
 * server-held 32-byte value read from `ADMIN_TOTP_ENCRYPTION_KEY` (hex-encoded, 64 characters)
 * — a dedicated KMS/vault is not justified at this project's current scale (one shared admin
 * system, five partners); revisit if that changes.
 */
function getKey(): Buffer {
  const keyHex = process.env.ADMIN_TOTP_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new TotpEncryptionError(
      "ADMIN_TOTP_ENCRYPTION_KEY is not set — cannot encrypt/decrypt TOTP secrets. See CLAUDE.local.md.",
    );
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new TotpEncryptionError(
      `ADMIN_TOTP_ENCRYPTION_KEY must be a ${KEY_LENGTH_BYTES * 2}-character hex string (${KEY_LENGTH_BYTES} bytes) for AES-256-GCM.`,
    );
  }
  return key;
}

/**
 * Encrypts a raw TOTP secret for storage in `admin_user.totp_secret`. Output shape is
 * `iv.authTag.ciphertext`, each segment base64-encoded — a fresh random IV every call, so
 * encrypting the same secret twice never produces the same ciphertext twice.
 */
export function encryptTotpSecret(rawSecret: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(rawSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buffer) => buffer.toString("base64")).join(".");
}

/** Reverses `encryptTotpSecret`, returning the raw secret. Fails closed on any tampering. */
export function decryptTotpSecret(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(".");
  if (parts.length !== 3) {
    throw new TotpEncryptionError("Malformed encrypted TOTP secret — cannot decrypt.");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;

  try {
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    throw new TotpEncryptionError(
      "Failed to decrypt TOTP secret — the stored value may be corrupted or the encryption key has changed.",
    );
  }
}
