import { AdminLoginAttemptKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export { AdminLoginAttemptKind };

/** Thrown when an identifier has too many recent failed attempts for a given step. */
export class RateLimitError extends Error {}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_RECENT_FAILURES = 5;
const FLOOD_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECENT_REQUESTS = 3;

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

/**
 * A second throttle shape, distinct from `assertNotRateLimited` above — added at T6.7 for
 * `password_reset_request`, the first endpoint in this epic with no "wrong guess" concept to
 * count. Every other kind here guards a credential/code-guessing surface, where only a
 * *failed* attempt should shrink the caller's remaining budget (a correct password on attempt
 * one shouldn't count against a partner who mistypes it once first). A password-reset
 * request has no such distinction — `requestPasswordReset` does the same amount of work and
 * returns the same generic response whether or not the submitted email matches a real
 * account (its own no-enumeration rule), so nothing about a single request is ever "wrong."
 * What actually needs limiting here is volume — a real partner's inbox being flooded with
 * reset emails, or the endpoint being hammered — so this counts *every* attempt in the
 * window, not just failures.
 */
export async function assertNotFlooded(
  identifier: string,
  kind: AdminLoginAttemptKind,
): Promise<void> {
  const since = new Date(Date.now() - FLOOD_WINDOW_MS);
  const recentAttempts = await prisma.adminLoginAttempt.count({
    where: { identifier, kind, createdAt: { gte: since } },
  });
  if (recentAttempts >= MAX_RECENT_REQUESTS) {
    throw new RateLimitError("Too many requests — please wait a while and try again.");
  }
}
