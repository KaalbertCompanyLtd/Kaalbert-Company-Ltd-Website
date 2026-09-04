# Completed Work

Newest entry at the top. Entries below follow this format, one per completed task, added by
whichever agent completes it (see CLAUDE.md's Task Completion Checklist and Git Commit
Protocol):

## YYYY-MM-DD

**Task:**
**Summary:**
**Files Changed:**
**Related Feature:**
**Notes:**

---

## 2026-09-04

**Task:** T1.1 — Repo, Next.js app, and deploy pipeline
**Summary:** Initialized the git repo at `Website Build/` (the actual repo root — the
sibling `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders stay out of
version control). Scaffolded a Next.js 16.3.4/TypeScript/App Router app (no Tailwind yet —
that's T1.3's job), merged it against the pre-existing docs/config scaffolding without
clobbering the custom ESLint rule or Prettier config, wired `npm run lint` /
`npm run typecheck` / `npm run format:check` as real, passing quality gates, and added
`.github/workflows/ci.yml` running all three on every push/PR to `main`. Reformatted the
entire existing docs/ui/memory tree with Prettier (cosmetic only) since this is the task that
makes the format gate real for the first time. Created Railway project `kaalbert-web` (new
company account) and deployed the app; live at https://kaalbert.up.railway.app. Set up two
git remotes (`origin` = KaalbertCompanyLtd, `personal` = cosbyDeveloper) and, after an
initial token-exposure incident (see `memory/decision-log.md`), landed on a durable
multi-account credential workflow (SSH for the personal/default account, a non-interactive
script-based credential helper reading `~/.secrets` for foreign accounts) — generalized and
documented outside the repo at `~/Dev_Workspace/git-multi-account-workflow.md`. Wired and
verified GitHub-connected Railway auto-deploy end to end (a real push-triggered build
succeeded, live URL confirmed 200 afterward).
**Files Changed:**

- package.json, package-lock.json — Next.js/React/ESLint/Prettier deps, `dev`/`build`/
  `start`/`lint`/`typecheck`/`format`/`format:check` scripts
- app/layout.tsx, app/page.tsx, app/page.module.css, app/globals.css, app/favicon.ico —
  Next.js default starter page (deliberately unmodified; real content starts at T2.1)
- public/next.svg, public/vercel.svg, public/globe.svg, public/file.svg, public/window.svg
  — stock assets the starter page references
- next.config.ts, tsconfig.json, next-env.d.ts — Next.js/TypeScript config
- eslint.config.mjs — rewritten for Next.js 16's actual flat-config export shape
  (`eslint-config-next/core-web-vitals` + `/typescript` subpath imports, not the old
  `FlatCompat`/`"next/core-web-vitals"` string form), ADR-0001 `no-restricted-imports` rule
  preserved
- .gitignore — added `*.tsbuildinfo`
- .github/workflows/ci.yml — new: type-check + lint + format:check on push/PR to `main`
- .mcp.json — added `github` server block
- CLAUDE.md — two Next.js 16 notes added to the Auth Pattern section (middleware→proxy.ts;
  typegen requirement); new "Memory file format and ordering" + "Debt/bug fixes must be
  sequenced into a task" subsections added under Knowledge Management Responsibilities
- docs/tasks/01-foundation.md — addenda added to T1.1 (Cloudflare/domain follow-up) and T1.4
  (ESLint version-bump re-check)
- Every pre-existing docs/ui/memory markdown file — Prettier reformatting only, no content
  changes
- `~/.gitconfig`, `~/.git-credential-helpers/kaalbert-company.sh` (outside the repo) — new
  company-account credential helper

**Related Feature:** None — infrastructure/scaffolding task, `docs/tasks/01-foundation.md`
T1.1
**Notes:** T1.1 is fully complete except the Cloudflare acceptance criterion, which is
blocked on `kaalbert.com` not being registered (see `memory/technical-debt.md`, sequenced
into T1.1 as an addendum for whenever the domain exists). One technical-debt item
(ESLint 9.x EOL pin) remains open, sequenced into T1.4. See `memory/decision-log.md` for the
full set of implementation decisions made this session, including the token-exposure
incident and its resolution.
