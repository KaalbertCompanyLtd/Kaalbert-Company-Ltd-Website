# Epic: Landing Pages & Measurement

Roadmap milestone 5. Closes out everything Document 13.03 asked of the public-facing site —
after this, the site can carry paid traffic and prove it's working. Still entirely
public/marketing-facing; no admin dependency.

**Decision made here, not left open:** `measurement-and-attribution.md`'s edge case defers
the `attribution` row's retention window to "Phase 6 task planning" — that's this document.
**Decision: 90 days**, matching GA4's and Meta's own standard default attribution lookback, so
the application's own retention doesn't discard attribution data platforms would still credit.
Implemented in T5.4 below as a scheduled cleanup job, documented against FR-6.4's retention
policy requirement.

---

### T5.1 — Landing page template — `/lp/[slug]`

**Build:** Template to `ui/mockups/a-public-site/landing-page.html` (or equivalent), reading
`landing_page` (`docs/features/landing-page-template.md`) — no site navigation chrome
(structurally absent, not hidden by a toggle), full Section 8.2 footer statement present via
the shared footer component (not a per-instance editable field), independently editable
headline/opening paragraph.
**Input → Output:** `landing_page` row → rendered page with no nav, full footer statement,
correct OG/Twitter tags (NFR-5).
**Acceptance criteria:** No site navigation renders under any circumstance on this template;
the Section 8.2 statement is present in full and identical to the one rendered elsewhere on
the site (same shared source); a request for a non-existent slug 404s.
**Size:** M **Dependencies:** T1.5

### T5.2 — Three landing page instances, seeded

**Build:** Seed data for the three named launch instances: `/lp/business-health-check`,
`/lp/funding-readiness-checklist`, `/lp/financial-clarity-pack` (`SM/2026-09`).
**Input → Output:** Campaign copy per instance → three live, distinct landing pages.
**Acceptance criteria:** All three render distinctly (different headline/CTA per campaign);
each CTA correctly routes to its stated destination (diagnostic, checklist download, or
enquiry route respectively).
**Size:** S **Dependencies:** T5.1

### T5.3 — GTM container: six conversion events + consent mode

**Build:** Populate the T1.6 GTM container with the six defined events (diagnostic started,
diagnostic completed, summary requested, checklist downloaded, enquiry submitted, WhatsApp
opened) as GA4 key events (FR-7.3), consent banner + consent mode (FR-7.2, degrading
measurement gracefully on decline rather than blocking site function), all tags
addable/removable through GTM without a code deploy (FR-7.1).
**Input → Output:** `dataLayer.push(...)` calls already present at each event's source
(diagnostic flow, contact form, WhatsApp links) → six firing GA4 key events, visible in GA4's
Realtime view.
**Acceptance criteria:** All six events fire exactly once per genuine conversion in GTM
Preview mode; declining consent still allows full site function while visibly reducing what's
sent (consent mode signal present in the network payload); no tag is hard-coded outside GTM.
**Size:** L **Dependencies:** T1.6, T3.4–T3.7, T2.6

### T5.4 — Attribution capture, persistence, and 90-day retention job

**Build:** `attribution` table (`measurement-and-attribution.md`) capturing
utm_source/medium/campaign/landing_page/first_seen per session, persisted through the entire
multi-step diagnostic flow; a scheduled job deleting `attribution` rows older than 90 days
that are not referenced by any `enquiry_record` (rows still referenced by a real enquiry are
never deleted by this job — retention of the enquiry itself is a separate, longer policy under
FR-6.4, not overridden by this 90-day window).
**Input → Output:** Campaign-tagged first visit → persisted `attribution` row, foreign-keyed
from any `enquiry_record` created in that session; job run → rows past 90 days with no
referencing enquiry removed.
**Acceptance criteria:** UTM parameters present on landing survive through diagnostic
completion and appear correctly on the resulting enquiry in a direct DB check (admin display
of this is Milestone 8); an `attribution` row referenced by an enquiry is never deleted by the
90-day job regardless of its own age; a session with no campaign parameters stores null/direct,
never blocking the flow.
**Size:** M **Dependencies:** T3.5, T5.3

### T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification

**Build:** Server-side Meta Conversions API call (fire-and-forget, deduplicated against the
client pixel via a shared event ID tied to `enquiry_id`, never regenerated per attempt);
Google Ads conversion actions imported from GA4 (not defined separately, FR-7.5); LinkedIn
Insight Tag installed for retargeting accumulation only (FR-7.8 note); Meta Business Manager
domain verification for kaalbert.com (FR-7.9).
**Input → Output:** The same six conversion moments → deduplicated Meta CAPI + pixel events,
GA4-imported Google Ads conversions, LinkedIn tag firing.
**Acceptance criteria:** A Meta CAPI outage (simulated) never delays or breaks the
visitor-facing response (`architecture.md`, Section 5); a double-submit produces one
deduplicated conversion, not two, verified in Meta Events Manager's own dedup reporting;
domain verification shows confirmed in Meta Business Manager.
**Size:** M **Dependencies:** T5.3, T5.4
