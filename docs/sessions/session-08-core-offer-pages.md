# Session 08 — Core Offer pages, custom error pages

# Date: 2026-09-05

# Tasks completed: T2.2, T2.10

## What Was Built

The three real `/offers/[slug]` core offer pages (`app/offers/[slug]/page.tsx`), built to
their own `ui/mockups/a-public-site/offer-*.html` files and rendering FR-4.1's 10 fixed
sections in order for Business Health Check, Financial Clarity Pack, and Funding-Readiness
Pack. This session also resolved the Business Health Check two-tier pricing gap flagged at
T2.1, extended the `Offer` entity with every remaining `core-offer-pages.md` field, and wired
`SiteHeader`'s Core Offers nav fee hints to live data (T1.5/T2.1's own deferred note).

After T2.2 was committed, the user asked for custom 404/error pages in this same session
("having the empty pages call the default 404 page is not nice since the site is deployed"),
so a second task (T2.10, added to the epic file mid-session since it wasn't originally
planned) built `app/not-found.tsx`, `app/error.tsx`, and `app/global-error.tsx`, and fixed
`app/layout.tsx`'s root metadata (still `create-next-app`'s literal scaffold default). While
verifying `not-found.tsx` with Playwright MCP, a real transient DNS failure against Railway's
Postgres proxy made a DB-backed version of it hang for over a minute — fixed by removing the
live data fetch entirely, since a fallback/error surface must have fewer runtime dependencies
than what it's standing in for, not the same ones (see `memory/decision-log.md`).

## Files Changed

- `prisma/schema.prisma` — extended `Offer` with the full `core-offer-pages.md` field set
  plus `ctaLabel`; new `OfferTier` model (resolves the two-tier pricing gap)
- `prisma/migrations/20260905113754_t2_2_offer_full_content_and_tiers/`,
  `prisma/migrations/20260905114536_t2_2_offer_tier_scope_cap/` — new migrations, hand-edited
  to a nullable-then-backfill-then-NOT-NULL pattern against T2.1's existing 3 seeded rows
  (no destructive `DELETE`/reset used)
- `prisma/seed.ts` — `seedOffers()` now carries every field with a real `update:` clause
  (fixed a latent no-op-on-reseed bug in the previous `update: {}`); new `seedOfferTiers()`
- `lib/offers.ts` — new: `getOfferBySlug`, `getOfferNavLinks`, `formatFeeHint`,
  `formatFeeBand`, `MethodStage`/`OfferFaq` types
- `app/offers/[slug]/page.tsx` — new: the offer detail page template
- `components/site-header.tsx` — `CORE_OFFERS` renamed `FALLBACK_CORE_OFFERS` (kept as an
  optional-prop fallback for T1.5's dev scratch pages); new `offerNavLinks` prop
- `app/(public)/page.tsx` — passes live `getOfferNavLinks()` to `SiteHeader`
- `docs/features/core-offer-pages.md` — documented `offer_tier`, `cta_label`, and the
  indicative-timeline sourcing decision
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.2 (omitted checklist cross-promo)
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — this
  session's entries

**T2.10:**

- `app/not-found.tsx` — new: branded 404, catches unmatched routes and `notFound()` calls,
  zero runtime dependencies (no live data fetch, see Decisions Made)
- `app/error.tsx` — new: branded runtime-error boundary ("use client", `reset()` action)
- `app/global-error.tsx` — new: minimal, fully self-contained root-layout-crash fallback
- `app/layout.tsx` — root `metadata` fixed from create-next-app's scaffold default
- `app/offers/[slug]/page.tsx` — `generateMetadata`'s missing-offer branch now returns
  `NOT_FOUND_METADATA` (exported from `app/not-found.tsx`) instead of `{}`
- `docs/tasks/02-public-presentation.md` — new T2.10 entry
- `memory/completed-work.md`, `memory/decision-log.md` — this task's entries

## Decisions Made

- Business Health Check's two-tier pricing modelled as a new `OfferTier` relation (Express/
  Full rows), not a schema change to `Offer` itself — the other two offers' `tiers` relation
  stays empty and they keep using `Offer`'s own flat fields. See `memory/decision-log.md`.
- The two single-tier offers' `indicative_timeline` (FR-4.1-required, but not visually
  surfaced in either mockup) was sourced from `Company Docs/05.04 Rate Card.docx`'s real
  Offer/Duration/Fee/Scope table (Financial Clarity Pack: "3 to 5 weeks"; Funding-Readiness
  Pack: "3 to 6 weeks") rather than fabricated or omitted.
- Added `ctaLabel` to `Offer` (the doc only named `cta_href`) since the fee-panel CTA's button
  text is real, firm-editable copy that differs per offer.
- The Funding-Readiness Pack mockup's `.checklist-panel` cross-promo (linking to a Milestone 5
  landing page that doesn't exist yet) was deliberately omitted rather than linked to a route
  that would 404 — logged as technical debt, sequenced into T5.2.
- The bottom "soft re-engagement" CTA section's per-offer copy (differs across all three
  mockups) was kept as a small fixed const map in `app/offers/[slug]/page.tsx` rather than a
  new `Offer` field, since it isn't part of FR-4.1's 10 documented fields and exactly three
  offers will ever exist at launch.
- `components/site-header.tsx`'s `offerNavLinks` prop is optional (falls back to the old
  hard-coded array) so T1.5's dev scratch pages under `app/dev/layout-shell/*` keep working
  without a DB read; every real public page now passes live data.

**T2.10:**

- `app/not-found.tsx` deliberately doesn't fetch live `getOfferNavLinks()` even though it
  could (unlike `error.tsx`, it's a Server Component) — a real transient DNS failure against
  Railway's Postgres proxy during verification made a DB-backed version hang for over a
  minute. It renders via `SiteHeader`'s existing `FALLBACK_CORE_OFFERS` default instead
  (T2.2), so it has zero runtime dependencies. See `memory/decision-log.md`.
- `app/global-error.tsx` (the root-layout-crash fallback) doesn't reuse `SiteHeader`/
  `SiteFooter` at all — it's the one surface where even those components' own dependencies
  (however minimal) are one too many, since it stands in for the app shell itself failing.
- Not part of the epic's original task list — added mid-session at explicit user direction,
  given its own task ID (T2.10) after the fact for a permanent record.

## Current State

All three core offer pages are live, database-driven, and verified end-to-end (desktop/
tablet/mobile, FAQ accordion multi-open behaviour, mobile drawer, live nav fee hints, and a
real 404 for an unknown slug) via Playwright MCP. Custom 404/runtime-error/root-layout-crash
pages are live and verified the same way, none dependent on the database. Milestone 2 (Public
Presentation Layer) has two of nine originally-planned tasks complete (T2.1, T2.2) plus one
unplanned addition (T2.10); Capabilities is next.

## Blockers

None. One open technical-debt item (Funding-Readiness Pack's checklist cross-promo, sequenced
into T5.2) — not a blocker for this or any other Milestone 2 task.

## Next Task

T2.3 — Capabilities page
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.3 — Capabilities page

## What to build
`/capabilities` to `ui/mockups/a-public-site/capabilities.html`, reading the shared `page`
entity (hero_kicker/hero_heading/hero_lead/meta_title/meta_description) plus the 8
`capability` rows (`docs/features/capabilities-page.md`).

## Input → Output contract
Migrated `page` row (slug: capabilities) + 8 `capability` rows → rendered page matching the
mockup, 8 service lines in the mockup's defined order.

## Acceptance criteria
All 8 capabilities render with correct copy sourced from Company Docs; meta tags populated
from the `page` entity.

## Size / Dependencies
M, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and composed directly
by every public page — there is no shared `(public)` layout, per T2.1's precedent; T2.2 also
established the pattern of passing a live `offerNavLinks` prop, fetched via
`lib/offers.ts`'s `getOfferNavLinks()`, into every `SiteHeader` instance on a real public
page — this page must do the same, not revert to the old hard-coded fallback), T2.9 (seed
data — no `page` or `capability` rows exist yet; this task must seed them itself, per T2.1's
own precedent of doing its own epic's seed work when nothing else has yet).

## Architecture constraints
- **The mockups are authoritative.** Build to `ui/mockups/a-public-site/capabilities.html`'s
  structure and copy exactly — don't invent layout.
- **Responsive is built in from a component's first implementation, never a later pass.** The
  mockup is desktop-only — this page must also work at mobile (~375–430px) and tablet
  (~768px) before being called done, using the design system's existing spacing/stacking
  patterns (`ui/design-system.md`). `SiteHeader`'s own mobile drawer nav is already handled
  (T1.5) — this task's own responsive work covers the 8-capability grid and the Advisory
  Retainer's own summary block.
- **Feature docs are the data/interface contract.** `capabilities-page.md`'s "Data
  requirements" section — `capability` (id, name, slug, short_description, order),
  `advisory_retainer` (a singleton: fee_amount, fee_currency, billing_period, description),
  and the shared `page` entity (id, slug, hero_kicker, hero_heading, hero_lead, meta_title,
  meta_description) — every field maps to a Prisma schema field of the same name. This is the
  first task to introduce the shared `page` entity CLAUDE.md's Recurring Patterns section
  describes ("the home for a marketing page's own copy when it has no other entity to attach
  to") — `our-method-page.md` (T2.4) reuses the same `page` model with an added `intro_copy`
  field, so design it as a real shared model from the start, not a capabilities-specific one.
- Business logic (resolving the `page` row by slug, ordering `capability` rows, formatting
  the Advisory Retainer's fee) lives in `lib/`, never inline in the page component.
- **Add `export const dynamic = "force-dynamic";` to `app/capabilities/page.tsx`.** Hit for
  real at T2.1 (see `memory/decision-log.md`): without it, Next.js may statically prerender a
  page at build time whenever it sees no dynamic API used, and on Railway the build container
  can't reach the private-network database host production reads use — the build fails
  outright. Standing CLAUDE.md Code Conventions rule for every page reading seeded content.
- **Content the firm can change lives in the database, never hard-coded** — every piece of
  copy this page renders (hero text, all 8 capability summaries, the Advisory Retainer's own
  description and fee) comes from the seeded `page`/`capability`/`advisory_retainer` rows,
  not literal strings in the component.
- **The Advisory Retainer's fee follows the same structured-field discipline as the three
  core offers** (`capabilities-page.md`'s business rules) — an amount, a currency, and a
  billing period as real fields, never free text folded into page copy. This is a single
  recurring amount + billing period, not a min/max band like the three core offers' fees
  (`core-offer-pages.md`'s band shape doesn't apply here — a retainer is priced as one figure
  per period, per the feature doc's own field list: `fee_amount`, not `fee_amount_min/max`).
- **Every service-line link routes to `/contact?service=[slug]`** (`capabilities-page.md`'s
  business rule, FR-1.2) — not a dedicated page per capability. `/contact` itself isn't built
  until T2.6; this task only needs the outbound links to be correctly formed with each
  capability's slug as the query param, per the documented edge case (an unrecognised
  `service` value is Contact's problem to handle as "no parameter," not this task's).
- **Every public page type carries `meta_title`/`meta_description`** — this task owns this
  page's own tags (per T2.1's established split: OG/Twitter and sitewide Organization JSON-LD
  are T2.8's job, not this task's).
- **Never a hard-coded measurement/advertising tag outside GTM** — this page fires no
  `dataLayer.push` of its own.
- Handle the documented edge case exactly: a capability's slug that doesn't match any
  expected value on Contact is Contact's own problem (treated as no parameter/general
  enquiry there, per that task's future edge-case handling) — this page just needs to emit a
  correctly-formed link, nothing more.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site, the diagnostic, and the admin area; `/capabilities` is a standard,
server-rendered App Router route.
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component
layer this page's 8-capability grid and Advisory Retainer summary block must be built from.

## Relevant feature specification
docs/features/capabilities-page.md — the full data/interface contract for this page (goal,
user flow, business rules, `capability`/`advisory_retainer`/`page` data requirements, the
unrecognised-`service`-parameter edge case).

## Mockup / UI reference
ui/mockups/a-public-site/capabilities.html — the accepted, authoritative wireframe for this
screen (`ui/screen-inventory.md`); build to its structure and copy exactly.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — `capabilities.html`)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for the capability grid and retainer block)
- Feature docs are the data/interface contract. (applies — `capabilities-page.md`'s Data
  requirements section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. a `lib/capabilities.ts`
  resolving the `page` row and ordered `capability` rows)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `capability`, `advisory_retainer`, `page`)
- Fee amounts are always a structured min/max band with a scope cap. (partially applies —
  the Advisory Retainer's fee is a different structured shape by design, a single recurring
  amount + currency + billing period, not a min/max band; still never free text)
- Content the firm can change lives in the database, edited via `/admin`. (applies — every
  field this page renders is database-sourced; no admin screen exists yet, per this epic's
  own opening note, but the read side must already be fully database-driven)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies generally to any interactive
  element this page adds; the capability grid/retainer block are not expected to need an
  interactive Base UI primitive the way T2.2's FAQ accordion did, but re-evaluate once the
  mockup's actual structure is read)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (applies directly — this is the
  first task to create it; design it as genuinely shared, since T2.4 reuses it)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies for title/description per this task; OG/Twitter/JSON-LD remains T2.8's job)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not
  applicable to this task directly — no `dataLayer.push` calls belong here)
- Never a hard-coded measurement/advertising tag outside GTM. (applies as a forward
  constraint — don't add one)

## Task Completion Checklist
[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
    files (npm run lint && npm run format:check) — this is a hard gate; a pre-push hook / CI
    runs it, so a skipped lint fails the push. Fix pre-existing lint failures too, so the
    branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
