# Session 41 — Account Deactivation

# Date: 2026-09-10

# Tasks completed: T06-05

## What Was Built

`admin_user.active` (default `true`) and its enforcement. `lib/auth/session.ts`'s new
`deactivateAdminUser(adminUserId)` — the primary mechanism — flips `active` to `false` and
deletes every `admin_session` row for that account in one transaction. `verifySession` also
independently checks `active` on every lookup, as defense in depth for any session that
exists without having gone through that transaction. `loginWithPassword` refuses to issue
even a challenge token for a deactivated account, with a distinct message shown only after
the password is confirmed correct. No UI or API route this task, per its own Input→Output
line — deactivation's real trigger is Milestone 7's Team content area; this task ships the
underlying mechanism only.

## Files Changed

- `prisma/schema.prisma` — `AdminUser.active`
- `prisma/migrations/20260910230808_t6_5_admin_user_active/` — new migration, applied
- `lib/auth/session.ts` + `.test.ts` — `deactivateAdminUser`, `verifySession` extended
- `lib/auth/login.ts` + `.test.ts` — `loginWithPassword` extended
- `memory/decision-log.md`, `memory/completed-work.md`

## Decisions Made

- **Two independent enforcement layers** — `deactivateAdminUser`'s proactive session
  deletion (primary) and `verifySession`'s own direct `active` check (defense in depth) —
  both real, both tested, neither covering for a gap in the other left unbuilt.
- **`loginWithPassword` checks `active` once**, in the single most upstream place (right
  after password verification, same placement as the existing `totpEnabled` check), rather
  than duplicated across `verifyTotpLogin`/`verifyBackupCodeLogin` too.
- **No UI/API route this task** — verified via a real database-backed script instead, the
  same precedent T6.1 set for schema-only work with nothing yet calling it.

Full reasoning in `memory/decision-log.md`.

## Current State

Deactivation works end-to-end for real, verified live against the dev database (both the
primary mechanism and the defense-in-depth layer independently). Milestone 6 now has only
T6.6 (account provisioning) left — once that ships, the epic is complete.
`docs/user-guide.md` **not** updated — this task has no firm-visible surface of its own yet
(no UI until Milestone 7's Team area).

## Blockers

None for T6.6. Still open, tracked: "No task provisions a real `admin_user` row yet" —
T6.6 is exactly that task, next up.

## Verification Notes

This task has no UI or route of its own (per its own scope), so — same precedent T6.1
established for schema-only work — verified via a real, throwaway database-backed script
(deleted before commit) rather than Playwright MCP: created a real account + session,
confirmed `active: true` by default, deactivated it, confirmed `active: false` and zero
remaining session rows in the database, confirmed the now-orphaned session token is rejected
by `verifySession`, confirmed a fresh `loginWithPassword` attempt is refused with the
distinct deactivation message, and independently exercised the defense-in-depth layer by
creating a session directly on an already-inactive account (bypassing `deactivateAdminUser`
on purpose) and confirming `verifySession` rejected and cleaned it up too. Every expectation
matched exactly. Quality gates all clean: lint, format:check, typecheck, 126/126 tests
across 18 files (3 new).

## Next Task

T06-06 — Initial admin account provisioning
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
context this prompt summarizes but does not replace. **This task completes Milestone 6** —
once it ships, update the "Website Build Status" Artifact per CLAUDE.md's Firm-Facing
Documentation section (read that Artifact's current live content first, per the Artifact
tool's own rule, before republishing).

# Task T6.6 — Initial admin account provisioning

## What to build
A developer-run CLI script (`npm run admin:create-user -- --name "..." --email "..."`,
`tsx scripts/create-admin-user.ts`, same execution convention as
`scripts/cleanup-attribution.ts`) that creates one `admin_user` row (name, email,
`password_hash` from a securely generated or operator-supplied initial password), then calls
`lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)` (already built at T6.2, this task's
first real caller — no new schema needed) to set `setup_token`/`setup_token_expires_at` and
print the resulting `/admin/setup-2fa?token=...` link for the developer to hand to the new
partner through whatever secure channel the firm already uses. **Not** a self-service
`/admin` "invite a partner" UI — with a fixed five partners and new accounts created rarely,
a CLI script run by the developer is proportionate; a full invite-UI would be more process
than this firm's scale justifies (same reasoning content-management-admin.md's own business
rules give for not building a copy-approval routing layer).

## Input → Output contract
`--name`/`--email` (and an optional `--password`; a strong random one is generated and
printed if omitted) → a new `admin_user` row + a printed one-time setup link.

## Acceptance criteria
The printed link, opened fresh, reaches `/admin/setup-2fa` and completes real TOTP enrolment
exactly as T6.2 already verifies; running the script twice for the same email is rejected
(the `admin_user.email` unique constraint), not silently duplicated.

## Size / Dependencies
S, depends on: T6.1 (provides `admin_user` and its `password_hash` field —
`lib/auth/password.ts`'s `hashPassword`), T6.2 (provides `setup_token`/
`setup_token_expires_at` and `lib/auth/totp-setup.ts`'s `issueSetupToken` — this task reuses
it rather than inventing a second one; T6.4's own re-enrolment redirect already reuses the
same function too) — both already shipped.

## Architecture constraints
- **Follow `scripts/cleanup-attribution.ts`'s exact env-loading pattern.** This script runs
  directly via `tsx`, not through anything that loads `.env.local`/`.env.production`/`.env`
  first — call `dotenv`'s `config()` for all three, in that precedence order, *before* any
  static or dynamic import of `lib/prisma` or anything that transitively imports it (a static
  `import` is hoisted above your own `config()` calls regardless of where you write it in the
  file — use `await import(...)` inside `main()` after `config()` runs, exactly as
  `scripts/cleanup-attribution.ts`'s own doc-comment explains; this is a real, previously-hit
  bug in that file, not a style preference).
- **Never hand-roll password generation.** When `--password` is omitted, generate a strong
  random one using Node's own `crypto.randomBytes` (already the pattern this epic uses
  throughout — `AdminSession`'s token, `AdminUser.setupToken`, backup codes) — not a
  hand-rolled weak-entropy scheme, and not a new dependency for something Node's built-in
  `crypto` already does well.
- **Reuse `lib/auth/password.ts`'s `hashPassword` and `lib/auth/totp-setup.ts`'s
  `issueSetupToken` exactly as they exist** — this task adds no new hashing/token-issuance
  primitive, only a new caller of both.
- **`issueSetupToken` needs a real absolute `baseUrl` this time** — every other caller
  (`resolvePendingTotpSetup`'s own internal re-generation, T6.4's in-app redirect) only ever
  needed a relative path, since the browser was already on the right origin. This script runs
  outside any request context and prints a link a developer copies into an external channel
  (email, Slack, a password manager's secure note) — it needs the real site origin.
  `lib/seo.ts` already resolves this exact "real absolute origin" concern for the same reason
  (canonical/OG URLs) via `NEXT_PUBLIC_SITE_URL`, falling back to `https://www.kaalbert.com` —
  reuse that same resolution, don't invent a second one.
- **No plaintext password or raw setup token in logs beyond this script's own intended
  stdout output.** This is the one deliberate, narrow exception to the epic's standing "never
  log a raw credential" rule — printing the freshly-generated password and setup link to the
  terminal is this script's literal job (its own acceptance criterion depends on it), not a
  leak; still never write either value to a file, a database column beyond
  `password_hash`/`setup_token`'s own already-encrypted-or-hashed forms, or any HTTP response.
- **Business logic lives in `lib/`, never inline in a script.** If this task needs any new
  logic beyond calling `hashPassword`/`issueSetupToken`/a Prisma `create` directly (e.g. CLI
  arg parsing, password-strength generation), keep `scripts/create-admin-user.ts` itself thin
  — parse args, call into `lib/`, print the result — and put any real logic that could be
  unit-tested in a `lib/` module instead. A tiny amount of argv-parsing glue living directly
  in the script is fine (this project has no CLI-parsing dependency yet and three flags
  doesn't justify adding one — hand-parse `process.argv`), but don't let real business rules
  (password generation, validation) hide there uninspected.
- **Duplicate-email handling**: rely on `admin_user.email`'s existing `@unique` database
  constraint (T6.1) to reject a second run for the same email — catch the resulting Prisma
  error and print a clear, specific message (e.g. "An admin_user with this email already
  exists.") rather than letting a raw Prisma constraint-violation stack trace be the only
  output; don't add a redundant pre-check `findUnique` purely to avoid it (the unique
  constraint is already the real guarantee — CLAUDE.md's own "trust internal code and
  framework guarantees" rule).

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — this task doesn't touch TOTP
  cryptography directly (it only triggers issuance of a setup link via `issueSetupToken`,
  already built), but the standing "never hand-rolled crypto" rule still governs the
  password-generation work this task does add.

## Relevant feature specification
`docs/features/admin-authentication.md` — this task is the first real thing in the whole
epic that actually creates an `admin_user` row (every earlier task assumed one already
existed) — re-read that doc's "Setup (once per partner)" user-flow step ("partner receives
an account, sets a password...") for the framing this script exists to satisfy: the "receives
an account" half of that sentence, with "sets a password" reinterpreted as "is given one" per
this task's own Input→Output (a developer-run script generating/setting the initial
credential, not a partner self-registration form — no such form exists anywhere in this
epic).

## Mockup / UI reference
Not applicable — this is a developer-run CLI script, no UI surface at all.

## Coding standards
- Mockups are authoritative. (Not applicable — no UI this task.)
- Responsive built in from first implementation. (Not applicable.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies — see Relevant feature
  specification above.)
- Business logic lives in `lib/`, never inline. (Applies — see Architecture constraints;
  narrow exception for thin argv-parsing glue directly in the script.)
- Every entity field maps to the feature doc. (Not applicable — no new fields this task,
  every field this task writes to already exists.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no UI this task.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Not
  applicable — no route this task.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Not applicable — no client component this task.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable — this
  task adds an `npm run admin:create-user` *ordinary* script, not a lifecycle hook like
  `prepare`/`postinstall` — CLAUDE.md's git-guard rule is specific to those, not general
  scripts.)
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
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed (not
    expected this task — no schema change anticipated)
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done. This task's own
    "interface" is the CLI script itself plus the real `/admin/setup-2fa` link it prints —
    run the script for real against the dev database, then open the printed link via
    Playwright MCP and complete real TOTP enrolment (T6.2's own already-established
    verification pattern), satisfying this task's literal acceptance criterion end to end.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width. (Not
    applicable — no UI this task; the linked setup screen's own responsiveness was already
    verified at T6.2.)
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable) — **flip the "No task provisions a
    real `admin_user` row yet" entry's Status to Resolved in place** (never duplicate as a
    new entry) once this task ships, per CLAUDE.md's own instruction for resolved entries
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — **this
    one plausibly does**: it's the first genuinely firm-usable capability in Milestone 6 (a
    developer can now actually provision a real partner account) — read the guide's current
    content first and judge honestly whether to record it, rather than defaulting either way
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation") —
    **this task completes Milestone 6** (T6.1–T6.6 all shipped once this lands) — read the
    Artifact's current live content first, then update it
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.1 (the
first task of Milestone 7, `docs/tasks/07-content-admin.md` — "Admin dashboard — `/admin`")
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
