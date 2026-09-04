# GitHub Copilot Instructions — kaalbert.com

Condensed from `AGENTS.md`/`CLAUDE.md` — read those for full detail. Refer to them
directly for anything not covered here.

## Project overview

kaalbert.com — the qualification-and-authority website for Kaalbert & Company Ltd, a
Ghana-rooted advisory firm. Two conversion instruments (a scored Business Health Check
diagnostic, an Insights publishing engine) plus three fee-transparent core offer pages, a
capabilities overview, and a full paid-advertising measurement layer. See `docs/vision.md`.

## Coding standards

- TypeScript, Next.js App Router, Prisma/PostgreSQL, Tailwind v4 (CSS-first, no config file)
  - shadcn/ui on Base UI, ESLint + Prettier, Vitest + Playwright Test.
- Business logic in `lib/` only — route handlers validate input, call `lib/`, shape the
  response; components render.
- Fee amounts: always structured min/max + currency + scope cap, never a single number or
  free text.
- Diagnostic question/dimension/weight/threshold values are data; the scoring algorithm is a
  developer change — keep that boundary intact.
- Firm-editable content (contact details, fee bands, page copy) lives in the database, never
  hard-coded.
- WCAG 2.1 AA is a hard requirement — use Base UI primitives for interactive elements.

## Architecture constraints

- No CMS or admin-kit product may own the admin UI, data model, or routes (ADR 0001) —
  libraries are components inside code this team owns, never the whole admin experience.
- No dual-host portability design — Railway is the single deploy target (ADR 0008).
- TOTP admin auth: a vetted library for the cryptographic core only, everything else
  hand-built (ADR 0007).
- Every conversion event fires through the existing GTM `dataLayer` pattern — never a
  hard-coded tag outside GTM.
- Do not start a Phase 2 (gated) capability (`docs/tasks/10-16*.md`) until its evidence
  trigger in `scope.md`/`docs/roadmap.md` is confirmed met.

## Directory responsibilities

- `app/` — Next.js routes (public site, `/admin`, `/portal`, API routes).
- `components/` — shared React components, shadcn/ui-derived primitives.
- `lib/` — scoring engine, auth/session logic, email utility, Prisma client, all business
  logic.
- `prisma/` — schema, migrations, seed script.
- `docs/` — the full planning record; `docs/features/*.md` is the data/interface contract to
  build to, `docs/tasks/*.md` is what to build and its acceptance criteria.
- `ui/mockups/` — accepted, authoritative HTML wireframes; build UI to these.
- `memory/` — persistent project knowledge (see Documentation expectations below).

## Documentation expectations (Knowledge Management Responsibilities, condensed)

Repository documentation is the primary source of truth, not conversation history. A task
is not complete until relevant docs/memory are updated:

- `memory/completed-work.md` — every completed task.
- `memory/decision-log.md` — any decision made or deviation from plan.
- `memory/architecture-decisions.md` — any architectural decision change.
- `docs/architecture.md` — any system architecture change.
- The relevant `docs/features/*.md` — if requirements evolved during implementation.
- `memory/technical-debt.md` — any shortcut or compromise introduced.
- `memory/known-bugs.md` — any unresolved issue left behind.

A rule, gate, convention, or gotcha discovered mid-task gets written down immediately, in
the file it belongs to — not left to be remembered later.
