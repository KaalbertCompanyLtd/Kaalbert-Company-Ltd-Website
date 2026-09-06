# Scope — kaalbert.com

Phase 1 is built now. Phase 2 is fully planned now too, gated on the evidence triggers
below — so that when a trigger is met, the work is building (or a light plan refresh if
requirements have shifted since), not planning from a blank page.

## In scope for v1 (Phase 1 — built now)

**Pages and templates**

- Home
- Three core offer pages: Business Health Check, Financial Clarity Pack, Funding-Readiness
  Pack (`/offers/...`)
- Capabilities (all eight service lines in summary, including the Advisory Retainer)
- Our Method
- Insights index + article template, built to hold 100+ articles
- Business Health Check diagnostic tool (`/diagnostic`, `/diagnostic/results`)
- Landing page template + 3 launch instances (`/lp/...`)
- About and the partners
- Contact
- Four legal pages: privacy notice, cookie notice, terms of use, scope of practice

**Diagnostic**

- Configurable 15–20 question flow, completable under 6 minutes
- Configurable multi-dimension scoring engine (questions/weights/thresholds as data)
- Immediate on-screen result, no contact details required
- Separate gated email-summary capture step
- Full response storage against the enquiry record, with triage flagging
- Fixed disclaimer language on the result screen

**Insights**

- Category filtering, search, related-article suggestions
- Support for tables, pull quotes, figures, downloadable resources
- Named partner author with photo and practice area per article
- Complete Open Graph / Twitter Card metadata, verified on WhatsApp, LinkedIn, Facebook

**Measurement (Section 11 full stack)**

- Single tag-management container under firm-owned credentials
- GA4 with six key events, each verified
- Consent mode wired to the cookie consent banner
- Meta pixel + server-side Conversions API with deduplication
- Google Ads conversion actions imported from analytics
- LinkedIn Insight Tag
- Domain verification (Meta Business Manager, Google Search Console)
- End-to-end campaign attribution through the diagnostic, written to the enquiry record
- Tracked WhatsApp route with pre-filled message

**Platform**

- Content management usable unsupervised by a non-technical partner (publish articles, edit
  copy, update fee ranges, create landing pages from template)
- WCAG 2.1 AA accessibility
- HTTPS, 2FA on admin access, automated daily backups with tested restore
- Brand system application (Pine Green / Antique Brass / Ivory / Ink, per 09.01/09.02)
- Site-wide scope-of-practice footer, sourced from one place

## Out of scope permanently (not a future phase — deliberately excluded)

- Stock photography of generic office scenes
- Media planning, advertising spend, and campaign management (firm-owned, under 10.19) —
  the measurement infrastructure that would carry a campaign is in scope; running the
  campaign itself is not
- Legal drafting of the privacy notice, cookie notice, terms of use, and scope statement (a
  firm action with counsel — the build consumes this as supplied copy)

## Phase 2 — fully planned, gated on evidence

Each capability below is specified to the same depth as a Phase 1 feature would be, so that
meeting its trigger converts directly into a feature-spec-and-build cycle in Phase 4 of this
project's planning pipeline, not a new discovery exercise. What changes when a trigger is
met is the decision to schedule it and (per Document 13.03, Section 14) fresh funding — not
the plan itself.

---

### P2-1 Online Appointment Booking

**Trigger:** Sustained enquiry volume where scheduling by message is genuinely costing
partner time.

**What it replaces:** the current WhatsApp/email scheduling route (FR-2.4, FR-7.8), which
stays live regardless — booking is an additional, higher-intent path, not a replacement for
the lower-commitment routes.

**What it includes:**

- A booking option surfaced from `/contact` and from the diagnostic result screen
  (`/diagnostic/results`) as a "book a first call" step, alongside the existing summary
  request — not a public, standalone calendar page, since the firm's stated differentiator
  is senior attention (Document 13.03, Section 3): a lead should route to the right partner
  by practice area or the service line it came from (FR-1.2's parameterised enquiry route
  already carries the service-line context this needs), not into a generic shared pool.
- Slot types configured against each partner's actual committed capacity (five partners at
  roughly forty hours a month each, per 04.05 Firm Budget and Cash Flow) — a small number of
  bookable "discovery call" slots per partner per week, not an open calendar, so the feature
  protects the scarce time it exists to protect.
- Calendar sync per partner (e.g. against their own Google/Microsoft calendar) to prevent
  double-booking against client work already scheduled outside the site.
- Confirmation and reminder messaging by email and WhatsApp.
- A new tracked conversion event, `consultation_booked`, added to the existing GA4/Meta/
  Google Ads/LinkedIn stack (extends FR-7.3–7.6) rather than requiring a parallel
  measurement system.
- Campaign/source attribution carried through into the booking record the same way FR-7.7
  carries it through the diagnostic.

**What Phase 1 must keep open for this:** the enquiry record's source-attribution fields
(FR-2.7, FR-7.7) are built generically enough to attach to a booking event later, not
hard-coded to the diagnostic alone.

---

### P2-2 Named Case Studies and Client Testimonials

**Trigger:** Written client consent held on file, and at least three completed engagements
with measurable outcomes.

**What it replaces:** the anonymised engagement summaries (Document 13.03, Section 13,
owned by Albert Kwakye Amponsah) that ship on core offer pages at launch. Those stay live
for any engagement without consent; named case studies are added alongside them, not as a
wholesale replacement, since consent will arrive engagement-by-engagement.

**What it includes:**

- A Case Studies index and an individual case-study template — structurally the same
  pattern as Insights (FR-3.1–FR-3.6: index, template, OG/Twitter metadata, structured
  data), reusing that engine rather than building a second content system.
- Each case study: the client's name and logo (only where consent is on file), the problem,
  the engagement summary, a measurable outcome, the partner who led it, and a link back to
  the relevant core offer page — mirroring the "problem in client language, then evidence"
  structure the offer pages already use (FR-4.1).
- A consent-tracking field on each engagement record (consent on file: yes/no, date, scope
  of what may be published) gates whether a given engagement can be surfaced — this sits in
  the firm's engagement register (12.04 Active Engagements Register) rather than being
  invented as a new system.
- Testimonials appear as pull-quotes within case studies, not as a standalone testimonials
  page — a dedicated page with only a handful of entries has the same credibility problem at
  three engagements that it had at two.

**What Phase 1 must keep open for this:** the Insights template's support for structured
data and OG/Twitter metadata (FR-3.5) is built generically enough to serve a second content
type later without a template rewrite.

---

### P2-3 Client Portal

**Trigger:** Enough concurrent engagements to justify it, and a documented confidentiality
and retention position. Document 13.03 names this "the highest-risk item on the list," and
it is treated that way here — planned in depth precisely so it is not rushed when the
trigger arrives.

**What it includes:** the whole ongoing relationship surface between an active client and
the firm, not document exchange alone — full detail in
`docs/features/client-portal-and-document-exchange.md`:

- An authenticated, client-facing area scoped strictly to one engagement at a time — a
  client sees only their own engagement's overview, requests, documents, deliverables,
  messages, and team, never a firm-wide store or another client's engagement.
- An engagement overview showing the current stage of the four-stage method, assigned
  partner(s), and key dates.
- A structured information-request checklist (what the firm still needs from the client,
  outstanding vs. fulfilled) and a deliverables tracker seeded from the relevant offer's
  named deliverables.
- Secure document upload/download, engagement-scoped messaging with the assigned partner(s),
  and an audit trail of every access, download, message, and account change — a stricter
  standard than the general site's access logging (NFR-3), because this is client financial
  and business information under 07.08 Confidentiality and Data Protection Policy.
- Support for more than one named user per engagement (a client is a business, not an
  individual — a founder and a finance lead may both need access), with a `primary` role
  able to invite or remove `member` users on that engagement.
- Ordinary account self-service: profile editing, notification preferences, password
  change, and self-service password reset — none of which resets two-factor enrolment.
- Two-factor authentication on every client account, not only administrative accounts
  (extending NFR-3's admin-only 2FA requirement to this surface specifically).
- A retention and deletion policy for engagement documents and messages that is defined and
  documented before build starts, not inferred afterwards — this is the one Phase 2 item
  where the plan explicitly requires a confidentiality/security review as a precondition to
  build, not just a feature spec, and that review's scope now covers messaging and
  multi-user access too, not documents alone.
- Encryption at rest, not only in transit (NFR-3 covers transit; this surface needs both,
  given the sensitivity of what it holds).

**What Phase 1 must keep open for this:** none of the Phase 1 platform choices should assume
the site remains purely public-facing forever — the technology stack decision in Phase 2 of
the planning pipeline (`research/summary.md`) should confirm the chosen platform can support
an authenticated area later without a full replatform, even though nothing here is built
until the trigger is met.

---

### P2-4 Online Payment

**Trigger:** A productised, fixed-fee offer sold without negotiation. Advisory fees settled
by invoice, as the firm operates today, do not need this.

**What it includes:**

- Payment collection at the point a client accepts a fixed-fee offer — first relevant for
  whatever productised offer exists at the time, most likely the paid diagnostic suite
  (P2-7 below), since that is the Phase 2 item explicitly evaluated first.
- Ghana-relevant payment rails as the primary methods, not card-only: Mobile Money (MTN
  MoMo, Vodafone Cash, AirtelTigo Money) alongside card payment, matching how the firm's own
  target client — a Ghanaian SME founder — actually pays.
- A payment gateway operating in Ghana with Mobile Money support (e.g. Paystack or Hubtel)
  as the working assumption for later evaluation — not a final selection now, since gateway
  terms and reliability should be checked fresh at the time this is actually built, but
  named now so the eventual decision starts from a shortlist instead of a blank search.
- Invoice and receipt generation on successful payment, reconciled against the firm's
  existing fee bands (05.04 Rate Card) and budget model (04.05).
- A `payment_completed` conversion event added to the existing measurement stack.

**What Phase 1 must keep open for this:** fee bands are already structured as discrete,
named data (FR-4.1) rather than embedded in free-text copy, so a future "buy now" action can
reference a specific fee band without re-authoring page content.

---

### P2-5 Training Registration

**Trigger:** A scheduled programme with dates and capacity.

**What it includes:**

- A training/programme listing page showing upcoming sessions: date, time, capacity, and
  fee if applicable.
- A registration form capturing attendee details, enforcing the stated capacity cap with an
  automatic waitlist once a session is full.
- Confirmation messaging by email and WhatsApp with session details.
- Reuses the landing page template's independently-editable content pattern (FR-4.2,
  FR-4.3) — a training page is structurally a landing page with a registration form instead
  of an enquiry form, not a new template type.
- A `training_registered` conversion event added to the existing measurement stack.

**What Phase 1 must keep open for this:** the landing page template's editable-region
pattern (FR-4.2) is built generically enough to swap in a registration form later without a
template rewrite.

---

### P2-6 CRM Integration

**Trigger:** The firm operating a CRM it actually maintains. Integrating with a system the
firm has not committed to running would automate neglect rather than solve it.

**What it includes:**

- A one-way (at minimum) sync of enquiry and diagnostic records into the firm's chosen CRM,
  so partners work from the CRM rather than checking the site's own enquiry log separately.
- Duplicate-detection logic (the same visitor completing the diagnostic more than once, or
  reaching out through more than one route) resolved before records reach the CRM, not left
  for a partner to catch manually.
- Which CRM the firm will run is not yet decided and is not decided here — that is a firm
  operating decision, not a build decision. What is decided here is that the enquiry data
  model is already field-structured (FR-2.5: full responses stored, not just contact
  details; FR-2.7: source and campaign attribution stored per record) specifically so a
  future CRM sync is a connector, not a data-model rework.

**What Phase 1 must keep open for this:** as stated above — the enquiry record's shape is
the thing that must not need to change later.

---

### P2-7 Full Diagnostic Suite as a Paid Product

**Trigger:** Evidence from the free Business Health Check that businesses complete it and
convert. Document 13.03 names this "the most commercially interesting item on the list" and
states it "is evaluated first" among all Phase 2 capabilities. The Phase 2 budget provision
(GHS 4,500, month nine of the firm's year-one plan) is earmarked specifically for this.

**What it includes:**

- The firm holds four diagnostic instruments in total — business, financial, operations and
  people (Document 13.03, Section 6). Only a short public business-and-financial version
  ships free at launch (FR-2.1–FR-2.8). This capability productises the full depth of all
  four as a paid, standalone deliverable.
- A deeper scored report than the free version: more questions per dimension, more
  dimensions (operations and people join business and financial), and a written report
  comparable in depth to what a partner would otherwise produce manually.
- Likely sold with a short follow-up review call with a partner included as part of the
  product, not just an automated report — consistent with the firm's stated differentiator
  of senior attention (Document 13.03, Section 3).
- Reuses the free diagnostic's scoring engine (FR-2.2) rather than building a second engine
  — the paid version is a larger configuration of the same engine (more questions, more
  dimensions, different thresholds), not a different system.
- Requires payment collection (P2-4) unless sold on invoice terms consistent with the
  firm's existing fee structure.

**What Phase 1 must keep open for this — the one binding architectural constraint on
Phase 1:** the scoring engine built for the free diagnostic (FR-2.2) must be built
generically enough to support more than four or five dimensions and more than twenty
questions, even though only the smaller free configuration ships at launch. Building the
engine as a fixed four-dimension, twenty-question tool would force a rebuild rather than a
reconfiguration when this trigger is met.

**Why this trigger is already measurable from day one:** the evidence this capability needs
— diagnostic completion rate and conversion to enquiry — is exactly what Phase 1's own
measurement stack tracks from launch (FR-2.6, FR-7.3, and the Section 15 KPIs in
`vision.md`). No additional instrumentation is needed later to know whether the trigger has
been met; it is a read of data the site is already collecting.

---

### P2-8 Subscriber Outreach via Brevo Campaigns

**Not from Document 13.03** — every other item in this Phase 2 list traces to Document
13.03, Section 14. This one doesn't: it surfaced during Phase 1 build itself, at T4.5
(Insights subscription capture), once a real `subscriber` table existed with real people's
consent in it and no plan anywhere — not in Document 13.03, not in any feature doc — for
actually reaching them again. Kept in this same gated, evidence-triggered list rather than
the ungated "Bonus additions" section below, because unlike the Performance Dashboards
bonus, this one genuinely shouldn't be built before there's a real list worth mailing.

**Trigger:** The Insights subscriber list reaches a size where composing and sending a
campaign by hand in Brevo's own dashboard is worth a partner's time. Until then, the
firm's two-articles-a-month cadence (Document 13.03, Section 7) is distributed through the
channels already in Phase 1 scope — the site itself, LinkedIn, and WhatsApp — and a
`subscriber` row is simply held, opted in, for the day this trigger is met.

**What it replaces:** Nothing currently live. Today, a `subscriber` row (T4.5) is captured,
stored, and sent exactly one email — its own subscription confirmation — and never contacted
again. This capability is what closes that gap; there is no existing method it displaces.

**What it includes:**

- The site's own `subscriber` table stays the sole system of record for consent — a
  subscriber opted in (or out) through the site's own dedicated, unticked capture form and
  one-click unsubscribe link (`insights-engine.md`'s FR-6.2 separation principle), never
  through Brevo's own signup mechanism.
- A one-way sync (site → Brevo) on every subscribe, re-confirmation, and unsubscribe, pushing
  the subscriber into a dedicated Brevo contact list via Brevo's own Contacts API — the same
  Brevo account already integrated for transactional email (T3.7), not a second provider
  relationship.
- One inbound webhook from Brevo, catching an unsubscribe, bounce, or spam complaint that
  happens on Brevo's own side (a real possibility — Brevo's own campaign emails carry
  Brevo's own required unsubscribe link too) and reflecting it back into the site's own
  `subscriber.unsubscribed_at`, so the two systems can never silently diverge either way.
- The actual campaign — composing the email, deciding when to send it, and reading its own
  open/click/unsubscribe performance — happens entirely inside Brevo's own dashboard, by a
  partner, never rebuilt inside kaalbert.com's own admin (ADR 0012). Reproducing a mature
  campaign editor, sender-reputation management, and compliance-required unsubscribe
  handling inside a hand-built admin is a large, ongoing undertaking for something this firm
  would use at most twice a month.
- The existing admin Subscribers list (T7.9, `content-management-admin.md`) gains a small
  "last synced to Brevo" indicator per row — a status view confirming the list is current
  before a partner composes a send in Brevo, not a compose/send interface of its own (the
  same pattern CRM Integration's `GET /admin/crm-sync-status` already establishes).
- No new measurement event: a Brevo campaign send/open/click/unsubscribe never touches a
  kaalbert.com page, so there is no `dataLayer` moment for GTM to observe. Brevo's own
  campaign statistics are the record of that activity, not GA4.

**What Phase 1 must keep open for this:** Nothing further. T4.5's `subscriber` model
(`email`, `consent`, `unsubscribe_token`, `subscribed_at`, `unsubscribed_at`) already carries
every field this sync needs — this capability is a pure additive integration layer once its
trigger is met, not a reason to change anything already shipped.

---

Any Phase 2 item beyond the Business Health Check integration requires a fresh decision and
fresh funding to schedule, per Document 13.03, Section 14 (P2-1 through P2-7) or, for P2-8
specifically, the same standing rule applied by this project's own convention rather than
that document — but none of them requires fresh planning. That work is done above.

## Bonus additions beyond Document 13.03

Capabilities offered beyond what the firm asked for, kept clearly separate from the Section
14 gated list above because they are not evidence-triggered in the same way — they are
additional value, not something the firm is waiting on a business signal to justify.

### Platform Performance Dashboards

Four independent, per-platform screens inside kaalbert.com's own admin (GA4, Meta, Google
Ads, LinkedIn) pulling each platform's aggregate performance metrics, so partners have one
place to check numbers instead of four external dashboards. Full spec:
`docs/features/platform-performance-dashboards.md`.

**Not part of Phase 1 launch and not an acceptance requirement in `AC/2026-09`.** Built only
after Phase 1 launch and acceptance are complete, so it can never block, delay, or compete
for priority against anything already agreed. Each platform is integrated independently, so
a stalled or denied integration on one platform (LinkedIn's Marketing API access is the most
likely candidate, given its historically selective approval process) affects only that one
screen, never the others.
