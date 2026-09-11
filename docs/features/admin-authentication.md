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

## Data requirements

- `admin_user` — id, name, email, password_hash, role, totp_secret (encrypted), totp_enabled,
  created_at, last_login_at, password_reset_token (nullable, T6.7), password_reset_token_
  expires_at (nullable, T6.7).
- `admin_backup_code` — id, admin_user_id, code_hash, used_at (nullable).
- `admin_session` — id, admin_user_id, created_at, expires_at.

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

## Edge cases

- Partner enters an expired or already-used TOTP code: rejected with a clear message; TOTP's
  standard time-window tolerance (a small clock-drift allowance) is respected, but replay of
  the same code within a window is not permitted.
- Partner loses both their device and their backup codes: account recovery requires another
  administrator to reset 2FA enrolment for that account — never a self-service bypass of 2FA
  itself, which would defeat the requirement it exists to satisfy.
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
