# Session 06 — Environment/secrets and GTM container stub

# Date: 2026-09-05

# Tasks completed: T1.6

## What Was Built

Installed the empty Google Tag Manager container (ADR 0006) in the root `app/layout.tsx` —
the standard head bootstrap script plus the post-`<body>` noscript iframe fallback — reading
`GTM_CONTAINER_ID` from the environment and rendering nothing at all when it's unset. Documented
the existing three-tier env-var convention (`.env.local`/`.env.production`/Railway service
vars) in the README, which hadn't covered environment variables before this task.

## Files Changed

- `components/google-tag-manager.tsx` — new: `GoogleTagManagerHeadScript` (`next/script`,
  `afterInteractive` strategy, the standard GTM bootstrap IIFE) and
  `GoogleTagManagerBodyFrame` (the noscript iframe), each taking `containerId` as a required
  prop
- `app/layout.tsx` — reads `GTM_CONTAINER_ID` from `process.env`; conditionally renders the
  head script before `<body>` and the noscript frame as the first child inside `<body>`,
  only when the var is set
- `README.md` — new "Environment Variables & Secrets" section documenting the three-tier
  convention and every current `.env.example` var
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.3 pointing to the
  GTM-not-provisioned debt entry, marked `Trigger type: User-triggered`
- `memory/technical-debt.md` — new "GTM container not yet provisioned" entry
- `memory/decision-log.md` — new entry recording the placeholder-vs-real-ID decision (user
  confirmed no GTM account exists yet)
- `memory/completed-work.md` — new T1.6 entry
- `.gitignore` — added `.playwright-mcp/` (verification-tool session artifacts left behind
  during this task's Playwright checks; not previously ignored, so they showed up as
  untracked files)

## Decisions Made

- Asked the user up front whether a real GTM container already existed, since the task's
  acceptance criterion (GTM Preview mode) needs one. User confirmed none exists yet and chose
  to proceed with a placeholder env var rather than pausing to create an account mid-session
  — same external-account pattern already established for the `kaalbert.com` domain
  registration in T1.1.
- The GTM snippet renders nothing at all (no `<script>`/`<noscript>` output whatsoever) when
  `GTM_CONTAINER_ID` is unset, rather than emitting a script tag with an empty/`undefined`
  ID — an explicit choice to avoid shipping a broken tag reference in dev/CI/any environment
  where the var isn't yet provisioned.
- Used `next/script`'s `afterInteractive` strategy (not `beforeInteractive`) for the head
  script, matching Next.js's own documented Google Tag Manager integration pattern — GTM
  doesn't need to block first paint the way a polyfill would.

## Current State

T1.6 is functionally complete and verified as far as possible without a real GTM account:
confirmed via `curl` that no GTM markup renders when the env var is unset, and via Playwright
against a throwaway `GTM-TEST123` ID that `window.dataLayer` initializes correctly, the
`gtm.js` request fires at the right interpolated URL, and the noscript iframe is the first
child of `<body>`. Full closure of the "GTM Preview mode" acceptance criterion is deferred to
T5.3 (Milestone 5), logged as user-triggered technical debt. Foundation epic (Milestone 1) is
now fully done except for the still-open, user-triggered `kaalbert.com` domain registration
from T1.1. Ready to start Milestone 2 (Public Presentation Layer).

## Blockers

None for T1.6 itself. Two open user-triggered items remain logged in
`memory/technical-debt.md`, neither blocking further work: `kaalbert.com` domain registration
(T1.1) and the GTM container not yet being provisioned (this session, sequenced into T5.3).

## Next Task

T2.1 — Home page
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.1 — Home page

## What to build
`/` route to `ui/mockups/a-public-site/home.html`, reading `home_page_content`
(`docs/features/home-page.md`), including `meta_title`/`meta_description`.

## Input → Output contract
Migrated `home_page_content` row → rendered home page matching the mockup pixel-for-pixel on
shared primitives (T1.3/T1.4), with correct meta tags in page source.

## Acceptance criteria
Visual diff against the mockup passes; `view-source` shows populated `<title>` and meta
description; all nav links resolve (no 404s to pages built later in this same epic once the
epic completes).

## Size / Dependencies
M, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and used by every
public page from here on), T2.9 (seed data — the `home_page_content` row, plus the `offer`
rows the home page's three offer cards read, must exist in the database before this page can
render real content; if T2.9 has not yet been done when this task starts, do T2.9's seed
work — or at minimum the `home_page_content` + `offer` portions of it — first, since T2.1
has nothing real to render without it despite T2.9's higher number in the epic file).

## Architecture constraints
- **The mockups are authoritative.** Build `/` to `ui/mockups/a-public-site/home.html`'s
  structure and copy exactly — don't invent layout.
- **Responsive is built in from a component's first implementation, never a later pass.**
  The mockup is desktop-only; this page must also work at mobile (~375–430px) and tablet
  (~768px) before being called done, using the design system's existing spacing/stacking
  patterns (`ui/design-system.md`) — `SiteHeader`'s own mobile drawer nav is already handled
  by T1.5, so this task's own responsive work is about the home page's content sections
  (hero, offer cards, method graphic, senior-attention passage, featured Insights, diagnostic
  CTA), not the nav chrome.
- **Feature docs are the data/interface contract.** `docs/features/home-page.md`'s "Data
  requirements" section (`home_page_content`: hero_statement, primary_cta_label,
  primary_cta_href, senior_attention_copy, featured_article_ids, meta_title,
  meta_description) is not optional — every field maps to a Prisma schema field of the same
  name.
- Business logic (e.g. resolving `featured_article_ids` to actual published articles, with
  the documented most-recent fallback) lives in `lib/`, never inline in the page component.
- **Content the firm can change lives in the database, never hard-coded** — every piece of
  copy this page renders comes from the seeded `home_page_content`/`offer`/`article` rows,
  not literal strings in the component (matching the pattern `SiteFooter` already
  established at T1.5 for `site_settings` fields).
- **Every public page type carries `meta_title`/`meta_description`** plus OG/Twitter tags +
  JSON-LD structured data (`seo-and-search-foundation.md`) — this is part of this page being
  "done," not a follow-up. Note: T2.8 (SEO foundation, later in this epic) owns the
  sitewide Organization JSON-LD and the sitemap; this task owns only its own per-page
  `<title>`/meta description tags and any article-level OG/Twitter tags for the featured
  Insights it links to, per `insights-engine.md` FR-3.5.
- **Never a hard-coded measurement/advertising tag outside GTM** — this page fires no
  `dataLayer.push` of its own; the diagnostic-started/summary-requested events are
  Milestone 3/5's job, not this task's, even though this page links to the diagnostic and
  contains its primary CTA.
- Handle the documented edge cases exactly: fewer than three published offers → render only
  the offers that exist, never a broken placeholder card; no published Insights articles →
  omit the featured-Insights section entirely rather than showing it empty; a manually
  pinned but since-unpublished featured article → fall back to most-recent automatically.
- Diagnostic scoring configuration is data, not logic — not touched by this task, but the
  home page's primary CTA links into the diagnostic (Milestone 3), so its `href` must point
  at the diagnostic's real entry route once that exists (or the `primary_cta_href` value
  seeded in T2.9, whichever governs at the time this task is built).

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site, the diagnostic, and the admin area; this page is a standard
server-rendered App Router route.
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component
layer this page's sections (offer cards, method graphic, CTA buttons) must be built from —
no new component library, no hand-rolled styling system.

## Relevant feature specification
docs/features/home-page.md — the full data/interface contract for this page (goal, user
flow, business rules, `home_page_content` data requirements, edge cases). Also read
docs/features/seo-and-search-foundation.md for the per-page meta-tag rule this task must
satisfy (not the sitewide sitemap/JSON-LD parts, which are T2.8's job).

## Mockup / UI reference
ui/mockups/a-public-site/home.html — build to this file's structure and copy exactly; it is
the accepted, authoritative wireframe for this screen (`ui/screen-inventory.md` #1).

## Coding standards
- The mockups are authoritative for UI tasks. (applies — `ui/mockups/a-public-site/home.html`)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for every content section this page adds)
- Feature docs are the data/interface contract. (applies — `home-page.md`'s "Data
  requirements" section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. a `lib/home.ts` or
  similar resolving `featured_article_ids` with the most-recent fallback)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `home_page_content`)
- Fee amounts are always a structured min/max band with a scope cap. (applies indirectly —
  the three offer cards this page renders must display `offer.fee_amount_min`/
  `fee_amount_max` as a range, per the pattern already flagged in T1.5's `SiteHeader`
  addendum for T2.2 to wire; this page's own offer cards need the same real field once
  `offer` rows exist, not the hard-coded `CORE_OFFERS` fee-hint copy T1.5 used as a
  placeholder)
- Content the firm can change lives in the database, edited via `/admin`. (applies —
  `home_page_content`, `offer`, `article` are all database-sourced; no admin screen exists
  yet to edit them, per this epic's own opening note, but the read side must already be
  fully database-driven)
- Diagnostic scoring configuration is data, not logic. (not applicable — this task only
  links to the diagnostic, doesn't implement it)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies — any interactive element this
  page adds, e.g. an accordion or carousel for the offer cards/Insights section if the
  mockup uses one)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no
  subordinate screen introduced by this task)
- The shared generic `page` entity for marketing-page copy. (not applicable — the home page
  has its own dedicated `home_page_content` entity per `home-page.md`, not the shared `page`
  entity Capabilities/Our Method use)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies — see Architecture constraints above for the T2.1-vs-T2.8 split)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not
  applicable to this task directly — no `dataLayer.push` calls belong here; the page merely
  links to where those events will eventually fire)
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.2 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
