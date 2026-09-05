# Session 14 — SEO Foundation

# Date: 2026-09-05

# Tasks completed: T2.8

## What Was Built

`docs/features/seo-and-search-foundation.md` in full: `GET /sitemap.xml` (Next.js's built-in
`app/sitemap.ts` convention, `force-dynamic`), Organization JSON-LD sourced live from
`site_settings` and rendered on all seven T2.1–T2.7 page types, and a shared
`buildPageMetadata`/`resolveMetaDescription` helper wiring canonical/OG/Twitter tags and the
blank-description fallback into every page's `generateMetadata`.

## Files Changed

- `lib/seo.ts` — new: `getSiteUrl`, `resolveMetaDescription`, `legalPageBodyExcerpt`,
  `buildPageMetadata`, `getOrganizationJsonLd`, `getSitemapEntries`
- `app/sitemap.ts` — new: `GET /sitemap.xml`
- `components/organization-json-ld.tsx` — new: `<OrganizationJsonLd />` server component
- `app/(public)/page.tsx`, `app/offers/[slug]/page.tsx`, `app/capabilities/page.tsx`,
  `app/our-method/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`,
  `app/legal/[slug]/page.tsx` — `generateMetadata` now calls `buildPageMetadata`/
  `resolveMetaDescription`; `<OrganizationJsonLd />` added to each page's render
- `.env.example` — documented new `NEXT_PUBLIC_SITE_URL` (optional, falls back to
  `https://www.kaalbert.com`)
- `memory/completed-work.md`, `memory/decision-log.md` — this task's entries

## Decisions Made

- Organization JSON-LD is rendered per-page (all seven T2.1–T2.7 components), not once in
  `app/layout.tsx` — the root layout also wraps `/admin`/`/dev`, and `app/not-found.tsx`
  deliberately has zero DB dependency by design; giving the root layout a `site_settings`
  read would force every route dynamic, including the one page whose job is to render even
  when the database is down. See `memory/decision-log.md` for the full reasoning.
- `NEXT_PUBLIC_SITE_URL` falls back to a hardcoded `https://www.kaalbert.com` when unset —
  sitemap/canonical/OG URLs should describe the live site regardless of which host actually
  served the request. Documented, deliberately left blank in `.env.example`.
- Checked every `Company Docs/*.docx` for a real social profile URL before assuming none
  exist (this task's own architecture constraint) — found only platform names (LinkedIn,
  Meta/Facebook/Instagram) in account-ownership context, no actual URLs. `social_profile_urls`
  stays empty (no seed change); `sameAs` is correctly omitted per the feature doc's own edge
  case.
- Organization schema's `address` is one flattened `streetAddress` string + fixed
  `addressCountry: "GH"`, not a locality/region breakdown — `site_settings.address`'s two-line
  format doesn't cleanly separate street from locality, and `schema.org/PostalAddress` doesn't
  require that finer split.

## Current State

Every page type built in Milestone 2 (T2.1–T2.7) now carries full per-page SEO metadata
(title/description/canonical/OG/Twitter) and site-wide Organization structured data; the
sitemap lists exactly the 12 real published URLs. Verified via `curl` (sitemap XML output,
every page's meta/OG/Twitter/JSON-LD tags, JSON-LD correctly absent from the unknown-slug
404) and Playwright MCP (home page + one legal page loaded with zero console errors — no
visual/layout change on any page, so no mobile/tablet/desktop check applied, per this task's
own "no visitor-facing UI surface" scope note).

Only T2.9 (content migration/seed scripts) and T2.10 remain nominally open in this epic —
**T2.10 (custom error pages) is already built** (`app/not-found.tsx`/`app/error.tsx`/
`app/global-error.tsx` all exist and are referenced by this session's own work), just not
yet marked complete in `docs/dashboard.md`/this epic file's own bookkeeping. **T2.9's seed
work also appears to already be fully done** — every T2.1–T2.7 task seeded its own entities
incrementally as it went (see each task's own addendum in
`docs/tasks/02-public-presentation.md`), and `prisma/seed.ts` now has a `seed*` function for
every entity this epic introduced (`HomePageContent`, `Offer`/`OfferTier`, `Capability`/
`AdvisoryRetainer`, `Page` ×4, `MethodStage`, `FirmStatement`/`Author`, `SiteSettings`,
`LegalPage`, `FooterContent`). The next session should **audit T2.9 against its own
acceptance criteria first** (does every non-placeholder field's seed comment actually cite a
specific Company Docs source; does `docs/dashboard.md` correctly surface every
`isPlaceholder: true` row) rather than assume fresh seeding work remains — see this session's
own prompt below, which reflects that reality.

## Blockers

None.

## Next Task

T2.9 — Content migration/seed scripts (in practice: an audit/completion pass over seeding
already done incrementally by T2.1–T2.8, per "Current State" above)
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. Pay particular attention to T2.9's own
addendum in that file (session 07) and to every other T2.x task's addendum referencing T2.9 —
by the time this session starts, T2.1 through T2.8 have each already seeded their own
entities incrementally as they were built (not left for this task), so this task's real
starting point is an audit against its own acceptance criteria, not a blank-slate seed build.

# Task T2.9 — Content migration/seed scripts

## What to build
Seed scripts (per T1.2's convention) populating every entity introduced in this
epic with real, Company-Docs-sourced content where it exists, and clearly flagged
illustrative placeholder where it doesn't (legal text, any copy not yet supplied by the firm).

## Input → Output contract
Company Docs + mockup content → populated database, ready for T2.1–T2.8
to render against.

## Acceptance criteria
Seed runs cleanly on a fresh database; every non-placeholder field
traces to a specific Company Docs source cited in the seed script's own comments; every
placeholder field is queryable/reportable as such (a `is_placeholder` convention or
equivalent) so Milestone 7's admin UI and `docs/dashboard.md` can both surface what's still
pending real content.

## Size / Dependencies
L, depends on: T1.2 (seed script scaffolding/convention — already established and used by
every T2.x task's own seeding since).

**Important — read before doing any new seeding work.** `prisma/seed.ts` already has a
`seed*` function for every entity this epic introduced: `seedHomePageContent`, `seedOffers`/
`seedOfferTiers`, `seedCapabilitiesPage`/`seedCapabilities`/`seedAdvisoryRetainer`,
`seedOurMethodPage`/`seedMethodStages`, `seedAboutPage`/`seedFirmStatement`/`seedAuthors`,
`seedContactPage`/`seedSiteSettings`, `seedLegalPages`/`seedFooterContent` — each added by
the T2.x task that needed it (T2.1 through T2.7), per that task's own addendum note in this
same epic file authorizing it. This task's actual remaining work is most likely an **audit**,
not fresh seeding:
1. Run `npm run db:seed` on a genuinely fresh database and confirm it completes cleanly
   (first acceptance criterion) — do this for real, don't assume it from reading the code.
2. Walk every `seed*` function's own comments and confirm each non-placeholder field's source
   is actually cited (a specific `Company Docs/NN.NN ....docx` reference), per the second
   acceptance criterion — fill in any gap found, don't invent a citation.
3. Confirm every seeded row's `isPlaceholder` value is correct and that `docs/dashboard.md`
   already lists each placeholder field as pending (third acceptance criterion) — update
   `docs/dashboard.md` if it's drifted out of sync with what's actually seeded.
Only write new seed code for a genuine gap this audit actually finds — if the audit finds
nothing missing, say so explicitly in the session summary and commit whatever small
citation/dashboard fixes were needed, rather than manufacturing new seed work to justify the
task.

## Architecture constraints
- **Content the firm can change lives in the database, edited via `/admin`.** Every field
  this task seeds must be real Company-Docs-sourced content where that source exists —
  never fabricated to fill a gap (CLAUDE.md's "Things NOT to Do": do not fabricate legal
  text, diagnostic question wording, or any firm-supplied content).
- **The `is_placeholder` convention is the mechanism, already implemented per-entity** (every
  model in `prisma/schema.prisma` this epic touches has its own `isPlaceholder` column) —
  this task's job is confirming it's used correctly and surfaced in `docs/dashboard.md`, not
  inventing a new mechanism.
- **Business logic lives in `lib/`, never inline in a route handler.** Not directly
  applicable to seed scripts (they're a one-off migration tool, not request-time logic), but
  keep any new seed helper function colocated with the existing `seed*` functions'
  conventions in `prisma/seed.ts` rather than scattering new files.
- Do not fabricate legal text, diagnostic question wording, or any firm-supplied content —
  where real source content doesn't exist yet, it must already be seeded as clearly flagged
  placeholder (T2.7 already did this correctly for three of the four legal pages).

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — one language/framework across the app, so the
seed script is plain TypeScript run through Prisma's own tooling, not a separate migration
system.
ADR 0003 — docs/adr/0003-railway-hosting-and-postgres.md — seeding targets Railway's own
bundled Postgres (via the local dev proxy connection string, not the private-network
hostname — see CLAUDE.local.md), the same database every T2.x page reads live from.

## Relevant feature specification
No single feature spec owns this task — it audits/completes the "Data requirements" sections
already cited across `docs/features/home-page.md`, `core-offer-pages.md`,
`capabilities-page.md`, `our-method-page.md`, `about-and-partners-page.md`,
`contact-and-enquiry.md`, `legal-and-compliance-pages.md`, and
`content-management-admin.md` (site_settings) — cross-check the audit against each rather
than one document.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own; it's the data underneath every UI
surface T2.1–T2.7 already built.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface this task owns;
  the seeded content's real source is each page's own already-built mockup file, already used
  correctly by T2.1–T2.7)
- Responsive is built in from a component's first implementation. (not applicable)
- Feature docs are the data/interface contract. (applies — auditing against each cited feature
  doc's Data requirements section, see above)
- Business logic lives in `lib/`, never inline in a route handler or component. (not directly
  applicable — seed scripts aren't request-time logic; keep new helpers in `prisma/seed.ts`)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies as an audit check — confirm no drift)
- Fee amounts are always a structured min/max band with a scope cap. (applies — confirm every
  seeded `Offer`/`OfferTier`/`AdvisoryRetainer` row still follows this; already true as of
  T2.2/T2.3)
- Content the firm can change lives in the database, edited via `/admin`. (applies directly —
  the whole point of this task)
- Diagnostic scoring configuration is data, not logic. (not applicable — no diagnostic
  entities exist yet, Milestone 3)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (applies as an audit check —
  confirm `capabilities`/`our-method`/`about`/`contact` rows are all present and correctly
  seeded, per T2.3–T2.6's own work)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies as an audit check only — T2.8 already wired the OG/Twitter/JSON-LD half; confirm
  every seeded row's `metaTitle`/`metaDescription` is real, non-empty content, not a gap that
  would trigger T2.8's truncated-excerpt fallback unintentionally)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.10 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.

Note: if this session's own audit confirms T2.10 is already fully built (as this session's
own investigation found — `app/not-found.tsx`/`app/error.tsx`/`app/global-error.tsx` all
already exist and were exercised by T2.8's own verification with zero console errors), say so
explicitly instead of re-building it, mark it complete in `docs/dashboard.md`, and generate
the /task output for whichever epic's task actually comes next per `docs/roadmap.md`
(Milestone 3, `docs/tasks/03-diagnostic.md`, starting from its first task) instead.
```
