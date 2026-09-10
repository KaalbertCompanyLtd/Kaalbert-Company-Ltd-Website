import { AdminLoginAttemptKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export { AdminLoginAttemptKind };

/** Thrown when an identifier has too many recent failed attempts for a given step. */
export class RateLimitError extends Error {}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_RECENT_FAILURES = 5;

/**
 * Backs `admin-authentication.md`'s "repeated failed login or TOTP attempts: rate-limited"
 * business rule across all three code/credential-guessing endpoints this epic has
 * (`AdminLoginAttemptKind`'s own doc-comment in `prisma/schema.prisma` explains why
 * `setup_confirm`, T6.2's endpoint, is included here too). Call `assertNotRateLimited`
 * before attempting the real verification (fail fast, don't do password/TOTP work for an
 * already-blocked identifier), then `recordAttempt` after, regardless of outcome.
 */
export async function assertNotRateLimited(
  identifier: string,
  kind: AdminLoginAttemptKind,
): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);
  const recentFailures = await prisma.adminLoginAttempt.count({
    where: { identifier, kind, success: false, createdAt: { gte: since } },
  });
  if (recentFailures >= MAX_RECENT_FAILURES) {
    throw new RateLimitError("Too many attempts — please wait a few minutes and try again.");
  }
}

export async function recordAttempt(
  identifier: string,
  kind: AdminLoginAttemptKind,
  success: boolean,
): Promise<void> {
  await prisma.adminLoginAttempt.create({ data: { identifier, kind, success } });
}
