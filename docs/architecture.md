# Architecture — kaalbert.com

## 1. System overview

kaalbert.com is a single custom-built Next.js (TypeScript) application handling three
concerns in one codebase: a public marketing/content site (Home, three core offer pages,
Capabilities, Our Method, Insights, About, Contact, legal pages, landing pages), an
interactive Business Health Check diagnostic with a configurable scoring engine, and a
hand-built admin area where non-technical partners manage content — all backed by one
PostgreSQL database on Railway, with no CMS product involved anywhere in the stack. Every
conversion point in the application pushes events through Google Tag Manager to GA4, Meta
(including a server-side Conversions API call), Google Ads, and LinkedIn, with full campaign
attribution written into the enquiry record alongside the visitor's data. Cloudflare sits in
front of the application as a CDN/proxy layer, closing Railway's single-region performance
gap for visitors on 3G/mid-range Android in Ghana. The same application, database, and auth
system extend — in Phase 2, once a trigger is met — to a client portal, booking, payments,
and CRM sync, without a platform change.

## 2. Architecture diagram

```
                         Visitors (Ghana, mostly mobile / 3G)
                                        |
                                        v
                          +----------------------------+
                          |         Cloudflare          |
                          |  DNS + CDN/proxy (free tier) |
                          |  R2 (media, added if needed) |
                          +--------------+---------------+
                                         |
                                         v
                          +----------------------------+
                          |     Railway: Next.js App     |
                          |                              |
                          |  +------------+------------+ |
                          |  | Public Site | Diagnostic | |
                          |  | (SSR/SSG)   | (API +     | |
                          |  |             |  client     | |
                          |  |             |  flow)      | |
                          |  +------------+------------+ |
                          |  |        Admin Area          | |
                          |  |  (auth + TOTP + hand-built  | |
                          |  |   content-management UI)    | |
                          |  +----------------------------+ |
                          |               |                  |
                          |               v                  |
                          |   +------------------------+     |
                          |   | Application API Layer  |     |
                          |   | (business logic, auth  |     |
                          |   |  checks, validation)    |     |
                          |   +------------+-----------+     |
                          +----------------|-----------------+
                                           |
                    +----------------------+----------------------+
                    |                                              |
                    v                                              v
       +--------------------------+                  +---------------------------+
       |  PostgreSQL (Railway)     |                  |    External Services       |
       |  - content (articles,     |                  |  - Google Tag Manager       |
       |    pages, offers, fees)   |                  |  - GA4 / Meta CAPI /         |
       |  - diagnostic questions,  |                  |    Google Ads / LinkedIn     |
       |    scoring, responses     |                  |  - Cloudflare R2 (media)     |
       |  - enquiry records +      |                  |  - Phase 2 (gated):          |
       |    attribution            |                  |    Paystack, Calendar API,   |
       |  - admin users + TOTP     |                  |    CRM webhook               |
       +---------------------------+                  +---------------------------+
```

## 3. Component responsibilities

**Public Site Renderer** — server-renders/statically generates Home, the three core offer
pages, Capabilities, Our Method, Insights (index and article template), About, Contact, the
four legal pages, and the three landing page instances, reading content from PostgreSQL. Not
responsible for: scoring logic, authentication, payment processing.

**Diagnostic Module** — renders the `/diagnostic` multi-step client flow, calls the
Application API Layer for scoring and submission, renders `/diagnostic/results`. Not
responsible for: rendering the rest of the site, admin content publishing.

**Admin Area** — hand-built, TOTP-gated authenticated screens for article publishing, page-
copy editing, fee-range updates, and landing-page creation from a template (FR-8). Not
responsible for: public-facing rendering logic, though it shares underlying data with it.

**Application API Layer** — the shared business-logic layer used by the public site (enquiry
submission), the diagnostic (scoring, attribution, triage), and the admin area (content
mutations, auth checks). Owns validation and authorization; the only layer permitted to write
to the database directly.

**PostgreSQL (Railway)** — source of truth for all structured data: content, diagnostic
configuration and responses, enquiry records with attribution, and admin user accounts
including TOTP secrets. Not responsible for file/media storage or for verifying session
tokens (that logic lives in the Application API Layer, which reads/writes the sessions and
secrets this database stores).

**Measurement Layer (GTM + `dataLayer` + server-side CAPI)** — fed by events fired from the
Application API Layer at each of the six conversion points. Not responsible for storing
analytics data itself (that is GA4's, Meta's, Google Ads', and LinkedIn's job) — only for
firing the right event, with the right attribution, at the right moment.

**Cloudflare (CDN/proxy + R2)** — edge caching and performance for static assets, DNS, and
optional media storage. Not responsible for any application logic.

## 4. Primary flow

The diagnostic — Document 13.03's own description of "the single most important conversion
asset on the site" — traced end to end:

1. A visitor clicks a tracked advertisement or link. Cloudflare's edge serves cached static
   assets for the landing page; the Next.js application server-renders the page itself, with
   the GTM snippet loaded and campaign parameters captured client-side.
2. The visitor proceeds to `/diagnostic`. Campaign parameters persist through the session.
   GTM fires `diagnostic_started` on the first answered question.
3. Each question is answered client-side with no full page reload. On the final step, the
   client posts the complete response set to an Application API Layer route.
4. That route validates the input, runs the scoring engine against the current
   questions/dimensions/weights/thresholds stored in PostgreSQL, computes the result,
   creates an enquiry record containing the full response set and the campaign attribution
   carried from step 1, evaluates it against the triage thresholds, and returns the score to
   the client.
5. The client navigates to `/diagnostic/results` — a distinct completion state, per
   `SM/2026-09`, Section 4. GTM fires `diagnostic_completed`.
6. If the visitor requests the fuller written summary: a second API call captures contact
   details and separate marketing consent, updates the enquiry record, triggers a
   transactional email, fires `summary_requested`, and makes a server-side call to Meta's
   Conversions API — deduplicated against the client-side pixel event via a shared event ID —
   alongside the GTM-fired client-side signal.
7. A partner later opens the enquiry in the Admin Area and sees the full response set, score,
   triage flag, and attributed source in one place.

## 5. External dependencies

| Dependency                                              | Role                                                                               | Failure mode if unavailable                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Railway                                                 | Application + database hosting                                                     | Site is down entirely. Mitigated by Railway's own uptime and the automated-backup/tested-restore requirement (NFR-3, AC-4) — a lost instance is recoverable, not a lost site. Concrete backup cadence, retention window, and restore-test schedule: ADR 0011.                                                                                                                                                                   |
| Cloudflare                                              | DNS, CDN/proxy, optional R2 storage                                                | Because DNS is routed through Cloudflare, a Cloudflare outage would make the site unreachable — a genuine single point of failure, accepted for the CDN/performance benefit it provides the rest of the time. Manual mitigation: DNS can be pointed directly at Railway as a last-resort fallback, losing CDN benefit temporarily but restoring reachability.                                                                   |
| Google Tag Manager / GA4 / Meta / Google Ads / LinkedIn | Measurement and attribution                                                        | The site itself keeps functioning — a visitor can still complete the diagnostic and contact the firm — but that traffic's measurement is lost for the outage window. Correctly isolated from the user-facing path; see the non-blocking design note below.                                                                                                                                                                      |
| Meta Conversions API                                    | Server-side conversion event                                                       | The server-side call is implemented as fire-and-forget relative to the user-facing response — a Meta outage must never delay or break the diagnostic result the visitor sees. A failed call is logged, not retried inline.                                                                                                                                                                                                      |
| Cloudflare R2 (once added)                              | Media storage                                                                      | Images/downloads fail to load; the rest of the site functions.                                                                                                                                                                                                                                                                                                                                                                  |
| Brevo                                                   | Transactional email (T3.7); Phase 2, gated: subscriber sync + campaign send (P2-8) | Transactional: a failed send is logged, not retried inline, never blocks the user-facing response it's attached to (same fire-and-forget shape as the Meta Conversions API row below) — see `lib/email.ts`. Phase 2 (not built yet): a sync-API outage delays `subscriber` state reaching Brevo's contact list, queued and retried, never dropped; the site's own `subscriber` table stays authoritative regardless (ADR 0012). |
| Paystack (Phase 2, gated)                               | Payment collection                                                                 | Payment cannot complete; requires explicit user-facing error handling when built (P2-4).                                                                                                                                                                                                                                                                                                                                        |
| TipTap, Prisma, `otplib`, `bcrypt`/`argon2`             | Libraries, not runtime services                                                    | No network dependency at request time; the relevant risk is a broken upstream release, mitigated by lockfile-pinned dependency versions rather than an availability concern.                                                                                                                                                                                                                                                    |

## 6. Limits & failure behaviour

This project has no meaningful scaling axis worth deep concern at launch. Expected traffic —
per `vision.md`'s six-month targets (roughly thirty diagnostic completions, a handful of
qualified enquiries a month) — sits far below where any component here would strain.

- **Most likely first bottleneck**: Railway's allocated compute/memory for the Node process,
  under a sudden traffic spike (a viral article, a large ad-campaign burst). Mitigation:
  Railway resource allocation is a configuration and cost change, not an architecture change,
  and Cloudflare's caching absorbs most static-asset load before it reaches the origin at
  all.
- **Diagnostic scoring engine**: computationally trivial — basic arithmetic over roughly
  twenty answers — not a realistic bottleneck at any traffic level this project would see.
- **Database**: a single PostgreSQL instance could become a bottleneck only under concurrent
  write volumes far beyond anything this project's KPIs anticipate in year one; the
  mitigation path (a larger instance) exists on the same platform without a migration.
- **Media/storage**: no meaningful limit at this project's content scale — a handful of
  images per article across roughly a hundred articles.

## What this document does not cover

Phase 2 capabilities (client portal, booking, payments, CRM sync, subscriber outreach via
Brevo campaigns) extend this same architecture rather than replacing any part of it — see
the relevant research notes (`docs/research/auth-strategy.md`,
`docs/research/phase-2-integrations.md`) and the ADRs in `docs/adr/` (ADR 0012 for subscriber
outreach specifically) for how each attaches to the components described above.
