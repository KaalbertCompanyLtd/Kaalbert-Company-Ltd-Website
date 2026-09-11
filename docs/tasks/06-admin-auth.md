# Epic: Admin Authentication

Roadmap milestone 6. The first milestone that exists purely for firm use — deliberately
placed after every public-facing thing already works. Builds to
`ui/mockups/f-admin-auth/` login/setup-2fa mockups.

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

**Addendum (session 38, 2026-09-10):** Whatever rate-limiting mechanism this task builds for
`login`/`verify-totp` should also cover `POST /api/admin/auth/setup-2fa` (T6.2) — a third
endpoint accepting a 6-digit-code guess, not one of this task's own two, that T6.2 shipped
with no rate limiting of its own (low real risk today: a 1-in-1,000,000 guess space per
30s-tolerant window, and the setup token itself is the primary defense, but defense-in-depth
says it shouldn't be the only one once real rate-limiting infrastructure exists).

### T6.4 — Backup code recovery

**Build:** `POST /api/admin/auth/verify-backup-code`, consuming the code (single-use),
followed by a forced re-enrolment prompt.
**Input → Output:** A valid, unused backup code → session cookie + forced redirect to
`/admin/setup-2fa` to re-enroll a new device.
**Acceptance criteria:** A consumed backup code is rejected on reuse; login without any
remaining valid backup code and no TOTP device correctly falls through to the "contact another
administrator" edge case (no self-service 2FA bypass exists in the UI at all).
**Size:** S **Dependencies:** T6.3

**Addendum (session 38, 2026-09-10):** The "forced redirect to `/admin/setup-2fa`" above
should call `lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)` (built at T6.2) to get
that URL, then redirect there — the exact same mechanism T6.2's own setup flow and T6.6's
account-provisioning script use, not a second one. **One real precondition this task must
handle, that T6.2 deliberately doesn't**: before calling `issueSetupToken`, this task must
also reset that `admin_user` row's `totpEnabled` to `false` and `totpSecret` to `null`. Two
of T6.2's own checks depend on this: `resolvePendingTotpSetup`/`confirmTotpSetup` both treat
`totpEnabled: true` as "already set up, reject this token" (correct for a first-time link,
wrong for a re-enrolment one if left unset), and `resolvePendingTotpSetup` reuses an existing
non-null `totpSecret` rather than generating a new one — which for recovery specifically
would silently keep the lost device's old secret alive instead of replacing it, defeating the
entire point of forced re-enrolment. Do this reset in the same transaction as backup-code
consumption, not as a separate write.

### T6.5 — Account deactivation + immediate session invalidation

**Build:** An `admin_user.active` flag and the enforcement path that invalidates all of a
deactivated user's live sessions immediately, not on next login.
**Input → Output:** An admin marking another `admin_user` inactive (this control ships
functionally here; its UI home is Milestone 7's Team content area) → that user's
`admin_session` rows invalidated within the same request cycle.
**Acceptance criteria:** A session open in a second browser for the deactivated account is
rejected on its very next request after deactivation, not after its natural expiry.
**Size:** S **Dependencies:** T6.3

### T6.6 — Initial admin account provisioning

**Added at T6.2 (session 38)** — no task in this epic, nor in `docs/tasks/07-content-admin.md`
(Team is a _profile_ editor, not a login-credential creator), ever creates a real `admin_user`
row. Every task from T6.1 on assumes one already exists (T6.2's own Input→Output: "New
`admin_user`... → confirmed TOTP enrolment"). Discovered building T6.2's `/admin/setup-2fa`,
which needed a real row to test against — see `memory/technical-debt.md` → "No task
provisions a real `admin_user` row yet."
**Build:** A developer-run CLI script (`npm run admin:create-user -- --name "..." --email
"..."`, `tsx scripts/create-admin-user.ts`, same execution convention as
`scripts/cleanup-attribution.ts`) that creates one `admin_user` row (name, email,
`password_hash` from a securely generated or operator-supplied initial password), then calls
`lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)` (already built at T6.2, this task's
first real caller — no new schema needed) to set `setup_token`/`setup_token_expires_at` and
print the resulting `/admin/setup-2fa?token=...` link for the developer to hand to the new partner
through whatever secure channel the firm already uses. **Not** a self-service `/admin` "invite
a partner" UI — with a fixed five partners and new accounts created rarely, a CLI script run
by the developer is proportionate; a full invite-UI would be more process than this firm's
scale justifies (same reasoning content-management-admin.md's own business rules give for
not building a copy-approval routing layer).
**Input → Output:** `--name`/`--email` (and an optional `--password`; a strong random one is
generated and printed if omitted) → a new `admin_user` row + a printed one-time setup link.
**Acceptance criteria:** The printed link, opened fresh, reaches `/admin/setup-2fa` and
completes real TOTP enrolment exactly as T6.2 already verifies; running the script twice for
the same email is rejected (the `admin_user.email` unique constraint), not silently
duplicated.
**Size:** S **Dependencies:** T6.1, T6.2 (needs `admin_user`/`setup_token` and
`lib/auth/totp-setup.ts`'s `issueSetupToken` already built there — reuses it rather than
inventing a second one; T6.4's own re-enrolment redirect reuses the same function too).

### T6.7 — Self-service password reset

**Added at session 43, 2026-09-11** — discovered asking "what's the process for resetting a
password" of a session that had just completed T6.6: there is no password-reset mechanism
anywhere in this codebase, self-service or otherwise, for an _existing_ account. Every
credential-recovery path this epic has so far covers the 2FA side only (T6.4's backup codes,
the "another administrator resets 2FA" edge case) — nothing at all covers a forgotten
_password_. The mockup itself already anticipated this (`ui/mockups/f-admin-auth/
admin-login.html`'s `<a href="#">Forgot password?</a>`, present since T1.5) but no task ever
built the screen behind it — `app/admin/login/page.tsx` carried an explicit comment
explaining the link was deliberately left inert for exactly this reason, until now.
**Build:** `POST /api/admin/auth/request-password-reset` (self-service, request: `{email}`,
always returns the same generic "if an account exists..." response — no account-existence
leakage, same discipline `loginWithPassword` already established) and `POST /api/admin/auth/
reset-password` (request: `{token, password}`); `/admin/forgot-password` (email entry) and
`/admin/reset-password?token=...` (new-password entry, same opaque-token-resolves-the-account
shape `/admin/setup-2fa` already uses) screens; the reset email itself (via the shared
`lib/email.ts` Brevo utility, T3.7). The underlying token-issuing mechanism
(`lib/auth/password-reset.ts`'s `issuePasswordResetToken`) is built as a reusable primitive,
the same way T6.2's `issueSetupToken` is — not self-service-specific — so a future
admin-triggered "reset a colleague's password" action can call it directly. No mockup exists
for either new screen (a genuinely new gap, not previously catalogued in `ui/screen-
inventory.md`); inferred from `admin-login.html`'s own `.auth-card` layout via the existing
`AuthShell`, the same pattern `/admin/setup-2fa` and `/admin/login` both already use.
**Input → Output:** `{email}` → a reset link emailed to that account (if it exists and is
active) → `{token, password}` → `admin_user.password_hash` updated, every live
`admin_session` row for that account deleted (forces re-login everywhere, same
defense-in-depth precedent T6.5's `deactivateAdminUser` already set), reset token consumed.
**Acceptance criteria:** A partner who has forgotten their password can reset it and log back
in using only access to their own email — no other administrator's involvement required
(unlike lost 2FA); requesting a reset for a nonexistent or deactivated email returns the
identical generic response as a real one; a consumed or expired token is rejected on reuse; a
password reset does not touch `totpEnabled`/`totpSecret` at all — the account's second factor
is completely unaffected, which is what makes this flow safe to be self-service in the first
place; repeated requests for the same email are throttled (a request-volume limit, not a
credential-guessing one — see `lib/auth/rate-limit.ts`'s `assertNotFlooded`).
**Size:** M **Dependencies:** T6.1, T6.3 (reuses `lib/auth/session.ts`'s session-deletion
precedent), T3.7 (the shared `lib/email.ts` Brevo utility).

**Note (session 43, 2026-09-11):** Building and live-verifying this task caught a real bug in
`proxy.ts` — the two new unauthenticated pages this task adds were not added to
`PUBLIC_ADMIN_PAGE_PATHS`, so every unauthenticated visitor was silently redirected back to
`/admin/login` before either page ever rendered. Compiled, typechecked, and linted cleanly;
caught only via live Playwright verification. Fixed in the same session/commit — see
`proxy.ts`'s own doc-comment and `memory/known-bugs.md`.

**Addendum (session 43, 2026-09-11):** An admin-triggered "reset a colleague's password"
action — for the case self-service genuinely can't work (e.g. the affected partner's email is
also inaccessible, not just their password forgotten) — belongs on T7.6's Team screen,
alongside the deactivate/reactivate and reset-2FA actions already addended there. It reuses
this task's own `issuePasswordResetToken(adminUserId, {baseUrl})` directly (already built,
already tested) rather than the self-service email path — another admin triggers it and
relays the resulting link, the same pattern T6.6's provisioning script already uses for a
brand-new account. See `memory/technical-debt.md`'s broadened entry for the full reasoning.
