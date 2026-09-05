# Session 20 — Diagnostic submit endpoint

# Date: 2026-09-05

# Tasks completed: T3.5

## What Was Built

`POST /api/diagnostic/submit` — the real endpoint T3.4's client flow already calls. Parses
the bare-array request body, calls a new `lib/diagnostic-submit.ts` (which calls T3.2's
`scoreDiagnosticResponses`, then creates the `enquiry_record` together with every
`diagnostic_response` row in one write), and shapes the documented snake_case JSON response.
Hit and resolved a real schema blocker: `EnquiryRecord.name`/`email`/`message`/`contactConsent`
were non-nullable (fine for `/contact`'s own contract, wrong for a diagnostic submission that
has none of them yet) — migrated all four to nullable, kept `/contact`'s own required-field
enforcement at the application layer, confirmed unchanged via a real smoke test.

## Files Changed

- `app/api/diagnostic/submit/route.ts` — new. Parses body, calls the lib function, maps
  `DiagnosticValidationError` → 400 / `DiagnosticConfigurationError` → 500, shapes response.
- `lib/diagnostic-submit.ts` — new. `submitDiagnosticResponses()` — the actual scoring +
  `EnquiryRecord`/`DiagnosticResponse` write.
- `lib/diagnostic-submit.test.ts` — new. 2 Vitest tests (mocking `@/lib/prisma` and
  `@/lib/diagnostic-scoring`).
- `prisma/schema.prisma` — `EnquiryRecord.name`/`email`/`message`/`contactConsent` relaxed to
  nullable; doc-comment corrected to explain why.
- `prisma/migrations/20260905231926_relax_enquiry_record_diagnostic_fields/` — new migration.
- `memory/completed-work.md`, `memory/decision-log.md` — updated per this session's work.

## Decisions Made

- **`EnquiryRecord.name`/`email`/`message`/`contactConsent` relaxed to nullable** (real
  migration) — T2.6 modelled them required for `/contact`'s own contract, but
  `business-health-check-diagnostic.md`'s own Data requirements list explicitly requires
  "contact details (nullable until step 5)." No placeholder/fabricated value was an
  acceptable alternative. `/contact`'s own required-field enforcement moved to the
  application layer (`lib/enquiries.ts`, already there) — confirmed unchanged via a real
  smoke test of both its success and rejection paths after the migration.
- **`DiagnosticResponse.sessionId`** gets one freshly generated `crypto.randomUUID()` per
  submission (no real visitor-session concept exists in this app's scope) — every row in one
  submission shares it, and each is linked directly to a real `enquiryId` at creation, not
  left null and connected later (matches T3.4's own correction to that model's doc-comment).
- Full reasoning and verification detail for both is in `memory/decision-log.md`.

## Current State

The diagnostic's full chain — T3.1 schema, T3.2 scoring, T3.3 seed data, T3.4 client flow,
T3.5 submit endpoint — is now built and proven to work end to end for real: a real browser
walkthrough of all 15 questions via Playwright MCP completes, POSTs successfully, and
navigates to `/diagnostic/results?enquiry_id=<real id>` (404 only because T3.6, the results
screen itself, doesn't exist yet — that's the next task).

## Blockers

None.

## Next Task

T3.6 — `/diagnostic/results`
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.6 — `/diagnostic/results`

## What to build
Result screen to its mockup — overall score, 4–5 dimension breakdown, weakest 2–3
dimensions highlighted, indicative cost statement, the verbatim disclaimer (FR-2.8) — with
zero contact-detail fields on this screen (the on-screen result must never require them).

## Input → Output contract
`enquiry_id` (from T3.5's response) → rendered result screen.

## Acceptance criteria
Disclaimer text matches FR-2.8 verbatim; no form field on this screen
collects name/email/phone; screen renders correctly for both a strong and a weak score
profile (tested with two different seeded response sets).

## Size / Dependencies
M, depends on: T3.5 (`POST /api/diagnostic/submit` — already built and verified this session;
its response's `enquiry_id` is exactly what this screen's own URL carries, via the
`/diagnostic/results?enquiry_id=<id>` contract T3.4 already chose and calls
`router.push(...)` with — see `memory/decision-log.md`, T3.4), T1.5 (SiteHeader/SiteFooter
and the base page shell every public route builds on).

## Architecture constraints
- **Read the URL param via `searchParams`, not a dynamic route segment.** T3.4's client
  already navigates to `/diagnostic/results?enquiry_id=<id>` (a query param, not
  `/diagnostic/results/[id]`) — build `app/diagnostic/results/page.tsx` as a plain page
  reading `searchParams.enquiry_id`, not a `[id]` dynamic segment.
- **Read the stored result, don't recompute it.** `lib/diagnostic-submit.ts` (T3.5) already
  wrote the complete scoring result (score, per-dimension scores, weakest dimensions,
  indicative cost statement, overall triage flag) into `EnquiryRecord.scoreSummary` as `Json`,
  in exactly `lib/diagnostic-scoring.ts`'s `DiagnosticScoringResult` shape. This screen's job
  is to fetch that one `EnquiryRecord` by `id` and render its stored `scoreSummary` — it must
  never call `scoreDiagnosticResponses` itself or otherwise re-derive a score (that would be
  business logic duplicated outside `lib/`, and could disagree with what was actually stored
  and would be shown to a partner later in Milestone 8's enquiry management screen).
- **Missing/invalid `enquiry_id` is a real 404, not a silently-generated thin page** — matches
  `core-offer-pages.md`'s established precedent (`app/offers/[slug]/page.tsx`'s own
  `notFound()` call for an unknown slug). Call `notFound()` from `next/navigation` if the
  `enquiry_id` query param is missing, non-numeric, or doesn't match a real `EnquiryRecord`.
- **The disclaimer text is FR-2.8's own exact wording, not the mockup's paraphrase.** The
  mockup's own `.disclaimer-box` copy ("This is an indicative self-assessment based on
  information supplied by the user. It is not a professional opinion, and should not be
  relied upon by any third party.") is NOT the authoritative text — `docs/requirements.md`'s
  FR-2.8 states it slightly differently: "an indicative self-assessment based on
  user-supplied information, not a professional opinion, not to be relied upon by any third
  party." This task's own acceptance criterion says "matches FR-2.8 verbatim" — render
  `docs/requirements.md`'s FR-2.8 sentence exactly, character for character, not the
  mockup's own wording.
- **Do not fabricate the mockup's "score band" labels/statements.** The mockup's own inline
  script (`ui/mockups/c-diagnostic/diagnostic-results.html`) has a `BANDS` array with labels
  like "Strong Foundation" / "Developing, With Real Gaps" and matching prose statements per
  score threshold — that file's own comment already flags this content as "illustrative
  placeholder — reserved to firm authorship" (Document 13.03, Section 13), same as the
  question set (T3.3) and result copy generally. Do not invent or carry over these specific
  band labels/statements as if real. The real, already-computed content to show in that
  screen position instead is `scoreSummary.indicativeCostStatement` (T3.2's own output,
  already real, already stored, already threshold-driven) — use that, not fabricated band
  copy.
- **This task does NOT build the "Get the full written summary by email" panel** — that
  entire section (the mockup's `.summary-panel`, with its name/email/phone/consent fields) is
  T3.7's own scope ("Build: The 'fuller written summary by email' offer on the results
  screen, and `POST /api/diagnostic/request-summary`" — T3.7 builds the *offer itself*, not
  only its endpoint). Building any part of that panel here would both violate this task's own
  explicit "zero contact-detail fields on this screen" acceptance criterion and duplicate
  T3.7's work. Render score-hero + dimension breakdown + disclaimer + the mockup's
  `.next-step-panel` (secondary CTAs to `/contact` and `/our-method`, no form fields) and stop
  there — leave the gap where T3.7 will later insert its own panel.
- Business logic lives in `lib/`, never inline in a route handler or component beyond what's
  needed to call into `lib/` and render the result — add a small `getEnquiryDiagnosticResult`
  (or similar) resolver to a `lib/` file (e.g. `lib/diagnostic-submit.ts` alongside T3.5's own
  function, or a new file if that reads better) that fetches the `EnquiryRecord` by id and
  types/returns its `scoreSummary` as `DiagnosticScoringResult` — don't inline the Prisma call
  or the JSON-shape cast directly in `page.tsx`.
- **Any page/route that reads live database content must export
  `export const dynamic = "force-dynamic"`** — applies directly (this page reads a real
  `EnquiryRecord` row per request).
- Fire `diagnostic_completed` via `lib/data-layer.ts`'s `pushDataLayerEvent` on this page's
  own load — the feature doc's flow step 5 fires this event specifically when the visitor
  reaches this results screen (T3.4 deliberately did not fire it on submit; this screen is
  where it belongs). Since this is a Server Component, fire it from a small client-side
  effect (a tiny `"use client"` wrapper component, or inline in a client sub-component) —
  follow whatever pattern other pages in this codebase already use for a one-time
  page-load event, or add the smallest new one if none exists yet.
- Accessibility: WCAG 2.1 AA — the dimension breakdown bars are informational (like a
  progress bar), not interactive; no Base UI primitive is required for them specifically, but
  make sure score values are also conveyed as real text (already true in the mockup: the `%`
  number sits next to each bar), not color/bar-length alone.
- Responsive is built in from this component's first implementation — the mockup is
  desktop-only; verify mobile (~375–430px), tablet (~768px), and desktop (~1200px+) — the
  dimension bars/labels are the most likely element to need a narrow-width treatment.

## Relevant ADRs
ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — this screen is the final
display step of the diagnostic's data-driven design: it renders T3.2's already-computed,
already-stored result, never re-deriving it.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "User flow" step 4 (overall score, 2–3
weakest dimensions, indicative cost statement, no contact details) and its Business rules
("The on-screen result ... must never require contact details" and the FR-2.8 disclaimer
rule). `docs/requirements.md`'s FR-2.8 is the disclaimer's own authoritative source text (see
architecture constraints above — not the mockup's paraphrase).

## Mockup / UI reference
`ui/mockups/c-diagnostic/diagnostic-results.html` — the accepted wireframe: `.score-hero`
(kicker "Your result", large score number, band label, statement — see constraints above for
what real content replaces the band label/statement), `.dimension-panel` (one `.dim-row` per
dimension: name + score%, a track/fill bar, weakest dimensions marked), `.disclaimer-box`
(FR-2.8's verbatim text, not this file's own paraphrase), `.next-step-panel` (two secondary
CTA buttons). Its `.summary-panel` section is explicitly NOT this task's scope (see
constraints above — that's T3.7). Its `demo-banner`/`sessionStorage`-based demo-data fallback
is a mockup-prototyping device with no equivalent here — this is a real page reading a real
`enquiry_id`, so there is no "demo mode" to build.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — build to the file above, minus its
  `.summary-panel` section and its fabricated band-label copy, per the constraints above)
- Responsive is built in from a component's first implementation. (applies — see architecture
  constraints above)
- Feature docs are the data/interface contract. (applies — the Input→Output contract
  `enquiry_id → rendered result screen` is fixed; don't invent a different shape)
- Business logic lives in `lib/`, never inline in a route handler or component. (applies
  directly — see architecture constraints above)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies in spirit — this screen reads
  `EnquiryRecord.scoreSummary`/`weakestDimensions`/`triageFlag` as T3.1/T3.5 already shaped
  them, doesn't rename or reshape on read)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no fee
  data in this task's scope; do not add any real fee/cost figures to the indicative cost
  statement area, which already comes pre-written from T3.2)
- Content the firm can change lives in the database, edited via `/admin`. (applies in spirit —
  this screen's actual content is the stored `scoreSummary`, real data, not template copy)
- Diagnostic scoring configuration is data, not logic. (applies — this task doesn't touch
  scoring configuration at all, only displays an already-computed result)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies where relevant — see
  architecture constraints above; the dimension bars are informational, not interactive)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable — same reasoning
  as `/diagnostic` itself, T3.4: no feature doc names a hero/marketing-copy entity for this
  route, and its content is the real stored result, not editable marketing copy)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (applies
  — give this route real meta tags; consider whether a results page should even be indexable
  by search engines, given it's a personalized, non-shareable result — a `noindex` robots
  meta may be the right call here, similar reasoning to any per-visitor personalized page)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (applies directly
  — `diagnostic_completed` fires from this page's own load, see architecture constraints above)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.7 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
