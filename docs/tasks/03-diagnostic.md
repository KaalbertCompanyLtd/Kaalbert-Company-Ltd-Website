# Epic: Business Health Check Diagnostic

Roadmap milestone 3. "The single most important conversion asset on the site" (Document
13.03) — fully public-facing, no admin dependency to be usable end to end for a real visitor.
Question/dimension/threshold config is seeded via migration with the illustrative set already
built into the mockups, clearly flagged for firm review; the admin screen to edit it without a
deployment (FR-2.2) comes later in Milestone 7, but nothing here waits on that screen to work.

---

### T3.1 — Scoring engine data model

**Build:** `diagnostic_question`, `diagnostic_dimension`, `diagnostic_threshold`,
`diagnostic_response` tables per `docs/features/business-health-check-diagnostic.md`, with
the data model supporting more dimensions/questions than launch config ships with (ADR 0005
— so P2-7's paid suite is a config change, not a rebuild).
**Input → Output:** Schema definition → migrated tables, empty of data.
**Acceptance criteria:** Schema supports adding a new dimension/question via data alone, no
code change (proven by inserting a test dimension in a throwaway script and confirming the
scoring function in T3.2 picks it up automatically).
**Size:** M **Dependencies:** T1.2

### T3.2 — Server-side scoring function

**Build:** Pure scoring function — response set → `{score, dimension_scores,
weakest_dimensions, indicative_cost_statement}` — computing against `diagnostic_dimension`
weights and `diagnostic_threshold` values.
**Input → Output:** Array of `{question_id, answer}` → the result shape above.
**Acceptance criteria:** Unit tests cover a full-marks response set, a zero-marks set, and a
set that trips a triage threshold on one dimension but not others; a dimension with no active
questions returns a caught, logged error, never an uncaught 500 reaching a visitor path
(matches the documented edge case).
**Size:** M **Dependencies:** T3.1

### T3.3 — Diagnostic question-set seed

**Build:** Seed script populating `diagnostic_question`/`diagnostic_dimension`/
`diagnostic_threshold` with the illustrative 15–20 question set already present in
`ui/mockups/`'s diagnostic flow, flagged as pending firm review/replacement — not fabricated
fresh, and not silently presented as final.
**Input → Output:** Mockup's illustrative question content → seeded config rows.
**Acceptance criteria:** Seeded set completes in a realistic timed walkthrough under 6
minutes (Section 6's target); every question is tagged `is_placeholder: true` in the seed
comment so Milestone 7's config admin and `docs/dashboard.md` both surface it as pending.
**Size:** S **Dependencies:** T3.1

### T3.4 — Diagnostic flow — `/diagnostic`

**Build:** Multi-step client flow to `ui/mockups/a-public-site/diagnostic.html` (or the
specific diagnostic mockup file), one step per question, no full page reload, firing
`diagnostic_started` on first interaction (GTM stub from T1.6 — full event wiring completes
in Milestone 5, but the event fires from day one so drop-off is visible in analytics as soon
as measurement is switched on).
**Input → Output:** Visitor answers → `POST /api/diagnostic/submit` on final step.
**Acceptance criteria:** Flow matches the mockup's step-by-step interaction; the submit step
is unreachable with unanswered required questions (client-side); abandoning mid-flow creates
no `enquiry_record` (matches the documented edge case).
**Size:** L **Dependencies:** T3.2, T3.3, T1.5

### T3.5 — `POST /api/diagnostic/submit`

**Build:** The endpoint per the documented contract, calling T3.2's scoring function and
creating the `enquiry_record` (score summary, weakest dimensions, triage flag, contact
details left null, traffic source/campaign/landing page captured from session).
**Input → Output:** `{answers[]}` → `{score, dimension_scores, weakest_dimensions,
indicative_cost_statement, enquiry_id}`.
**Acceptance criteria:** Rejects an incomplete response set with a validation error, not a
500; a double submission in one session creates two independent `enquiry_record`s (dedup
explicitly deferred to Phase 2 per the documented edge case, not attempted here); missing
campaign attribution stores null/direct rather than blocking submission.
**Size:** M **Dependencies:** T3.2, T3.1

### T3.6 — `/diagnostic/results`

**Build:** Result screen to its mockup — overall score, 4–5 dimension breakdown, weakest 2–3
dimensions highlighted, indicative cost statement, the verbatim disclaimer (FR-2.8) — with
zero contact-detail fields on this screen (the on-screen result must never require them).
**Input → Output:** `enquiry_id` (from T3.5's response) → rendered result screen.
**Acceptance criteria:** Disclaimer text matches FR-2.8 verbatim; no form field on this screen
collects name/email/phone; screen renders correctly for both a strong and a weak score
profile (tested with two different seeded response sets).
**Size:** M **Dependencies:** T3.5, T1.5

### T3.7 — Gated summary request

**Build:** The "fuller written summary by email" offer on the results screen, and
`POST /api/diagnostic/request-summary`, with contact consent and marketing consent as two
separate, unticked-by-default checkboxes (FR-6.2 — never bundled).
**Input → Output:** `{enquiry_id, name, email, phone?, contact_consent, marketing_consent}`
→ transactional email sent, `enquiry_record` updated with contact details, `summary_requested`
event fired.
**Acceptance criteria:** Both consent checkboxes are independently toggleable and both default
unticked; submitting without contact_consent is rejected; the resulting email is received and
matches the on-screen result data; the `enquiry_record` created in T3.5 is updated in place,
not duplicated.
**Size:** M **Dependencies:** T3.6, T1.6 (transactional email capability — see note below)

**Note:** Transactional email delivery (the actual send mechanism) is a cross-cutting
capability also needed by Milestone 4 (subscriber confirmation) and Milestone 8 (enquiry
notifications) — build the underlying email-send utility once here, in T3.7, since this is
its first consumer, and reuse it in those later epics rather than re-implementing it.
