# Session 45 — Articles & Categories Admin

# Date: 2026-09-11

# Tasks completed: T7.2

## What Was Built

The real Articles admin: a list screen (search/status/category filters, client-side
pagination), a structured block-based article editor (paragraph/heading/quote/list/table/
figure blocks, a required-preview-image + 10.05-compliance publish gate enforced both client-
and server-side), and a Categories screen (add/rename/retire, real duplicate-slug rejection).
New `lib/media-storage.ts` + `POST /api/admin/media` + `components/admin-image-upload-
button.tsx` give real image uploads (an interim base64 data-URI store, since Cloudflare R2
isn't provisioned yet). Fixed three real gaps between the accepted mockup and the actual
(later-evolved) `Article` schema — added `excerpt`/`metaTitle` fields and a full `nextStepCta`
panel the mockup never showed — and added a new `figure` block kind to `ArticleBodyBlock`
(`lib/insights.ts`) plus its public renderer. Split downloadable-resource attachment into a
new task, T7.10, rather than expanding this already-Size-L task further.

## Files Changed

- `lib/articles.ts`, `lib/articles.test.ts` — admin article CRUD (create/update/list/get),
  publish gate validation, slug generation.
- `lib/categories.ts`, `lib/categories.test.ts` — category CRUD, slugify, duplicate-slug
  rejection.
- `lib/media-storage.ts`, `lib/media-storage.test.ts` — interim base64 image upload/encode.
- `lib/insights.ts` — added `figure` kind to `ArticleBodyBlock`.
- `app/insights/[slug]/page.tsx` — renders the new `figure` block.
- `app/admin/(shell)/articles/page.tsx`, `articles-list-client.tsx`, `new/page.tsx`,
  `[id]/page.tsx`, `article-editor-form.tsx`, `block-editor.tsx`, `categories/page.tsx`,
  `categories/categories-client.tsx` — the full Articles/Categories admin UI.
- `app/api/admin/articles/route.ts`, `app/api/admin/articles/[id]/route.ts`,
  `app/api/admin/categories/route.ts`, `app/api/admin/categories/[id]/route.ts`,
  `app/api/admin/media/route.ts` — new API routes, parse/shape only.
- `components/admin-image-upload-button.tsx` — shared upload component (T7.5/T7.6 will
  reuse it).
- `docs/tasks/07-content-admin.md` — addendum on T7.6 (media-pipeline swap-to-R2
  checkpoint), new T7.10 task (article downloadable-resource management).
- `memory/technical-debt.md` — two new entries (interim base64 image storage; resource
  attachment not built), one updated entry (T7.5's downloadFileUrl entry now points at the
  real mechanism), one re-sequenced entry (the T4.3 live-HEAD-check entry now points to
  T7.10, not T7.2).
- `memory/decision-log.md`, `memory/completed-work.md` — T7.2 entries.
- `docs/user-guide.md` — Insights section rewritten for admin publishing; Artifact mirror
  republished (version 5).

## Decisions Made

- **Built a structured, add-a-block-of-type-X editor, not a freeform contenteditable/
  WYSIWYG** — `Article.body` has no freeform HTML/markdown block kind, only a strict typed
  union, so a block-add UI produces the real shape directly with no new dependency.
- **Real image uploads via an interim base64 data-URI store, not local disk** — Railway's
  container filesystem isn't durable across deploys (no Volume provisioned), so local-fs
  would silently lose uploads on redeploy. Base64-in-Postgres is durable today with zero new
  infra; the swap-to-real-R2 point is a single function (`lib/media-storage.ts`).
- **No "unpublish" action built** — the mockup's Status dropdown has no scripted behaviour
  in that mockup (unlike Categories', which does), so it's rendered as a read-only badge;
  "Save draft" on an already-published article only ever saves field edits, never touches
  `publishedAt`.
- **Article slugs derive from the title once, at creation, frozen thereafter** — protects
  published OG/search links from moving on a later retitle. A collision appends a numeric
  suffix automatically (contrast `Category.slug`, which surfaces a collision inline instead).
- **Last-write-wins shipped as documented** for the article `PATCH` handler — the conscious
  call this task's own session-04 addendum required (`content-management-admin.md`'s edge
  case explicitly accepts this for Phase 1).
- **Downloadable-resource attachment split into a new task, T7.10** — T7.2's own "Build" line
  named only tables/pull-quotes/figures as in-scope; `article_resource` upload is a real,
  separate, S-sized piece of work, not folded in.

Full reasoning for all of the above in `memory/decision-log.md` (T7.2, session 45).

## Current State

Milestone 7 (Content Management Admin) has 2 of 10 tasks done (dashboard, Articles/
Categories). Verified for real via Playwright MCP against the live dev database: edited a
real seeded article end to end (image upload, publish, confirmed `previewImage`/`publishedAt`/
`revisedAt` via direct query), created a brand-new article with a `figure` block from scratch
and confirmed it renders on its public page, and fully exercised Categories (duplicate
rejection, add, rename, retire — confirmed retiring genuinely deletes the row). All three
admin screens checked at mobile/tablet/desktop with no page-level horizontal scroll.

## Blockers

None for T7.3. Two real, tracked, non-blocking gaps carried forward (interim image storage
pending R2; resource attachment not yet built, now T7.10) — see `memory/technical-debt.md`.

## Next Task

T7.3 — Pages editor (marketing pages incl. Capabilities, Our Method; legal pages)
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.3 — Pages editor (marketing pages incl. Capabilities, Our Method; legal pages)

## What to build
One Pages content area editing the shared `page` entity (hero_kicker/hero_heading/hero_lead/
meta_title/meta_description, plus `intro_copy` where the page has it) with its linked
repeating section shown on the same screen — `capability` rows for Capabilities,
`method_stage` rows for Our Method — mirroring the Offer editor's method-stages/deliverables
pattern; legal pages and `footer_content` edited as a second panel on the same screen
(`legal-and-compliance-pages.md`), not a separate nav item.

## Input → Output contract
Page content edits → `page`/`capability`/`method_stage`/`legal_page`/`footer_content` rows;
save → the corresponding public page (T2.3, T2.4, T2.7) reflects the change immediately.

## Acceptance criteria
Editing a Capabilities `capability` row updates `/capabilities` without a deploy; editing a
legal page's body updates its `/legal/[slug]` page; the 10.05-compliance sign-off gate
(FR-5.4) applies to marketing-page publish actions the same way it does to articles.

## Size / Dependencies
L, depends on: T6.3 (login + session management — this task builds inside the
already-secured `/admin` shell), T2.3 (Capabilities page — the `capability`/`page` rows this
task edits already exist and are seeded), T2.4 (Our Method page — the `method_stage` rows
this task edits already exist and are seeded), T2.7 (legal pages — the `legal_page`/
`footer_content` rows this task edits already exist and are seeded).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component beyond what's needed
  to call into `lib/` and render the result — write page/capability/method-stage/legal-page/
  footer-content read/update logic as `lib/` functions, not inline Prisma calls in route
  handlers or components. Likely new files: `lib/pages.ts` (or extend the existing
  `lib/pages.ts` if it already has read-side functions for the public pages — check first)
  for admin-side update functions, plus whatever legal-page equivalent (`lib/legal.ts` likely
  already exists for the public `/legal/[slug]` read path — check before adding a second
  file).
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** The Pages list and each page's editor all read live DB content on
  every request.
- **Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`.** The legal-page body editor and any interactive form pieces are client
  components — if they need lookup data from a `lib/` module that also imports
  `@/lib/prisma`, put the client-safe data in its own file (mirror T7.2's own pattern: it
  didn't need this split since all lookup data was passed as plain props from a Server
  Component, not imported directly by a client component — likely the same approach works
  here).
- Reuse T7.2's block-editor pattern where it fits: `legal_page.body` is also a `kind`-
  discriminated block union (`lib/legal.ts`'s `LegalPageBlock`: `statement`/`prose`/
  `pending`/`table` kinds — a **different** kind set from `ArticleBodyBlock`'s
  paragraph/heading/quote/list/table/figure, don't assume they match), so a structured
  block-add editor is likely the right shape here too, not a freeform WYSIWYG — same
  reasoning T7.2's `BlockEditor` documents in its own doc-comment. Whether to generalize
  T7.2's `BlockEditor` to accept a configurable block-kind set, or build a second, separate
  small block editor for legal pages, is this task's own call — read `lib/legal.ts`'s exact
  `LegalPageBlock` shape first before deciding.
- The 10.05-compliance checkbox gate (same pattern as T7.2's article Publish gate) applies to
  marketing-page publish actions per this task's own acceptance criterion — but
  `page`/`capability`/`method_stage` have no `publishedAt`-style draft/live distinction in
  the schema the way `Article` does (check `prisma/schema.prisma`'s `Page`/`Capability`/
  `MethodStage` models — they look like they're always "live," no draft state). Reconcile
  this before assuming T7.2's exact publish-gate mechanics transfer directly: figure out
  what "publish" even means for content with no draft/published distinction, and whether the
  10.05 checkbox gates the save itself rather than a separate publish step.
- Fee amounts as structured min/max band — not applicable, this task touches no fee data
  (Offers are T7.4).
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`) for anything
  interactive, matching T7.2's own component choices (Dialog/AlertDialog for any
  confirm-style actions, Select/Checkbox/Field for forms).
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), and desktop
  all before this task is done, even with no dedicated mockup (see below).

## Relevant ADRs
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives, don't introduce a new color/radius/font.

## Relevant feature specification
- docs/features/content-management-admin.md — "User flow" step 4 (edit page copy) and its
  Business rules (10.05-compliance gate, per-partner sign-off) and Edge cases (last-write-
  wins, same as T7.2's own accepted simplification).
- docs/features/capabilities-page.md — `capability`/`page`(slug "capabilities") entity
  fields this task edits.
- docs/features/our-method-page.md — `method_stage`/`page`(slug "our-method") entity fields,
  including the `capabilityTransferNote` field populated only for the final (Deliver) stage.
- docs/features/legal-and-compliance-pages.md — `legal_page`/`footer_content` entity fields,
  the four fixed legal-page slugs, and the `is_placeholder`/"Draft — pending legal review"
  convention already live on the public legal pages (T2.7) — this task's editor must
  preserve/surface that flag, not silently lose it.

## Mockup / UI reference
No dedicated mockup — `ui/screen-inventory.md` lists "Pages list" (#28) and "Page editor"
(#29) among the 52 screens inferred rather than dedicatedly mocked (only 25 of 77 screens
have a real mockup file). Infer from:
- `ui/mockups/g-admin-content/admin-offer-editor.html`'s repeating-section pattern (its
  method-stages/deliverables editing UX) for how Capabilities' `capability` rows and Our
  Method's `method_stage` rows should be edited alongside their parent `page` row.
- `ui/mockups/g-admin-content/admin-articles-list.html`'s list-screen pattern for the Pages
  list itself.
- T7.2's own block-editor UI (`app/admin/(shell)/articles/block-editor.tsx`) as the closest
  precedent for editing `legal_page.body`'s block array, adapted to `LegalPageBlock`'s
  different kind set.

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies — this task edits existing fields, doesn't
  rename or add without updating the feature doc first).
- Content the firm can change lives in the database, edited via `/admin` (applies — this
  task is the literal mechanism for marketing/legal page copy).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` on any page/route reading live DB content
  (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies).
- The shared generic `page` entity pattern (applies directly — this task is the literal
  editor for it, per CLAUDE.md's own Recurring Patterns section: "The shared generic `page`
  entity... is the home for a marketing page's own copy when it has no other entity to
  attach to").
- Every public page type carries meta_title/meta_description (applies — already true of the
  `page`/`legal_page` entities this task edits; don't regress it).
- The "one nav entry, second screen via inline link" pattern — legal pages and
  `footer_content` are a second panel on the same Pages screen, not a separate nav item, per
  this task's own "Build" line.

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
[ ] memory/decision-log.md updated (if applicable) — including the session-04 addendum's
    required conscious call on last-write-wins/staleness-checking for this task's own
    `page`/`capability`/`method_stage`/`legal_page`/`footer_content` PATCH handlers, decided
    independently of whatever T7.2 chose
[ ] memory/technical-debt.md updated (if applicable) — including resolving/addressing the
    existing "SiteFooter callers still pass hardcoded address/phone props instead of reading
    site_settings" entry's sibling gap for `footer_content` if in scope, or confirming it
    stays correctly sequenced into T7.8
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
