# Roadmap — kaalbert.com

## How this is sequenced, and why

Every milestone below is picked for one reason: **what becomes visibly, clickably real for
the firm to see, as early as possible** — public presentation before internal business
process, so nobody waits on admin tooling, enquiry workflows, or dashboards nobody outside
the firm ever sees to know the site is taking shape. Within that constraint, every milestone
still ships end to end — a page that renders real content seeded by migration is a complete,
demoable milestone on its own, even before the admin screen that lets a partner _edit_ that
same content exists a milestone or two later. Nothing here is a stub with no way to fill it,
and nothing is an admin screen with no public page reading what it edits — that pairing was
audited explicitly (see the note at the bottom of `ui/screen-inventory.md`) before this
roadmap was written, precisely so this sequencing choice never produces an orphan in either
direction.

**Every UI task below builds to its accepted mockup file** — the files under `ui/mockups/`
are the authoritative visual and structural spec, not a proposal to re-derive from the feature
docs. Where a screen has no dedicated mockup (the ~52 screens marked "Can be inferred" in
`ui/screen-inventory.md`), the task says exactly which built screen's pattern it infers from,
per that document's own mapping — never guessed fresh.

Milestones 1–9 are Phase 1 (Document 13.03's launch scope) — built now, in this order.
Milestones 10–16 are Phase 2 (`scope.md`'s gated capabilities) — fully planned below, at the
same depth as Phase 1, but **not scheduled**: none begins until its own evidence trigger is
met (`scope.md`), per Document 13.03, Section 14. Milestone 9 (Performance Dashboards) is a
bonus, explicitly ordered last because Document 13.03 never asked for it and it must never
compete for priority against anything the firm did ask for.

## Phase 1 — built now

### Milestone 1: Foundation

**Goal:** A deployed, empty Next.js application with its schema, design tokens, and shared
layout shell in place — nothing user-visible yet, but everything after this milestone builds
on it without re-deciding it.
**Epic:** `tasks/01-foundation.md`

### Milestone 2: Public Presentation Layer

**Goal:** Every static/content-led public page live with real, migrated content — the whole
look, feel, and navigation of kaalbert.com clickable end to end, before a single admin screen
exists. Includes the SEO foundation (sitemap, Organization schema, per-page meta) as part of
making these pages complete, not a later add-on.
**Epic:** `tasks/02-public-presentation.md`

### Milestone 3: The Business Health Check Diagnostic

**Goal:** "The single most important conversion asset on the site" (Document 13.03) working
end to end for a real visitor — question flow, scoring, results, the gated summary-request
step — seeded via migration with the illustrative question set already built into the
mockups, flagged for firm review, not blocked on it.
**Epic:** `tasks/03-diagnostic.md`

### Milestone 4: Insights

**Goal:** The Insights index and article template live and reading real content — seeded
with the firm's actual eight articles once supplied (Document 13.03, Section 13), the
mockup's illustrative article standing in until then.
**Epic:** `tasks/04-insights.md`

### Milestone 5: Landing Pages & Measurement

**Goal:** The three landing page instances live, and the full measurement stack (GTM, GA4,
Meta CAPI, Google Ads, LinkedIn, consent mode, all six conversion events) wired and verified
— the site can now carry paid traffic and prove it's working, closing out everything Document
13.03 asked of the public-facing site.
**Epic:** `tasks/05-landing-and-measurement.md`

### Milestone 6: Admin Authentication

**Goal:** Partners can log in with TOTP and reach an authenticated shell. This is the first
milestone that exists purely for firm use, not a visitor — deliberately placed after every
public-facing thing already works, not before.
**Epic:** `tasks/06-admin-auth.md`

### Milestone 7: Content Management Admin

**Goal:** Every piece of content seeded by migration in Milestones 2–5 becomes
partner-editable without a developer (FR-8) — Articles, Categories, Pages, Offers, Landing
Pages, Team, Site Settings, Diagnostic Configuration, Subscribers. This is where "firm usage"
genuinely begins; everything before it was usable by a visitor with nothing to administer yet.
**Epic:** `tasks/07-content-admin.md`

### Milestone 8: Enquiry Management

**Goal:** Partners can see, triage, and act on incoming enquiries and diagnostic completions
in one place.
**Epic:** `tasks/08-enquiry-management.md`

### Milestone 9: Platform Performance Dashboards (Bonus)

**Goal:** A convenience beyond what was asked — never built until Phase 1 launch and
acceptance are complete, so it can never compete with anything above it.
**Epic:** `tasks/09-performance-dashboards.md`

---

## Phase 2 — fully planned, gated on evidence (not scheduled)

Each milestone below is specced to the same depth as Phase 1 (`scope.md`'s standing
instruction), so meeting a trigger converts directly into scheduled work, not a fresh
planning cycle. **None of these begins until its trigger is met and fresh funding is agreed**
(Document 13.03, Section 14).

### Milestone 10: Online Appointment Booking — P2-1

**Trigger:** Sustained enquiry volume where scheduling by message is genuinely costing
partner time. **Epic:** `tasks/10-booking.md`

### Milestone 11: Named Case Studies & Testimonials — P2-2

**Trigger:** Written client consent on file, and at least three completed engagements with
measurable outcomes. **Epic:** `tasks/11-case-studies.md`

### Milestone 12: Client Portal — P2-3

**Trigger:** Enough concurrent engagements to justify it, and a documented
confidentiality/security review complete — Document 13.03's "highest-risk item on the list."
**Epic:** `tasks/12-client-portal.md`

### Milestone 13: Online Payment — P2-4

**Trigger:** A productised, fixed-fee offer sold without negotiation. **Epic:**
`tasks/13-online-payment.md`

### Milestone 14: Training Registration — P2-5

**Trigger:** A scheduled programme with dates and capacity. **Epic:** `tasks/14-training.md`

### Milestone 15: CRM Integration — P2-6

**Trigger:** The firm operating a CRM it actually maintains. **Epic:** `tasks/15-crm.md`

### Milestone 16: Full Diagnostic Suite as a Paid Product — P2-7

**Trigger:** Evidence the free diagnostic converts — "evaluated first" among all Phase 2
capabilities (Document 13.03). **Epic:** `tasks/16-paid-diagnostic-suite.md`

### Milestone 17: Subscriber Outreach via Brevo Campaigns — P2-8

**Goal:** Give the firm an actual way to reach the people who subscribe to Insights (T4.5)
— not from Document 13.03, surfaced during Phase 1 build once real subscriber consent
existed with no distribution mechanism planned; see `scope.md`'s P2-8 for the full account.
**Trigger:** The subscriber list reaches a size where composing and sending a campaign by
hand in Brevo's own dashboard is worth a partner's time. **Epic:**
`tasks/17-subscriber-outreach.md`
