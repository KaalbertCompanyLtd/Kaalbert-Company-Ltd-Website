# Feature: Admin Authentication

Phase 1. ADR 0007.

## Goal

Give partners secure, reliable access to the admin area, satisfying the firm's explicit
two-factor authentication requirement (Document 13.03, Section 10) without introducing
login-time friction or a dependency on email deliverability.

## User flow

1. **Setup (once per partner)**: partner receives an account, sets a password, scans a QR
   code with an authenticator app, enters the first generated code to confirm setup, and
   receives a set of single-use backup codes to store securely.
2. **Login**: partner enters email + password; if correct, is prompted for a 6-digit TOTP
   code; if correct, a session is created and the partner reaches `/admin`.
3. **Recovery**: a partner who has lost their device enters a backup code instead of a TOTP
   code; the code is consumed (single use) and the partner is prompted to re-enroll a new
   device.
4. **Forgotten password** (T6.7): a partner who has forgotten their password requests a reset
   link by email from `/admin/login`; the emailed link lets them choose a new password
   directly, no other administrator involved — the account's TOTP enrolment is untouched, so
   a reset alone can never complete a login on its own.
5. **Self-service account management** (session 60): a signed-in partner manages their own
   login from `/admin/account` — an in-session password change (distinct from the token-based
   forgotten-password flow above), voluntarily setting up a new 2FA device, and regenerating
   their own backup codes. None of this requires an Owner.
6. **Sign out**: from the account menu (sidebar/mobile drawer), any signed-in partner ends
   their own session immediately and is returned to `/admin/login`.

## Roles

Added at session 60 as a real, enforced `AdminRole` enum (`OWNER` | `PARTNER`) — previously a
plain, never-read string column. Every account starts `PARTNER` unless explicitly created or
promoted as `OWNER` (the developer/vendor account and the Lead Partner are the first two
Owners).

- **Owner**: everything a Partner can do, plus: invite/create a new partner login
  (`/admin/team/new`), deactivate/reactivate any login, reset another partner's 2FA/password,
  edit any partner's public profile, promote/demote a role, and toggle any profile's
  published state. The firm can never be left with zero Owners — demoting the last remaining
  Owner is rejected outright.
- **Partner**: manages only their own login (`/admin/account`) and their own public profile
  (`/admin/team/{own-id}`, or the same screen for anyone else, read-only). Cannot open
  `/admin/team/new`, cannot act on another partner's account, cannot promote/demote anyone.

## Business rules

- TOTP is required for every administrative account before any content action is available
  (NFR-3) — not optional, not skippable.
- The TOTP cryptographic core (secret generation, code verification, RFC 6238) uses a
  well-vetted library; it is never hand-rolled (ADR 0007).
- Backup codes are single-use; a consumed code cannot be reused.
- Passwords are hashed with a well-vetted library (e.g. `bcrypt`/`argon2`); plaintext
  passwords are never stored or logged.
- Sessions expire after a defined period of inactivity (implementation detail set in Phase
  6 task planning; the requirement here is that indefinite sessions are not acceptable given
  the confidentiality bar the whole platform is held to).
- Changing one's own password (self-service or via the forgotten-password link) invalidates
  every other live session for that account, the same defense-in-depth precedent
  deactivation already set — the account may legitimately be signed in elsewhere.

## Data requirements

- `admin_user` — id, name, email, password_hash, role (`AdminRole` enum: `OWNER` | `PARTNER`,
  session 60 — was a plain, never-enforced string before), totp_secret (encrypted),
  totp_enabled, created_at, last_login_at, password_reset_token (nullable, T6.7),
  password_reset_token_expires_at (nullable, T6.7), active (T6.5), setup_token/
  setup_token_expires_at.
- `admin_backup_code` — id, admin_user_id, code_hash, used_at (nullable).
- `admin_session` — id, admin_user_id, created_at, expires_at, last_activity_at.

## Interfaces

- `POST /api/admin/auth/login` — request: `{email, password}`; response: a challenge token
  requiring a subsequent TOTP step, not a session yet.
- `POST /api/admin/auth/verify-totp` — request: `{challenge_token, code}`; response: session
  cookie set on success.
- `POST /api/admin/auth/verify-backup-code` — same shape, consumes the code.
- `/admin/setup-2fa` — screen: QR code display, confirmation code entry, backup codes shown
  once.
- `POST /api/admin/auth/request-password-reset` (T6.7) — request: `{email}`; response is
  always the same generic message, regardless of whether the email matches a real account.
- `POST /api/admin/auth/reset-password` (T6.7) — request: `{token, password}`; response:
  success on a valid, unexpired, unconsumed token and a password meeting the minimum-length
  rule.
- `/admin/forgot-password` (T6.7) — screen: email entry, generic "check your email" response.
- `/admin/reset-password` (T6.7) — screen: new-password entry, reached via `?token=...`.
- `POST /api/admin/auth/logout` (session 60) — response: `{status}`, clears the session cookie
  and deletes the session row.
- `PATCH /api/admin/auth/change-password` (session 60) — request:
  `{currentPassword, newPassword}`; session-gated only (no Owner requirement — everyone
  manages their own password); response: success on a correct current password and a new one
  meeting the minimum-length rule, invalidating every session for the account.
- `POST /api/admin/auth/reissue-2fa-setup` (session 60) — response: `{status, setupUrl}`;
  session-gated only. Resets the caller's own `totp_enabled`/`totp_secret` and issues a fresh
  `/admin/setup-2fa` link, the same mechanism an Owner-issued reset uses, just self-triggered.
- `POST /api/admin/auth/regenerate-backup-codes` (session 60) — response: `{status, codes}`;
  session-gated only. Retires the caller's own unused backup codes and returns a fresh batch
  of 8 plaintext codes, shown once.
- `/admin/account` (session 60) — screen: identity (name/email/role, read-only), change
  password, and the two 2FA actions above. Any signed-in role.
- `POST /api/admin/team` (session 60, Owner-only) — request: either
  `{mode: "link", email, role, authorId}` or
  `{mode: "create", email, role, name, photoUrl, title, practiceArea, credentials,
personalStatement, bio}`; response: `{status, adminUserId, authorId, emailSent, setupUrl?,
password?}` — the last two only present when the invite email failed to send.
- `PATCH /api/admin/admin-users/{id}/role` (session 60, Owner-only) — request:
  `{role: "OWNER" | "PARTNER"}`; response: success unless it would leave zero Owners.

## Edge cases

- Partner enters an expired or already-used TOTP code: rejected with a clear message; TOTP's
  standard time-window tolerance (a small clock-drift allowance) is respected, but replay of
  the same code within a window is not permitted.
- Partner loses both their device and their backup codes: account recovery requires an Owner
  to reset 2FA enrolment for that account (`AdminUserActionsPanel`'s "Reset 2FA enrolment") —
  never a self-service bypass of 2FA itself, which would defeat the requirement it exists to
  satisfy. Voluntarily switching devices while still holding the old one is self-service
  (`/admin/account`'s "Set up a new device") — the distinction is whether the caller can still
  prove who they are without help.
- Repeated failed login or TOTP attempts: rate-limited to prevent brute-force attempts against
  either the password or the 6-digit code space.
- A partner account is deactivated (e.g. leaves the firm): session invalidated immediately,
  not merely on next login.
- Partner forgets their password (T6.7): self-service, via a time-limited (1 hour), single-use
  emailed link — unlike lost 2FA, this never requires another administrator, since the
  account's second factor is completely untouched by a password reset and a reset link alone
  can never complete a login on its own. Requesting a reset for an email with no matching
  account, or a deactivated one, returns the identical response as a real, active account —
  never a signal either way. Completing a reset invalidates every other live session for that
  account immediately, the same defense-in-depth precedent deactivation already set.
