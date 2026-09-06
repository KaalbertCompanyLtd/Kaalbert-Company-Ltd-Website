# Session 26 — Article template

# Date: 2026-09-06

# Tasks completed: T4.3

## What Was Built

Built the real article template at `/insights/[slug]`, rendering an `article` row's full rich
body content, byline, downloadable resources, share links, author bio, contextual next-step
CTA, and related articles — matching `ui/mockups/b-insights/insight-owner-drawings.html`'s
structure. A draft article's slug 404s exactly as if it never existed. Added `Article`
JSON-LD and article-specific OG/Twitter metadata (correct image, `og:type: article`).

## Files Changed

- app/insights/[slug]/page.tsx — the article route (header, body blocks, resource callout,
  downloads, share row, author bio panel, next-step panel, related articles)
- components/article-json-ld.tsx — renders `schema.org/Article` structured data
- lib/insights.ts — `getArticleBySlug`, `getRelatedArticles`, `ArticleBodyBlock`,
  `ArticleNextStepCta`, `ArticleDetail`, `buildArticleShareLinks`, `isResourceReachable`
- lib/insights.test.ts — 15 new tests for the above
- lib/seo.ts — `buildPageMetadata` extended with optional `imageUrl`/`type`; new
  `getArticleJsonLd`
- lib/seo.test.ts — new file, tests for both
- prisma/schema.prisma — `Article.nextStepCta` doc-comment revised to its new
  `{heading, body, label, href}` shape (no migration — `Json` column)
- docs/tasks/07-content-admin.md — addendum on T7.2 (see Decisions Made)
- memory/completed-work.md, memory/decision-log.md, memory/technical-debt.md — this
  session's entries

## Decisions Made

- `Article.nextStepCta` widened from `{label, href}` to `{heading, body, label, href}` — the
  mockup's next-step panel has its own heading/lead paragraph, not just a button. No
  migration needed (`Json` column, no fixed DB-layer shape).
- Defined `Article.body`'s block shape for the first time (`ArticleBodyBlock`, a
  `kind`-discriminated union: `paragraph`/`heading`/`quote`/`list`/`table`), mirroring
  `lib/legal.ts`'s `LegalPageBlock` convention.
- The mockup's generic Health Check callout and the WhatsApp/LinkedIn/Facebook share row are
  fixed template chrome, not per-article data. Share links deliberately do **not** reuse
  `WhatsAppLinkButton` (that fires the `whatsapp_opened` conversion event for contacting the
  firm; sharing an article is a different, unmeasured action).
- The "removed resource file fails gracefully" requirement is implemented as a live
  per-request `HEAD` check (`isResourceReachable`) since no object storage (R2, ADR 0004)
  exists yet — logged as technical debt, sequenced into T7.2 (the task that will actually
  wire up R2), not left as an untracked shortcut.
- Share buttons use `rounded-full` despite T4.2's own "no pill shapes" correction — a single-
  glyph icon-sized circle is a different, restrained shape from the wide text-label pill that
  correction targeted; documented inline so it doesn't read as an inconsistency.
- `buildPageMetadata` extended with optional `imageUrl`/`type` params (not a separate
  function) so every existing caller keeps working unchanged.
- Added `getArticleJsonLd`/`ArticleJsonLd`, rendered alongside (never instead of) the
  existing `OrganizationJsonLd` — per `seo-and-search-foundation.md`'s own note that
  per-article structured data was left to this feature.
- Real Playwright verification caught that my own first two seed attempts were flawed (an
  unregistered domain used as a "reachable" test URL, then a seed-script `upsert` bug that
  never replaced stale `article_resource` rows on re-seed) — not a bug in the shipped code,
  confirmed by testing `isResourceReachable` in isolation. Both fixed in the throwaway
  verification script; nothing shipped was wrong. Full account in
  `memory/completed-work.md`.

## Current State

`/insights/[slug]` is live and fully functional against real (if currently empty) `article`
data — verified with a temporary, since-deleted article (all six body block kinds, one
reachable and one broken resource link, a related article, and a separate draft article
confirming the 404 contract) at mobile/tablet/desktop. The real database still has zero
Insights content (T4.4's job). Both `/insights` (T4.2) and `/insights/[slug]` (T4.3) are
ready for real content the moment T4.4 seeds it.

## Blockers

None. One open research question for T4.4, noted in its own handoff below: "Document 13.03,
Section 13" (the epic's cited source for real article content) does not appear to exist as a
literal file in `../Company Docs` — checked directly, see that task's own note.

## Next Task

T4.4 — Article content seed
File: docs/tasks/04-insights.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/04-insights.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T4.4 — Article content seed

## What to build
Seed script with the firm's real articles where supplied (Document 13.03, Section
13), and the mockup's illustrative article flagged `is_placeholder: true` standing in for any
not yet supplied — matching T2.9/T3.3's established placeholder convention.

## Input → Output contract
Company Docs article content (or mockup illustrative content) → seeded
`article`/`author`/`category` rows.

## Acceptance criteria
At least one real, non-placeholder author (a real partner) and
category are seeded even where article body content itself is placeholder, so the byline/
practice-area rendering (FR-3.3) is tested against real data, not fabricated names.

## Size / Dependencies
S, depends on: T4.1 (the `article`/`category`/`article_resource` schema this task populates —
`Article.body`'s block shape and `Article.nextStepCta`'s `{heading, body, label, href}` shape
were both defined at T4.3, not T4.1; use `lib/insights.ts`'s `ArticleBodyBlock`/
`ArticleNextStepCta` types directly rather than inventing a different shape).

**Important — read before starting:** this task's own cited source, "Document 13.03, Section
13," does not appear to exist as a literal file anywhere under `../Company Docs` (checked
directly at T4.3, session 26 — the only "13.0x"-numbered item there is `13.01 Applied
Intelligence Blueprint`, a completely unrelated AI-practice strategy document, not a website
content brief). Before assuming no real article content exists, search `../Company Docs`
thoroughly yourself (past precedent: session 13 found real content by checking that folder
directly rather than assuming), and consider asking the user directly whether real article
copy exists anywhere else. If genuinely unavailable, this task's own Input → Output already
anticipates that: fall back to the mockup's illustrative article content
(`ui/mockups/b-insights/insight-owner-drawings.html`, plus `insights-index.html`'s other 8
card summaries for additional illustrative articles), flagged `isPlaceholder: true` — the
same treatment T3.3 gave the diagnostic question set. Either way, the acceptance criterion's
"real, non-placeholder author and category" is independently satisfiable regardless of
whether article body content itself ends up real or placeholder — `Author` (T2.5) already has
5 real, non-placeholder partner rows seeded; this task does not need to seed authors, only
reference existing ones.

## Architecture constraints
- Business logic lives in `lib/` — this task is pure seed-script work
  (`prisma/seed.ts`, following its own established `seedX()` function-per-epic pattern), not
  a route/lib change; no new business logic is expected here.
- Every entity field maps to the feature doc, with two already-resolved exceptions from this
  epic's own build history: `Article.excerpt` (T4.2) and `Article.nextStepCta`'s widened
  `{heading, body, label, href}` shape (T4.3) — seed real values for both, not just the
  fields `insights-engine.md`'s original Data requirements list names.
- `Article.body` must be seeded using `lib/insights.ts`'s exact `ArticleBodyBlock` shape
  (`{kind: "paragraph" | "heading" | "quote" | "list" | "table", ...}`) — reference that
  type directly in the seed script rather than hand-writing a shape that might drift from
  what `app/insights/[slug]/page.tsx` actually renders.
- `published_at` is the sole visibility rule (T4.1) — every seeded article intended to be
  publicly visible needs a real, non-null `publishedAt` (a past date); do not leave it null
  unless a row is deliberately meant to demonstrate/test the draft state.
- `isPlaceholder: true` on every row whose content is the mockup's illustrative copy, not
  real firm-supplied content — same convention as `DiagnosticQuestion`/`Author`/
  `DiagnosticScoreBand`'s seeded rows. Never present placeholder content as final.
- Category is a real, admin-manageable entity (`content-management-admin.md`) — seed at
  least one real (non-placeholder) `Category` row per the acceptance criterion, with a
  real, meaningful name (not a placeholder label), even if the categories mirror the
  mockup's own two categories ("Financial Control", "Growth & Funding") for now.
- Content the firm can change lives in the database — this task is what actually populates
  that database with real (or clearly-flagged placeholder) Insights content for the first
  time; there is no fallback hard-coded article list anywhere once this ships.
- Do not fabricate legal text, diagnostic question wording, or any firm-supplied content —
  this rule extends directly to article body content: seed the mockup's real illustrative
  copy verbatim (flagged placeholder) rather than writing new invented article text, unless
  real firm-supplied content is found and used instead.

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — seeded content lives in this
  codebase's own hand-built `article`/`category` tables; no CMS import/content pipeline is
  ever introduced to populate them.
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — the seed script itself
  (`prisma/seed.ts`) is TypeScript, run via `tsx`, using the Prisma client as its only
  data-access layer, consistent with every other `seedX()` function in that file.

## Relevant feature specification
docs/features/insights-engine.md — "Business rules" (FR-3.3's "every article has exactly one
named partner author with photo and practice area" — this task must seed that pairing for
real, using an existing `Author` row, not a placeholder name) and "Data requirements" are
this task's exact content contract.

## Mockup / UI reference
`ui/mockups/b-insights/insight-owner-drawings.html` (the one full illustrative article) and
`ui/mockups/b-insights/insights-index.html` (8 more article card summaries — title, excerpt,
category, author — real illustrative content this task can seed as additional
`isPlaceholder: true` rows, even without full body content for each, if only one full article
body exists in the mockups).

## Coding standards
- Mockups are authoritative for UI (not applicable — no UI in this task, seed script only).
- Responsive built in from first implementation (not applicable — no UI in this task).
- Feature docs are the data/interface contract (applies — see Architecture constraints).
- Business logic lives in `lib/` (not applicable — pure seed data, no new logic).
- Every entity field maps to the feature doc (applies — including the two T4.2/T4.3
  extensions noted above).
- Content the firm can change lives in the database (applies — this is exactly what this
  task makes true for Insights content for the first time).
- Do not fabricate legal text, diagnostic question wording, or any firm-supplied content
  (applies directly — see the "Important" note above on sourcing real content first).
- Every public page type carries `meta_title`/`meta_description` (applies — every seeded
  `article` row needs real, non-empty values for both, not blank placeholders).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T4.5
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
