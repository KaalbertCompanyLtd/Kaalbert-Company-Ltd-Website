# Session 48 — Landing Pages Admin

# Date: 2026-09-11

# Tasks completed: T7.5

## What Was Built

`/admin/landing-pages` — a create-only screen: a read-only list of existing campaign
instances (`AdminDataTable`-style — headline, `/lp/[slug]` link, campaign reference, last
updated) plus a "New Landing Page" form covering the full template field set (URL slug,
kicker, headline, opening paragraph, an ordered `bodyContent` block editor with all five
block kinds, CTA label/link, an optional PDF download-file upload, campaign reference, meta
tags, and the 10.05-compliance checkbox). Also built the non-image upload mechanism this
task's own addendum required for the download file — a genuinely separate sibling to T7.2's
image-only upload pipeline, not a reuse of it as originally planned in `memory/
technical-debt.md`.

## Files Changed

- `lib/admin-landing-pages.ts` — new: `getLandingPageList`, `createLandingPage`
  (duplicate-slug rejection via `lib/categories.ts`'s `slugify`, per-block-kind body-content
  validation, the 10.05-compliance gate).
- `lib/admin-landing-pages.test.ts` — new: 9 tests.
- `lib/media-storage.ts` — added `encodeDownloadFileUpload` (PDF-only, 5MB cap), sibling to
  the existing `encodeImageUpload`.
- `app/admin/(shell)/landing-pages/page.tsx` — new: the list screen.
- `app/admin/(shell)/landing-pages/landing-page-block-editor.tsx` — new: add/move/remove
  editor for the 5 `LandingPageBodyBlock` kinds.
- `app/admin/(shell)/landing-pages/new/page.tsx` — new: the create screen wrapper.
- `app/admin/(shell)/landing-pages/new/new-landing-page-form.tsx` — new: the create form.
- `components/admin-download-upload-button.tsx` — new: PDF upload button, sibling to
  `AdminImageUploadButton`.
- `app/api/admin/landing-pages/route.ts` — new: `POST`, parses/shapes only.
- `app/api/admin/media/downloads/route.ts` — new: `POST`, parses/shapes only.
- `memory/completed-work.md`, `memory/decision-log.md` — new T7.5 entries.
- `memory/technical-debt.md` — resolved the "Landing Pages admin (T7.5) needs to expose
  `downloadFileUrl`" entry in place; updated the "Article/author image uploads use an
  interim base64 data-URI store" entry to note there are now two functions to swap when R2
  arrives, not one.
- `docs/user-guide.md` + its Artifact mirror — updated for Landing Pages admin going live.

## Decisions Made

- Create-only, no edit/delete — `landing-page-template.md`'s own Interfaces line names
  `POST /api/admin/landing-pages` alone; editing or retiring an already-live campaign page
  is out of this task's scope.
- The URL slug is a real, partner-typed field (normalized via `slugify()`, duplicate
  rejected inline), not auto-derived from the headline the way `Article.slug` is — a
  campaign URL is deliberately chosen to match ad/print/QR copy, closer to `Category.slug`'s
  own precedent than to an article's incidental permalink.
- `downloadFileUrl`'s upload does **not** reuse `AdminImageUploadButton`/`encodeImageUpload`
  as `memory/technical-debt.md` originally planned — that mechanism is hard-coded image-only,
  and a checklist is realistically a PDF. Built `encodeDownloadFileUpload` + `POST /api/
admin/media/downloads` + `AdminDownloadUploadButton` instead — same interim base64
  mechanism, same real-R2 swap-in shape, just a second function to swap later.
- `bodyContent` blocks are validated per-kind server-side (non-blank text, non-empty item
  arrays with required subfields) via a new `LandingPageBlockEditor` (5 kinds), deliberately
  duplicating `LegalBlockEditor`'s add/move/remove mechanics in miniature rather than
  generalizing either existing block editor.
- A brand-new landing page is always created with `isPlaceholder: false` — unlike the three
  seeded, mockup-derived instances, a page a partner builds through this form is real
  content they wrote and signed off via the required 10.05-compliance checkbox.
- Fixed a real gap from the previous session (T7.4): three already-committed files
  (`memory/decision-log.md`, `docs/user-guide.md`, the T7.4 session summary) had been
  hand-edited after that session's last `npm run format` run and committed without a final
  format pass. Fixed as its own `chore(T07-04)` commit before starting this task's work —
  lesson: run `format`/`format:check` as the literal last step before every commit, after
  all file edits including memory/docs/session-summary files.

Full reasoning for all of the above in `memory/decision-log.md`, 2026-09-11 (T7.5, session 48) entry.

## Current State

Milestone 7 (Content Management Admin) has Dashboard (T7.1), Articles/Categories (T7.2),
Pages (T7.3), Offers (T7.4), and Landing Pages (T7.5, create-only) live. Team, Diagnostic
Configuration, Site Settings, Subscribers, and article-resource attachment (T7.10) remain.
All quality gates pass (lint, format:check, typecheck, 225 tests — 9 new). Verified live via
Playwright MCP: created a real test landing page end to end covering all five body-block
kinds and a real PDF download upload (verified via a direct authenticated `fetch`/
`FormData` call, since the native OS file-chooser dialog didn't cooperate with headless
Playwright automation for the upload button's click interaction); confirmed `/lp/[slug]`
rendered it correctly including a real `checklist_downloaded`-firing download link when a
file was attached; confirmed the duplicate-slug and missing-compliance-checkbox rejections
both return inline 400s; confirmed a non-PDF upload to the new download endpoint is rejected;
checked mobile (390px)/tablet (768px)/desktop (1280px). Both test rows deleted afterward via
a direct Prisma query (no delete UI exists in this create-only scope) — dev DB back to
exactly 3 real rows.

## Blockers

None.

## Next Task

T7.6 — Team / author profile editor
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.6 — Team / author profile editor

## What to build
Self-service (and right-role-gated other-partner) editor for the `author` record — photo
(via the same R2 media pipeline as article preview images, ADR 0004), title (the partner's
rank — "Lead Partner"/"Partner", a free-text field defaulting to "Partner" for a newly
onboarded partner), practice area, credentials (stored verbatim, never altered/abbreviated),
personal statement, bio, order.

## Input → Output contract
Profile form submission → `author` row; `published` stays false until name/practice area/
personal statement are set — photo and credentials are NOT publish-gating (revised at T2.5
per explicit firm direction, session 11, 2026-09-05; see `memory/decision-log.md` and
`docs/features/about-and-partners-page.md`'s edge cases).

## Acceptance criteria
A profile missing name/practice area/personal statement never appears on `/about` or as an
article byline — omitted entirely, not shown half-filled. A profile with no photo yet DOES
appear, rendered with an initials avatar (`app/about/page.tsx`'s `PartnerAvatar`); uploading
a photo later simply replaces the initials on save, no separate publish step.

## Size / Dependencies
M, depends on: T6.3 (login + session management — this task builds inside the already-
secured `/admin` shell, same as every other Milestone 7 admin screen), T2.5 (the `author`
model's own `title`/`order` fields and the `/about` page's rendering of them already exist),
T4.3 (`author` is also read as the article byline — `PartnerAvatar`'s initials-fallback
pattern this task's own acceptance criterion cites already exists there too).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component — write the author
  read/update logic as `lib/admin-authors.ts` (mirroring T7.4/T7.5's `lib/admin-*.ts`
  naming), keeping the public-facing read path (wherever `/about` and article bylines
  currently query `author` — check `lib/` for an existing `getAuthors`/similar before adding
  a new one) untouched.
- **Reuse `components/admin-image-upload-button.tsx` (`AdminImageUploadButton`) and `POST
  /api/admin/media` directly for the photo field — do not build a second image-upload
  mechanism.** Confirmed still current as of T7.5 (session 48): that pipeline remains
  image-only and correct for a real photograph, unlike T7.5's own download-file field, which
  needed a genuinely separate PDF-only sibling (`encodeDownloadFileUpload`) — a photo is a
  real image, so the original image pipeline applies here without modification.
- **Check whether Cloudflare R2 credentials exist yet** (`CLAUDE.local.md`'s Credentials
  section) before building this task's photo field. If they do, this is the natural point to
  swap `lib/media-storage.ts`'s `encodeImageUpload` (and, since T7.5, also
  `encodeDownloadFileUpload`) to a real R2 upload call — every caller already treats the
  return value as an opaque URL, so nothing else changes. If R2 still isn't provisioned,
  build this task's photo field against the interim base64 mechanism exactly as T7.2 did,
  and leave `memory/technical-debt.md` → "Article/author image uploads use an interim base64
  data-URI store, not real Cloudflare R2" open.
- **Wire `Author.adminUserId` to a real Prisma relation against `AdminUser`** — currently a
  schema-only placeholder `Int?` with nothing populating or reading it
  (`memory/technical-debt.md` → "`Author.adminUserId` is still a schema-only placeholder FK,
  not a real Prisma relation"). This task's own "self-service" requirement (a logged-in
  partner edits their own entry) needs it to resolve the authenticated session's
  `admin_user.id` to the right `author` row.
- **`published` is never a directly-editable checkbox** — it's computed/enforced from
  whether name/practice area/personal statement are all non-blank (this task's own
  Input → Output contract), the same "save is the publish moment, gated by required fields"
  pattern already used elsewhere in this admin, not a separate toggle a partner could
  mistakenly leave off with everything else complete or on with something missing.
- **`credentials` is stored exactly as supplied, never altered or abbreviated** — no
  normalization, casing, or formatting logic in `lib/admin-authors.ts`; a blank value stays
  null, never a placeholder invented designation (`about-and-partners-page.md`'s business
  rule and edge case).
- Three real addenda from `docs/tasks/07-content-admin.md`'s own T7.6 entry, all real, scoped
  gaps discovered in prior sessions — read them in full before starting:
  - **Session 42 addendum**: this task's own screen is also the intended home for three
    already-built-but-unwired admin actions on the underlying **login** identity
    (`admin_user`), distinct from the public-facing `author` record this task's main build
    covers — deactivate/reactivate an account (`lib/auth/session.ts`'s
    `deactivateAdminUser(adminUserId)`), reset an existing partner's 2FA enrolment
    (`lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)`), reset an existing partner's
    password (`lib/auth/password-reset.ts`'s `issuePasswordResetToken(adminUserId,
    {baseUrl})`) — all three already exist and are tested; this task just needs buttons that
    call them for an *existing* account and display the resulting link/effect. See
    `memory/technical-debt.md` → "No admin-facing way to deactivate/reactivate an account,
    reset an existing partner's 2FA enrolment, or reset an existing partner's password" for
    the full reasoning.
  - **Session 37 addendum**: the `Author.adminUserId` relation wiring above.
  - **Session 11 addendum**: all 5 seeded partners publish with `photoUrl: null` (no
    partner photography exists yet) and three have no `credentials` value seeded.
    **Trigger type: User-triggered.** Do not treat reaching this task as a cue to source or
    generate partner photos — wait for the firm to say real photography is ready, then use
    this task's own editor (or a direct seed/DB update, whichever is faster at the time) to
    upload each partner's real photo. Confirm with the firm before assuming the missing
    `credentials` values are a gap — real designations may not exist for those roles at all.
  - **Session 45 addendum**: confirms the R2/upload-pipeline reuse point above — already
    incorporated into this prompt's own architecture constraints.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.**
- **Never let a `"use client"` component import a value (not just a type) from a `lib/`
  file that also imports `@/lib/prisma`.**
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`), matching every
  prior Milestone 7 admin screen's own component choices.
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), desktop.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router, one codebase for the
  public site and `/admin`; this task adds an admin route and its API route within it.
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — Cloudflare R2 object storage, "added
  once media volume justifies it" — still not provisioned as of T7.5 (check again at this
  task per the architecture constraint above); the photo field stays on the interim base64
  mechanism until it is.
- ADR 0007 — docs/adr/0007-totp-two-factor-auth.md — TOTP two-factor is required for every
  admin account; this task's session-42-addendum actions (2FA reset, password reset,
  deactivate) all operate on that same `admin_user`/TOTP system, via already-built,
  already-tested functions this task only needs to surface a button for.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives, matching every prior Milestone 7 admin screen's own component choices.

## Relevant feature specification
- docs/features/about-and-partners-page.md — the full `author` field set, the "no
  milestones/history timeline" business rule (not relevant to this admin task directly, but
  context for what this content feeds), the photo-optional/credentials-optional edge cases
  this task's own acceptance criterion is built around, and the exact-designation rule for
  `credentials`.
- docs/features/content-management-admin.md — User flow step 7 ("Maintain a profile": a
  partner opens their own entry under Team and edits photo/title/practice area/credentials/
  personal statement; a partner with the right role may edit another partner's entry, but
  the normal path is self-service) and its business rule on `published` gating.
- docs/features/admin-authentication.md — the account-recovery edge case ("account recovery
  requires another administrator to reset 2FA enrolment") that the session-42 addendum's
  three actions operationalize into a real UI for the first time.

## Mockup / UI reference
No dedicated mockup exists for either screen — `ui/screen-inventory.md` maps both to
existing patterns: **#33a "Team list"** infers from **#26** ("Articles list"), i.e.
`ui/mockups/g-admin-content/admin-articles-list.html`'s `AdminDataTable` list shape (5 rows,
no pagination needed, matching T7.5's own "only a handful of rows" precedent); **#33b
"Partner profile editor"** infers from "#29's simple-field form pattern + #27's
required-image-upload control — no new visual pattern, just that combination" — #29 (Page
editor) itself has no dedicated mockup either (T7.3 built it purely from
`components/ui/*` primitives), and #27 (Article editor)'s own required-preview-image control
is `AdminImageUploadButton` as already used at T7.2 — build this screen's photo field to
match that same established upload-button pattern, and the rest of the form to match every
other Milestone 7 admin editor's own card-panel shape.

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies).
- Content the firm can change lives in the database, edited via `/admin` (applies).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies).
- **"Professional designations are rendered exactly as the awarding body permits... the
  admin does not alter or abbreviate a credential string a partner supplies"** (applies
  directly — the literal rule this task's `credentials` field must honor).
- Fee amounts as structured min/max band (not applicable — no fee field on `author`).
- **"Every scheduled/background job is its own small Railway service..."** (not applicable —
  no background job here).

## Task Completion Checklist
[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
    files (npm run lint && npm run format:check) — this is a hard gate; a pre-push hook / CI
    runs it, so a skipped lint fails the push. Fix pre-existing lint failures too, so the
    branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed (this task
    likely does change it — wiring `Author.adminUserId` to a real relation)
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable) — at minimum, this task's own three
    addenda (session 42, 37, 11) each need their referenced debt entries checked and closed
    out or explicitly left open with reasoning, per the Trigger-type rules in CLAUDE.md
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
    task changed nothing firm-visible, note that explicitly rather than skipping silently.
    Double-check any edit made directly to the Artifact is also applied to
    docs/user-guide.md itself in the same session — a real drift between the two was caught
    and fixed at T7.3 (session 46) after happening silently at T7.2, and a related
    format-drift gap (edits made after the last `npm run format` run, never reformatted
    before commit) was caught and fixed at the start of T7.5 (session 48) — run
    `npm run format` as the literal last step before committing, after every file edit
    including memory/docs/session-summary files.
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.7 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
