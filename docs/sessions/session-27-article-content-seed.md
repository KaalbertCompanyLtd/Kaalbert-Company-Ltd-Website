# Session 27 — Article content seed

# Date: 2026-09-06

# Tasks completed: T4.4

## What Was Built

Seeded the firm's real 8 Insights articles — found via a user-directed search of Document
13.03 and the wider Company Docs data room after an initial dead end — as real,
non-placeholder `Article` rows across 6 real categories, with real partner author attribution
and real next-step CTAs adapted from each article's own closing section. Also fixed a real
UI regression the user caught once real content existed: Home's featured-Insights cards had
drifted into a visually different, unlinked component with no path to the article or the
index — fixed by extracting one shared `ArticleCard` component both Home and the real
`/insights` index now render identically.

## Files Changed

- prisma/seed.ts — `seedInsightsContent()`, `INSIGHTS_ARTICLES` (all 8 articles' real body
  content, excerpts, next-step CTAs), `INSIGHTS_CATEGORIES` (6 real categories); wired into
  `main()`
- components/insights-article-card.tsx — new; the shared `ArticleCard` (+ `categoryInitials`
  helper), extracted from `app/insights/page.tsx`
- app/insights/page.tsx — now imports `ArticleCard` from the shared component instead of
  defining it locally
- lib/insights.ts — `shapeArticleCard` exported (was file-private) so `lib/home.ts` can
  produce the identical card shape
- lib/home.ts — `getFeaturedArticles` now returns `InsightsArticleCard[]` (the shared shape)
  instead of its own one-off shape with `category` as a plain string
- lib/home.test.ts — updated mocks/assertions for the new return shape
- app/(public)/page.tsx — featured-Insights section now renders the shared `ArticleCard` and
  adds a "See all Insights →" link
- memory/completed-work.md, memory/decision-log.md — this session's entries

## Decisions Made

- **Author attribution** (Document 13.03 §13 itself flags this as unresolved in the source —
  articles are attributed generically to "Kaalbert & Company Ltd," not a named partner):
  assigned each article to one of the firm's 5 real partners by subject-matter fit against
  their real practice areas, spread roughly evenly (2/2/2/1/1), not clustered on one partner.
  Fully reassignable later via T7.2's admin editor with zero schema/migration concern.
- **Categories**: consolidated the 8 articles' own stated "Theme" metadata into 6 real
  category rows (not 8 one-article categories, not the mockup's fictional two-category
  split) — grouped by genuine thematic overlap (e.g. Pricing joined Growth & Strategy).
- **`previewImage` stays null** on every row — Document 13.03 §13 lists "preview images" as
  still outstanding (a photography/design deliverable this task can't produce) — falls back
  to the site's default OG image until real ones exist.
- **`nextStepCta` per article** adapted (condensed, not invented) from that same article's own
  real "How Kaalbert can help" section — mapped to a real core offer where one directly fits
  (Funding-Readiness Pack, Financial Clarity Pack) and to the free Business Health Check
  otherwise, matching the "soft re-engagement" default the three core offer pages already use.
- **`publishedAt` spread biweekly** (2026-06-01 to 2026-09-01) matching Document 13.03 §7's
  stated "two articles per month" cadence, even though all 8 were seeded together.
- **Process note on the earlier "empty state" direction**: T4.4 initially looked headed for
  zero seeded content (the source seemed unlocatable at first, and the user's own instruction
  was explicitly "don't seed incomplete data, we'll rather have the empty state"). That
  approach was reverted cleanly (nothing had been committed) the moment the user found and
  supplied the real source — worth remembering: "no content found" and "user hasn't looked
  everywhere yet" are different states, and it's worth naming precisely what was searched
  before concluding content doesn't exist.
- **Real regression found and fixed**: Home's featured-Insights cards (built at T2.1, before
  `article` existed, then wired to real data at a T2.1 follow-up in session 25) had never
  been visually compared against the real Insights index card once both existed — the user
  caught this in review, not any automated check. Root cause was a shape mismatch
  (`getFeaturedArticles`'s own one-off return shape vs. `lib/insights.ts`'s shared
  `InsightsArticleCard`), fixed by unifying the shape and extracting one shared card
  component, not by patching each divergent render separately.
- **`lib/about.ts`'s `getInitials` left untouched** for its real, verified use (partner
  avatars) — the category-thumbnail fallback needed its own `categoryInitials` helper instead
  (skips symbol-only "words" like a bare "&"), rather than changing a person-name utility's
  behaviour for an unrelated caller.

## Current State

`/insights`, every `/insights/[slug]`, and Home's featured-Insights section all render real,
final (non-placeholder) firm content end-to-end — verified via Playwright at mobile/tablet/
desktop, including OG/Twitter tags and both JSON-LD blocks. This closes out the "Insights has
no real content" gap entirely; no technical debt remains open for this task specifically.

## Blockers

None.

## Next Task

T4.5 — Subscription capture
File: docs/tasks/04-insights.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/04-insights.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T4.5 — Subscription capture

## What to build
The subscribe form on the index and at the foot of every article,
`subscriber` entity, `POST /api/insights/subscribe`, `POST /api/insights/unsubscribe` — one
explicit, unticked consent checkbox, no separate contact-consent field (per the documented
reasoning that the signup itself is the consent).

## Input → Output contract
`{email, consent}` → `subscriber` row; unsubscribe link (sent in
every transactional email, reusing T3.7's email utility) → `unsubscribed_at` set.

## Acceptance criteria
A duplicate signup from an already-subscribed email does not create a
second row — re-confirms, and clears `unsubscribed_at` if it was set; no `subscription`
measurement event fires (deliberately not one of Document 13.03's fixed six events — this
task must not invent one).

## Size / Dependencies
M, depends on: T4.1 (this task adds its own `Subscriber` model — `insights-engine.md`'s Data
requirements section names it, but T4.1's own build note explicitly deferred it, and none of
T4.2–T4.4 built it either; you are the first task that needs it), T3.7 (`lib/email.ts`'s
`sendTransactionalEmail` utility, built specifically anticipating this task as its second
consumer — see that file's own doc-comment).

**Important — no mockup exists for the subscribe form itself.** Neither
`ui/mockups/b-insights/insights-index.html` nor `insight-owner-drawings.html` shows a
subscribe form anywhere (checked directly, session 27) — `ui/screen-inventory.md` only names
an *admin* "Subscribers list" screen (35a, Milestone 7) as inferred; the public-facing capture
form has no dedicated mockup and no named "infer from" screen either. Design a reasonable,
design-system-consistent form (email input + one unticked checkbox + submit button, inline
success/error state) rather than guessing a specific layout from a screen that doesn't exist —
follow `components/contact-form.tsx`'s established client-form pattern (Field/FieldLabel/
FieldError from `@/components/ui/field`, `Checkbox` from `@/components/ui/checkbox`,
controlled inputs, a `fetch` POST, an idle/submitting/success/error status state machine) for
the interaction shape, adapted to Insights' one-field-plus-consent form instead of Contact's
fuller one.

## Architecture constraints
- Business logic lives in `lib/` — add `subscribeToInsights`/`unsubscribeFromInsights` (or
  similar) to a `lib/insights-subscription.ts` (or extend `lib/insights.ts`), mirroring
  `lib/enquiries.ts`'s `createContactEnquiry`/`ContactValidationError` pattern exactly: the
  route handler only parses the request body and shapes the response, all validation and the
  actual `subscriber` write happen in `lib/`.
- **Schema**: add a new `Subscriber` model to `prisma/schema.prisma` — `id`, `email` (String,
  `@unique` — this is what makes "duplicate signup doesn't create a second row" enforceable at
  the database layer, not just the application layer), `consent` (Boolean), `subscribedAt`
  (DateTime, `@default(now())`), `unsubscribedAt` (DateTime?, nullable). Run
  `npx prisma migrate dev` for this — unlike T4.3's `nextStepCta` revision, this is a brand
  new table, not a `Json` shape change, so a real migration is required. Decide and document
  how `POST /api/insights/unsubscribe` identifies which subscriber to unsubscribe from a
  clicked link: either the row's own `id` (simpler, acceptable for this low-stakes,
  non-financial action) or a dedicated unique `unsubscribeToken` field generated at subscribe
  time (more conventional practice, prevents trivially guessing/enumerating another
  subscriber's id) — either is defensible, but make the call deliberately and say which you
  chose and why in this task's `memory/decision-log.md` entry, don't default to one silently.
- `POST /api/insights/subscribe` must upsert by `email`: an already-subscribed email
  re-confirms (never a second row) and clears `unsubscribedAt` if it was set — this is the
  task's own explicit acceptance criterion, not an edge case to skip.
- `consent` must be validated as explicitly `true` server-side before creating/updating a row
  (never inferred from the request's mere presence) — same "never assume, always validate"
  precedent as `lib/enquiries.ts`'s `contactConsent` check.
- Send a subscription-confirmation email via `lib/email.ts`'s `sendTransactionalEmail` on a
  successful new/re-confirmed subscription, containing the required one-click unsubscribe
  link — this is what "reusing T3.7's email utility" in this task's own dependency line
  actually cashes out to: no bulk-newsletter-sending feature exists yet in this phase, so this
  confirmation email is the concrete place the "every sent email carries an unsubscribe link"
  rule (insights-engine.md's own Interfaces section) is first implemented and provable.
- **No new measurement event** — this task's own explicit acceptance criterion. Do not call
  `pushDataLayerEvent` anywhere in the subscribe/unsubscribe flow, unlike every other form in
  this codebase (`ContactForm`, `WhatsAppLinkButton`) which does fire one. Document 13.03's six
  fixed events (diagnostic started/completed, summary requested, checklist downloaded, enquiry
  submitted, WhatsApp opened) are a closed list.
- The subscribe form appears in two places (index footer area, and the foot of every article)
  — build it as one shared component (e.g. `components/insights-subscribe-form.tsx`) rendered
  from both `app/insights/page.tsx` and `app/insights/[slug]/page.tsx`, not duplicated markup
  — same "extract once, don't let two renders drift" lesson this session's Home-card fix just
  demonstrated concretely.
- Never let this new `"use client"` form component import a value (not just a type) from a
  `lib/` file that also imports `@/lib/prisma` — it must only ever call `fetch("/api/insights/
  subscribe")`, never import `lib/insights-subscription.ts`/`lib/insights.ts` directly.
- `export const dynamic = "force-dynamic"` doesn't apply to the two new API routes themselves
  (route handlers aren't statically prerendered the way pages are), but double-check neither
  `app/insights/page.tsx` nor `app/insights/[slug]/page.tsx` lost theirs while you're in those
  files adding the subscribe form.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — the two new routes are Next.js Route
  Handlers (`app/api/insights/subscribe/route.ts`, `app/api/insights/unsubscribe/route.ts`),
  same convention as `app/api/contact/submit/route.ts`.
- ADR 0006 — docs/adr/0006-gtm-measurement-container.md — directly relevant to this task's
  "no new event" rule: GTM/`dataLayer` is the single measurement mechanism, and Document
  13.03's six-event list is fixed — this task is the concrete case of deliberately NOT wiring
  a new conversion moment into it, not an oversight.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — the new subscribe form uses
  shadcn/ui components (Field, Checkbox, Input) on Base UI, matching every other form in this
  codebase.

## Relevant feature specification
docs/features/insights-engine.md — "User flow" step 5 (the subscription flow itself, and its
explicit note that this is one of exactly two secondary capture routes named in Document
13.03 Section 6), "Business rules" (the single-checkbox consent rule, the "no seventh
measurement event" rule), "Data requirements" (`subscriber` entity fields), "Interfaces"
(`POST /api/insights/subscribe`, `POST /api/insights/unsubscribe`), and "Edge cases" (the
duplicate-signup re-confirmation behaviour) are this task's exact contract.

## Mockup / UI reference
Not applicable in the usual sense — no dedicated mockup and no named "infer from" screen
exists for the public subscribe form (see the "Important" note above). Design a reasonable
form consistent with `ui/design-system.md`'s existing patterns and `components/contact-form.
tsx`'s established interaction shape.

## Coding standards
- Mockups are authoritative for UI (not applicable here — no mockup exists; infer reasonably
  per the note above, don't guess a specific pixel layout from nothing).
- Responsive built in from first implementation (applies) — the subscribe form must work at
  mobile (~375–430px), tablet (~768px), and desktop (~1200px+) in both its placements.
- Feature docs are the data/interface contract (applies) — insights-engine.md's Interfaces/
  Edge cases sections are this task's literal contract.
- Business logic lives in `lib/` (applies — see Architecture constraints above).
- Every entity field maps to the feature doc (applies — `Subscriber`'s four fields match
  insights-engine.md's Data requirements list exactly; don't add undocumented fields without
  updating that doc, same rule every prior task in this epic followed).
- Content the firm can change lives in the database (not directly applicable — subscriber
  rows are visitor-submitted data, not firm-authored content, though the admin "Subscribers"
  list, T7.2/Milestone 7, will let a partner view/export them later).
- Every public page type carries `meta_title`/`meta_description` (not applicable — this task
  adds no new page, only a form embedded in two existing pages).
- Every conversion moment fires through the GTM `dataLayer` pattern (applies, as a
  *deliberate exception* — see Architecture constraints above: this specific moment must NOT
  fire one).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.1
in its "Paste This to Continue" block (T4.5 is the last task in the Insights epic — T5.1 is
the first task of Milestone 5, `docs/tasks/05-landing-and-measurement.md`), then stop. Do not
begin the next task in this same session.
```
