# Requirements — kaalbert.com

Canonical requirements register for the build. Originates from Document 13.03 (Website
Strategy and Build Requirements) and the vendor's Software Requirements Specification
(`../../Vendor Response/01 Software Requirements Specification.docx`, SRS/2026-09); numbering
is kept consistent with that document so the two stay cross-referenceable.

## Functional Requirements

### FR-1 Site Structure & Navigation

1. The system shall present the page inventory defined in `../../Vendor Response/02 Sitemap.docx`
   (SM/2026-09), with primary navigation limited to the sections named there.
2. The Capabilities page shall list all eight service lines in summary form, each linking to
   an enquiry route parameterised by service line, rather than to a dedicated page of its own.
3. Campaign landing pages shall render without the main site's full navigation.

### FR-2 Business Health Check (Diagnostic)

1. The system shall present a configurable multi-step question flow of fifteen to twenty
   questions, completable in under six minutes, covering structure, records, cash, controls,
   funding readiness and owner dependence, in plain business language.
2. The system shall score responses across four or five dimensions using a configurable
   scoring engine, with questions, dimensions, weights and thresholds held as data rather
   than hard-coded, so the firm's finalised scoring logic can be loaded without a rebuild.
3. On completion, the system shall display an on-screen result immediately, without
   requiring contact details, showing the score, the two or three weakest dimensions, and an
   indicative statement of what that typically costs a business of similar shape.
4. The system shall offer a fuller written summary by email as a second and separate step
   from FR-2.3, capturing contact details only at that point.
5. The system shall store the complete set of diagnostic responses, not only contact
   details, against the resulting enquiry record.
6. The system shall evaluate each completed diagnostic against defined triage thresholds and
   flag high-priority responses for the partner reviewing the enquiry.
7. The system shall write the traffic source, campaign and landing page associated with each
   diagnostic session into the enquiry record, consistent with FR-7.7.
8. The result screen shall display the required disclaimer language verbatim: an indicative
   self-assessment based on user-supplied information, not a professional opinion, not to be
   relied upon by any third party.

### FR-3 Insights

1. The system shall provide an Insights index with category filtering, search, and
   related-article suggestions.
2. The article template shall support tables, pull quotations, figures, and downloadable
   resource attachments.
3. Every article shall display a named partner author with photograph and stated practice
   area.
4. Every article shall end with a contextual next step specific to its subject, not a
   generic contact prompt.
5. Every article and every page shall carry complete Open Graph and Twitter Card metadata,
   including a correctly-dimensioned preview image, verified by test-sharing a live link on
   WhatsApp, LinkedIn and Facebook.
6. The content system shall perform without degradation to list, search or filter response
   time at a minimum of one hundred published articles.

### FR-4 Core Offer & Landing Pages

1. Each of the three core offer pages shall present, in sequence: the problem in client
   language; who it is and is not for; the stage-by-stage method; named client deliverables;
   required client inputs; indicative timeline; the published fee band and its scope cap,
   unaltered; out-of-scope items and referral path; three to five real questions and
   answers; one call to action.
2. The landing page template shall support an independently-editable headline and opening
   paragraph, distinct from the rest of the page body, so one template serves multiple
   campaigns without a rebuild.
3. A non-technical partner shall be able to create a new landing page instance from the
   template without vendor involvement.

### FR-5 Claims, Scope & Compliance Controls

1. The system shall render the scope-of-practice statement in the footer of every page,
   including every landing page, from a single site-wide source, so a wording change
   propagates to every occurrence at once.
2. The system shall render company registration details in the footer once the firm
   supplies them post-incorporation.
3. Each core offer page shall carry the out-of-scope and referral passage required by the
   firm's claims and compliance policy.
4. No page, landing page or advertisement copy shall be marked publishable without a
   recorded firm sign-off; copy approval is a reserved matter held by the firm, not by the
   build team.

### FR-6 Data Protection

1. The system shall present a cookie consent mechanism before any non-essential analytics or
   advertising script executes.
2. The system shall capture separate, unticked, explicit consent for marketing
   communication, distinct from consent to be contacted about a specific enquiry.
3. The system shall encrypt all submitted data in transit and restrict access to submitted
   data to named partner accounts.
4. The system shall enforce a documented retention period on stored enquiry and diagnostic
   data, and support deletion of a given individual's data on request.
5. The privacy notice shall be reachable from every page and every landing page at one
   stable URL, live before the site is publicly reachable.

### FR-7 Measurement & Attribution

1. All analytics and advertising tags shall be deployed through a single tag-management
   container under firm-owned credentials, addable or removable without a code change.
2. Consent state captured under FR-6.1 shall be passed to analytics and advertising tags as
   consent mode, not merely used to block those tags outright.
3. The system shall fire six named conversion events — diagnostic started, diagnostic
   completed, summary requested, checklist downloaded, enquiry submitted, WhatsApp opened —
   as distinct, individually verifiable events, each defined as a GA4 key event.
4. The system shall install the Meta pixel and a server-side Conversions API connection for
   the same six events, with event deduplication configured so no conversion is counted
   twice.
5. The system shall define Google Ads conversion actions imported from analytics, covering
   the same six events.
6. The system shall install the LinkedIn Insight Tag through the shared tag container.
7. Campaign parameters on an inbound link shall persist across the full multi-step
   diagnostic flow and be written into the enquiry record together with the completed
   submission.
8. Every WhatsApp contact link shall carry a pre-filled message identifying its originating
   page and shall fire a tracked click event on interaction.
9. kaalbert.com shall be verified in the firm's Meta Business Manager and in Google Search
   Console, under firm-owned accounts, before handover.

### FR-8 Content Management

1. A partner with no technical training shall be able to, unsupervised and without
   contacting the developer: publish a new Insights article; edit existing page copy; update
   a published fee range; and create a new landing page instance from the template.

## Phase 2 Functional Requirements (Gated)

Fully specified now, alongside Phase 1, so that meeting a trigger converts directly into
scheduling and build rather than fresh requirements work. None of these is built until its
stated trigger is met — see `scope.md` for the full capability plan each group summarises.
Numbering continues from FR-8 and is reserved for these groups even before they are built,
so a future feature spec in `features/` can reference a stable FR number.

### FR-9 Online Appointment Booking — gated on sustained enquiry volume costing partner time

1. The system shall offer a booking step from `/contact` and from `/diagnostic/results`,
   routed to a specific partner by practice area or originating service line.
2. Bookable slots shall be configured against each partner's actual committed capacity, not
   presented as an open, unlimited calendar.
3. The system shall sync against each partner's own calendar to prevent double-booking.
4. The system shall fire a `consultation_booked` conversion event through the existing
   measurement stack (extends FR-7.3–FR-7.6), carrying the same source/campaign attribution
   as FR-7.7.

### FR-10 Named Case Studies and Testimonials — gated on written consent + 3 completed engagements

1. The system shall provide a Case Studies index and article-style template, reusing the
   Insights content engine (FR-3.1–FR-3.6) rather than a second content system.
2. Each case study shall display client name/logo only where a consent flag is recorded as
   true against that engagement.
3. Testimonials shall appear as pull-quotes within case studies, not on a standalone
   testimonials page.
4. Anonymised engagement summaries (present at launch) shall remain live for any engagement
   without recorded consent.

### FR-11 Client Portal — gated on concurrent-engagement volume + documented confidentiality position

1. The system shall provide an authenticated area scoped to a single engagement per client
   session; a client shall never see another engagement's overview, requests, documents,
   deliverables, messages, or team.
2. Access to an engagement's data shall be restricted to the partner(s) assigned to that
   specific engagement.
3. The system shall log every document access, download, message, and account change with
   actor, timestamp and action.
4. The system shall require two-factor authentication on every client portal account.
5. The system shall encrypt engagement documents at rest, in addition to the in-transit
   encryption required generally under FR-6.3.
6. The system shall support more than one named user per engagement, each with a `primary`
   or `member` role; only a `primary` user or the firm may invite or remove other users on
   that engagement.
7. The system shall present a structured checklist of outstanding information requests per
   engagement, and a deliverables tracker seeded from the relevant offer's named deliverables
   (FR-4.1).
8. The system shall support engagement-scoped messaging between a client and their assigned
   partner(s), with no firm-wide or cross-engagement inbox.
9. The system shall support ordinary account self-service for portal users: profile editing,
   notification preferences, password change, and self-service password reset via a
   time-limited, single-use emailed link — none of which resets two-factor enrolment, which
   requires the same firm-mediated reset path as an administrative account.
10. A documented retention and deletion policy for engagement documents and messages shall
    exist before this capability is built, not be inferred afterward.

### FR-12 Online Payment — gated on a productised, fixed-fee offer sold without negotiation

1. The system shall support payment collection at the point a client accepts a fixed-fee,
   named offer.
2. The system shall support Mobile Money payment (MTN MoMo, Vodafone Cash, AirtelTigo Money)
   as a primary method, alongside card payment.
3. The system shall generate an invoice/receipt on successful payment, referencing the
   specific published fee band paid against.
4. The system shall fire a `payment_completed` conversion event through the existing
   measurement stack.

### FR-13 Training Registration — gated on a scheduled programme with dates and capacity

1. The system shall list upcoming training sessions with date, time, capacity and fee.
2. The system shall capture attendee registration against a session and enforce its stated
   capacity, waitlisting registrations once full.
3. The system shall reuse the landing page template's editable-region pattern (FR-4.2)
   rather than a new template type.
4. The system shall fire a `training_registered` conversion event through the existing
   measurement stack.

### FR-14 CRM Integration — gated on the firm operating a CRM it actually maintains

1. The system shall support a one-way sync of enquiry and diagnostic records to a
   firm-operated CRM.
2. The system shall detect and resolve duplicate records (the same visitor reaching the firm
   through more than one route) before records are synced.

### FR-15 Full Diagnostic Suite as a Paid Product — gated on evidence the free diagnostic converts

1. The system shall support a paid configuration of the diagnostic scoring engine (FR-2.2)
   covering all four of the firm's diagnostic instruments (business, financial, operations,
   people), not only the two shipped free at launch.
2. The paid configuration shall support more dimensions and more questions than the free
   configuration, using the same underlying engine rather than a separate one.
3. The system shall support attaching a partner follow-up review call to the paid product,
   consistent with the firm's senior-attention positioning.
4. This capability's trigger evidence (diagnostic completion rate, conversion to enquiry) is
   already produced by FR-2.6 and FR-7.3 at Phase 1 launch — no additional instrumentation
   is required to evaluate whether the trigger has been met.

## Non-Functional Requirements

- **NFR-1 Performance** — Largest Contentful Paint under 2.5 seconds on a mid-range Android
  device over a 3G-equivalent connection, on every page including every campaign landing
  page. Page weight under 1.5 MB for a typical page including images.
- **NFR-2 Accessibility** — WCAG 2.1 Level AA, including contrast ratios verified against the
  brand palette, full keyboard navigation, and labelled form fields throughout, including
  the diagnostic flow.
- **NFR-3 Security** — HTTPS enforced throughout; current platform and dependency versions
  maintained; administrative access behind two-factor authentication; automated daily
  backups with a periodically tested restore procedure.
- **NFR-4 Browser & Device Coverage** — Current Chrome, Safari, Firefox and Edge; Android
  from version 10; iOS from version 15; verified on a physical mid-range Android handset,
  not an emulator alone.
- **NFR-5 Search Foundation** — Clean URL structure; unique title and meta description per
  page; XML sitemap; structured data for organisation and articles; complete Open Graph and
  Twitter Card tags on every page; Google Business Profile connected; Google Search Console
  verified and handed to the firm.
- **NFR-6 Data Protection & Privacy** — As FR-6, standing as a constraint on every future
  change to the site, not a one-time build condition.
- **NFR-7 Maintainability** — The content-publishing tasks in FR-8 must not require a code
  change or developer involvement at any point. The chosen technology stack, and the
  reasoning for who can maintain it in Accra if the vendor relationship ends, is documented
  in `research/summary.md` at the end of Phase 2.
- **NFR-8 Availability & Resilience** — Automated daily backups with a periodically tested
  restore; uptime monitoring under the ongoing support arrangement.
- **NFR-9 Portability & Ownership** — All hosting, content-management, analytics,
  advertising and email accounts are created under firm-owned credentials with the firm as
  owner and the build team as a removable user. All intellectual property vests in the firm
  on payment. Third-party components are licensed so the firm can continue and modify the
  site without further payment.

## Constraints

1. **Budget** — GHS 9,000 for Phase 1 design and build; GHS 4,500 for the Phase 2 Business
   Health Check integration, gated on the evidence trigger in `scope.md`; GHS 150 a month
   ongoing hosting and maintenance. Full scope is committed within the Phase 1 figure — see
   `../../Vendor Response/03 Quotation.docx`.
2. **Timeline** — Launch targeted for the end of month five of the firm's year-one plan. See
   `../../Vendor Response/04 Timeline.docx` for the full content and build schedule.
3. **Content dependency** — Build cannot complete without the eleven content items named in
   Section 13 of Document 13.03, each with a named firm-side owner and a dated deadline in
   the Timeline document. Build order is sequenced so a late item delays only the page or
   feature it feeds.
4. **Regulatory dependency** — The firm's Data Protection Commission registration and the
   legally-drafted privacy notice, cookie notice, terms of use and scope statement are firm
   actions with counsel input, not build deliverables. The site cannot become publicly
   reachable before they are supplied and DPC registration is complete.
5. **Account ownership** — Every hosting, analytics, advertising, domain and email account is
   created under firm-owned credentials from day one; the build team never holds primary
   ownership of any account or asset produced under this engagement.
6. **Copy governance** — No page, landing page or advertisement is published without firm
   sign-off; copy approval is a reserved matter held by the firm.
