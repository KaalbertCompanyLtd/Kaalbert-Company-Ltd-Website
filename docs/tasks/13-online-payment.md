# Epic: Online Payment (P2-4)

Roadmap milestone 13. **Gated — not scheduled.** Trigger: a productised, fixed-fee offer sold
without negotiation. Advisory fees settled by invoice do not need this.

---

### T13.1 — Gateway integration + data model

**Build:** `payment` (related_entity_type/id, offer_id/product reference, amount, currency,
gateway_reference, status, paid_at), `invoice` (payment_id, fee_band_reference, issued_at,
pdf reference); gateway integration (preliminary lean: Paystack, per `docs/research/phase-2-
integrations.md`) — API only, never an embedded third-party checkout page owning the UI.
**Input → Output:** Schema + gateway API credentials → ready-to-call payment initiation.
**Acceptance criteria:** The checkout UI is fully hand-built inside the application; no
gateway-hosted page is ever shown to the visitor.
**Size:** M **Dependencies:** T1.2

### T13.2 — Payment flow with Mobile Money as primary

**Build:** `POST /api/payment/initiate`, hand-built checkout screen offering MTN MoMo,
Vodafone Cash, AirtelTigo Money, and card — Mobile Money presented as a first-class method,
not a secondary option bolted onto card (FR-12.2).
**Input → Output:** `{related_entity_id, offer_id}` → gateway redirect/session → visitor
completes payment.
**Acceptance criteria:** Mobile Money methods are visually and functionally equal-priority to
card in the UI, verified against the mockup/design intent, not demoted to a secondary tab.
**Size:** M **Dependencies:** T13.1

### T13.3 — Webhook-verified confirmation + invoice

**Build:** `POST /api/payment/webhook` — server-to-server, the sole authoritative source of
payment status (never the client-side redirect); invoice generation referencing the specific
published fee band paid against (FR-12.3), never a generic "payment received."
**Input → Output:** Gateway webhook call → `payment.status` updated, `invoice` row created.
**Acceptance criteria:** A duplicate webhook for the same transaction is handled idempotently,
keyed on the gateway's own transaction reference, never double-processed (documented edge
case); the webhook race condition (arrives before the browser redirect) is handled correctly
— webhook wins, redirect is UX-only; a failed/abandoned payment leaves the related
engagement/purchase unpaid, never silently marked paid.
**Size:** M **Dependencies:** T13.2

### T13.4 — Payments list (admin) + reconciliation

**Build:** `ui/screen-inventory.md` #56a — read-only `AdminDataTable` variant under
Operations: status, amount, fee band reference, linked engagement/diagnostic-suite purchase,
invoice PDF one click away. Nothing on this screen can mark a payment paid — only the webhook
can (enforces the same rule at the UI layer).
**Input → Output:** `payment`/`invoice` tables → admin list.
**Acceptance criteria:** No control on this screen writes to `payment.status`; a gateway-side
success with a failed local DB write is reconcilable from the stored `gateway_reference`
(documented edge case) — proven by a deliberate DB-write-failure test confirming the gateway
reference alone is enough to manually reconcile.
**Size:** S **Dependencies:** T13.3
