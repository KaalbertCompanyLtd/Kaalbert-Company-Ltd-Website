# Session 28 — Subscription capture

# Date: 2026-09-06

# Tasks completed: T4.5

## What Was Built

Built Insights subscription end-to-end: a new `Subscriber` model, `POST /api/insights/
subscribe`, both `GET`/`POST` on `/api/insights/unsubscribe`, a confirmation email with a
real one-click unsubscribe link, and one shared subscribe form rendered at the foot of the
index and every article. Also closed a real, pre-existing promise gap in two already-shipped
forms (Contact, diagnostic summary request) that had always promised Insights emails via
their `marketingConsent` checkbox but had nothing to actually act on it until now. This
closes out Milestone 4 (Insights) entirely.

## Files Changed

- prisma/schema.prisma — new `Subscriber` model
- prisma/migrations/20260906071300_add_subscriber/ — new migration
- lib/insights-subscription.ts (+ .test.ts) — `subscribeToInsights`, `unsubscribeFromInsights`,
  `buildSubscriptionConfirmationEmailHtml`
- app/api/insights/subscribe/route.ts, app/api/insights/unsubscribe/route.ts — new routes
- components/insights-subscribe-form.tsx — new shared client form
- app/insights/page.tsx — renders the form; shows an "unsubscribed" confirmation banner
- app/insights/[slug]/page.tsx — renders the form at the article's foot
- lib/enquiries.ts (+ new .test.ts) — Contact form's `marketingConsent` now really subscribes
- lib/diagnostic-request-summary.ts (+ new tests) — same fix for the summary-request form
- memory/completed-work.md, memory/decision-log.md — this session's entries

## Decisions Made

- `Subscriber.unsubscribeToken` (opaque `@default(cuid())`) identifies a one-click
  unsubscribe, never the row's own sequential `id` — this is a real, unauthenticated,
  third-party-clickable link, unlike most other identifiers in this schema.
- Both `GET` and `POST` implemented on `/api/insights/unsubscribe` — the feature doc names
  `POST`, but a plain emailed `<a href>` can only ever issue a `GET` when clicked. `GET` is
  what the real link uses (redirects to a visible confirmation); `POST` covers the literal
  documented interface for a possible future form-driven flow.
- A subscription-confirmation email is sent on every subscribe/re-confirm (via T3.7's
  `sendTransactionalEmail`) — the concrete place "every sent email carries an unsubscribe
  link" is actually implemented, since no bulk-newsletter-sending feature exists yet.
- **Real bug caught by this session's own Playwright verification**: the `GET` unsubscribe
  redirect originally used `getSiteUrl()`'s hardcoded production-domain fallback
  (`kaalbert.com`, unregistered) — clicking the real link threw `net::ERR_NAME_NOT_RESOLVED`
  in the browser. Fixed by redirecting relative to the request's own origin instead.
  `getSiteUrl()` stays correct for the _emailed_ link itself (that must point at the real
  public domain regardless of environment) — the bug was specific to reusing it for an
  in-browser redirect, a different context with a different correct answer.
- **Closed a pre-existing gap in two other already-shipped forms**: `ContactForm` (T2.6) and
  `DiagnosticSummaryRequestForm` (T3.7) have always had a `marketingConsent` checkbox whose
  copy specifically names Insights articles, but nothing wired that consent to a real
  subscription until this task existed to build the missing piece. Fixed both, fire-and-forget
  (a failure here must never undo the enquiry/summary-request that already succeeded) — this
  is completing an existing promise those forms already made, not new unrelated scope, and
  was fixed now rather than deferred, following the established "small + this task is exactly
  what unblocks it + fix in the same session" pattern (sessions 23, 25).

## Current State

Milestone 4 (Insights) is fully complete: real content, a working index with filter/search/
pagination, full article pages with real body content and structured data, and subscription
capture with a verified end-to-end unsubscribe loop. Verified for real via Playwright and
`curl`: subscribe → confirmation UI → real DB row with a real token; the real unsubscribe
link → redirect → confirmation banner → `unsubscribedAt` set; re-subscribe → same row,
`unsubscribedAt` cleared, no duplicate; a Contact-form submission with marketing consent
checked → a real, confirmed `subscriber` row. All temporary verification data deleted
afterward. Full quality gate run clean: lint, format:check, typecheck, and the Vitest suite
(56 tests) all pass.

## Blockers

None.

## Next Task

T5.1 — Landing page template — `/lp/[slug]`
File: docs/tasks/05-landing-and-measurement.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace. Note the epic's own opening: this
milestone "closes out everything Document 13.03 asked of the public-facing site — after this,
the site can carry paid traffic and prove it's working." It also records a real decision made
at epic-planning time, not left open: the `attribution` row's retention window (a later task
in this same epic, T5.4) is 90 days, matching GA4/Meta's own standard attribution lookback.

# Task T5.1 — Landing page template — `/lp/[slug]`

## What to build
Template to `ui/mockups/a-public-site/landing-page.html` (or equivalent),
reading `landing_page` (`docs/features/landing-page-template.md`) — no site navigation chrome
(structurally absent, not hidden by a toggle), full Section 8.2 footer statement present via
the shared footer component (not a per-instance editable field), independently editable
headline/opening paragraph.

## Input → Output contract
`landing_page` row → rendered page with no nav, full footer
statement, correct OG/Twitter tags (NFR-5).

## Acceptance criteria
No site navigation renders under any circumstance on this
template; the Section 8.2 statement is present in full and identical to the one rendered
elsewhere on the site (same shared source); a request for a non-existent slug 404s.

## Size / Dependencies
M, depends on: T1.5 (this task deliberately does *not* reuse `SiteHeader`/`SiteFooter`
wholesale — see the "Important" note below on which pieces of that shared work actually
apply here).

**Important — read before starting:**
1. **The epic file's own cited mockup path is stale.** `ui/mockups/a-public-site/
   landing-page.html` does not exist. The real mockups are the three named launch instances
   at `ui/mockups/d-landing-pages/landing-business-health-check.html`,
   `landing-funding-readiness-checklist.html`, and `landing-financial-clarity-pack.html` —
   all three share one structural template (build to that shared structure; T5.2 is what
   seeds the three distinct instances of real content into it, not this task).
2. **This template does NOT reuse `<SiteHeader>`/`<SiteFooter>` wholesale.** Checked directly
   against the real mockup: the header is logo-only, centered, with no `<nav>` element at all
   (not `SiteHeader` with navigation hidden by a prop — a structurally different, minimal
   header markup, per this task's own "structurally absent, not hidden by a toggle"
   acceptance criterion). The footer is also minimal — logo plus the scope-of-practice
   statement only (no address/nav-link columns) — but it must still render the *exact same*
   shared statement everywhere else on the site does. Reuse `components/scope-of-practice-
   note.tsx`'s `<ScopeOfPracticeNote />` directly inside this template's own minimal footer
   markup, rather than the full `<SiteFooter>` (which the mockup doesn't show) or a
   copy-pasted second version of that statement's text (which would violate this task's own
   "same shared source" acceptance criterion the moment the real text is ever edited).

## Architecture constraints
- Business logic lives in `lib/` — add `getLandingPageBySlug` (or similar) to a new
  `lib/landing-pages.ts`, mirroring `lib/offers.ts`'s `getOfferBySlug` /
  `lib/legal.ts`'s `getLegalPageBySlug` pattern exactly: return `null` for an unknown slug,
  let the route handler call `notFound()`.
- **Schema**: add a new `LandingPage` model to `prisma/schema.prisma` —
  `landing-page-template.md`'s Data requirements list is literal: `id`, `slug` (`@unique`),
  `headline`, `openingParagraph`, `bodyContent`, `ctaLabel`, `ctaHref`, `campaignReference`,
  `metaTitle`, `metaDescription`. No prior task built this table (T5.1 is the first task in
  this epic) — run `npx prisma migrate dev` for it. Follow this schema's own established
  `isPlaceholder`/`createdAt`/`updatedAt` conventions on every content-bearing model even
  though the feature doc's own field list doesn't restate them.
- `export const dynamic = "force-dynamic"` — reads live `landing_page` content on every
  request, same reasoning as every other DB-backed public page.
- A non-existent slug must 404 exactly the same way `app/offers/[slug]/page.tsx` and
  `app/legal/[slug]/page.tsx` already do (`notFound()` from `getLandingPageBySlug` returning
  `null`) — this task's own explicit acceptance criterion.
- Every public page type carries `meta_title`/`meta_description`/complete OG+Twitter tags
  (NFR-5) — reuse `lib/seo.ts`'s `buildPageMetadata` exactly as every other page does, even
  though this page has no navigation; a landing page is still a paid-ad destination that gets
  previewed/shared/forwarded (the feature doc's own Data requirements note this explicitly).
- Do not let this page accidentally inherit any conversion-event wiring from components it
  borrows — this task doesn't touch measurement at all (T5.3 does); a landing page CTA is a
  plain link to its real destination (`/diagnostic`, a checklist download, `/contact`) for now.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — a Next.js App Router dynamic route
  (`app/lp/[slug]/page.tsx`), TypeScript, Prisma as the only data-access layer.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind v4 CSS-first styling;
  the minimal header/footer this task builds still draws from `ui/design-system.md`'s
  existing tokens, not new ad hoc values, even though it isn't the standard `SiteHeader`/
  `SiteFooter` markup.

## Relevant feature specification
docs/features/landing-page-template.md — "Business rules" (no-navigation rule, independently
editable headline/opening paragraph, the Section 8.2 footer-statement rule, the three named
launch instances), "Data requirements" (the `landing_page` entity's literal field list), and
"Edge cases" (unknown slug 404s, navigation is structurally unavailable to a partner, not just
hidden) are this task's exact contract.

## Mockup / UI reference
`ui/mockups/d-landing-pages/landing-business-health-check.html` (plus the other two instances
in that same directory for cross-reference on which parts of the structure are genuinely
shared vs. per-campaign) — note the epic file's own cited path
(`ui/mockups/a-public-site/landing-page.html`) is stale; see the "Important" note above.

## Coding standards
- Mockups are authoritative for UI (applies) — build to the shared structure across all three
  real instances in `ui/mockups/d-landing-pages/`, not an invented layout.
- Responsive built in from first implementation (applies) — mobile (~375–430px), tablet
  (~768px), desktop (~1200px+), even though the mockup is desktop-only.
- Feature docs are the data/interface contract (applies) — landing-page-template.md's Data
  requirements section is this task's literal field list.
- Business logic lives in `lib/` (applies) — `lib/landing-pages.ts`, not inline in the route.
- Every entity field maps to the feature doc (applies) — `LandingPage`'s fields match that
  doc's literal list.
- Content the firm can change lives in the database (applies) — this is exactly what makes a
  landing page instance's headline/copy/CTA database-backed and independently editable
  per campaign (FR-4.2), rather than a hand-coded page per campaign.
- Every public page type carries `meta_title`/`meta_description` (applies — see Architecture
  constraints above).
- Every conversion moment fires through the GTM `dataLayer` pattern (not applicable to this
  task specifically — T5.3 wires the six fixed events; this task's CTA is a plain link to a
  destination that already fires its own event on its own page, e.g. `/diagnostic`).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.2
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
