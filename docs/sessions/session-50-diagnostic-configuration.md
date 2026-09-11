# Session 50 — Diagnostic Configuration admin + user-guide rewrite

# Date: 2026-09-11

# Tasks completed: T07-07

## What Was Built

Built the Diagnostic Configuration admin (Questions list/create/edit + Configuration screen
for weights/thresholds/score bands), closing two real scope gaps found while building it: a
hard-coded `${dimensionId}-${order}` choice-options map that would have silently gone stale
the moment a partner reordered/added a `choice` question (added a real `choiceOptions`
schema column and moved resolution server-side), and seeded dimension weights that never
literally summed to 100 (blocking the new screen's own Save gate). Also rewrote
`docs/user-guide.md` and its Artifact mirror from feature summaries into step-by-step
walkthroughs, per mid-session user feedback that the guide said capabilities existed without
ever saying how to use them.

## Files Changed

- `prisma/schema.prisma` — added `DiagnosticQuestion.choiceOptions`/`isPlaceholder` columns.
- `prisma/migrations/20260911123727_add_diagnostic_question_choice_options_and_placeholder/`
  — new migration.
- `prisma/seed.ts` — real `choiceOptions` per choice question; dimension weights 1→20 each.
- `lib/diagnostic-flow-options.ts` — rewritten: Prisma-free scale/boolean constants + shared
  types only, hard-coded choice-options map removed.
- `lib/diagnostic-flow.ts` — resolves `choiceOptions` server-side now.
- `components/diagnostic-flow.tsx` — `optionsFor` reads `question.choiceOptions` directly.
- `lib/admin-diagnostic.ts` — new, the business-logic layer (questions CRUD/reorder/
  active-toggle, dimension weights/thresholds, score bands).
- `lib/admin-diagnostic.test.ts` — new, 33 tests.
- `components/admin-sidebar-nav.tsx` — "Diagnostic Configuration" now links to
  `/admin/diagnostic-questions`.
- `app/admin/(shell)/diagnostic-questions/page.tsx`, `questions-list-client.tsx`,
  `question-editor-form.tsx`, `new/page.tsx`, `[id]/page.tsx` — Questions list/create/edit.
- `app/admin/(shell)/diagnostic-configuration/page.tsx`, `configuration-client.tsx` —
  weights/thresholds/score-bands screen.
- `app/api/admin/diagnostic-questions/route.ts`, `[id]/route.ts`, `[id]/move/route.ts`,
  `[id]/active/route.ts`, `app/api/admin/diagnostic-configuration/route.ts`,
  `app/api/admin/diagnostic-score-bands/route.ts` — new API routes.
- `docs/user-guide.md` — rewritten (every admin section is now a numbered walkthrough) +
  new Diagnostic Configuration section; Artifact mirror republished.
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — this
  task's entry, the two scope-decision entries, and the `is_placeholder` debt entry resolved.
- `CLAUDE.md` — tightened the Firm-Facing Documentation rule to require numbered walkthroughs.

## Decisions Made

- Expanded scope beyond the literal `/task T7.7` prompt to add `choiceOptions` as a real
  schema column — justified by ADR 0005 (data-driven diagnostic engine) and the same
  "uncaught error reaching a visitor" failure class this epic already guards against for the
  zero-active-questions case. See `memory/decision-log.md`.
- Reseeded dimension weights from 1-each to 20-each so the new screen's "must total 100%"
  save gate isn't permanently disabled on real data — scoring output is identical either way
  (`diagnostic-scoring.ts` normalizes by total weight). See `memory/decision-log.md`.
- Rewrote `docs/user-guide.md`'s whole admin-facing format to numbered walkthroughs per
  explicit user feedback mid-session; codified as a standing rule in CLAUDE.md so every
  future task's documentation update follows the same bar. See `memory/decision-log.md`.

## Current State

T7.7 fully complete, tested (33 new unit tests, full 276-test suite green), verified live via
Playwright MCP (reordering with reload-persistence, the last-active-question deactivate
guard, end-to-end question creation/edit/delete, configuration save round-trips, score-band
save, a full public `/diagnostic` regression pass, and mobile/tablet checks — which caught
and fixed a real table-overlap bug before being called done). `docs/user-guide.md` and its
Artifact are both current through T7.7. Ready for T7.8.

## Blockers

None.

## Next Task

T7.8 — Site Settings (singleton)
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.8 — Site Settings (singleton)

## What to build
Single settings form — phone_primary/secondary, email, whatsapp_number, address,
response_time_commitment, social_profile_urls — read live by SiteFooter, `/contact`, every
`WhatsAppLinkButton`, and the SEO Organization schema's `sameAs`.

## Input → Output contract
Settings form submission → the one `site_settings` row updated.

## Acceptance criteria
Changing the phone number here updates the footer, `/contact`, and every WhatsApp button in
one save, verified across at least two different pages in browser; a blank required field
causes the corresponding display to be omitted site-wide rather than rendering broken.

## Size / Dependencies
S, depends on: T6.3 (admin auth/session gate every `/admin` route requires), T2.6 (the real
`site_settings` row and its existing `/contact` wiring this task extends), T2.8 (the SEO
Organization schema's `sameAs` field, sourced from `social_profile_urls`).

## Architecture constraints
- Business logic lives in `lib/` (a new `lib/admin-site-settings.ts`), never inside the
  route handler or a React component beyond calling into `lib/` and rendering the result.
- Content the firm can change (contact details, response-time commitment) is never
  hard-coded — it lives in the database, edited via `/admin` (this is the literal task).
- Every entity field named in `docs/features/content-management-admin.md`'s Data
  requirements section maps to a Prisma schema field of the same name.
- **Never let a `"use client"` component import a value (not just a type) from a `lib/`
  file that also imports `@/lib/prisma`** — put any client-safe option/lookup data this
  form's client component needs in a separate, Prisma-free file if one turns out to be
  needed (unlikely for a flat settings form, but check before importing anything from a
  `lib/` file into the client component).
- Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.
- A save here must update every one of the current hardcoded/partial `SiteFooter` call
  sites (see Addendum below) in the same task, not just the `site_settings` row itself —
  otherwise the acceptance criterion ("updates the footer... in one save") is unmet.

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — this settings form is
  hand-built application code the team owns, never a third-party settings/CMS product.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 (CSS-first,
  no tailwind.config.js) + shadcn/ui generated on Base UI + Lucide icons; use the same
  `Field`/`FieldLabel`/`Input`/`Textarea`/`Button` primitives every other admin form in
  this codebase already uses (see `app/admin/(shell)/pages/capabilities/capabilities-
  editor-form.tsx` for the closest existing pattern — a flat singleton settings form with
  no repeating sections).

## Relevant feature specification
docs/features/content-management-admin.md — read in full; the exact field list is under
"Data requirements" ("`site_settings` — a singleton record: phone_primary, phone_secondary
(nullable), email, whatsapp_number, address, response_time_commitment,
social_profile_urls (list, nullable)"), and this task's two edge cases are under "Edge
cases" ("A required `site_settings` field is left blank... the corresponding display is
omitted from the public site rather than rendering broken").

## Mockup / UI reference
No dedicated mockup — `ui/screen-inventory.md`'s own explicit mapping for entry #33e (Site
Settings) says to infer from #29's pattern ("simple-field form, singleton, no list view
needed"), which is the already-built Capabilities/Our Method page-editor screens
(`app/admin/(shell)/pages/capabilities/capabilities-editor-form.tsx`,
`app/admin/(shell)/pages/our-method/our-method-editor-form.tsx`) — a flat `Field`-per-row
form inside a single `bg-card` panel with one Save button at the bottom. This screen has no
10.05-compliance checkbox (that gate is for marketing-claim content; contact details aren't
a claim) — Save is enabled unconditionally, matching the Legal Pages editor's precedent
(no compliance checkbox there either) rather than Capabilities/Offers' precedent.

## Coding standards
- The mockups are authoritative — not applicable here (no dedicated mockup); infer from
  the named built screen instead, per above (applies).
- Responsive from first implementation (mobile ~375–430px, tablet ~768px, desktop
  ~1200px+) — even though the inferred pattern is desktop-only in its own screenshots
  (applies).
- Feature docs are the data/interface contract — `content-management-admin.md`'s field
  list and edge cases above are not optional (applies).
- Business logic lives in `lib/`, never in the route handler or component (applies).
- Every entity field named in the feature doc maps to a same-named Prisma field — confirm
  `SiteSettings`'s existing schema (from T2.6) already has `socialProfileUrls` in the right
  shape (a string array or JSON list) before assuming a schema change is needed (applies).
- Fee amounts as structured min/max — not applicable, no fee content on this screen (not
  applicable).
- Content the firm can change lives in the database, edited via `/admin` — this task's
  entire point (applies).
- Diagnostic scoring configuration is data, not logic — not applicable, this task is
  Site Settings, not diagnostic (not applicable).
- Accessibility (WCAG 2.1 AA) via Base UI primitives — applies to every form control on
  this screen (applies).
- `export const dynamic = "force-dynamic"` on the page — applies (reads live
  `site_settings`).
- Never a `"use client"` component importing a value from a `@/lib/prisma`-importing
  `lib/` file — check before adding any shared import to the client form component
  (applies, verify).
- Never a `package.json` lifecycle script assuming `.git` exists — not applicable, no
  lifecycle-script change in this task (not applicable).

## Recurring Patterns
- Content the firm can edit lives in the database, read live by every surface that
  displays it, edited once in `/admin` — this is precisely what this task fixes for
  `SiteSettings`/`FooterContent`: today `SiteFooter`'s callers still pass hardcoded
  address/phone props (see Addendum below) instead of reading the real singleton rows
  this task's own form edits (applies — this is the task's core acceptance bar).
- "One nav entry, second screen via inline link" — not applicable, Site Settings is a
  single flat screen with no subordinate second screen (not applicable).
- The shared generic `page` entity — not applicable, `site_settings`/`footer_content` are
  their own singleton models, not the generic `page` entity (not applicable).
- Every public page type carries meta_title/meta_description + OG/JSON-LD — not
  applicable, `site_settings` has no page-level SEO fields of its own; note that
  `social_profile_urls` feeds the *site-wide* Organization schema's `sameAs` (T2.8),
  which is a related but distinct concern from a single page's meta tags (partially
  applicable — verify the `sameAs` wiring works once this form can change the value).
- Every conversion moment fires through the GTM dataLayer — not applicable, no new
  conversion moment here (not applicable).
- Every scheduled/background job is its own Railway service — not applicable (not
  applicable).

## Addenda from docs/tasks/07-content-admin.md (read in full before starting)
- **Session 12, 2026-09-05:** Two `memory/technical-debt.md` items land here: (1)
  `SiteFooter`'s callers still pass hardcoded address/phone props instead of reading
  `site_settings` — T2.6 wired `/contact` to the real row, but every page's `SiteFooter`
  call (there is currently only one real call site, `components/site-footer.tsx`'s own
  `SiteFooterProps`, but confirm every page that renders it) still passes literal
  strings; switch every caller to read `getSiteSettings()` (or thread it as a prop) as
  part of this task. (2) `site_settings.response_time_commitment` has no real value yet —
  **Trigger type: User-triggered** — do not fabricate a response-time commitment or treat
  reaching this task as a cue to invent one; only set it via this task's own form once the
  firm has actually stated a real, keepable number.
- **Session 13, 2026-09-05:** A third debt item lands here too: `footer_content
  .scope_of_practice_statement`/`company_registration_details` materialized (T2.7, and
  editable since T7.3's Legal Pages & Footer screen) but not wired into `SiteFooter`/
  `ScopeOfPracticeNote` — same fix shape as item (1) above, in the same pass: switch every
  `SiteFooter` call site to also read `getFooterContent()` (`lib/legal.ts` already has
  this resolver, built at T7.3) and pass `scopeOfPracticeStatement`/
  `companyRegistrationDetails` through, rendering the registration-details line only when
  non-null.

Before writing any code, run `grep -rn "SiteFooter(" app/ components/` and
`grep -rn "<SiteFooter" app/` to find every real call site (there may be more than the one
found during T7.8's own prompt-generation pass) — the acceptance criterion requires the fix
to reach all of them, not just one.

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
task changed nothing firm-visible, note that explicitly rather than skipping silently.
Write the update as a numbered "how to" walkthrough (exact screen, exact fields, in the
order a partner fills them in) — not a feature summary — per CLAUDE.md's Firm-Facing
Documentation section, tightened at T7.7 (session 50).
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

```

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.9 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
