import { prisma } from "@/lib/prisma";

import { hashPassword, verifyPassword } from "./password";

/**
 * Thrown for a rejected in-session password change — a wrong current password or a new one
 * that fails the minimum-length rule. Same one-message-per-real-reason approach as
 * `PasswordResetError`, but this flow is already authenticated (a session cookie got the
 * caller here), so there's no account-existence-leakage concern to protect with a generic
 * message the way the pre-login reset flow has to.
 */
export class ChangePasswordError extends Error {}

// Same floor `lib/auth/password-reset.ts`'s `confirmPasswordReset` already established —
// length over complexity, per NIST 800-63B.
const MIN_PASSWORD_LENGTH = 12;

/**
 * `/admin/account`'s in-session "change my password" action (session 60) — distinct from
 * `confirmPasswordReset`, which is for a partner who's locked out and reached a link via
 * email, not someone already signed in who simply wants to update their own credential.
 * Requires the current password (proves the caller, not just a valid session, actually knows
 * it — the same reasoning any "change password while logged in" flow needs), then, like
 * `confirmPasswordReset`, deletes every live session for the account in the same transaction
 * as the password write — including the caller's own session, on purpose: a changed password
 * is exactly the kind of event where forcing a fresh login (this time with the new
 * credential) is the safer default, the same precedent `deactivateAdminUser`/
 * `confirmPasswordReset` already set, not a special case invented here.
 */
export async function changeOwnPassword(
  adminUserId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!user) {
    throw new ChangePasswordError("Account not found.");
  }

  const currentIsValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentIsValid) {
    throw new ChangePasswordError("Current password is incorrect.");
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ChangePasswordError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: adminUserId }, data: { passwordHash } }),
    prisma.adminSession.deleteMany({ where: { adminUserId } }),
  ]);
}
