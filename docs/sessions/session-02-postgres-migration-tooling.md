# Session 02 — Postgres Schema Baseline & Migration Tooling

# Date: 2026-09-04 to 2026-09-05

# Tasks completed: T1.2

## What Was Built

Provisioned Railway's bundled Postgres plugin (user-confirmed first, given real billing
impact) onto the existing `kaalbert-web` project, and built the full migration/seed tooling
convention every later epic's tasks will follow: a deliberately-empty `prisma/schema.prisma`
baseline (Prisma 7.10.0, pinned off npm's `latest` tag since that currently points to a
pre-release), a driver-adapter-based `lib/prisma.ts` singleton, an extensible
`prisma/seed.ts`, `npm run migrate`/`migrate:deploy`/`db:seed` scripts, a `railway.json`
deploy hook, and a `.env.example`. The migration mechanism itself was proven end-to-end via
an isolated, fully-cleaned-up smoke test against the real database rather than left
unverified or faked with a permanent placeholder table.

**Follow-up (2026-09-05, same session):** at the user's request, split `.env` into
`.env.local` (what Next.js/Prisma actually load first) and a gitignored `.env.production`
for local production-build testing. While populating `.env.production` with a real
`DATABASE_URL`, the harness's own disk-change diff preview exposed the live Postgres
password into the conversation. Treated as compromised immediately: the user rotated it via
a `!`-prefixed command (auto mode's classifier correctly blocked the agent from running the
password change itself), the agent synced Railway's tracked `PGPASSWORD`/`POSTGRES_PASSWORD`
variables and verified the new password works end-to-end. Full incident writeup in
`memory/decision-log.md`, and a new durable lesson captured in the
`feedback_never_print_embedded_credential_urls` memory file (outside this repo).

## Files Changed

- prisma/schema.prisma, prisma/seed.ts, prisma7.config.ts — new (prisma7.config.ts later
  edited again in the follow-up to load `.env.local`/`.env.production`/`.env` in that
  priority order, instead of bare `dotenv/config` which only reads `.env`)
- lib/prisma.ts — new
- package.json, package-lock.json — new deps/scripts (see `memory/completed-work.md` for
  the full list)
- railway.json, .env.example — new (`.env.example` edited again in the follow-up to mention
  `.env.local`/`.env.production` instead of `.env`)
- .gitignore, .prettierignore, eslint.config.mjs — `generated/` ignored in all three;
  `.gitignore` further edited in the follow-up to add `.env.production` and drop a stray
  `/lib/generated/prisma` line left over from a discarded experiment
- README.md — new "Database & Migrations" section; edited again in the follow-up for the
  `.env.local`/`.env.production` split
- docs/tasks/01-foundation.md — addendum added to T1.4 (Prisma audit re-check)
- memory/decision-log.md, memory/technical-debt.md, memory/completed-work.md — this
  session's entries, including the follow-up's credential-rotation incident writeup
- CLAUDE.local.md (gitignored, not committed) — DATABASE_URL note updated twice (provisioned,
  then `.env` → `.env.local`)
- `.claude/skills/prisma-*`, `skills-lock.json` — added by `prisma init` itself; the
  duplicate `.windsurf/skills/`/`.agents/skills/` copies it also created were deleted (and,
  after a mistaken first deletion broke `.claude/skills/`'s symlinks into them, properly
  dereferenced into real files before the second deletion)
- .env (gitignored, not committed) — renamed to `.env.local`; `.env.production` added
  (gitignored, not committed)
- Railway project `kaalbert-web` (outside the repo): new `Postgres` service + TCP proxy;
  `kaalbert-web` service's `DATABASE_URL` set to reference `Postgres`'s private-network URL;
  `Postgres` service's own password rotated, `PGPASSWORD`/`POSTGRES_PASSWORD` synced

Full detail, including exactly what's committed vs. gitignored, in
`memory/completed-work.md`'s entry for this session.

Two commits this session: `c4a8a68` (schema/migration tooling baseline) and `03b2359`
(env-file split + password rotation).

## Decisions Made

See `memory/decision-log.md`'s 2026-09-04 (T1.2) entry for full reasoning on each. Summary:

- Provisioning Postgres was explicitly confirmed with the user first (real Railway billing
  impact) before running — not assumed from the task prompt alone.
- Public TCP proxy for local dev, private-network service reference for production —
  Railway's default Postgres template only exposes a private URL, which the app service
  (deployed on Railway) can use directly but a local laptop can't.
- Prisma pinned to `7.10.0` (not `latest`, which is currently the pre-release `8.0.0-rc.13`)
  to avoid shipping an RC; `@prisma/adapter-pg` added since Prisma 7's generated client no
  longer reads `DATABASE_URL` on its own.
- Baseline schema kept at zero models, matching the task's explicit scope note. Proved the
  migration mechanism works via a throwaway, fully-isolated smoke test against the real
  database rather than either leaving it unverified or inventing a permanent fake entity.
- Generated Prisma client output redirected from Prisma's own default (inside `app/`) to
  repo-root `generated/`, keeping generated code out of the Next.js App Router tree.
- 4 high-severity `npm audit` findings left open — transitive, inside Prisma CLI's own
  dev-tooling dependency tree, not reachable from this project's runtime; the only "fix"
  `npm audit fix --force` offers is a downgrade to Prisma 6.x, rejected. Logged as technical
  debt, sequenced into T1.4's existing "recheck a pinned dependency" addendum.
- `.env` split into `.env.local` (dev) + `.env.production` (local prod-build testing only),
  at the user's request. `prisma7.config.ts` updated to load both explicitly, in
  Next.js-matching priority order — a bare `dotenv/config` only reads `.env`, which would
  have silently broken the CLI's DB connection the moment `.env` stopped existing.
- **Credential exposure + rotation** (see `memory/decision-log.md`'s 2026-09-05 entry for
  the full incident): populating `.env.production` with a real `DATABASE_URL` triggered the
  harness's own disk-change diff preview, which printed the live Postgres password into the
  conversation. Rotated immediately — auto mode's classifier blocked the agent from running
  the password change or a `DATABASE_URL` variable update directly (correctly; these are
  exactly the kind of live-production-credential actions that should need a human decision),
  so the user ran the rotation via a `!`-prefixed command instead. New password verified
  working before moving on.

**Unrelated to project work, fully reverted, worth noting for continuity:** this session
also ran `/doctor` (a Claude Code self-maintenance check unrelated to this project) partway
through, at the user's request, before returning to T1.2. It proposed and briefly applied a
CLAUDE.md content migration into lazy-loaded skills; the user asked for maximum reliability
instead, so that specific change was fully reverted (`git checkout -- CLAUDE.md`, skill
files removed) before T1.2 resumed. `CLAUDE.md` in this repo is therefore unchanged from
session 01. Two `/doctor` changes were NOT project-scoped and remain in place outside this
repo: Claude Code itself was updated (2.1.260 → 2.1.261), and `~/.claude/settings.json` now
sets `permissions.defaultMode: "auto"` globally (the user's own machine config, not a
project file).

## Current State

T1.2 is complete: all Task Completion Checklist items pass (lint/format/typecheck clean,
Prisma client generated, migration mechanism proven live, memory files updated). Postgres is
live on Railway with a freshly-rotated password, `.env.local` has a working `DATABASE_URL`,
`.env.production` exists (gitignored) for local prod-build testing, and the repo is ready
for T1.3 to start building on top of a working database layer whenever it needs one. Both
commits (`c4a8a68`, `03b2359`) are made and not yet pushed — a human reviews with
`git log --oneline` and pushes manually, per protocol.

## Blockers

None for T1.2 itself. Carried over from session 01, still open:

1. `kaalbert.com` is not registered — user-triggered, not task-sequenced (see
   `memory/technical-debt.md` and T1.1's addendum). Do not act on this without the user
   explicitly saying the domain is registered.
2. The two most recent T1.1-era commits were confirmed pushed by the user between sessions
   per `git log`, so this is no longer open — noting only that session 01's file said it was
   open; confirm with `git log --oneline` if in doubt.

## Next Task

T1.3 — Design tokens and Tailwind v4 setup
File: docs/tasks/01-foundation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/01-foundation.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T1.3 — Design tokens and Tailwind v4 setup

## What to build
Tailwind CSS v4 (CSS-first, no config file, per ADR 0010) with the design tokens (colour,
spacing, radius, type scale) extracted from the accepted mockups' shared CSS —
`ui/mockups/` is the source of truth for every value, not a fresh design pass.

## Input → Output contract
Mockups' embedded CSS → a single tokens stylesheet imported app-wide, producing
pixel-equivalent output to the mockups for shared primitives (button, card radius, colour
palette).

## Acceptance criteria
A test page rendering the shared primitives (buttons, cards, form inputs) visually matches
the corresponding elements in `ui/mockups/a-public-site/home.html` side by side in a
browser.

## Size / Dependencies
M, depends on: T1.1 (provides the Next.js/TypeScript app and its global stylesheet this
task's tokens are imported into).

## Architecture constraints
- ADR 0010 (must follow exactly): Tailwind CSS v4, CSS-first configuration — design tokens
  declared under an `@theme` directive in the global stylesheet, no `tailwind.config.js`/
  `.ts` file at all. Two-layer structure per `ui/design-system.md`: raw semantic CSS
  variables under `:root`, then an `@theme inline` block exposing them to Tailwind as
  utilities (`bg-primary`, `text-foreground`, etc.) — the exact variable names shadcn/ui's
  generated components will reference in T1.4, not an arbitrary token set invented here.
- `ui/design-system.md`'s full brand colour palette and its mapping onto shadcn's semantic
  variable set (`--primary`, `--background`, `--card`, `--border`, `--ring`, each usually
  paired with a `-foreground` variant) is authoritative — read it in full before writing any
  token. No colour outside that table is introduced without firm approval (default answer
  no, Document 13.03 Section 12) — including the one documented necessary exception
  (`--destructive`).
- `ui/mockups/` is the source of truth for every concrete value (spacing scale, radius,
  type scale) — extract from the mockups' shared CSS (`ui/mockups/_shared.css` and
  `ui/mockups/a-public-site/home.html`'s embedded styles), don't invent or re-derive values
  independently even if they seem more "correct."
- CLAUDE.md Quality Gates: `npm run lint`, `npm run format:check`, `npm run typecheck` must
  all stay passing (already wired into CI from T1.1) — this task adds CSS and a test page,
  not application logic, but the gates still apply to any TypeScript/TSX touched.
- CLAUDE.md Git Commit Protocol: commit only after every Task Completion Checklist item
  passes; commit message format `chore(T01-03): <description>`; never push directly — a
  human pushes manually after `git log --oneline` review.
- This task has no database/schema surface — T1.2's Postgres/Prisma baseline is unrelated to
  this task's scope.

## Relevant ADRs
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first (no
  config file) + shadcn/ui generated on Base UI (not Radix) + Lucide icons; this task
  implements the Tailwind/token half of that decision, T1.4 implements the shadcn/Base UI
  half on top of it.

## Relevant feature specification
No single feature specification applies — this is a design-system/infrastructure task. See
`ui/design-system.md` (not a `docs/features/*.md` file) as the authoritative token
reference instead.

## Mockup / UI reference
`ui/mockups/a-public-site/home.html` (plus its shared stylesheet, `ui/mockups/_shared.css`)
is the exact source this task's tokens must reproduce pixel-equivalently for shared
primitives (buttons, cards, form inputs).

## Coding standards
- The mockups are authoritative for UI tasks. (applies — `ui/mockups/a-public-site/home.html`
  and `ui/mockups/_shared.css` are the literal source of every token value this task
  produces; don't invent or "improve" values)
- Feature docs (`docs/features/*.md`) are the data/interface contract. (not applicable — no
  feature doc governs design tokens; `ui/design-system.md` is the authoritative reference
  instead)
- Business logic lives in `lib/`, never inside a route handler or component. (not
  applicable — this task has no business logic, only CSS tokens and a test page)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (not applicable — no schema/data surface in this
  task)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no
  fee-bearing data in this task)
- Content the firm can edit lives in the database, edited via `/admin`. (not applicable —
  design tokens are code/config, not firm-editable content)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (partially applicable — this task
  produces tokens/CSS only, no interactive Base UI primitives yet; that's T1.4. Ensure
  colour-contrast ratios in the token set itself meet AA though, since T1.4's components
  will inherit whatever's declared here)
- Content the firm can edit lives in the database, read live by every surface that displays
  it (Site Settings singleton pattern). (not applicable — no content surfaces yet)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no
  navigation UI in this task)
- The shared generic `page` entity for marketing-page copy. (not applicable — no database
  entities in this task)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable — this task's "test page" is a scratch verification page, not a real public
  page type)
- Every conversion moment fires through the GTM `dataLayer` pattern. (not applicable — no
  conversion surface in this task)

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
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T1.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
