# Session 13 — Legal & compliance pages

# Date: 2026-09-05

# Tasks completed: T2.7

## What Was Built

Built `/legal/[slug]` (four fixed instances: privacy-notice, cookie-notice, terms-of-use,
scope-of-practice) to `ui/mockups/e-legal/*.html`'s exact structure and copy, materializing
the `legal_page` and `footer_content` entities. Three of the four pages are seeded as genuine
structural placeholders with a visible "Draft — pending legal review" marker; Scope of
Practice is seeded as real, firm-supplied content.

## Files Changed

- `prisma/schema.prisma` — `LegalPage`, `FooterContent` models added.
- `prisma/migrations/20260905154557_t2_7_legal_page_and_footer_content/` — migration.
- `prisma/seed.ts` — `seedLegalPages()`, `seedFooterContent()`, wired into `main()`.
- `lib/legal.ts` — `LegalPageBlock` type, `LEGAL_PAGE_SLUGS`, `getLegalPageBySlug`,
  `formatRevisedDate` (new file).
- `app/legal/[slug]/page.tsx` — the page itself: per-block-kind renderer
  (statement/prose/pending/table), the placeholder banner, 404 on an unknown slug (new file).
- `docs/features/legal-and-compliance-pages.md` — documented `meta_description`, the
  block-array shape of `body`, and the `footer_content` wiring gap.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for the new `footer_content` wiring debt.
- `docs/dashboard.md` — "Blocked On" section now names the three placeholder legal pages and
  FR-6.5's pre-launch privacy-notice gate.
- `memory/decision-log.md`, `memory/technical-debt.md`, `memory/completed-work.md` — this
  task's decisions, the new debt item, and the completed-work entry.

## Decisions Made

- The epic file's own T2.7 entry cites a mockup path (`ui/mockups/a-public-site/legal-*.html`)
  that doesn't exist — built to the real path (`ui/mockups/e-legal/*.html`) instead, per the
  task's own explicit instruction; flagged in `memory/decision-log.md` rather than silently
  resolved.
- `LegalPage.body` modelled as an ordered array of typed content blocks
  (statement/prose/pending/table), not one opaque string — the four real mockups don't share
  one uniform shape. `metaDescription` added beyond the feature doc's original field list
  (same T2.2/T2.4 precedent).
- `LegalPage.isPlaceholder` defaults `true` (the only model in this schema where the
  placeholder flag defaults `true`) since three of the four real rows are genuine drafts.
  Scope of Practice is the one real row — same Company-Docs-sourced text already verified into
  `FirmStatement.scopeBody` at T2.5.
- The "draft — pending legal review" marker is a computed UI banner (shown whenever
  `isPlaceholder` is true), not seeded content — disappears automatically once a page's flag
  flips to `false` via a future admin edit.
- `footer_content` was materialized and seeded but deliberately **not** wired into
  `SiteFooter`/`ScopeOfPracticeNote` (both still render T1.5's hardcoded text) — logged as
  technical debt, same shape and same T7.8 sequencing as the pre-existing `SiteSettings`/
  `SiteFooter` gap from T2.6, rather than touching all seven `SiteFooter` call sites in this
  Small-sized task.

## Current State

All four legal pages are live, linked from every page's footer, and verified end-to-end via
Playwright MCP at mobile/tablet/desktop with zero console errors. Public Presentation epic
(Milestone 2) has one task left: T2.8 (SEO foundation), which closes out the epic.

## Blockers

None for this task. Carried forward, not new: `site_settings.response_time_commitment` still
unset (user-triggered, sequenced into T7.8); `SiteFooter` callers still hardcoded for both
`site_settings` and now `footer_content` (task-sequenced, sequenced into T7.8); GTM container
not yet provisioned (user-triggered, sequenced into T5.3); domain/Cloudflare not yet in place
(user-triggered, sequenced into T1.1). None of these block T2.8.

## Next Task

T2.8 — SEO foundation
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.8 — SEO foundation

## What to build
`docs/features/seo-and-search-foundation.md` in full: `GET /sitemap.xml`
auto-generated from published content; Organization JSON-LD schema sourced from
`site_settings` (+ new `social_profile_urls`); per-page meta tags wired for every page type
built in this epic.

## Input → Output contract
Published content across T2.1–T2.7 → a valid, auto-updating sitemap and
a valid Organization schema block present on every page.

## Acceptance criteria
Sitemap validates against the sitemap protocol and lists exactly the
pages published so far; Google's Rich Results Test (or equivalent structured-data validator)
accepts the Organization schema with no errors; a missing `meta_description` on any page
falls back to a truncated body excerpt rather than an empty tag.

## Size / Dependencies
M, depends on: T2.1 (home page — provides `home_page_content`, needs its `meta_title`/
`meta_description` fields, already present), T2.2 (three offer pages — `offer.meta_title`/
`meta_description`, already present), T2.3 (capabilities — the shared `page` entity's
`meta_title`/`meta_description`, already present), T2.4 (our-method — same shared `page`
entity), T2.5 (about — same shared `page` entity), T2.6 (contact — same shared `page` entity,
plus the real `site_settings` singleton this task extends with `social_profile_urls`), T2.7
(the four legal pages — `legal_page` already carries `meta_title`-equivalent `title` +
`meta_description`, added at T2.7 specifically anticipating this task, per
`seo-and-search-foundation.md`'s own note that "`article` and `legal_page` already had these
fields"). Every one of T2.1–T2.7's routes must appear in the sitemap this task generates.

## Architecture constraints
- **Every public page type carries `meta_title`/`meta_description`, plus OG/Twitter tags and
  JSON-LD structured data per `seo-and-search-foundation.md`** — this task is where the
  OG/Twitter/JSON-LD half of that standing rule actually gets built; every prior T2.x task
  only wired the plain `<title>`/meta-description half via each page's own `generateMetadata`.
- **Business logic lives in `lib/`, never inline in a route handler.** The sitemap-generation
  query (gathering every published URL across `Offer`/`Page`/`LegalPage`/`HomePageContent`,
  plus `article`/`landing_page` once those tables exist — they don't yet, so this task's
  sitemap logic must degrade gracefully to "not yet queryable" for those two, not error) and
  the Organization JSON-LD builder both belong in `lib/` (e.g. `lib/seo.ts`), called from
  `app/sitemap.ts`/wherever the JSON-LD is rendered — not built inline in a route handler or
  a Server Component beyond what's needed to call into `lib/` and render the result.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** `GET /sitemap.xml` reads live published content the same way every
  other page in this epic does — apply the same rule, for the same reason (Railway's build
  container can't reach the private-network DB host to statically prerender it).
- **Never a hard-coded measurement/advertising tag outside GTM** (ADR 0006) — the Organization
  JSON-LD block is structured data for search engines, not a measurement/advertising tag, so
  it does not go through GTM; don't conflate the two when implementing.
- **Content the firm can change lives in the database, edited via `/admin`.**
  `social_profile_urls` (new on `site_settings`) is exactly this — already added to the
  Prisma schema at T2.6 in anticipation of this task (`memory/decision-log.md`), so this task
  only needs to seed real values (if the firm has supplied any — check
  `Company Docs/` before assuming none exist) and read them live for `sameAs`, not add the
  column.
- A missing `meta_description` must fall back to a truncated body excerpt, never an empty
  tag — this is this task's own explicit acceptance criterion, not optional polish.
- The sitemap must include only published, public content — never a draft article, an
  unpublished legal-page revision (not applicable yet — no `published` flag exists on
  `LegalPage`, all four rows are always public per FR-6.5's own launch-gate framing), or a
  404 slug.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site; `GET /sitemap.xml` is a standard App Router route handler (or the
framework's built-in `app/sitemap.ts` convention) reading from Postgres via Prisma, the same
pattern as every other route built this epic.
ADR 0006 — docs/adr/0006-gtm-measurement-container.md — GTM is the single measurement/
advertising tag container; this task's Organization JSON-LD is deliberately outside that
boundary (search-engine structured data, not a measurement tag), so it does not violate the
"never a hard-coded tag outside GTM" rule — worth stating explicitly in this task's own
implementation so a future reviewer doesn't mistake one for the other.

## Relevant feature specification
docs/features/seo-and-search-foundation.md — the full data/interface contract for this task
(goal, user flow, business rules, the `social_profile_urls`/`meta_title`/`meta_description`
data requirements, the sitemap/JSON-LD interfaces, and the blank-description/unpublished-page
edge cases). Also re-check `docs/features/content-management-admin.md`'s Site Settings section
since `social_profile_urls` lives on that same singleton `/contact`/T2.6 already reads.

## Mockup / UI reference
Not applicable — this task has no visitor-facing UI surface (no dedicated mockup, no screen in
`ui/screen-inventory.md`). `GET /sitemap.xml` is a machine-readable file; the Organization
JSON-LD is an invisible `<script type="application/ld+json">` block; per-page meta
title/description are non-visual `<head>` tags.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface this task owns)
- Responsive is built in from a component's first implementation. (not applicable — no UI
  surface)
- Feature docs are the data/interface contract. (applies — `seo-and-search-foundation.md`'s
  Data requirements section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. `lib/seo.ts` for sitemap
  generation and the Organization JSON-LD builder)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `social_profile_urls` on `site_settings`,
  already added at T2.6; confirm it's actually read live by this task, not left unused)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no
  fee/pricing content on this task's surfaces)
- Content the firm can change lives in the database, edited via `/admin`. (applies —
  `social_profile_urls`)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no interactive UI
  surface this task owns)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable — this task reads
  existing `page`/`offer`/`legal_page`/`home_page_content` rows' meta fields, it doesn't add a
  new page type)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies directly — this is the task that closes out the OG/Twitter/JSON-LD half of that
  rule across every page type built in T2.1–T2.7)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable
  — this task adds no new conversion moment)
- Never a hard-coded measurement/advertising tag outside GTM. (applies as a boundary check —
  confirm the Organization JSON-LD implementation stays out of GTM's territory, per the
  architecture constraint above, without accidentally introducing a second measurement
  mechanism)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.9 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
