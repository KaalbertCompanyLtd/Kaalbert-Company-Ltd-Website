# Session 01 — Foundation Scaffold

# Date: 2026-09-04

# Tasks completed: T1.1

## What Was Built

Initialized the git repo (confirmed `Website Build/` itself is the repo root, not its parent
folder), scaffolded a Next.js 16.3.4/TypeScript/App Router app against the pre-existing
docs/config scaffolding without clobbering the project's custom ESLint rule or Prettier
config, and made `npm run lint` / `npm run typecheck` / `npm run format:check` real, passing
gates wired into a new GitHub Actions CI workflow. Provisioned a new Railway project under a
newly created company account and deployed the app (live at
https://kaalbert-web-production.up.railway.app); added `origin` (company GitHub repo,
authoritative) and `personal` (contribution-graph-only) git remotes and the `github` MCP
server block.

## Files Changed

- package.json, package-lock.json — Next.js/React/ESLint/Prettier deps and scripts (`dev`,
  `build`, `start`, `lint`, `typecheck`, `format`, `format:check`)
- app/layout.tsx, app/page.tsx, app/page.module.css, app/globals.css, app/favicon.ico —
  Next.js default starter page (deliberately unmodified — real content starts at T2.1)
- public/next.svg, public/vercel.svg, public/globe.svg, public/file.svg, public/window.svg
  — stock assets the starter page references (public/brand/ untouched)
- next.config.ts, tsconfig.json, next-env.d.ts — Next.js/TypeScript config
- eslint.config.mjs — rewritten for Next.js 16's actual flat-config export shape
  (`eslint-config-next/core-web-vitals` + `/typescript` subpath imports), ADR-0001
  `no-restricted-imports` rule preserved
- .gitignore — added `*.tsbuildinfo`
- .github/workflows/ci.yml — new: type-check + lint + format:check on push/PR to `main`
- .mcp.json — added `github` server block (`${KAALBERT_GITHUB_TOKEN}`)
- CLAUDE.md — two Next.js 16 notes added to Auth Pattern (middleware→proxy.ts; the
  `next typegen` typecheck requirement), Essential Commands updated to `npm run typecheck`
- Every pre-existing docs/ui/memory markdown file — Prettier reformatting only (cosmetic:
  emphasis-marker style, blank-line-after-heading), no content changes
- memory/completed-work.md, memory/decision-log.md, memory/technical-debt.md — this
  session's entries

## Decisions Made

- Confirmed `Website Build/` (not its parent folder) is the repo root — the sibling
  `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders are business
  material that should never reach GitHub. See `memory/decision-log.md`.
- Next.js 16.3.4 (latest stable) chosen over an older pinned major — greenfield scaffold,
  no prior version commitment. Two Next.js 16 gotchas recorded in CLAUDE.md directly:
  `middleware.ts`→`app/proxy.ts`, and the `next typegen` requirement for `tsc --noEmit` to
  pass on a fresh checkout.
- ESLint pinned to `^9` (not the newly-released `^10`) — bumping produced `ERESOLVE`
  peer-dependency warnings against `eslint-config-next@16.3.4`'s plugin chain;
  `create-next-app`'s own generated `package.json` independently chose `^9` for this same
  Next.js version. Logged as technical debt to revisit.
- No test framework (Vitest) installed yet — T1.1's own Coding Standards section in the
  task prompt doesn't list it as applicable, and the epic explicitly frames Milestone 1 as
  "just enough to render one real page — not a place to over-build infrastructure ahead of
  need." No application logic exists yet to test. Deferred to whichever task first needs it.
- Cloudflare/domain step deferred at the user's explicit choice — `kaalbert.com` is not
  registered (verified via WHOIS). Logged as technical debt rather than registering a
  placeholder domain.
- Railway provisioned under a newly created company account
  (kaalbert.company@gmail.com), not the developer's personal account. Initial deploy done
  via `railway up` (CLI upload) to prove the pipeline works end-to-end; GitHub-connected
  auto-deploy (`railway service source connect`) is configured against the right repo but
  requires the `main` branch to exist on GitHub first — blocked on the human's first push
  (agents never push directly, per CLAUDE.md's Git Commit Protocol).
- Playwright MCP (the project's designated verification tool) and the Claude-in-Chrome
  browser extension were both unusable this session (server needs a restart + approval;
  extension isn't connected) — verification fell back to `npm run build` (production build
  succeeded) and `curl` against the local dev server and the live Railway URL (both returned
  200 with correct HTML). Stated explicitly per CLAUDE.md's fallback instruction, not
  silently skipped.

## Current State

The app is scaffolded, all quality gates pass locally, and it's live on Railway at
https://kaalbert-web-production.up.railway.app — but T1.1's two Cloudflare/auto-deploy
acceptance criteria are not yet met (see `memory/technical-debt.md`); this commit has not
been pushed to GitHub yet (that's a manual, human step per protocol).

## Blockers

1. `kaalbert.com` is not registered — Cloudflare has no zone to front, so the live URL
   currently resolves through Railway's raw domain, not Cloudflare. See
   `memory/technical-debt.md`.
2. GitHub-connected Railway auto-deploy needs a `main` branch on
   `KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website`, which needs this session's commit
   pushed first. After pushing, run:
   `railway service source connect --repo KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website --branch main`
   (or connect via the Railway dashboard) to complete T1.1's auto-deploy acceptance
   criterion.
3. The `github` MCP server just added to `.mcp.json` needs a session restart and explicit
   approval at the startup prompt before it's usable.

## Next Task

T1.2 — Postgres schema baseline + migration tooling
File: docs/tasks/01-foundation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/01-foundation.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T1.2 — Postgres schema baseline + migration tooling

## What to build
Prisma schema (or equivalent) against Railway's bundled Postgres; migration tooling wired
into CI/deploy so `docs/features/*.md`'s entity lists become real tables incrementally, epic
by epic, rather than one big upfront schema.

## Input → Output contract
Provisioned Postgres → a `schema.prisma` with a migration history, and a documented
`npm run migrate` / seed-script convention every later epic's tasks will follow.

## Acceptance criteria
A migration applies cleanly on a fresh database; a seed script convention exists and is
documented in the repo README for later epics to extend.

## Size / Dependencies
S, depends on: T1.1 (provides the Next.js/TypeScript app, npm scripts convention, CI
pipeline, and the live Railway project this task's Postgres instance attaches to — Railway
project `kaalbert-web`, already created and deployed).

## Architecture constraints
- ADR 0003 (must follow exactly): the database is Railway's own bundled, always-on
  PostgreSQL — do not provision a separate database service (e.g. Neon) at this or any
  later stage; this was evaluated and rejected specifically for cold-start latency risk
  against the diagnostic's performance target. Attach Railway's Postgres plugin to the
  existing `kaalbert-web` project rather than standing up a new database elsewhere.
- ADR 0008 (single deploy target): ordinary env-var-based configuration
  (`DATABASE_URL`) and standard Prisma/Postgres usage are fine and expected; do not
  actively design or test this as portable to a second hosting/database provider.
- Every entity field named in a `docs/features/*.md` "Data requirements" section must map
  to a Prisma schema field of the same name — don't rename during implementation without
  updating the feature doc to match. (T1.2 itself only needs a schema baseline + migration
  tooling, not every epic's entities yet — later epics add tables incrementally, per this
  task's own "Build" description.)
- Fee amounts are always a structured min/max band with a scope cap — never a single
  number, never free text (the `offer.fee_amount_min`/`fee_amount_max` pattern) — applies
  the moment any fee-bearing table is created, not necessarily within T1.2's own baseline
  scope.
- CLAUDE.md Quality Gates: `npm run lint` must exit 0 across the whole tree,
  `npm run format:check` must report no unformatted files, and `npm run typecheck`
  (`next typegen && tsc --noEmit` — a Next.js 16 requirement, see CLAUDE.md's Auth Pattern
  section) must pass with zero errors — these are already wired into CI
  (`.github/workflows/ci.yml`) from T1.1; keep them passing.
- CLAUDE.md Git Commit Protocol: commit only after every Task Completion Checklist item
  passes; commit message format `chore(T01-02): <description>`; never push directly — a
  human pushes manually after `git log --oneline` review.
- `npx prisma generate` must be run (and its output not hand-edited) any time the schema
  changes — this is an explicit Task Completion Checklist item.

## Relevant ADRs
- ADR 0003 — docs/adr/0003-railway-hosting-and-postgres.md — Railway hosts both the
  application and its own bundled, always-on Postgres, chosen specifically to avoid
  cold-start latency risk on the diagnostic; T1.2 provisions and connects to this Postgres
  instance under Railway project `kaalbert-web`.
- ADR 0008 — docs/adr/0008-single-deploy-target-no-dual-host.md — Railway is THE deploy
  target; ordinary env-var configuration for `DATABASE_URL` is expected, but do not build
  or test for portability to a second database/hosting provider.

## Relevant feature specification
No single feature specification applies — this is an infrastructure/scaffolding task. The
full set of `docs/features/*.md` files are the eventual source of every entity this schema
will grow to hold, added incrementally by each later epic's own tasks, not by T1.2 itself.

## Mockup / UI reference
Not applicable — this task has no UI surface.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable to this task)
- Feature docs (`docs/features/*.md`) are the data/interface contract — entity shapes,
  business rules, and edge cases documented there are not optional. (applies going
  forward, to whatever baseline tables/fields this task introduces; the bulk of entity
  modeling happens epic-by-epic in later tasks, not here)
- Business logic lives in `lib/`, never inside a route handler or component. (not
  applicable — T1.2 has no route handlers or business logic, only schema/migration
  tooling)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies to any field this task does introduce)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable to
  T1.2's own scope unless a fee-bearing table is part of the baseline — check before
  assuming out of scope)
- Content the firm can edit lives in the database, edited via `/admin`. (not applicable —
  no `/admin` UI exists yet; relevant once content tables and the admin area both exist)
- Diagnostic scoring configuration is data, not logic. (not applicable — the diagnostic
  engine doesn't exist yet)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no interactive UI in
  this task)
- Content the firm can edit lives in the database, read live by every surface that
  displays it (Site Settings singleton pattern). (not applicable yet — no such surfaces
  exist; worth keeping in mind if T1.2's baseline includes a Site Settings table)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no UI)
- The shared generic `page` entity for marketing-page copy. (not applicable to T1.2 —
  first needed at T2.x when marketing pages are built; do not preemptively create it here
  unless the baseline schema explicitly calls for it)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (not applicable — no pages yet)
- Every conversion moment fires through the GTM `dataLayer` pattern. (not applicable — no
  measurement surface yet)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T1.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
