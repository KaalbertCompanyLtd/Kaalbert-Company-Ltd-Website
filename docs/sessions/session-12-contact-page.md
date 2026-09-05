# Session 12 — Contact page

# Date: 2026-09-05

# Tasks completed: T2.6

## What Was Built

`/contact` built to `ui/mockups/a-public-site/contact.html`, reading the optional
`?service=[slug]` param (resolved live against real `Offer`/`Capability` slugs, with an
unrecognised value falling back to no service) and the newly-materialized `site_settings`
singleton. `POST /api/contact/submit` validates and creates a shared `enquiry_record` row,
rejecting a submission with contact consent unchecked (kept separate from marketing consent).
This is also the first task to fire a real `dataLayer.push` from a live conversion point
(`enquiry_submitted`, `whatsapp_opened`) and the first to introduce a reusable
`WhatsAppLinkButton` component.

## Files Changed

- `prisma/schema.prisma` — `SiteSettings`, `EnquiryRecord` models added.
- `prisma/migrations/20260905151229_t2_6_site_settings_and_enquiry_record/` — migration.
- `prisma/seed.ts` — `seedContactPage()`, `seedSiteSettings()`.
- `lib/site-settings.ts` — `getSiteSettings`, `splitAddressLines`, `toTelHref` (new).
- `lib/contact.ts` — `resolveServiceContext`, `buildWhatsAppMessage` (new).
- `lib/enquiries.ts` — `createContactEnquiry`, `ContactValidationError` (new).
- `lib/data-layer.ts` — `pushDataLayerEvent`, the shared `dataLayer.push` mechanism (new).
- `app/api/contact/submit/route.ts` — `POST` handler (new, first API route in the repo).
- `app/contact/page.tsx` — the page itself (new).
- `components/contact-form.tsx` — client form component (new).
- `components/whatsapp-link-button.tsx` — the shared `WhatsAppLinkButton` (new).
- `docs/features/contact-and-enquiry.md`, `docs/features/business-health-check-diagnostic.md`
  — `message` field documented; `traffic_source`/`campaign`/`landing_page` scoping decision
  noted.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for two sequenced technical-debt items.
- `memory/decision-log.md`, `memory/technical-debt.md`, `memory/completed-work.md` — this
  task's scoping decisions and two new debt items.

## Decisions Made

- `enquiry_record`'s diagnostic-specific fields (`scoreSummary`, `weakestDimensions`,
  `triageFlag`) modelled now as nullable, per the task's own explicit allowance; the
  `diagnostic_response` relation and `traffic_source`/`campaign`/`landing_page` deliberately
  NOT modelled — the latter because `measurement-and-attribution.md` describes attribution as
  a separate entity with its own FK, disagreeing with `business-health-check-diagnostic.md`'s
  inline-column description. Left for Milestone 5 to resolve. Full reasoning in
  `memory/decision-log.md`.
- `/contact` reuses the shared `Page` model (slug `"contact"`) for hero/meta — same pattern as
  capabilities/our-method/about.
- `site_settings.response_time_commitment` seeded `null`, not the mockup's "pending" caption —
  `/contact` omits that panel entirely while null. Tracked as user-triggered technical debt,
  sequenced into T7.8.
- `SiteFooter` callers across every public page (including this task's own `/contact`) still
  pass hardcoded address/phone props instead of reading `site_settings` live — logged as
  technical debt, sequenced into T7.8 rather than fixed here, per the task's own explicit
  allowance.

## Current State

`/contact` is live, functional, and verified end-to-end (form submission, consent rejection,
service-param resolution, WhatsApp/phone/email links, both new `dataLayer` events) — ready for
T2.7.

## Blockers

None.

## Next Task

T2.7 — Legal & compliance pages
File: docs/tasks/02-public-presentation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/02-public-presentation.md — this task is one part of
a larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T2.7 — Legal & compliance pages

## What to build
`/legal/[slug]` routes (privacy, terms, cookies, etc.) to
`ui/mockups/a-public-site/legal-*.html`, reading `footer_content`/legal page entities per
`docs/features/legal-and-compliance-pages.md`, all clearly flagged as illustrative pending the
firm's actual legal text, per standing instruction — never presented as final copy.

## Input → Output contract
Migrated legal page rows (flagged draft) → rendered pages, linked from SiteFooter.

## Acceptance criteria
Every footer legal link resolves; each page carries a visible "draft — pending legal review"
marker until the firm supplies final text (tracked as a known placeholder in
`docs/dashboard.md`, not silently shipped as final).

## Size / Dependencies
S, depends on: T1.5 (provides `SiteHeader`/`SiteFooter`, already built and composed directly
by every public page — there is no shared `(public)` layout; every real public page since
T2.2 passes a live `offerNavLinks` prop, fetched via `lib/offers.ts`'s `getOfferNavLinks()`,
into every `SiteHeader` instance — this page must do the same), T2.9 (seed data — no
`legal_page`/`footer_content` table exists yet; per T2.1/T2.3/T2.4/T2.5/T2.6's own precedent
of doing its own epic's seed work when nothing else has yet, this task must add both models
itself and seed all four legal pages plus the `footer_content` singleton).

## Architecture constraints
- **The mockups are authoritative.** Build to each of the four legal mockup files' structure
  and copy exactly — don't invent layout. Note: the epic file's own text says
  `ui/mockups/a-public-site/legal-*.html`, but the four real files actually live at
  `ui/mockups/e-legal/{privacy-notice,cookie-notice,terms-of-use,scope-of-practice}.html` —
  build to those real paths, and flag the epic-file path discrepancy in
  `memory/decision-log.md` rather than silently treating it as resolved.
- **Responsive is built in from a component's first implementation, never a later pass.**
  These mockups are desktop-only wireframes — each legal page (long-form body text) must also
  work at mobile (~375–430px) and tablet (~768px) before being called done.
- **Feature docs are the data/interface contract.** `legal-and-compliance-pages.md`'s Data
  requirements section: `legal_page` (id, slug — one of the four fixed slugs, title, body rich
  content, last_revised_at) and `footer_content` (scope_of_practice_statement,
  company_registration_details, nullable until supplied) — distinct from `site_settings`
  (T2.6, contact details), which the footer also reads from; these are two separate singleton
  panels on the same future Site Settings admin screen (T7.8), not one merged entity.
- Business logic (resolving a legal page by slug, resolving `footer_content`) lives in `lib/`
  (e.g. `lib/legal.ts`), never inline in the page component, matching every other page built
  this epic (`lib/pages.ts`, `lib/about.ts`, `lib/site-settings.ts`).
- Every entity field named in `legal-and-compliance-pages.md`'s Data requirements section maps
  to a Prisma schema field of the same name.
- All four documents live at stable, individually-linkable URLs — never one combined page with
  anchors — because advertising platforms require a direct privacy-policy URL during account
  verification.
- The scope-of-practice statement renders as a shared footer component on every page
  site-wide, including every landing page (FR-5.1) — check whether `components/
scope-of-practice-note.tsx` (already used by `SiteFooter`, see T2.1/T2.2) already renders this
  content, and whether it needs to switch from hardcoded text to reading the new
  `footer_content.scopeOfPracticeStatement` live, the same "second hardcoded copy" gap T2.6
  flagged for `site_settings` (`memory/technical-debt.md`) — resolve or explicitly log the
  same kind of gap here, don't silently leave two sources of truth.
- Company registration details render in the footer only once supplied (nullable) — omit the
  line entirely when absent, never a placeholder (same "blank field is omitted, not shown
  broken" pattern as `site_settings` in `content-management-admin.md`).
- This content is drafted by the firm with counsel, not authored by the build team — seed
  clearly flagged illustrative/draft text (`is_placeholder`/equivalent convention, per
  standing instruction and T2.9's own rule), and the acceptance criterion's visible "draft —
  pending legal review" marker must appear on every legal page until real text is supplied.
- **Every public page type carries `meta_title`/`meta_description`** — decide whether these
  four pages reuse the shared `Page` model (T2.3/T2.4/T2.5/T2.6's pattern) for hero/meta
  fields or whether `legal_page`'s own `title` is sufficient given these mockups' plain,
  hero-less `<body>` (per the epic's own note: "no hero per ui/mockups/e-legal/*.html's plain
  `<body>`") — confirm against the actual mockups before assuming either way.
- **Add `export const dynamic = "force-dynamic";`** to every legal page route. Standing
  CLAUDE.md rule for every page reading live database content (`legal_page`/`footer_content`
  here) — hit for real at T2.1 (Railway's build container can't reach the private-network DB
  host).
- Accessibility: WCAG 2.1 AA — long-form legal body content should render with real heading
  structure (not a single unstructured blob), matching whatever structure the mockups' own
  body copy uses.

## Relevant ADRs
ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router is the one framework
serving the public site; `/legal/[slug]` is a standard dynamic App Router route reading from
Postgres via Prisma, the same pattern as `/offers/[slug]` (T2.2).
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
`@theme`-declared tokens) + shadcn/ui on Base UI + Lucide icons is the styling/component layer
these pages must be built from, consistent with every other public page this epic.

## Relevant feature specification
docs/features/legal-and-compliance-pages.md — the full data/interface contract for this task
(goal, user flow, business rules, `legal_page`/`footer_content` data requirements, the
launch-gate and company-registration-details edge cases). Also check
`docs/features/content-management-admin.md`'s Site Settings section for how `footer_content`
sits alongside `site_settings` on the same future admin screen (T7.8), for schema consistency.

## Mockup / UI reference
`ui/mockups/e-legal/privacy-notice.html`, `ui/mockups/e-legal/cookie-notice.html`,
`ui/mockups/e-legal/terms-of-use.html`, `ui/mockups/e-legal/scope-of-practice.html` — the
accepted, authoritative wireframes for these four screens (the epic file's own text names a
different path, `ui/mockups/a-public-site/legal-*.html`, which does not exist — these are the
real files; see the architecture-constraints note above). No hero section (plain `<body>`,
per the epic's own T2.10 addendum) — build to each file's actual structure and copy exactly.

## Coding standards
- The mockups are authoritative for UI tasks. (applies — the four `e-legal/*.html` files)
- Responsive is built in from a component's first implementation. (applies — mobile ~375–
  430px, tablet ~768px, desktop ~1200px+ for each legal page's body layout)
- Feature docs are the data/interface contract. (applies — `legal-and-compliance-pages.md`'s
  Data requirements section)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (applies — e.g. `lib/legal.ts`)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies — `legal_page`, `footer_content`)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no
  fee/pricing content on these pages)
- Content the firm can change lives in the database, edited via `/admin`. (applies —
  `legal_page.body`, `footer_content`'s two fields, all firm/counsel-supplied)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies where any interactive element
  exists on these pages — otherwise plain semantic HTML with real heading structure for the
  long-form body content)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (only applies if this task decides
  to reuse `Page` for hero/meta fields — see architecture constraints above; these mockups
  have no hero, so confirm before assuming)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (applies for title/description per this task; OG/Twitter/JSON-LD remains T2.8's job)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not
  applicable — legal pages are not a conversion moment)
- Never a hard-coded measurement/advertising tag outside GTM. (not applicable directly, no
  new tag surface introduced here)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.8 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
