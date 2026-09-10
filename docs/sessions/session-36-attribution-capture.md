# Session 36 — Attribution capture, persistence, and 90-day retention

# Date: 2026-09-10

# Tasks completed: T5.4

## What Was Built

Client-driven first-touch campaign attribution: a new `Attribution` model (`session_id`
`@unique`, nullable `utm_source`/`utm_medium`/`utm_campaign`, `landing_page`, `first_seen`)
with an `EnquiryRecord.attributionId` foreign key, captured entirely client-side via
`localStorage` (no server session mechanism exists anywhere in this codebase) and resolved
server-side into both enquiry-creating write paths (`createContactEnquiry`,
`submitDiagnosticResponses`). A 90-day retention job (`lib/attribution-cleanup.ts`, runnable
via `npm run attribution:cleanup`) deletes expired, unreferenced rows — never one still
referenced by a real enquiry, regardless of age.

## Files Changed

- `prisma/schema.prisma` — new `Attribution` model; `EnquiryRecord.attributionId` relation.
- `prisma/migrations/20260910143644_t5_4_attribution/` (new).
- `lib/attribution-client.ts` (new) — client-safe capture (`captureAttributionOnce`,
  `getStoredAttribution`), no `@/lib/prisma` import.
- `lib/attribution.ts` (new) — server-side `resolveAttributionId` (defensive parse + upsert).
- `lib/attribution-cleanup.ts` (new) — `deleteExpiredAttributionRows`.
- `lib/attribution.test.ts`, `lib/attribution-cleanup.test.ts` (new).
- `scripts/cleanup-attribution.ts` (new) — standalone runner; `package.json`
  (`attribution:cleanup` script).
- `lib/enquiries.ts` + `lib/enquiries.test.ts` — `attribution` input, `attributionId` linked.
- `lib/diagnostic-submit.ts` + `lib/diagnostic-submit.test.ts` — same, plus a new
  `attribution` parameter.
- `app/api/contact/submit/route.ts` — passes `body.attribution` through.
- `app/api/diagnostic/submit/route.ts` — wire shape changed from a bare array to
  `{answers, attribution?}`.
- `components/contact-form.tsx`, `components/diagnostic-flow.tsx` — send
  `getStoredAttribution()` with their submissions.
- `components/attribution-capture.tsx` (new) — site-wide capture, mounted in `app/layout.tsx`.
- `docs/features/business-health-check-diagnostic.md`, `docs/features/contact-and-enquiry.md`,
  `docs/features/measurement-and-attribution.md` — updated to match the real, built contract.
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — new
  entries.
- **Follow-up work, same session** (see its own section below): `.railway/railway.ts` (new
  `attribution-cleanup` cron service; `preserve()` added for four previously-undeclared
  `kaalbert-web` variables); `CLAUDE.md` (new Recurring Patterns entry).

## Decisions Made

- **Attribution capture is entirely client-driven (`localStorage`), never a server session**
  — no session mechanism exists anywhere in this codebase to extend, and
  `measurement-and-attribution.md`'s own flow needs attribution to survive multiple full page
  navigations (landing page → `/diagnostic` → results → contact), which only persisted
  client storage genuinely does here.
- **`POST /api/diagnostic/submit`'s wire shape changed** from a bare JSON array to
  `{answers, attribution?}` — the smallest change that gives the new `attribution` payload
  somewhere to live. Updated the client, the route, and the feature doc's Interfaces section
  together, in the same change.
- **`resolveAttributionId` never throws** — malformed/missing/failed attribution resolution
  always degrades to `attributionId: null`, verified live against the real API (a
  deliberately garbage `attribution` payload still produced a `201` with the enquiry created).
- **Retention job verified against real seeded rows, not just a mocked unit test** — three
  rows (expired+unreferenced, expired+referenced, recent) confirmed the one deletable row was
  deleted and, critically, that an expired-but-referenced row survives regardless of age —
  the task's own explicit acceptance criterion, and the one case a mocked Prisma client
  can't truly prove.
- **Railway Cron Job scheduling — corrected mid-session, see the follow-up section below.**
  Originally flagged as a dashboard-only action for the user to take; the user pushed back,
  asked whether it could be scripted, and it could — this decision was reversed the same
  session, not left standing.

## Current State

T5.4 is fully verified end-to-end against the real, live database: a UTM-tagged landing →
`/diagnostic` navigation → real submit call correctly produced an enquiry whose `attribution`
relation carried the original UTM values; a direct visit (no UTM params) correctly stored
null utm fields without blocking; a garbage attribution payload also never blocked
submission; the retention job correctly deleted only the one row that should be deleted. All
quality gates pass (lint, format:check, typecheck, 67/67 tests — 11 new). All test/scratch
rows were deleted afterward; the `attribution` table is empty on disk, as it should be before
any real traffic exists. **The retention job is now also actually scheduled** (see the
follow-up below) — nothing left outstanding for T5.4. Committed as `T5.4` and a same-session
`T5.4 follow-up`.

**A real bug caught and fixed during this task's own verification**: the first version of
`scripts/cleanup-attribution.ts` statically imported `lib/prisma` alongside its own `dotenv`
`config()` calls — ES module `import` statements are hoisted above all other top-level code
regardless of source order, so `lib/prisma.ts` read `process.env.DATABASE_URL` before
`config()` ever ran, throwing "DATABASE_URL is not set" on every run. Fixed with
`await import(...)` inside `main()` instead of a static import; documented in the script's
own comment.

## Follow-up: scheduling the retention job (same session)

After this task's own completed-work entry described Railway Cron Job scheduling as a
dashboard-only action, the user asked directly whether it could be done via CLI/script
instead — it could, and the framing was wrong. Corrected in the same session:

- Declared a new `attribution-cleanup` service in `.railway/railway.ts` (Railway's
  config-as-code file, tracked since T1.1): `deploy.cronSchedule: "0 3 * * *"`,
  `restartPolicyType: "NEVER"`, `build: "true"` (skips Railpack's auto-detected full
  `next build` — this job only calls `tsx` directly).
- Verified the real IaC schema by installing the actual `railway` npm package into an
  isolated scratch directory and reading its shipped `.d.ts` files directly, after
  confirming (via a deliberately bogus field name) that the CLI does not validate unknown
  properties — "no error" alone would have been worthless evidence of a field's validity.
- Applied via `railway config plan` (dry-run, reviewed) then `railway config apply --yes`,
  with the user's explicit go-ahead for that one production-infrastructure action.
- **The dry-run caught a real, unrelated landmine first**: the existing `kaalbert-web`
  service's declaration in that same file had never been updated to `preserve()`
  `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`/`GTM_CONTAINER_ID` — `plan` showed
  applying as-is would have deleted all four live variables. Fixed before touching anything.
- **The first real deployment then failed for real**, diagnosed from actual Railway build/
  deploy logs, not guessed: `DATABASE_URL: preserve()` on a brand-new service protects
  nothing (there was no prior value to preserve), so it deployed unset. Fixed with a real
  cross-service reference (`ref(postgres("Postgres"), "DATABASE_URL")`). A second deployment
  then succeeded (`status: SUCCESS` via `railway service list`).
- **Standing pattern decided**, checked against the roadmap rather than assumed:
  `platform-performance-dashboards.md` (Milestone 9) needs four more scheduled jobs (one per
  ad platform), each requiring the same failure-isolation Railway's per-service Cron Jobs
  already give for free. Decided: one small Railway service per scheduled task, declared in
  `.railway/railway.ts`, never a shared worker/dispatcher process — recorded in `CLAUDE.md`'s
  Recurring Patterns section so Milestone 9 inherits this without re-deciding it.

## Blockers

None for T5.4 itself. T5.5 needs multiple real external accounts/credentials before it can
proceed — Meta Business Manager + a Meta CAPI access token, a Google Ads account, and
LinkedIn Campaign Manager access — none of which exist yet (`META_CAPI_ACCESS_TOKEN` is still
blank in `.env.local`/`.env.production`; confirmed directly with the user this session — none
of the four exist). Same pattern as T5.3 needed GTM/GA4 before it could do anything real.

**Resequencing decision (same session, after the above was confirmed):** since T5.5 blocks
nothing on the critical path — only Milestone 9's T9.4/T9.5/T9.6 depend on it, per
`docs/roadmap.md`'s own "(Bonus)" labeling and a direct dependency-graph check — the user
decided to resequence T5.5 to run immediately before Milestone 9 instead of right after T5.4,
and to mark Milestone 5 complete on that basis (T5.1–T5.4 shipped; T5.5 deliberately deferred,
not abandoned). Updated: `docs/tasks/05-landing-and-measurement.md` (epic status line + T5.5's
own resequencing note), `docs/tasks/09-performance-dashboards.md` (new note before T9.1),
`docs/roadmap.md` (Milestone 5 and Milestone 9 entries), `docs/dashboard.md` (Current Phase
line), `memory/decision-log.md`, `memory/completed-work.md`. T5.5 keeps its own task ID and
identity — only its build-order position moved. Also fixed a stale mockup-path reference
found while preparing this handoff: `docs/tasks/06-admin-auth.md`'s epic header cited
`ui/mockups/g-admin-content/` for the login/2FA-setup screens; the real files live under
`ui/mockups/f-admin-auth/` (confirmed via `ls`) — corrected in place.

## Next Task

T6.1 — Data model: `admin_user`, `admin_backup_code`, `admin_session`
File: docs/tasks/06-admin-auth.md
(Milestone 6, Admin Authentication — the next milestone in build order now that Milestone 5
is marked complete through T5.1–T5.4, with T5.5 resequenced to run immediately before
Milestone 9 instead. See `docs/roadmap.md` and `memory/decision-log.md` for the full
resequencing decision.)

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/06-admin-auth.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. Note the epic's own header decision:
session policy is already fixed at 30 minutes inactivity / 12-hour absolute lifetime
(implemented later, at T6.3) — this task doesn't implement session enforcement, but the
`admin_session` table it creates must have the columns that decision needs.

# Task T6.1 — Data model: `admin_user`, `admin_backup_code`, `admin_session`

## What to build
Tables per `docs/features/admin-authentication.md`; passwords via a vetted hash library
(bcrypt/argon2), TOTP secrets encrypted at rest, TOTP itself via a vetted library (RFC 6238),
never hand-rolled (ADR 0007).

## Input → Output contract
Schema definition → migrated tables.

## Acceptance criteria
No plaintext password or raw TOTP secret is ever written to logs (verified by a deliberate
failed-login test and inspecting log output).

## Size / Dependencies
S, depends on: T1.2 (Postgres schema baseline + migration tooling — provides the Prisma
schema file and migration workflow this task adds three new tables to; already shipped, no
further action needed from it).

## Architecture constraints
- **Never hand-roll TOTP or password cryptography.** Use a vetted library for the RFC 6238
  TOTP core (e.g. `otplib`) and a vetted library for password hashing (bcrypt/argon2) — this
  task only stores what those libraries produce (a hash, an encrypted secret), it does not
  implement the crypto itself. Neither library is currently in `package.json` — install
  whichever this task settles on and record the choice.
- **Every field named in `docs/features/admin-authentication.md`'s Data requirements section
  maps 1:1 to a Prisma field of the same name** — don't rename during implementation without
  updating the feature doc to match (see the exact field lists under "Relevant feature
  specification" below).
- **TOTP secrets are encrypted at rest**, not merely hashed (unlike passwords/backup codes,
  a TOTP secret must be recovered in plaintext at verification time to compute the current
  code, so it needs reversible encryption, not a one-way hash) — decide and document the
  encryption approach (e.g. a server-held symmetric key via a vetted crypto library) as part
  of this task; this is a real design decision this task must resolve, not inherited from
  anywhere else in the codebase.
- **Business logic lives in `lib/`, never inline.** This task is schema-only, but the
  password-hashing/TOTP-encryption helper functions later tasks (T6.2, T6.3) will call
  belong in a new `lib/auth/` directory per CLAUDE.md's Auth Pattern section ("Use `lib/auth`
  (once scaffolded) for session verification in any route handler or Server Component") —
  confirmed via grep this session that `lib/auth` does not exist yet, so if this task adds
  any hashing/encryption helper alongside the schema (rather than leaving that entirely to
  T6.2/T6.3), it should live there, establishing the directory rather than duplicating it
  later.
- **No plaintext password or raw TOTP secret in logs** is this task's literal acceptance
  criterion — audit any error-path logging (e.g. a failed Prisma write, a caught exception)
  touching these fields before calling this done, not just the happy path.
- Confirmed this session via grep: no `admin_user`/`admin_session`/`admin_backup_code`
  Prisma models, no `lib/auth` directory, and no `app/proxy.ts` exist yet in this codebase —
  this task is a genuine from-scratch addition, not extending anything partially built.
  `app/proxy.ts` (session enforcement) and `lib/auth`'s actual verification logic are later
  tasks' work (T6.3+), not this one's.

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — TOTP (not email-delivered codes) is
  the required admin two-factor method, using a well-vetted library for the RFC 6238
  cryptographic core only; the setup screen, login sequence, backup codes, and enforcement
  logic are all hand-built. Backup codes exist specifically so a lost authenticator device
  doesn't cause permanent lockout — this task's `admin_backup_code` table is what makes that
  possible.

## Relevant feature specification
`docs/features/admin-authentication.md` — the literal contract for this task's three tables:
- `admin_user` — id, name, email, password_hash, role, totp_secret (encrypted), totp_enabled,
  created_at, last_login_at.
- `admin_backup_code` — id, admin_user_id, code_hash, used_at (nullable).
- `admin_session` — id, admin_user_id, created_at, expires_at.
Also read its Business rules and Edge cases sections for the constraints these tables exist
to support (single-use backup codes, no self-service 2FA bypass, rate-limiting, deactivation
invalidating sessions immediately) — none of that is built in this task, but the schema
should not foreclose any of it (e.g. `admin_session` needs enough to be individually
invalidatable per T6.5's later requirement).

## Mockup / UI reference
Not applicable — this task has no UI surface of its own (pure data-model task). The epic's
own cited mockups (`ui/mockups/f-admin-auth/admin-login.html`,
`ui/mockups/f-admin-auth/admin-2fa-setup.html` — corrected this session from a stale
`g-admin-content/` reference in the epic file) become relevant starting T6.2 (2FA setup
screen) and T6.3 (login flow), not this task.

## Coding standards
- Mockups are authoritative. (Not applicable — no UI this task.)
- Responsive built in from first implementation. (Not applicable.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Directly applies — the three tables above
  are copied field-for-field from `admin-authentication.md`.)
- Business logic lives in `lib/`, never inline. (Applies to any hashing/encryption helper
  this task introduces — see Architecture constraints above.)
- Every entity field maps to the feature doc. (Directly applies — this is the core of what
  this task does.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no UI this task.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Not
  applicable — no route this task.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Not applicable yet — no client component reads this data until T6.2/T6.3;
  worth remembering once `lib/auth` exists and any client-side setup/login form is built.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable — no
  lifecycle script change this task.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — admin-only, no new public page.)
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
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.2 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
