# Session 09 — Capabilities page

# Date: 2026-09-05

# Tasks completed: T2.3

## What Was Built

Built `/capabilities` to `ui/mockups/a-public-site/capabilities.html`. Introduced the shared
generic `Page` model (Prisma) as the first task to create it, plus new `Capability` (8 rows)
and `AdvisoryRetainer` (singleton) models. Seeded all three from real content — the mockup's
own copy, cross-checked against `Company Docs/05.03 Core Offer Focus Note.docx` and `05.04
Rate Card.docx` — and built `lib/pages.ts`/`lib/capabilities.ts` plus
`app/capabilities/page.tsx` to render it.

## Files Changed

- `prisma/schema.prisma` — new `Page`, `Capability`, `AdvisoryRetainer` models
- `prisma/migrations/20260905124815_t2_3_page_capability_advisory_retainer/` — new migration
- `prisma/seed.ts` — `seedCapabilitiesPage`, `seedCapabilities`, `seedAdvisoryRetainer`
- `lib/pages.ts` — new: `getPageBySlug()`, the shared resolver for the generic `page` entity
- `lib/capabilities.ts` — new: `getCapabilities()`, `getAdvisoryRetainer()`,
  `formatRetainerFee()`
- `app/capabilities/page.tsx` — new: the page itself, `force-dynamic`, live `offerNavLinks`
- `memory/completed-work.md` — this session's entry
- `memory/decision-log.md` — `Page.introCopy`-added-early and `AdvisoryRetainer`-as-singleton
  decisions
- `docs/sessions/session-09-capabilities-page.md` — this file

## Decisions Made

- `Page.introCopy` added now (nullable, unused by capabilities) rather than at T2.4, since
  `our-method-page.md` reuses the same shared model and this task's own architecture
  constraint said to design it as genuinely shared from the start.
- `AdvisoryRetainer` modelled as a true singleton (one `feeAmount`/`feeCurrency`/
  `billingPeriod`), not `OfferTier`'s multi-tier shape, even though the Rate Card documents
  three real retainer tiers (Essential/Standard/Full) — `capabilities-page.md`'s Data
  requirements section explicitly names a singleton, and the mockup only ever publishes the
  Essential floor. See `memory/decision-log.md` for full reasoning.
- No unit tests added — `lib/pages.ts`/`lib/capabilities.ts` are thin data-fetch wrappers
  with no branching logic worth testing, same precedent as T2.1/T2.2. The pre-existing
  Vitest-scaffolding gap remains correctly sequenced into T3.2, untouched by this task.

## Current State

`/capabilities` is live, fully database-driven, and verified via Playwright MCP at mobile
(390px), tablet (768px), and desktop (1280px) — all 8 capability cards and the Advisory
Retainer panel render correctly with correctly-formed `/contact?service=[slug]` links. Ready
for T2.4.

## Blockers

None.

## Next Task

T2.4 — Our Method page
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.4 — Our Method page

## What to build
`/our-method` to `ui/mockups/a-public-site/our-method.html`, reading the shared `page` entity
(including `intro_copy`, unique to this page) plus the `method_stage` rows for the four-stage
method (`docs/features/our-method-page.md`).

## Input → Output contract
Migrated `page` row (slug: our-method) + 4 `method_stage` rows → rendered page matching the
mockup.

## Acceptance criteria
All four stages (Discover, Diagnose, Design, Deliver) render in order with correct copy;
intro copy renders above the stage list per the mockup.

## Size / Dependencies
M, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and composed directly
by every public page — there is no shared `(public)` layout; T2.2 also established the
pattern of passing a live `offerNavLinks` prop, fetched via `lib/offers.ts`'s
`getOfferNavLinks()`, into every `SiteHeader` instance on a real public page — this page must
do the same), T2.9 (seed data — the `method_stage` table has no rows yet; this task must seed
them itself, per T2.1/T2.3's own precedent of doing its own epic's seed work when nothing
else has yet). T2.3 (session 09, 2026-09-05) already created the shared `Page` model this
task depends on, including its `introCopy` field, added early specifically so this task
wouldn't need a schema migration for it — see `prisma/schema.prisma`'s `Page` doc-comment and
`memory/decision-log.md`'s T2.3 entry. This task only needs to seed a `page` row with
`slug: "our-method"` and a populated `introCopy`, and add a new `MethodStage` model + its own
seed data — `Page` itself needs no further schema change.

## Architecture constraints
- **The mockups are authoritative.** Build to `ui/mockups/a-public-site/our-method.html`'s
  structure and copy exactly — don't invent layout.
- **Responsive is built in from a component's first implementation, never a later pass.** The
  mockup is desktop-only — this page must also work at mobile (~375–430px) and tablet
  (~768px) before being called done, using the design system's existing spacing/stacking
  patterns (`ui/design-system.md`). `SiteHeader`'s own mobile drawer nav is already handled
  (T1.5) — this task's own responsive work covers the four-stage list/timeline layout.
- **Feature docs are the data/interface contract.** `our-method-page.md`'s Data requirements
  section — `method_stage` (id, name, order, description, client_sees, decision_point,
  capability_transfer_note — only populated for the final stage) and the shared `page` entity
  (id, slug, hero_kicker, hero_heading, hero_lead, intro_copy, meta_title, meta_description) —
  every field maps to a Prisma schema field of the same name. Add a new `MethodStage` model
  to `prisma/schema.prisma`; reuse the existing `Page` model as-is (T2.3 already added
  `introCopy`).
- Business logic (resolving the `page` row by slug — reuse T2.3's `lib/pages.ts`'s
  `getPageBySlug()` directly, don't duplicate it — and ordering `method_stage` rows) lives in
  `lib/`, never inline in the page component. A new `lib/our-method.ts` (or similarly named
  file) should hold the `method_stage` resolver specifically.
- Every entity field named in `our-method-page.md`'s Data requirements section maps to a
  Prisma schema field of the same name — don't rename during implementation without updating
  the feature doc to match.
- **Content the firm can change lives in the database, never hard-coded** — every piece of
  copy this page renders (hero text, intro copy, each stage's name/description/client_sees/
  decision_point/capability_transfer_note) comes from the seeded `page`/`method_stage` rows,
  not literal strings in the component. Note this is a second, fuller telling of the same
  four stages the home page (T2.1) already renders as fixed template chrome
  (`app/(public)/page.tsx`'s `METHOD_STEPS` constant) — that home-page copy is explicitly NOT
  sourced from `method_stage` (home-page.md's own Data requirements section doesn't name a
  method-stage field), so don't refactor the home page to read from this new table as part of
  this task; they are deliberately two different copies for two different depths, per
  `home-page.md`'s own documented split.
- **All four stages must be shown with equal structural depth** (`our-method-page.md`'s
  business rule) — this is the page's whole purpose; don't let one stage's copy or layout
  read as thinner than the others.
- **The Deliver stage's `capability_transfer_note` is mandatory content, not optional** — the
  specific differentiating detail Document 13.03 calls out. Render it distinctly for that
  stage only (the other three stages have this field null/empty).
- **This content is firm-authored, never generated or paraphrased by the agent**
  (`our-method-page.md`'s business rule, Document 13.03 Section 13) — source real copy from
  `ui/mockups/a-public-site/our-method.html` (already-accepted content, same precedent as
  T2.1's home.html and T2.3's capabilities.html) and/or `Company Docs` if the mockup's own
  copy needs cross-checking or is incomplete for any field (e.g. `client_sees`/
  `decision_point` if the mockup doesn't surface them as distinct fields — check its actual
  markup before assuming; if genuinely absent from any real source, seed as clearly flagged
  placeholder per standing instruction, never fabricated).
- **This page does not degrade gracefully to a partial state** (`our-method-page.md`'s edge
  case) — if content migration leaves any of the four stages incomplete, that's a seed-data
  problem to fix before calling this task done, not a runtime condition the page needs to
  handle.
- **Add `export const dynamic = "force-dynamic";` to `app/our-method/page.tsx`.** Standing
  CLAUDE.md Code Conventions rule for every page reading seeded content — hit for real at
  T2.1 (Railway's build container can't reach the private-network DB host).
- **Every public page type carries `meta_title`/`meta_description`** — this task owns this
  page's own tags (OG/Twitter and sitewide Organization JSON-LD remain T2.8's job).
- **Never a hard-coded measurement/advertising tag outside GTM** — this page fires no
  `dataLayer.push` of its own.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site, the diagnostic, and the admin area; `/our-method` is a standard,
server-rendered App Router route.
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component
layer this page's four-stage list must be built from.

## Relevant feature specification
docs/features/our-method-page.md — the full data/interface contract for this page (goal,
user flow, business rules, `method_stage`/`page` data requirements, the incomplete-stage
edge case).

## Mockup / UI reference
ui/mockups/a-public-site/our-method.html — the accepted, authoritative wireframe for this
screen (`ui/screen-inventory.md`); build to its structure and copy exactly.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — `our-method.html`)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for the four-stage layout)
- Feature docs are the data/interface contract. (applies — `our-method-page.md`'s Data
  requirements section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. a new `lib/our-method.ts`
  resolving the ordered `method_stage` rows; reuse T2.3's `lib/pages.ts` for the `page` row)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `method_stage`, `page`)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no
  fee/pricing content on this page)
- Content the firm can change lives in the database, edited via `/admin`. (applies — every
  field this page renders is database-sourced; no admin screen exists yet, per this epic's
  own opening note, but the read side must already be fully database-driven)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies generally to any interactive
  element this page adds; re-evaluate once the mockup's actual structure is read — likely no
  interactive Base UI primitive is needed if the four stages render as a static list/timeline)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (applies directly — this task
  reuses the model T2.3 created, populating its `introCopy` field for the first time)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies for title/description per this task; OG/Twitter/JSON-LD remains T2.8's job)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable
  to this task directly — no `dataLayer.push` calls belong here)
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.5 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
