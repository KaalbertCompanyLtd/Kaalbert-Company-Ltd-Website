# Completed Work

Entries below follow this format, one per completed task, added by whichever agent completes
it (see CLAUDE.md's Task Completion Checklist and Git Commit Protocol):

## YYYY-MM-DD

Task:
Summary:
Files Changed:
Related Feature:
Notes:

## 2026-09-04

Task: T1.1 — Repo, Next.js app, and deploy pipeline
Summary: Initialized the git repo at `Website Build/` (the actual repo root — the sibling
`Company Docs`/`Planning framework and trigger`/`Vendor Response` folders stay out of
version control). Scaffolded a Next.js 16.3.4 / TypeScript / App Router app (no Tailwind
yet — that's T1.3's job), merged it against the pre-existing docs/config scaffolding without
clobbering the custom ESLint rule or Prettier config, wired `npm run lint` /
`npm run typecheck` / `npm run format:check` as real, passing quality gates, and added
`.github/workflows/ci.yml` running all three on every push/PR to `main`. Reformatted the
entire existing docs/ui/memory tree with Prettier (cosmetic only — emphasis-marker style,
blank-line-after-heading normalization) since this is the task that makes the format gate
real for the first time. Created a Railway project (`kaalbert-web`, under a newly created
kaalbert.company@gmail.com account) and deployed the app via `railway up`; live at
https://kaalbert.up.railway.app (confirmed 200 via curl). Added `origin`
(https://github.com/KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website.git, authoritative) and
`personal` (https://github.com/cosbyDeveloper/Kaalbert-Company-Ltd-Website.git, for
contribution-graph pushes only) git remotes, and added the `github` MCP server block to
`.mcp.json` referencing `${KAALBERT_GITHUB_TOKEN}`.
Files Changed:

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
  typegen requirement — see decision-log)
- Every pre-existing docs/ui/memory markdown file — Prettier reformatting only, no content
  changes
  Related Feature: None — infrastructure/scaffolding task, `docs/tasks/01-foundation.md` T1.1
  Notes: See `memory/decision-log.md` for the Next.js-version, ESLint-version, and
  domain/Cloudflare decisions made during this task, and `memory/technical-debt.md` for the
  three items still open (unregistered domain, GitHub-connected auto-deploy pending first
  push, ESLint 9 EOL pin).
