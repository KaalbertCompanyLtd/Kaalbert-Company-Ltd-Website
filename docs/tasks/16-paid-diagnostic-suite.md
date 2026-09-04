# Epic: Full Diagnostic Suite as a Paid Product (P2-7)

Roadmap milestone 16. **Gated — not scheduled.** Trigger: evidence the free diagnostic
converts (already produced by FR-2.6/FR-7.3 at Phase 1 launch — no new instrumentation needed
to know when this trigger is met). Document 13.03 names this "evaluated first" among all
Phase 2 capabilities and earmarks the Phase 2 budget (GHS 4,500, month nine) specifically for
it — sequenced last in this document only because task planning follows the roadmap's
public-presentation-first ordering; evaluate its trigger independently of build order.

---

### T16.1 — Paid tier configuration on the existing engine

**Build:** `tier` field (free/paid) added to `diagnostic_dimension`/`diagnostic_threshold`
(reusing the Phase 1 scoring engine, ADR 0005 — reconfigured, not rebuilt, FR-2.2); the
deeper paid question set (operations and people dimensions join business and financial).
**Input → Output:** Schema extension + seeded paid-tier config → both tiers coexisting in the
same schema.
**Acceptance criteria:** The free diagnostic (Milestone 3) continues scoring correctly and
unaffected after this migration — a regression check, not just a new-feature check.
**Size:** M **Dependencies:** T3.1, T3.2, **trigger evidence confirmed (completion + enquiry
conversion rate on the free diagnostic) before this epic starts**

### T16.2 — Payment-gated access — `GET /diagnostic/full`

**Build:** Entry point requiring a confirmed `payment_id` (never merely initiated) before the
paid question set unlocks.
**Input → Output:** Confirmed `payment` (from Milestone 13) → access granted to `GET
/diagnostic/full`.
**Acceptance criteria:** An initiated-but-unconfirmed payment does not unlock access, tested
directly against the webhook-verified state from `13-online-payment.md`.
**Size:** S **Dependencies:** T16.1, T13.3 (webhook-verified payment)

### T16.3 — Paid flow + report generation

**Build:** `diagnostic_purchase`, `paid_diagnostic_response`, `paid_diagnostic_report`;
`POST /api/diagnostic/full/submit` (same shape as free submit, scored against `paid` tier);
`GET /api/diagnostic/full/[purchase_id]/report`.
**Input → Output:** Paid responses → generated report covering all four scored dimensions,
referencing the exact configuration version it was scored against (so a later question-set
change never retroactively alters a delivered report — documented edge case).
**Acceptance criteria:** Abandoning the paid flow mid-way leaves `diagnostic_purchase` as
`in_progress`, resumable without re-payment (payment and completion tracked as separate
states, documented edge case).
**Size:** L **Dependencies:** T16.2

### T16.4 — Partner follow-up call as part of the product

**Build:** The follow-up call offer wired into the purchase completion flow — booked via
`booking-and-scheduling.md` (Milestone 10) if that capability already exists by the time this
ships, or a firm-arranged fallback otherwise; presented as included in the product, never as
an optional upsell.
**Input → Output:** Completed `paid_diagnostic_report` → follow-up call offered/booked.
**Acceptance criteria:** Both paths (Milestone 10 exists / doesn't exist yet) are handled
without a broken or dead-end state on the completion screen.
**Size:** S **Dependencies:** T16.3

**Open questions flagged, not resolved here:** refund handling (does report access revoke on
refund?) is an explicit firm policy question per `paid-diagnostic-suite.md`, to be confirmed
before T16.2/T16.3 implementation, not assumed.
