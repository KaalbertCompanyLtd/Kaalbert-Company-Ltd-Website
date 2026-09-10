# Session 32 — Landing page template

# Date: 2026-09-10

# Tasks completed: T5.1

## What Was Built

The `/lp/[slug]` landing page template Milestone 5 opens with: a `LandingPage` Prisma model
(`landing_page` table), `lib/landing-pages.ts`'s `getLandingPageBySlug` + the
`LandingPageBodyBlock` union type, a dedicated no-nav `LandingPageHeader` client component,
and `app/lp/[slug]/page.tsx` rendering the full hero → body-blocks → repeat-CTA → shared
`SiteFooter` structure with correct OG/Twitter/JSON-LD metadata and a real 404 on an unknown
slug. `landing_page` was also wired into `lib/seo.ts`'s sitemap generation, per
`seo-and-search-foundation.md`'s explicit requirement.

## Files Changed

- `prisma/schema.prisma` — new `LandingPage` model (`slug`, `kicker`, `headline`,
  `openingParagraph`, `bodyContent` (Json block list), `ctaLabel`, `ctaHref`,
  `campaignReference`, `metaTitle`, `metaDescription`, `isPlaceholder`).
- `prisma/migrations/20260910111957_t5_1_landing_page/` — new migration, applied.
- `lib/landing-pages.ts` (new) — `LandingPageBodyBlock` type
  (`heading`/`paragraph`/`list`/`stats`/`steps`) and `getLandingPageBySlug`.
- `components/landing-page-header.tsx` (new) — logo-only fixed header, zero `<nav>` markup,
  reuses `SiteHeader`'s scroll-triggered logo-swap visual language.
- `app/lp/[slug]/page.tsx` (new) — the route: `generateMetadata`, `LandingPageBodyBlockView`
  block renderer, and the page itself.
- `lib/seo.ts` — `getSitemapEntries` now queries and includes `landingPage` rows; updated its
  own doc-comment (previously noted the table didn't exist yet).
- `memory/completed-work.md`, `memory/decision-log.md` — new entries for this task.

## Decisions Made

- **"No navigation" scoped to the header, not the footer.** `SiteFooter` is reused exactly as
  every other page renders it (nav columns included), since the architecture constraint
  explicitly forbids a per-instance footer copy. A dedicated `LandingPageHeader` (zero
  `<nav>` markup at all) satisfies "no site navigation renders under any circumstance"
  literally — verified via Playwright's accessibility tree: zero `<nav>` landmarks anywhere
  on the rendered page. See `memory/decision-log.md`'s T5.1 entry for the full reasoning.
- **`bodyContent` modeled as an ordered `kind`-discriminated block list**
  (`heading`/`paragraph`/`list`/`stats`/`steps`), same convention as `LegalPage.body`/
  `Article.body`, sized to exactly the shapes the three accepted mockups use — not a
  general-purpose page builder, and not per-slug hardcoded copy (which would violate
  `content-management-admin.md`'s "no code change to create a new landing page" rule, since
  landing pages — unlike the three core offers — are not a fixed, closed set).
  - `landing-business-health-check.html`'s `.proof-row` → `stats`.
  - `landing-funding-readiness-checklist.html`'s `.whats-inside` → `heading` + `list`.
  - `landing-financial-clarity-pack.html`'s `.stage-row` → `steps`.
  - Each mockup's repeat-CTA reassurance line → `paragraph`.
- **`kicker` and `isPlaceholder` fields added beyond the feature doc's original list**,
  following the established T2.2/T2.4 precedent (add a field when the accepted mockup shows
  more than the doc named). `kicker` because all three mockups render one above the `<h1>`
  and it varies per campaign; `isPlaceholder` for consistency with every other seeded-content
  model.
- **The funding-readiness-checklist mockup's inline email-capture form and the
  financial-clarity-pack mockup's `.fee-strip` were deliberately not modeled** — neither is
  part of the documented `landing_page` entity, and building either now would be scope this
  task wasn't asked for. Flagged explicitly in T5.2's own prompt (below) rather than silently
  decided by whoever seeds those instances next.

## Current State

Template built, verified end-to-end with Playwright MCP against a throwaway test row (seeded
via a scratch `tsx` script, then deleted — the `landing_page` table is empty on disk again,
exactly as before this session). All quality gates pass (lint, format:check, typecheck, test
— 56/56). Not yet committed. T5.2 (seeding the three real instances) is next and was
deliberately left undone this session, per the task's own scope split.

## Blockers

None.

## Next Task

T5.2 — Three landing page instances, seeded
File: docs/tasks/05-landing-and-measurement.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace.

# Task T5.2 — Three landing page instances, seeded

## What to build
Seed data for the three named launch instances: `/lp/business-health-check`,
`/lp/funding-readiness-checklist`, `/lp/financial-clarity-pack` (`SM/2026-09`).

## Input → Output contract
Campaign copy per instance → three live, distinct landing pages.

## Acceptance criteria
All three render distinctly (different headline/CTA per campaign); each CTA correctly routes
to its stated destination (diagnostic, checklist download, or enquiry route respectively).

## Size / Dependencies
S, depends on: T5.1 (built and committed this same epic, session 32 — provides the
`LandingPage` Prisma model/`landing_page` table, `lib/landing-pages.ts`'s
`getLandingPageBySlug`/`LandingPageBodyBlock` type, `app/lp/[slug]/page.tsx`'s render path,
and `components/landing-page-header.tsx`. T5.2 seeds rows into that existing template — it
does not touch the template's render logic unless a real gap surfaces).

## Architecture constraints
- Seed via `prisma/seed.ts`, matching every other entity's own `seed<Entity>()`
  function + `prisma.<model>.upsert(...)` pattern already in that file (see
  `seedOffers`/`seedLegalPages`/`seedMethodStages` for the exact shape) — never a one-off
  script, so re-running `npm run db:seed` stays idempotent and these three rows survive a
  database reset like every other seeded entity.
- `LandingPage.bodyContent` is the `kind`-discriminated block list `lib/landing-pages.ts`'s
  `LandingPageBodyBlock` defines (`heading`/`paragraph`/`list`/`stats`/`steps`) — built at
  T5.1 specifically to cover these three mockups' actual shapes:
  - `business-health-check`: `.proof-row`'s three stat items → one `stats` block
    (`{value: "6 min", label: "..."}` etc.), plus the repeat-CTA reassurance line → one
    `paragraph` block.
  - `funding-readiness-checklist`: `.whats-inside`'s heading + five-item checklist → one
    `heading` block + one `list` block. This mockup's own inline name/email capture form
    (`.checklist-card`) is **not** part of the `landing_page` entity's documented fields and
    is **out of scope for this task** — T5.1 deliberately did not build a subscriber-capture
    mechanism for this template; do not invent one here. Point this instance's `ctaHref` at
    the most reasonable existing real destination instead (e.g. `/contact` with a
    query-string service hint, matching the pattern `app/offers/[slug]/page.tsx`'s
    `ctaHref` values already use) rather than a route that doesn't exist — if a true
    email-capture download mechanism is wanted, that is new scope requiring a decision only
    the user can make, not an inferred addition; flag it in `memory/technical-debt.md`
    instead of building it.
  - `financial-clarity-pack`: `.stage-row`'s four `{title, description}` steps → one `steps`
    block, plus the repeat-CTA reassurance line → one `paragraph` block. The mockup's
    `.fee-strip` (`Published fee band GHS 4,500 – 9,500`) sits inside the hero, not the body
    — it is **not** a `landing_page` entity field (no fee-band field exists on this model,
    deliberately, per T5.1's own scoping decision — see `memory/decision-log.md`, T5.1
    entry). If fidelity to this one mockup element matters, the reasonable options are: fold
    it into a `stats` block with one item, or omit it; either is a small in-task call, not a
    schema change.
- `kicker`/`headline`/`openingParagraph` are the three fields rendered in the hero — copy
  these directly from each mockup's `.kicker`/`<h1>`/`.lead` text.
- `ctaLabel`/`ctaHref` per instance: `business-health-check` → `/diagnostic`;
  `financial-clarity-pack` → the real Financial Clarity Pack enquiry route (mirror
  `app/offers/[slug]/page.tsx`'s existing `financial-clarity-pack` offer's own `ctaHref`
  value, don't invent a new one); `funding-readiness-checklist` → see the note above.
- `campaignReference`: use `SM/2026-09` per the epic file's own citation for all three, unless
  real per-instance campaign codes are supplied — this field is internal tracking only, never
  rendered on the page.
- `metaTitle`/`metaDescription`: real, distinct per-instance values (NFR-5) — not copied
  verbatim between instances, and not left as a generic site-wide default.
- `isPlaceholder`: set `true` unless the firm has supplied real, sign-off-ready marketing copy
  for a given instance (CLAUDE.md's "never present placeholder content as final" rule) — do
  not fabricate final copy and mark it non-placeholder. If the mockups' own copy is being used
  verbatim as a reasonable starting draft, that is still a placeholder, not firm-approved
  final wording.
- **Addendum owed to `app/offers/[slug]/page.tsx` as part of this task** (see
  `memory/technical-debt.md` → "Funding-Readiness Pack's checklist cross-promo panel omitted
  from the offer detail page," `Sequenced into: T5.2`): once `/lp/funding-readiness-checklist`
  is seeded and live, add back the `.checklist-panel` cross-promo section
  (`ui/mockups/a-public-site/offer-funding-readiness-pack.html`) to the Funding-Readiness Pack
  offer page, linking to the now-real `/lp/funding-readiness-checklist` route. Flip that
  technical-debt entry's `Status` to `Resolved` in the same session.
- No code change to `app/lp/[slug]/page.tsx`, `lib/landing-pages.ts`, or
  `components/landing-page-header.tsx` should be needed to seed these three rows — if the
  template genuinely can't represent something a real mockup needs, that is a real gap in
  T5.1's work, not something to patch around silently; say so explicitly rather than quietly
  reshaping the block schema without recording why.
- `export const dynamic = "force-dynamic"` already applies to `app/lp/[slug]/page.tsx` from
  T5.1 — nothing to change there.

## Relevant ADRs
- ADR 0002 — `docs/adr/0002-nextjs-typescript.md` — Next.js App Router is the one framework
  for public routes; this task only adds seed data behind an already-built route, no new
  route-level work.
- ADR 0010 — `docs/adr/0010-styling-and-component-stack.md` — Tailwind v4 + shadcn/ui on Base
  UI; not directly exercised by this task (no new markup), but any copy-length differences
  between instances must still render acceptably within T5.1's existing block components,
  built against these tokens.

## Relevant feature specification
`docs/features/landing-page-template.md` — the `landing_page` entity's literal field list and
the "Three instances exist at launch" business rule this task fulfils. Also
`docs/features/core-offer-pages.md` for the Financial Clarity Pack offer's existing
`ctaHref`/enquiry-route shape (to mirror, not reinvent) and `docs/features/
measurement-and-attribution.md` for `campaign_reference`'s intended purpose (context only —
T5.4 is what actually wires attribution, not this task).

## Mockup / UI reference
All three real accepted mockups, each mapped to the exact one `landing_page` row it seeds:
- `ui/mockups/d-landing-pages/landing-business-health-check.html` → slug
  `business-health-check`.
- `ui/mockups/d-landing-pages/landing-funding-readiness-checklist.html` → slug
  `funding-readiness-checklist` (minus its inline capture form — see architecture constraints
  above).
- `ui/mockups/d-landing-pages/landing-financial-clarity-pack.html` → slug
  `financial-clarity-pack`.

## Coding standards
- Mockups are authoritative — copy each instance's headline/lead/body content from its own
  mockup exactly where the template's block kinds can represent it. (Applies.)
- Responsive built in from first implementation. (Not applicable — T5.1's template is already
  responsive; seeding rows doesn't change markup.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable — this
  template has no navigation at all.)
- Feature docs are the data/interface contract — `landing-page-template.md`'s entity shape is
  fixed; this task fills it with real values, it doesn't add fields. (Applies.)
- Business logic lives in `lib/`, never inline in a route handler/component. (Not applicable
  — this task only adds seed data, no new logic.)
- Every entity field named in a feature doc's Data requirements maps to a Prisma field of the
  same name. (Applies — already satisfied by T5.1's schema; this task just populates it.)
- Fee amounts as structured min/max + scope cap, never a single number. (Not applicable to
  `landing_page` directly — if the Financial Clarity Pack instance's fee-strip is represented
  at all, it must still reflect the real `Offer.feeAmountMin`/`feeAmountMax`/`scopeCap` band,
  never a re-typed single figure.)
- Content the firm can change lives in the database, edited via `/admin`. (Applies — these
  three rows are seeded directly since the admin editor doesn't exist yet, per T5.1's own
  scoping note; mark `isPlaceholder` accordingly per the constraint above.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no new interactive
  markup, T5.1 already built the template's accessible structure.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Already
  applied by T5.1 — nothing new to add.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Not applicable — no new components this task.)
- The shared generic `page` entity pattern. (Not applicable — `landing_page` is its own
  dedicated entity, not the generic `page` entity.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD.
  (Applies — already wired by T5.1's render path; this task supplies real per-instance
  `metaTitle`/`metaDescription` values.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not this
  task's job — T5.3 wires the actual tags; this task's CTAs are plain links to
  already-instrumented destinations.)

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
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
