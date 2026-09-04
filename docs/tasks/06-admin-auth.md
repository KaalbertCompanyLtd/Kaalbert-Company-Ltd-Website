# Epic: Admin Authentication

Roadmap milestone 6. The first milestone that exists purely for firm use — deliberately
placed after every public-facing thing already works. Builds to
`ui/mockups/g-admin-content/` login/setup-2fa mockups.

**Decision made here, not left open:** `admin-authentication.md` defers the session
inactivity-expiry period to "Phase 6 task planning" — that's this document. **Decision: 30
minutes of inactivity, 12-hour absolute session lifetime** regardless of activity, matching
the confidentiality bar the platform is held to (Document 13.03, Section 10) without forcing
re-login mid-task for active use. Implemented in T6.3.

---

### T6.1 — Data model: `admin_user`, `admin_backup_code`, `admin_session`

**Build:** Tables per `docs/features/admin-authentication.md`; passwords via a vetted hash
library (bcrypt/argon2), TOTP secrets encrypted at rest, TOTP itself via a vetted library
(RFC 6238), never hand-rolled (ADR 0007).
**Input → Output:** Schema definition → migrated tables.
**Acceptance criteria:** No plaintext password or raw TOTP secret is ever written to logs
(verified by a deliberate failed-login test and inspecting log output).
**Size:** S **Dependencies:** T1.2

### T6.2 — 2FA setup flow — `/admin/setup-2fa`

**Build:** QR code display, confirmation-code entry, one-time backup-codes display, to its
mockup.
**Input → Output:** New `admin_user` (no `totp_enabled`) → confirmed TOTP enrolment,
`totp_enabled: true`, backup codes generated and shown exactly once.
**Acceptance criteria:** Backup codes are never retrievable again after this screen is left;
scanning the QR code in a real authenticator app and entering the generated code completes
setup successfully.
**Size:** M **Dependencies:** T6.1

### T6.3 — Login + TOTP verification + session management

**Build:** `POST /api/admin/auth/login`, `POST /api/admin/auth/verify-totp`, session cookie
issuance with the 30-minute-inactivity / 12-hour-absolute policy decided above; rate limiting
on both the password and TOTP steps.
**Input → Output:** `{email, password}` → challenge token → `{challenge_token, code}` →
session cookie.
**Acceptance criteria:** No admin route is reachable without a valid TOTP-verified session
(NFR-3 — not optional, not skippable, tested by attempting direct navigation to an admin URL
pre-login); a session idle for 30 minutes is rejected on next request; repeated failed
attempts against either step are rate-limited; a replayed TOTP code within the same time
window is rejected even though it hasn't expired.
**Size:** M **Dependencies:** T6.1, T6.2

### T6.4 — Backup code recovery

**Build:** `POST /api/admin/auth/verify-backup-code`, consuming the code (single-use),
followed by a forced re-enrolment prompt.
**Input → Output:** A valid, unused backup code → session cookie + forced redirect to
`/admin/setup-2fa` to re-enroll a new device.
**Acceptance criteria:** A consumed backup code is rejected on reuse; login without any
remaining valid backup code and no TOTP device correctly falls through to the "contact another
administrator" edge case (no self-service 2FA bypass exists in the UI at all).
**Size:** S **Dependencies:** T6.3

### T6.5 — Account deactivation + immediate session invalidation

**Build:** An `admin_user.active` flag and the enforcement path that invalidates all of a
deactivated user's live sessions immediately, not on next login.
**Input → Output:** An admin marking another `admin_user` inactive (this control ships
functionally here; its UI home is Milestone 7's Team content area) → that user's
`admin_session` rows invalidated within the same request cycle.
**Acceptance criteria:** A session open in a second browser for the deactivated account is
rejected on its very next request after deactivation, not after its natural expiry.
**Size:** S **Dependencies:** T6.3
