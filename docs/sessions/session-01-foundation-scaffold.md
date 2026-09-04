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
https://kaalbert.up.railway.app, later renamed from the auto-generated
`kaalbert-web-production.up.railway.app`); added `origin` (company GitHub repo, authoritative)
and `personal` (contribution-graph-only) git remotes and the `github` MCP server block.

**Session continued past initial completion** to close out the two acceptance criteria that
were still open: pushed to both remotes (after resolving a git-credential dead end — see
Decisions Made), then wired and verified GitHub-connected Railway auto-deploy end to end.
Also built a durable multi-account git credential workflow (prompted by a real token-exposure
incident) and, at the user's explicit request, established durable memory-file
format/ordering/sequencing rules in CLAUDE.md, retrofitting all four `memory/*.md` files to
match. T1.1 is now complete except the Cloudflare/domain acceptance criterion, which is
explicitly user-triggered (blocked on domain registration) — see Current State.

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
- memory/completed-work.md, memory/decision-log.md, memory/technical-debt.md,
  memory/known-bugs.md — this session's entries, later retrofitted to the new newest-first,
  bolded-field format (see Decisions Made)
- docs/tasks/01-foundation.md — addenda added to T1.1 (Cloudflare/domain follow-up, marked
  user-triggered) and T1.4 (ESLint version-bump re-check, task-sequenced)
- CLAUDE.md — further edits past the initial two Next.js 16 notes: new "Memory file format
  and ordering" and "Debt/bug fixes must be sequenced into a task" subsections under
  Knowledge Management Responsibilities, plus this "session file is a living document" rule
  under Session Management
- `~/.gitconfig`, `~/.git-credential-helpers/kaalbert-company.sh` (outside the repo) — new
  company-account git credential helper
- `~/Dev_Workspace/git-multi-account-workflow.md` (outside the repo, outside this project
  entirely) — generalized write-up of the credential workflow for reuse on other repos

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
  via `railway up` (CLI upload) to prove the pipeline works end-to-end.
- Playwright MCP (the project's designated verification tool) and the Claude-in-Chrome
  browser extension were both unusable this session (server needs a restart + approval;
  extension isn't connected) — verification fell back to `npm run build` (production build
  succeeded) and `curl` against the local dev server and the live Railway URL (both returned
  200 with correct HTML). Stated explicitly per CLAUDE.md's fallback instruction, not
  silently skipped.
- **Railway domain renamed** from the auto-generated `kaalbert-web-production.up.railway.app`
  to `kaalbert.up.railway.app` via `railway domain update --domain kaalbert`, at the user's
  request.
- **Git push authentication dead end, then a durable fix.** Plain `git push` failed
  non-interactively (Claude Code's `!`-prefixed commands run in a non-interactive shell,
  which can't respond to a credential prompt). Embedding a token directly in a remote URL
  worked as an interim fix, but a routine `git remote -v` run afterward printed that token in
  cleartext into the conversation — a real exposure incident; the token was revoked and
  regenerated. Root-caused properly instead of just rotating and moving on: built a
  non-interactive, per-account credential-helper script
  (`~/.git-credential-helpers/kaalbert-company.sh`, reads the token fresh from `~/.secrets`
  on every push, never caches or embeds it in a URL) wired via `~/.gitconfig`'s
  `[credential "https://github.com/KaalbertCompanyLtd"]` block — mirroring the user's
  existing `git-credential-libsecret` pattern for their other 4 GitHub accounts, adapted
  because libsecret needs one interactive prompt to seed the OS keyring (not available from a
  `!`-prefixed command). Generalized into `~/Dev_Workspace/git-multi-account-workflow.md` so
  the user can apply the same pattern to any future foreign-account repo without re-deriving
  it — the user has since already extended it to more of their own accounts
  (`evershieldsupplies`, etc.) outside this project.
- A PAT without the `workflow` scope can't push changes to `.github/workflows/*.yml` — GitHub
  rejects it with a specific error naming the missing scope. Hit on both the company and
  personal tokens; fixed by adding the scope. Worth remembering for any future repo that ships
  a GitHub Actions workflow.
- **GitHub-connected Railway auto-deploy wired and verified end-to-end**, not just that the
  connect command succeeded: `railway service source connect --repo
KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website --branch main` triggered an immediate
  GitHub-sourced build, which reached `SUCCESS`, and the live URL was confirmed 200
  afterward. T1.1's "main deploys automatically on push" acceptance criterion is genuinely
  satisfied now.
- **Memory-file format/ordering/sequencing rules established**, at the user's explicit
  request (a recurring pain point across their other projects, not just this one): newest
  entry at the top in every `memory/*.md` file, bolded-field entry shapes per file type, and
  a hard rule that any debt/bug entry with a real possible fix must be threaded into
  `docs/tasks/*.md` as an addendum or new task (`Sequenced into:` field) rather than left
  floating. A further refinement added a `Trigger type: Task-sequenced | User-triggered`
  field after the first pass wrongly implied the Cloudflare/domain item could just be picked
  up by whichever session reached it — domain registration is a real-world purchase only the
  user can make, so that item (and any future one like it) is now explicitly marked
  user-triggered with instructions not to act without an explicit go-ahead.
- **This rule — session files must stay current, not just be written once** — was likewise
  made durable in CLAUDE.md's Session Management section, prompted directly by this session
  file itself having gone stale after several rounds of follow-up work.

## Current State

T1.1 is complete and verified except one acceptance criterion. Both remotes are pushed
(`origin` → KaalbertCompanyLtd, `personal` → cosbyDeveloper), all quality gates pass, the app
is live at https://kaalbert.up.railway.app, and GitHub-connected auto-deploy is confirmed
working (a real push-triggered build succeeded). Local commits sit ahead of what was pushed
mid-session (`af0a9f0`, `d39c7dd` — the memory-format-rule and trigger-type commits) and
still need a manual push, per protocol.

## Blockers

1. `kaalbert.com` is not registered — Cloudflare has no zone to front, so the live URL
   currently resolves through Railway's raw domain, not Cloudflare. **User-triggered, not
   task-sequenced**: do not attempt domain registration or treat reaching a task as a cue to
   act — wait for the user to say the domain is registered and ask for this explicitly. See
   `memory/technical-debt.md` and `docs/tasks/01-foundation.md`'s T1.1 addendum.
2. The `github` MCP server added to `.mcp.json` still needs a session restart and explicit
   approval at the startup prompt before it's usable (not yet confirmed done).
3. The two most recent commits (`af0a9f0`, `d39c7dd`) have not been pushed yet — manual,
   human step per protocol.

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
