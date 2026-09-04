# Project Health Dashboard — 2026-09-04

**Project Name:** kaalbert.com (Kaalbert & Company Ltd Website)
**Current Phase:** Planning complete / Ready for implementation

## Artifacts Produced

| Phase   | Documents                                                                    | Status   |
| ------- | ---------------------------------------------------------------------------- | -------- |
| Phase 1 | vision.md, requirements.md, user-stories.md, scope.md                        | Complete |
| Phase 2 | research/\*.md, summary.md                                                   | Complete |
| Phase 3 | architecture.md, adr/\*.md (11 ADRs)                                         | Complete |
| Phase 4 | features/\*.md (23 feature docs)                                             | Complete |
| Phase 5 | ui/\*.md, ui/mockups/\*.html (77 screens: 25 dedicated mockups, 52 inferred) | Complete |
| Phase 6 | roadmap.md, tasks/\*.md (16 epics, 9 Phase 1 + 7 Phase 2), dashboard.md      | Complete |

## Pre-Phase-6 audit (why this took an extra pass)

Before writing `roadmap.md`/`tasks/*.md`, two parallel audits ran against Document 13.03 +
Company Docs and against the UI↔backend cross-reference, per explicit instruction to surface
every gap before task planning rather than during implementation. Both audits found real gaps;
all were closed before this document was produced:

- **SEO/Search Foundation** was undocumented — closed with the new
  `docs/features/seo-and-search-foundation.md` (sitemap, Organization schema, per-page meta
  distributed across every page-type entity) and folded into `tasks/02-public-presentation.md`.
- **Insights subscription** (one of Document 13.03's two named secondary capture routes) had
  no entity or endpoints — closed in `insights-engine.md` and `tasks/04-insights.md`.
- **Copy-approval governance** (Document 13.03 §8.2's Lead-Managing-Partner reserved matter)
  had no build owner — closed with an explicit compliance-checkbox gate on Publish, plus a
  documented decision that role-based approval routing is deliberately not built (firm process,
  not software, at 5 partners).
- **Backup/restore policy** was undocumented — closed with new `adr/0011-backup-retention-and-
restore-testing.md` (Railway native PITR, 4-week window, quarterly real restore test).
- **Systemic Phase 2 admin-screen gap**: five gated features (Booking, Case Studies, Client
  Portal, Payment, Training) each had a public/visitor-facing side but no admin screen that
  _creates_ the underlying record — closed across all five `docs/features/*.md` files and
  `ui/screen-inventory.md` (9 new admin screens added, all classified "can be inferred," none
  needing a dedicated new mockup).
- **Capabilities/Our Method admin content area**: no entity existed for these pages' own
  hero/intro copy — closed by introducing a shared `page` entity, now the home for their SEO
  meta fields too.
- **`offer` entity bug**: `fee_amount` was a single field despite every real offer being a
  published range — split into `fee_amount_min`/`fee_amount_max`; the admin offer-editor
  mockup was also missing five real fields the live public page already renders
  (`who_for`/`who_not_for`/`client_inputs`/`indicative_timeline`/`faqs`) — both fixed and
  verified in-browser.

Full detail lives in the git history of the affected files; this dashboard records that the
audit happened and closed clean, not the blow-by-blow.

## Decisions made during task planning itself (not left open)

Three items were explicitly deferred by their feature docs to "Phase 6 task planning" or
flagged as needing a firm-policy call. Two were technical implementation details within
engineering's own authority, decided here rather than carried forward as an open question:

- **Attribution retention window: 90 days** (`tasks/05-landing-and-measurement.md`, T5.4) —
  matches GA4/Meta's own standard attribution lookback.
- **Admin session timeout: 30 min inactivity / 12 hr absolute** (`tasks/06-admin-auth.md`,
  T6.3) — matches the confidentiality bar Document 13.03 §10 holds the platform to.

One is genuinely a firm decision, not engineering's to make, and is carried forward as a real
blocker rather than assumed — see **Blocked On** below.

**Decisions Made:** 11 ADRs (Phase 3) + 2 task-planning-stage technical decisions above = 13
**Technical Debt:** None recorded yet (pre-implementation) — `content-management-admin.md`
already flags one known-simplification-in-advance (last-write-wins on simultaneous page edits,
accepted for 5 partners/low edit frequency) to be logged in `memory/technical-debt.md` the
moment implementation begins, per that doc's own note.
**Known Bugs:** None (pre-implementation)

**First Task:** `tasks/01-foundation.md`, T1.1 — Repo, Next.js app, and deploy pipeline
**Blocked On:** Nothing for Phase 1 (Milestones 1–9) — fully unblocked, sequenced, and ready
to start at T1.1. Two items are blocked within later scope, both flagged rather than assumed:

- `tasks/08-enquiry-management.md` T8.4 (personal-data deletion for a _converted_ enquiry) —
  blocked on the firm confirming the retention/deletion boundary; not an engineering gap.
- `tasks/16-paid-diagnostic-suite.md` (P2-7, gated) — blocked on its own evidence trigger
  (free-diagnostic conversion data), plus an open refund-policy question flagged for the firm
  before T16.2/T16.3 build.

**Scope Status:** In scope for v1 — Milestones 1–9 (`roadmap.md`), as defined in `scope.md`'s
Phase 1 launch scope. Milestones 10–16 are fully planned but explicitly out of v1 scope until
their individual `scope.md` triggers are met — none scheduled, none to be pulled forward.

## Sequencing note (why this order)

Every milestone was chosen for one reason: what becomes visibly, clickably real for the firm
to see, as early as possible — public presentation (Milestones 1–5) before internal business
process (Milestones 6–8), with the unrequested bonus (Milestone 9) strictly last. Every UI
task cites its accepted mockup file directly; every task pair (a write with no reader, or a
reader with no writer) was checked during the pre-Phase-6 audit and closed before this roadmap
was written — see the audit section above.
