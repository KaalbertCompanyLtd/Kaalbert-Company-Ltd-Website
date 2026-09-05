# Session 21 — Diagnostic results screen

# Date: 2026-09-05

# Tasks completed: T3.6

## What Was Built

`/diagnostic/results`, reading `?enquiry_id=` and displaying T3.5's already-computed,
already-stored diagnostic result — score, per-dimension breakdown with weakest dimensions
highlighted, the real indicative cost statement, and FR-2.8's exact verbatim disclaimer.
Deliberately excludes the mockup's gated-summary-request panel (T3.7's own scope) and its
fabricated score-band labels (flagged placeholder content in the mockup itself).

## Files Changed

- `app/diagnostic/results/page.tsx` — new. Reads `searchParams.enquiry_id`, `notFound()` if
  missing/invalid/non-diagnostic, `robots: {index:false, follow:false}`.
- `components/diagnostic-completed-event.tsx` — new. Fires `diagnostic_completed` once on
  page load — the first "fire on load" `dataLayer` pattern in this codebase.
- `lib/diagnostic-submit.ts` — `getDiagnosticResultByEnquiryId` added (reads
  `EnquiryRecord.scoreSummary` back as `DiagnosticScoringResult`, never recomputes).
- `memory/completed-work.md`, `memory/decision-log.md` — updated per this session's work.

## Decisions Made

- **Never recompute a score** — this page only ever reads T3.5's already-stored
  `scoreSummary`.
- **FR-2.8's requirements-doc wording is authoritative, not the mockup's own paraphrase** —
  the two differ; rendered FR-2.8's exact sentence.
- **The mockup's score-band labels/statements are not built** (explicitly flagged placeholder
  content in the mockup's own comment) — the real `indicativeCostStatement` fills that
  position instead.
- **This task does not build the gated-summary-request panel** — that's T3.7's own scope in
  full, not just its endpoint.
- Full reasoning and real verification detail (strong/weak profiles, 404 cases,
  `diagnostic_completed` firing, responsive check) is in `memory/decision-log.md`.

## Current State

The diagnostic's entire public-facing flow — question set (T3.3), client flow (T3.4), submit
(T3.5), result display (T3.6) — is built and proven end to end for real. T3.7 (the gated
summary-request step) is the last task in this epic.

## Blockers

None.

## Next Task

T3.7 — Gated summary request
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.7 — Gated summary request

## What to build
The "fuller written summary by email" offer on the results screen, and
`POST /api/diagnostic/request-summary`, with contact consent and marketing consent as two
separate, unticked-by-default checkboxes (FR-6.2 — never bundled).

## Input → Output contract
`{enquiry_id, name, email, phone?, contact_consent, marketing_consent}`
→ transactional email sent, `enquiry_record` updated with contact details, `summary_requested`
event fired.

## Acceptance criteria
Both consent checkboxes are independently toggleable and both default
unticked; submitting without contact_consent is rejected; the resulting email is received and
matches the on-screen result data; the `enquiry_record` created in T3.5 is updated in place,
not duplicated.

## Size / Dependencies
M, depends on: T3.6 (`/diagnostic/results`, already built — this task adds a panel to that
same page, doesn't replace anything on it), T1.6 (transactional email capability — see the
note below; this task builds the actual send mechanism, T1.6 only stubbed the GTM/dataLayer
side of measurement).

## IMPORTANT — an open decision this task must make, likely needing the user's go-ahead
No transactional email provider has been chosen anywhere in this project yet (checked: no
`docs/research/*.md` file covers it, no library is installed, `CLAUDE.local.md`'s secrets
list has no email-provider API key placeholder). This task's own note in the epic file says
its email-send utility is a cross-cutting capability also needed by Milestone 4 (subscriber
confirmation) and Milestone 8 (enquiry notifications) — build it once, here, as this feature's
first consumer. Before writing real send code:
1. Research and pick a provider the way this project's other infrastructure choices were made
   (a `docs/research/*.md` file with live pricing/API comparison, matching the pattern
   already used for hosting/DB/CDN/styling — see `docs/research/` for the existing examples
   to follow) — candidates to compare might include Resend, Postmark, AWS SES, or another
   transactional-email API, evaluated against this project's actual needs (low volume at
   launch, a Next.js/Node-friendly SDK, reasonable free tier).
2. **Provisioning a real account and API key is very likely a user-triggered action, not
   something to do unilaterally** — creating an external account, agreeing to a provider's
   terms, and/or entering payment details is exactly the category of action CLAUDE.md's
   operating rules and this project's own `Trigger type: User-triggered` convention (see
   `memory/technical-debt.md`'s formatting rules) reserve for the user. If a real account
   doesn't already exist, stop and ask the user to create one (or say which provider they
   already use) rather than assuming or fabricating credentials — do not silently skip this
   and stub the send either; surface it explicitly.
3. Once a provider is chosen and real credentials exist (in `.env.local`, never committed —
   see `CLAUDE.local.md`'s secrets convention), build the actual send utility in `lib/`
   (e.g. `lib/email.ts`), reusable by this task and later by Milestone 4/8 without
   re-implementing it.
This is genuinely this task's own first decision to make — do not treat it as already solved
or skip straight to writing `POST /api/diagnostic/request-summary` without it.

## Architecture constraints
- Business logic lives in `lib/`, never inline in a route handler or component — the route
  parses the request body, calls a `lib/` function that validates consent, updates the
  existing `EnquiryRecord` (found by `enquiry_id`), sends the email via the new email
  utility, and shapes the response. Follow `app/api/contact/submit/route.ts`'s /
  `lib/enquiries.ts`'s established shape (parse → call `lib/` function → map a validation
  error class to 400 → return JSON).
- **Update the existing `EnquiryRecord` in place — never create a new one.** `enquiry_id` in
  the request body identifies the row T3.5 already created; this task's whole job is filling
  in `name`/`email`/`phone`/`contactConsent`/`marketingConsent` on that same row (all four
  were relaxed to nullable at T3.5 specifically so they could start empty and be filled in
  here). Use `prisma.enquiryRecord.update({ where: { id: enquiry_id }, data: {...} })`, not
  `create`. Reject if `enquiry_id` doesn't resolve to a real row, or resolves to one that
  already has contact details (the documented edge case — deduplication is Phase 2 scope
  elsewhere, but this specific endpoint updating the same row twice is a different, real
  concern worth deciding: does a second request-summary call for the same `enquiry_id`
  overwrite the first, or reject? Neither is specified by this task's own acceptance
  criteria — make a reasoned call and document it).
- **Contact consent and marketing consent are two separate, independently-toggleable
  checkboxes, both unticked by default (FR-6.2)** — never bundled into one checkbox or one
  boolean. Follow `components/contact-form.tsx`'s existing two-checkbox pattern exactly (it
  already implements this same rule for `/contact`'s own form) — same `Checkbox`/`FieldLabel`
  components, same client-side pre-submit guard rejecting a missing `contact_consent` before
  any request is even sent.
- **The email sent must match the on-screen result data** (this task's own acceptance
  criterion) — pull the same stored `scoreSummary` this task's route reads from the
  `EnquiryRecord` (via T3.6's own `getDiagnosticResultByEnquiryId`, or a shared resolver) to
  compose the email body, rather than a second, independently-drifting copy of the result.
- Fire `summary_requested` via `lib/data-layer.ts`'s `pushDataLayerEvent` on the client, the
  same established pattern as `diagnostic_started`/`enquiry_submitted`.
- **Any page/route that reads live database content must export
  `export const dynamic = "force-dynamic"`** — applies to the route handler here.
- Do not hard-code a measurement/advertising tag outside GTM — the email send itself is not a
  GTM concern, but this task's own `summary_requested` event must still go through the
  existing `dataLayer` pattern, never a separate tracking mechanism.

## Relevant ADRs
No dedicated ADR exists yet for the transactional email provider choice — if this task's own
research (see the open decision above) settles on one, consider whether that choice is
significant enough to warrant a new ADR (this project's pattern: ADR 0002–0010 each record
one real infrastructure/stack decision with sourced reasoning) — a judgment call for whoever
builds this, not mandated here.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "User flow" step 5 (the fuller written
summary offer, contact details, separate explicit marketing consent) and step 6 (the visitor
receives the full summary; the firm receives the complete response set, contact details, and
a triage flag) and the Interfaces section (this exact request/response contract) define this
task's scope directly.

## Mockup / UI reference
`ui/mockups/c-diagnostic/diagnostic-results.html`'s own `.summary-panel` section (name/email/
phone fields, two consent checkboxes, "Email my full summary" submit button) — the section
T3.6 deliberately left out of its own build. Build this panel directly onto the existing
`/diagnostic/results` page (`app/diagnostic/results/page.tsx`), in the gap T3.6 left for it,
not as a separate route.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — build the `.summary-panel` section
  to its mockup exactly)
- Responsive is built in from a component's first implementation. (applies — verify mobile/
  tablet/desktop, same as every other UI surface in this epic)
- Feature docs are the data/interface contract. (applies directly — the exact request/response
  shape is fixed)
- Business logic lives in `lib/`, never inline in a route handler or component. (applies
  directly — see architecture constraints above)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — write to `EnquiryRecord`'s existing fields,
  don't rename or reshape)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable)
- Content the firm can change lives in the database, edited via `/admin`. (not applicable to
  this task directly)
- Diagnostic scoring configuration is data, not logic. (not applicable — this task doesn't
  touch scoring)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies — use `Checkbox`/`Field`/
  `FieldLabel` for the consent checkboxes and form fields, same as `contact-form.tsx`)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable — this task adds a panel to an existing page, doesn't create a new route)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (applies
  directly — `summary_requested`, see architecture constraints above)

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
[ ] memory/technical-debt.md updated (if applicable — also re-check the two low-priority
    items already sequenced into this task: "ESLint pinned to the EOL 9.x line" and "4
    high-severity npm audit vulnerabilities in Prisma CLI's dev-tooling tree," since this
    task is very likely the next real `package.json` dependency addition, per
    `memory/technical-debt.md`'s own notes)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section). This is the last task in Milestone 3
(the diagnostic epic) — the next task belongs to a different epic (Milestone 4, Insights, or
whichever milestone the user directs next); name the specific next task only once that
direction is confirmed, rather than guessing. Do not begin the next task in this same session.
```
