# Research: Measurement Stack Implementation

## The decision to be made

How the full Section 11 measurement stack — single tag container, GA4, consent mode, Meta
pixel + server-side Conversions API, Google Ads, LinkedIn, end-to-end attribution, tracked
WhatsApp — is concretely implemented in the custom application decided in
`runtime-framework-and-admin.md`.

## Options evaluated

**A. Google Tag Manager as the single container**, with GA4, the Meta pixel, Google Ads, and
the LinkedIn Insight Tag deployed as GTM tags; custom `dataLayer` pushes written by hand at
each of the six conversion points; server-side Conversions API calls implemented as a
custom server-side function in the application, triggered alongside the corresponding
client-side event.

**B. Hand-coded tag injection** directly into page templates, one script tag per platform.

**C. A fully custom in-house tag-management solution**, built from scratch instead of using
GTM.

## Criteria

- FR-7.1's explicit requirement: "deployed through one container under firm-owned
  credentials... addable or removable without a code change" — Document 13.03 states plainly
  that "tags hard-coded into the theme are not accepted"
- Server-side event forwarding for the Conversions API, with deduplication (FR-7.4)
- Consent-mode signal passthrough (FR-7.2)
- Maintainability: routine tag changes should not require a code deployment (NFR-7-adjacent)
- Consistency with "custom build everything" — the container and its tags are configuration,
  not the CMS-style product this project's stack decision was about avoiding

## Recommendation

**Option A — Google Tag Manager as the single container**, with a custom server-side
Conversions API integration built by hand for deduplication accuracy.

### Why

- Document 13.03 rules out Option B by its own words — hard-coded tags are explicitly not
  accepted, so this is less a three-way trade-off than a confirmation of what the trigger
  document already decided, with the remaining question being which container.
- Google Tag Manager is free, firm-owned, and purpose-built for exactly "one container,
  addable/removable without a code change" — it is not a CMS-style product that owns
  application logic or the admin UI; it is a configuration layer for tags, consistent with
  the project's custom-build principle in the same way a hosting platform is (see
  `hosting-and-infrastructure.md`'s note on this distinction).
- Option C (a fully custom tag-management system) is rejected as unnecessary: GTM already
  solves "one container, firm-owned, no-code-change" completely; building a replacement would
  be custom effort spent re-solving an already-solved problem, not effort spent on anything
  specific to this project.
- Server-side Conversions API deduplication is built as custom code, deliberately, rather
  than relying on a plugin or GTM template's default behaviour — correct event-ID matching
  between the browser pixel and the server-side call (FR-7.4) is exactly the kind of detail
  worth controlling directly in application code the team owns, rather than trusting to a
  third party's default implementation.

### Trade-offs

- GTM adds one more account to the Account Ownership Register (already planned for in
  `MHC/2026-09`) — negligible against what it buys: a change to which tags fire never
  requires touching application code again.

### Future scaling considerations

Every Phase 2 conversion event named in `scope.md` (`consultation_booked`,
`payment_completed`, `training_registered`) plugs into the same GTM container and
`dataLayer` pattern established at launch — Phase 2 adds new `dataLayer` pushes at the point
each feature is built, not a new measurement architecture.

## What this decision constrains or enables

The diagnostic's API routes (`diagnostic-engine-architecture.md`) and the enquiry-submission
and WhatsApp-link handlers are where `dataLayer` pushes and the server-side Conversions API
call are written into application code — this is implementation detail for Phase 4 (Feature
Breakdown), not a further architecture decision.
