import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** The cookie name every admin route (`proxy.ts`) and auth endpoint reads/writes. */
export const SESSION_COOKIE_NAME = "admin_session";

// Epic header's decision (docs/tasks/06-admin-auth.md): 30-minute inactivity, 12-hour
// absolute lifetime, matching Document 13.03 Section 10's confidentiality bar without
// forcing re-login mid-task for active use.
const ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export interface VerifiedSession {
  sessionId: number;
  adminUserId: number;
}

/**
 * Issues a real, DB-backed session (`admin_session`, T6.1/T6.3) for an already
 * TOTP-verified login (`lib/auth/login.ts`) or backup-code recovery (T6.4) — never called
 * from the password step alone, per `admin-authentication.md`'s own Interfaces section.
 * `token` is a fresh random value, not this row's own sequential `id` — see
 * `AdminSession`'s schema doc-comment for why. DB-backed (not a stateless signed cookie) so
 * T6.5's "invalidate all of a deactivated user's live sessions immediately" is a real,
 * verifiable server-side delete, not something a stateless token could ever guarantee.
 */
export async function createSession(
  adminUserId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ABSOLUTE_LIFETIME_MS);

  await prisma.adminSession.create({
    data: { adminUserId, token, expiresAt, lastActivityAt: now },
  });

  return { token, expiresAt };
}

/**
 * Validates a session cookie value against both halves of the epic's session policy —
 * `expiresAt`'s fixed 12-hour ceiling and `lastActivityAt`'s sliding 30-minute inactivity
 * window — plus, since T6.5, the account's own `active` flag, and, on success, bumps
 * `lastActivityAt` to now (this call *is* the "activity" that resets the inactivity clock).
 * A session that fails any of these checks here is deleted outright, not merely ignored,
 * *once its own token is actually presented* — this is lazy expiry, not a sweep: a different
 * session row that's gone equally stale but whose cookie is never presented again (e.g. an
 * abandoned browser tab) simply sits in `admin_session` indefinitely, functionally inert (it
 * would fail this same check if it ever were presented) but not proactively deleted. No
 * cleanup job exists for this table yet, same "proportionate for now, revisit if real volume
 * changes" call as `AdminLoginAttempt`'s own doc-comment makes for the same reason (five
 * partners, occasional logins) — confirmed for real at T6.3 (Playwright verification, session
 * 39): backdating a session's `lastActivityAt` and then presenting a *different* session's
 * still-valid token left the backdated row untouched in the table, exactly as this
 * lazy-expiry design predicts. Returns `null` for no session, not found, expiry, or a
 * deactivated account; the caller (`proxy.ts`, or a route handler) never needs to distinguish
 * which.
 *
 * The `active` check here is deliberately *defense in depth*, not the primary mechanism —
 * `deactivateAdminUser` below already deletes every live session for an account the moment
 * it's deactivated, so in the normal case this branch never fires (there's no session row
 * left to find). It exists for any session that manages to exist without having gone through
 * that transaction (e.g. one created in the same instant a deactivation transaction commits
 * elsewhere) — T6.5's own acceptance criterion ("rejected on its very next request... not
 * after its natural expiry") is met either way, by whichever layer actually has the row.
 */
export async function verifySession(token: string): Promise<VerifiedSession | null> {
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { adminUser: { select: { active: true } } },
  });
  if (!session) return null;

  const now = new Date();
  const inactiveForMs = now.getTime() - session.lastActivityAt.getTime();
  if (
    session.expiresAt < now ||
    inactiveForMs > INACTIVITY_TIMEOUT_MS ||
    !session.adminUser.active
  ) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  await prisma.adminSession.update({ where: { id: session.id }, data: { lastActivityAt: now } });

  return { sessionId: session.id, adminUserId: session.adminUserId };
}

/** Logs out — deletes the session row so the cookie value can never be reused. */
export async function destroySession(token: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { token } });
}

/**
 * T6.5's own primary enforcement mechanism (`admin-authentication.md`'s edge case: "a
 * partner account is deactivated... session invalidated immediately, not merely on next
 * login"). In one transaction: flips `admin_user.active` to `false` and deletes every
 * `admin_session` row for that account — so a session open in a second browser fails
 * `verifySession`'s own `findUnique` on its very next request, not because of the `active`
 * check above (which exists for the gap case, not this one), but because the row it's
 * looking for is simply gone. No UI calls this yet — its real trigger is Milestone 7's Team
 * content area (this task's own Input→Output line) — `lib/`-level only for now, same as
 * `issueSetupToken` before any screen called it.
 */
export async function deactivateAdminUser(adminUserId: number): Promise<void> {
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: adminUserId }, data: { active: false } }),
    prisma.adminSession.deleteMany({ where: { adminUserId } }),
  ]);
}

/**
 * The reverse of `deactivateAdminUser` above (T7.6's own "Deactivate/reactivate a partner's
 * account" requirement — `deactivateAdminUser` only ever built the one direction). No
 * session to restore: deactivation already deleted every live session for the account, so
 * reactivating simply clears the flag and lets the partner log in fresh, going through the
 * normal password + TOTP flow again like any other login.
 */
export async function reactivateAdminUser(adminUserId: number): Promise<void> {
  await prisma.adminUser.update({ where: { id: adminUserId }, data: { active: true } });
}
