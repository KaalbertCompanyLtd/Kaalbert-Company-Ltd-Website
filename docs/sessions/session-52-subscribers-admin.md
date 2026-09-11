# Session 52 — Subscribers admin

# Date: 2026-09-11

# Tasks completed: T7.9

## What Was Built

Built `/admin/subscribers` — an `AdminDataTable`-pattern screen (following the Articles
list's established list/filter/pagination shape) listing every `subscriber` row, subscribed
and unsubscribed alike, with search-by-email and a Subscribed/Unsubscribed status filter.
Two actions: **Export**, generating a CSV client-side from the currently filtered array
(pre-pagination) so it always matches what's on screen; and **Remove**, gated behind an
`AlertDialog` confirmation, which reuses `lib/insights-subscription.ts`'s existing
`unsubscribeFromInsights(token)` — the row's own `unsubscribeToken` is looked up first, then
the same function a visitor's one-click email link already calls is invoked, satisfying this
task's "identical effect... not a second code path" acceptance criterion by construction. A
removed row stays visible with its status flipped to Unsubscribed (never a hard delete, per
`insights-engine.md`'s own rule).

**Follow-up (same session, after user feedback):** "Export only producing only part of the
required is not acceptable." Investigated empirically rather than guessing — seeded 16
subscribers spanning two table pages and mixed statuses, verified live via Playwright that
row-completeness was already correct (unfiltered export = all 16 rows across both pages;
Subscribed-only filter = exactly the 12 matching rows). The real gap was column-completeness:
`insights-engine.md` names five `subscriber` fields (id, email, subscribed_at, consent,
unsubscribed_at) and the CSV only had four — `id` was missing. Added it as the export's first
column. Re-verified live with the same two export scenarios; cleaned up all seeded test data
afterward.

## Files Changed

- `lib/admin-subscribers.ts` (new) — `getSubscriberList`/`removeSubscriber`.
- `lib/admin-subscribers.test.ts` (new) — 3 tests.
- `app/admin/(shell)/subscribers/page.tsx` (new), `subscribers-list-client.tsx` (new).
- `app/api/admin/subscribers/[id]/route.ts` (new) — `DELETE`.
- `components/admin-sidebar-nav.tsx` — added the "Subscribers" nav entry under Operations
  (this entry didn't already exist, unlike T7.8's Site Settings link, which had been added
  pre-emptively at an earlier session).
- `memory/completed-work.md` — new T7.9 entry.
- `docs/user-guide.md` — new "Managing Subscribers" section; fixed the top "As of" summary
  line, which T7.8's own session (51) had left stale (still said "session 50," didn't
  mention Site Settings — caught and corrected in the same pass as this task's own update);
  updated "What's coming next" and the change log.
- Artifact mirror (`https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc`)
  republished to Version 12 with the same changes.
- `app/admin/(shell)/subscribers/subscribers-list-client.tsx` (follow-up) — `downloadCsv` now
  includes an `ID` column.
- `memory/completed-work.md` (follow-up) — new "T7.9 follow-up" entry.

## Decisions Made

- No server-side export endpoint was built — the acceptance criterion is that export must
  match the on-screen filtered set exactly, every row is already loaded in the browser (no
  export interface is named in `content-management-admin.md`'s or `insights-engine.md`'s own
  Interfaces lists), and a second query risks drifting from what's actually on screen. A
  client-side CSV built directly from the same filtered array the table renders guarantees
  the two can never disagree.
- Live-verification via Playwright surfaced a real staleness bug: the "N subscribed, N
  unsubscribed" summary line was originally server-rendered as a static prop, so it didn't
  update after an in-place Remove action (no navigation occurs). Fixed by computing the count
  from the client component's own `rows` state instead — caught and fixed in the same
  session rather than filed as debt, since it was small and directly touched this task's own
  UI correctness.
- Deliberately did not touch anything related to actually sending mail to this list (Brevo
  campaign composition/sending, ADR 0012, `docs/features/subscriber-outreach.md`, P2-8) —
  stays Phase 2, gated, per this task's own architecture constraint.

## Current State

Milestone 7 (Content Management Admin) now has Dashboard, Articles/Categories, Pages,
Offers, Landing Pages, Team, Diagnostic Configuration, Site Settings, and Subscribers all
live. Only article-resource attachment (T7.10) and its follow-on T7.11 remain before the
epic is fully shipped.

## Blockers

None.

## Next Task

T7.10 — Article downloadable-resource management
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.10 — Article downloadable-resource management

## What to build
A resource-management panel on the article editor (T7.2): list an article's existing
`article_resource` rows (label, file), attach a new one, reorder (`sortOrder`), remove.

**Correction to the epic file's own "Build" line, found while assembling this prompt:** that
line says to reuse `components/admin-image-upload-button.tsx`'s upload pattern "generalized
to accept non-image files," implying a new non-image upload mechanism needs to be built. It
doesn't — T7.5 (Landing Pages admin, built after this epic file's T7.10 entry was originally
written) already built exactly that: `components/admin-download-upload-button.tsx`
(`AdminDownloadUploadButton`) posting to `POST /api/admin/media/downloads`
(`app/api/admin/media/downloads/route.ts`), which calls `lib/media-storage.ts`'s
`encodeDownloadFileUpload` (PDF-only, 5MB cap, same interim base64-data-URI storage as
`encodeImageUpload`). Reuse that component/route/function directly for this task's file
upload — do not build a second one.

## Input → Output contract
Resource form submission (label + file) → `article_resource` row; reorder → updated
`sortOrder` values; remove → row deleted.

## Acceptance criteria
A resource attached here appears correctly on the public article page's download list
(`app/insights/[slug]/page.tsx`'s `ResourceLink`, ordered by `sortOrder` ascending — see
`lib/insights.ts`'s `getArticleBySlug`, which already includes `resources: {orderBy:
{sortOrder: "asc"}}`) in the same order set in the admin; removing a resource here removes
its download link from the public page on the same request cycle.

## Size / Dependencies
S, depends on: T7.2 (the article editor screen this task adds a panel to —
`app/admin/(shell)/articles/article-editor-form.tsx`, `app/admin/(shell)/articles/[id]/
page.tsx`/`new/page.tsx` — and the `AdminImageUploadButton`/media-upload pattern this task's
own upload reuses via its T7.5-built sibling, see the correction above).

## Architecture constraints
- Business logic lives in `lib/` (a new `lib/admin-article-resources.ts`), never inside the
  route handler or a React component beyond calling into `lib/` and rendering the result.
  `lib/articles.ts`'s existing `getArticleForEdit`/`updateArticle` do not currently touch
  `article_resource` at all — confirm this before assuming any existing function needs only
  a small extension; this is very likely new, standalone functions (get resources for an
  article, add one, reorder, remove one).
- Reuse `components/admin-download-upload-button.tsx`/`POST /api/admin/media/downloads`/
  `lib/media-storage.ts#encodeDownloadFileUpload` for the file upload — see the correction
  under "What to build" above. Do not build a second non-image upload mechanism.
- `ArticleResource.fileUrl` is non-nullable (`prisma/schema.prisma`'s own doc-comment: "a
  resource row only ever exists once a real file has been attached") — a resource is only
  ever created with a file already uploaded, never as a draft row with no file, unlike
  `Article.previewImage`.
- `ArticleResource` has a `@@unique([articleId, sortOrder])` constraint — reordering must
  update every affected row's `sortOrder` together (e.g. in a `$transaction`, the same
  pattern `lib/admin-diagnostic.ts`'s question-reorder logic or `lib/admin-pages.ts`'s
  transactional saves already use elsewhere in this codebase) so no intermediate state ever
  violates the constraint.
- This task is also this project's chance to close a related, already-flagged technical-debt
  item: `memory/technical-debt.md` → "Article download-resource availability is checked via
  a live per-request HEAD fetch, not a real object-storage capability" — its own
  `Sequenced into` field already points here. Read that entry in full before deciding whether
  to act on it this session; its own text says the real fix (R2-backed existence checking)
  still needs Cloudflare R2 actually provisioned first (`CLAUDE.local.md`'s Credentials
  section — check whether `CLOUDFLARE_R2_*` is filled in yet). If R2 still isn't provisioned,
  this task does not need to fix that HEAD-check mechanism — just don't let a resource
  attached with a broken/inaccessible URL silently pass the admin's own validation without
  at least the same graceful-failure treatment `insights-engine.md`'s edge case already
  requires on the public side.
- Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"` — the article editor page already does this from T7.2; no change needed
  there unless this task adds a new route that doesn't yet have it.
- Never let a `"use client"` component import a value (not just a type) from a `lib/` file
  that also imports `@/lib/prisma` — check before adding any shared import to the resource
  panel's client component (it will need `article_resource` row shapes; import those as
  `import type`, never a runtime value, from whatever `lib/` file defines them).

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — this resource-management panel
  is hand-built application code the team owns, never a third-party file-manager product.
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — "Cloudflare R2 is added as object
  storage for media once volume justifies a dedicated store, rather than provisioned on day
  one" — this task's upload still goes through the same interim base64-data-URI mechanism
  (`encodeDownloadFileUpload`) every other media upload in this codebase uses until R2 is
  actually provisioned; do not build against R2 speculatively.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first, no
  tailwind.config.js) + shadcn/ui generated on Base UI + Lucide icons; follow the same
  block-editor-style add/reorder(▲▼)/remove row pattern T7.2's own `block-editor.tsx` and
  T7.3's `legal-block-editor.tsx` already established for exactly this "ordered list of
  small editable items on one screen" shape.

## Relevant feature specification
docs/features/insights-engine.md — read in full; `article_resource`'s field list ("id,
article_id, file reference (downloadable attachment)") is under "Data requirements", and this
task's own graceful-failure edge case ("A downloadable resource file is removed after an
article referencing it is already published: the article's download link must fail
gracefully with a clear message, not a broken link with no explanation") is under "Edge
cases" — this is about a file disappearing from wherever it's hosted after being attached,
not about the admin's own remove action (which is a normal, immediate, successful delete of
the row).

## Mockup / UI reference
`ui/mockups/g-admin-content/admin-article-editor.html` — the same mockup T7.2 already built
to; that file's own toolbar shows an "Attach file" (📎) button alongside the image button,
which T7.2 deliberately left unbuilt (see `memory/technical-debt.md`'s "Article
downloadable-resource attachment... is not built" entry) — this task is what finishes that
mockup's own toolbar. No separate resource-panel mockup exists beyond what that file already
shows; infer the exact list-row layout (label, file link, reorder/remove controls) from the
same block-editor pattern named under "Relevant ADRs" above.

## Coding standards
- The mockups are authoritative — applies; `admin-article-editor.html`'s own "Attach file"
  affordance is the literal target here (applies).
- Responsive from first implementation (mobile ~375–430px, tablet ~768px, desktop
  ~1200px+) (applies).
- Feature docs are the data/interface contract — `insights-engine.md`'s `article_resource`
  field list and graceful-failure edge case are not optional (applies).
- Business logic lives in `lib/`, never in the route handler or component (applies).
- Every entity field named in the feature doc maps to a same-named Prisma field — confirm
  `ArticleResource`'s existing schema (`id`, `articleId`, `label`, `fileUrl`, `sortOrder`)
  already covers everything this task's form needs before assuming a schema change (applies).
- Fee amounts as structured min/max — not applicable, no fee content on this screen (not
  applicable).
- Content the firm can change lives in the database, edited via `/admin` — this task's
  entire point for `article_resource` specifically (applies).
- Diagnostic scoring configuration is data, not logic — not applicable, this task is
  Articles, not diagnostic (not applicable).
- Accessibility (WCAG 2.1 AA) via Base UI primitives — applies to every control in the new
  resource panel (upload button, reorder buttons, remove action, any confirmation dialog)
  (applies).
- `export const dynamic = "force-dynamic"` — already set on the article editor page from
  T7.2; verify it's still present, no new page route needed unless this task adds one
  (applies, verify only).
- Never a `"use client"` component importing a value from a `@/lib/prisma`-importing `lib/`
  file — check before adding any shared import to the resource panel's client component
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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.11 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
