# Session 10 — Our Method page

# Date: 2026-09-05

# Tasks completed: T2.4

## What Was Built

Built `/our-method` to `ui/mockups/a-public-site/our-method.html`, reading the shared `Page`
model (T2.3's `getPageBySlug`, unchanged) plus a new `MethodStage` model for the four
Discover/Diagnose/Design/Deliver stages. Added one field beyond `our-method-page.md`'s
original Data requirements list (`whatHappens`) once the mockup's actual structure was read,
and updated the feature doc to match, same precedent as T2.2.

## Files Changed

- `prisma/schema.prisma` — added `MethodStage` model (name, order, description, whatHappens,
  clientSees, decisionPoint, capabilityTransferNote, isPlaceholder, timestamps).
- `prisma/migrations/20260905131349_add_method_stage/` — new migration, applied.
- `prisma/seed.ts` — added `seedOurMethodPage()` (the `our-method` `Page` row) and
  `seedMethodStages()` (the 4 rows), wired into `main()`.
- `lib/our-method.ts` — new, `getMethodStages()`.
- `app/our-method/page.tsx` — new route: hero, intro copy (with its two offer names rendered
  as real links via `renderIntroCopyWithOfferLinks()`), four equal-depth stages with a
  three-cell detail grid each, capability-transfer panel on Deliver only, fixed-chrome final
  CTA. `export const dynamic = "force-dynamic"` set.
- `docs/features/our-method-page.md` — added `what_happens` to the `method_stage` Data
  requirements list, with a note pointing at the decision log.
- `memory/completed-work.md`, `memory/decision-log.md` — this task's entries.

## Decisions Made

- Added `MethodStage.whatHappens` beyond the feature doc's original three-field list — the
  mockup's `.stage-detail-grid` has a dedicated "What happens" cell distinct from each stage's
  longer paragraph, so both are real content, not one field wearing two hats.
- The mockup's intro paragraph links its three offer names inline (`<a href="...">`).
  First pass seeded `Page.introCopy` as plain text with the names un-linked, reasoning the
  same offers were reachable from nav/footer anyway — the user caught that this dropped a
  real, mockup-specified behaviour, not an optional embellishment. Corrected same-day:
  `introCopy` stays plain text (still no markup in the DB field, consistent with every other
  content field in this project) but `app/our-method/page.tsx`'s
  `renderIntroCopyWithOfferLinks()` matches each live offer name from `getOfferNavLinks()`
  against the string at render time and re-inserts a real `Link`. Full reasoning (both the
  original call and the correction) in `memory/decision-log.md`.
- The "One journey, not three separate products" kicker and the final CTA section are
  rendered as fixed template chrome (not DB-sourced), same treatment as the home page's own
  fixed sections and capabilities' "Continuing arrangement" kicker — neither is named as a
  field in `our-method-page.md`'s Data requirements section.

## Current State

`/our-method` is live and fully database-driven, all four stages present with equal
structural depth, capability-transfer note rendered only under Deliver, and the intro
paragraph's three offer names link to their real `/offers/[slug]` routes (matching the
mockup, confirmed by clicking one through to `/offers/financial-clarity-pack`). Verified via
Playwright MCP at mobile (390px), tablet (768px), and desktop (1280px) — no console errors,
meta tags populate correctly. Ready for T2.5.

## Blockers

None. (Note: mid-session, the already-running dev server had a stale in-memory Prisma client
from before `prisma generate` ran, causing a transient `prisma.methodStage` undefined error —
resolved by restarting the dev server. Not a code defect, just a reminder for any future
mid-session schema change.)

## Next Task

T2.5 — About / Team page
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.5 — About / Team page

## What to build
`/about` to its mockup, reading team member records and firm narrative content per
`docs/features` (the relevant team/about feature doc's entity — team bios, roles, photos).

## Input → Output contract
Migrated team + about content → rendered page matching the mockup.

## Acceptance criteria
All partner bios render with photo, name, role, and bio copy sourced from Company Docs, not
placeholder, since this content exists in the source material.

## Size / Dependencies
M, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and composed directly
by every public page — there is no shared `(public)` layout; T2.2 established the pattern of
passing a live `offerNavLinks` prop, fetched via `lib/offers.ts`'s `getOfferNavLinks()`, into
every `SiteHeader` instance on a real public page — this page must do the same), T2.9 (seed
data — no `author` table exists yet; this task must add the model and seed it itself, per
T2.1/T2.3/T2.4's own precedent of doing its own epic's seed work when nothing else has yet).

**Addendum (session 07, 2026-09-05):** T2.1's home page has a placeholder card in its Senior
Attention section (no real partner photos/credentials exist yet) — see
`memory/technical-debt.md` → "Home page senior-attention panel has no real partner
photography yet." Once this task sources real partner photos/bios for `/about`, consider
whether the home page's placeholder card should also be updated to show a photo (e.g. a small
partner-headshot strip) instead of the italic note — not required, but worth a look since the
underlying asset gap this task closes is the same one blocking it.

## Architecture constraints
- **The mockups are authoritative.** Build to `ui/mockups/a-public-site/about.html`'s
  structure and copy exactly — don't invent layout.
- **Responsive is built in from a component's first implementation, never a later pass.** The
  mockup is desktop-only — this page must also work at mobile (~375–430px) and tablet
  (~768px) before being called done, using the design system's existing spacing/stacking
  patterns (`ui/design-system.md`). `SiteHeader`'s own mobile drawer nav is already handled
  (T1.5) — this task's own responsive work covers the partner-grid/bio layout.
- **Feature docs are the data/interface contract.** `about-and-partners-page.md`'s Data
  requirements section — `firm_statement` (founding statement, values, standard — rich
  content) and `author` (id, admin_user_id, name, photo_url, practice_area, credentials,
  personal_statement, bio, published; shared with the not-yet-built `insights-engine.md`) —
  every field maps to a Prisma schema field of the same name. This task adds the `Author`
  model to `prisma/schema.prisma` for the first time; only the fields this page's Data
  requirements section actually needs to read are exercised here (`admin_user_id` implies an
  admin-user relation that doesn't exist yet at Milestone 2 — resolve this the same way T2.1
  resolved `HomePageContent.featuredArticleIds` pointing at a not-yet-built `article` table:
  model the field for schema completeness per the feature doc, but do not block this task on
  building admin-user auth; document the gap in `memory/decision-log.md` if a placeholder
  approach is used).
- Business logic (resolving `firm_statement` and the published `author` rows, ordered
  appropriately) lives in `lib/`, never inline in the page component — a new `lib/about.ts` (or
  similarly named file).
- Every entity field named in `about-and-partners-page.md`'s Data requirements section maps to
  a Prisma schema field of the same name — don't rename during implementation without updating
  the feature doc to match.
- **Content the firm can change lives in the database, never hard-coded** — every piece of
  copy this page renders (firm statement, each partner's name/role/credentials/statement/bio)
  comes from seeded rows, not literal strings in the component.
- **No milestones/history timeline** — Document 13.03, Section 4's explicit exclusion; this
  page is a forward-looking statement of what the firm is being built to become, not a
  chronology. Don't add one even if it would seem natural to include.
- **Every partner entry uses a professional photograph from the single coordinated session**
  — mixed-quality personal photographs are not accepted content. If real partner photography
  doesn't exist yet at seed-authoring time, that `author` row's `published` field stays
  `false` and the entry is not shown (this page's documented edge case) — do not ship a
  placeholder image as if it were the real photo.
- **Professional designations are rendered exactly as the awarding body permits** — a
  content-accuracy rule enforced at seed/publish time; don't abbreviate or reformat a
  credential string sourced from Company Docs.
- **This page does not silently drop a partner for any reason other than `published: false`**
  — if content migration leaves a partner's bio genuinely incomplete, either complete it from
  Company Docs before calling this task done, or leave `published: false` and note it as
  pending in `memory/known-bugs.md`, consistent with the feature doc's own edge case.
- **Add `export const dynamic = "force-dynamic";` to `app/about/page.tsx`.** Standing
  CLAUDE.md Code Conventions rule for every page reading seeded content — hit for real at
  T2.1 (Railway's build container can't reach the private-network DB host).
- **Every public page type carries `meta_title`/`meta_description`** — this task owns this
  page's own tags (OG/Twitter and sitewide Organization JSON-LD remain T2.8's job). Since
  `about-and-partners-page.md`'s Data requirements section doesn't name a `page`-style
  meta_title/meta_description field for `/about`, decide whether this page reuses the shared
  `Page` model (T2.3/T2.4's pattern, slug `"about"`) for its hero/meta fields, or needs its
  own — check the mockup's actual hero structure before assuming, and update the feature doc
  to name whichever fields are added, per the "don't rename/add without updating the feature
  doc" rule.
- **Never a hard-coded measurement/advertising tag outside GTM** — this page fires no
  `dataLayer.push` of its own.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site, the diagnostic, and the admin area; `/about` is a standard,
server-rendered App Router route.
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component
layer this page's partner grid/bios must be built from.

## Relevant feature specification
docs/features/about-and-partners-page.md — the full data/interface contract for this page
(goal, user flow, business rules, `firm_statement`/`author` data requirements, the
unpublished-partner edge case).

## Mockup / UI reference
ui/mockups/a-public-site/about.html — the accepted, authoritative wireframe for this screen
(`ui/screen-inventory.md`); build to its structure and copy exactly.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — `about.html`)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for the partner grid/bio layout)
- Feature docs are the data/interface contract. (applies — `about-and-partners-page.md`'s
  Data requirements section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. a new `lib/about.ts`)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `author`, `firm_statement`)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no
  fee/pricing content on this page)
- Content the firm can change lives in the database, edited via `/admin`. (applies — every
  field this page renders is database-sourced; no admin screen exists yet, per this epic's
  own opening note, but the read side must already be fully database-driven)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies generally to any interactive
  element this page adds; re-evaluate once the mockup's actual structure is read — likely a
  static grid needs no interactive Base UI primitive, but check for any accordion/tab pattern
  in about.html first)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (applies if this page's hero/meta
  fields reuse the `Page` model per this task's own architecture-constraint decision above —
  confirm against the mockup before assuming)
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.6 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
