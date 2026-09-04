# Feature: Online Payment (P2-4)

**Phase 2 — gated.** Trigger: a productised, fixed-fee offer sold without negotiation
(`scope.md`, P2-4). Advisory fees settled by invoice, as the firm operates today, do not
need this. Not built until then.

## Goal

Let a client pay for a fixed-fee offer immediately, the way Ghanaian SME founders actually
pay — Mobile Money as a first-class method, not an afterthought to card payment —
rather than waiting on an invoice-and-bank-transfer cycle (`scope.md`; `user-stories.md`,
Story 19).

## User flow

1. Client (a founder who has accepted a named, fixed-fee offer, or a visitor purchasing the
   paid diagnostic suite, `paid-diagnostic-suite.md`) reaches a payment step.
2. Chooses Mobile Money (MTN MoMo, Vodafone Cash, or AirtelTigo Money) or card, and completes
   payment through the gateway's flow.
3. On success, receives an invoice/receipt referencing the specific fee band paid against;
   the firm's record (engagement or paid-diagnostic purchase) is marked paid.
4. A `payment_completed` event fires through the existing measurement stack.

## Business rules

- Mobile Money is supported as a primary method, not a secondary option bolted onto a
  card-only flow (FR-12.2) — reflects the target client's actual payment behaviour.
- The payment screen and checkout flow are hand-built inside the application; the gateway
  (preliminary lean: Paystack, `docs/research/phase-2-integrations.md`) provides only the
  API, never an embedded third-party checkout page that would own the UI.
- An invoice/receipt is generated on successful payment, referencing the specific published
  fee band paid against (FR-12.3) — never a generic "payment received" with no fee
  reference.
- A failed or abandoned payment leaves the associated engagement/purchase in an unpaid state,
  never silently marked paid.
- Payment confirmation is verified server-side against the gateway's own callback/webhook,
  never trusted from a client-side redirect alone.

## Data requirements

- `payment` — id, related_entity_type (engagement/diagnostic_purchase), related_entity_id,
  offer_id or product reference, amount, currency, gateway_reference, status
  (pending/paid/failed), paid_at.
- `invoice` — id, payment_id, fee_band_reference, issued_at, pdf reference.

## Interfaces

- `POST /api/payment/initiate` — request: `{related_entity_id, offer_id}`; response: gateway
  redirect/session details.
- `POST /api/payment/webhook` — gateway-called, server-to-server; verifies and finalises
  payment status.
- `GET /api/payment/[id]/invoice` — retrieves the generated invoice.
- Admin-side: a "Payments" list under Operations (an `AdminDataTable` variant) showing every
  `payment` — status, amount, the fee band it references, the linked engagement or
  diagnostic-suite purchase — with the invoice PDF one click away. Read-only against the
  gateway-verified `status` field (the business rule that payment status is never trusted
  from the client applies here too: nothing on this screen can mark a payment paid, only the
  webhook can).

## Edge cases

- The gateway webhook arrives before the client's browser redirect back to the site (a race
  condition inherent to most payment gateways): the webhook is the authoritative source of
  truth for payment status, not the redirect — the redirect only improves the client's
  immediate UX.
- A duplicate webhook call for the same transaction (gateways commonly retry): handled
  idempotently, keyed on the gateway's own transaction reference, never double-processed.
- A payment succeeds at the gateway but the site's own confirmation step fails (e.g. a
  database error writing the `payment` record): reconciliation must be possible from the
  gateway's own transaction log — this is a reason the gateway reference is stored, not
  discarded once payment is confirmed.
- Mobile Money payment is initiated but the client doesn't complete the USSD/app confirmation
  step in time: the payment expires at the gateway level; the site reflects it as failed, not
  left indefinitely pending.
