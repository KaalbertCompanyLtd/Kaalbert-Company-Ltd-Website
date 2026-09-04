# ADR 0006: Google Tag Manager as the Single Measurement Container

Status: Accepted

Context: Document 13.03, Section 11.1, requires "a single tag management layer... Tags
hard-coded into the theme are not accepted," alongside GA4, consent mode, a Meta pixel with
server-side Conversions API and deduplication, Google Ads conversion import, and the
LinkedIn Insight Tag.

Decision: Google Tag Manager is the single container, holding GA4, the Meta pixel, Google
Ads, and the LinkedIn Insight Tag as GTM tags, fed by hand-written `dataLayer` pushes at each
of the six conversion points. The server-side Conversions API call is a custom integration
in the Application API Layer, not delegated to a GTM template's default behaviour, so
event-ID deduplication against the client-side pixel is controlled directly.

Consequences: A change to which tags fire never requires a code deployment again — GTM is
firm-owned, editable by anyone the firm grants access to. This adds one account to the
Account Ownership Register (`MHC/2026-09`), a negligible cost against what it buys. Every
Phase 2 conversion event (`consultation_booked`, `payment_completed`, `training_registered`)
plugs into the same `dataLayer`/GTM pattern when built, rather than requiring a new
measurement architecture. See `docs/research/measurement-stack-implementation.md`.
