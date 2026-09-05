# Feature: Business Health Check Diagnostic

Phase 1. The site's single most important conversion asset (Document 13.03).

## Goal

Give a founder who is not yet ready to talk to a partner a genuinely useful, free
assessment of their business in under six minutes, so the firm sends fewer and better
enquiries and the partner opening one already knows the business's shape (`vision.md`;
Document 13.03, Section 6).

## User flow

1. Visitor lands on `/diagnostic` (directly, or from Home, an offer page, an Insights
   article, or a landing page).
2. Visitor answers 15–20 questions, one step at a time, in plain business language, covering
   structure, records, cash, controls, funding readiness, and owner dependence. No full page
   reload between steps.
3. On the final step, the client submits the complete response set to the API.
4. The score is computed server-side and the visitor is redirected to `/diagnostic/results`,
   seeing immediately: an overall score across four or five dimensions, the two or three
   weakest dimensions, and an indicative statement of what that typically costs a business of
   similar shape. No contact details have been requested yet.
5. The visitor is offered a fuller written summary by email. If they accept, they provide
   contact details and explicit, separate marketing consent (unticked by default).
6. The visitor receives the full summary by email. The firm receives the complete response
   set, the visitor's contact details, the traffic source/campaign/landing page that produced
   the session, and a triage flag.

## Business rules

- Completion target: under 6 minutes for 15–20 questions (Document 13.03, Section 6).
- The on-screen result (step 4) must never require contact details — value is delivered
  before any ask, per the diagnostic's stated constraint.
- Marketing consent (step 5) is a separate, unticked checkbox from consent to be contacted
  about this specific enquiry — never bundled (FR-6.2).
- Questions, dimensions, weights, and triage thresholds are configuration data, not
  hard-coded logic (FR-2.2) — an admin with the right role can adjust them without a
  deployment, though only the build team adjusts scoring logic itself per FR-8's scope.
- The result screen must carry the disclaimer verbatim: an indicative self-assessment based
  on user-supplied information, not a professional opinion, not to be relied upon by any
  third party (FR-2.8).
- A completed diagnostic is evaluated against defined thresholds and flagged for triage
  (FR-2.6) — a business with no management accounts and an imminent facility application is
  a different priority from a curious visitor.
- The scoring engine's data model must support more dimensions/questions than the launch
  configuration ships with, so `scope.md`'s P2-7 is a configuration change later, not a
  rebuild (ADR 0005).

## Data requirements

- `diagnostic_question` — id, prompt text, dimension, order, response type (scale/boolean/
  choice), active flag.
- `diagnostic_dimension` — id, name, weight.
- `diagnostic_threshold` — id, dimension or overall, threshold value, triage priority level.
- `diagnostic_response` — id, session id, question id, answer value, timestamp.
- `enquiry_record` — id, diagnostic_response set (relation), score summary, weakest
  dimensions, triage flag, contact details (nullable until step 5), marketing consent
  boolean, contact consent boolean, traffic source, campaign, landing page, created_at.
  `message` (text) was added at T2.6 (`contact-and-enquiry.md`) for that feature's own
  free-text form body — null for a diagnostic-originated enquiry. `traffic_source`/
  `campaign`/`landing_page` are not yet modelled in `prisma/schema.prisma`: T2.6 found this
  list disagrees with `measurement-and-attribution.md`'s own `attribution` entity (a separate
  table with a foreign key, not inline columns here) and left resolving that inconsistency to
  whichever task actually builds attribution (Milestone 5) — see `memory/decision-log.md`.

## Interfaces

- `POST /api/diagnostic/submit` — request: array of `{question_id, answer}`; response:
  `{score, dimension_scores, weakest_dimensions, indicative_cost_statement, enquiry_id}`.
- `POST /api/diagnostic/request-summary` — request: `{enquiry_id, name, email, phone?,
contact_consent, marketing_consent}`; response: `{status}`. Triggers the transactional
  email and the `summary_requested` measurement event.
- Screens: `/diagnostic` (multi-step client flow), `/diagnostic/results` (result display).

## Edge cases

- Visitor abandons mid-flow: no `enquiry_record` created; `diagnostic_started` event already
  fired, so partial-completion drop-off is visible in analytics even without a submission.
- Visitor submits an incomplete response set: API rejects with a validation error; the client
  UI should not allow reaching the submit step with unanswered required questions.
- Visitor completes the diagnostic twice in one session: each submission creates its own
  `enquiry_record`; deduplication is explicitly deferred to Phase 2 (FR-14.2, CRM sync) and
  not attempted at launch.
- Campaign attribution missing (organic/direct visitor): `traffic_source` fields are stored
  as null/direct rather than blocking submission.
- Result computation encounters a dimension with no active questions (a configuration error):
  the API returns a 500 and logs it; this must be caught in the admin's configuration
  validation before publishing question-set changes, not surfaced to a visitor mid-flow.
