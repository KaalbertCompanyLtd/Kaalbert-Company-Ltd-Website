# Session 51 — Site Settings admin

# Date: 2026-09-11

# Tasks completed: T7.8

## What Was Built

Built `/admin/site-settings` — a flat singleton form editing `site_settings`
(phone_primary/secondary, email, whatsapp_number, address, response_time_commitment,
social_profile_urls), no 10.05-compliance checkbox (contact details aren't a marketing
claim), following the Capabilities/Our Method editor pattern per the task's screen-inventory
mapping. Every required field is savable blank per content-management-admin.md's edge case
(pre-launch content not finalised) — the public side is what omits its own display, not a
save-time rejection. The larger part of this task closed three long-standing technical-debt
entries this update depended on: every real `<SiteFooter>` call site (sixteen, not the
five/seven originally flagged — more had accumulated across Milestones 2–7) now reads live
`site_settings`/`footer_content` instead of T1.5's hardcoded literals, `SiteFooter`'s props
are now all optional with a fallback (mirroring `SiteHeader`'s existing
`FALLBACK_CORE_OFFERS` precedent) so `app/error.tsx`/`app/not-found.tsx` keep working with no
DB fetch, and `ScopeOfPracticeNote` now reads `footer_content` live instead of hardcoding the
scope-of-practice text.

## Files Changed

- `lib/admin-site-settings.ts` (new) — `getSiteSettingsForEdit`/`updateSiteSettings`; no
  domain validation errors (blank required fields are allowed to save, per the feature doc).
- `lib/admin-site-settings.test.ts` (new) — 4 tests.
- `lib/site-settings.ts` — added `getSiteFooterContent()` combining `getSiteSettings()` +
  the new `getFooterContent()` into `SiteFooter`'s exact prop shape.
- `lib/site-settings.test.ts` (new) — 5 tests.
- `lib/legal.ts` — added `getFooterContent()` (the resolver a prior session's addendum
  expected to already exist but didn't).
- `lib/seo.ts` — `getOrganizationJsonLd` now omits `telephone`/`email`/`address` (not just
  `sameAs`) when the underlying `site_settings` field is blank.
- `app/admin/(shell)/site-settings/page.tsx` (new), `site-settings-editor-form.tsx` (new).
- `app/api/admin/site-settings/route.ts` (new) — `PATCH /api/admin/site-settings`.
- `components/site-footer.tsx` — every prop now optional, defaults to T1.5's original
  literals only when a prop is omitted; added `scopeOfPracticeStatement`/
  `companyRegistrationDetails` props threaded to `ScopeOfPracticeNote`.
- `components/scope-of-practice-note.tsx` — now accepts `statement`/
  `companyRegistrationDetails` as props instead of hardcoding the text.
- `app/contact/page.tsx` — added `getFooterContent()` fetch, passes real footer props; also
  fixed a bug found live-verifying this task (see below): the WhatsApp/phone/email/office
  cards now render conditionally instead of producing an empty, broken `tel:`/`wa.me`/
  `mailto:` link when the underlying field is blank.
- `<SiteFooter>` call site updated in every other real public page: `app/(public)/page.tsx`,
  `app/capabilities/page.tsx`, `app/our-method/page.tsx`, `app/about/page.tsx`,
  `app/diagnostic/page.tsx`, `app/diagnostic/results/page.tsx`, `app/offers/[slug]/page.tsx`,
  `app/insights/page.tsx`, `app/insights/[slug]/page.tsx`, `app/legal/[slug]/page.tsx`,
  `app/lp/[slug]/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, and the two
  `app/dev/layout-shell/*` scratch pages (dropped their hardcoded props, rely on the
  fallback).
- `memory/technical-debt.md` — flipped two entries to Resolved in place (`footer_content`
  not wired into `SiteFooter`; `SiteFooter` callers hardcoded); updated the still-Open
  `response_time_commitment` entry's `Sequenced into` to point at the now-built screen.
- `memory/completed-work.md` — new T7.8 entry.
- `docs/user-guide.md` — new "Editing Site Settings" section, updated the stale
  "footer doesn't read it live yet" note, updated "What's coming next" and the change log.
- Artifact mirror (`https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc`)
  republished to Version 11 with the same changes.

## Decisions Made

- Kept `SiteFooter` as a plain presentational component (no internal data fetching) rather
  than converting it to an async Server Component that fetches its own data — the latter
  would break both `app/error.tsx` (a required Client Component, can't render a Server
  Component that pulls in `@/lib/prisma`) and `app/not-found.tsx` (deliberately zero-DB-
  dependency for reliability, per its own existing comment about a real DNS-hang incident).
  Followed `SiteHeader`'s already-established `offerNavLinks?`/`FALLBACK_CORE_OFFERS`
  pattern instead — proven precedent for exactly this constraint.
- Left `footer_content`'s own admin editor exactly where T7.3 built it (the Legal Pages
  screen), even though `legal-and-compliance-pages.md`'s prose says "same Site Settings
  screen" — that line predates T7.3's actual build and was never corrected; moving the
  editor now would be an unrequested UI change outside this task's own "Build" line, which
  only asked for the `site_settings` form itself. Only the public-facing wiring was this
  task's job.
- Added no format/business validation to `updateSiteSettings` beyond trim/null-coalescing
  (e.g. no WhatsApp digit-format check) — content-management-admin.md's edge case explicitly
  allows every required field to save blank, and no doc names any other validation rule for
  this screen; inventing one would be unrequested scope.
- Live-verification via Playwright surfaced a real bug outside this task's own file list
  (`app/contact/page.tsx`'s cards rendering broken empty links on a blank field) — fixed it
  in the same session rather than filing it as new technical debt, since it was small,
  directly touched this task's own acceptance bar ("omitted... rather than rendering
  broken"), and the file was already being edited.

## Current State

Milestone 7 (Content Management Admin) has Dashboard, Articles/Categories, Pages, Offers,
Landing Pages, Team, Diagnostic Configuration, and now Site Settings all live. Subscribers
(T7.9) and article-resource attachment (T7.10) remain. `response_time_commitment` is still
unset — the firm hasn't stated a real, keepable number yet (User-triggered technical debt,
unchanged this session).

## Blockers

None.

## Next Task

T7.9 — Subscribers list
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.9 — Subscribers list

## What to build
`ui/screen-inventory.md` #35a — `AdminDataTable` variant under Operations, listing
`subscriber` rows, export, manual removal.

## Input → Output contract
`subscriber` table → paginated list; export action → downloadable file;
removal action → `unsubscribed_at` set (never a hard delete, consistent with
`insights-engine.md`'s own rule).

## Acceptance criteria
Export produces a file matching the on-screen filtered set; manual
removal here has the identical effect as a visitor's own one-click unsubscribe link (same
underlying update, not a second code path).

## Size / Dependencies
S, depends on: T6.3 (admin auth/session gate every `/admin` route requires — enforced
globally by `proxy.ts`'s matcher, no per-route code needed), T4.5 (the real `subscriber`
table, its `unsubscribeToken`/`unsubscribedAt` columns, and the existing
`lib/insights-subscription.ts#unsubscribeFromInsights(token)` this task's own removal action
must reuse, not duplicate).

## Architecture constraints
- Business logic lives in `lib/` (a new `lib/admin-subscribers.ts`), never inside the route
  handler or a React component beyond calling into `lib/` and rendering the result.
- **Reuse `lib/insights-subscription.ts`'s `unsubscribeFromInsights(token)` for the manual
  removal action** — insights-engine.md's own unsubscribe rule (`unsubscribed_at` set, never
  a hard delete) and this task's own acceptance criterion both require the admin path and the
  visitor's one-click email link to be "the same underlying update, not a second code path."
  That function takes the subscriber's own `unsubscribeToken` (never `id` — see `Subscriber`'s
  schema doc-comment for why), so the admin removal action looks up the row's token first,
  the same way the emailed link already does, rather than writing a second `unsubscribedAt`
  update inline in this task's own lib file.
- Export must reflect the same filtered/sorted set currently on screen — not always a full
  unfiltered table dump — per this task's own acceptance criterion.
- Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.
- Never let a `"use client"` component import a value (not just a type) from a `lib/` file
  that also imports `@/lib/prisma` — check before adding any shared import to a client
  filter/table component.
- This is a Phase 1, always-on capability — not one of the gated Phase 2 capabilities ADR
  0012 describes (Brevo campaign sending/outreach). This task only ever views, exports, and
  manually removes existing `subscriber` rows; it must not add composition, scheduling, or
  sending of any kind — that's `docs/features/subscriber-outreach.md` (P2-8), explicitly out
  of scope until its own evidence trigger is met and the user says to proceed.

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — this list/export/removal screen
  is hand-built application code the team owns, never a third-party list/export product.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first, no
  tailwind.config.js) + shadcn/ui generated on Base UI + Lucide icons; build the table on the
  same `AdminDataTable` pattern (shadcn `Table`-based: columns, rows, filters, sort) this
  epic's own Articles list (T7.2) already established, not a one-off table implementation.
- ADR 0012 — docs/adr/0012-brevo-campaigns-for-subscriber-outreach.md — actually emailing
  this list (campaign composition/sending) is Brevo-native, Phase 2, gated on P2-8's own
  trigger — named here specifically so this task's list/export/removal screen isn't mistaken
  for, or quietly grown into, that separate capability.

## Relevant feature specification
docs/features/insights-engine.md — read in full; the `subscriber` entity's exact field list
(id, email, subscribed_at, consent, unsubscribed_at) and this screen's own placement
("Viewable/exportable in a new 'Subscribers' area under admin's Operations group ... inferred
from the same `AdminDataTable` pattern as the Enquiries list") are under "Data requirements";
the `POST /api/insights/unsubscribe` one-click-link rule this task's removal action must
match is under "Interfaces"/"Edge cases".

## Mockup / UI reference
No dedicated mockup — `ui/screen-inventory.md`'s own explicit mapping for entry #35a
(Subscribers list) says to infer from #26 (Articles list), the built screen that establishes
this project's `AdminDataTable` pattern (filters/sort) — `app/admin/(shell)/articles/page.tsx`
(built at T7.2, mockup `ui/mockups/g-admin-content/admin-articles-list.html`). Follow that
screen's table/filter/sort structure; this screen has no editor sub-screen (no per-row detail
page), just the list plus an Export action and a per-row Remove action — closer in shape to
T7.2's Categories list (inline actions, no separate editor) than to a full list+editor pair.

## Coding standards
- The mockups are authoritative — not applicable here (no dedicated mockup); infer from the
  named built screen instead, per above (applies).
- Responsive from first implementation (mobile ~375–430px, tablet ~768px, desktop
  ~1200px+) — even though the inferred pattern (Articles list) is desktop-only in its own
  screenshots (applies).
- Feature docs are the data/interface contract — `insights-engine.md`'s field list and
  unsubscribe rule above are not optional (applies).
- Business logic lives in `lib/`, never in the route handler or component (applies).
- Every entity field named in the feature doc maps to a same-named Prisma field — confirm
  `Subscriber`'s existing schema (from T4.5) already has every field this screen needs
  (`email`, `consent`, `subscribedAt`, `unsubscribedAt`) before assuming a schema change is
  needed (applies).
- Fee amounts as structured min/max — not applicable, no fee content on this screen (not
  applicable).
- Content the firm can change lives in the database, edited via `/admin` — not applicable in
  the usual sense (a subscriber row is real visitor data captured from `/insights`, not firm
  copy the firm authors) — this screen views/exports/removes real records, it does not let a
  partner "write" subscriber content (not applicable).
- Diagnostic scoring configuration is data, not logic — not applicable, this task is
  Subscribers, not diagnostic (not applicable).
- Accessibility (WCAG 2.1 AA) via Base UI primitives — applies to every interactive control
  on this screen (the table, filter/sort controls, Export/Remove buttons, any confirmation
  dialog for Remove) (applies).
- `export const dynamic = "force-dynamic"` on the page — applies (reads live `subscriber`
  rows).
- Never a `"use client"` component importing a value from a `@/lib/prisma`-importing `lib/`
  file — check before adding any shared import to the client table/filter component
  (applies, verify).
- Never a `package.json` lifecycle script assuming `.git` exists — not applicable, no
  lifecycle-script change in this task (not applicable).

## Task Completion Checklist
```

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
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
fix has Trigger type and Sequenced into filled in — never left blank
[ ] Every Task-sequenced Sequenced into target named or reused this session points at a task
in an epic that has NOT already fully shipped (check docs/roadmap.md/memory/completed-
work.md) — never a new task appended to an already-shipped epic file
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
task changed nothing firm-visible, note that explicitly rather than skipping silently
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

```

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.10 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
