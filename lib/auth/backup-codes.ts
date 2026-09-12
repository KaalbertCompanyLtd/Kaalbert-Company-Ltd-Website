import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { hashPassword } from "./password";

const BACKUP_CODE_COUNT = 8;
// Readable backup-code alphabet — no 0/O/1/I/L, so a partner transcribing one by hand from a
// screen or printout can't confuse characters.
const BACKUP_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateBackupCode(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(
    bytes,
    (byte) => BACKUP_CODE_ALPHABET[byte % BACKUP_CODE_ALPHABET.length],
  ).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/**
 * Pure generation step, no database access — extracted at session 60 from `lib/auth/
 * totp-setup.ts`'s `confirmTotpSetup` (which had this inlined) so that function can still
 * fold the resulting hashes into its own single atomic transaction alongside the
 * `totpEnabled` flip, while `regenerateBackupCodes` below reuses the exact same generation
 * logic for a standalone call (`/admin/account`'s voluntary "Regenerate backup codes",
 * session 60) that has no such flip to stay atomic with.
 */
export async function generateHashedBackupCodes(): Promise<{
  plaintext: string[];
  hashed: string[];
}> {
  const plaintext = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const hashed = await Promise.all(plaintext.map((code) => hashPassword(code)));
  return { plaintext, hashed };
}

/**
 * Generates a fresh batch of 8 backup codes, retires every *unused* code from any previous
 * batch, and stores only the hashes — the standalone version of the same logic
 * `confirmTotpSetup` runs inline as part of its own transaction. Returns the plaintext
 * codes — the one and only time they ever exist outside this function's own stack, same rule
 * `confirmTotpSetup` already documented.
 *
 * An already-*used* code from a previous batch is left alone (it's already inert, and this
 * schema never destroys a real usage record — `Subscriber.unsubscribedAt`'s own precedent,
 * cited the same way at `confirmTotpSetup`'s own original doc-comment).
 */
export async function regenerateBackupCodes(adminUserId: number): Promise<string[]> {
  const { plaintext, hashed } = await generateHashedBackupCodes();

  await prisma.$transaction([
    prisma.adminBackupCode.deleteMany({ where: { adminUserId, usedAt: null } }),
    prisma.adminBackupCode.createMany({
      data: hashed.map((codeHash) => ({ adminUserId, codeHash })),
    }),
  ]);

  return plaintext;
}
