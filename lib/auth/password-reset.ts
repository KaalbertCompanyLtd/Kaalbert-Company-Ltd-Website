import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";

import { hashPassword } from "./password";
import {
  assertNotFlooded,
  assertNotRateLimited,
  recordAttempt,
  AdminLoginAttemptKind,
} from "./rate-limit";

/**
 * Thrown for a rejected `/admin/reset-password` confirmation — an invalid/expired/consumed
 * token, or a new password that fails the minimum-length rule below. Same "one generic
 * message where the difference doesn't matter" discipline as `TotpSetupError`/`LoginError`:
 * an unauthenticated caller learns nothing about *why* a token failed beyond "this link is no
 * longer valid," but a validation failure (password too short) gets its own honest message,
 * since the partner submitting it already proved they hold a valid token — that's not an
 * account-existence or token-guessing leak.
 */
export class PasswordResetError extends Error {}

// A reset link is requested on demand by the partner who needs it right now (unlike
// `setupToken`'s 7-day window, handed over through a separate, slower out-of-band channel at
// account creation) — an hour is generous for checking one's own inbox, short enough that a
// requested-but-abandoned link doesn't stay live indefinitely.
const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
// No existing convention sets a password-length rule anywhere in this codebase — every
// account's password until now has been either a `crypto.randomBytes`-generated string
// (T6.6's script) or operator-supplied, never partner-typed. This is the first flow where a
// partner chooses their own password, so this task is the one that has to pick a floor.
// Length over complexity rules, per NIST 800-63B — no forced digit/symbol/case mix.
const MIN_PASSWORD_LENGTH = 12;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Issues a fresh, single-use `/admin/reset-password` link token for an existing `admin_user`
 * row and returns the full URL — the same "opaque token, overwritten in place" shape as
 * `lib/auth/totp-setup.ts`'s `issueSetupToken`, and deliberately reusable the same way: this
 * task's own caller is `requestPasswordReset` below (self-service, emails the link), but nothing
 * about this function is self-service-specific — a future admin-triggered "reset a colleague's
 * password" action (`memory/technical-debt.md`, sequenced into T7.6) calls this exact same
 * function and displays the resulting link on-screen instead of emailing it, the same relay
 * pattern T6.6's provisioning script already uses for a brand-new account.
 */
export async function issuePasswordResetToken(
  adminUserId: number,
  { baseUrl = "" }: { baseUrl?: string } = {},
): Promise<string> {
  const passwordResetToken = randomBytes(24).toString("hex");
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      passwordResetToken,
      passwordResetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_LIFETIME_MS),
    },
  });
  return `${baseUrl}/admin/reset-password?token=${passwordResetToken}`;
}

function buildResetEmailHtml(name: string, resetUrl: string): string {
  const pine = "#0E2A22";
  const brass = "#8C6E33";
  const ink = "#121317";
  const ink600 = "#3C414A";
  const paper = "#FFFFFF";
  const muted = "#F4F1E8";
  const display = "Georgia, 'Times New Roman', serif";
  const body = "Calibri, Arial, sans-serif";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:${paper};border-radius:6px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <p style="font-family:${display};font-size:20px;color:${pine};margin:0 0 16px;font-weight:bold;">Kaalbert &amp; Company Ltd</p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 12px;">Hi ${name},</p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 20px;">
            We received a request to reset the password on your admin account. Click the button
            below to choose a new one — this link expires in 1 hour and can only be used once.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:${pine};color:${paper};font-family:${body};font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:4px;">Reset password</a>
          </p>
          <p style="font-family:${body};font-size:13px;color:${ink600};margin:0 0 8px;">
            If you didn't request this, you can safely ignore this email — your password hasn't
            been changed.
          </p>
          <p style="font-family:${body};font-size:11px;color:${brass};margin:24px 0 0;word-break:break-all;">${resetUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * `POST /api/admin/auth/request-password-reset`'s only real logic — self-service, reached
 * from `/admin/login`'s own "Forgot password?" link (mirrored in the mockup since T1.5's
 * `admin-login.html` but never wired to anything until now, per `app/admin/login/page.tsx`'s
 * own former doc-comment explaining why it was deliberately omitted).
 *
 * Deliberately resolves the same way — void, no thrown error, no indication in the response —
 * whether or not `email` matches a real, active account: the caller (the route) always
 * returns one generic "if an account exists for that email, a reset link has been sent"
 * message, the same no-account-existence-leakage rule `lib/auth/login.ts`'s own doc-comment
 * already established for this epic. A deactivated account is treated exactly like a
 * nonexistent one here (silently no-ops) for the same reason — this step runs *before* any
 * credential is proven, unlike `loginWithPassword`'s own distinct "this account has been
 * deactivated" message, which is safe specifically because it only fires after a correct
 * password already proved the caller knows this account.
 *
 * Rate-limited by `assertNotFlooded`, not `assertNotRateLimited` — see that function's own
 * doc-comment for why a request-volume throttle, not a failure-counting one, is the correct
 * shape here.
 */
export async function requestPasswordReset(
  email: string,
  { baseUrl = "" }: { baseUrl?: string } = {},
): Promise<void> {
  const identifier = normalizeEmail(email);
  await assertNotFlooded(identifier, AdminLoginAttemptKind.password_reset_request);
  await recordAttempt(identifier, AdminLoginAttemptKind.password_reset_request, true);

  const user = await prisma.adminUser.findUnique({ where: { email: identifier } });
  if (!user || !user.active) return;

  const resetUrl = await issuePasswordResetToken(user.id, { baseUrl });

  try {
    await sendTransactionalEmail({
      to: [{ email: user.email, name: user.name }],
      subject: "Reset your Kaalbert & Company Ltd admin password",
      htmlContent: buildResetEmailHtml(user.name, resetUrl),
    });
  } catch (error) {
    if (error instanceof EmailSendError) {
      // Same call `lib/diagnostic-request-summary.ts` makes for its own summary email: a
      // delivery failure here shouldn't surface as a distinct response (that would leak
      // account existence via a different code path than the generic message already
      // prevents), so it's swallowed after the token itself is already safely issued. A
      // partner who never receives the email can simply request again once flood-limited
      // room allows it.
      return;
    }
    throw error;
  }
}

export interface PendingPasswordReset {
  adminUserId: number;
  name: string;
  email: string;
}

/**
 * Resolves a `/admin/reset-password?token=...` link to the `admin_user` it belongs to, for
 * the page's own initial "is this link even worth showing a form for" check. Returns `null`
 * for a missing, invalid, expired, already-consumed token, or a deactivated account — the
 * page renders one generic "this link is no longer valid" state for all of those, same
 * pattern as `resolvePendingTotpSetup`. Unlike that function, this one is a pure read — there
 * is nothing here to lazily generate on first view.
 */
export async function resolvePasswordReset(
  passwordResetToken: string,
): Promise<PendingPasswordReset | null> {
  const user = await prisma.adminUser.findUnique({ where: { passwordResetToken } });
  if (!user || !user.active) return null;
  if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
    return null;
  }
  return { adminUserId: user.id, name: user.name, email: user.email };
}

/**
 * Confirms a `/admin/reset-password` submission: re-validates the token (defense against the
 * page-load check and the real submission being two different requests — the link could
 * expire or get consumed by a concurrent tab in between), enforces the minimum-length rule,
 * hashes the new password, and — in one transaction — writes `password_hash`, consumes the
 * token, and deletes every live `admin_session` row for the account. That last part isn't
 * this task's literal acceptance criterion but is the same defense-in-depth precedent
 * `lib/auth/session.ts`'s `deactivateAdminUser` already set: a password reset is exactly the
 * kind of event (a credential a partner believed might be compromised) where every other
 * already-open session should be forced to re-authenticate, not left trusted on the old
 * credential's say-so.
 *
 * Deliberately does **not** touch `totpEnabled`/`totpSecret` — a reset password alone can
 * never complete a login on its own; the account's second factor is completely untouched by
 * this flow, which is why this can safely be self-service at all (unlike lost-2FA recovery,
 * `admin-authentication.md`'s edge case, which has no self-service path by design).
 */
export async function confirmPasswordReset(
  passwordResetToken: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.adminUser.findUnique({ where: { passwordResetToken } });
  if (!user || !user.active) {
    throw new PasswordResetError("This link is no longer valid.");
  }
  if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
    throw new PasswordResetError("This link is no longer valid.");
  }

  await assertNotRateLimited(user.email, AdminLoginAttemptKind.password_reset_confirm);

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    await recordAttempt(user.email, AdminLoginAttemptKind.password_reset_confirm, false);
    throw new PasswordResetError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }

  await recordAttempt(user.email, AdminLoginAttemptKind.password_reset_confirm, true);

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetTokenExpiresAt: null },
    }),
    prisma.adminSession.deleteMany({ where: { adminUserId: user.id } }),
  ]);
}
