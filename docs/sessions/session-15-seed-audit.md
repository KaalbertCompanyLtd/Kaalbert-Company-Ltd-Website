# Session 15 — Content migration/seed audit

# Date: 2026-09-05

# Tasks completed: T2.9

## What Was Built

No new seed code — T2.9's own addendum correctly predicted every entity's `seed*()` function
was already written incrementally by T2.1–T2.7. This session audited the seed script against
its own three acceptance criteria for real: reset the dev database and confirmed
`npm run db:seed` completes cleanly on a genuinely fresh schema, confirmed every
non-placeholder field already cites a specific source in the seed script's own comments, and
confirmed `isPlaceholder` correctness plus `docs/dashboard.md` sync — finding and fixing two
real drift issues along the way (a stale dashboard summary, a duplicated technical-debt
entry). Also confirmed T2.10 (custom error pages) was already built and verified at T2.8.

## Files Changed

- `docs/dashboard.md` — updated "Current Phase" (was stuck at "Planning complete", now
  reflects Milestone 1–2 complete through T2.9/T2.10) and the "Technical Debt"/"Known Bugs"
  summary line (was "None recorded yet (pre-implementation)", now reflects the real 13
  open/3 resolved count in `memory/technical-debt.md`).
- `memory/technical-debt.md` — removed a duplicate "Business Health Check's two-tier pricing
  has no real data model yet" entry (a stale `Open` leftover with pre-resolution text,
  sitting below the correct `Resolved` entry for the same item).
- `memory/completed-work.md` — session entry for this audit.
- `memory/decision-log.md` — decision entry recording the audit outcome and the T2.10
  completion finding.
- `docs/sessions/session-14-seo-foundation.md` — trivial Prettier whitespace fix (whole-tree
  `format:check` gate).

No application code, schema, or seed script changes — `prisma/seed.ts` and
`prisma/schema.prisma` were read in full and found already correct.

## Decisions Made

- Verified the fresh-database seed for real rather than assuming it from reading the code:
  ran `npx prisma migrate reset --force` against the dev database (`railway` @
  `metro.proxy.rlwy.net:18791`, per `CLAUDE.local.md`). Prisma's own CLI has a built-in safety
  gate that blocks this action outright for AI agents without explicit user consent
  (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) — confirmed the target was the documented
  dev/staging TCP-proxy host (not a production hostname), asked the user via
  `AskUserQuestion`, and got explicit consent before rerunning. Row counts after
  `npm run db:seed` matched every entity's expected seed count exactly (1 `HomePageContent`,
  3 `Offer` + 2 `OfferTier`, 4 `Page`, 8 `Capability`, 1 `AdvisoryRetainer`, 4 `MethodStage`,
  1 `FirmStatement`, 5 `Author`, 1 `SiteSettings`, 4 `LegalPage` [3 placeholder, 1 real],
  1 `FooterContent`).
- Cross-checked every cited feature doc's ("Data requirements" section) field list against
  `prisma/schema.prisma` for the eight docs this epic touches — no drift found; every
  deviation (added fields, fields deliberately left unmodelled) is already documented in both
  the schema's own doc-comments and the feature docs themselves, kept in sync incrementally by
  T2.1–T2.8.
- Removed the duplicate technical-debt entry rather than leave two contradictory records
  (one `Resolved`, one stale `Open`) for the same item — a memory-hygiene fix, not a seed gap.
- Confirmed `app/not-found.tsx`/`app/error.tsx`/`app/global-error.tsx` (T2.10) already exist
  on disk and were already exercised by T2.8's own Playwright verification with zero console
  errors — did not rebuild them; marked T2.10 complete in `docs/dashboard.md` instead, per
  this task's own explicit instruction for that exact finding.
- Encountered a `dotenv@17.4.2` CLI "tip" message reading "auth for agents
  [www.vestauth.com]" during the seed run, which looked like a prompt-injection attempt at
  first glance. Verified directly in `node_modules/dotenv/lib/main.js` and its `CHANGELOG.md`
  that this is genuine (if aggressive) self-promotion shipped in the real, current `dotenv`
  package by its actual maintainer — not a compromised or lookalike package. Flagged to the
  user; took no action on the link itself.

## Current State

Milestone 1 (Foundation) and Milestone 2 (Public Presentation Layer) are both complete —
every T2.1–T2.10 task audited or built, seed data verified end-to-end on a fresh database,
and `docs/dashboard.md`/`memory/technical-debt.md` brought back in sync with reality. Ready
to start Milestone 3 (`docs/tasks/03-diagnostic.md`), beginning with T3.1.

## Blockers

None for T3.1. Pre-existing, already-tracked blockers unrelated to this session's own work
remain open in `memory/technical-debt.md` (GTM container not provisioned, favicon pending
firm confirmation, `site_settings.response_time_commitment` pending a firm-supplied figure,
partner photography pending, `SiteFooter`/`ScopeOfPracticeNote` still reading hardcoded copy
— all already sequenced into their respective future tasks, none newly introduced here).

## Next Task

T3.1 — Scoring engine data model
File: docs/tasks/03-diagnostic.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/03-diagnostic.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T3.1 — Scoring engine data model

## What to build
`diagnostic_question`, `diagnostic_dimension`, `diagnostic_threshold`,
`diagnostic_response` tables per `docs/features/business-health-check-diagnostic.md`, with
the data model supporting more dimensions/questions than launch config ships with (ADR 0005
— so P2-7's paid suite is a config change, not a rebuild).

## Input → Output contract
Schema definition → migrated tables, empty of data.

## Acceptance criteria
Schema supports adding a new dimension/question via data alone, no code change (proven by
inserting a test dimension in a throwaway script and confirming the scoring function in T3.2
picks it up automatically).

## Size / Dependencies
M, depends on: T1.2 (seed script scaffolding/convention and the Prisma migration tooling
this task's own migration is built with — already established and used by every task since).

## Architecture constraints
- Diagnostic scoring configuration (questions, dimensions, weights, thresholds) is data, not
  logic (FR-2.2, ADR 0005) — this task builds the tables that make that true; do not bake any
  dimension/question/threshold value into application code, not even as a seeded default
  inside a migration's own SQL (seeding real values is T3.3's job, not this task's).
- Every entity field named in `docs/features/business-health-check-diagnostic.md`'s "Data
  requirements" section maps to a Prisma schema field of the same name — don't rename during
  implementation without updating the feature doc to match.
- `enquiry_record` already exists (materialized at T2.6, `prisma/schema.prisma`) with
  `scoreSummary`/`weakestDimensions`/`triageFlag` already modelled nullable/empty specifically
  so this milestone could populate them without a migration of that table — add the
  `diagnostic_response` relation this task's own feature doc names (not yet modelled,
  per `EnquiryRecord`'s own doc-comment), but do not otherwise restructure `enquiry_record`
  without checking that doc-comment's reasoning first.
- Do not model `traffic_source`/`campaign`/`landing_page` on `enquiry_record` as part of this
  task — T2.6 already found this feature doc's field list disagrees with
  `measurement-and-attribution.md`'s own separate `attribution` entity design, and left that
  inconsistency for Milestone 5 to resolve; T3.1 owns the diagnostic tables only, not
  resolving that pre-existing disagreement.
- Any page/route that reads live database content must export
  `export const dynamic = "force-dynamic"` — not directly applicable to this task (schema
  only, no route), but keep it in mind for T3.4/T3.5/T3.6 which build on these tables.
- Business logic lives in `lib/`, never inline in a route handler — not directly applicable
  to a schema task, but the tables this task creates are what T3.2's `lib/` scoring function
  (next task) will query against, so field names/shapes should be chosen for how that
  function will actually consume them (e.g. an `active` flag queryable directly, weights
  numeric and ready for arithmetic), not just for admin-editing convenience.

## Relevant ADRs
ADR 0005 — docs/adr/0005-diagnostic-engine-in-app-module.md — the diagnostic is a custom,
data-driven module in the same PostgreSQL database as the rest of the app (not a third-party
plugin, not a separate decoupled application), with its scoring data model built to support
more dimensions/questions than the free launch version ships with, specifically so the
Phase-2 paid diagnostic suite (P2-7) is a configuration change later, not a rebuild — this
task is that data model.

## Relevant feature specification
docs/features/business-health-check-diagnostic.md — "Data requirements" section names the
four tables this task builds (`diagnostic_question`: id, prompt text, dimension, order,
response type [scale/boolean/choice], active flag; `diagnostic_dimension`: id, name, weight;
`diagnostic_threshold`: id, dimension-or-overall, threshold value, triage priority level;
`diagnostic_response`: id, session id, question id, answer value, timestamp) plus the
`enquiry_record` extension (the `diagnostic_response` set relation) described above.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own; it is the schema underneath the
`/diagnostic` flow T3.4 builds later in this same epic.

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface this task owns)
- Responsive is built in from a component's first implementation. (not applicable)
- Feature docs are the data/interface contract. (applies — build exactly the four tables
  `business-health-check-diagnostic.md`'s Data requirements section names, field-for-field)
- Business logic lives in `lib/`, never inline in a route handler or component. (not directly
  applicable — no route/logic in this task, but see the architecture constraint above about
  shaping fields for T3.2's consumption)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (applies directly — the core discipline this task is
  built around)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable — no fee
  data in this task's entities)
- Content the firm can change lives in the database, edited via `/admin`. (applies in spirit —
  this task's tables are exactly what makes diagnostic config firm-editable later at
  Milestone 7, even though no admin screen exists yet; don't hard-code anything this schema
  is meant to hold)
- Diagnostic scoring configuration is data, not logic. (applies directly — ADR 0005's core
  rule; this task's whole job is making that structurally true)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no UI surface)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no admin
  screen built yet)
- The shared generic `page` entity for marketing-page copy. (not applicable — diagnostic
  questions are not marketing-page copy)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD.
  (not applicable to this task directly — `/diagnostic`/`/diagnostic/results` will need this
  at T3.4/T3.6, not at the schema stage)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (not applicable
  to this task directly — `diagnostic_started`/`diagnostic_completed`/`summary_requested`
  fire from T3.4/T3.5/T3.7's own client/route code, not from the schema itself)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T3.2 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
