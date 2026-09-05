# Session 16 — Diagnostic scoring engine data model

# Date: 2026-09-05

# Tasks completed: T3.1

## What Was Built

The four scoring tables `docs/features/business-health-check-diagnostic.md` names —
`DiagnosticDimension`, `DiagnosticQuestion`, `DiagnosticThreshold`, `DiagnosticResponse` — plus
the `EnquiryRecord.diagnosticResponses` relation that model's own doc-comment had already
flagged as deferred pending this milestone. No values were seeded; the migration is schema only,
as this task's own architecture constraint requires (real config is T3.3's job). The ADR 0005
acceptance criterion ("a new dimension/question via data alone, no code change") was proven for
real with a throwaway script, not just asserted from reading the schema.

## Files Changed

- `prisma/schema.prisma` — added `DiagnosticDimension` (name, weight), `DiagnosticQuestion`
  (promptText, a real FK to its dimension, order unique per dimension, a new
  `DiagnosticResponseType` enum for scale/boolean/choice, an `active` flag), `DiagnosticThreshold`
  (a nullable dimension FK expressing "dimension or overall", thresholdValue,
  triagePriorityLevel), `DiagnosticResponse` (sessionId, a real FK to its question, answerValue, a
  nullable FK to `EnquiryRecord`); added `EnquiryRecord.diagnosticResponses`.
- `prisma/migrations/20260905212239_t3_1_diagnostic_scoring_tables/migration.sql` — new
  migration, applied to the dev database, no seeded rows.
- `generated/prisma/` — regenerated client (gitignored, not committed).
- `memory/completed-work.md`, `memory/decision-log.md` — session entries.
- `docs/dashboard.md` — "Current Phase" line updated to reflect T3.1 complete, T3.2 next.

No application code changed — this is a schema-only task with no route/lib/component surface
of its own.

## Decisions Made

- **`diagnostic_response`'s "timestamp" field is modelled as `createdAt`/`created_at`**, not a
  literal `timestamp` column, matching every other model's timestamp field in this schema
  (`EnquiryRecord.createdAt` included). The feature doc's field list here is descriptive English
  ("session id", "answer value", "timestamp"), not literal snake_case identifiers the way
  `home-page.md`'s list is — same treatment as "active flag" → `active` and "dimension or
  overall" → nullable `dimensionId` elsewhere in this same feature doc's list. Documented in the
  model's own doc-comment and in `memory/decision-log.md` so the mapping is traceable, per
  CLAUDE.md's field-naming discipline.
- **`diagnostic_threshold`'s "dimension or overall" is a single nullable `dimensionId` FK**
  (null = overall), not a separate scope-discriminator column — mirrors this schema's existing
  nullable-FK precedents rather than inventing a new shape.
- **`DiagnosticQuestion.dimensionId` is a real relational FK**, not an inline dimension name
  string, specifically so ADR 0005's "more dimensions/questions than launch config ships with, no
  code change" requirement is structurally true, not just conventionally true. Verified by
  actually inserting a new dimension/question/threshold via Prisma Client only (a throwaway
  script, `prisma/_t3_1_acceptance_check.ts`, deleted immediately after the run) and reading them
  back through a query shaped the way T3.2's scoring function will query (active questions joined
  to their dimension's weight, plus thresholds) — passed, then cleaned up both the test rows and
  the script.
- **`DiagnosticQuestion.active`** lets a question retire from the live flow without breaking
  historical `DiagnosticResponse` rows that reference it; T3.2's scoring function is expected to
  query `active: true` only.
- **`DiagnosticResponse.enquiryId` is nullable** because a response is written per-step during
  the flow (T3.4), before `POST /api/diagnostic/submit` (T3.5) creates the owning `EnquiryRecord`
  those responses ultimately attach to.
- No deviation from the task's own architecture constraints otherwise — `traffic_source`/
  `campaign`/`landing_page` were correctly left unmodelled (Milestone 5's problem, per T2.6's
  prior finding), and `enquiry_record` was not otherwise restructured.

## Current State

Milestone 3's data model is in place and migrated on the dev database; all four quality gates
(`npm run lint`, `npm run format:check`, `npm run typecheck`, `npx prisma generate`) pass clean.
No `npm run test` script exists yet — Vitest isn't scaffolded until T3.2 (per that task's own
addendum in `docs/tasks/03-diagnostic.md`), so no unit-test gate applied to this task. Ready to
start T3.2 (the pure scoring function that queries these tables).

## Blockers

None for T3.2. Pre-existing, already-tracked blockers unrelated to this session's own work
remain open in `memory/technical-debt.md` (GTM container not provisioned, favicon pending firm
confirmation, `site_settings.response_time_commitment` pending a firm-supplied figure, partner
photography pending, `SiteFooter`/`ScopeOfPracticeNote` still reading hardcoded copy — all
already sequenced into their respective future tasks, none newly introduced here).

## Next Task

T3.2 — Server-side scoring function
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.2 — Server-side scoring function

## What to build
Pure scoring function — response set → `{score, dimension_scores,
weakest_dimensions, indicative_cost_statement}` — computing against `diagnostic_dimension`
weights and `diagnostic_threshold` values.

## Input → Output contract
Array of `{question_id, answer}` → the result shape above.

## Acceptance criteria
Unit tests cover a full-marks response set, a zero-marks set, and a
set that trips a triage threshold on one dimension but not others; a dimension with no active
questions returns a caught, logged error, never an uncaught 500 reaching a visitor path
(matches the documented edge case).

## Size / Dependencies
M, depends on: T3.1 (the `DiagnosticDimension`/`DiagnosticQuestion`/`DiagnosticThreshold`/
`DiagnosticResponse` tables this function queries against — already migrated on the dev
database, empty of data; `DiagnosticQuestion.dimensionId` is a real FK with `active` boolean,
`DiagnosticDimension.weight` is numeric, `DiagnosticThreshold.dimensionId` is nullable to mean
"or overall" — see prisma/schema.prisma's doc-comments for the full field-by-field reasoning).

## Architecture constraints
- Business logic lives in `lib/`, never inside a route handler or a React component beyond
  what's needed to call into `lib/` and render the result — this task's whole deliverable is
  exactly that: a pure `lib/` function, with no route of its own yet (T3.5 is the route that
  calls it).
- Diagnostic scoring configuration (questions, dimensions, weights, thresholds) is data, not
  logic (FR-2.2, ADR 0005) — this function reads that configuration from the database on every
  call; do not hard-code any dimension name, weight, or threshold value inside this function,
  even as a fallback/default.
- Do not invent a scoring algorithm change disguised as a "configuration" edit — the values
  (weights, thresholds) are data; the algorithm that combines them (how a dimension score is
  computed from its questions' answers, how the overall score is computed from dimension
  scores, how a threshold breach becomes a triage flag) is this task's own code and is a
  developer decision, not something to leave ambiguous or push into a config value.
- The documented edge case is explicit: "Result computation encounters a dimension with no
  active questions (a configuration error): the API returns a 500 and logs it; this must be
  caught in the admin's configuration validation before publishing question-set changes, not
  surfaced to a visitor mid-flow" — this task's own acceptance criteria narrows that to "a
  caught, logged error, never an uncaught 500 reaching a visitor path," so this function must
  itself catch that condition and return/throw something the caller (T3.5's route, later) can
  turn into a clean response, not let it propagate as an unhandled exception.
- Every entity field named in `docs/features/business-health-check-diagnostic.md`'s "Data
  requirements" section maps to a Prisma schema field of the same name (already true after
  T3.1) — this function consumes those fields as T3.1 shaped them for exactly this purpose
  (numeric `weight`, queryable `active`, a nullable `dimensionId` on `diagnostic_threshold`
  meaning "or overall").
- Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"` — not applicable to this task directly (no route here), but keep it in mind
  for T3.5, the route that will call this function.

**Addendum (session 03, 2026-09-05):** No Vitest config or test file exists anywhere in the
repo yet — every task through T1.3 was infrastructure/tokens with no `lib/` business logic to
unit-test. This is the first task with a pure `lib/` function and explicit unit-test acceptance
criteria, so scaffold Vitest + React Testing Library (CLAUDE.md's stated stack) here, not
before: install the deps, add a minimal `vitest.config.ts`, add the `npm run test` script (no
`test` script exists in `package.json` at all yet), and write this task's scoring-function tests
against that new setup. See `memory/technical-debt.md` → "Vitest never scaffolded (no test
runner exists yet)."

**Addendum (session 04, 2026-09-05):** This task is also the next confirmed `package.json`
touch after T1.4, so re-check two low-priority debt items already re-checked twice without
resolution, while the Vitest install above is already touching dependencies anyway:

- **ESLint 9→10** (`memory/technical-debt.md` → "ESLint pinned to the EOL 9.x line"): T1.4
  found `eslint@^10` now installs with no ERESOLVE warning, but `npm run lint` crashes with a
  real `TypeError` inside `eslint-plugin-react`'s `react/display-name` rule — reverted to
  `^9.39.5`. Re-run `npm run lint` after bumping to whatever `eslint@10.x` is current at this
  point; only keep the bump if lint actually passes clean, not just installs cleanly.
- **Prisma CLI npm-audit vulnerabilities** (`memory/technical-debt.md` → "4 high-severity npm
  audit vulnerabilities in Prisma CLI's dev-tooling tree"): check `npm info prisma version` for
  a patched `7.x` or a stabilized (non-`-rc`) `8.0`; bump with `--save-exact` (keeping
  `prisma`/`@prisma/client`/`@prisma/adapter-pg` in lockstep) only if one exists and
  `npm audit` confirms the `mysql2`/`deepmerge-ts` advisories are actually gone afterward.

Low priority — skip either or both without blocking this task if nothing's changed; just don't
forget to check, and update both `memory/technical-debt.md` entries either way (a "still open,
re-checked" note is itself real due diligence, not a no-op).

## Relevant ADRs
ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — the diagnostic is a custom,
data-driven module in the same PostgreSQL database as the rest of the app; this task is the
scoring algorithm half of that decision (T3.1 built the data half) — the algorithm itself is
owned code, but every number it operates on (weights, thresholds) must come from the database,
never be hard-coded.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "User flow" step 4 (overall score across
4–5 dimensions, 2–3 weakest dimensions, an indicative cost statement) and the "Edge cases"
section (the no-active-questions dimension case) define this function's exact output shape and
failure mode.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own; it is the `lib/` function
`/diagnostic/results` (T3.6) will render output from, one step removed via T3.5's route.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface this task owns)
- Responsive is built in from a component's first implementation. (not applicable)
- Feature docs are the data/interface contract. (applies — the output shape
  `{score, dimension_scores, weakest_dimensions, indicative_cost_statement}` is fixed by the
  feature doc's Interfaces section; don't invent a different shape)
- Business logic lives in `lib/`, never inline in a route handler or component. (applies
  directly — this task's entire deliverable is a `lib/` function with zero route/component code)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — this function reads T3.1's fields as named,
  doesn't rename anything on read)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no fee
  data in this task's scope)
- Content the firm can change lives in the database, edited via `/admin`. (applies in spirit —
  the weights/thresholds this function reads are exactly that content, even though no admin
  screen exists yet to edit them)
- Diagnostic scoring configuration is data, not logic. (applies directly — ADR 0005's core
  rule; this task must read every number from the database, never hard-code one)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no UI surface)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no admin screen
  built yet)
- The shared generic `page` entity for marketing-page copy. (not applicable)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable to this task directly)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable to
  this task directly — `diagnostic_started`/`diagnostic_completed` fire from T3.4/T3.5's own
  client/route code, not from this pure function)

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
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
