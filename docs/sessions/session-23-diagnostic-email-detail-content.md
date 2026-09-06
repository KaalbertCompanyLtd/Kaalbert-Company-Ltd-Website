# Session 23 — Diagnostic summary email detail content

# Date: 2026-09-06

# Tasks completed: T3.7 follow-up (no new task ID — a content-model fix to an already-completed task)

## What Was Built

The user asked whether the summary email's content was admin-editable, since it read
"scanty." Investigation found three distinct things bundled in that one question:

1. The score/band label and statement **are** already admin-ready (`DiagnosticScoreBand`,
   built at T3.6/T3.7 in session 22) — just no `/admin` screen yet (Milestone 7).
2. The disclaimer box and footer scope-of-practice line are **deliberately** hardcoded
   verbatim compliance text, matching the exact same hardcoded pattern used on the results
   screen and site-wide `ScopeOfPracticeNote` — not a gap.
3. The real gap, once the user clarified: the email was supposed to be the "full detail"
   version, but it was rendering the _same_ short `statement` the results screen already
   shows on screen — so it wasn't actually fuller than the screen at all.

Fixed #3 by adding `DiagnosticScoreBand.emailDetail` — a separate, longer, multi-paragraph
narrative used only by the summary email, never by `/diagnostic/results`. Seeded real
(placeholder-flagged) detailed copy for all four bands. Verified end-to-end for real: a live
`/api/diagnostic/submit` call against the running dev server, the real DB-backed band fetched,
the actual production `buildSummaryEmailHtml` rendered against it, and a Playwright screenshot
confirming `/diagnostic/results` itself is unchanged.

## Files Changed

- `prisma/schema.prisma` / migration `20260906023106_add_diagnostic_score_band_email_detail`
  — `DiagnosticScoreBand.emailDetail` column.
- `prisma/seed.ts` — real detailed narrative per band (`emailDetail`), reseeded into the dev DB.
- `lib/diagnostic-flow.ts` — `DiagnosticScoreBand` type and `getScoreBand` carry the new field.
- `lib/diagnostic-request-summary.ts` — `buildSummaryEmailHtml` renders `emailDetail` (split
  on blank lines into real paragraphs), falling back to `statement` only if blank.
- `lib/diagnostic-request-summary.test.ts` — 2 new tests (renders `emailDetail`, not
  `statement`; falls back to `statement` when `emailDetail` is empty).
- `docs/features/business-health-check-diagnostic.md` — User flow step 6 + Data requirements
  updated to document the split and add `diagnostic_score_band` (missing from this doc
  entirely until now).
- `docs/features/content-management-admin.md` — Diagnostic Configuration scope, Business
  rules, Data requirements, and Interfaces all updated to name `diagnostic_score_band` and its
  three content fields (label/statement/emailDetail) as admin-editable.
- `docs/tasks/03-diagnostic.md` — T3.7 addendum clarifying its "matches on-screen result data"
  AC refers to score/dimension data, not narrative text.
- `docs/tasks/07-content-admin.md` — T7.7 addendum (session 23) naming the third field this
  editor still needs to expose.
- `memory/technical-debt.md`, `memory/decision-log.md`, `memory/completed-work.md` — updated.
- The published "Summary Email Preview" Artifact (same URL as session 22's) — updated with
  real HTML generated from the new `emailDetail` content for both example profiles.

## Decisions Made

- **`emailDetail` is a separate field from `statement`, not a longer rewrite of it** — the
  results screen and the email read different fields on purpose, so the screen can stay a
  teaser (FR-2.3) while the email is genuinely fuller. Full reasoning in
  `memory/decision-log.md`.
- **Falls back to `statement` if `emailDetail` is blank** — so a band added later (via a
  future admin screen) before its email copy is written never sends an empty section.
- **No new admin screen built this session** — Milestone 7 (Content Admin) doesn't exist yet;
  this session only extends the data model, seed, and email-read path, same treatment the
  original `DiagnosticScoreBand` model got. Logged as technical debt sequenced into T7.7.
- **Committed under T3.7**, not a new task ID — this is a content-model fix to an
  already-completed task, same precedent as the score-band retrofit (committed under T3.6).

## Current State

The diagnostic epic (Milestone 3) remains fully built and now sends a genuinely fuller
written summary by email than what the results screen shows — verified for real against the
running dev server and the real dev database, not just unit tests. No admin UI exists yet for
any of this content (score bands or otherwise); that's Milestone 7's job, already documented
as its own task addendum.

## Blockers

None.

## Next Task

T4.1 — Data model: `article`, `author`, `category`, `article_resource`
File: docs/tasks/04-insights.md

Correction to session 22's handoff: that session's note treated Milestone 4 (Insights) as
gated on the firm supplying its real eight articles, deferring to the user before generating
a handoff. Re-checked `docs/roadmap.md`'s actual Milestone 4 entry directly rather than
relying on that assumption: it explicitly says Insights ships "seeded with the firm's actual
eight articles once supplied ... the mockup's illustrative article standing in until then" —
the same placeholder-content-first pattern already used for the diagnostic's question set
(T3.3). Milestone 4 is not gated; T4.1 is the correct, unblocked next task.

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/04-insights.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T4.1 — Data model: `article`, `author`, `category`, `article_resource`

## What to build
Tables per `docs/features/insights-engine.md`, with `published_at` as the single
source of truth for visibility (null = draft) — no separate `is_published` flag to fall out
of sync with it.

## Input → Output contract
Schema definition → migrated tables.

## Acceptance criteria
A row with `published_at: null` is provably excluded by every query
built in T4.2–T4.4 (covered by their own tests, not re-tested here) — this task only confirms
the schema itself has no redundant visibility flag.

## Size / Dependencies
S, depends on: T1.2 (Postgres schema baseline + migration tooling — the `schema.prisma` file,
migration history, and seed-script convention this task adds its own tables into; already
built and in continuous use since Milestone 1).

**Note on `author` specifically:** the `Author` model already exists (`prisma/schema.prisma`,
built at T2.5 for `/about`) with exactly the fields Insights bylines need — `name`,
`photoUrl`, `practiceArea`, `bio`, `published`. This task does **not** create a second author
entity; `article.authorId` is a foreign key into the existing `Author` table. The epic's own
task title lists "author" only because `insights-engine.md`'s Data requirements section
restates the entity for completeness, not because it's new here.

## Architecture constraints
- Business logic lives in `lib/`, never inline in a route handler or component — not
  directly exercised by this task (no route/component here), but keep it in mind for T4.2's
  queries that read these tables.
- Every entity field named in `docs/features/insights-engine.md`'s "Data requirements"
  section maps to a Prisma schema field of the same name — don't rename during
  implementation without updating that feature doc to match.
- Content the firm can change lives in the database, never hard-coded — this task is exactly
  what makes that true for articles/categories; there is no fallback hard-coded article list
  anywhere once this ships.
- ADR 0001 (no CMS) applies directly: `article`/`category`/`article_resource` are hand-built
  tables owned by this codebase's own schema and admin (Milestone 7 later) — never a
  headless-CMS product's content model bolted on.
- Per `docs/roadmap.md`'s Milestone 4 goal ("the mockup's illustrative article standing in
  until [real articles are supplied]") and this project's established placeholder convention
  (`DiagnosticQuestion`/`DiagnosticScoreBand`/seeded `Author` rows all carry a queryable
  `isPlaceholder` boolean), give `Article` its own `isPlaceholder Boolean @default(false)`
  column now, at schema creation time — do **not** repeat the exact gap already logged in
  `memory/technical-debt.md` ("`diagnostic_question` has no queryable `is_placeholder`
  column," sequenced into T7.7 as a retrofit) by adding this column after the fact. This
  task itself seeds no data (empty tables only, per its own Input → Output), so this is a
  schema-only addition — the illustrative article content and its `isPlaceholder: true` flag
  are T4.2/T4.3's concern, not this task's.
- `category` is admin-manageable directly (create/rename/retire) per
  `content-management-admin.md` — model it as its own first-class table with `name`/`slug`,
  not an enum or a fixed seeded list a developer controls.
- Do not add a CMS, headless CMS, or page-builder product (CLAUDE.md's "Things NOT to Do") —
  not a risk in a pure Prisma schema task, but stated here since this is the task that most
  directly implements the alternative ADR 0001 chose.

## Relevant ADRs
- ADR 0001 — docs/adr/0001-custom-build-no-cms-platform.md — the entire application,
  including its content model, is hand-built; no CMS product ever owns this schema or the
  admin screens that will edit it.
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — TypeScript + Next.js (App Router) is the
  one application framework; Prisma is this project's ORM against that stack (this task's
  actual mechanism).
- ADR 0003 — docs/adr/0003-railway-hosting-and-postgres.md — Railway's own bundled,
  always-on PostgreSQL is the database these tables migrate into, chosen specifically to
  avoid cold-start latency risk rather than a scale-to-zero alternative.

## Relevant feature specification
docs/features/insights-engine.md — its "Data requirements" section is this task's exact
entity/field contract (`article`, `article_resource`, `author` [existing, reused],
`category`; `subscriber` is also listed there but is a later task's concern — check whether
T4.2–T4.4 or a dedicated task owns it before assuming it belongs here).

## Mockup / UI reference
Not applicable — this task has no UI surface (schema/migration only). The tables it creates
are read by `ui/mockups/a-public-site/insights-index.html` and `insights-article.html` in
T4.2 and T4.3.

## Coding standards
- Mockups are authoritative for UI (not applicable — no UI in this task).
- Responsive built in from first implementation (not applicable — no UI in this task).
- Feature docs are the data/interface contract (applies — every field in
  `insights-engine.md`'s Data requirements section must map 1:1 to a schema field of the
  same name).
- Business logic lives in `lib/` (not applicable — no logic in this task, schema only).
- Every entity field maps to the feature doc (applies — see Architecture constraints above).
- Fee amounts as structured min/max bands (not applicable — no fee fields in this domain).
- Content the firm can change lives in the database (applies — this task is precisely what
  makes article/category content database-backed rather than hard-coded).
- Diagnostic scoring config is data, not logic (not applicable — different domain entirely).
- Accessibility WCAG 2.1 AA (not applicable — no UI in this task).
- `export const dynamic = "force-dynamic"` on any DB-backed page/route (not applicable — no
  page/route in this task; applies to T4.2/T4.3 instead, note it for whoever picks those up).
- Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma` (not applicable — no client component in this task; relevant again the
  moment T4.2/T4.3 build the index/article pages).
- The "one nav entry, second screen via inline link" pattern (not applicable to this task).
- The shared generic `page` entity (not applicable — Insights has its own dedicated entities,
  not a generic marketing-page row).
- Every public page type carries `meta_title`/`meta_description` (applies to the schema
  itself — `article.meta_title`/`article.meta_description` must exist as real columns now,
  even though no page renders them until T4.3).
- Every conversion moment fires through the GTM `dataLayer` pattern (not applicable — this
  task adds no conversion moment; Insights subscription is explicitly *not* one of the six
  fixed events per `insights-engine.md`'s own business rules).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T4.2
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
