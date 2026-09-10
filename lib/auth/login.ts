import { verify } from "otplib";

import { prisma } from "@/lib/prisma";

import { issueChallengeToken, verifyChallengeToken, ChallengeTokenError } from "./challenge-token";
import { verifyPassword } from "./password";
import { assertNotRateLimited, recordAttempt, AdminLoginAttemptKind } from "./rate-limit";
import { createSession } from "./session";
import { decryptTotpSecret } from "./totp-encryption";
import { issueSetupToken } from "./totp-setup";

/**
 * Thrown for any rejected login step. The message is always one of a small, fixed set of
 * generic strings — never reveals whether an email exists, which of email/password was
 * wrong, or any detail about the stored TOTP secret (`docs/tasks/06-admin-auth.md` T6.1's
 * no-plaintext-in-logs standard, extended here to "no account-existence leakage" as the
 * same class of information discipline).
 */
export class LoginError extends Error {}

// Same clock-drift tolerance as T6.2's setup confirmation (`lib/auth/totp-setup.ts`) — one
// 30s step each side of now, per admin-authentication.md's "standard time-window tolerance"
// edge case.
const EPOCH_TOLERANCE: [number, number] = [1, 1];

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const INVALID_CODE_MESSAGE = "That code didn't match — please try again.";
const EXPIRED_CHALLENGE_MESSAGE = "This login attempt has expired — please sign in again.";
const INVALID_BACKUP_CODE_MESSAGE = "That backup code didn't match — please try again.";
// admin-authentication.md's own edge case: lost device *and* lost backup codes has no
// self-service path — this is the one place in the login flow that says so directly, rather
// than a generic "invalid code" that would leave a partner retrying forever with nothing left
// to try.
const NO_BACKUP_CODES_REMAINING_MESSAGE =
  "No backup codes remain for this account. Please contact another administrator to reset your two-factor authentication.";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * `POST /api/admin/auth/login`'s password step. Returns a short-lived challenge token
 * (`lib/auth/challenge-token.ts`) on success — never a session; per
 * `admin-authentication.md`'s own Interfaces section, a session only exists after TOTP also
 * succeeds (`verifyTotpLogin` below).
 *
 * Deliberately does the same amount of "real" work (rate-limit check, one `findUnique`, one
 * response shape) whether or not the email corresponds to a real account, and always throws
 * the same `INVALID_CREDENTIALS_MESSAGE` either way — an attacker learns nothing about
 * whether a given email is a real partner account from this endpoint's response. It does
 * *not* attempt a constant-time dummy password comparison for a nonexistent account (a real
 * timing side-channel, in principle) — a deliberate, proportionate call for this project's
 * actual threat model (an internal five-partner tool, not a public-facing target), not an
 * oversight.
 */
export async function loginWithPassword(email: string, password: string): Promise<string> {
  const identifier = normalizeEmail(email);
  await assertNotRateLimited(identifier, AdminLoginAttemptKind.password);

  const user = await prisma.adminUser.findUnique({ where: { email: identifier } });
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;
  const success = Boolean(user && passwordOk);

  await recordAttempt(identifier, AdminLoginAttemptKind.password, success);

  if (!success || !user) {
    throw new LoginError(INVALID_CREDENTIALS_MESSAGE);
  }
  if (!user.totpEnabled) {
    // A data-integrity situation (an account somehow reachable at login without ever
    // completing T6.2's setup), not a wrong-password case — a distinct, honest message,
    // still with no account-existence implication beyond what the partner already knows
    // (they just entered a correct password for this very account).
    throw new LoginError("This account hasn't completed two-factor setup yet.");
  }

  return issueChallengeToken(user.id);
}

/**
 * `POST /api/admin/auth/verify-totp`'s TOTP step. Consumes the challenge token
 * `loginWithPassword` issued, verifies the code against the account's decrypted secret
 * (`lib/auth/totp-encryption.ts`) via `otplib`'s own `verify` (ADR 0007 — never a
 * hand-rolled comparison), and on success creates the real session
 * (`lib/auth/session.ts`). Replay protection is `otplib`'s own `afterTimeStep` option,
 * fed `admin_user.last_verified_totp_step` — see that field's schema doc-comment.
 */
export async function verifyTotpLogin(
  challengeToken: string,
  code: string,
): Promise<{ token: string; expiresAt: Date }> {
  let adminUserId: number;
  try {
    adminUserId = verifyChallengeToken(challengeToken);
  } catch (error) {
    if (error instanceof ChallengeTokenError) {
      throw new LoginError(EXPIRED_CHALLENGE_MESSAGE);
    }
    throw error;
  }

  const user = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    throw new LoginError(INVALID_CREDENTIALS_MESSAGE);
  }

  await assertNotRateLimited(user.email, AdminLoginAttemptKind.totp);

  const rawSecret = decryptTotpSecret(user.totpSecret);
  const result = await verify({
    secret: rawSecret,
    token: code,
    epochTolerance: EPOCH_TOLERANCE,
    afterTimeStep: user.lastVerifiedTotpStep ?? undefined,
  });

  await recordAttempt(user.email, AdminLoginAttemptKind.totp, result.valid);

  if (!result.valid) {
    throw new LoginError(INVALID_CODE_MESSAGE);
  }

  // `verify`'s return type is a union across otplib's TOTP and HOTP strategies (only HOTP's
  // `VerifyResultValid` lacks `timeStep`) — this call never passes `strategy: "hotp"`, so the
  // result is always the TOTP shape at runtime; this narrows the otherwise-too-general type.
  const { timeStep } = result as { timeStep: number };

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastVerifiedTotpStep: timeStep, lastLoginAt: new Date() },
  });

  return createSession(user.id);
}

/**
 * `POST /api/admin/auth/verify-backup-code`'s recovery step (T6.4) — consumes the challenge
 * token the same way `verifyTotpLogin` does, but checks the submitted code against the
 * account's *unused* backup codes instead of its TOTP secret. Every real rule
 * `docs/tasks/06-admin-auth.md`'s T6.4 addendum requires lives here:
 *
 * - **Matching needs a loop, not a lookup.** `admin_backup_code.code_hash` is a one-way
 *   bcrypt hash (`lib/auth/password.ts`) — there's no query that finds "the row matching
 *   this plaintext code" directly, so every unused row is tried with `verifyPassword` until
 *   one matches or none do. At most 8 rows per account (T6.2's `BACKUP_CODE_COUNT`), so this
 *   is cheap.
 * - **A consumed code is rejected on reuse** — only rows with `usedAt: null` are even
 *   fetched, so an already-used code can never match again.
 * - **The addendum's core precondition**: on a match, `totpEnabled`/`totpSecret` are reset to
 *   `false`/`null` in the *same transaction* as marking the code used — otherwise T6.2's own
 *   `resolvePendingTotpSetup`/`confirmTotpSetup` would reject the fresh setup token this
 *   function goes on to issue (they treat `totpEnabled: true` as "already set up") and would
 *   silently keep the lost device's old secret alive instead of replacing it.
 * - **Session + forced re-enrolment, not one or the other.** A valid backup code is a
 *   complete, real second factor — the partner is genuinely logged in
 *   (`lib/auth/session.ts`'s `createSession`, same as a normal TOTP login) — but also gets a
 *   fresh `/admin/setup-2fa` link (`lib/auth/totp-setup.ts`'s `issueSetupToken`, the same
 *   mechanism T6.2's own flow and T6.6's provisioning script use) so the caller can redirect
 *   there instead of `/admin`. Nothing server-side blocks that partner from navigating to
 *   `/admin` directly instead — `proxy.ts` only checks session validity, not `totpEnabled` —
 *   the "forced redirect" is a client-side UX nudge (`login-form.tsx` `router.push`s to the
 *   returned URL), not a hard server-side gate; the account's own TOTP being disabled is what
 *   actually makes re-enrolment necessary the next time a session isn't already live.
 * - **"Contact another administrator"**: when the account has zero unused backup codes left,
 *   a distinct message says so directly (`admin-authentication.md`'s own edge case) — never a
 *   generic "wrong code" that would leave a partner retrying forever with nothing left to try,
 *   and never a self-service bypass of any kind.
 */
export async function verifyBackupCodeLogin(
  challengeToken: string,
  code: string,
): Promise<{ session: { token: string; expiresAt: Date }; setupUrl: string }> {
  let adminUserId: number;
  try {
    adminUserId = verifyChallengeToken(challengeToken);
  } catch (error) {
    if (error instanceof ChallengeTokenError) {
      throw new LoginError(EXPIRED_CHALLENGE_MESSAGE);
    }
    throw error;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: { backupCodes: { where: { usedAt: null } } },
  });
  if (!user) {
    throw new LoginError(INVALID_CREDENTIALS_MESSAGE);
  }

  await assertNotRateLimited(user.email, AdminLoginAttemptKind.backup_code);

  let matchedCodeId: number | null = null;
  for (const backupCode of user.backupCodes) {
    if (await verifyPassword(code, backupCode.codeHash)) {
      matchedCodeId = backupCode.id;
      break;
    }
  }

  await recordAttempt(user.email, AdminLoginAttemptKind.backup_code, matchedCodeId !== null);

  if (matchedCodeId === null) {
    throw new LoginError(
      user.backupCodes.length === 0
        ? NO_BACKUP_CODES_REMAINING_MESSAGE
        : INVALID_BACKUP_CODE_MESSAGE,
    );
  }

  await prisma.$transaction([
    prisma.adminBackupCode.update({
      where: { id: matchedCodeId },
      data: { usedAt: new Date() },
    }),
    prisma.adminUser.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, lastLoginAt: new Date() },
    }),
  ]);

  const session = await createSession(user.id);
  const setupUrl = await issueSetupToken(user.id);

  return { session, setupUrl };
}
