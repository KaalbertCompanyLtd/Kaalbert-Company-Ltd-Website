# Session 44 — Admin Dashboard

# Date: 2026-09-11

# Tasks completed: T7.1

## What Was Built

Replaced the T1.5 placeholder at `app/admin/(shell)/page.tsx` with the real `/admin` landing
screen: four live stat cards (New Enquiries, Triage-flagged, Diagnostics This Month, Published
Articles) and a recent-enquiries panel (5 most recent `enquiry_record` rows, unfiltered),
built to `ui/mockups/g-admin-content/admin-dashboard.html`. All aggregate queries live in a
new `lib/admin-dashboard.ts`, not inline in the page. Two real data gaps surfaced mid-build —
`enquiry_record` has no `status` column yet (Milestone 8/T8.1 scope) and no per-enquiry triage
priority level is persisted anywhere — both worked around honestly rather than built early or
faked, and sequenced into T8.1 via an addendum.

## Files Changed

- `lib/admin-dashboard.ts` (new) — `getAdminDashboardStats`, `getRecentEnquiries`, both real
  Prisma aggregate/list queries against `EnquiryRecord`/`Article`.
- `lib/admin-dashboard.test.ts` (new) — 9 tests covering both functions, including the
  diagnostic-vs-contact-form source derivation and the status/triage placeholder behaviour.
- `app/admin/(shell)/page.tsx` — real dashboard content (stat cards, recent-enquiries table,
  quick actions), `export const dynamic = "force-dynamic"`.
- `docs/tasks/08-enquiry-management.md` — addendum on T8.1 sequencing both discovered gaps
  (the `status` column and a new `triagePriorityLevel` column) into that task.
- `memory/technical-debt.md` — two new entries: the `status`/Status-badge placeholder, and
  triage priority level never being persisted.
- `memory/decision-log.md` — one new entry recording the reasoning for all four workarounds
  (unfiltered "new" count, hardcoded Status badge, boolean Triage badge, two-way Source
  label) and why each wasn't built early instead.
- `memory/completed-work.md` — T7.1 entry.
- `docs/user-guide.md` — new "Admin dashboard" note under the Admin Login section describing
  what a partner can now see, plus the two honest placeholders to expect.
- Artifact `https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc` (Platform
  User Guide) — republished as version 4 with a new "Admin dashboard" capability card and
  updated cross-references in the Public Pages/Diagnostic/Insights/Admin Login cards.
- `CLAUDE.local.md` — dev admin account's 2FA re-enrolled during verification (original TOTP
  setup had been left incomplete from account creation); recorded the new setup key and
  backup-code set.

## Decisions Made

- **Did not add `enquiry_record.status` early**, even though it's a small schema change T7.1
  could have made — the model's own doc-comment explicitly flags it "not anticipated here,"
  and it's `enquiry-management.md`'s extension, Milestone 8/T8.1 scope. Computed "New
  enquiries" as an unfiltered `COUNT(enquiry_record)` instead — honestly correct today, since
  no status-transition capability exists yet for a row to be anything other than new.
- **Rendered the Triage column as a real, persisted boolean** (Flagged/Not flagged) rather
  than fabricating the mockup's High/Medium/Low badge — that priority word is computed at
  diagnostic-scoring time (`lib/diagnostic-scoring.ts`) but never persisted per-row, and
  reconstructing it later from currently-configured thresholds would misrepresent history
  (thresholds are admin-editable, per ADR 0005).
- **Simplified Source to a two-way "Business Health Check"/"Contact form" label**, dropping
  per-landing-page name enrichment — the mockup's landing-page-name variety read as
  illustrative sample data, not a stated data requirement, and that finer detail already has
  a real home at T8.3's enquiry detail screen.
- Both real gaps (no `status` column, no persisted triage priority) logged in
  `memory/technical-debt.md` and sequenced into T8.1 via an addendum in
  `docs/tasks/08-enquiry-management.md`, since that task already extends this same table's
  schema — a natural fit, not a new task.
- Followed the mockup's exact 4-column recent-enquiries shape (Name/Source/Triage/Status),
  not `enquiry-management.md`'s fuller list-screen field set (which also has Business/Date
  columns) — the mockup is authoritative for structure per CLAUDE.md.

## Current State

Milestone 7 (Content Management Admin) underway: the admin dashboard (T7.1) is live and
verified against real seeded data. The rest of Milestone 7 — Articles/Categories editor
(T7.2), Pages editor (T7.3), Offer editor (T7.4), Landing Pages admin (T7.5), Team editor
(T7.6), Diagnostic Configuration (T7.7) — is not yet built; every sidebar link to those areas
still 404s (same not-yet-built-but-real-route precedent already established by
`components/admin-sidebar-nav.tsx` since T1.5/T6.2).

## Blockers

None for T7.2. (Two real, tracked, non-blocking gaps carried forward — see
`memory/technical-debt.md` — both sequenced into T8.1, not blocking any Milestone 7 task.)

## Next Task

T7.2 — Articles editor + Categories
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.2 — Articles editor + Categories

## What to build
Rich-text article editor (`ui/mockups/g-admin-content/admin-article-editor.html`) —
tables/pull-quotes/figures, category/author/preview-image selection, the 10.05-compliance
checkbox gating Publish alongside the required-preview-image gate; Categories CRUD
(create/rename/retire, unique-slug validation).

## Input → Output contract
Article form submission → `article` row (`published_at` set only on Publish); Category form
→ `category` row.

## Acceptance criteria
Publish is disabled until both a preview image is set and the 10.05-compliance checkbox is
checked (matches the mockup exactly, per an earlier session's fix — re-verify in browser);
retiring a category leaves its articles un-deleted, falling back to no-category; a duplicate
category slug is rejected inline, not silently duplicated.

## Size / Dependencies
L, depends on: T6.3 (login + session management — this task builds inside the
already-secured `/admin` shell, no new auth boundary), T4.1 (the `article`/`category`
entities this task edits already exist and are seeded, per the Insights epic).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component beyond what's needed
  to call into `lib/` and render the result — write article create/update/publish logic and
  category CRUD as `lib/` functions, not inline Prisma calls in route handlers or components.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** The articles list, the editor (loading an existing article for edit),
  and the categories screen all read live DB content on every request.
- **Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`.** The rich-text editor and any interactive form pieces are client
  components — if they need option/lookup data (e.g. category list, author list) sourced
  from a `lib/` module that also imports `@/lib/prisma`, put the client-safe lookup data in
  its own file with zero `@/lib/prisma` import (mirror the existing
  `lib/diagnostic-flow-options.ts` pattern already used for exactly this split).
- **Never let a `package.json` lifecycle script assume `.git` exists** — not applicable
  unless this task adds a lifecycle script (unlikely).
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`) for anything
  interactive (dialogs for category rename/retire confirmation, form fields, etc.), not a
  bare `<div>`.
- The mockup is authoritative — build the article editor to
  `ui/mockups/g-admin-content/admin-article-editor.html`'s exact structure and copy; build
  Categories CRUD to `ui/mockups/g-admin-content/admin-categories-list.html`'s structure
  (cited by this epic's own Categories user-flow step, not this task's own "Build" line,
  which only names the article editor mockup — read both).
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), and desktop
  (mockup's own width) all before this task is done, even though the mockups are
  desktop-only.
- Fee amounts as structured min/max band — not applicable, this task touches no fee data.
- Diagnostic scoring configuration is data, not logic — not applicable, no diagnostic data
  here.

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — the rich-text editor is a
  "well-vetted library used as a component inside hand-written code" (the ADR's own example),
  never a product that supplies the whole admin/content experience — pick an editor library
  accordingly, don't reach for an embedded CMS-like widget.
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — the article's required preview image
  (and any inline figures) upload to Cloudflare R2, added "once volume justifies a dedicated
  store" — confirm R2 is actually provisioned yet (`CLAUDE.local.md`'s Credentials section);
  if not, this task may need to provision it first, per `memory/technical-debt.md`'s T7.2
  session-26 addendum on the media pipeline.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives, don't introduce a new color/radius/font for the editor UI.

## Relevant feature specification
docs/features/content-management-admin.md — "User flow" steps 3 (publish an article) and 10
(manage categories), and its Business rules section (10.05-compliance checkbox gate,
preview-image-required-before-publish gate, category retire-doesn't-delete-articles rule,
duplicate-slug rejection) and Edge cases section (no-preview-image block, duplicate category
slug). Also read docs/features/insights-engine.md for the `article`/`category` entity's full
field set (this task edits that entity, it does not redefine it).

## Mockup / UI reference
- `ui/mockups/g-admin-content/admin-article-editor.html` — the rich-text article editor,
  build to this file's exact structure and copy.
- `ui/mockups/g-admin-content/admin-categories-list.html` — Categories CRUD, build to this
  file's structure (cited by `content-management-admin.md`'s own user flow, not this task's
  "Build" line).
- `ui/mockups/g-admin-content/admin-articles-list.html` — the articles list screen this
  editor is reached from (the dashboard's "New Article" button and sidebar "Articles" link
  both point here) — confirm whether this screen is in scope for T7.2 or was already
  expected to exist; if not yet built, this task likely needs a minimal list screen too
  (check `ui/screen-inventory.md` for whether it's a dedicated numbered screen already
  assigned elsewhere).

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies — `article`/`category` fields already exist
  from T4.1; this task edits them, doesn't rename or add fields without updating the feature
  doc first).
- Fee amounts as structured min/max band (not applicable).
- Content the firm can change lives in the database, edited via `/admin` (applies — this
  task is the literal mechanism for articles/categories).
- Diagnostic scoring configuration is data, not logic (not applicable).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` on any page/route reading live DB content
  (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies — the editor is client-side; keep any shared lookup data client-safe).
- Never let a `package.json` lifecycle script assume `.git` exists (not applicable).
- The shared generic `page` entity pattern (not applicable — articles/categories are their
  own entities, not the `page` entity).
- Every public page type carries meta_title/meta_description + OG/JSON-LD (not
  applicable to this admin screen itself, but the article fields this editor sets, e.g.
  preview image, are what T4.3's public article page already reads for its own OG tags —
  don't break that contract).
- Every conversion moment fires through the GTM dataLayer pattern (not applicable — no new
  conversion event here).
- Every scheduled/background job is its own Railway service (not applicable).
- The "one nav entry, second screen via inline link" pattern — Categories is reached from
  Articles' own screen per this project's established pattern (check whether the mockup
  shows Categories as an inline link from the article editor/list, or its own sidebar item —
  `components/admin-sidebar-nav.tsx` currently has no separate Categories entry, suggesting
  the inline-link pattern applies here too).

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
[ ] memory/technical-debt.md updated (if applicable) — including making the session-04 and
    session-26 addendum calls this task's own epic entry already flags (the last-write-wins
    staleness-check decision, and the R2 media-pipeline decision), not just new debt found
    this session
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
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

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
