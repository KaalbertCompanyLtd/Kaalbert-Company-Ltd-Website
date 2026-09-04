# User Stories — kaalbert.com

One story per major user interaction, drawn from the audiences in `vision.md` and the
functional requirements in `requirements.md`. Acceptance criteria are given in
Given/When/Then form.

---

### 1. Understand fit within seconds

As a founder considering the firm, I want to understand within seconds of landing on the
homepage what the firm does, who it's for, and what to do next, so that I can quickly judge
fit without reading everything.

- **Given** a first-time visitor on Home
- **When** the page loads above the fold
- **Then** they see a statement of what the firm does, who it serves, and one primary call
  to action, without needing to scroll

---

### 2. Get an honest read on my business for free

As a founder unsure whether to engage a firm yet, I want to complete a short business health
check and see my results immediately, so that I get real value before committing to a phone
call.

- **Given** a visitor on `/diagnostic`
- **When** they answer all fifteen to twenty questions
- **Then** they see an on-screen score, their two or three weakest dimensions, and an
  indicative cost-of-inaction statement, without being asked for contact details first

---

### 3. Keep the result for later

As a founder who found the free result useful, I want to request a fuller written summary by
email, so that I have something to refer back to and share internally.

- **Given** a visitor on `/diagnostic/results`
- **When** they choose to request the full summary
- **Then** they are asked for contact details as a separate step, and the firm receives
  their full responses plus source attribution against the resulting enquiry

---

### 4. Assess a specific offer before involving a partner

As a finance or operations lead evaluating the firm before recommending it upward, I want to
see exactly what a specific offer includes, costs, and excludes, so that I can assess fit
and cost before involving a partner.

- **Given** a visitor on a core offer page (e.g. `/offers/business-health-check`)
- **When** they read the page
- **Then** they see the problem framed in their language, who it's for and not for, the
  stage-by-stage method, named deliverables, the published fee band and its scope cap, what
  sits outside scope and how it's referred, and three to five real questions and answers

---

### 5. Judge the firm's professional boundary

As a bank relationship manager assessing a client's adviser, I want to see the firm's
professional scope and boundary stated plainly, so that I can judge whether the firm
operates within appropriate limits.

- **Given** any page on the site
- **When** the visitor scrolls to the footer
- **Then** they see the scope-of-practice statement, stating Kaalbert is a business advisory
  firm, not a licensed audit, tax or legal practice, and that it connects clients to
  licensed practitioners where required

---

### 6. Find writing that speaks to my exact situation

As a founder reading about a specific business problem, I want to find an Insights article
that speaks directly to my situation, so that I build trust in the firm's expertise before
ever contacting them.

- **Given** a visitor on `/insights`
- **When** they filter by category or search
- **Then** they see relevant articles with a named partner author, and each article ends
  with a contextual next step tied to its subject

---

### 7. Share an article without it looking broken

As a founder who wants to share something useful with a co-founder, I want a shared Insights
article link to show a proper preview when pasted into WhatsApp, so that the person I send
it to trusts it enough to open it.

- **Given** a published Insights article URL
- **When** it is pasted into WhatsApp, LinkedIn or Facebook
- **Then** a correct preview card renders with title, description, and a
  correctly-dimensioned image

---

### 8. Reach out the way I actually communicate

As a founder who prefers messaging over forms, I want to contact the firm via WhatsApp
directly from a relevant page, so that I can reach out the way I actually communicate.

- **Given** a visitor on any page with a WhatsApp contact link
- **When** they click it
- **Then** WhatsApp opens with a pre-filled message identifying the page they came from, and
  a tracked click event fires

---

### 9. Judge whether the firm is worth joining

As a prospective partner or associate evaluating the firm, I want to see the firm's method
and the partners behind it in depth, so that I can judge whether this is a firm worth
joining.

- **Given** a visitor on `/our-method` or `/about`
- **When** they read the page
- **Then** they see the four-stage method explained in depth, and each partner with a real
  photo, named practice area, and accurately stated credentials

---

### 10. Act on a specific ad without distraction

As a visitor arriving from a paid advertisement, I want to land on a page with one clear
message and no distractions, so that I can act on the specific thing the ad promised.

- **Given** a visitor clicking a paid ad
- **When** they land on the corresponding `/lp/` page
- **Then** they see no full site navigation, one headline and message tied to the campaign,
  one call to action, and the full scope-of-practice footer statement

---

### 11. Publish an article without waiting on a developer

As a partner with no technical training, I want to publish a new Insights article myself, so
that I don't have to wait on or pay a developer for routine content updates.

- **Given** a partner in the CMS
- **When** they follow the written guide to create and publish a new article
- **Then** the article appears live on `/insights` without any code change or developer
  involvement

---

### 12. Launch a new campaign page without the vendor

As a partner with no technical training, I want to create a new landing page from the
template for a new campaign, so that the firm can launch new paid campaigns without the
vendor.

- **Given** a partner in the CMS
- **When** they create a new landing page from the template and set its headline and opening
  paragraph
- **Then** a new live `/lp/` page exists without a rebuild or developer involvement

---

### 13. Control what happens to my information

As a visitor whose personal or business information is collected by the diagnostic or an
enquiry form, I want to understand what happens to my data and be able to opt out of
marketing separately from being contacted about my enquiry, so that I retain control over my
information.

- **Given** a visitor completing the diagnostic or an enquiry form
- **When** they reach the consent step
- **Then** marketing consent is a separate, unticked checkbox distinct from consent to be
  contacted about their specific enquiry, and the privacy notice is reachable from the same
  page at a stable URL

---

### 14. Know which investments are working

As the firm's Lead Managing Partner, I want every enquiry the firm receives to be traceable
to the specific advertisement, article or page that produced it, so that I can judge which
investments are actually working.

- **Given** a visitor arrives via a tracked campaign link and later submits the diagnostic or
  an enquiry
- **When** the enquiry record is created
- **Then** it includes the original traffic source, campaign and landing page, persisted
  through the entire diagnostic journey

---

### 15. Not give up waiting for the page to load

As a mobile visitor on a mid-range Android phone on a slow connection, I want the site to
load quickly enough that I don't give up before it finishes, so that I actually see the
content the firm wants me to see.

- **Given** a visitor on a mid-range Android device over a 3G-equivalent connection
- **When** they load Home or any landing page
- **Then** Largest Contentful Paint occurs within 2.5 seconds

---

## Phase 2 User Stories (Gated)

Written now, to the same standard as the stories above, so that meeting a trigger does not
require writing these from scratch. See `scope.md` for the full capability plan behind each
one and `requirements.md`'s FR-9–FR-15 for the underlying functional requirements. None of
these is built until its stated trigger is met.

---

### 16. Book a first call without a back-and-forth message

_Gated on: FR-9, sustained enquiry volume costing partner time._

As a founder who just got a strong diagnostic result, I want to book a first call directly
with the right partner, so that I don't have to wait on a WhatsApp reply to find a time that
works.

- **Given** a visitor on `/diagnostic/results` with a completed diagnostic
- **When** they choose to book a call instead of only requesting the summary
- **Then** they see only slots that reflect the relevant partner's real availability, and a
  `consultation_booked` event fires with the same source attribution as their diagnostic
  session

---

### 17. Trust the firm because of who it's already helped

_Gated on: FR-10, written consent + 3 completed engagements._

As a founder comparing advisory firms, I want to read a real, named case study with a
measurable outcome, so that I can judge the firm's track record rather than take its word
for it.

- **Given** a visitor on the Case Studies index
- **When** they open a case study for an engagement with recorded consent
- **Then** they see the client's name, the problem, the engagement, a measurable outcome,
  and the partner who led it — and no engagement without recorded consent appears there

---

### 18. Exchange sensitive documents without email

_Gated on: FR-11, concurrent-engagement volume + documented confidentiality position._

As an active client mid-engagement, I want to upload and receive documents through a secure
portal instead of email, so that my financial information isn't sitting in an inbox.

- **Given** a client with an active engagement, logged into the portal with 2FA
- **When** they upload or download a document
- **Then** only the partner(s) assigned to that specific engagement can access it, and the
  action is recorded in the access log

---

### 19. Pay for a fixed-fee offer immediately, in the way I actually pay

_Gated on: FR-12, a productised fixed-fee offer sold without negotiation._

As a founder ready to buy a fixed-fee offer, I want to pay by Mobile Money on the spot, so
that I don't have to wait for an invoice-and-bank-transfer cycle to get started.

- **Given** a visitor who has accepted a named, fixed-fee offer
- **When** they choose to pay
- **Then** they can complete payment via Mobile Money or card, receive an invoice/receipt
  referencing the published fee band, and a `payment_completed` event fires

---

### 20. Register for a training session with confidence there's a seat

_Gated on: FR-13, a scheduled programme with dates and capacity._

As a founder interested in a training session, I want to register and know immediately
whether a seat is confirmed or I'm waitlisted, so that I can plan around it.

- **Given** a visitor on a training session page
- **When** they submit a registration
- **Then** they are confirmed if capacity remains or waitlisted if it does not, and a
  `training_registered` event fires

---

### 21. Have my enquiry show up where the partner actually works

_Gated on: FR-14, the firm operating a CRM it actually maintains._

As a partner working entirely out of the firm's CRM, I want new enquiries and diagnostics to
appear there automatically, so that I don't have to check the website separately.

- **Given** a new enquiry or completed diagnostic on the site
- **When** the record is created
- **Then** it syncs to the firm's CRM without manual re-entry, and a record already synced
  from the same visitor is not duplicated

---

### 22. Buy the full diagnostic, not just the free preview

_Gated on: FR-15, evidence the free diagnostic converts._

As a founder who found the free Business Health Check valuable, I want to buy the full
four-part diagnostic suite with a partner review call, so that I get a complete picture, not
just the business-and-financial preview.

- **Given** a visitor who has completed the free Business Health Check
- **When** they choose to purchase the full diagnostic suite
- **Then** they answer the deeper question set across all four instruments, receive a report
  covering all four scored dimensions, and a follow-up call with a partner is offered as
  part of the product
