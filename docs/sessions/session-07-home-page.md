# Session 07 — Home page

# Date: 2026-09-05

# Tasks completed: T2.1

## What Was Built

The real `/` home page (`app/(public)/page.tsx`), built to `ui/mockups/a-public-site/home.html`
and reading live data from two new Prisma models (`HomePageContent`, `Offer`) seeded with real
content sourced from the home and offer mockups. Since this is the first task in Milestone 2,
it also did the `home_page_content`/`offer` portion of T2.9's seed work first, per T2.1's own
dependency note, and fixed a real infrastructure bug (Railway's self-signed Postgres proxy
certificate) hit along the way.

## Files Changed

- `prisma/schema.prisma` — new `HomePageContent` and `Offer` models (see their doc-comments
  for what's in scope for T2.1 vs. deferred to T2.2)
- `prisma/migrations/20260905063122_t2_1_home_page_and_offer/` — new migration
- `prisma/seed.ts` — new `seedHomePageContent`/`seedOffers`
- `lib/db-adapter.ts` — new: `createDatabaseAdapter`, the Railway TLS fix, shared by
  `lib/prisma.ts` and `prisma/seed.ts`
- `lib/prisma.ts` — now uses `createDatabaseAdapter`
- `lib/home.ts` — new: `getHomePageContent`, `getOfferCards`, `getFeaturedArticles` (stub)
- `app/(public)/page.tsx` — new: the home page; `app/page.tsx`/`app/page.module.css` (the
  create-next-app default) removed
- `docs/features/core-offer-pages.md` — added `teaser` to `offer`'s Data requirements; noted
  the Business Health Check two-tier pricing gap
- `docs/tasks/02-public-presentation.md` — addenda on T2.2, T2.5, T2.9
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — this
  session's entries

## Decisions Made

- Only `home-page.md`'s 7 explicitly-named Data-requirements fields are database-backed;
  everything else the mockup shows (hero kicker, hero facts sidebar, method-strip copy, trust
  band) is fixed template JSX — the feature doc is the authoritative contract, not "every
  visible string must be a DB field." See `memory/decision-log.md`.
- `home_page_content.primary_cta_label/href` governs the diagnostic band's CTA specifically,
  not the hero's two buttons (which have their own dedicated `hero_statement` field and fixed
  supporting copy).
- Added `Offer.teaser` (a real gap in `core-offer-pages.md` — no field existed for the short
  card blurb distinct from the full-page `problem_statement`). Scoped `Offer` to only the
  fields T2.1's home cards need, following T1.5's own precedent of not adding schema for a
  field with no current consumer — the rest is T2.2's job.
- Found Business Health Check has a real two-tier (Express/Full) pricing structure the
  documented single fee-band shape can't represent. Seeded a provisional
  `feeAmountMin: 1000, feeAmountMax: 6500` so the home card's real "From GHS 1,000" renders
  correctly, and flagged the proper fix (likely an `OfferTier` model) as technical debt
  sequenced into T2.2.
- Fixed a real bug, not a workaround: Railway's public Postgres proxy terminates TLS with a
  self-signed certificate, and `pg`'s connection-string parsing treats `sslmode=require` as
  an alias for `verify-full` that overrides an explicit `ssl.rejectUnauthorized: false` unless
  `sslmode` is first stripped from the URL. Fixed once in a new shared `lib/db-adapter.ts`.
- No Vitest added — `lib/home.ts` is thin Prisma passthrough (plus a stub) with no
  branching/computed logic yet to unit-test; reviewed `memory/technical-debt.md`'s existing
  "Vitest never scaffolded" entry and left its sequencing (T3.2) unchanged.

## Post-commit fix (same session)

User review caught that the hero's Method/Attention/Boundary facts sidebar was showing at
mobile widths too, cramped below the hero text — the mockup itself is desktop-only and never
showed this content collapsed to a single narrow column. Changed it to `hidden` below `md`
(768px) and `flex` (row-wrapped, matching the existing tablet treatment) from `md` up, so
mobile now shows only the hero statement, lead, and CTAs — re-verified with Playwright MCP at
390px (facts hidden) and 768px (facts shown, unchanged). Committed separately as
`fix(T02-01)` rather than amending the T2.1 commit, per CLAUDE.md's commit protocol.

## Post-commit fix #2 (same session) — Railway production build failure

First real Railway deploy of `main` failed at `npm run build`: Next.js tried to statically
prerender `/` and hit a Prisma `P1001` reaching `postgres.railway.internal` — Railway's
private network hostname, unreachable from the isolated build container (only resolves for
running services). Root cause: nothing about the page told Next.js it depends on per-request
state, so it defaulted to build-time prerendering. Fixed by adding
`export const dynamic = "force-dynamic"` to `app/(public)/page.tsx` — also the architecturally
correct choice, since this content is meant to be read live and become admin-editable later.
Verified with a real local `npm run build` (this specific failure mode isn't reproducible
locally otherwise, since the local `DATABASE_URL` is Railway's public proxy). Added a new
CLAUDE.md Code Conventions rule so every later page built against seeded content (T2.2
onward) applies this from the start rather than rediscovering it per task. Committed as
`fix(T02-01)`.

## Current State

The home page is live, fully database-driven, and matches the mockup at desktop (1280px),
tablet (768px), and mobile (390px) — verified with Playwright MCP (connected this session),
including opening the mobile drawer nav for real. Zero console errors. `npm run lint`,
`format:check`, and `npm run typecheck` all pass clean. Ready for T2.2 (Core Offer pages).

## Blockers

None for T2.1 itself. Two open, correctly-sequenced technical debt items for later tasks:
Business Health Check's two-tier pricing (→ T2.2) and the home page's placeholder
senior-attention photo panel (→ T2.5) — see `memory/technical-debt.md`.

## Next Task

T2.2 — Core Offer pages (×3)
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.2 — Core Offer pages (×3)

## What to build
`/offers/[slug]` dynamic route to `ui/mockups/a-public-site/offer-*.html`, reading the
`offer` entity (`docs/features/core-offer-pages.md`) — including the corrected
`fee_amount_min`/`fee_amount_max` band, `who_for`/`who_not_for`, `client_inputs`,
`indicative_timeline`, `deliverables`, `faqs`, `meta_title`/`meta_description` — for all
three real offers.

## Input → Output contract
Three migrated `offer` rows → three rendered pages in FR-4.1's fixed field order, matching
their respective mockups.

## Acceptance criteria
All three offers render with every entity field present and in the FR-4.1 order; fee band
displays as a range, never a single figure; FAQ accordion behaviour matches the mockup's
interaction.

## Size / Dependencies
L, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and composed directly
by every public page — there is no shared `(public)` layout, per T2.1's precedent), T2.9
(seed data — T2.1 already seeded a minimal `Offer` row per real offer with just the
home-card fields; this task must seed/extend the rest of `core-offer-pages.md`'s fields onto
those same three rows, not create new ones — see this task's own addendum below and
`memory/completed-work.md`'s T2.1 entry).

## Architecture constraints
- **The mockups are authoritative.** Build each `/offers/[slug]` page to its own mockup
  file's structure and copy exactly (`offer-business-health-check.html`,
  `offer-financial-clarity-pack.html`, `offer-funding-readiness-pack.html`) — don't invent
  layout.
- **Responsive is built in from a component's first implementation, never a later pass.**
  The mockups are desktop-only — this page must also work at mobile (~375–430px) and tablet
  (~768px) before being called done, using the design system's existing spacing/stacking
  patterns (`ui/design-system.md`). `SiteHeader`'s own mobile drawer nav is already handled
  (T1.5); this task's own responsive work covers the who-for/who-not-for grid, the tier
  grid (Business Health Check only), the deliverables grid, the fee panel, and the FAQ list.
- **Feature docs are the data/interface contract.** `core-offer-pages.md`'s "Data
  requirements" section — every field maps to a Prisma schema field of the same name.
  T2.1 already added `slug`, `name`, `teaser`, `feeAmountMin`, `feeAmountMax`, `feeCurrency`,
  `scopeCap`, `isPlaceholder` to the `Offer` model (see `prisma/schema.prisma`'s doc-comment)
  — this task adds the remaining documented fields: `problem_statement`, `who_for`,
  `who_not_for`, `method_stages` (ordered list), `deliverables` (list), `client_inputs`
  (list), `indicative_timeline`, `out_of_scope_note`, `faqs` (list of Q&A), `cta_href`,
  `meta_title`, `meta_description`.
- **Must resolve Business Health Check's two-tier pricing before building its detail page.**
  See `memory/technical-debt.md` → "Business Health Check's two-tier pricing has no real
  data model yet" and this epic file's own T2.2 addendum. The mockup shows two real tiers
  (Express: GHS 1,000–2,000, 5 working days, single location, 3 deliverables; Full: GHS
  3,000–6,500, 2 weeks, up to 3 locations, 5 deliverables), each with its own scope and
  deliverable list — the current single `fee_amount_min`/`fee_amount_max`/`scope_cap` shape
  can't represent that. Likely needs a dedicated `OfferTier` model (offer_id, name, fee_min,
  fee_max, duration, scope description, deliverables list) — this is a real design decision
  to make, not a mechanical field add. T2.1 seeded a provisional
  `feeAmountMin: 1000, feeAmountMax: 6500` for Business Health Check as a stopgap only; don't
  treat it as correct.
- Business logic (e.g. resolving an offer by slug, 404-if-missing, formatting the fee band)
  lives in `lib/`, never inline in the page component.
- **Add `export const dynamic = "force-dynamic";` to `app/offers/[slug]/page.tsx`.** Hit for
  real at T2.1 (see `memory/decision-log.md`): without it, Next.js may statically prerender
  a page at build time whenever it sees no dynamic API used, and on Railway the build
  container can't reach the private-network database host that reads use at runtime — the
  build fails outright. This is now a standing CLAUDE.md Code Conventions rule for every
  page reading seeded content, not just a T2.1-specific fix.
- **Content the firm can change lives in the database, never hard-coded** — every piece of
  copy these pages render comes from the seeded `offer` rows (and `OfferTier` rows, if that's
  the resolution chosen), not literal strings in the component.
- **Fee amounts are always a structured min/max band with a scope cap — never a single
  number, never free text.** `StructuredFeeFieldEditor` (`ui/components.md`) is the eventual
  admin editor for this (Milestone 7, not built yet) — this task only needs the public-facing
  read side, but the data shape must already support that editor without rework.
- Once real `Offer.cta_href`/fee data exists, wire `components/site-header.tsx`'s
  `CORE_OFFERS` fee hints (currently hard-coded per T1.5's own explicit note) to read
  `Offer.feeAmountMin` live instead — T1.5 and T2.1 both deferred this specifically to this
  task.
- Accessibility: WCAG 2.1 AA — the FAQ accordion must be built on Base UI's `Accordion`
  primitive (already scaffolded, `components/ui/accordion.tsx`, T1.4), not a hand-rolled
  `<details>`/`<summary>` reimplementation, even though the mockup uses `<details>` — Base UI
  gives correct ARIA/focus management for free.
- **Every public page type carries `meta_title`/`meta_description`** — this task owns each
  offer page's own tags (per T2.1's established split: OG/Twitter and sitewide Organization
  JSON-LD are T2.8's job, not this task's).
- **Never a hard-coded measurement/advertising tag outside GTM** — these pages fire no
  `dataLayer.push` of their own; enquiry/diagnostic-start events are Milestone 3/5/8's job.
- Handle the documented edge cases exactly: a fee band edited without its scope cap is
  rejected at the admin layer (Milestone 7, not this task, but the data shape must support
  the constraint); an offer slug that doesn't exist 404s standard, never a silently-generated
  thin page; an empty FAQ list omits the FAQ section entirely rather than showing placeholder
  questions.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site, the diagnostic, and the admin area; `/offers/[slug]` is a standard
dynamic, server-rendered App Router route.
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component
layer this page's sections (who-for/who-not cards, tier cards, deliverables grid, fee panel,
FAQ accordion) must be built from — use Base UI's `Accordion` for the FAQ, not a hand-rolled
`<details>` element.

## Relevant feature specification
docs/features/core-offer-pages.md — the full data/interface contract for these pages (goal,
user flow, business rules, `offer` data requirements including the newly-added `teaser`
field, edge cases).

## Mockup / UI reference
ui/mockups/a-public-site/offer-business-health-check.html,
ui/mockups/a-public-site/offer-financial-clarity-pack.html,
ui/mockups/a-public-site/offer-funding-readiness-pack.html — build each offer's page to its
own mockup file's structure and copy exactly; these are the accepted, authoritative
wireframes for this screen (`ui/screen-inventory.md`).

## Coding standards
- The mockups are authoritative for UI tasks. (applies — the three `offer-*.html` files)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for every section these pages add)
- Feature docs are the data/interface contract. (applies — `core-offer-pages.md`'s Data
  requirements section, extended by this task)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. a `lib/offers.ts`
  resolving an offer by slug, 404-if-missing)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — the remaining `offer` fields this task
  adds)
- Fee amounts are always a structured min/max band with a scope cap. (applies directly —
  this task's central data-modelling problem, especially for Business Health Check's tiers)
- Content the firm can change lives in the database, edited via `/admin`. (applies — every
  field these pages render is database-sourced; no admin screen exists yet to edit them,
  per this epic's own opening note, but the read side must already be fully database-driven)
- Diagnostic scoring configuration is data, not logic. (not applicable — these pages only
  link to the diagnostic, don't implement it)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies — the FAQ accordion must use
  `components/ui/accordion.tsx`, not a hand-rolled `<details>`)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no
  subordinate screen introduced by this task)
- The shared generic `page` entity for marketing-page copy. (not applicable — `offer` is its
  own dedicated entity)
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
