# Session 39 — Admin Login + Session Management

# Date: 2026-09-10

# Tasks completed: T06-03

## What Was Built

`POST /api/admin/auth/login`, `POST /api/admin/auth/verify-totp`, `/admin/login`, and
`proxy.ts` — the piece that makes "no admin route reachable without a valid TOTP-verified
session" literally true for the first time. New `lib/auth/` modules: `session.ts` (DB-backed
sessions, 30-min inactivity / 12-hour absolute), `challenge-token.ts` (stateless HMAC token
between password and TOTP steps), `rate-limit.ts` (a real table covering all
code-guessing endpoints, including T6.2's setup-2fa confirm per that task's own addendum),
and `login.ts` (orchestrates all of it, including TOTP replay protection via otplib's own
`afterTimeStep`). Extracted `app/admin/auth-shell.tsx` so `/admin/login` reuses T6.2's card
shell instead of duplicating it.

## Files Changed

- `prisma/schema.prisma` — `AdminUser.lastVerifiedTotpStep`, `AdminSession.token`/
  `lastActivityAt`, new `AdminLoginAttempt` model + `AdminLoginAttemptKind` enum
- `prisma/migrations/20260910195546_t6_3_session_replay_rate_limit/` — new migration, applied
- `proxy.ts` — new, **project root** (not `app/proxy.ts` — see Decisions Made)
- `lib/auth/session.ts` + `.test.ts`, `lib/auth/challenge-token.ts` + `.test.ts`,
  `lib/auth/rate-limit.ts` + `.test.ts`, `lib/auth/login.ts` + `.test.ts`
- `lib/auth/totp-setup.ts` + `.test.ts` — rate-limit wiring added (T6.3's addendum on T6.2)
- `app/admin/auth-shell.tsx` — new, extracted from `app/admin/setup-2fa/page.tsx`
- `app/admin/login/page.tsx` + `login-form.tsx`
- `app/api/admin/auth/login/route.ts`, `app/api/admin/auth/verify-totp/route.ts`
- `.env.example`, `CLAUDE.local.md`, `.env.local` (not tracked), `README.md` — renamed
  `NEXTAUTH_SECRET` → `ADMIN_CHALLENGE_TOKEN_SECRET`; backfilled `ADMIN_TOTP_ENCRYPTION_KEY`
  into README's own var list (missed at T6.1)
- `CLAUDE.md` — Next.js 16 `proxy.ts` note corrected to state the project-root location
- `memory/known-bugs.md`, `memory/decision-log.md`, `memory/completed-work.md`
- `docs/sessions/session-38-admin-2fa-setup-flow.md` — pre-existing Prettier formatting issue
  fixed as part of this session's quality gate (CLAUDE.md's "fix pre-existing lint failures
  too" rule)

## Decisions Made

- **Real bug found and fixed**: `proxy.ts` written at `app/proxy.ts` (CLAUDE.md's own stated
  path) compiled, type-checked, and lint-passed cleanly while never actually running —
  Next.js only looks for this file at the project root. `/admin` stayed fully open with zero
  session check, silently, until caught by the Task Completion Checklist's own "exercise it
  for real via Playwright MCP" step. Moved the file, confirmed the fix live, corrected
  CLAUDE.md's own text. Full writeup in `memory/known-bugs.md`.
- **Sessions are DB-backed** (`admin_session.token`, a fresh random value, not the row's own
  sequential id), not a stateless signed cookie — required for T6.5's future "invalidate
  immediately" guarantee. Lazy expiry, not a sweep — confirmed for real (see Verification
  Notes). No cleanup job yet, proportionate at this project's real scale.
- **Password→TOTP challenge token is stateless HMAC** (`lib/auth/challenge-token.ts`, Node's
  own `crypto.createHmac`/`timingSafeEqual`) — reused the env var originally reserved as
  `NEXTAUTH_SECRET`, renamed to `ADMIN_CHALLENGE_TOKEN_SECRET` since this project never
  adopted `next-auth` (ADR 0001).
- **Rate limiting is a real table** (`admin_login_attempt`), keyed by the target account's
  **email** (not the ephemeral challenge/setup token a given attempt carries) — closes a real
  bypass a token-keyed design would leave open. Covers all three code-guessing endpoints that
  exist so far.
- **TOTP replay protection is `otplib`'s own built-in `afterTimeStep`**, not a hand-rolled
  comparison — `AdminUser.lastVerifiedTotpStep` stores the real, library-returned time step.

Full reasoning for all of the above in `memory/decision-log.md`.

## Current State

Login works end-to-end for real, verified live. `/admin` and (once Milestone 7 adds real
content routes) `/api/admin/*` are both genuinely session-gated now. No task before T6.6
needs a real admin account to exist for its own build/test purposes, but the firm itself
still has no way to get its first real account — `docs/user-guide.md` **not** updated,
nothing here is firm-usable yet without developer involvement (T6.6 still open).

## Blockers

None for T6.4. Still open, tracked: T6.6 (account provisioning) — see
`memory/technical-debt.md`.

## Verification Notes

Exercised for real via Playwright MCP + `curl` against a real, fully-enrolled test
`admin_user` (throwaway script, deleted before commit): confirmed pre-login `/admin` access
is blocked (this task's literal acceptance criterion, and the very check that first
surfaced the `proxy.ts` path bug); a wrong password shows the generic "Invalid email or
password" message; correct password → correct TOTP code completes login and lands on the
real authenticated dashboard, with the session row, `admin_login_attempt` rows, and
`lastVerifiedTotpStep`/`lastLoginAt` all inspected directly in the database and matching
expectations exactly (real bcrypt hashes, real encrypted TOTP secret, no plaintext anywhere).
Reusing an already-verified code on a second login attempt within the same window is
rejected (replay protection). Five failed password attempts trigger a real 429, which then
also correctly blocks a subsequent _correct_ password. Backdating a session's
`lastActivityAt` past 30 minutes and revisiting `/admin` redirects back to login and deletes
that specific session row, while a different session's equally-stale row was confirmed left
untouched (lazy expiry, not a sweep). `/api/admin/*` (non-auth) returns 401 JSON rather than
a redirect. T6.2's `/admin/setup-2fa` still renders and functions correctly after the
`AuthShell` extraction. Checked mobile (390px), tablet (768px), and desktop (1280px) renders
of `/admin/login`. Quality gates all clean: lint, format:check, typecheck, 118/118 tests
across 18 files (28 new this session).

## Next Task

T06-04 — Backup code recovery
File: docs/tasks/06-admin-auth.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly. Note the Auth Pattern section's Next.js 16
note on `proxy.ts` — it lives at the **project root**, sibling to `app/`, never
`app/proxy.ts` (a real bug hit and fixed at T6.3, session 39 — see `memory/known-bugs.md`).

Then read the full epic file: docs/tasks/06-admin-auth.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. **Read this task's own addendum in that
file carefully — it adds a real precondition (reset `totpEnabled`/`totpSecret` before
reusing `issueSetupToken`) beyond the original Build/Acceptance criteria lines below.**

# Task T6.4 — Backup code recovery

## What to build
`POST /api/admin/auth/verify-backup-code`, consuming the code (single-use), followed by a
forced re-enrolment prompt.

## Input → Output contract
A valid, unused backup code → session cookie + forced redirect to `/admin/setup-2fa` to
re-enroll a new device.

## Acceptance criteria
A consumed backup code is rejected on reuse; login without any remaining valid backup code
and no TOTP device correctly falls through to the "contact another administrator" edge case
(no self-service 2FA bypass exists in the UI at all).

## Size / Dependencies
S, depends on: T6.3 (provides the challenge-token mechanism this endpoint consumes the same
way `verify-totp` does, the session-issuance function this endpoint calls on success, and the
`/admin/login` two-step form this task extends with a "use a backup code instead" fallback —
already shipped).

## Architecture constraints
- **This task's own addendum in `docs/tasks/06-admin-auth.md`**: before calling
  `lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)` to build the forced re-enrolment
  redirect, this task must first reset that `admin_user` row's `totpEnabled` to `false` and
  `totpSecret` to `null`, in the same transaction as consuming the backup code — not a
  separate write. Without this, T6.2's own `resolvePendingTotpSetup`/`confirmTotpSetup`
  checks would reject the fresh setup token outright (they treat `totpEnabled: true` as
  "already set up") and would reuse the *lost device's* old secret instead of generating a
  new one, defeating the entire point of forced re-enrolment.
- **Matching a plaintext backup code against `admin_backup_code.code_hash` needs a loop, not
  a lookup.** Codes are hashed with `lib/auth/password.ts`'s `hashPassword` (bcrypt) — the
  same one-way hash as `admin_user.password_hash` — so there is no way to look up "the row
  matching this plaintext code" directly by a WHERE clause; hashes for the same input differ
  on every call. Fetch every `admin_backup_code` row for the account where `used_at IS NULL`
  and try `verifyPassword(submittedCode, row.codeHash)` against each until one matches or
  none do. With at most 8 rows per account (T6.2's `BACKUP_CODE_COUNT`), this is cheap; don't
  short-circuit in a way that creates a timing side-channel worth worrying about at this
  project's real scale (five partners) — same proportionality call T6.3 already made for
  `loginWithPassword`'s own account-existence timing.
- **Never hand-roll TOTP or password cryptography.** Reuse `lib/auth/password.ts`'s
  `verifyPassword` for the match loop above (ADR 0007) — this task adds no new hashing
  primitive.
- **Rate limiting**: this is a fourth code-guessing endpoint (after T6.3's `login`/
  `verify-totp` and T6.2's `setup-2fa` confirm) — wire it into the same
  `lib/auth/rate-limit.ts` mechanism, keyed by the account's email like the other three. This
  needs a new `AdminLoginAttemptKind` value (e.g. `backup_code`) — a schema change, the same
  "gap found building the real thing" pattern every prior task in this epic has hit at least
  once; document it in `AdminLoginAttemptKind`'s own doc-comment the way `setup_confirm` was
  documented at T6.3.
- **Business logic lives in `lib/`, never inline in a route handler or component.** Add a
  `verifyBackupCodeLogin` (or similarly named) function to `lib/auth/login.ts` alongside
  `loginWithPassword`/`verifyTotpLogin` — same module, since this is the third and final leg
  of the same login flow, not a separate concern.
- **No plaintext password, backup code, or raw TOTP secret in logs.** Same standing rule
  every prior task in this epic established and tested — audit this task's own new
  error-path logging the same way.
- **`/admin/login`'s UI needs a "use a backup code instead" path.** `app/admin/login/
  login-form.tsx` (T6.3)'s TOTP step currently has no fallback — add a link/toggle that
  switches the same step to accept a backup code (format `XXXX-XXXX`, matching T6.2's own
  generated shape) and POSTs to this task's new endpoint instead of `verify-totp`. On
  success, the redirect target is `/admin/setup-2fa?token=...` (from `issueSetupToken`), not
  `/admin` — a materially different post-login destination than T6.3's own flow, so don't
  reuse that code path unconditionally.
- **The "contact another administrator" edge case is UI copy, not a new mechanism.** When
  backup-code verification fails (wrong code, or the account has no remaining unused codes),
  show a message directing the partner to contact another administrator to reset their 2FA
  enrolment — there is no self-service path in this system for a lost device *and* lost
  backup codes (`admin-authentication.md`'s own edge case), and this task must not invent one
  (e.g. no "resend backup codes" email, no admin-bypass link).
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** Applies to this task's new route handler (already implicit for route
  handlers reading Prisma data, but confirm no accidental static optimization).

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — backup codes exist specifically so a
  lost authenticator device doesn't cause permanent lockout; this task is that recovery path
  made real. No self-service 2FA bypass anywhere — losing both device and codes requires
  another administrator's intervention, never built as an in-app escape hatch.
- ADR 0010 — `docs/adr/0010-styling-and-component-stack.md` — the backup-code input and any
  new UI state (the "use a backup code instead" toggle, the "contact another administrator"
  message) should reuse the same shadcn/ui-on-Base-UI components (`Field`/`FieldLabel`/
  `FieldError`/`Input`) `login-form.tsx` and `totp-setup-form.tsx` already establish, not a
  new pattern.

## Relevant feature specification
`docs/features/admin-authentication.md` — this task builds the "Recovery" step of its User
flow in full ("a partner who has lost their device enters a backup code instead of a TOTP
code; the code is consumed (single use) and the partner is prompted to re-enroll a new
device") and the `POST /api/admin/auth/verify-backup-code` Interfaces entry. Read its Edge
cases section's "Partner loses both their device and their backup codes" case directly — this
task's acceptance criterion is that exact scenario handled correctly.

## Mockup / UI reference
Not applicable — no dedicated mockup exists for backup-code entry or the "contact another
administrator" state (`ui/mockups/f-admin-auth/` only covers login and 2FA setup). Infer the
backup-code input's visual treatment from `admin-2fa-setup.html`'s own `.code-input` class
(monospace, tracked-out) already reused by both `login-form.tsx` (T6.3) and
`totp-setup-form.tsx` (T6.2) for their 6-digit inputs — a backup code is a similarly-shaped
single text field, just accepting the `XXXX-XXXX` format instead of 6 digits.

## Coding standards
- Mockups are authoritative. (Not applicable — no dedicated mockup this task; see above.)
- Responsive built in from first implementation. (Applies — the new UI states on
  `/admin/login` must also work at mobile (~375–430px) and tablet (~768px).)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies — `admin-authentication.md`'s
  Interfaces section names this endpoint directly.)
- Business logic lives in `lib/`, never inline. (Applies — see Architecture constraints.)
- Every entity field maps to the feature doc. (Applies to the new `AdminLoginAttemptKind`
  value this task adds — document it the way `setup_confirm` was documented at T6.3.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable — this screen's copy is
  fixed UI chrome.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Applies — see Architecture constraints.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Applies.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies — `login-form.tsx`'s existing pattern of talking only to API
  routes via `fetch` must hold for the new backup-code path too.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — no new page route this task; the new UI states live inside `/admin/login`,
  which already has its own metadata from T6.3.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not
  applicable.)

## Task Completion Checklist
[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
    files (npm run lint && npm run format:check) — this is a hard gate; a pre-push hook / CI
    runs it, so a skipped lint fails the push. Fix pre-existing lint failures too, so the
    branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
    task changed nothing firm-visible, note that explicitly rather than skipping silently
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.5 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
