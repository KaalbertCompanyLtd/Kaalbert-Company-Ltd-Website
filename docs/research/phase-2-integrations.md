# Research: Phase 2 Integrations

## The decision to be made

The Phase 2 gated capabilities (P2-1 booking, P2-4/P2-7 payment, P2-6 CRM sync) need real
external services. This note names concrete shortlists now, against the custom-built
application decided in `runtime-framework-and-admin.md`, so none of them starts from a blank
search when triggered — consistent with this project's standing rule that gated phases are
planned in full now, not stubbed.

Every integration below follows the same pattern already established for this project:
**the external service provides an API; the UI and integration code are hand-built inside
the application, never a pre-packaged plugin or embedded third-party widget that owns the
screen.**

## Payment gateway (P2-4, P2-7)

### Options evaluated

Paystack, Hubtel, Flutterwave — all operate in Ghana, support Mobile Money (MTN MoMo,
Vodafone Cash, AirtelTigo Money) alongside card payment, and expose a real API rather than
only a plugin/checkout-widget product.

### Criteria

Mobile Money support depth (the target client is a Ghanaian SME founder, who is more likely
to pay by Mobile Money than card); API quality (a real REST API the application's own
checkout screen can call, not only an embeddable widget that would own the payment UI);
transaction fee structure; settlement speed into a Ghanaian bank account; reliability
reputation among Ghanaian businesses.

### Preliminary lean

**Paystack**, given broad adoption across Ghanaian and West African businesses and a
documented, direct API (not only a plugin ecosystem) that fits a hand-built checkout flow —
the application calls Paystack's API to initiate and verify a transaction, and the payment
screen itself is built and styled as part of the main application, not an embedded
third-party form. This is a starting shortlist to re-verify (fee structure and reliability
can shift) at the point P2-4's trigger is actually met, not a locked-in decision now.

## Booking / calendar (P2-1)

### Options evaluated

**A.** A calendar-sync library (e.g. one implementing the CalDAV/Google Calendar API)
used inside a hand-built booking screen and hand-built slot-capacity logic.

**B.** An embedded third-party scheduling widget (e.g. a Calendly-style embed).

### Criteria

Per-partner, capacity-limited slots rather than an open calendar (`scope.md`'s P2-1
reasoning: the firm's differentiator is senior attention, so booking must route to the right
partner against real, limited capacity, not present an unlimited public calendar); whether
booking events can write into the same enquiry record and attribution data used everywhere
else on the site (FR-9.4); consistency with the hand-built-UI principle.

### Recommendation

**Option A.** A third-party embedded widget (Option B) would sit outside the application's
own data model, making it difficult to write a `consultation_booked` event into the same
`dataLayer`/GTM pattern (`measurement-stack-implementation.md`) or attach the same source
attribution used everywhere else — it would need its own separate integration work to
achieve the same result Option A gets natively, while also handing the actual booking screen
to a third party's UI rather than the application's own. A calendar-sync library (for
checking/writing availability against each partner's real calendar) used inside a hand-built
booking UI keeps booking inside the same system as everything else.

## CRM sync (P2-6)

### What's decided now, and what isn't

No specific CRM product is named — the firm has not chosen one, and P2-6's own trigger is
"the firm operating a CRM it actually maintains," which by definition hasn't happened yet.
What is decided here instead: the sync mechanism will be a one-way webhook or REST API push
from the application (built by hand, using the enquiry record's already-structured fields
per FR-14.1) to whatever CRM the firm eventually adopts. Virtually every modern CRM (e.g.
HubSpot, Zoho, Pipedrive) accepts inbound leads via webhook or API, so this integration
approach doesn't need to wait on a CRM choice to be planned — only to be built, and the
specific field-mapping code is written once the target CRM is known.

## What this decision constrains or enables

None of these three integrations requires reopening `runtime-framework-and-admin.md` or
`hosting-and-infrastructure.md` when triggered — each is additive, hand-built code calling an
external API on the existing application, consistent with the "meeting a trigger means
building, not re-planning" goal stated throughout `scope.md`.
