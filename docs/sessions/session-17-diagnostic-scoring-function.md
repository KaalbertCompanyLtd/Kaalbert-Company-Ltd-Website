# Session 17 — Diagnostic scoring function

# Date: 2026-09-05

# Tasks completed: T3.2

## What Was Built

`lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses` — the pure scoring function that
turns a diagnostic response set into `{score, dimensionScores, weakestDimensions,
indicativeCostStatement, overallTriageFlag}`, reading every `DiagnosticDimension.weight` and
`DiagnosticThreshold` row fresh from the database on each call (ADR 0005). Also scaffolded
Vitest (no test runner existed anywhere in the repo before this task) and wrote six unit
tests covering the acceptance criteria exactly: full-marks, zero-marks, one dimension
tripping its threshold while another doesn't, the no-active-questions configuration error
(caught and logged, never an uncaught exception), a missing answer, and an out-of-range
answer.

## Files Changed

- `lib/diagnostic-scoring.ts` — new. `scoreDiagnosticResponses`, `DiagnosticValidationError`,
  `DiagnosticConfigurationError`, and the scoring algorithm (see Decisions Made below).
- `lib/diagnostic-scoring.test.ts` — new. 6 unit tests, mocking `@/lib/prisma`.
- `vitest.config.mts` — new. `jsdom` default environment, `@/*` alias matching
  `tsconfig.json`.
- `package.json` / `package-lock.json` — added `"test": "vitest run"` script; new
  devDependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`;
  `@types/node` bumped `^20` → `^22` (see Decisions Made).
- `prisma/schema.prisma` — corrected `DiagnosticResponse.answerValue`'s doc-comment to
  describe the actual normalized-0–1 convention decided this session (no field or migration
  change — comment only).
- `docs/tasks/03-diagnostic.md` — added a session-17 addendum to T3.7, re-sequencing the two
  package.json-dependent debt items below onto it (see below).
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — updated
  per this session's work (see Decisions Made).

## Decisions Made

- **Every submitted answer is a numeric string pre-normalized to 0–1, uniformly across
  `scale`/`boolean`/`choice`.** `prisma/schema.prisma`'s `DiagnosticResponse` doc-comment
  (written at T3.1) claimed the scoring function would interpret "a scale number, a boolean,
  or a choice label" differently per `responseType` — but `diagnostic_question` has no
  column storing a choice option's label-to-value mapping. Resolved by following the
  accepted mockup exactly (`ui/mockups/c-diagnostic/diagnostic-flow.html`'s
  `scoreAndFinish`/`option()`, which stores `parseFloat(inp.value)` uniformly regardless of
  `q.type`): every answer arrives already resolved to 0–1 by the client (T3.4), so
  `responseType` only drives which input widget renders, never how T3.2 interprets the
  result. Corrected the stale doc-comment to match. Full reasoning in
  `memory/decision-log.md`.
- Threshold "trips" when a score falls strictly below its `thresholdValue`; when several
  thresholds could apply, the tightest-fitting band (smallest `thresholdValue` still above
  the score) wins.
- `weakestDimensions` returns every triage-flagged dimension (max 3), falling back to the
  lowest-scoring 2 when fewer than 2 are flagged — always 2–3 names, per the feature doc.
- `indicativeCostStatement` makes no fabricated numeric cost claim (no real firm-supplied
  cost figure exists anywhere in this schema) — it states the real computed score, the
  breached threshold's own `triagePriorityLevel` text when one was breached, and the real
  weakest-dimension names, never branching code logic on a specific dimension name.
- `@types/node` bumped `^20` → `^22` to resolve a real peer-dependency conflict
  (`vitest@5`/`@testing-library/jest-dom@7` require `@types/node@^22 || >=24`) and to
  correct a pre-existing mismatch against `engines.node: ">=22"` (the actual dev runtime is
  v22.15.0). Verified `npm run typecheck` still passes clean after the bump.
- Re-checked (did not resolve) two low-priority `package.json` debt items sequenced into
  this task: ESLint 9→10 (still blocked on the same `eslint-plugin-react@7.37.5` crash found
  at T1.4 — unchanged) and the Prisma CLI npm-audit vulnerabilities (still no stable release
  beyond the pinned `7.10.0`). Re-sequenced both into T3.7 (the next task expected to add a
  real new dependency — its transactional-email utility), with a new addendum added to
  T3.7's entry in `docs/tasks/03-diagnostic.md` per CLAUDE.md's sequencing rule.

## Current State

The diagnostic's scoring engine is fully built and unit-tested against T3.1's schema, ready
for T3.3 to seed real question/dimension/threshold data and T3.5 to call this function from
a real route. No route or UI surface exists yet — Playwright MCP verification doesn't apply
to this task.

## Blockers

None.

## Next Task

T3.3 — Diagnostic question-set seed
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.3 — Diagnostic question-set seed

## What to build
Seed script populating `diagnostic_question`/`diagnostic_dimension`/
`diagnostic_threshold` with the illustrative 15–20 question set already present in
`ui/mockups/`'s diagnostic flow, flagged as pending firm review/replacement — not fabricated
fresh, and not silently presented as final.

## Input → Output contract
Mockup's illustrative question content → seeded config rows.

## Acceptance criteria
Seeded set completes in a realistic timed walkthrough under 6
minutes (Section 6's target); every question is tagged `is_placeholder: true` in the seed
comment so Milestone 7's config admin and `docs/dashboard.md` both surface it as pending.

## Size / Dependencies
S, depends on: T3.1 (the `DiagnosticDimension`/`DiagnosticQuestion`/`DiagnosticThreshold`
tables this script writes into — already migrated on the dev database, empty of data;
`DiagnosticQuestion.dimensionId` is a real FK with `active`/`order` fields,
`DiagnosticThreshold.dimensionId` is nullable to mean "or overall" — see prisma/schema.prisma's
doc-comments for the full field-by-field reasoning).

## Architecture constraints
- Follow the seed-script convention already established in `prisma/seed.ts` (T1.2 baseline,
  see its own top-of-file doc-comment): one `seed<Area>()` function (e.g.
  `seedDiagnosticConfig()`) called from `main()` in dependency order; every write is an
  idempotent `upsert` keyed on a stable natural key (e.g. dimension name, or
  `[dimensionId, order]` per `DiagnosticQuestion`'s own `@@unique`), never a bare `create`, so
  re-running the seed script never throws or duplicates rows.
- `DiagnosticQuestion` has no `active` default beyond the schema's own `@default(true)` — seed
  every question as active unless there's a specific reason not to (there isn't, for a launch
  question set).
- Every answer this question set's real content ultimately produces must be a numeric string
  pre-normalized to 0–1, uniformly across `scale`/`boolean`/`choice` — decided at T3.2
  (`lib/diagnostic-scoring.ts`), mirroring the mockup's own client-side value resolution
  (`ui/mockups/c-diagnostic/diagnostic-flow.html`'s `option()`/`renderStep()`: a boolean's
  Yes/No is `1`/`0`, a scale's 1–5 rating is `v / 5`, a choice option carries its own
  pre-authored 0–1 value). This task doesn't submit answers itself, but the question set it
  seeds must be structured so that whichever choice options T3.4's client authors for a
  `choice`-type question carry values in that same 0–1 convention — `DiagnosticQuestion` has no
  column to store those per-option values, so document each choice question's intended option
  set and values directly in this seed script's own comments (the same place T3.4 will need to
  read them from) rather than leaving that mapping undiscoverable.
- Diagnostic scoring configuration (questions, dimensions, weights, thresholds) is data, not
  logic (FR-2.2, ADR 0005) — seed real, considered weight/threshold values (not placeholder
  zeros), even though the question wording itself is flagged `is_placeholder: true`.
- Do not fabricate legal text, diagnostic question wording, or any firm-supplied content —
  this task's own question wording is explicitly the mockup's illustrative set, not fabricated
  fresh, and must be flagged `is_placeholder: true` per `docs/tasks/02-public-presentation.md`
  T2.9's established convention ("a is_placeholder convention ... so Milestone 7's admin UI and
  docs/dashboard.md can both surface what's still pending real content").
- Content the firm can change lives in the database, edited via `/admin` — this question set is
  exactly that content, even though no admin screen exists yet to edit it (Milestone 7).

## Relevant ADRs
ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — the diagnostic's data model must
support more dimensions/questions than the launch configuration ships with, so seeding this
illustrative set must exercise the schema as real data (not a special-cased fixture), proving
by construction that T3.1's schema holds it correctly.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "User flow" step 2 (15–20 questions
covering structure, records, cash, controls, funding readiness, owner dependence) and the
Business rules section's "Completion target: under 6 minutes for 15–20 questions" define this
task's real content shape and its own acceptance criterion.

## Mockup / UI reference
`ui/mockups/c-diagnostic/diagnostic-flow.html` — its own inline `QUESTIONS` array (15
questions across 5 dimensions: Structure, Records, Cash Control, Funding Readiness, Owner
Dependence) is this task's real content source, already marked in that file's own comment as
"Illustrative question set — real wording, scoring and result copy are reserved to firm
authorship."

## Coding standards
- The mockups are authoritative for UI tasks. (applies in spirit — this task's content source
  is a mockup, even though this task itself has no UI surface)
- Responsive is built in from a component's first implementation. (not applicable — no UI
  surface this task owns)
- Feature docs are the data/interface contract. (applies — seed exactly the fields
  `docs/features/business-health-check-diagnostic.md`'s Data requirements section names)
- Business logic lives in `lib/`, never inline in a route handler or component. (not
  applicable — this task is a seed script, not business logic)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — seed using T3.1's already-established field
  names, don't rename anything)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no fee
  data in this task's scope)
- Content the firm can change lives in the database, edited via `/admin`. (applies — this
  question set is exactly that content, flagged pending real authorship)
- Diagnostic scoring configuration is data, not logic. (applies directly — every
  weight/threshold value seeded here is real configuration data T3.2's function will read)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no UI surface)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable
  to this task directly)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
