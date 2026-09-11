# Session 49 — Team Admin

# Date: 2026-09-11

# Tasks completed: T7.6

## What Was Built

`/admin/team` (list of all 5 partners' public profiles) and `/admin/team/[id]` (self-service,
right-role-unrestricted profile editor: photo, title, practice area, credentials, personal
statement, bio, display order, with a computed read-only publish badge). Wired
`Author.adminUserId` to a real, unique Prisma relation against `AdminUser`. Built the three
admin-facing account actions this task's own session-42 addendum named — deactivate/
reactivate, reset 2FA enrolment, reset password — on an `AdminUserActionsPanel` shown only
when an author has a linked login.

## Files Changed

- `prisma/schema.prisma` — `Author.adminUserId` now `@unique` with a real `AdminUser?`
  relation; corrected a stale doc-comment that wrongly named `bio` as publish-gating.
- `prisma/migrations/20260911103608_add_author_admin_user_relation/` — new (applied via
  `prisma migrate diff --script` + `prisma migrate deploy`, since `prisma migrate dev`
  refused to run non-interactively in this session's shell).
- `lib/admin-authors.ts` — new: `getAuthorList`, `getAuthorForEdit`,
  `getAuthorIdForAdminUser`, `updateAuthor` (computed `published`, blocks unpublishing an
  author with existing articles), `setAdminUserActive`, `resetAdminUserTotp`,
  `resetAdminUserPassword`.
- `lib/admin-authors.test.ts` — new: 18 tests.
- `lib/auth/session.ts` — added `reactivateAdminUser` (the reverse of the existing
  `deactivateAdminUser`).
- `app/admin/(shell)/team/page.tsx`, `app/admin/(shell)/team/[id]/page.tsx`, `app/admin/
(shell)/team/[id]/author-editor-form.tsx`, `app/admin/(shell)/team/[id]/admin-user-
actions-panel.tsx` — new.
- `app/api/admin/authors/[id]/route.ts`, `app/api/admin/admin-users/[id]/deactivate/
route.ts`, `.../reactivate/route.ts`, `.../reset-2fa/route.ts`, `.../reset-password/
route.ts` — new.
- `memory/completed-work.md`, `memory/decision-log.md` — new T7.6 entries.
- `memory/technical-debt.md` — resolved "`Author.adminUserId` is still a schema-only
  placeholder FK" (with a note that per-partner backfill remains User-triggered) and "No
  admin-facing way to deactivate/reactivate an account..." in place.
- `memory/known-bugs.md` — new: article-byline rendering has no `author.published` check.
- `docs/tasks/04-insights.md` — new T4.6, sequencing the byline gap's real fix (needs a
  firm decision, not a mechanical one).
- `docs/user-guide.md` + its Artifact mirror — updated: new Team admin card, Admin Login
  card's "Not built yet" callout resolved into "You can do today."

## Decisions Made

- No role-based check gates opening or editing another partner's entry — no role tiers
  exist anywhere in this codebase to check against, and building real RBAC would mean
  inventing a policy nobody has specified. Extended `content-management-admin.md`'s own
  existing "Decision, not a gap" precedent (no technical approval-routing layer for a
  five-partner firm) to this case too.
- `Author.adminUserId` is now a real `@unique` relation; none of the 5 seeded partners has
  a real login account yet (only this project's dev/test-only account exists) — backfilling
  a specific partner's `adminUserId` is a one-off, User-triggered action once the firm says
  that partner is ready for real credentials, not attempted here.
- Fixed a stale schema doc-comment naming `bio` as a fourth publish-gating field — both
  feature docs and this task's own spec name exactly three (name, practiceArea,
  personalStatement).
- `updateAuthor` refuses to unpublish an author who already has articles — discovered while
  building this that `lib/insights.ts`'s byline rendering has no `published` check at all;
  logged as a new known-bug and a new task (`docs/tasks/04-insights.md` T4.6) rather than
  fixed unscoped inside this task, since the real fix needs a firm decision (does an
  unpublished author's existing bylines go blank, or stay as a historical record?).
- `title` falls back to the schema's own `"Partner"` default if saved blank, rather than
  persisting an empty string.
- The publish badge is computed client-side too, live, from the fields as currently typed,
  so a partner sees "saving now would unpublish" before committing to it.

Full reasoning for all of the above in `memory/decision-log.md`, 2026-09-11 (T7.6, session 49) entry.

## Current State

Milestone 7 (Content Management Admin) has Dashboard (T7.1), Articles/Categories (T7.2),
Pages (T7.3), Offers (T7.4), Landing Pages (T7.5, create-only), and Team (T7.6) live.
Diagnostic Configuration, Site Settings, Subscribers, and article-resource attachment
(T7.10) remain. All quality gates pass (lint, format:check, typecheck, 243 tests — 18 new).
Verified live via Playwright MCP against the real dev database: temporarily linked the
dev/test admin account to a real seeded author (Ama Wiafe) to exercise self-service and the
account-actions panel, since no real partner has a login account yet; confirmed the "(you)"
marker, the live unpublish hint, a real blocked-unpublish rejection naming the actual
article count, a real credentials edit propagating to `/about` live, both reset-link actions
returning real working links, and a real deactivate that genuinely invalidated the session
(confirmed via a follow-up navigation redirecting to `/admin/login`) — then reactivated and
logged back in to finish verification. Checked mobile (390px)/tablet (768px)/desktop
(1280px), fixing one label-wrap cosmetic issue along the way. Every test change reverted
afterward (author unlinked, credentials cleared, account reactivated) via direct Prisma
queries — dev DB and the one real dev/test admin account are back to their pre-session state.

## Blockers

None.

## Next Task

T7.7 — Diagnostic Configuration
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.7 — Diagnostic Configuration

## What to build
Editor for `diagnostic_question` (text/order/active), `diagnostic_dimension` (weights),
`diagnostic_threshold` — values only, never the scoring algorithm (FR-8's scope); save-time
validation that every active dimension retains at least one active question.

## Input → Output contract
Configuration edit → updated question/dimension/threshold rows, live on the next
`/diagnostic` load.

## Acceptance criteria
Attempting to deactivate the last active question in a dimension is rejected inline, naming
the dimension — the exact scenario `business-health-check-diagnostic.md` describes as an
uncaught 500 if it ever reached a visitor is proven here to never reach save.

## Size / Dependencies
M, depends on: T6.3 (login + session management — this task builds inside the already-
secured `/admin` shell, same as every other Milestone 7 admin screen), T3.1 (the diagnostic
engine's own scoring logic already reads `diagnostic_question`/`diagnostic_dimension`/
`diagnostic_threshold` live — `lib/diagnostic-scoring.ts`/`lib/diagnostic-flow.ts` — this
task only adds the admin write path over that same data), T3.3 (the launch question set
this editor edits, and the specific gap this task's own session-18 addendum closes, is
already seeded there).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component — write the
  diagnostic-configuration read/update logic as `lib/admin-diagnostic.ts` (mirroring
  T7.4–T7.6's `lib/admin-*.ts` naming), keeping the public-facing scoring/read path
  (`lib/diagnostic-scoring.ts`, `lib/diagnostic-flow.ts`) untouched.
- **Values only, never the scoring algorithm** (FR-8's scope, restated directly in this
  task's own "Build" line) — this editor changes question text/order/active flag, dimension
  weights, and threshold values; it must never let a partner restructure *how* a score is
  computed. If anything about this task's design starts to look like it's changing scoring
  logic rather than scoring data, stop and reconsider — that's a developer change, not an
  admin edit, per `business-health-check-diagnostic.md`'s own business rule.
- **The exact validation this task's own acceptance criterion names**: a save that would
  leave any `diagnostic_dimension` with zero active questions must be rejected inline,
  naming the dimension by name, before it ever reaches the database —
  `business-health-check-diagnostic.md`'s own edge case names this as the scenario that
  otherwise reaches a visitor as an uncaught 500 (`lib/diagnostic-scoring.ts`'s scoring
  function presumably divides by an active-question count or similar per-dimension
  aggregate — read it before writing this validation, to confirm exactly what "zero active
  questions in a dimension" breaks downstream).
- **Session 18 addendum (must-do, not optional)**: `diagnostic_question` has no queryable
  `is_placeholder` column today — T3.3 only flagged the launch question set's pending-review
  status in `prisma/seed.ts`'s own comment, since no such column exists on this model
  (unlike every other content-bearing model in this schema). Add a real
  `isPlaceholder Boolean @default(false)` column to `DiagnosticQuestion` (a real migration —
  see T7.6's own session's note on running `prisma migrate dev` non-interactively via
  `prisma migrate diff --script` + `prisma migrate deploy` if the interactive command
  refuses to run in this session's shell too), set it `true` on T3.3's seeded rows, and
  surface it in this editor the same way any other placeholder-flagged content is shown
  elsewhere in this admin (a badge, e.g. `LegalAdminClient`'s "Draft — pending legal review"
  precedent). See `memory/technical-debt.md` → "`diagnostic_question` has no queryable
  `is_placeholder` column."
- **Session 22 addendum (must-do, not optional)**: extend this editor to also cover
  `diagnostic_score_band` rows (`minScore`/`label`/`statement`/`isPlaceholder`) the same way
  it covers question/dimension/threshold rows — a real, already-modelled, already-rendered
  (`app/diagnostic/results/page.tsx`, via `lib/diagnostic-flow.ts`'s `getScoreBand`) entity
  this task's own scope was extended to include after this task was first written. See
  `memory/technical-debt.md` → "Diagnostic results screen has no score-band label/
  statement" for the history.
- **Session 23 addendum (must-do, not optional)**: `DiagnosticScoreBand` has **three**
  content fields per row, not two — `label`, `statement` (short, on-screen), and
  `emailDetail` (a separate, longer, multi-paragraph narrative sent only in the summary
  email, `lib/diagnostic-request-summary.ts`'s `buildSummaryEmailHtml`, never rendered on
  `/diagnostic/results`). The editor must expose all three distinctly — a textarea long
  enough for multi-paragraph prose for `emailDetail` specifically (blank-line-separated
  paragraphs, per that field's own doc-comment), separate from the single-line `statement`
  input. Do not collapse these into one field.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.**
- **Never let a `"use client"` component import a value (not just a type) from a `lib/`
  file that also imports `@/lib/prisma`.**
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`), matching every
  prior Milestone 7 admin screen's own component choices.
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), desktop.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — Next.js App Router, one codebase for the
  public site and `/admin`; this task adds admin routes and their API routes within it.
- ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — the diagnostic's data model
  is deliberately built to "support more dimensions/questions than the launch configuration
  ships with, so [Phase 2] is a configuration change later, not a rebuild" — this task is
  the admin surface that makes that design real; every add/remove/reorder this editor
  supports should hold up against that same "just a configuration change" bar.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives, matching every prior Milestone 7 admin screen's own component choices.

## Relevant feature specification
- docs/features/business-health-check-diagnostic.md — the full `diagnostic_question`/
  `diagnostic_dimension`/`diagnostic_threshold`/`diagnostic_score_band` field sets, the
  "configuration data, not hard-coded logic" business rule (FR-2.2), and the edge case this
  task's own acceptance criterion is built directly against (a dimension left with zero
  active questions).
- docs/features/content-management-admin.md — User flow step 8 ("Adjust the diagnostic": a
  partner with the right role edits question text, order, active flag, dimension weights,
  triage thresholds, plus each score band's label/statement/emailDetail) and its own
  business rule restating the same "values, never the scoring algorithm" boundary and the
  save-time validation requirement.

## Mockup / UI reference
`ui/mockups/g-admin-content/admin-diagnostic-questions-list.html` — the question list screen
(#33c, `AdminDataTable`-adjacent: order/active flag/dimension per row). `ui/mockups/
g-admin-content/admin-diagnostic-configuration.html` — the dimension-weights/threshold
editor screen (#33d). Neither mockup was built with `diagnostic_score_band` in mind (added
after this task was first written, per the session-22/23 addenda above) — infer that
sub-screen's layout from this same admin's own established editor-panel pattern (matching
how T7.6's account-actions panel or T7.3's footer-content panel added a second, structurally
distinct editing surface to an existing screen without its own dedicated mockup).

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies).
- Content the firm can change lives in the database, edited via `/admin` (applies).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies).
- **"Diagnostic Configuration edits values... never the scoring algorithm itself... A
  configuration change must pass validation (every active dimension has at least one active
  question) before it can be published"** (applies directly — the literal rule and the
  literal validation this task exists to build).
- Fee amounts as structured min/max band (not applicable — no fee field in this domain).
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
    likely does change it — the new `DiagnosticQuestion.isPlaceholder` column)
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable) — at minimum, this task's own
    session-18/22 addenda each reference a real technical-debt entry that should be
    resolved in place once this task closes them out
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
    task changed nothing firm-visible, note that explicitly rather than skipping silently.
    Run `npm run format` as the literal last step before committing, after all file edits
    including memory/docs/session-summary files — a real formatting-drift gap from skipping
    this was caught and fixed at the start of T7.5 (session 48).
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.8 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
