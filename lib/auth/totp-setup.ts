import { randomBytes } from "node:crypto";

import { generateURI, verify } from "otplib";

import { prisma } from "@/lib/prisma";

import { hashPassword } from "./password";
import { decryptTotpSecret, encryptTotpSecret } from "./totp-encryption";
import { generateTotpSecret } from "./totp";

/**
 * Thrown when a `/admin/setup-2fa` confirmation attempt fails — an invalid/expired/consumed
 * setup token, or an incorrect TOTP code. The message is always the same generic text
 * regardless of which of those applies (never distinguishes "wrong code" from "invalid
 * token" to an unauthenticated caller), and never includes the raw TOTP secret or the
 * attempted code (`docs/tasks/06-admin-auth.md` T6.1's no-plaintext-in-logs standard applies
 * here too, even though this is T6.2).
 */
export class TotpSetupError extends Error {}

const TOTP_ISSUER = "Kaalbert & Company Ltd";
const BACKUP_CODE_COUNT = 8;
// A setup link stays valid for a week — long enough to reach a partner through whatever
// channel issues it (T6.4's re-enrolment redirect, T6.6's provisioning script), short enough
// that a stale, never-completed link doesn't stay live indefinitely.
const SETUP_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
// A small, standard clock-drift allowance (admin-authentication.md's edge case: "TOTP's
// standard time-window tolerance... is respected") — one 30s step each side of now.
const EPOCH_TOLERANCE: [number, number] = [1, 1];
// Readable backup-code alphabet — no 0/O/1/I/L, so a partner transcribing one by hand from a
// screen or printout can't confuse characters.
const BACKUP_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Issues a fresh, single-use `/admin/setup-2fa` link token for an existing `admin_user` row
 * and returns the full URL to hand to that partner. Two real callers, neither built by this
 * task: T6.6 (a developer-run script creating a brand-new account, the only way one exists
 * at all today — see `memory/technical-debt.md`) and T6.4 (re-issuing one after a backup-code
 * recovery login, per that task's own "forced redirect to `/admin/setup-2fa` to re-enroll a
 * new device"). Both reuse this single mechanism rather than each inventing their own.
 */
export async function issueSetupToken(
  adminUserId: number,
  { baseUrl = "" }: { baseUrl?: string } = {},
): Promise<string> {
  const setupToken = randomBytes(24).toString("hex");
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      setupToken,
      setupTokenExpiresAt: new Date(Date.now() + SETUP_TOKEN_LIFETIME_MS),
    },
  });
  return `${baseUrl}/admin/setup-2fa?token=${setupToken}`;
}

export interface PendingTotpSetup {
  adminUserId: number;
  name: string;
  email: string;
  /** `otpauth://` URI for QR code rendering — never logged, never sent anywhere but this render. */
  otpauthUri: string;
  /** Raw Base32 secret, for the mockup's "enter the setup key manually" fallback. */
  manualKey: string;
}

/**
 * Resolves a `/admin/setup-2fa?token=...` link to the `admin_user` it belongs to. Returns
 * `null` for a missing, invalid, expired, already-completed, or already-consumed token — the
 * caller (the page itself) renders one generic "this link is no longer valid" state for all
 * of those, never distinguishing which reason applies to an unauthenticated visitor.
 *
 * Generates a fresh TOTP secret (encrypted before it ever reaches `admin_user.totp_secret`,
 * per `lib/auth/totp-encryption.ts`) the first time this runs for a given account; a later
 * call for the same still-pending token reuses the already-generated secret instead of
 * rotating it, so the QR code a partner is looking at stays valid across a page refresh.
 */
export async function resolvePendingTotpSetup(
  setupToken: string,
): Promise<PendingTotpSetup | null> {
  const user = await prisma.adminUser.findUnique({ where: { setupToken } });
  if (!user || user.totpEnabled) return null;
  if (user.setupTokenExpiresAt && user.setupTokenExpiresAt < new Date()) return null;

  const rawSecret = user.totpSecret
    ? decryptTotpSecret(user.totpSecret)
    : await generateAndStoreSecret(user.id);

  const otpauthUri = generateURI({
    issuer: TOTP_ISSUER,
    label: user.email,
    secret: rawSecret,
  });

  return {
    adminUserId: user.id,
    name: user.name,
    email: user.email,
    otpauthUri,
    manualKey: rawSecret,
  };
}

async function generateAndStoreSecret(adminUserId: number): Promise<string> {
  const rawSecret = generateTotpSecret();
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: { totpSecret: encryptTotpSecret(rawSecret) },
  });
  return rawSecret;
}

/**
 * Confirms a partner's first TOTP code, completing setup: flips `totp_enabled`, generates
 * and hashes a batch of backup codes, and consumes the setup token (single-use — a second
 * call with the same token, before or after success, always fails). Returns the plaintext
 * backup codes — the one and only time they ever exist outside this function's own stack;
 * everywhere else, only `admin_backup_code.code_hash` exists.
 */
export async function confirmTotpSetup(setupToken: string, code: string): Promise<string[]> {
  const user = await prisma.adminUser.findUnique({ where: { setupToken } });
  if (!user || user.totpEnabled || !user.totpSecret) {
    throw new TotpSetupError("This setup link is no longer valid.");
  }
  if (user.setupTokenExpiresAt && user.setupTokenExpiresAt < new Date()) {
    throw new TotpSetupError("This setup link is no longer valid.");
  }

  const rawSecret = decryptTotpSecret(user.totpSecret);
  const result = await verify({ secret: rawSecret, token: code, epochTolerance: EPOCH_TOLERANCE });
  if (!result.valid) {
    throw new TotpSetupError("That code didn't match — please try again.");
  }

  const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const hashedCodes = await Promise.all(backupCodes.map((backupCode) => hashPassword(backupCode)));

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: { totpEnabled: true, setupToken: null, setupTokenExpiresAt: null },
    }),
    prisma.adminBackupCode.createMany({
      data: hashedCodes.map((codeHash) => ({ adminUserId: user.id, codeHash })),
    }),
  ]);

  return backupCodes;
}

function generateBackupCode(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(
    bytes,
    (byte) => BACKUP_CODE_ALPHABET[byte % BACKUP_CODE_ALPHABET.length],
  ).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}
