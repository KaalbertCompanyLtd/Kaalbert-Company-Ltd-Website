# Session 40 — Backup Code Recovery

# Date: 2026-09-10

# Tasks completed: T06-04 (+ a T06-02 follow-up fix)

## What Was Built

`POST /api/admin/auth/verify-backup-code` and `lib/auth/login.ts`'s `verifyBackupCodeLogin`
— matches a submitted code against every unused `admin_backup_code` row for the account (a
bcrypt loop, not a lookup — hashes aren't queryable by plaintext), consumes it, resets
`totpEnabled`/`totpSecret` in the same transaction (the precondition T6.3's own addendum
required), creates a real session, and issues a fresh `/admin/setup-2fa` link via T6.2's
`issueSetupToken`. Added a `backup_code` `AdminLoginAttemptKind` so this endpoint shares the
rate-limiting mechanism the other three endpoints already use. Extended
`app/admin/login/login-form.tsx` with a "use a backup code instead" ⇄ "use your
authenticator app instead" toggle, and a distinct "contact another administrator" message
when an account has zero unused codes left.

**Also fixed, as a same-session T6.2 follow-up**: live-testing this task's own recovery flow
surfaced that T6.2's `confirmTotpSetup` never retired a previous batch of unused backup
codes — harmless when it was only ever called once per account (T6.2's own original design),
but a real, silently-ever-growing gap now that T6.4 gives it a second real caller
(re-enrolment after recovery). Fixed in the same transaction that creates a new batch: delete
every unused row for the account first.

## Files Changed

- `prisma/schema.prisma` — `AdminLoginAttemptKind.backup_code`
- `prisma/migrations/20260910203732_t6_4_backup_code_attempt_kind/` — new migration, applied
- `lib/auth/login.ts` + `.test.ts` — `verifyBackupCodeLogin`
- `app/api/admin/auth/verify-backup-code/route.ts` — new
- `app/admin/login/login-form.tsx` — backup-code toggle + states
- `lib/auth/totp-setup.ts` + `.test.ts` — T6.2 follow-up: retire unused codes on new batch
- `memory/known-bugs.md`, `memory/decision-log.md`, `memory/completed-work.md`

## Decisions Made

- **A valid backup code creates a real session immediately**, at the same time as issuing
  the forced re-enrolment link — not one gating the other. `proxy.ts` only checks session
  validity, not `totpEnabled`, so nothing server-side hard-blocks a partner from visiting
  `/admin` directly instead of finishing re-enrolment mid-session; the redirect is a
  client-side UX nudge. Accepted because the _next_ login is already impossible without
  finishing setup (`loginWithPassword` blocks an account with `totpEnabled: false`) — full
  reasoning in `memory/decision-log.md`.
- **Backup-code matching is a bcrypt loop over ≤8 unused rows**, not a query — same
  proportionality call as T6.3's own account-existence timing decision.
- **Backup-code retirement fix, sequenced as a T6.2 follow-up**, not new T6.4 debt — per
  CLAUDE.md's own "small fix to an already-shipped task → fix now, commit under that task's
  identity" rule. Full writeup in `memory/known-bugs.md`.

## Current State

Backup-code recovery works end-to-end for real, verified live, including two full
recovery-then-re-enrolment cycles confirming the retirement fix. Milestone 6 now has only
T6.5 (account deactivation) and T6.6 (account provisioning) left. `docs/user-guide.md` **not**
updated — still no sanctioned way for the firm to create its first real account (T6.6, still
open), so nothing here is firm-usable yet without developer involvement.

## Blockers

None for T6.5. Still open, tracked: T6.6 (account provisioning) — see
`memory/technical-debt.md`.

## Verification Notes

Exercised for real via Playwright MCP + `curl` against a real, fully-enrolled test
`admin_user` with real (bcrypt-hashed) backup codes: the TOTP ⇄ backup-code toggle works; a
valid code redirects to a real, fresh `/admin/setup-2fa` link with a real new QR code
(confirmed `totpEnabled: false`/`totpSecret: null` in the database immediately after); the
_same_ code rejected on a second attempt; ran two full recovery-then-re-enrolment cycles back
to back and confirmed in the database that only actually-_used_ codes survive across cycles
(the retirement fix, working as intended); rate limiting (429 after 5 failures) confirmed on
this endpoint too, via a real challenge token from a real password login. The one thing _not_
independently live-confirmed: the "contact another administrator" (zero-codes-remaining)
message — blocked by the rate limiter from this same session's own earlier testing (15-minute
window, keyed by email); that exact path is deterministically unit-tested instead
(`lib/auth/login.test.ts`), and is genuinely hard to reach through normal use anyway since a
successful recovery always regenerates a fresh batch of 8 — a safe design outcome, noted
honestly rather than staged. Checked mobile (390px), tablet (768px), and desktop (1280px)
renders of the backup-code UI state. Quality gates all clean: lint, format:check, typecheck,
123/123 tests across 18 files (5 new).

## Next Task

T06-05 — Account deactivation + immediate session invalidation
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
context this prompt summarizes but does not replace.

# Task T6.5 — Account deactivation + immediate session invalidation

## What to build
An `admin_user.active` flag and the enforcement path that invalidates all of a deactivated
user's live sessions immediately, not on next login.

## Input → Output contract
An admin marking another `admin_user` inactive (this control ships functionally here; its UI
home is Milestone 7's Team content area) → that user's `admin_session` rows invalidated
within the same request cycle.

## Acceptance criteria
A session open in a second browser for the deactivated account is rejected on its very next
request after deactivation, not after its natural expiry.

## Size / Dependencies
S, depends on: T6.3 (provides `admin_session`/`lib/auth/session.ts`'s `verifySession` this
task extends, and `proxy.ts` — the request path this task's enforcement must actually run
on — already shipped).

## Architecture constraints
- **This task's own real, unresolved design question**: `admin-authentication.md`'s
  Interfaces section names no deactivation endpoint — deactivation's real UI trigger is
  explicitly Milestone 7's Team content area (this task's own Input→Output line says so),
  not built here. This task must still ship something *functionally real and testable*, not
  just a schema column with no way to exercise it. Resolve this the same way T6.1 resolved
  "no login route exists yet to test a literal failed login against" (schema-only tasks in
  this epic have consistently tested via direct `lib/` function calls, not a UI/route, when
  the UI genuinely belongs to a later task) — build a real `deactivateAdminUser(adminUserId)`
  function (in `lib/auth/session.ts` alongside `createSession`/`verifySession`/
  `destroySession`, or a new `lib/auth/admin-users.ts` if that reads more naturally) and
  verify the acceptance criterion by calling it directly (a test, or a verification script
  the same way `docs/sessions/session-37-*.md` through `session-40-*.md` established), not by
  inventing a premature API route/UI this task doesn't own.
- **Two independent enforcement layers, not one.** (1) `deactivateAdminUser` should, in one
  transaction, set `active: false` and delete every `admin_session` row for that
  `admin_user_id` — the *primary* mechanism, and already sufficient on its own for the
  acceptance criterion (a deleted session simply fails `verifySession`'s own `findUnique` on
  next use). (2) `lib/auth/session.ts`'s `verifySession` should *also* join/check
  `admin_user.active` directly and reject+delete if `false` — defense in depth for any future
  code path that creates or reads a session without going through
  `deactivateAdminUser`'s own transaction (e.g. a stale session created moments before
  deactivation, in flight). Both layers are real work this task does, not one covering for a
  gap in the other left unbuilt.
- **`loginWithPassword`/`verifyTotpLogin`/`verifyBackupCodeLogin` (T6.3/T6.4,
  `lib/auth/login.ts`) should also refuse to authenticate a deactivated account** — an
  inactive partner shouldn't be able to start a *new* session either, not just have existing
  ones survive. Add the `active` check once, in the most upstream place that makes sense
  (likely `loginWithPassword`'s own `findUnique`, since every login path starts there) rather
  than duplicating it across all three functions.
- **Never hand-roll TOTP or password cryptography.** Not applicable new work this task, but
  the standing rule (ADR 0007) still governs anything this task touches.
- **Business logic lives in `lib/`, never inline in a route handler or component.** This
  task adds no route handler at all (per the "no UI/API trigger yet" constraint above) — pure
  `lib/` + schema work, verified directly.
- **No plaintext password or raw TOTP secret in logs.** Same standing rule every prior task
  in this epic established and tested — audit this task's own new error-path logging (if
  any) the same way, even though this task's own new surface (deactivation) doesn't touch
  passwords or TOTP secrets directly.
- **Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name** — `admin_user.active` is not named in
  `admin-authentication.md`'s original Data requirements list (same "gap found building the
  real thing" pattern as `setup_token`/`last_verified_totp_step`/`admin_login_attempt`
  before it) — document it in `AdminUser`'s own schema doc-comment the same way.

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — not directly touched by this task's
  own new work, but the standing "never hand-rolled crypto" rule still applies to anything
  this task's implementation touches in `lib/auth/`.

## Relevant feature specification
`docs/features/admin-authentication.md` — this task builds its Edge cases section's "A
partner account is deactivated (e.g. leaves the firm): session invalidated immediately, not
merely on next login" requirement directly. No Interfaces entry exists for deactivation in
this doc (it's `content-management-admin.md`'s Team-area concern, Milestone 7, not built
here) — this task is the underlying mechanism a future task's UI will call, not the UI
itself.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own, per its own Input→Output line
("this control ships functionally here; its UI home is Milestone 7's Team content area").

## Coding standards
- Mockups are authoritative. (Not applicable — no UI this task.)
- Responsive built in from first implementation. (Not applicable.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies — see Relevant feature
  specification above.)
- Business logic lives in `lib/`, never inline. (Applies — see Architecture constraints.)
- Every entity field maps to the feature doc. (Applies — `admin_user.active` is a real gap
  found building this task, document it the way `setup_token`/`last_verified_totp_step`
  were documented before it.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no UI this task.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Not
  applicable — no route this task.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Not applicable — no client component this task.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable.)
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
    rather than silently skipping this step or claiming it was done. This task has no UI/
    route of its own (see Architecture constraints) — verify via a real database-backed
    script/test instead, the same "exercise it for real, not just mocked" spirit applied to
    a schema-only task, as T6.1 did.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width. (Not
    applicable — no UI this task.)
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
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation") —
    **this task completes Milestone 6** (T6.1–T6.6 all done once T6.6 also ships; check
    whether T6.6 has landed by the time this task runs, and update the Artifact if the whole
    epic is now genuinely complete, not just this one task)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.6 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
