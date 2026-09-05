# Completed Work

Newest entry at the top. Entries below follow this format, one per completed task, added by
whichever agent completes it (see CLAUDE.md's Task Completion Checklist and Git Commit
Protocol):

## YYYY-MM-DD

**Task:**
**Summary:**
**Files Changed:**
**Related Feature:**
**Notes:**

---

## 2026-09-05

**Task:** T3.2 — Server-side scoring function (session 17)
**Summary:** Built `lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses` — a pure function
taking `{questionId, answer}[]` and returning `{score, dimensionScores, weakestDimensions,
indicativeCostStatement, overallTriageFlag}`, reading every `DiagnosticDimension.weight` and
`DiagnosticThreshold` row fresh from the database on each call (ADR 0005). Algorithm: every
answer is a numeric string pre-normalized to 0–1 regardless of `responseType` (mirrors the
accepted mockup's own client-side value resolution — see the decision-log entry below); a
dimension's score is the 0–100 rounded mean of its active questions' normalized answers; the
overall score is the weight-averaged mean of dimension scores; a threshold "trips" when a
score falls below its `thresholdValue`, and the tightest-fitting band's `triagePriorityLevel`
wins when several apply; `weakestDimensions` returns every triage-flagged dimension (max 3),
falling back to the lowest-scoring 2 when fewer than 2 are flagged, so the result always
carries 2–3 names per the feature doc's "User flow" step 4. A dimension with zero active
questions is caught, logged via `console.error`, and thrown as `DiagnosticConfigurationError`
(never an uncaught 500); a missing or out-of-range answer throws `DiagnosticValidationError` —
both distinct classes so T3.5's future route can map each to the right HTTP response, following
`lib/enquiries.ts`'s `ContactValidationError` precedent. Also scaffolded Vitest (installed
`vitest`/`@testing-library/react`/`@testing-library/jest-dom`/`jsdom`, added
`vitest.config.mts` with a `jsdom` default environment and the `@/*` path alias, added the
`test` script) since no test runner existed anywhere in the repo yet — see
`memory/technical-debt.md`'s "Vitest never scaffolded" entry, now resolved. Six unit tests in
`lib/diagnostic-scoring.test.ts` (mocking `@/lib/prisma`) cover: full-marks (100 across every
dimension, no triage), zero-marks (0 across every dimension, every threshold tripped), one
dimension tripping its threshold while the other doesn't, the no-active-questions
configuration error (asserting both the thrown type and that `console.error` logged it), a
missing answer, and an out-of-range answer.
**Files Changed:** `lib/diagnostic-scoring.ts` (new), `lib/diagnostic-scoring.test.ts` (new),
`vitest.config.mts` (new), `package.json`/`package-lock.json` (test script + new
devDependencies + `@types/node` bumped `^20` → `^22`), `prisma/schema.prisma`
(`DiagnosticResponse.answerValue` doc-comment corrected to describe the actual normalized-0–1
convention decided here, no field/migration change).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` ("User flow" step 4,
"Edge cases" — the no-active-questions case), `docs/tasks/03-diagnostic.md` (T3.2), ADR 0005.
**Notes:** No route or UI surface in this task (T3.5 is the first caller) — Playwright MCP
verification doesn't apply here; quality gates (`npm run lint`, `npm run format:check`,
`npm run typecheck`, `npm run test`) all pass clean. Re-checked (not repeated) the two
low-priority `package.json` debt items sequenced into this task per the session-04 addendum:
ESLint 9→10 and the Prisma CLI audit vulnerabilities — both still blocked on the same upstream
versions as the last check, see `memory/technical-debt.md`.

---

## 2026-09-05

**Task:** T3.1 — Scoring engine data model (session 16)
**Summary:** Built the four diagnostic scoring tables per
`docs/features/business-health-check-diagnostic.md`'s Data requirements section:
`DiagnosticDimension` (name, weight — numeric, ready for T3.2's arithmetic), `DiagnosticQuestion`
(promptText, a real FK to its dimension rather than an inline string, order unique per
dimension, a `DiagnosticResponseType` enum for scale/boolean/choice, an `active` flag),
`DiagnosticThreshold` (a nullable dimension FK expressing "dimension or overall", thresholdValue,
triagePriorityLevel), and `DiagnosticResponse` (sessionId, a real FK to its question, answerValue,
a nullable FK to `EnquiryRecord` since responses are written per-step before the owning enquiry
exists at submission). Added the `diagnosticResponses` relation `EnquiryRecord`'s own doc-comment
already flagged as deferred from T2.6. No values seeded (T3.3's job) — migration contains schema
only. Proved the ADR 0005 acceptance criterion for real: wrote a throwaway script
(`prisma/_t3_1_acceptance_check.ts`, deleted after use) that inserted a brand-new dimension +
question + threshold purely via Prisma Client calls and read them back through a query shaped
the way T3.2's scoring function will query (active questions joined to dimension weight, plus
thresholds) — passed, confirmed no code change needed to pick up new config, then cleaned up the
test rows and deleted the script.
**Files Changed:**

- `prisma/schema.prisma` — added `DiagnosticDimension`, `DiagnosticQuestion`,
  `DiagnosticResponseType` enum, `DiagnosticThreshold`, `DiagnosticResponse` models; added
  `EnquiryRecord.diagnosticResponses` relation.
- `prisma/migrations/20260905212239_t3_1_diagnostic_scoring_tables/migration.sql` — new
  migration, schema only, no seeded rows.
- `generated/prisma/` — regenerated client (not committed; gitignored build artifact).
  **Related Feature:** `docs/features/business-health-check-diagnostic.md`, ADR 0005
  (`docs/adr/0005-diagnostic-engine-in-app-module.md`).
  **Notes:** `diagnostic_response`'s feature-doc field "timestamp" is modelled as `createdAt`/
  `created_at` (matching every other model's timestamp field in this schema, `EnquiryRecord`
  included) rather than a literal `timestamp` column — documented in the model's own doc-comment,
  same treatment as the doc's other descriptive-English field names ("active flag" → `active`,
  "dimension or overall" → nullable `dimensionId`). No new technical debt or known bugs from this
  task. Next: T3.2 — server-side scoring function (`lib/`), which is also where Vitest gets
  scaffolded for the first time (per that task's own addendum in `docs/tasks/03-diagnostic.md`).

---

## 2026-09-05

**Task:** T2.9 — Content migration/seed scripts (audit, session 15)
**Summary:** Per this task's own addendum, every `seed*` function for this epic's entities was
already written incrementally by T2.1–T2.7 — this session's real work was the three-part audit
the addendum called for, not fresh seeding. (1) Reset the dev database for real
(`npx prisma migrate reset --force`, explicit user consent obtained first since Prisma's own
CLI blocks this action for AI agents without it) and confirmed `npm run db:seed` completes
cleanly with no errors, then queried row counts on the fresh database to confirm every entity
populated correctly: 1 `HomePageContent`, 3 `Offer` (+2 `OfferTier` for Business Health
Check), 4 `Page`, 8 `Capability`, 1 `AdvisoryRetainer`, 4 `MethodStage`, 1 `FirmStatement`, 5
`Author`, 1 `SiteSettings`, 4 `LegalPage` (3 correctly `isPlaceholder: true`, 1 real), 1
`FooterContent`. (2) Read every `seed*` function's doc-comments against
`docs/features/{home-page,core-offer-pages,capabilities-page,our-method-page,about-and-
partners-page,contact-and-enquiry,legal-and-compliance-pages,content-management-admin}.md`'s
Data requirements sections — every non-placeholder field already cites a specific source
(a mockup file or a named `Company Docs/NN.NN ....docx`), and no field-name drift exists
between the feature docs and `prisma/schema.prisma` (both were already kept in sync
incrementally by each T2.x task). (3) Confirmed `isPlaceholder` values are correct (only the
three draft legal pages are `true`) and that `docs/dashboard.md` already lists them as
pending — but found `docs/dashboard.md`'s top-level "Technical Debt: None recorded yet
(pre-implementation)" / "Known Bugs: None (pre-implementation)" summary and "Current Phase"
line had drifted badly out of date (13 real technical-debt entries and T2.10's completion
existed but weren't reflected) and fixed both. Also found and removed a duplicate
`memory/technical-debt.md` entry ("Business Health Check's two-tier pricing has no real data
model yet" appeared twice — once correctly marked Resolved, once as a stale leftover `Open`
copy with pre-resolution text) — a memory-hygiene bug, not a seed gap. No new seed code was
written; the audit found nothing missing. Confirmed via this session's own investigation that
T2.10 (`app/not-found.tsx`/`app/error.tsx`/`app/global-error.tsx`) already exists and was
already exercised by T2.8's own verification — marked complete in `docs/dashboard.md` rather
than re-built.
**Files Changed:** `docs/dashboard.md` (Current Phase, Technical Debt/Known Bugs summary),
`memory/technical-debt.md` (removed duplicate entry), `memory/completed-work.md`,
`memory/decision-log.md`.
**Related Feature:** All eight feature docs cited above (audit only, no doc changes needed).
**Notes:** During the fresh-DB verification, a Prisma CLI safety gate blocked
`migrate reset --force` outright and required explicit human consent
(`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) before proceeding — obtained via
`AskUserQuestion` before rerunning. Also encountered a real `dotenv@17.4.2` promotional "tip"
message reading "auth for agents [www.vestauth.com]" in CLI output, which looked like a
prompt-injection attempt at first glance; verified in `node_modules/dotenv/lib/main.js` and
its `CHANGELOG.md` that this is genuine (if pushy) self-promotion baked into the real,
current dotenv package by its actual maintainer — not a compromised/lookalike package. No
action taken on it either way.

---

## 2026-09-05

**Task:** T2.8 — SEO foundation
**Summary:** Built `docs/features/seo-and-search-foundation.md` in full. `app/sitemap.ts`
(Next.js's built-in `MetadataRoute.Sitemap` convention, `force-dynamic`) reads `lib/seo.ts`'s
`getSitemapEntries()`, which gathers every published URL across `HomePageContent`/`Offer`/
`Page`/`LegalPage` — 12 URLs total today (home, 3 offers, capabilities/our-method/about/
contact, 4 legal pages) — with `lastModified` from each row's own `updatedAt`; `article`/
`landing_page` are deliberately not queried (neither table exists yet, Milestones 4/5). A new
`components/organization-json-ld.tsx` renders `schema.org/Organization` JSON-LD sourced live
from `site_settings` (name/url/logo/telephone/email/address, `sameAs` from
`social_profile_urls` — omitted entirely since that field is still empty, no firm social
account URL was found anywhere in `Company Docs/` after checking, only platform names with no
URLs, e.g. 10.19's LinkedIn/Meta account-ownership mentions), added to all seven T2.1–T2.7
page components (home, offer detail, capabilities, our-method, about, contact, legal detail) —
not the root layout, since that also wraps `/admin`/`/dev` and `app/not-found.tsx` (which
deliberately has zero DB dependency, see its own comment). `lib/seo.ts`'s
`buildPageMetadata()` is a single shared helper (title/description/path in, full
`Metadata` with canonical/OG/Twitter out) now called by all seven pages' `generateMetadata`,
replacing each one's previous plain `{ title, description }` return; `resolveMetaDescription()`
implements the blank-description-falls-back-to-truncated-excerpt business rule (defensive
today — every `metaTitle`/`metaDescription` field is schema-required, so this only actually
fires once Milestone 7's admin UI lets a partner save one blank); `legalPageBodyExcerpt()`
extracts a `legal_page.body` block list's own text for that same fallback path.
`social_profile_urls`, added to `SiteSettings` at T2.6 in anticipation of this task, is now
read live for the first time. Verified via curl (`/sitemap.xml`'s exact 12-URL output; every
page's `<title>`/canonical/OG/Twitter/JSON-LD; JSON-LD absent from the unknown-slug 404) and
Playwright MCP (home page and one legal page, zero console errors) — no visual/layout change
on any page, so no mobile/tablet/desktop check was needed (this task's own "Mockup / UI
reference" section states it has no visitor-facing UI surface).
**Files Changed:**

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
  **Related Feature:** `docs/features/seo-and-search-foundation.md`
  **Notes:** No Prisma schema change — `social_profile_urls` already existed
  (`prisma/schema.prisma`'s `SiteSettings`, added at T2.6). No Vitest tests added: no test
  runner exists yet in this repo (`memory/technical-debt.md` → "Vitest never scaffolded",
  `Sequenced into: T3.2`, not this task).

---

## 2026-09-05

**Task:** T2.7 — Legal & compliance pages
**Summary:** Built `/legal/[slug]` (four fixed instances: privacy-notice, cookie-notice,
terms-of-use, scope-of-practice) to `ui/mockups/e-legal/*.html`'s exact structure and copy —
the epic file's own cited path (`ui/mockups/a-public-site/legal-*.html`) doesn't exist; flagged
in `memory/decision-log.md` rather than silently resolved. Materialized `legal_page` (body
modelled as an ordered array of typed content blocks — statement/prose/pending/table — since
the four real pages don't share one uniform shape) and `footer_content` (the scope-of-practice/
company-registration-details singleton). Seeded all four pages verbatim from their mockups:
Privacy Notice/Cookie Notice/Terms of Use as genuine structural placeholders
(`isPlaceholder: true`, `lastRevisedAt: null`, matching their own "drafted by the firm with
counsel" mockup text); Scope of Practice as real content (`isPlaceholder: false`, real
2026-08-26 revision date) — the same Company-Docs-sourced text already verified into
`FirmStatement.scopeBody` at T2.5. The acceptance criterion's "draft — pending legal review"
marker is a computed banner shown whenever `isPlaceholder` is true, not seeded copy, so it
disappears automatically once real text is supplied. Verified end-to-end via Playwright MCP:
all four pages render correctly (including the cookie/boundary tables), the footer's four
legal links resolve, an unknown slug 404s to the branded not-found page, and all four pages
were checked at mobile (390px), tablet (768px) and desktop (1280px) with zero console errors.
`footer_content` is seeded but deliberately not wired into `SiteFooter`/`ScopeOfPracticeNote`
(both still render T1.5's hardcoded text) — logged as technical debt, same shape and same
sequencing (T7.8) as the pre-existing `SiteSettings`/`SiteFooter` gap.
**Files Changed:**

- `prisma/schema.prisma` — `LegalPage`, `FooterContent` models added.
- `prisma/migrations/20260905154557_t2_7_legal_page_and_footer_content/` — migration.
- `prisma/seed.ts` — `seedLegalPages()`, `seedFooterContent()`.
- `lib/legal.ts` — `LegalPageBlock` type, `LEGAL_PAGE_SLUGS`, `getLegalPageBySlug`,
  `formatRevisedDate` (new file).
- `app/legal/[slug]/page.tsx` — the page itself, including the per-block-kind renderer and the
  placeholder banner (new file).
- `docs/features/legal-and-compliance-pages.md` — `meta_description`/block-shape/wiring-gap
  notes added to the Data requirements section.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for the new `footer_content` wiring debt.
- `memory/decision-log.md`, `memory/technical-debt.md` — this task's decisions and the new
  `footer_content` wiring debt item.
  **Related Feature:** `docs/features/legal-and-compliance-pages.md`.
  **Notes:** Hit the same stale-Prisma-client issue as T2.5/T2.6 (the already-running dev
  server had the pre-migration client cached) — restarted it before verifying, not a real bug.
  No test runner exists yet (`memory/technical-debt.md` → "Vitest never scaffolded", sequenced
  into T3.2) — consistent with every other T2.x task, no automated tests added.

---

## 2026-09-05

**Task:** T2.6 — Contact page
**Summary:** Built `/contact` to `ui/mockups/a-public-site/contact.html`'s structure, reading
the optional `?service=[slug]` param (resolved live against real `Offer`/`Capability` slugs
plus the hardcoded `advisory-retainer` case — an unrecognised value falls back to no service)
and the newly-materialized `site_settings` singleton (phone/WhatsApp/email/address/
response-time). `POST /api/contact/submit` validates and creates a shared `enquiry_record`
row (contact consent required and rejected if missing, separate from marketing consent);
verified end-to-end via Playwright MCP — consent-unchecked rejection, a real submission
persisted and queryable directly via Prisma, the unrecognised-service fallback, and both new
`dataLayer` events (`enquiry_submitted` on submit, `whatsapp_opened` on the new shared
`WhatsAppLinkButton`'s click) firing correctly. First task to materialize `SiteSettings` and
`EnquiryRecord` — several deliberate schema-scoping decisions made (added `message`, deferred
diagnostic-relation/attribution fields, left `enquiry-management.md`'s extension for
Milestone 8) — see `memory/decision-log.md` for the full reasoning. Also the first real
`dataLayer.push` call in the codebase (`lib/data-layer.ts`), a pattern later tasks (the
diagnostic, landing pages) reuse.
**Files Changed:**

- `prisma/schema.prisma` — `SiteSettings`, `EnquiryRecord` models added.
- `prisma/migrations/20260905151229_t2_6_site_settings_and_enquiry_record/` — migration.
- `prisma/seed.ts` — `seedContactPage()`, `seedSiteSettings()`.
- `lib/site-settings.ts` — `getSiteSettings`, `splitAddressLines`, `toTelHref` (new file).
- `lib/contact.ts` — `resolveServiceContext`, `buildWhatsAppMessage` (new file).
- `lib/enquiries.ts` — `createContactEnquiry`, `ContactValidationError` (new file).
- `lib/data-layer.ts` — `pushDataLayerEvent`, the shared `dataLayer.push` mechanism (new file).
- `app/api/contact/submit/route.ts` — `POST` handler (new file, first API route in the repo).
- `app/contact/page.tsx` — the page itself (new file).
- `components/contact-form.tsx` — client form component (new file).
- `components/whatsapp-link-button.tsx` — the shared `WhatsAppLinkButton` (new file).
- `docs/features/contact-and-enquiry.md`, `docs/features/business-health-check-diagnostic.md`
  — `message` field documented; the `traffic_source`/`campaign`/`landing_page` scoping
  decision noted.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for the two sequenced technical-debt items.
- `memory/decision-log.md`, `memory/technical-debt.md` — this task's scoping decisions and
  two new debt items (response-time commitment pending, `SiteFooter` callers not yet live).
  **Related Feature:** `docs/features/contact-and-enquiry.md`.
  **Notes:** Verified via Playwright MCP at mobile (390px), tablet (768px) and desktop
  (1280px) — no console errors once the dev server was restarted to pick up the regenerated
  Prisma client (same stale-client issue as T2.5's session-11 follow-up; not a real bug).
  No test runner exists yet (`memory/technical-debt.md` → "Vitest never scaffolded",
  sequenced into T3.2) — consistent with every other T2.x task, no automated tests added;
  `lib/contact.ts`/`lib/enquiries.ts` are the first `lib/` functions in this epic with real
  branching logic (consent validation, slug resolution) that would benefit from unit tests
  once the scaffold exists. All quality gates (lint, format, typecheck) pass.

---

**Task:** T2.5 (follow-up fix) — Partner title/role visual distinction; live-page note removed
**Summary:** User flagged two real gaps right after T2.5 shipped: only the featured Lead
Partner card showed any rank at all (as one plain string with no visual split from their
responsibility), and the other four partners showed no rank at all — a gap already present in
the mockup, not preserved. Added a new `Author.title` field (default `"Partner"`, migration
`20260905144109_t2_5_author_title`), seeded per partner, rendered as a solid `Badge` chip
distinct from `practiceArea`'s existing accent-colored text, for every partner uniformly
(`app/about/page.tsx`'s new `PartnerRoleLine`). Mockup updated to match. Also removed the
"partner photographs are from a single coordinated session..." caption from the live page
per the user's follow-up note — appropriate as mockup/planning annotation only, not visitor-
facing copy; the mockup's own version is untouched.
En route, chased what looked like a Base UI `Badge` rendering bug (children not appearing in
the DOM) that turned out to be the dev server holding a stale, pre-migration Prisma client in
memory — a restart resolved it; `components/ui/badge.tsx` was never actually broken and is
unchanged. See `memory/decision-log.md` for the full diagnosis.
**Files Changed:**

- `prisma/schema.prisma` — `Author.title` field added.
- `prisma/migrations/20260905144109_t2_5_author_title/` — migration.
- `prisma/seed.ts` — `title` seeded per author.
- `app/about/page.tsx` — new `PartnerRoleLine` helper; `anyPhotoPending` note removed.
- `ui/mockups/a-public-site/about.html` — `.title-badge` pill added to every partner entry.
- `docs/features/about-and-partners-page.md`, `docs/features/content-management-admin.md`,
  `docs/tasks/07-content-admin.md` — `title` field documented.
  **Related Feature:** `docs/features/about-and-partners-page.md`.
  **Notes:** Verified via Playwright MCP at mobile/tablet/desktop, no console errors. All
  quality gates pass.

---

**Task:** T2.5 — About / Team page
**Summary:** Built `/about` to `ui/mockups/a-public-site/about.html`'s structure, adding the
`Author` model (new at this task) and a new `FirmStatement` singleton model for the founding
statement/values/standard content, both seeded with real, Company-Docs-sourced content — the
5 partners' names, roles, credentials and bios, not placeholder. The firm asked mid-task to
correct two partner titles ("Founder/CEO" → "Lead Partner", "Co-Founder" → "Partner"), applied
directly in the seed data (and the mockup, since it already held the real content). The user
then rejected this task's own architecture constraint's literal "no photo → hidden entirely"
edge case once real photography turned out not to exist yet — redirected to an initials-avatar
fallback instead, so all 5 partners publish now with `photoUrl: null`, swapped for a real photo
whenever one is uploaded. This reverses `about-and-partners-page.md`'s original edge case and
`content-management-admin.md`'s publish-gating rule, both updated to match, plus T7.6 (the
future Team editor task) corrected so it doesn't rebuild the old hide-on-no-photo behavior.
Verified via Playwright MCP at mobile/tablet/desktop — initials avatars, corrected titles, and
credentials (shown only for the two partners whose bios state a formal designation) all render
correctly with no console errors.
**Files Changed:**

- `prisma/schema.prisma` — new `FirmStatement` and `Author` models.
- `prisma/migrations/20260905142546_t2_5_firm_statement_and_author/` — migration.
- `lib/about.ts` — new: `getFirmStatement`, `getAuthors`, `getInitials`.
- `app/about/page.tsx` — new: the page itself, including `PartnerAvatar`.
- `prisma/seed.ts` — `seedAboutPage`, `seedFirmStatement`, `seedAuthors` added and wired into
  `main()`.
- `ui/mockups/a-public-site/about.html` — the two corrected title labels.
- `docs/features/about-and-partners-page.md` — Data requirements (`order`, `FirmStatement`
  decomposition) and the photo/credentials edge cases, revised.
- `docs/features/content-management-admin.md` — the publish-gating business rule and
  `author`'s field list, revised to match.
- `docs/tasks/07-content-admin.md` — T7.6 (Team / author profile editor) corrected to the new
  policy, plus a session-11 addendum on the pending photo/credentials gap.
  **Related Feature:** `docs/features/about-and-partners-page.md`.
  **Notes:** No test runner exists yet (`memory/technical-debt.md` → "Vitest never
  scaffolded", sequenced into T3.2) — consistent with every other T2.x task, no tests were
  added for `lib/about.ts`. Two new technical-debt entries track the still-missing partner
  photography (`/about`'s own initials-avatar state, and the still-unresolved home-page
  senior-attention panel placeholder), both user-triggered and sequenced into T7.6.

---

**Task:** T1.5 (follow-up fix) — SiteHeader current-page nav active state
**Summary:** None of the mockups mark the current page in the nav (every page's `<nav>`
markup is identical, copy-pasted across all of them) — user flagged this as a real gap
regardless, since indicating current location is a WCAG 2.1 AA expectation, not something to
skip just because the mockups happened to omit it everywhere. Added active-state highlighting
to `SiteHeader` via `usePathname()` (already a client component): a matching top-level nav
link gets the same color it already uses on hover, permanently, plus an underline, so it
reads as visually distinct from a transient hover on a different item; `aria-current="page"`
set alongside for assistive tech. "Core Offers" (a dropdown, not a single route) is marked
active whenever the current path matches one of the three offer hrefs, and the matching item
inside the dropdown itself is called out in accent text — same logic duplicated for the
mobile drawer (its own `NAV_LINKS`/`coreOffers` render loop), with a `bg-muted` background
added there since a drawer item has no adjacent items to contrast against the way a
horizontal nav's underline does. Verified for real via Playwright MCP: `/our-method` shows
"Our Method" active on both desktop and the mobile drawer; `/offers/financial-clarity-pack`
shows "Core Offers" active in both its transparent-over-hero and solid-scrolled header states.
**Files Changed:**

- `components/site-header.tsx` — `usePathname()` added; active-state classes computed for the
  desktop nav list, the Core Offers dropdown trigger/items, and the mobile drawer's equivalent
  items.
  **Related Feature:** None — a cross-cutting `SiteHeader` fix, not tied to a single feature doc.
  **Notes:** Applies retroactively to every page already built on `SiteHeader` (T2.1–T2.4 so
  far) with no per-page changes needed, since the component itself owns the logic.

---

## 2026-09-05

**Task:** T2.4 — Our Method page
**Summary:** Built `/our-method` to `ui/mockups/a-public-site/our-method.html`, reusing T2.3's
shared `Page` model (`getPageBySlug("our-method")`, `lib/pages.ts`, no changes needed) and
adding a new `MethodStage` model + `lib/our-method.ts`'s `getMethodStages()` for the 4
Discover/Diagnose/Design/Deliver rows. Added one field beyond `our-method-page.md`'s original
Data requirements list — `whatHappens` — because the mockup's `.stage-detail-grid` has a
dedicated "What happens" cell per stage distinct from the longer descriptive paragraph
(`description`); updated the feature doc to name it, same precedent as T2.2 adding
`Offer.ctaLabel`/`tiers`. The mockup's "One journey, not three separate products" intro
paragraph links its three offer-name mentions inline (`<a>` tags to each offer page) — kept
`introCopy` itself as plain, admin-editable text (no content field anywhere else in this
project embeds markup) but added `app/our-method/page.tsx`'s `renderIntroCopyWithOfferLinks`,
which matches each of `getOfferNavLinks()`'s live offer names against the plain-text string at
render time and re-inserts a real `Link` to that offer's actual route — preserves the mockup's
linking behaviour without a templating scheme in the database field itself, and stays correct
even if an offer is renamed. (First pass at this task shipped the paragraph fully un-linked,
reasoning the same three offers were already reachable from nav/footer — the user caught that
this dropped real mockup-specified functionality; corrected same-day, see
`memory/decision-log.md`.) All four stages seeded with equal structural depth per the feature
doc's business rule; `capabilityTransferNote` populated only for Deliver (order 4), null for
the other three. Verified for real via Playwright MCP at mobile (390px), tablet (768px) and
desktop (1280px) — all four stages render in order with correct copy, the capability-transfer
panel appears only under Deliver, the three intro-copy links resolve to their real offer
routes (confirmed by clicking one through), meta tags populate from the `page` row, no console
errors. Hit and fixed a stale-Prisma-client issue: the already-running dev server had the
pre-migration client loaded in memory, so `prisma.methodStage` was `undefined` until the dev
server was restarted after `prisma generate` — worth remembering for any future mid-session
schema change.
**Files Changed:**

- `prisma/schema.prisma` — added `MethodStage` model.
- `prisma/migrations/20260905131349_add_method_stage/` — new migration.
- `prisma/seed.ts` — added `seedOurMethodPage()`, `seedMethodStages()`, wired into `main()`.
- `lib/our-method.ts` — new, `getMethodStages()`.
- `app/our-method/page.tsx` — new route, incl. `renderIntroCopyWithOfferLinks()`.
- `docs/features/our-method-page.md` — added `what_happens` to the `method_stage` Data
  requirements list.
  **Related Feature:** `docs/features/our-method-page.md`
  **Notes:** No admin editor exists yet for `page`/`method_stage` (Milestone 7) — this task only
  builds the read side, per this epic's own opening note.

---

## 2026-09-05

**Task:** T2.3 — Capabilities page
**Summary:** Built `/capabilities` to `ui/mockups/a-public-site/capabilities.html`. Introduced
the shared generic `Page` model (`prisma/schema.prisma`) as the first task to create it, per
CLAUDE.md's Recurring Patterns — added an `introCopy` field now even though this page doesn't
use it, since `our-method-page.md` (T2.4) reuses the same model with that field, per this
task's own architecture constraint. Also added `Capability` (8 rows, `order`-sorted) and
`AdvisoryRetainer` (a singleton, single `feeAmount`/`feeCurrency`/`billingPeriod`, distinct
from `OfferTier`'s multi-tier shape and the three core offers' min/max band — a retainer is
priced as one figure per period). The 8 capability names, order and short-description copy
were sourced verbatim from the mockup, then cross-checked against `Company Docs/05.03 Core
Offer Focus Note.docx`'s Section 5 "Treatment of every service line" table (same 8 lines,
same order) — confirming the mockup copy as real, accepted content rather than needing
fresh drafting. The retainer's `From GHS 1,500 / month` figure matches the mockup and is also
the Essential tier's floor in `Company Docs/05.04 Rate Card.docx`'s own three-tier retainer
table (Essential/Standard/Full) — only the entry-level single figure is modelled, per
`capabilities-page.md`'s singleton data requirement (the three-tier detail isn't represented).
Verified for real via Playwright MCP at mobile (390px), tablet (768px) and desktop (1280px) —
all 8 cards render with correct copy and correctly-formed `/contact?service=[slug]` links
(confirmed one resolves to the branded 404, expected since `/contact` isn't built until T2.6),
retainer panel renders and stacks correctly at each width, meta tags populate from the `page`
row, no console errors.
**Files Changed:**

- `prisma/schema.prisma` — new `Page`, `Capability`, `AdvisoryRetainer` models
- `prisma/migrations/20260905124815_t2_3_page_capability_advisory_retainer/` — new migration
- `prisma/seed.ts` — `seedCapabilitiesPage`, `seedCapabilities`, `seedAdvisoryRetainer`, wired
  into `main()`
- `lib/pages.ts` — new: `getPageBySlug()`, the shared resolver for the generic `page` entity
- `lib/capabilities.ts` — new: `getCapabilities()`, `getAdvisoryRetainer()`,
  `formatRetainerFee()`
- `app/capabilities/page.tsx` — new: the page itself, `force-dynamic`, live `offerNavLinks`
  passed to `SiteHeader` per T2.2's established pattern
  **Related Feature:** `docs/features/capabilities-page.md`
  **Notes:** `npm run lint`, `format:check`, and `npm run typecheck` all pass clean. No unit
  tests added — `lib/pages.ts`/`lib/capabilities.ts` are thin data-fetch wrappers with no
  branching logic worth unit-testing, same precedent as T2.1/T2.2; the Vitest-scaffolding gap
  itself is unrelated pre-existing debt already sequenced into T3.2
  (`memory/technical-debt.md`).

---

## 2026-09-05

**Task:** T2.10 — Custom error pages (404 / runtime error / root-layout crash)
**Summary:** Built `app/not-found.tsx`, `app/error.tsx`, and `app/global-error.tsx`, added
mid-epic at the user's explicit request ("having the empty pages call the default 404 page is
not nice since the site is deployed") rather than waiting for a later task to reach it. No
mockup exists for this screen; structure/copy inferred from T2.2's offer-page interior hero
pattern (dark hero, kicker, heading, lead, single CTA). Also fixed `app/layout.tsx`'s root
`metadata` export, still literally `create-next-app`'s scaffold default ("Create Next App" /
"Generated by create next app") — the same "generic default visible on the live site" problem
the user flagged, just in the `<title>` tag rather than on a 404. Found and fixed a real
design flaw while verifying with Playwright MCP: `app/not-found.tsx` originally fetched live
`getOfferNavLinks()` for `SiteHeader`'s nav (matching every other real page's pattern), but a
genuine transient DNS failure against Railway's Postgres proxy made it hang for over a minute
before failing — exactly backwards for a page whose job is to render reliably when something
else has already gone wrong. Removed the live fetch; it now renders with zero runtime
dependencies via `SiteHeader`'s existing `FALLBACK_CORE_OFFERS` default (T2.2). Also found and
fixed a related bug this surfaced: `app/offers/[slug]/page.tsx`'s `generateMetadata` returned
`{}` for an unknown slug, which left the browser tab showing the root layout's generic
homepage title instead of "Page not found" — fixed by exporting `NOT_FOUND_METADATA` from
`app/not-found.tsx` and returning it there instead. Verified all three surfaces for real
(a nonexistent route, a thrown error via a temporary scratch route deleted after checking, and
each one's mobile/tablet/desktop rendering) via Playwright MCP.
**Files Changed:**

- `app/not-found.tsx` — new: branded 404, catches unmatched routes and `notFound()` calls
- `app/error.tsx` — new: branded runtime-error boundary ("use client", `reset()` action)
- `app/global-error.tsx` — new: minimal, fully self-contained root-layout-crash fallback
- `app/layout.tsx` — root `metadata` fixed from create-next-app's scaffold default to real
  site copy
- `app/offers/[slug]/page.tsx` — `generateMetadata`'s missing-offer branch now returns
  `NOT_FOUND_METADATA` instead of `{}`
- `docs/tasks/02-public-presentation.md` — new T2.10 entry
- `memory/decision-log.md` — this session's entry on the DNS-resilience finding
  **Related Feature:** None — no `docs/features/*.md` covers error pages; this is
  infrastructure/UX polish, not a documented data/interface contract.
  **Notes:** Not part of the epic's original task list — added mid-session at explicit user
  direction, given its own task ID (T2.10) after the fact so it has a permanent record rather
  than living only in conversation history. `npm run lint`, `format:check`, and
  `npm run typecheck` all pass clean.

---

## 2026-09-05

**Task:** T2.2 — Core Offer pages (×3)
**Summary:** Built `/offers/[slug]` (`app/offers/[slug]/page.tsx`) to all three
`ui/mockups/a-public-site/offer-*.html` files, rendering FR-4.1's 10 fixed sections in order
for Business Health Check, Financial Clarity Pack, and Funding-Readiness Pack. Extended the
`Offer` model with every remaining `core-offer-pages.md` field (problem_statement,
who_for/who_not_for, method_stages, deliverables, client_inputs, indicative_timeline,
out_of_scope_note, faqs, cta_href, meta_title, meta_description) plus one new field the
mockups needed but the doc didn't name (`cta_label` — the fee-panel button text differs per
offer). Resolved the Business Health Check two-tier pricing gap flagged at T2.1 with a new
`OfferTier` model (Express/Full rows), and sourced the two single-tier offers'
`indicative_timeline` from `Company Docs/05.04 Rate Card.docx` (real content, not
placeholder — the mockups themselves don't surface a distinct timeline section, but FR-4.1
requires one). Since two `offer` rows already existed from T2.1's seed, added the new NOT
NULL columns via a nullable-then-backfill-then-constrain migration pattern rather than a
destructive `DELETE`/reset. Wired `components/site-header.tsx`'s Core Offers fee hints to a
new `getOfferNavLinks()` (live `Offer.feeAmountMin` reads) instead of the T1.5 hard-coded
array, per that task's own deferred note — kept optional with a fallback so T1.5's dev
scratch pages keep working without a DB read. FAQ built on Base UI's `Accordion`
(`multiple`, `defaultValue={[0]}`) to match the mockups' independently-toggleable `<details>`
behaviour, not a hand-rolled `<details>` reimplementation. Verified with Playwright MCP
(`verification` server) at desktop (1280px), tablet (768px), and mobile (390px) across all
three offers — full-page screenshots, FAQ multi-open interaction, mobile drawer nav, live nav
dropdown fee hints, and a real 404 for a non-existent slug, zero console errors throughout.
**Files Changed:**

- `prisma/schema.prisma` — extended `Offer`, new `OfferTier` model
- `prisma/migrations/20260905113754_t2_2_offer_full_content_and_tiers/`,
  `prisma/migrations/20260905114536_t2_2_offer_tier_scope_cap/` — new migrations (both
  hand-edited to nullable-backfill-then-NOT-NULL against T2.1's existing 3 seeded rows)
- `prisma/seed.ts` — `seedOffers()` now seeds every field with a real `update:` clause (fixed
  a latent bug: the previous `update: {}` was a no-op on re-seed); new `seedOfferTiers()`
- `lib/offers.ts` — new: `getOfferBySlug`, `getOfferNavLinks`, `formatFeeHint`,
  `formatFeeBand`, `MethodStage`/`OfferFaq` types
- `app/offers/[slug]/page.tsx` — new: the offer detail page template
- `components/site-header.tsx` — `CORE_OFFERS` renamed `FALLBACK_CORE_OFFERS`, new optional
  `offerNavLinks` prop on `SiteHeader`/`MobileNavTrigger`
- `app/(public)/page.tsx` — passes live `getOfferNavLinks()` to `SiteHeader`
- `docs/features/core-offer-pages.md` — documented `offer_tier`, `cta_label`, and the
  indicative-timeline sourcing decision
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.2 (omitted checklist cross-promo)
- `memory/decision-log.md`, `memory/technical-debt.md` — this session's entries
  **Related Feature:** `docs/features/core-offer-pages.md`
  **Notes:** The Funding-Readiness Pack mockup's `.checklist-panel` cross-promo (linking to a
  Milestone 5 landing page that doesn't exist yet) was deliberately omitted rather than
  linked to a route that would 404 — see `memory/technical-debt.md`. `npm run lint`,
  `format:check`, and `npm run typecheck` all pass clean.

---

## 2026-09-05

**Task:** T2.1 — Home page
**Summary:** Built `/` (`app/(public)/page.tsx`) to `ui/mockups/a-public-site/home.html`,
reading a new `HomePageContent` singleton and `Offer` rows from Postgres. Since no entities
existed yet for this epic, added both Prisma models and seeded them for real (T2.1's own
dependency note authorizes doing T2.9's `home_page_content`/`offer` portions first) — every
seeded value sourced from `ui/mockups/a-public-site/home.html` and the three `offer-*.html`
mockups, `isPlaceholder: false` throughout, per the epic's own "content sourced from Company
Docs/mockups" note. Only `home-page.md`'s explicitly-named 7 fields are database-backed;
everything else the mockup shows (hero kicker, hero facts sidebar, method-strip copy, trust
band) renders as fixed template JSX, per this session's decision-log entry. `Offer` only got
the fields the home cards need (slug, name, teaser — a new field this task added to
`core-offer-pages.md` — fee band, scope cap); the rest is T2.2's job, along with resolving
Business Health Check's real two-tier pricing (flagged as technical debt, not solved here).
`lib/home.ts` holds the page's data-access (`getHomePageContent`, `getOfferCards`,
`getFeaturedArticles`) per CLAUDE.md's business-logic-in-`lib/` rule; `getFeaturedArticles` is
a stub returning `[]` since `insights-engine.md`'s `article` model doesn't exist yet
(Milestone 4) — this correctly triggers home-page.md's own "no articles published" edge case
(the featured-Insights section is omitted). Along the way, found and fixed a real bug:
`prisma/seed.ts`'s very first real query failed with a self-signed-certificate TLS error
against Railway's public Postgres proxy — fixed via a new shared `lib/db-adapter.ts` (see
decision-log). Verified with Playwright MCP (connected this session) at desktop (1280px),
tablet (768px), and mobile (390px) — full-page screenshots at each width, mobile drawer nav
opened/closed for real, zero console errors/warnings throughout.
**Files Changed:**

- `prisma/schema.prisma` — new `HomePageContent` and `Offer` models (see their doc-comments
  for what's scoped in vs. deferred to T2.2)
- `prisma/migrations/20260905063122_t2_1_home_page_and_offer/` — new migration
- `prisma/seed.ts` — new `seedHomePageContent`/`seedOffers`, called from `main()`; also fixed
  to use the new shared `lib/db-adapter.ts`
- `lib/db-adapter.ts` — new: `createDatabaseAdapter`, the Railway self-signed-cert TLS fix,
  shared by `lib/prisma.ts` and `prisma/seed.ts`
- `lib/prisma.ts` — now uses `createDatabaseAdapter`
- `lib/home.ts` — new: `getHomePageContent`, `getOfferCards`, `getFeaturedArticles`
- `app/(public)/page.tsx` — new: the home page (`app/page.tsx`/`page.module.css`, the
  create-next-app default, removed — this route group is now where the public home page
  lives, per CLAUDE.md's folder structure)
- `docs/features/core-offer-pages.md` — added `teaser` to `offer`'s Data requirements; noted
  the Business Health Check two-tier gap
- `docs/tasks/02-public-presentation.md` — addenda on T2.2 (offer fields deferred + two-tier
  pricing gap), T2.5 (senior-attention photo placeholder), and T2.9 (home_page_content/offer
  already seeded)
- `memory/decision-log.md`, `memory/technical-debt.md` — this session's entries
  **Related Feature:** `docs/features/home-page.md`, `docs/features/core-offer-pages.md`
  (partial), `docs/features/seo-and-search-foundation.md` (per-page title/meta description
  only — OG/Twitter and Organization JSON-LD are T2.8's job)
  **Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was connected and used
  directly this session, unlike several prior sessions that had to fall back to
  `claude-in-chrome`. No Vitest test added: `lib/home.ts`'s functions are thin Prisma
  passthroughs (plus a stub) with no branching/computed logic of their own to unit-test yet —
  same reasoning T1.3/T1.4/T1.5 used for their own `npm run test` gap; the real trigger for
  scaffolding Vitest is still T3.2's scoring engine (`memory/technical-debt.md` — reviewed
  this session, sequencing unchanged). `npm run lint`, `format:check`, and `npx tsc --noEmit`
  (via `npm run typecheck`) all pass clean.

---

## 2026-09-05

**Task:** T1.6 — Environment/secrets and GTM container stub
**Summary:** Installed the empty GTM bootstrap snippet (ADR 0006) — head script +
post-`<body>` noscript iframe — in the root `app/layout.tsx`, reading `GTM_CONTAINER_ID`
from the environment via the existing three-tier env convention (`.env.local`/
`.env.production`/Railway service vars, established at T1.2). The snippet renders nothing
at all when the var is unset, rather than a broken/placeholder script tag — verified via
`curl` against the dev server. Verified end-to-end against a throwaway test container ID
(`GTM-TEST123`) via Playwright: `window.dataLayer` initializes, the `gtm.js` request fires
at the correct interpolated URL, and the noscript iframe is the first child of `<body>`. No
real GTM account/container exists yet for kaalbert.com (external action only the user can
take — see `memory/technical-debt.md` → "GTM container not yet provisioned"), so T1.6's
"GTM Preview mode" acceptance criterion is verified as far as it can be without a real
container; full closure is deferred to T5.3, sequenced with a `Trigger type: User-triggered`
addendum. README updated with an "Environment Variables & Secrets" section documenting the
three-tier convention and every current `.env.example` var.
**Files Changed:**

- `components/google-tag-manager.tsx` — new: `GoogleTagManagerHeadScript` (the `next/script`
  `afterInteractive` bootstrap) and `GoogleTagManagerBodyFrame` (the noscript iframe
  fallback), each taking `containerId` as a required prop
- `app/layout.tsx` — reads `GTM_CONTAINER_ID` from `process.env`, conditionally renders both
  GTM components only when the var is set
- `README.md` — new "Environment Variables & Secrets" section
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.3 pointing back to the
  GTM-not-provisioned debt entry, marked user-triggered
- `memory/technical-debt.md` — new "GTM container not yet provisioned" entry
  **Related Feature:** `docs/features/measurement-and-attribution.md` (T1.6 only installs the
  container this feature's eventual `dataLayer` events will plug into; the events themselves
  are Milestone 5 / T5.3 scope, not touched here)
  **Notes:** `.env.example`/`.env.local`/`.env.production` already had `GTM_CONTAINER_ID`
  placeholder entries from earlier sessions' env-file setup — this task didn't need to add the
  var itself, only wire it into actual rendered output and document the convention in the
  README (which hadn't covered env vars at all before this task).

---

## 2026-09-05

**Task:** T1.5 — Shared layout shell: SiteHeader, SiteFooter, admin shell skeleton
**Summary:** Built `SiteHeader`, `SiteFooter`, `ScopeOfPracticeNote`, and an empty
authenticated `/admin` shell (sidebar + placeholder content area), matching
`ui/mockups/a-public-site/*.html`'s header/footer markup exactly — confirmed byte-identical
across all eight public mockup pages via `md5sum`, so one build serves every page. `SiteHeader`
composes T1.4's `DropdownMenu` (Base UI `Menu.Root`) for the Core Offers nav item, with fee
hints hard-coded to the mockup's copy (`CORE_OFFERS` const, flagged for T2.2 to wire
`offer.fee_amount_min`). `SiteFooter` takes `addressLine1`/`addressLine2`/`phonePrimary` as
props (not hard-coded inline) so a future `site_settings` read can swap in without
restructuring; `ScopeOfPracticeNote` extracted as its own component since
`legal-and-compliance-pages.md` reuses it separately. Admin shell inferred from
`ui/mockups/g-admin-content/admin-dashboard.html` per screen-inventory.md #25 — sidebar nav
routes are inferred slugs (`/admin/articles`, etc.), only `/admin` itself resolves to a real
(placeholder) page. Two `/dev/layout-shell/*` scratch pages built (mirroring T1.3/T1.4's
`/dev/*` pattern) to exercise SiteHeader/SiteFooter in two different page contexts for the
acceptance criteria. **Mid-task addition (user-directed):** responsive design was made
mandatory from this task's first implementation rather than deferred — new CLAUDE.md rule
added (see `memory/decision-log.md`) — and the public/admin nav were rebuilt as side-sliding
drawers (`SiteHeader`'s mobile nav slides from the right; the new `AdminMobileSidebar`
component's off-canvas drawer slides from the left, matching the sidebar's own docked edge)
below the `lg` breakpoint, since none of the mockups address a narrower viewport at all. Found
and fixed a real Base UI bug in the process (`nativeButton={false}` needed on every
`DialogClose` rendered as a `Link` — see decision-log) and a route-naming inconsistency in
`docs/tasks/02-public-presentation.md` (T2.2 said `/services/[slug]`, everything else says
`/offers/[slug]` — corrected to match).
**Files Changed:**

- `components/site-header.tsx` — new: `SiteHeader`, responsive (`lg` breakpoint), desktop
  inline nav + Core Offers `DropdownMenu`, mobile hamburger opening a right-sliding drawer
  built directly on Base UI's Dialog primitive (not the `DialogContent` wrapper, to avoid
  fighting its centred-modal positioning classes)
- `components/site-footer.tsx` — new: `SiteFooter`, `FooterLinkColumn` sub-component,
  `grid-cols-2 md:grid-cols-4` responsive from the start
- `components/scope-of-practice-note.tsx` — new: `ScopeOfPracticeNote`
- `components/admin-sidebar-nav.tsx` — new: `AdminSidebarNav`, shared between the persistent
  desktop sidebar and the mobile drawer via an optional `onNavigate` prop
- `components/admin-mobile-sidebar.tsx` — new: `AdminMobileSidebar`, mobile-only topbar +
  left-sliding off-canvas drawer for the admin shell
- `app/admin/layout.tsx` — new: the admin shell frame, `hidden lg:flex` persistent sidebar +
  `AdminMobileSidebar` below `lg`, placeholder content area
- `app/admin/page.tsx` — new: placeholder dashboard content
- `app/dev/layout-shell/home/page.tsx`, `app/dev/layout-shell/about/page.tsx` — new: scratch
  verification pages (T1.3/T1.4's `/dev/*` pattern)
- `CLAUDE.md` — new "Responsive is built in from a component's first implementation" rule
  under Code Conventions, plus a matching Task Completion Checklist line
- `docs/tasks/02-public-presentation.md` — T2.2's route corrected `/services/[slug]` →
  `/offers/[slug]`

**Related Feature:** None owns `SiteHeader`/`SiteFooter`/`ScopeOfPracticeNote`/the admin shell
directly — `ui/components.md`'s shared/global composite table is authoritative (see T1.5's own
task prompt); `docs/features/core-offer-pages.md` is the route-naming authority the T2.2 fix
was checked against.
**Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was not connected this session
(same `CONNECT_TIMEOUT` as every prior session) — used `claude-in-chrome` per CLAUDE.md's
explicit fallback. This sandbox's browser window could not actually be resized below its
~1600px virtual-display width (`resize_window` silently capped), so the `lg`/`md` responsive
breakpoints were verified two ways instead: (1) extracting the live compiled CSS's
`@media (min-width: 64rem)`/`(min-width: 48rem)` rules via `document.styleSheets` to confirm
the correct Tailwind breakpoints actually compiled, and (2) injecting temporary CSS overrides
to force the mobile-layout branch visible at full width, then interacting with it for real
(opened both drawers, clicked links, confirmed navigation + auto-close, confirmed no console
errors) — the overrides were never written to any file, only injected into the live page for
this test. `npm run test` — still nothing to run (no Vitest scaffold yet, unchanged gap; this
task adds no `lib/` logic to unit-test, same reasoning as T1.3/T1.4).

---

## 2026-09-05

**Task:** T1.4 — shadcn/ui + Base UI component scaffold
**Summary:** Ran the shadcn CLI (`shadcn@4.21.0`) with `-b base` (Base UI, not Radix, per ADR 0010) and the `nova` preset (the only way to get a non-interactive init; presets only differ
in starter colour/font choices, which get overwritten by our own tokens anyway). The CLI's
own `init` overwrote `app/globals.css`'s colour values with its Nova neutral-grey defaults
and added a `.dark` block + Geist Google Font wiring in `app/layout.tsx` — reverted
`layout.tsx` entirely and restored T1.3's exact hex token values in `globals.css`, keeping
only the CLI's genuinely new structural additions: `@import "tw-animate-css"` (animate-in/out
utilities Base UI components use for open/close transitions) and `@import
"shadcn/tailwind.css"` (defines the `data-open`/`data-closed`/`data-checked`/etc. custom
variants Base UI's `data-state`-driven components style against — components literally don't
animate correctly without this import). Deliberately did not carry over the `.dark` block or
`--font-sans`/`--font-heading` additions: `ui/design-system.md` line 96 explicitly says no
dark-mode variant is defined for this brand, and `--font-sans` isn't part of this project's
token set (`--font-display`/`--font-body`/`--font-mono` only). Generated all 21 foundation
primitives from `ui/components.md`'s list via `npx shadcn add`: button, input, textarea,
select, checkbox, radio-group, switch, card, dialog, alert-dialog, accordion, tabs, badge,
table, avatar, tooltip, dropdown-menu, popover, progress, separator, sonner — plus `label`
(a direct dependency of several of the above) and `field` in place of the list's "Form": the
current shadcn registry's `form` component is an empty placeholder (react-hook-form's old
Form wrapper has been retired from the Base UI style), and `field` (Field/FieldLabel/
FieldDescription/FieldError/FieldGroup/etc.) is its documented replacement — the same "field
wrapper + validation display" role `ui/components.md` describes, just under Base UI's own
naming. Built `app/dev/component-scaffold/page.tsx` (route `/dev/component-scaffold`) with at
least one themed instance of every one of those 21 primitives, matching T1.3's `/dev/
design-tokens` scratch-page pattern. Verified with real Chrome browser automation (Playwright
MCP still not connected this session — same fallback as T1.3): screenshotted every section
and interactively exercised Dialog, AlertDialog, DropdownMenu, Popover, Tooltip (hover),
Select (value change), and Sonner (toast) — all render with the Kaalbert palette (Pine Green
primary, Ivory surfaces, Brass accents) with no per-component colour overrides, confirming
the token-name match between `app/globals.css` and what the shadcn CLI generates. Found and
fixed two real Base UI API-composition bugs surfaced only by actually clicking through the
page (not visible from source review or typecheck): (1) Base UI's `Select.Value` shows the
raw `value` string, not the matching item's label, unless `Select.Root` gets an `items` map —
without it the trigger showed `"health-check"` instead of "Business Health Check"; (2) Base
UI's `Menu.GroupLabel` (what `DropdownMenuLabel` renders) throws
`MenuGroupContext is missing` at runtime unless wrapped in `Menu.Group`
(`DropdownMenuGroup`) — Radix's equivalent didn't require this, so it wasn't obvious from
the generated component source. Also fixed all `asChild`-pattern trigger compositions (Radix
convention, doesn't exist on Base UI) to use Base UI's `render={<Button .../>}` prop instead
— caught by `tsc`, not runtime. Addendums checked while touching `package.json`: bumped
`eslint` to `^10.10.0`, ran the full quality-gate suite, and found `npm run lint` throws
`TypeError: contextOrFilename.getFilename is not a function` inside
`eslint-plugin-react`'s `react/display-name` rule — a real breakage, not just an ERESOLVE
peer-dependency warning (which is what the existing technical-debt entry was based on) —
reverted to `eslint@^9.39.5` and updated that debt entry with the concrete failure mode.
Re-ran `npm audit`: still the same 4 high-severity transitive vulnerabilities in Prisma CLI's
dev-tooling tree (`mysql2`, `deepmerge-ts`); no patched `prisma`/`@prisma/client` release
exists yet (npm's `latest` is still `8.0.0-rc.13`, a pre-release) — left that debt entry open,
updated its "checked again" note.
**Files Changed:**

- `app/globals.css` — added `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"`;
  added `* { @apply border-border outline-ring/50; }` to the base layer (shadcn's standard
  default-border/focus-ring rule, resolves purely from existing tokens); all colour/radius
  values unchanged from T1.3
- `components.json` — new: shadcn CLI config (`style: base-nova`, `iconLibrary: lucide`, `@/`
  aliases matching `tsconfig.json`)
- `components/ui/*.tsx` — new: 23 generated files (21 foundation primitives + `label` +
  `field`), each restyled against the T1.3 token layer by the CLI, no hand-patched colours
- `lib/utils.ts` — new: `export { cn } from "cn"` (shadcn's `cn` helper, re-exported from the
  small `cn` npm package rather than hand-rolling `clsx`+`tailwind-merge`)
- `app/dev/component-scaffold/page.tsx` — new: the acceptance-criteria test page
- `package.json`/`package-lock.json` — added `@base-ui/react`, `class-variance-authority`,
  `cn`, `lucide-react`, `next-themes` (Sonner's theme-detection dependency), `shadcn`,
  `sonner`, `tw-animate-css` as dependencies; `eslint` unchanged at `^9.39.5` (bumped to
  `^10` then reverted — see technical-debt.md)
- `app/layout.tsx` — untouched (CLI's Geist-font edit was reverted before it ever landed)

**Related Feature:** None — `ui/components.md` is the authoritative reference (no
`docs/features/*.md` governs the component scaffold).
**Notes:** Playwright MCP still not connected this session (same as T1.3/see that entry) —
used `claude-in-chrome` browser automation instead, including real clicks/hovers, not just
screenshots. `npm run test` still has nothing to run (no Vitest scaffold yet — unchanged
gap, see `memory/technical-debt.md`); this task adds generated component files + a scratch
page, no `lib/` logic to unit test.

---

## 2026-09-05

**Task:** T1.3 — Design tokens and Tailwind v4 setup
**Summary:** Installed Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`, both pinned
`4.3.3`) CSS-first, no `tailwind.config.js`/`.ts` per ADR 0010. `app/globals.css` now carries
`ui/design-system.md`'s "Complete CSS-first configuration" block verbatim (the raw semantic
`:root` variables + `@theme inline` mapping shadcn's exact variable names — `--color-primary`,
`--radius-md`, `--text-h1`, `--shadow-sm`, etc.), plus a small `@layer base` rule setting
`body`'s background/color/font-family to the Ivory/Ink/Calibri tokens (matching
`ui/mockups/_shared.css`'s own body rule). Removed the create-next-app Geist Google Fonts
wiring from `app/layout.tsx` — design-system.md is explicit that both brand typefaces
(Georgia/Calibri) are system fonts with no web font file loaded, so leaving Geist wired in
app-wide would have silently contradicted that. Left `app/page.tsx`/`page.module.css` (the
default Next.js placeholder homepage) untouched — out of scope for this task, slated for full
replacement by the public-presentation epic. Built the acceptance-criteria test page at
`app/dev/design-tokens/page.tsx` (route `/dev/design-tokens`, no SEO metadata — a scratch
verification page, not a real public page type) rendering button variants (primary/secondary/
accent/ghost/disabled), three offer-style cards, a text input/select/textarea form, and a
colour-palette swatch grid, entirely with Tailwind utility classes generated from the new
theme tokens (e.g. `rounded-sm`/`rounded-md` from `--radius-sm`/`--radius-md`, `bg-primary`/
`text-primary-foreground` from the colour tokens) — no bespoke CSS written for the test page
itself. Verified visually with Chrome browser automation (Playwright MCP itself is not
connected this session — see Notes): screenshotted `/dev/design-tokens` side by side with
`ui/mockups/a-public-site/home.html` (served locally via `python3 -m http.server` since the
extension can't load `file://` URLs) — buttons, cards (radius, border, shadow, colour), and
form-input styling all matched. **Follow-up (same session):** at the user's request, added
the mockups' four extra hover/decorative brand tones (`--pine-700`, `--pine-500`,
`--brass-500`, `--brass-300` — all already in `design-system.md`'s brand-palette table, just
not in its original "Complete configuration" code block) into **both**
`ui/design-system.md`'s config block and `app/globals.css`, and updated the test page's
primary/accent button hovers to use them exactly like `ui/mockups/_shared.css` does, plus
added them to the swatch grid. See `memory/decision-log.md` for the full reversal writeup.
**Files Changed:**

- `postcss.config.mjs` — new: registers `@tailwindcss/postcss`
- `app/globals.css` — rewritten: Tailwind import + full design-token `@theme` block (incl.
  the four brand-tone tokens added in the same-session follow-up) + minimal body base layer
  (replaces the create-next-app default light/dark-mode stub)
- `ui/design-system.md` — same-session follow-up: added the four brand-tone tokens to the
  "Complete CSS-first configuration" code block, with a note explaining why they exist
  outside shadcn's semantic set
- `app/layout.tsx` — removed Geist/Geist Mono `next/font/google` wiring (contradicted the
  "system fonts only" token rule); `<html>` no longer carries the font-variable classes
- `app/dev/design-tokens/page.tsx` — new: the acceptance-criteria test page
- `package.json`/`package-lock.json` — added `tailwindcss`, `@tailwindcss/postcss` (both
  pinned `4.3.3`) as devDependencies
- `next-env.d.ts` — auto-regenerated by `next typegen`/`next dev` (Next.js 16 dev vs. build
  type-reference paths), not a hand edit

**Related Feature:** None — `ui/design-system.md` is the authoritative reference (no
`docs/features/*.md` governs design tokens).
**Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was not connected this
session — no `mcp__verification__*`/browser_navigate-style tools were available via
ToolSearch, consistent with CLAUDE.md's note that a newly-added/changed MCP server needs a
session restart _and_ human approval before an agent can use it. Fell back to the
`claude-in-chrome` browser-automation tools instead (screenshots, real dev-server rendering)
per CLAUDE.md's own explicit fallback allowance rather than skipping visual verification.
`npm run test` — no Vitest config or test files exist anywhere in the repo yet (no prior task
scaffolded it); this task adds tokens/CSS + a manual visual-verification page, not testable
`lib/` business logic, so there was nothing to add a unit test for. Flagged as a gap for
whichever task first adds real `lib/` logic to also scaffold Vitest at that point (see
`memory/technical-debt.md`).

---

## 2026-09-04

**Task:** T1.2 — Postgres schema baseline + migration tooling
**Summary:** Provisioned Railway's bundled Postgres plugin onto the existing `kaalbert-web`
project (user-confirmed first, since it's a real billed resource), wired both a public TCP
proxy (local dev) and a private-network service variable (production) so `DATABASE_URL`
never needs to be the same value in both places. Installed Prisma 7.10.0 (pinned — npm's
`latest` tag is currently a pre-release) with the `@prisma/adapter-pg` driver adapter Prisma
7 now requires, established `prisma/schema.prisma` as a deliberately-empty baseline (no
models — entities arrive incrementally, epic by epic, per the task's own scope), and proved
the migration mechanism end-to-end with an isolated, fully-cleaned-up smoke test (real
migration created and applied against the real Railway Postgres instance, verified via
`psql`, then removed — the committed schema/migration history is untouched by it). Wired
`npm run migrate` / `migrate:deploy` / `db:seed` conventions, a `lib/prisma.ts` client
singleton, an extensible `prisma/seed.ts` (documented `seed<Area>()`/idempotent-upsert/
`is_placeholder` convention), a `railway.json` deploy hook that runs `prisma migrate deploy`
before every production start, and a `.env.example` covering every var `CLAUDE.local.md`
lists. Documented the whole convention in README's new "Database & Migrations" section.
**Files Changed:**

- prisma/schema.prisma, prisma/seed.ts, prisma7.config.ts — new: baseline schema (zero
  models), seed script, Prisma 7 config (datasource URL + migrations path + seed command)
- lib/prisma.ts — new: PrismaClient singleton, driver-adapter-based (Prisma 7 requirement),
  hot-reload-safe via `globalThis` caching
- package.json, package-lock.json — added `@prisma/client`, `@prisma/adapter-pg`, `pg`
  (deps); `prisma`, `dotenv`, `tsx`, `@types/pg` (devDeps, all `--save-exact` pinned);
  `postinstall`/`migrate`/`migrate:deploy`/`db:seed` scripts
- railway.json — new: `deploy.startCommand` runs `prisma migrate deploy` before `npm start`
- .env.example — new: every var `CLAUDE.local.md` lists, placeholder values only
- .gitignore — added `/generated/prisma` (generated client output)
- .prettierignore, eslint.config.mjs — added `generated/` to both ignore lists
- README.md — new "Database & Migrations" section documenting the migrate/seed convention
  for later epics to extend (the acceptance criterion's explicit requirement)
- CLAUDE.local.md (not committed — gitignored) — DATABASE_URL note updated to point at
  `.env`/Railway rather than "fill in once provisioned"
- docs/tasks/01-foundation.md — addendum added to T1.4 (re-check the Prisma CLI audit
  vulnerabilities next time `package.json` deps are touched)
- memory/decision-log.md, memory/technical-debt.md — this session's entries
- `.claude/skills/prisma-*`, `skills-lock.json` — added by `prisma init` itself (official
  Prisma 7 tooling, not authored this session); near-duplicate `.windsurf/skills/` and
  `.agents/skills/` copies it also created were deleted (unused in this project)
- Railway project `kaalbert-web` (outside the repo) — added a `Postgres` service (plugin)
  and a TCP proxy on it; set `DATABASE_URL` on the `kaalbert-web` service as a
  `${{Postgres.DATABASE_URL}}` reference
  **Related Feature:** No single feature spec — infrastructure/scaffolding task, per T1.2's
  own description.
  **Notes:** No UI surface (task prompt states this explicitly), so no Playwright MCP
  verification applied; instead exercised for real via the equivalent for a backend task —
  live `psql` connection, a real (isolated, cleaned-up) `prisma migrate dev` run, `prisma
migrate deploy` and `npm run db:seed` both run for real against the live Railway Postgres
  instance. No automated tests added — no application logic exists yet to test, same
  reasoning T1.1 used. `npm audit` flags 4 high-severity vulnerabilities, all transitive
  inside Prisma CLI's own dev-tooling tree, not reachable from this project's runtime code —
  see `memory/technical-debt.md`.

---

## 2026-09-04

**Task:** T1.1 — Repo, Next.js app, and deploy pipeline
**Summary:** Initialized the git repo at `Website Build/` (the actual repo root — the
sibling `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders stay out of
version control). Scaffolded a Next.js 16.3.4/TypeScript/App Router app (no Tailwind yet —
that's T1.3's job), merged it against the pre-existing docs/config scaffolding without
clobbering the custom ESLint rule or Prettier config, wired `npm run lint` /
`npm run typecheck` / `npm run format:check` as real, passing quality gates, and added
`.github/workflows/ci.yml` running all three on every push/PR to `main`. Reformatted the
entire existing docs/ui/memory tree with Prettier (cosmetic only) since this is the task that
makes the format gate real for the first time. Created Railway project `kaalbert-web` (new
company account) and deployed the app; live at https://kaalbert.up.railway.app. Set up two
git remotes (`origin` = KaalbertCompanyLtd, `personal` = cosbyDeveloper) and, after an
initial token-exposure incident (see `memory/decision-log.md`), landed on a durable
multi-account credential workflow (SSH for the personal/default account, a non-interactive
script-based credential helper reading `~/.secrets` for foreign accounts) — generalized and
documented outside the repo at `~/Dev_Workspace/git-multi-account-workflow.md`. Wired and
verified GitHub-connected Railway auto-deploy end to end (a real push-triggered build
succeeded, live URL confirmed 200 afterward).
**Files Changed:**

- package.json, package-lock.json — Next.js/React/ESLint/Prettier deps, `dev`/`build`/
  `start`/`lint`/`typecheck`/`format`/`format:check` scripts
- app/layout.tsx, app/page.tsx, app/page.module.css, app/globals.css, app/favicon.ico —
  Next.js default starter page (deliberately unmodified; real content starts at T2.1)
- public/next.svg, public/vercel.svg, public/globe.svg, public/file.svg, public/window.svg
  — stock assets the starter page references
- next.config.ts, tsconfig.json, next-env.d.ts — Next.js/TypeScript config
- eslint.config.mjs — rewritten for Next.js 16's actual flat-config export shape
  (`eslint-config-next/core-web-vitals` + `/typescript` subpath imports, not the old
  `FlatCompat`/`"next/core-web-vitals"` string form), ADR-0001 `no-restricted-imports` rule
  preserved
- .gitignore — added `*.tsbuildinfo`
- .github/workflows/ci.yml — new: type-check + lint + format:check on push/PR to `main`
- .mcp.json — added `github` server block
- CLAUDE.md — two Next.js 16 notes added to the Auth Pattern section (middleware→proxy.ts;
  typegen requirement); new "Memory file format and ordering" + "Debt/bug fixes must be
  sequenced into a task" subsections added under Knowledge Management Responsibilities
- docs/tasks/01-foundation.md — addenda added to T1.1 (Cloudflare/domain follow-up) and T1.4
  (ESLint version-bump re-check)
- Every pre-existing docs/ui/memory markdown file — Prettier reformatting only, no content
  changes
- `~/.gitconfig`, `~/.git-credential-helpers/kaalbert-company.sh` (outside the repo) — new
  company-account credential helper

**Related Feature:** None — infrastructure/scaffolding task, `docs/tasks/01-foundation.md`
T1.1
**Notes:** T1.1 is fully complete except the Cloudflare acceptance criterion, which is
blocked on `kaalbert.com` not being registered (see `memory/technical-debt.md`, sequenced
into T1.1 as an addendum for whenever the domain exists). One technical-debt item
(ESLint 9.x EOL pin) remains open, sequenced into T1.4. See `memory/decision-log.md` for the
full set of implementation decisions made this session, including the token-exposure
incident and its resolution.
