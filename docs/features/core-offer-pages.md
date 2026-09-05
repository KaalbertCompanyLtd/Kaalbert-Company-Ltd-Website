# Feature: Core Offer Pages

Phase 1. Document 13.03, Section 5; FR-4.1.

## Goal

Let a finance/operations lead or founder assess a specific offer's fit and cost before
involving a partner, by presenting the problem in their own language followed by concrete
evidence, deliverables, and price — never a vague service description (`user-stories.md`,
Story 4).

## User flow

1. Visitor reaches one of the three core offer pages (`/offers/business-health-check`,
   `/offers/financial-clarity-pack`, `/offers/funding-readiness-pack`) from Home, Capabilities,
   an Insights article, or a landing page.
2. Reads, in fixed order: the problem in client language; who it is/isn't for; the
   stage-by-stage method; named deliverables; required client inputs; indicative timeline;
   the published fee band and its scope cap; what's out of scope and the referral path; three
   to five real Q&As.
3. Reaches a single call to action (typically the diagnostic or Contact, parameterised to
   this offer).

## Business rules

- All ten content sections (FR-4.1) are present on every core offer page, in the fixed
  order given — this is a template constraint, not a per-page choice.
- The published fee band and its scope cap are always shown together, sourced from
  structured fields (never free text), so a fee can never be published without the cap that
  makes it a commitment the firm can hold (Document 13.03, Section 13).
- The out-of-scope/referral passage is mandatory per page (FR-5.3), sourced from the shared
  scope-of-practice content, not re-authored per offer.
- Exactly three offer pages exist at launch — the Advisory Retainer and the remaining five
  service lines are summarised on `capabilities-page.md`, not given their own pages
  (Document 13.03, Section 17, Item 3).

## Data requirements

- `offer` — id, slug, name, teaser, problem_statement, who_for, who_not_for, method_stages
  (ordered list), deliverables (list), client_inputs (list), indicative_timeline,
  fee_amount_min, fee_amount_max, fee_currency, scope_cap, out_of_scope_note, faqs (list of
  Q&A), cta_href, meta_title, meta_description (NFR-5; `seo-and-search-foundation.md`). Fee
  is a published band (every real offer's fee is a range, e.g. "GHS 9,000–19,000," never a
  single figure) — `fee_amount` as one field was an error corrected here;
  `StructuredFeeFieldEditor` (`components.md`) edits both bounds together with `scope_cap`,
  never separately. `teaser` (added at T2.1, `docs/tasks/02-public-presentation.md`) is a
  short, one-to-two-sentence summary distinct from the fuller `problem_statement` — it's what
  the home page's and Capabilities' offer cards render, since neither can reasonably show the
  full-page problem statement; a documentation gap found while building the home page's offer
  cards (see `memory/decision-log.md`).

**Known gap (T2.1, not yet resolved):** the Business Health Check offer has two real pricing
tiers (Express and Full, each its own fee band and deliverable set) that this single
`fee_amount_min`/`fee_amount_max`/`scope_cap` shape can't represent — see
`memory/technical-debt.md` → "Business Health Check's two-tier pricing has no real data model
yet." T2.2 must resolve this (likely a dedicated tier sub-entity) before building this
offer's full detail page.

## Interfaces

- `GET /offers/[slug]` — the offer page template, server-rendered.
- Editable via `content-management-admin.md`'s Offers screen (structured fee-band editing).

## Edge cases

- A fee band is edited without its scope cap: the admin form rejects the save (enforced in
  `content-management-admin.md`).
- An offer page is requested for a slug that doesn't exist (a fourth offer, before Phase 2
  gating is met): standard 404, never a silently-generated thin page.
- The Q&A list is empty during content migration: the section is omitted, not shown with
  placeholder questions (Document 13.03, Section 4 principle: complete and smaller beats
  present-but-empty).
