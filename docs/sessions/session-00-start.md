# Session 00 — Start

## Project Summary

kaalbert.com is the qualification-and-authority website for Kaalbert & Company Ltd, a
Ghana-rooted business advisory firm — built around a scored, six-minute Business Health
Check diagnostic and an Insights publishing engine, surrounded by three fee-transparent core
offer pages and a full paid-advertising measurement layer so every enquiry traces back to
the page, article, or advertisement that produced it. Full planning (Phases 1–7 of
`PROJECT_PLANNING_FRAMEWORK.md`) is complete, including a dedicated pre-Phase-6 audit that
found and closed 7 requirements/consistency gaps before task planning was written — see
`docs/dashboard.md`. Nothing has been implemented yet.

## Tech Stack

- TypeScript on Node.js
- Next.js, App Router — one codebase for the public site, diagnostic, and admin area
- PostgreSQL via Prisma, Railway's bundled always-on instance
- Railway hosting, single deploy target (no dual-host design)
- Cloudflare CDN/proxy in front of Railway; Cloudflare R2 for object storage (added later)
- Tailwind CSS v4 (CSS-first, no config file) + shadcn/ui on Base UI + Lucide icons
- Hand-built TOTP two-factor admin authentication
- Custom, data-driven in-app diagnostic scoring engine
- Google Tag Manager as the single measurement container + hand-built server-side Meta
  Conversions API integration
- Vitest + React Testing Library (unit/component), Playwright Test (end-to-end), Playwright
  MCP (interactive verification during build)
- ESLint + Prettier, npm

## Current State

**Nothing built yet. Starting from Phase 1 MVP tasks.** Planning is complete: 23 feature
specs, 11 ADRs, 77 inventoried screens (25 with dedicated mockups, 52 inferred), a 16-epic
roadmap sequenced public-presentation-first, and full agent context files (`CLAUDE.md`,
`AGENTS.md`, `.mcp.json`, `.claude/commands/`) are all in place and ready to use.

## First Task to Implement

**T1.1 — Repo, Next.js app, and deploy pipeline**, from `docs/tasks/01-foundation.md`
(Milestone 1: Foundation — roadmap goal: "A deployed, empty Next.js application with its
schema, design tokens, and shared layout shell in place — nothing user-visible yet, but
everything after this milestone builds on it without re-deciding it.")

## Relevant Feature Spec and Architecture Doc

- `docs/architecture.md` — overall system architecture and external-dependencies table
- `docs/adr/0002-nextjs-typescript.md`, `docs/adr/0003-railway-hosting-and-postgres.md`,
  `docs/adr/0004-cloudflare-cdn-proxy.md`, `docs/adr/0008-single-deploy-target-no-dual-host.md`
- No `docs/features/*.md` applies — T1.1 is a pure infrastructure/scaffolding task with no
  feature-level data or interface contract of its own.

## Exact Prompt to Paste Into Claude Code to Begin

The block below is the full, complete output of `/task T1.1` — paste it verbatim to start.

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/01-foundation.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T1.1 — Repo, Next.js app, and deploy pipeline

## What to build
Next.js/TypeScript app (ADR 0002) in the repo root, deployed to Railway (ADR 0003), fronted
by Cloudflare (ADR 0004). CI: type-check + lint on push.

## Input → Output contract
Empty repo → a live URL on Railway serving the Next.js default page through Cloudflare, with
a working CI pipeline.

## Acceptance criteria
`main` deploys automatically on push; the live URL resolves through Cloudflare (not
Railway's raw domain); `npm run typecheck` and `npm run lint` both run in CI and fail the
build on error.

## Size / Dependencies
M. Dependencies: none — this is the epic's first task; everything else in
docs/tasks/01-foundation.md and every other epic depends on it.

## Architecture constraints
- ADR 0008 (single deploy target): do not design, test, or document this setup as portable
  to a second hosting provider (e.g. Vercel). Ordinary env-var-based configuration is fine
  and expected; actively building/testing dual-host support is explicitly out of scope and
  against a direct project decision.
- ADR 0003: the database is Railway's own bundled, always-on PostgreSQL — do not provision a
  separate database service (e.g. Neon) at this or any later stage; this was evaluated and
  rejected specifically for cold-start latency risk against the diagnostic's performance
  target.
- ADR 0004: DNS/proxy routes through Cloudflare in front of Railway — the live URL must
  resolve through Cloudflare, not Railway's raw `*.up.railway.app` domain, from this task
  onward.
- CLAUDE.md Quality Gates: `npm run lint` must exit 0 across the whole tree and
  `npx tsc --noEmit` must pass with zero errors — both wired into CI now, not added later,
  since every subsequent task assumes this gate already exists and is enforced on push.
- CLAUDE.md Git Commit Protocol: commit only after every Task Completion Checklist item
  passes; commit message format `chore(T01-01): <description>`; never push directly — a
  human pushes manually after `git log --oneline` review.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — TypeScript + Next.js (App Router) is the
  one framework for the public site, diagnostic, and admin area; chosen over PHP/Laravel and
  a hand-rolled Node/Express stack for its built-in SSR/SSG/code-splitting/image optimisation
  and its native fit to the diagnostic's no-full-reload requirement.
- ADR 0003 — docs/adr/0003-railway-hosting-and-postgres.md — Railway hosts both the
  application and its own bundled, always-on Postgres; chosen over Vercel (cost floor
  exceeds the real budget) and Neon's free tier (cold-start risk).
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — Cloudflare (free tier) sits in front of
  Railway for DNS/proxy/CDN, closing Railway's one real performance gap for Ghanaian 3G
  visitors; R2 object storage is added later, once media volume justifies it — not part of
  this task.
- ADR 0008 — docs/adr/0008-single-deploy-target-no-dual-host.md — Railway is THE deploy
  target, not one of two actively-supported options; do not build or test for portability to
  a second host.

## Relevant feature specification
No feature specification applies — this is an infrastructure/scaffolding task.

## Mockup / UI reference
Not applicable — this task has no UI surface. (The Next.js default starter page is
sufficient output; do not build any real page content here — that begins at T2.1 in
docs/tasks/02-public-presentation.md, after T1.3–T1.5 establish the design tokens and shared
layout shell this epic's later tasks depend on.)

## Coding standards
- Business logic in `lib/`, never in route handlers or components beyond calling into
  `lib/` (not applicable yet — no business logic exists at this task's scope).
- Fee-band structure, firm-editable content, diagnostic data/logic boundary (not applicable
  — no data model exists yet).
- WCAG 2.1 AA via Base UI primitives (not applicable — no interactive UI exists yet; this
  task ships only the Next.js default page).
- ESLint (`eslint-config-next`) + Prettier must both be configured and passing from this
  task's first commit onward — this is where the quality-gate tooling in CLAUDE.md's
  Essential Commands becomes real, not just documented (applies).
- CI: type-check + lint on every push, failing the build on error (applies — this is the
  task's own acceptance criterion).

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
Complete this task fully, then write the session summary file (docs/sessions/session-01-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T1.2 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
