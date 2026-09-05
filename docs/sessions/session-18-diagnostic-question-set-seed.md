# Session 18 — Diagnostic question-set seed

# Date: 2026-09-05

# Tasks completed: T3.3

## What Was Built

`prisma/seed.ts`'s `seedDiagnosticDimensions`/`seedDiagnosticQuestions`/
`seedDiagnosticThresholds`, populating the launch Business Health Check question set — 5
dimensions, 15 questions, 7 thresholds — carried over verbatim from the accepted mockup's own
illustrative content, flagged pending firm review. Verified end to end against the real dev
database: ran the seed twice (idempotency), queried the real rows and called T3.2's actual
`scoreDiagnosticResponses` against them (full-marks/zero-marks both correct), and drove the
real mockup HTML through all 15 questions via Playwright MCP to confirm no dead ends.

## Files Changed

- `prisma/seed.ts` — new `seedDiagnosticDimensions`, `seedDiagnosticQuestions`,
  `seedDiagnosticThresholds` functions, wired into `main()`.
- `docs/tasks/07-content-admin.md` — addendum to T7.7 flagging the `diagnostic_question`
  `is_placeholder` column gap (see below).
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — updated
  per this session's work.

## Decisions Made

- **Fixed-literal-`id` upsert for `DiagnosticDimension`/`DiagnosticThreshold`** (neither has a
  unique natural key beyond `id`), mirroring this file's existing singleton-row convention
  rather than adding `@unique` constraints (a schema change outside this seed-only task's
  scope). `DiagnosticQuestion` uses its real `[dimensionId, order]` unique key instead.
- **Dimension weights seeded equal (1 each)**; thresholds seeded as two overall bands
  (40 → "High", 70 → "Medium") plus one per-dimension band each (50 → "High") — a real,
  considered default, not placeholder zeros, generalizing the mockup's own hard-coded `< 75`
  weak-dimension cutoff into real per-dimension data.
- **Question wording/count/dimension grouping carried over verbatim** from the mockup, flagged
  `is_placeholder: true` only in the seed script's own comment — `diagnostic_question` has no
  real `is_placeholder` column (unlike every other content-bearing model in this schema).
  Logged as new technical debt, sequenced into T7.7 (the first task that builds a UI over this
  data and needs to actually surface pending-review status).
- Full reasoning for all of the above is in `memory/decision-log.md`.

## Current State

The diagnostic's full config chain — schema (T3.1), scoring (T3.2), seeded data (T3.3) — is
built, seeded, and proven to connect correctly end to end against the real dev database.
Ready for T3.4 to build the actual `/diagnostic` client flow against this real data.

## Blockers

None.

## Next Task

T3.4 — Diagnostic flow — `/diagnostic`
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.4 — Diagnostic flow — `/diagnostic`

## What to build
Multi-step client flow to `ui/mockups/a-public-site/diagnostic.html` (or the
specific diagnostic mockup file), one step per question, no full page reload, firing
`diagnostic_started` on first interaction (GTM stub from T1.6 — full event wiring completes
in Milestone 5, but the event fires from day one so drop-off is visible in analytics as soon
as measurement is switched on).

## Input → Output contract
Visitor answers → `POST /api/diagnostic/submit` on final step.

## Acceptance criteria
Flow matches the mockup's step-by-step interaction; the submit step
is unreachable with unanswered required questions (client-side); abandoning mid-flow creates
no `enquiry_record` (matches the documented edge case).

## Size / Dependencies
L, depends on: T3.2 (the scoring function this flow's final `POST /api/diagnostic/submit`
call will trigger server-side — not called directly by this task, T3.5 is that route), T3.3
(the real, seeded `DiagnosticDimension`/`DiagnosticQuestion` rows this flow renders — 5
dimensions, 15 questions, `scale`/`boolean`/`choice` response types, seeded this session and
verified against the real dev database), T1.5 (SiteHeader/SiteFooter and the base page shell
every public route already builds on).

## Architecture constraints
- This task's own note in `docs/tasks/03-diagnostic.md`'s heading says "the mockup file" —
  the real, exact file is `ui/mockups/c-diagnostic/diagnostic-flow.html` (confirmed via
  `ui/screen-inventory.md`'s own numbering: screen #11, "Diagnostic — question flow"). That
  mockup's own inline `QUESTIONS` array is exactly the seeded content from T3.3 — same 15
  questions, same 5 dimensions, same order — so this task's job is to build the real
  interactive component against real seeded data, not to re-derive question content.
- Business logic lives in `lib/`, never inline in a route handler or component — this task is
  the one explicit carve-out already flagged for it: the mockup's own client-side scoring
  preview (`scoreAndFinish()`) must NOT be ported into this flow's client code. The real score
  is always computed server-side by T3.2's `scoreDiagnosticResponses` (called from T3.5's
  route, not this task) — this task's client only collects answers and POSTs them on the
  final step.
- **Every answer this flow submits must be a numeric string pre-normalized to 0–1, uniformly
  across `scale`/`boolean`/`choice`** — decided at T3.2 (`lib/diagnostic-scoring.ts`),
  mirroring the mockup's own client-side value resolution exactly: a `boolean` question's
  Yes/No maps to `"1"`/`"0"`; a `scale` question's 1–5 rating maps to `v / 5` (`"0.2"` through
  `"1"`); a `choice` question's options map to the pre-authored values documented in
  `prisma/seed.ts`'s own comments next to each `choice`-type question (e.g. "Yes" → 1, "In
  progress" → 0.5, "Not yet" → 0 for question 1) — read those comments directly rather than
  inventing new option values, since T3.2's scoring function and this flow's submitted
  answers must agree on the same convention.
- Fetch the real active dimensions/questions from the database for this flow to render
  (`DiagnosticQuestion.active`, ordered by `DiagnosticQuestion.order` within
  `DiagnosticDimension`) — never hard-code the question list; T3.3 seeded it as real,
  admin-editable-in-spirit data specifically so this flow reads it live.
- **Any page/route that reads live database content must export
  `export const dynamic = "force-dynamic"`** — applies directly to `/diagnostic`'s own page
  (it loads the active question set from the database) per CLAUDE.md's Railway-build-failure
  note; the client-side step interaction itself still needs no full page reload between
  steps once that initial data is loaded.
- Fire `diagnostic_started` via `lib/data-layer.ts`'s `pushDataLayerEvent` (the established,
  single `dataLayer` mechanism, ADR 0006/CLAUDE.md's Recurring Patterns — already used by
  `/contact`'s `enquiry_submitted`/`whatsapp_opened`) on the visitor's first interaction with
  the flow (matches the documented edge case: "`diagnostic_started` event already fired, so
  partial-completion drop-off is visible in analytics even without a submission" — the event
  must fire before submission, not on it).
- **Public-site mobile navigation is a side-sliding drawer/sheet** — not directly this task's
  own surface, but if this flow renders `SiteHeader`/`SiteFooter` (per the mockup's own
  chrome), that existing nav pattern must be preserved unmodified, not reinvented for this
  page.
- Route location: there is deliberately no shared `(public)` route-group layout in this
  codebase (`app/(public)/` holds only the home page; every other public route —
  `app/contact/`, `app/about/`, `app/capabilities/`, ...— is a plain top-level directory,
  T2.1's established precedent, reconfirmed at every public-page task since). Build this at
  `app/diagnostic/page.tsx`, consistent with that existing pattern, not nested under
  `app/(public)/diagnostic/`.
- Accessibility: WCAG 2.1 AA (NFR-2) — this is "the most complex screen in the project" per
  `ui/screen-inventory.md` (#11's own note: "no-reload multi-step interaction"); use Base
  UI's primitives for the step transitions/radio-group-style option selection rather than
  hand-building ARIA/focus management for a custom widget.
- Responsive is built in from this component's first implementation — the mockup itself is a
  desktop-only wireframe; verify mobile (~375–430px), tablet (~768px), and desktop
  (~1200px+) before calling this done, per CLAUDE.md's Code Conventions (this is exactly the
  kind of complex interactive component that rule exists for).

## Relevant ADRs
- ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — the diagnostic is a custom,
  data-driven module in the same PostgreSQL database as the rest of the app; this flow is the
  client half of that decision, rendering T3.1/T3.3's real data with no full page reload.
- ADR 0006 — docs/adr/0006-gtm-measurement-container.md — every conversion event (including
  this flow's `diagnostic_started`) fires through hand-written `dataLayer` pushes into the
  single GTM container, never a separate/hard-coded measurement mechanism.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind v4 CSS-first + shadcn/ui
  on Base UI + Lucide icons is this flow's styling/component layer; Base UI's primitives are
  what make this screen's accessibility achievable without hand-building ARIA.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "User flow" steps 1–3 (landing on
`/diagnostic`, answering 15–20 questions one step at a time in plain business language, no
full page reload, submitting the complete response set on the final step) and the "Edge
cases" section (abandoning mid-flow creates no `enquiry_record`; an incomplete response set
must be client-side-unreachable at submit) define this task's exact scope and boundaries.

## Mockup / UI reference
`ui/mockups/c-diagnostic/diagnostic-flow.html` — the accepted, authoritative wireframe (progress
bar + label, one question per step, Back/Next navigation, `.diag-options`/`.diag-scale`
answer-option layouts per response type). Its own inline `QUESTIONS` array is exactly T3.3's
seeded content (same wording, same 5 dimensions, same 15 questions, same order) — build
against the real seeded rows, not a re-typed copy of this array.

## Coding standards
- The mockups are authoritative for UI tasks. (applies directly — build to
  `ui/mockups/c-diagnostic/diagnostic-flow.html`'s structure/copy/interaction)
- Responsive is built in from a component's first implementation, never a later pass.
  (applies — the mockup is desktop-only; verify mobile/tablet/desktop before calling this
  done, per the architecture constraint above)
- Feature docs are the data/interface contract. (applies — this flow's final `POST` shape is
  fixed by `docs/features/business-health-check-diagnostic.md`'s Interfaces section; don't
  invent a different request shape)
- Business logic lives in `lib/`, never inline in a route handler or component. (applies
  directly — no scoring logic in this flow's client code; that's T3.2/T3.5's job entirely)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies in spirit — this flow reads
  `DiagnosticQuestion`/`DiagnosticDimension` fields as T3.1 named them, doesn't rename
  anything on read)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no fee
  data in this task's scope)
- Content the firm can change lives in the database, edited via `/admin`. (applies — the
  question set this flow renders is exactly that content, read live from T3.3's seeded rows)
- Diagnostic scoring configuration is data, not logic. (applies — this flow reads
  `active`/`order`/`responseType` from the database, never hard-codes a question list)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies directly — see architecture
  constraints above)
- The "one nav entry, second screen via inline link" pattern. (not applicable — `/diagnostic`
  is reached from Home/offer pages/Insights articles/landing pages per the feature doc's own
  "User flow" step 1, not from a nested admin-style nav)
- The shared generic `page` entity for marketing-page copy. (not applicable — `/diagnostic`
  has no marketing hero copy of that shape; its own hero content is fixed template text per
  the mockup, same treatment as other non-`page`-entity screens)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (applies
  — `/diagnostic` is a public page type per `docs/features/seo-and-search-foundation.md`;
  give it real meta tags even though the mockup's own `<title>` is the only SEO text shown)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (applies
  directly — `diagnostic_started` via `lib/data-layer.ts`'s `pushDataLayerEvent`, see
  architecture constraints above)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.5 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
