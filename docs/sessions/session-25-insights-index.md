# Session 25 — Insights index

# Date: 2026-09-06

# Tasks completed: T4.2

## What Was Built

Built the real `/insights` route: a live, database-backed index page with category filtering,
free-text search, and pagination, all as real shareable `GET` query params rather than
client-only state — matching `insights-engine.md`'s own acceptance criterion. Draft articles
(`publishedAt: null`) are excluded using T4.1's single visibility rule, with no second flag
anywhere. Also closed two small, directly-related gaps discovered while building this: added
the `Article.excerpt` field the mockup's cards actually need, and wired the now-real `article`
table into the sitemap.

## Files Changed

- app/insights/page.tsx — the index route (hero, category filter, search, article grid,
  pagination, empty states)
- lib/insights.ts — `getInsightsCategories`, `getInsightsIndex` (query/filter/paginate/shape)
- lib/insights.test.ts — 7 unit tests on the query-shaping logic
- lib/seo.ts — `getSitemapEntries()` now includes published articles
- prisma/schema.prisma — added `Article.excerpt` (required `String`)
- prisma/migrations/20260906043727_add_article_excerpt/migration.sql — new migration
- prisma/seed.ts — `seedInsightsPage()` (the shared `page` entity's `"insights"` row, hero
  copy sourced verbatim from the mockup), wired into `main()`
- memory/completed-work.md, memory/decision-log.md, memory/technical-debt.md — this session's
  entries
- docs/tasks/02-public-presentation.md — addendum on T2.1 (see Decisions Made)

## Decisions Made

- Added `Article.excerpt` (required `String`) beyond `insights-engine.md`'s original Data
  requirements list — the mockup's article cards need a short, purpose-authored teaser
  distinct from `body`'s rich content, same "discovered once building the real page"
  precedent as `Offer.ctaLabel`/`tiers` (T2.2).
- Built the category filter chips at `rounded-sm`, not the mockup's `border-radius: 999px`
  pill shape — `ui/design-system.md`'s Radius section explicitly rules pill shapes out. The
  design-system token set overrides the static wireframe's own default shape here.
- Deliberately did not carry over the mockup's "X min read" byline text — not a real field,
  and computing it accurately needs `body`'s exact rich-content-block shape, which is T4.3's
  job to define, not this task's.
- Category thumbnails use one fixed brand-gradient (not the mockup's two hardcoded
  per-category colours) since `Category` is a real, open-ended, admin-manageable list, not a
  fixed two-item set.
- An unknown `?category=` slug resolves to zero matches, not a 404 — a mistyped/stale query
  param is a normal, recoverable visitor state.
- Wired the `article` table into `lib/seo.ts`'s sitemap (published only) — directly closing
  that function's own "table doesn't exist yet" comment, and required by
  `seo-and-search-foundation.md`'s own Interfaces section.
- Left `lib/home.ts`'s `getFeaturedArticles()` stub untouched — Home's featured-Insights
  section is a different route/task boundary than T4.2's own `/insights`-only contract.
  Logged in `memory/technical-debt.md` with an addendum on T2.1 (`docs/tasks/02-public-
  presentation.md`) so it isn't lost.
- Noted for T4.3: the epic file (`docs/tasks/04-insights.md`) names a stale mockup path
  (`ui/mockups/a-public-site/insights-article.html`); the real file is
  `ui/mockups/b-insights/insight-owner-drawings.html`.
- **Important discovery for T4.3**: the mockup's "next step" panel
  (`.next-step-panel`) has a real heading ("If this sounds familiar, the Financial Clarity
  Pack is built for exactly this") and a lead paragraph, in addition to a CTA button —
  `Article.nextStepCta`'s current schema shape (`Json` `{label, href}`, added at T4.1) is
  under-modelled for this: it only carries the button's own label/href, not the panel's
  heading/body copy. T4.3 will very likely need to extend this to
  `{heading, body, label, href}` via its own migration, same "extend once you're actually
  building against the mockup" precedent this session used for `excerpt`. Flagged here so
  T4.3 doesn't have to rediscover it from scratch.

## Current State

`/insights` is live and fully functional against real (if currently empty) `article`/
`category` data — verified with a temporary, since-deleted dataset (2 categories, 5 articles
including one draft and one uncategorized) at mobile/tablet/desktop. The real database has
zero Insights content right now (by design — T4.4's job), so the index currently renders its
"No articles published yet" empty state in production/dev until either T4.3 unblocks nothing
further or T4.4 seeds real content. `/insights/[slug]` does not exist yet (404s via the
generic not-found page) — that's T4.3.

## Blockers

None. (The `Article.nextStepCta` shape gap above is a known discovery for T4.3 to resolve,
not a blocker on T4.2's own completion.)

## Next Task

T4.3 — Article template — `/insights/[slug]`
File: docs/tasks/04-insights.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/04-insights.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T4.3 — Article template — `/insights/[slug]`

## What to build
Article template to its mockup: rich body content (tables, pull quotes, figures),
downloadable resources, named author byline with photo/practice area, contextual next-step
CTA, OG/Twitter metadata, `Article` JSON-LD (NFR-5) — the site-wide OG/structured-data rule
this task implements for every article, distinct from `seo-and-search-foundation.md`'s
page-level meta (that epic's task does not duplicate this one).

## Input → Output contract
`article` row → rendered page with correct social preview card when
shared.

## Acceptance criteria
A draft article's slug 404s exactly as if it never existed; a removed
`article_resource` file fails gracefully with a clear message, not a dead link; sharing the
URL via WhatsApp/LinkedIn/Facebook preview tools shows a correctly-dimensioned image and
correct title/description.

## Size / Dependencies
L, depends on: T4.1 (the `article`/`article_resource`/`author`/`category` schema — see this
task's own important note below about a schema gap T4.1 left for this task to close), T1.5
(the shared `SiteHeader`/`SiteFooter` layout shell).

**Important — read before starting:** `Article.nextStepCta` (added at T4.1) is currently
shaped `Json` `{label, href}` — just enough for a button. The accepted mockup
(`ui/mockups/b-insights/insight-owner-drawings.html`, `.next-step-panel`) shows this section
also has its own heading ("If this sounds familiar, the Financial Clarity Pack is built for
exactly this") and a lead paragraph above the button, per FR-3.4's "contextual next step
specific to its subject" rule — a real heading/body, not just a link. You will almost
certainly need to extend `Article.nextStepCta` to `{heading, body, label, href}` via your own
migration (`npx prisma migrate dev`), the same "extend the schema once you're actually
building against the mockup" precedent T4.2 already used twice this epic (`Article.excerpt`,
and see `prisma/schema.prisma`'s own `Article` doc-comment history). Update the model's
doc-comment and log the change in `memory/decision-log.md`, same as those precedents.

Also note: the epic file's own citation of this task's mockup path
(`ui/mockups/a-public-site/insights-article.html`) is stale — the real file is
`ui/mockups/b-insights/insight-owner-drawings.html` (see Mockup / UI reference below).

## Architecture constraints
- Business logic lives in `lib/` — extend `lib/insights.ts` (T4.2) with the single-article
  lookup (`getArticleBySlug`) and a related-articles query, rather than querying Prisma
  directly in the route/page component.
- `published_at` is the sole visibility rule (T4.1) — `getArticleBySlug` must return `null`
  (triggering `notFound()`) both when no row matches the slug *and* when a row matches but
  `publishedAt` is null, so a draft article's own URL 404s exactly as if it never existed —
  same pattern as `app/offers/[slug]/page.tsx`'s `getOfferBySlug`/`notFound()`, and the same
  "never a partially-rendered draft" rule `insights-engine.md`'s edge cases state explicitly.
- An article with no assigned category (`categoryId: null`) must still render fully (just
  omit the category tag/badge) — this is a documented, valid state, not an error.
- "Related articles" (the mockup's 3-card grid) should reasonably mean: other published
  articles sharing this article's category (excluding itself), falling back to most-recent-
  published when the category has too few (or when this article has no category at all) —
  `insights-engine.md`'s edge case explicitly requires an uncategorized article still be
  "included in search and 'related articles'," so the fallback path must actually be built,
  not skipped.
- The mockup's `.resource-callout` (a generic "Take the free Health Check" CTA appearing once
  mid-article) and `.share-row` (WhatsApp/LinkedIn/Facebook share links) both read as fixed
  template chrome, not per-article authored data — no field for either exists in
  `insights-engine.md`'s Data requirements, and none should be invented; build them as fixed
  UI, with the share links computed from the current article's own live URL/title (same
  pattern as `lib/contact.ts`'s `buildWhatsAppMessage` for URL-encoding user-facing text into
  a share link).
- No object storage (Cloudflare R2) is provisioned yet (ADR 0004 — added "once volume
  justifies it," not on day one) — `article_resource.fileUrl` can't assume a real CDN-backed
  file exists behind every URL yet. Design the "removed file fails gracefully" acceptance
  criterion accordingly: a `target="_blank"` link that fails at the host is an acceptable
  interim behaviour, but consider a lightweight existence check or at minimum ensure the
  download link's surrounding UI never implies a broken page (e.g. no client-side fetch that
  crashes the article route if a HEAD request 404s).
- Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`. Any interactive piece this task adds (e.g. a copy-link share button) must
  source its data as props from the Server Component page, not via a direct `lib/insights`
  import.
- `export const dynamic = "force-dynamic"` — this route reads live `article` content on every
  request, same as every other DB-backed public page.
- Responsive built in from first implementation — the mockup is a desktop-only wireframe; the
  article header, prose column, tables (need a horizontal-scroll wrapper on narrow screens,
  per this project's general "wide content scrolls in its own container" rule), pull quotes,
  resource callout, author bio panel, and related grid must all work at mobile (~375–430px),
  tablet (~768px), and desktop (~1200px+).
- Accessibility WCAG 2.1 AA — table markup needs real `<th scope="col">` semantics; share
  links need accessible names (the mockup's own bare "W"/"in"/"f" glyphs are not
  screen-reader-friendly on their own — add `aria-label`, already partially present in the
  mockup's `aria-label` attributes, but verify each renders as real accessible text, not just
  a visual letter).
- Article JSON-LD (NFR-5): `@type: "Article"`, `headline`, `author` (`Person`, `name` +
  `jobTitle` from `practiceArea`), `publisher` (`Organization`, matching `lib/seo.ts`'s
  existing `FIRM_NAME`/logo pattern), `datePublished` (`publishedAt`), and ideally
  `dateModified` (`revisedAt`, falling back to `publishedAt` when null) — distinct from and
  in addition to `OrganizationJsonLd` (every page already renders that; this is a second,
  article-specific JSON-LD block).
- OG/Twitter metadata: reuse `lib/seo.ts`'s `buildPageMetadata`, but note it currently
  hardcodes a single fallback OG image (`/brand/logo-primary.png`) — this task needs the
  *article's own* `previewImage` as the OG image when present (correctly dimensioned, per the
  acceptance criterion), falling back to that same default only when `previewImage` is null.
  This likely means adding an optional `imageUrl` param to `buildPageMetadata` (or a small
  article-specific variant) rather than duplicating the whole function.
- Do not add a CMS, headless CMS, or page-builder product (ADR 0001) — not a realistic risk
  here, but this task is squarely "render this codebase's own hand-built content model."

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — this route renders this
  codebase's own `article` table directly; no CMS product's template engine or asset pipeline
  is substituted in for the rich body content or downloadable resources.
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router dynamic route
  (`app/insights/[slug]/page.tsx`), TypeScript throughout, Prisma as the only data-access
  layer.
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — Cloudflare R2 object storage isn't
  provisioned yet ("added once media volume justifies it," not day one) — relevant directly
  to how `article_resource.fileUrl`/`previewImage` are expected to behave for now (see
  Architecture constraints above).
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind v4 CSS-first styling,
  shadcn/ui on Base UI, Lucide icons — the article prose, pull-quote, table, and callout
  styling must derive from `ui/design-system.md`'s existing tokens, not new ad hoc values
  (watch specifically for the mockup's `.share-btn`'s `border-radius: 50%` circular buttons —
  check whether that's a legitimate exception to the "no pill/exaggerated rounding" rule
  T4.2 already had to correct for once, since a perfect circle on a small icon-only button
  reads differently from a large pill-shaped filter chip — use judgement, and if in doubt
  prefer `rounded-full` only for a genuinely icon-sized square control, not a wide chip).

## Relevant feature specification
docs/features/insights-engine.md — its "User flow" step 3, "Business rules" (FR-3.3 named
author with photo/practice area, FR-3.4 contextual next-step, FR-3.5 OG/Twitter/structured
data, `published_at` visibility rule), "Interfaces" (`GET /insights/[slug]`, `Article`
JSON-LD), and "Edge cases" (draft 404, removed resource file, uncategorized article in
related articles) sections are this task's exact contract.

## Mockup / UI reference
`ui/mockups/b-insights/insight-owner-drawings.html` — note this is the real path; the epic
file (`docs/tasks/04-insights.md`) names a stale path
(`ui/mockups/a-public-site/insights-article.html`) that does not exist on disk.

## Coding standards
- Mockups are authoritative for UI (applies) — build the article header, prose body, pull
  quotes, table, resource callout, share row, author bio panel, next-step panel, and related
  grid to this mockup's structure and copy pattern (not its literal illustrative article text
  — T4.4 seeds real/placeholder content separately).
- Responsive built in from first implementation (applies) — see Architecture constraints.
- Feature docs are the data/interface contract (applies) — `insights-engine.md`'s Interfaces/
  Edge cases sections are this task's literal contract.
- Business logic lives in `lib/` (applies) — extend `lib/insights.ts`, don't query Prisma
  inline in the route.
- Every entity field maps to the feature doc (applies to the `nextStepCta` schema extension
  this task needs to make — see the important note above).
- Fee amounts as structured min/max bands (not applicable — no fee fields in this domain).
- Content the firm can change lives in the database (applies — this task is precisely what
  makes a single article's full content, byline, and next-step CTA database-backed).
- Diagnostic scoring config is data, not logic (not applicable — different domain).
- Accessibility WCAG 2.1 AA (applies — see Architecture constraints above).
- `export const dynamic = "force-dynamic"` on any DB-backed page/route (applies).
- Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma` (applies — see Architecture constraints above).
- The "one nav entry, second screen via inline link" pattern (not applicable — `/insights/
  [slug]` isn't reached from a nav item, it's reached from index cards, same as `/offers/
  [slug]`).
- The shared generic `page` entity (not applicable — `Article` is already its own dedicated
  entity with its own hero-equivalent header, unlike Capabilities/Our Method/Insights-index).
- Every public page type carries `meta_title`/`meta_description` (applies — `Article`
  already has both, from T4.1).
- Every conversion moment fires through the GTM `dataLayer` pattern (not applicable — reading
  an article isn't one of the six fixed conversion events; the `resource-callout`/
  `next-step-panel` CTAs link to `/diagnostic`/an offer page, which already fire their own
  events on those pages, not here).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T4.4
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
