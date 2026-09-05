# Session 19 — Diagnostic flow UI

# Date: 2026-09-05

# Tasks completed: T3.4 (plus two unrelated bug fixes caught along the way)

## What Was Built

The real `/diagnostic` multi-step client flow, reading T3.3's seeded question set live from
the database — one question per step, no full page reload, Back/Next gated on the current
question being answered, `diagnostic_started` fired on first interaction, and the complete
response set POSTed to `POST /api/diagnostic/submit` on the final step (T3.5, not yet built,
so this correctly 404s today and handles it as a graceful, retryable error). Also fixed two
pre-existing site-wide bugs caught while working in this area, at the user's prompting:
legal pages' header wrongly defaulting to the transparent/hero-page style, and the home
page's hard-coded "15–20 questions" fact instead of the real live count.

## Files Changed

- `app/diagnostic/page.tsx` — new. Server Component, `force-dynamic`, fetches the active
  question set + offer nav links, renders `DiagnosticFlow`.
- `components/diagnostic-flow.tsx` — new. The `"use client"` step-by-step flow.
- `lib/diagnostic-flow.ts` — new. Server-only: `getActiveDiagnosticFlow()` (the real question
  query) and `getActiveDiagnosticQuestionCount()` (a plain count, added for the home-page fix
  below).
- `lib/diagnostic-flow-options.ts` — new. Client-safe types + per-response-type option value
  tables (`DIAGNOSTIC_BOOLEAN_OPTIONS`/`DIAGNOSTIC_SCALE_OPTIONS`/`getChoiceOptions`) — kept
  separate from `lib/diagnostic-flow.ts` specifically to avoid pulling `@/lib/prisma` into the
  client bundle (see Decisions Made).
- `prisma/schema.prisma` — `DiagnosticResponse` doc-comment corrected (no per-step write path
  was actually built; comment only, no migration).
- `CLAUDE.md` — new Code Conventions rule capturing the Turbopack/client-bundle gotcha found
  this session, so it isn't rediscovered the same way on a later task.
- `app/legal/[slug]/page.tsx` — `hasHero={false}` added to its `SiteHeader` call (bug fix,
  unrelated to T3.4's own scope).
- `app/(public)/page.tsx` — reads `getActiveDiagnosticQuestionCount()` instead of a
  hard-coded `"15–20 questions"` fact (bug fix, unrelated to T3.4's own scope).
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/known-bugs.md` — updated per
  this session's work.

## Decisions Made

- **No client-side scoring** — the mockup's own `scoreAndFinish()` is a UI-prototype
  shortcut; the real score is always computed server-side by `lib/diagnostic-scoring.ts`
  (T3.2), called from T3.5's route (not yet built), never duplicated in this client component.
- **Found and fixed a real Turbopack bug**: a `"use client"` component importing a _value_
  (not just a type) from a `lib/` file that also imports `@/lib/prisma` silently breaks the
  dev compile — the affected route 500s with a misleading `ENOENT: ...build-manifest.json`
  error that never names the real cause. Fixed by splitting `lib/diagnostic-flow.ts`
  (server-only) from `lib/diagnostic-flow-options.ts` (client-safe). Full bisection in
  `memory/known-bugs.md`; the rule itself is now in CLAUDE.md so it isn't rediscovered later.
- **Mobile-safe option layout**: switched the mockup's flex-row option layout to CSS Grid
  (`grid-cols-5` scale, `grid-cols-2` boolean) — flex items don't shrink below their content's
  intrinsic width by default, which overflowed horizontally at 390px; Grid always divides the
  container's actual width evenly. Verified no horizontal scroll at 390px/768px/1280px.
- **Left-aligned text for `choice` options, centered for `scale`/`boolean`, radio beside the
  label (not stacked above it)** — matches the mockup's own CSS exactly
  (`.diag-options .opt-label` has no text-align override; `.diag-options.row`/`.diag-scale`
  both center). An earlier pass stacked the radio above the label while chasing the mobile
  fix, which wasn't the actual cause and just made options taller than the mockup — corrected
  once the real fix (flex→grid) was identified.
- **`/diagnostic/results?enquiry_id=<id>`** is this flow's chosen URL contract for T3.6 —
  neither the feature doc nor any task names an exact shape; T3.6 should read `enquiry_id`
  via `searchParams`.
- **No `page` row for `/diagnostic`** — no feature doc names a hero/marketing-copy entity for
  this route; `generateMetadata` uses plain hardcoded strings, same treatment as
  `HomePageContent`'s non-editable template chrome.
- **Every mention of the diagnostic's question count must read it live, never hard-code it**
  — the user caught a home-page fact (`"15–20 questions"`) that had drifted from a
  placeholder into stale, now-wrong copy once T3.3 seeded a real 15-question set; added
  `getActiveDiagnosticQuestionCount()` specifically so this and any future mention reads the
  same live number `/diagnostic` itself already did.
- **`app/legal/[slug]/page.tsx` was missing `hasHero={false}`** on its `SiteHeader` call —
  found by the user's own recollection of a mistake that "slipped by" several sessions after
  T2.7 first introduced it; fixed and verified visually.

## Current State

`/diagnostic`'s full question flow is live and exercised end-to-end for real (choice/scale/
boolean response types, Back/Next gating, answer preservation, mobile/tablet/desktop
responsiveness, graceful error handling on the still-missing submit route). T3.5 is the next
task — the actual `POST /api/diagnostic/submit` route this flow already calls.

## Blockers

None.

## Next Task

T3.5 — `POST /api/diagnostic/submit`
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.5 — `POST /api/diagnostic/submit`

## What to build
The endpoint per the documented contract, calling T3.2's scoring function and
creating the `enquiry_record` (score summary, weakest dimensions, triage flag, contact
details left null, traffic source/campaign/landing page captured from session).

## Input → Output contract
`{answers[]}` → `{score, dimension_scores, weakest_dimensions,
indicative_cost_statement, enquiry_id}`.

## Acceptance criteria
Rejects an incomplete response set with a validation error, not a
500; a double submission in one session creates two independent `enquiry_record`s (dedup
explicitly deferred to Phase 2 per the documented edge case, not attempted here); missing
campaign attribution stores null/direct rather than blocking submission.

## Size / Dependencies
M, depends on: T3.2 (`lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses` — this route's
only scoring logic; it already throws `DiagnosticValidationError` for an incomplete/malformed
response set and `DiagnosticConfigurationError` for a broken question-set configuration — this
route's whole job is calling it and mapping those two error types to the right HTTP response,
never re-implementing scoring itself), T3.1 (the `DiagnosticQuestion`/`DiagnosticResponse`/
`EnquiryRecord` tables this route writes into).

## Architecture constraints
- Business logic lives in `lib/`, never inline in a route handler — this route parses the
  request body, calls `lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses`, writes the
  `EnquiryRecord` + its `DiagnosticResponse` rows, and shapes the response; it does not
  reimplement scoring, threshold logic, or validation itself. Follow
  `app/api/contact/submit/route.ts`'s existing shape exactly (parse body → call a `lib/`
  function → map known error classes to HTTP status → return JSON) — it's this project's
  established precedent for exactly this kind of route.
- **Request body is a bare JSON array** of `{question_id, answer}` (feature doc's own
  Interfaces section: "request: array of `{question_id, answer}`"), not `{answers: [...]}` —
  `components/diagnostic-flow.tsx` (T3.4) already POSTs it this way; match that contract
  exactly rather than inventing a wrapped shape.
- **Every `DiagnosticResponse` row this route creates must be written together with the
  `EnquiryRecord` it belongs to, in one request** — not incrementally per step. This was
  T3.1's original assumption (since corrected in `prisma/schema.prisma`'s own doc-comment,
  T3.4) but was never actually built that way, and T3.4's real client flow only ever POSTs
  the complete set once, at the end. `enquiryId` on each `DiagnosticResponse` row should be
  set directly at creation (not left null and linked later) — nullability on that column is
  schema robustness, not a real incremental-write path.
- Catch `DiagnosticValidationError` (incomplete/malformed response set) → 400, matching
  `ContactValidationError`'s existing precedent in `lib/enquiries.ts`/`app/api/contact/
  submit/route.ts`. Catch `DiagnosticConfigurationError` (a dimension with no active
  questions — a data-authoring bug, not a visitor mistake) → log it, return a clean 500,
  never let it propagate as an uncaught exception (this is the documented edge case
  T3.2 already surfaces as a distinct, catchable error type specifically for this route to
  handle this way).
- `EnquiryRecord.contactConsent` is a required (non-nullable) boolean field
  (`prisma/schema.prisma`) — a diagnostic-originated enquiry has no consent yet (that's T3.7's
  job, at the gated-summary step), so this route must set it `false` explicitly, not omit it.
- `traffic_source`/`campaign`/`landing_page` are named in `business-health-check-
  diagnostic.md`'s Data requirements but were never modelled in `prisma/schema.prisma`
  (T2.6's own finding — `measurement-and-attribution.md` describes a separate `attribution`
  entity instead, not inline columns here, and that inconsistency was deliberately left for
  Milestone 5 to resolve). This task's own acceptance criterion ("missing campaign
  attribution stores null/direct rather than blocking submission") is satisfied by construction
  today — there's no column to populate at all yet — do not add one; that's out of this
  task's scope per T2.6's own decision.
- `EnquiryRecord.scoreSummary`/`weakestDimensions`/`triageFlag` already exist
  (`prisma/schema.prisma`, T3.1) specifically for this route to populate: `scoreSummary` as
  the scoring function's full result (`Json`), `weakestDimensions` as its
  `weakestDimensions` array, `triageFlag` as its `overallTriageFlag`.
- **Any page/route that reads live database content must export
  `export const dynamic = "force-dynamic"`** — applies to this route the same as every other
  (it's an API route handler, not a page, but the same reasoning applies: this must never be
  statically evaluated at build time).
- A double submission in one session must create two independent `enquiry_record`s (the
  documented edge case, deduplication explicitly deferred to Phase 2/FR-14.2) — do not add
  any dedup/idempotency logic here.

## Relevant ADRs
ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — this route is the API-layer
half of the diagnostic's data-driven design: it calls the scoring engine and writes the
resulting enquiry record as an ordinary database write, no cross-system integration.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "Interfaces" section (this route's exact
request/response contract) and "Edge cases" section (incomplete response set, double
submission, missing campaign attribution, the no-active-questions configuration error) define
this task's acceptance criteria directly.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own; T3.4 (already built) is the client
that calls this route, and T3.6 is the screen that will render its response.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface this task owns)
- Responsive is built in from a component's first implementation. (not applicable)
- Feature docs are the data/interface contract. (applies directly — the exact request/response
  shape is fixed by the feature doc's Interfaces section; don't invent a different shape)
- Business logic lives in `lib/`, never inline in a route handler or component. (applies
  directly — see architecture constraints above)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — write `EnquiryRecord`/`DiagnosticResponse`
  fields exactly as T3.1 named them)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable)
- Content the firm can change lives in the database, edited via `/admin`. (not applicable to
  this task directly — this route reads the same live question/dimension/threshold data T3.2
  already established, doesn't introduce new admin-editable content)
- Diagnostic scoring configuration is data, not logic. (applies in spirit — this route never
  duplicates or second-guesses `lib/diagnostic-scoring.ts`'s own reading of that data)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no UI surface)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable — this is an API route, not a page)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable
  to this task directly — `diagnostic_started` already fires from T3.4's client code;
  `diagnostic_completed` is T3.6's job on the results page, not this route's)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.6 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
