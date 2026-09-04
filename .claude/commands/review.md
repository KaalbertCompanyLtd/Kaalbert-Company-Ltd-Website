---
description: Review the current changes against this project's conventions, quality gates, and documentation obligations
---

Review the uncommitted changes in this repository (or, if given an argument, the specific
task ID or file path named in `$ARGUMENTS`) against every item below. Report findings as a
concrete checklist — pass/fail per item, with file:line references for any failure — not a
prose summary.

## 1. Conventions from CLAUDE.md

- Business logic lives in `lib/`, not in route handlers or components beyond calling into
  `lib/` and rendering the result.
- No CMS/admin-kit/product-owned dependency was introduced (ADR 0001) — check any new
  package against that rule, not just the `no-restricted-imports` ESLint list, which only
  catches two named examples.
- Fee amounts are the structured min/max + currency + scope-cap shape, never a single field
  or free text.
- Firm-editable content (contact details, fee bands, page copy, response-time commitment)
  reads from the database, never hard-coded.
- Diagnostic question/dimension/weight/threshold changes are data edits; scoring algorithm
  changes are not — confirm which one this change actually is.
- Every entity field matches its name in the relevant `docs/features/*.md` "Data
  requirements" section exactly — flag any silent rename.
- New UI matches its cited mockup under `ui/mockups/`, or the inferred-from pattern named in
  its task file — flag any layout invented from scratch instead.
- WCAG 2.1 AA: interactive elements use Base UI primitives, not bare unstyled `<div>`s doing
  their own keyboard/focus handling.

## 2. Quality gates (must all exit 0 / pass)

- `npm run lint`
- `npm run format:check`
- `npx tsc --noEmit`
- `npm run test`
- Confirm lint passes across the **whole tree**, not only files this change touched.

## 3. Input validation and error handling

- Every API route validates its input shape before touching the database or calling `lib/`
  logic, and returns a clear 4xx on invalid input rather than a raw 500.
- Server-side validation exists for every rule the client UI also enforces (never
  client-only) — e.g. required-field checks, the fee-band/scope-cap pairing, consent
  checkboxes, capacity limits.
- Failure paths named in the relevant feature doc's "Edge cases" section are actually
  handled, not just the happy path.

## 4. Test coverage

- New/changed logic in `lib/` has a corresponding Vitest unit test.
- A new or changed page/flow/admin screen has (or already has, from an earlier task) a
  Playwright Test covering its golden path.
- Acceptance criteria listed in the relevant `docs/tasks/*.md` task are each covered by at
  least one test or an explicit manual-verification note in the session summary.

## 5. Logic placement in the correct architectural layer

- Scoring, auth/session checks, and measurement event construction live in `lib/`.
- Route handlers: validate → call `lib/` → shape response. Nothing more.
- Components render; they do not compute business results inline.

## 6. Documentation updates required (Knowledge Management Responsibilities)

- `memory/completed-work.md` updated for this task.
- `memory/decision-log.md` updated if any decision was made or deviated from the plan.
- `memory/architecture-decisions.md` updated if an architectural decision changed.
- `docs/architecture.md` updated if system architecture changed.
- The relevant `docs/features/*.md` updated if requirements evolved during implementation.
- `memory/technical-debt.md` updated if a shortcut or compromise was introduced (check
  specifically for the already-anticipated last-write-wins item once Articles/Pages editors
  are touched).
- `memory/known-bugs.md` updated if an unresolved issue remains.
- A new durable rule/gotcha discovered this session is captured in CLAUDE.md or MEMORY.md,
  per CLAUDE.md's "Capture durable rules the moment you meet them" section — not left only in
  conversation.

## 7. ADR and technical debt

- If this change makes an architectural decision, a new ADR file exists in `docs/adr/`
  following the existing numbering, and `memory/architecture-decisions.md` reflects it.
- If this change reverses a prior decision, confirm the Rollback/Revision Protocol was
  actually followed (superseding ADR, updated artifacts, `memory/decision-log.md` entry) —
  not just implemented silently.

Report every failing item explicitly. Do not mark the review complete if any hard gate (lint,
type-check, tests, or a missing required memory update) is failing.
