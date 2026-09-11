# Session 47 — Offers Admin

# Date: 2026-09-11

# Tasks completed: T7.4

## What Was Built

`/admin/offers` — a combined screen: a picker over the three core offers (Business Health
Check, Financial Clarity Pack, Funding-Readiness Pack), each rendering the full FR-4.1 field
set with a structured fee band (single-tier offers) or a per-tier fee band plus
featured-tier selector (Business Health Check's two `OfferTier` rows), and the Advisory
Retainer singleton panel always visible below it. All business logic (including the
fee-band-needs-a-scope-cap validation) lives in a new `lib/admin-offers.ts`; two new route
handlers (`PATCH /api/admin/offers/[slug]`, `PATCH /api/admin/advisory-retainer`) parse and
shape only.

## Files Changed

- `lib/admin-offers.ts` — new: `getOfferList`, `getOfferForEdit`, `updateOffer` (tiered vs.
  single-tier branching, fee-band + scope-cap validation, exactly-one-featured-tier check),
  `getAdvisoryRetainerForEdit`, `updateAdvisoryRetainer`.
- `lib/admin-offers.test.ts` — new: 16 tests covering both offer shapes, the scope-cap
  rejection, the featured-tier-count rejection, and the Advisory Retainer.
- `app/admin/(shell)/offers/page.tsx` — new: server component, fetches all three offers +
  retainer.
- `app/admin/(shell)/offers/offers-admin-client.tsx` — new: picker + two-panel client shell.
- `app/admin/(shell)/offers/offer-editor-form.tsx` — new: the full per-offer field set.
- `app/admin/(shell)/offers/offer-tier-editor.tsx` — new: per-tier fields + featured
  `RadioGroup`.
- `app/admin/(shell)/offers/method-stage-list-editor.tsx` — new: add/move/remove
  `{title, description}` list.
- `app/admin/(shell)/offers/faq-list-editor.tsx` — new: add/move/remove
  `{question, answer}` list.
- `app/admin/(shell)/offers/string-list-editor.tsx` — new: flat add/remove string list
  (deliverables).
- `app/admin/(shell)/offers/advisory-retainer-editor.tsx` — new: singleton retainer form.
- `app/api/admin/offers/[slug]/route.ts` — new: `PATCH`, parses/shapes only.
- `app/api/admin/advisory-retainer/route.ts` — new: `PATCH`, parses/shapes only.
- `memory/completed-work.md`, `memory/decision-log.md` — new entries for T7.4.
- `docs/user-guide.md` + its Artifact mirror — updated for Offers admin going live.

## Decisions Made

- Four `Offer` fields (`teaser`, `ctaHref`, `metaTitle`, `metaDescription`) were missing from
  `ui/mockups/g-admin-content/admin-offer-editor.html` beyond the five this task's own
  "Build" line already named as fixed — added to the built editor, not the mockup file.
- `methodStages`/`faqs` are edited as real `{title, description}`/`{question, answer}`
  structured fields with add/move/remove, not the mockup's flat alternating text rows — the
  mockup is a wireframing-tool simplification; the schema requires the structured shape.
- A tiered offer (Business Health Check) hides the parent `Offer` row's own
  deliverables/required-inputs/indicative-timeline/fee-band fields entirely and shows
  `OfferTierListEditor` instead — those top-level fields "go unused" for a tiered offer per
  `core-offer-pages.md`'s own doc-comment, so `updateOffer` never writes them for a tiered
  save.
- `PATCH /api/admin/offers/[slug]`, keyed by slug not id (the feature doc's Interfaces line
  names `[id]`) — matches every other offer consumer in this codebase and T7.3's own
  `PATCH /api/admin/legal/[slug]` precedent.
- The Advisory Retainer's save is gated by the same 10.05-compliance checkbox as the three
  core offers — not explicitly named by this task, but its `description` is real published
  copy on `/capabilities`, so FR-5.4's sign-off gate applies the same way it does everywhere
  else this admin edits promotional copy.
- `clientInputs` is edited as a single textarea (submitted as a one-element array), matching
  the mockup and the schema's own "one-element array" convention — `deliverables` is a real
  multi-item list, `clientInputs` is not.

Full reasoning for all of the above in `memory/decision-log.md`, 2026-09-11 (T7.4, session 47) entry.

## Current State

Milestone 7 (Content Management Admin) has Dashboard (T7.1), Articles/Categories (T7.2),
Pages (T7.3), and Offers (T7.4) live. Landing Pages, Team, Diagnostic Configuration, Site
Settings, Subscribers, and article-resource attachment (T7.10) remain. All quality gates
pass (lint, format:check, typecheck, 216 tests including 16 new). Verified live via
Playwright MCP: a fee update on Funding-Readiness Pack reflected in both the offer page and
the `SiteHeader` nav fee-hint in the same request cycle; an Advisory Retainer fee update
reflected on `/capabilities`; a fee band submitted without a scope cap on Financial Clarity
Pack was rejected by the API with the error surfaced inline; checked at mobile (390px)/tablet
(768px)/desktop (1280px). Every dev-DB test edit was reverted afterward via the admin UI
itself, so the dev database is exactly as it was before this session.

## Blockers

None.

## Next Task

T7.5 — Landing Pages admin
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.5 — Landing Pages admin

## What to build
`POST /api/admin/landing-pages` + an editor screen letting a non-technical partner create a
new `/lp/` instance from the template — headline, opening paragraph, body, CTA — without
vendor involvement (FR-4.3, the literal AC-6 bar for this specific task).

## Input → Output contract
New landing-page form submission → live `landing_page` row → new working `/lp/[slug]` page.

## Acceptance criteria
A partner (tested via a non-technical walkthrough script, not just API-level) creates a
working new landing page end to end with zero code or deploy involved.

## Size / Dependencies
M, depends on: T6.3 (login + session management — this task builds inside the already-secured
`/admin` shell, same as every other Milestone 7 admin screen), T5.1 (the three seeded
`landing_page` rows and the public `/lp/[slug]` template this task's new instances render
through already exist).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component — write the
  landing-page create/list logic as `lib/` functions (a new `lib/admin-landing-pages.ts`,
  mirroring T7.4's `lib/admin-offers.ts` naming), keeping the public-facing read path (`lib/
  landing-pages.ts` if one exists, or `app/lp/[slug]/page.tsx`'s own query) untouched — same
  public-read-side/admin-write-side split every prior Milestone 7 task has established.
- **`LandingPage.downloadFileUrl` (added after this task was originally written — see
  `memory/technical-debt.md` → "Landing Pages admin (T7.5) needs to expose
  `downloadFileUrl`, wired to the R2 media pipeline") must also be exposed as an optional
  file-upload field on this editor** — the "download" version of a landing page's call to
  action (e.g. the Funding-Readiness Checklist). `app/lp/[slug]/page.tsx`'s
  `LandingPageCta` (`components/landing-page-cta.tsx`) already falls back to
  `ctaHref`/`ctaLabel` when it's null, so this field is optional in the editor, not required
  to publish. T7.2 already built the R2 media pipeline this can reuse
  (`components/admin-image-upload-button.tsx`'s `AdminImageUploadButton` + `POST /api/admin/
  media`, backed by `lib/media-storage.ts`'s `encodeImageUpload`) — but that pipeline is
  image-only today; a landing-page download is typically a PDF checklist, not an image.
  Check whether `lib/media-storage.ts` already has (or T7.10, "Article downloadable-resource
  management," has by the time this task is reached) a non-image upload variant before
  building a second one from scratch — if neither exists yet, build the smallest non-image
  variant this field needs (same interim base64-data-URI storage approach `encodeImageUpload`
  already uses, since Cloudflare R2 itself still isn't provisioned — ADR 0004) rather than
  blocking this task on T7.10.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.**
- **Never let a `"use client"` component import a value (not just a type) from a `lib/`
  file that also imports `@/lib/prisma`.**
- **The Section 8.2 footer statement is present in full on every `/lp/` instance** — this is
  a template-level guarantee from the shared footer component, not something this editor
  needs to build or expose as a field; do not add a per-instance footer override.
- **No full site navigation renders on any `/lp/` page** — a template-level rule; this task
  never adds a navigation-toggle field.
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`), matching every
  prior Milestone 7 admin screen's own component choices.
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), desktop.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router, one codebase for the
  public site and `/admin`; this task adds one route handler and one admin route within it.
- ADR 0004 — docs/adr/0004-cloudflare-cdn-proxy.md — Cloudflare R2 is object storage "added
  once media volume justifies it, rather than provisioned on day one" — still not
  provisioned as of this task, which is why `downloadFileUrl` uploads stay on the interim
  base64-data-URI mechanism, not a real R2 call.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives, matching T7.2–T7.4's own component choices.

## Relevant feature specification
- docs/features/landing-page-template.md — the full `landing_page` field set (headline,
  opening_paragraph, body_content, cta_label, cta_href, campaign_reference, meta_title,
  meta_description — `downloadFileUrl` added after this doc was written, see the technical-
  debt entry above), the three seeded instances, and the edge cases (unknown slug → 404,
  footer statement cannot be altered per-instance by construction, no navigation-toggle
  option).
- docs/features/content-management-admin.md — User flow step 6 ("Create a landing page":
  select the template, set the independently-editable headline and opening paragraph, save
  — a new live `/lp/` page exists) and its Interfaces line (`POST /api/admin/landing-
  pages`).

## Mockup / UI reference
No dedicated mockup exists for either screen this task builds — `ui/screen-inventory.md`
maps both to an existing pattern instead: **#32 "Landing pages list"** infers from **#26**
("Articles list"), i.e. `ui/mockups/g-admin-content/admin-articles-list.html`'s
`AdminDataTable` list shape (though only three rows will ever exist here, per this feature's
own "three instances exist at launch" business rule — no pagination needed); **#33 "Landing
page editor / create-from-template"** infers from **#29** ("Page editor"), which itself has
no dedicated mockup either — T7.3 already built `/admin/pages`'s editors purely from
`components/ui/*` primitives (`Field`/`FieldLabel`/`Input`/`Textarea`/`Checkbox`/`Button`) in
the same card-panel shape every Milestone 7 admin screen since has followed; build this
screen's form to match that same established pattern, with the headline/opening-paragraph
fields `landing-page-template.md` names as independently editable.

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies).
- Content the firm can change lives in the database, edited via `/admin` (applies).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies).
- **"A non-technical partner can create a new landing page instance from the template
  without vendor involvement (FR-4.3) — this is the literal acceptance bar tested in AC-6
  alongside the other content-management tasks"** (applies directly — this task's own
  acceptance criterion requires testing via "a non-technical walkthrough script, not just
  API-level").
- Fee amounts as structured min/max band (not applicable — this task has no fee field).
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
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
    task changed nothing firm-visible, note that explicitly rather than skipping silently.
    Double-check any edit made directly to the Artifact is also applied to
    docs/user-guide.md itself in the same session — a real drift between the two was caught
    and fixed at T7.3 (session 46) after happening silently at T7.2.
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.6 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
