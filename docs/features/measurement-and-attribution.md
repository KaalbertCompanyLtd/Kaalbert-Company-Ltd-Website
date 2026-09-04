# Feature: Measurement and Attribution

Phase 1. Document 13.03, Section 11. ADR 0006.

## Goal

Let the firm trace every enquiry back to the specific advertisement, article, or page that
produced it, and carry paid traffic from day one without spending blind (Document 13.03,
Section 11's own stated reasoning; `vision.md`'s "100% of enquiries traceable to a source"
target).

## User flow

This feature has no screen of its own — it instruments every other feature. The firm does
not view raw analytics data on kaalbert.com itself: aggregate campaign performance is
reviewed on each platform's own dashboard (GA4, Meta Events Manager, Google Ads, LinkedIn
Campaign Manager), optionally surfaced inside the admin later via
`platform-performance-dashboards.md`. What this feature stores on kaalbert.com itself is
per-enquiry attribution, visible on each enquiry in `enquiry-management.md` — that is how a
partner sees "which source produced this specific lead," as distinct from platform-level
aggregate trends.

From a visitor's perspective:

1. Visitor arrives via a tracked link (an advertisement, a shared article, a direct
   campaign URL) carrying campaign parameters.
2. Those parameters persist through the visitor's session, including through the entire
   multi-step diagnostic flow.
3. At each of six defined moments (diagnostic started, diagnostic completed, summary
   requested, checklist downloaded, enquiry submitted, WhatsApp opened), an event fires,
   carrying the original attribution.
4. Before any of this happens, the visitor sees a consent banner; declining marketing consent
   does not stop the site from working, but adjusts what is sent to advertising platforms
   (consent mode).

## Business rules

- All tags deploy through one Google Tag Manager container, firm-owned, addable/removable
  without a code change (FR-7.1; Document 13.03 explicitly forbids hard-coded tags).
- Consent state is passed to analytics/advertising tags as consent mode, not used merely to
  block them outright (FR-7.2) — the firm retains modelled measurement from visitors who
  decline.
- The six conversion events are each a defined GA4 key event (FR-7.3).
- The Meta pixel and a server-side Conversions API call fire for the same six events, with
  deduplication via a shared event ID so no conversion is double-counted (FR-7.4).
- Google Ads conversion actions are imported from GA4, not defined separately (FR-7.5).
- The LinkedIn Insight Tag is installed even though the firm does not plan to advertise on
  LinkedIn to cold audiences at launch, specifically so a retargeting audience begins
  accumulating from day one (Document 13.03, Section 11.1).
- Diagnostic responses themselves are never sent to any advertising platform — only the fact
  that a conversion occurred (Document 13.03, Section 9).
- The server-side Conversions API call is fire-and-forget relative to the user-facing
  response; a Meta outage must never delay or break what the visitor sees (`architecture.md`,
  Section 5).
- Every WhatsApp contact link carries a pre-filled message identifying its originating page
  and fires a tracked click event (FR-7.8).

## Data requirements

- `attribution` — session id, utm_source, utm_medium, utm_campaign, landing_page, first_seen.
- Every `enquiry_record` (see `business-health-check-diagnostic.md`,
  `contact-and-enquiry.md`) carries a foreign key to its originating `attribution` row —
  this is what `enquiry-management.md` displays per enquiry.
- No separate storage of raw analytics events — GA4/Meta/Google Ads/LinkedIn are the systems
  of record for event-level data; the application only fires events and stores attribution
  against its own business records.

## Interfaces

- No public API of its own; the `dataLayer.push(...)` calls and the server-side Conversions
  API call are implementation detail inside the Application API Layer routes of the features
  they instrument (the diagnostic's submit/summary routes, the contact form's submit route,
  the WhatsApp link's click handler).
- GTM container, GA4 property, Meta Events Manager, Google Ads account, LinkedIn Campaign
  Manager — external accounts, not application interfaces, listed in full in
  `MHC/2026-09`'s Account Ownership Register.
- kaalbert.com domain verification in Meta Business Manager (FR-7.9) — a firm-owned-account
  handover step, done once at launch; Google Search Console and Google Business Profile
  verification are the same kind of step, covered in `seo-and-search-foundation.md`.

## Edge cases

- Visitor blocks all cookies/scripts entirely (beyond declining consent through the banner):
  consent mode degrades measurement gracefully rather than erroring; the site itself must
  still function fully.
- Campaign parameters present on the very first page but the visitor navigates away and
  returns days later: attribution persistence duration is a defined retention window (set in
  Phase 6 task planning), not indefinite, consistent with the documented retention policy
  required under FR-6.4.
- Server-side Conversions API call fails (network error, Meta outage): logged, not retried
  inline, and never surfaced to the visitor — see `architecture.md`, Section 5.
- A conversion event fires twice due to a client-side double-submit: the event ID used for
  deduplication must be generated once per genuine conversion (e.g. tied to the
  `enquiry_id`), not regenerated per attempt, so a double-click doesn't inflate reported
  conversions.
