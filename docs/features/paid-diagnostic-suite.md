# Feature: Full Diagnostic Suite as a Paid Product (P2-7)

**Phase 2 — gated.** Trigger: evidence from the free Business Health Check that businesses
complete it and convert (`scope.md`, P2-7). Document 13.03 names this "the most commercially
interesting item" and states it "is evaluated first" among all Phase 2 capabilities. The
Phase 2 budget provision (GHS 4,500, month nine) is earmarked specifically for this. Not
built until the trigger is met.

## Goal

Let a founder who found the free Business Health Check valuable buy the full four-instrument
diagnostic suite (business, financial, operations, people) with a deeper report and a
partner follow-up call, converting the free tool's proven value into a paid product
(`scope.md`; `user-stories.md`, Story 22).

## User flow

1. Visitor who has completed the free diagnostic (`business-health-check-diagnostic.md`)
   sees an offer to purchase the full suite from `/diagnostic/results` or a dedicated offer
   surface.
2. Visitor pays (`online-payment.md`).
3. Visitor answers the deeper question set across all four instruments — more questions per
   dimension, more dimensions (operations and people join business and financial) — using the
   same engine as the free version, reconfigured, not rebuilt.
4. Visitor receives a full written report covering all four scored dimensions.
5. A partner follow-up review call is offered as part of the product, consistent with the
   firm's senior-attention positioning — booked via `booking-and-scheduling.md` if that
   capability exists by the time this is built, or arranged directly by the firm otherwise.

## Business rules

- Reuses the free diagnostic's scoring engine (FR-2.2), reconfigured with more
  dimensions/questions — this is a configuration change against the data model already built
  for that purpose in Phase 1 (ADR 0005), not a second engine.
- The paid configuration and the free configuration are distinct question sets (more
  dimensions, more depth) but share the same underlying scoring mechanics.
- Requires successful payment (`online-payment.md`) before the paid question set is unlocked
  — access to the deeper flow is gated on a confirmed `payment` record, not merely an
  initiated one.
- The partner follow-up call is part of the product, not an optional upsell offered
  separately — its inclusion is what differentiates this from a purely automated report.
- This capability's trigger evidence — completion rate and conversion to enquiry on the free
  diagnostic — is already produced by FR-2.6 and FR-7.3 at Phase 1 launch (FR-15.4); building
  this feature requires no new instrumentation to know whether the trigger has been met.

## Data requirements

- `diagnostic_purchase` — id, enquiry_id (the originating free-diagnostic session, nullable
  if purchased without a prior free attempt), payment_id (references `payment`), status
  (paid/in_progress/complete).
- `paid_diagnostic_response` — same shape as `diagnostic_response`, scoped to the paid
  question set rather than the free one.
- `paid_diagnostic_report` — id, diagnostic_purchase_id, generated report content, generated
  at.
- The `diagnostic_dimension` and `diagnostic_threshold` tables from
  `business-health-check-diagnostic.md` gain a `tier` field (free/paid) so both
  configurations coexist in the same schema.

## Interfaces

- `GET /diagnostic/full` — the paid flow entry point, requires a confirmed `payment_id`.
- `POST /api/diagnostic/full/submit` — same shape as the free submit route, scored against
  the `paid` tier configuration.
- `GET /api/diagnostic/full/[purchase_id]/report` — retrieves the generated report.

## Edge cases

- A visitor pays but abandons the paid question set before completing it: the purchase
  remains `in_progress`; they can resume rather than being asked to pay again, since payment
  and completion are tracked as separate states.
- A visitor requests a refund after completing the paid flow: refund handling is a business
  policy question for the firm to resolve when this is built (whether report access is
  revoked on refund, for instance) — flagged here as an open question, not resolved
  unilaterally by this spec.
- The free diagnostic's question set changes after a paid purchase was already scored against
  an earlier configuration: the paid report references the configuration version it was
  actually scored against, so a later change to the free/paid question sets doesn't
  retroactively alter a delivered report.
