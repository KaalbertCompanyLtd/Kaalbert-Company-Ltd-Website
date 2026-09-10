# Session 38 — Admin 2FA Setup Flow

# Date: 2026-09-10

# Tasks completed: T06-02

## What Was Built

`/admin/setup-2fa` (ui/mockups/f-admin-auth/admin-2fa-setup.html): a server-rendered QR code

- manual-key fallback, a client-side confirm-code step, and a backup-codes step gated by a
  required checkbox before "Finish setup". Added `lib/auth/totp-setup.ts`
  (`resolvePendingTotpSetup`, `confirmTotpSetup`, `issueSetupToken`) and `POST
/api/admin/auth/setup-2fa`. Resolved a real gap the task itself flagged — no login session
  exists pre-enrolment, so the screen needs another way to identify "which account" — with a
  new `admin_user.setup_token`/`setup_token_expires_at` pair, deliberately general enough for
  T6.4's re-enrolment redirect and the new T6.6 to reuse rather than each inventing their own.
  Split `app/admin/layout.tsx`/`page.tsx` into `app/admin/(shell)/` so this auth screen (and
  T6.3's future `/admin/login`) don't inherit the authenticated sidebar shell.

## Files Changed

- `prisma/schema.prisma` — `AdminUser.setupToken`/`setupTokenExpiresAt`
- `prisma/migrations/20260910193052_t6_2_admin_user_setup_token/` — new migration, applied
- `lib/auth/totp-setup.ts` + `.test.ts` — setup-flow business logic (10 tests)
- `app/admin/(shell)/layout.tsx` + `page.tsx` — moved from `app/admin/` (route-group split)
- `app/admin/setup-2fa/page.tsx` — Server Component: token resolution, QR generation
- `app/admin/setup-2fa/totp-setup-form.tsx` — client two-step form
- `app/api/admin/auth/setup-2fa/route.ts` — confirm endpoint
- `package.json` / `package-lock.json` — added `qrcode`, `@types/qrcode`
- `docs/tasks/06-admin-auth.md` — new T6.6 (account provisioning); addenda on T6.3
  (rate-limiting scope) and T6.4 (re-enrolment reset precondition)
- `memory/technical-debt.md`, `memory/decision-log.md`, `memory/completed-work.md`

## Decisions Made

- **`admin_user.setup_token`/`setup_token_expires_at`** — opaque, single-use, 7-day-lifetime
  link token resolving "which account" for an unauthenticated setup visit, same class of
  problem `Subscriber.unsubscribeToken` already solved. See `memory/decision-log.md`.
- **`issueSetupToken` built now, general-purpose** — not scoped to "first-time setup only";
  T6.4's forced re-enrolment and T6.6's account provisioning both reuse it. T6.4's own
  addendum flags the one real precondition it must add (reset `totpEnabled`/`totpSecret`
  before reusing the token, or T6.2's own "already set up" check rejects it).
- **`app/admin/` split into a `(shell)` route group** — a plain `app/admin/layout.tsx` would
  wrap every route under `/admin/*`, including auth-flow screens that must render their own
  standalone card, not the authenticated sidebar. URL unaffected.
- **`qrcode` (pure-JS) for QR rendering** — same Railway-build-safety reasoning as T6.1's
  `bcryptjs` choice; not a crypto library, ADR 0007 doesn't govern it.
- **Non-interactive migration workaround** — `prisma migrate dev` refused a
  unique-constraint-warning confirmation prompt in this non-interactive session; worked
  around via `prisma migrate diff --from-config-datasource --to-schema` to get the SQL, then
  a hand-written migration applied via `prisma migrate deploy`. Recorded in
  `memory/decision-log.md` for next time this wall is hit.
- **New technical debt discovered and sequenced**: no task anywhere creates a real
  `admin_user` row — added T6.6 (a developer-run CLI script, deliberately not a self-service
  invite UI) to close it. Also flagged, as addenda on future tasks rather than fixed now: T6.3
  needs to cover setup-2fa's confirm endpoint with its own rate-limiting work, and T6.4 must
  reset TOTP state before reusing `issueSetupToken` for re-enrolment.

## Current State

`/admin/setup-2fa` is real and fully working end-to-end (verified live via Playwright MCP —
see Notes). No task before T6.6 needs a real admin account to exist, so this doesn't block
Milestone 6's remaining tasks, but the account-provisioning gap is real and now tracked.
`docs/user-guide.md` **not** updated — nothing is firm-usable yet (no login flow, no
sanctioned way for the firm itself to create an account).

## Blockers

None for T6.3. Real (tracked, not blocking yet): no task provisions the first real
`admin_user` row — see `memory/technical-debt.md` and new task T6.6.

## Verification Notes

Exercised for real via Playwright MCP against a real `admin_user` + setup token created by a
throwaway script (deleted before commit, per this project's established pattern from T6.1):
loaded the real page, extracted the real server-generated manual key from the DOM, computed
the current valid code with `otplib`'s own `generate()` (the same RFC 6238 math any real
authenticator app implements — no physical device exists in this environment), typed it into
the real input, and confirmed the real success state (8 real backup codes; DB writes
verified directly — `totp_enabled: true`, `setup_token: null`, 8 hashed
`admin_backup_code` rows, no plaintext anywhere). Confirmed single-use enforcement
(revisiting the same, now-consumed link shows "no longer valid") and the `app/admin/(shell)`
split didn't break the existing `/admin` dashboard placeholder. Checked mobile (390px),
tablet (768px), and desktop (1280px) renders — all correct, no overflow, matches the mockup
at desktop width. Quality gates all clean: lint, format:check, typecheck, 90/90 tests across
14 files (10 new).

## Next Task

T06-03 — Login + TOTP verification + session management
File: docs/tasks/06-admin-auth.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly. Pay particular attention to the Auth
Pattern section's two Next.js 16 notes (`app/proxy.ts`, not `middleware.ts`; `npm run
typecheck`, never bare `tsc --noEmit`).

Then read the full epic file: docs/tasks/06-admin-auth.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. **Read this task's own addendum in that
file carefully — it adds a real requirement (setup-2fa's confirm endpoint needs the same
rate limiting this task builds) beyond the original Build/Acceptance criteria lines below.**

# Task T6.3 — Login + TOTP verification + session management

## What to build
`POST /api/admin/auth/login`, `POST /api/admin/auth/verify-totp`, session cookie issuance
with the 30-minute-inactivity / 12-hour-absolute policy decided in the epic header; rate
limiting on both the password and TOTP steps.

## Input → Output contract
`{email, password}` → challenge token → `{challenge_token, code}` → session cookie.

## Acceptance criteria
No admin route is reachable without a valid TOTP-verified session (NFR-3 — not optional, not
skippable, tested by attempting direct navigation to an admin URL pre-login); a session idle
for 30 minutes is rejected on next request; repeated failed attempts against either step are
rate-limited; a replayed TOTP code within the same time window is rejected even though it
hasn't expired.

## Size / Dependencies
M, depends on: T6.1 (provides `admin_user`/`admin_session` tables, `lib/auth/password.ts`
for password verification, `lib/auth/totp-encryption.ts` for decrypting a stored secret —
already shipped), T6.2 (provides the `admin_user.totp_secret`/`totp_enabled` this task reads
at login, and establishes the `lib/auth/` module layout this task extends — already shipped).

## Architecture constraints
- **This task's own addendum in `docs/tasks/06-admin-auth.md`**: whatever rate-limiting
  mechanism this task builds for `login`/`verify-totp` must also cover `POST
  /api/admin/auth/setup-2fa` (T6.2) — a third endpoint accepting a 6-digit-code guess that
  shipped with no rate limiting of its own. Design the mechanism generically enough to wrap
  all three, not two with a bolted-on third.
- **Session enforcement belongs in `app/proxy.ts`, never `middleware.ts`.** This project
  scaffolded on Next.js 16, where `middleware.ts` is deprecated in favor of a `proxy` function
  in `app/proxy.ts` (Node.js runtime by default) — a stray `middleware.ts` is silently ignored
  at build time with no error, which would make "no admin route reachable without a valid
  session" (this task's own literal acceptance criterion) silently stop working. Use
  `lib/auth` (this task's own new session-verification function) from `app/proxy.ts` for
  every `/admin/*` route except the auth-flow routes themselves (`/admin/login`,
  `/admin/setup-2fa`, and this task's own API routes) — never re-implement session-checking
  logic per-route.
- **Never hand-roll TOTP or password cryptography.** Reuse `lib/auth/password.ts`
  (`verifyPassword`) and `lib/auth/totp-encryption.ts` (`decryptTotpSecret`) exactly as T6.2
  already does — this task adds no new hashing/encryption primitive, only a new *use* of the
  existing ones (verifying a login attempt, not confirming a setup). Use `otplib`'s own
  `verify` function for the TOTP code check (same as `lib/auth/totp-setup.ts`'s
  `confirmTotpSetup`), not a hand-rolled comparison.
- **Replay protection is this task's own new requirement, not T6.2's.** T6.2's
  `confirmTotpSetup` has no replay tracking because a setup token is single-use by
  construction (consumed the moment it succeeds) — login is repeated, so a valid code must be
  rejected if it's the *same* code already used to log in within its own time step. This
  needs a way to record "the last TOTP time step this account successfully verified at" —
  `otplib`'s `verify` result includes a `delta`/step-relative value you can use to compute the
  actual time step verified, but nothing in the current schema stores it. Decide and document
  where this lives (most likely a new nullable field on `AdminUser`, e.g.
  `lastVerifiedTotpStep`) as a real design decision this task resolves, the same way T6.2
  resolved its own `setup_token` gap — don't invent a shape and leave it undocumented.
  Backup-code verification (T6.4, not built yet) doesn't share this concern (a backup code is
  already single-use by its own `used_at` field).
- **Session storage: decide DB-backed vs. stateless, and document it.** `admin_session`
  (T6.1) already has `id`/`admin_user_id`/`created_at`/`expires_at` — a shape that fits a
  DB-backed session (the cookie holds an opaque value resolving to a row this task looks up
  on every request) better than a self-contained signed JWT would. This task should use that
  existing table as the source of truth rather than introducing a second, parallel session
  mechanism; the 30-minute-inactivity half of the epic's session policy needs its own
  last-activity column this task adds to `admin_session` (not invented at T6.1, which
  deliberately left it out — see that model's own schema doc-comment).
- **Business logic lives in `lib/`, never inline in a route handler or component.** Add
  login/verify-totp/session-issuance/session-verification logic as new `lib/auth/` functions
  (e.g. `lib/auth/login.ts`, `lib/auth/session.ts`) — the route handlers and `app/proxy.ts`
  only validate input/read the cookie and call into `lib/auth/`.
- **No plaintext password or raw TOTP secret in logs.** Same standing rule T6.1/T6.2
  established and tested — audit this task's own new error-path logging (a failed Prisma
  write, a caught `otplib`/rate-limit error) the same way.
- **Rate limiting needs a real store.** An in-memory counter doesn't survive a Railway
  redeploy or work across multiple instances — decide where rate-limit state actually lives
  (e.g. a `failed_attempt` table, or a lightweight counter on `AdminUser` itself) as a real
  design decision, not an afterthought; document the choice the way T6.1/T6.2 documented
  theirs.
- **Reuse the existing auth-shell visual pattern, don't duplicate it.** T6.2's
  `app/admin/setup-2fa/page.tsx` has a private `AuthShell` component (centered card,
  `ui/mockups/f-admin-auth/`'s shared `.admin-auth-shell`/`.auth-card` styling) that isn't
  exported — extract it to a shared location (e.g. `app/admin/auth-shell.tsx`) this task and
  `/admin/setup-2fa` both import, rather than copy-pasting the same markup a second time for
  `/admin/login`.
- **`/admin/login` needs the same route-group treatment T6.2 already applied.** It must be a
  sibling of `app/admin/(shell)/` (i.e. `app/admin/login/page.tsx`), never nested inside the
  `(shell)` group — a partner isn't authenticated yet when viewing it, so it must not inherit
  the sidebar shell.
- **Responsive is built in from first implementation.** `ui/mockups/f-admin-auth/admin-login.html`
  is a desktop-only wireframe — this screen must also work at mobile (~375–430px) and tablet
  (~768px) before the task is done.
- **Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`.** The login form is necessarily a client component (two-step password →
  TOTP flow, matching `TotpSetupForm`'s own pattern from T6.2) — it must talk to the new API
  routes via `fetch`, never import `lib/auth/` directly, mirroring T6.2's own
  `totp-setup-form.tsx`.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** Applies to `/admin/login` and every new API route.

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — TOTP via `otplib` for the RFC 6238
  core; login sequence and session enforcement are hand-built on top of it. No admin action
  is available without a TOTP-verified session (NFR-3) — this task is where that becomes
  real and enforced, not merely documented.
- ADR 0010 — `docs/adr/0010-styling-and-component-stack.md` — Tailwind CSS v4 (CSS-first,
  `@theme`) + shadcn/ui generated on Base UI (not Radix) + Lucide icons. Build the login
  form's inputs/button as shadcn/ui-derived components on Base UI primitives, same as T6.2's
  `totp-setup-form.tsx` (`Field`/`FieldLabel`/`FieldError`/`Input`/`Checkbox` from
  `components/ui/`), styled with the existing `ui/design-system.md` tokens.

## Relevant feature specification
`docs/features/admin-authentication.md` — this task builds the "Login" step of its User flow
in full, plus the `POST /api/admin/auth/login`/`verify-totp` Interfaces entries. Read its
Business rules (TOTP required before any content action; sessions expire after a defined
inactivity period) and Edge cases (expired/reused TOTP code rejected with a clear message
but standard clock-drift tolerance respected; repeated failed attempts rate-limited) sections
— this task is what actually implements every one of those, not a later task.

## Mockup / UI reference
`ui/mockups/f-admin-auth/admin-login.html` — single-step card: email + password fields, a
"Forgot password?" link (not this task's scope — no password-reset task exists anywhere in
this epic; leave the link inert or omit it, don't build a feature nothing asked for), a
"Continue" submit button, and a fixed note that TOTP is required next and cannot be skipped.
The mockup shows only the password step — the subsequent TOTP-code-entry step has no
dedicated mockup; infer its structure from T6.2's own `admin-2fa-setup.html` Step-1 pattern
(a single 6-digit code input, monospace/tracked-out styling, same `.code-input` class), since
both are "enter a 6-digit code from your authenticator app" moments with no meaningful UI
difference beyond the surrounding copy.

## Coding standards
- Mockups are authoritative. (Applies — build `/admin/login`'s first step to
  `admin-login.html` exactly; the TOTP step is the one screen in this epic without its own
  dedicated mockup, per `ui/screen-inventory.md`'s "can be inferred" convention — infer from
  T6.2's own step-1 pattern as described above, not a fresh guess.)
- Responsive built in from first implementation. (Applies — see Architecture constraints.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies — `admin-authentication.md`'s
  Interfaces section names both endpoints this task builds directly.)
- Business logic lives in `lib/`, never inline. (Applies — see Architecture constraints.)
- Every entity field maps to the feature doc. (Applies to any new field this task adds
  beyond `admin-authentication.md`'s original list — e.g. the replay-protection and
  last-activity fields flagged above — document each the way T6.2 documented `setup_token`.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable — this screen's copy is
  fixed UI chrome.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Applies — see Architecture constraints.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Applies.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies — see Architecture constraints; T6.2's `totp-setup-form.tsx` is
  the precedent to follow.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — `/admin/login` is not a public/indexable page; give it `robots: {index:
  false, follow: false}` the same way T6.2's `/admin/setup-2fa` does.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not
  applicable — no conversion event defined for admin login.)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
