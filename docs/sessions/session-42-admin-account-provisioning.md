# Session 42 — Admin Account Provisioning

# Date: 2026-09-10

# Tasks completed: T6.6

## What Was Built

`scripts/create-admin-user.ts`, a developer-run CLI script (`npm run admin:create-user`)
that creates a real `admin_user` row and issues a 7-day single-use setup link via T6.2's
`issueSetupToken` — the mechanism this project uses to give a partner their very first
account. This closes the gap logged as technical debt at T6.2 and **completes Milestone 6**
(T6.1–T6.6 all shipped).

## Files Changed

- `scripts/create-admin-user.ts` — new; parses `--name`/`--email`/`--password`, generates a
  random password via `crypto.randomBytes` when omitted, creates the account, issues the
  setup link, handles duplicate emails via Prisma's `P2002` error code.
- `package.json` — added `admin:create-user` script.
- `memory/technical-debt.md` — resolved the T6.2-era "no provisioning" entry; added a new
  entry for the still-missing deactivate/reactivate + reset-2FA admin UI, sequenced into
  T7.6.
- `docs/tasks/07-content-admin.md` — addendum on T7.6 (Team / author profile editor)
  describing the two missing actions.
- `docs/user-guide.md` — new "Admin Login — Milestone 6" section; stale "no admin area"
  mentions updated; Milestone 6 moved out of "What's coming next"; change-log row added.
- `memory/completed-work.md`, `memory/decision-log.md` — T6.6 entries added.
- Artifact "Platform User Guide" republished (Version 2).
- Artifact "Website Build Status" republished (Version 6) — milestone ledger row 6 flipped to
  Complete, progress track to 6/9 segments, headline stat to ~64%, "Your Team" usability
  panel updated.

## Decisions Made

- Account provisioning stays a CLI script, not a self-service "invite a partner" admin-UI
  button — deliberate scope call (five partners, rare account creation), not a deferred one.
  See `memory/decision-log.md`.
- Discovered mid-session (while documenting, not from any task spec) that deactivation and
  2FA-reset both have real, tested `lib/` mechanisms but no admin-facing UI for an _existing_
  account. Logged as new technical debt and sequenced into T7.6 rather than expanded into
  this task's own scope.

## Current State

Milestone 6 (Admin Authentication) is fully complete and verified end-to-end for real via
Playwright MCP against the live dev server and database. Both firm-facing documents
(`docs/user-guide.md` and the "Website Build Status" Artifact) are current. Milestone 7
(Content Management Admin) has not started; its first task, T7.1 (Admin dashboard), is next.

## Blockers

None.

## Next Task

T7.1 — Admin dashboard — `/admin`
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.1 — Admin dashboard — /admin

## What to build
Landing screen (screen-inventory.md #25) to its mockup: 4 read-only stat cards (new
enquiries, triage-flagged, diagnostics this month, published articles) and a recent-
enquiries panel — all aggregate queries over `enquiry_record`/`article`, no new entity.

## Input → Output contract
Existing `enquiry_record`/`article` tables → 4 live counts + 5 most recent enquiries.

## Acceptance criteria
Each stat card's count matches a direct SQL query against the same filter described in
`content-management-admin.md`; the panel shows exactly the 5 most recent `enquiry_record`
rows, unfiltered.

## Size / Dependencies
S, depends on: T6.3 (login + session management — the `/admin` route group is already
protected end-to-end via `app/proxy.ts`'s session check, so this task builds inside an
already-secured shell, not a new auth boundary), T3.5 (diagnostic submission writes the
`enquiry_record` rows this task's "Diagnostics this month" stat and the recent-enquiries
panel both read), T2.6 (contact-form submission is the other `enquiry_record` source feeding
the same stats/panel), T4.1 (the `article` entity this task's "Published articles" stat
counts).

Note: the admin shell itself (sidebar nav, off-canvas mobile pattern, route protection) was
already built at T1.5/T6.3 — `app/admin/(shell)/layout.tsx` exists and wraps a placeholder
`app/admin/(shell)/page.tsx` ("The admin shell frame is in place. Real dashboard content is
built in a later milestone."). This task replaces that placeholder's content only; it does
not touch the layout/shell itself.

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component beyond what's needed
  to call into `lib/` and render the result — write the four aggregate queries and the
  recent-enquiries query as `lib/` functions (e.g. `lib/admin-dashboard.ts`), not inline
  Prisma calls in the page component.
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** This page reads live `enquiry_record`/`article` counts on every
  request — apply this explicitly, don't rely on Next.js inferring it.
- **Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`.** This page is a Server Component reading live data directly — no client
  component is expected here, but if any interactive piece is added (e.g. a refresh button),
  keep it in its own client-safe file with zero `@/lib/prisma` import.
- Accessibility: WCAG 2.1 AA — use Base UI primitives for anything interactive, not a bare
  `<div>`.
- The mockup is authoritative — build to `ui/mockups/g-admin-content/admin-dashboard.html`'s
  structure and copy; don't invent layout.
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), and desktop
  (mockup's own width) all before this task is done, even though the mockup itself is
  desktop-only.

## Relevant ADRs
- ADR 0007 — docs/adr/0007-totp-two-factor-auth.md — this page sits behind the TOTP-gated
  session boundary T6.3 already enforces; this task adds no new auth logic itself, it just
  operates inside that existing boundary.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use the existing design tokens, don't introduce a new
  color/radius/font for the stat cards.

## Relevant feature specification
docs/features/content-management-admin.md — "Admin dashboard (screen-inventory.md #25)"
section (lines 13–26) is this task's exact data contract: the four stat card definitions
(New enquiries = `COUNT(enquiry_record)` where `status = new`; Triage-flagged = `COUNT
(enquiry_record)` where the triage flag is set; Diagnostics this month = `COUNT
(enquiry_record)` where diagnostic-originated and `created_at` is in the current month;
Published articles = `COUNT(article)` where `published_at IS NOT NULL`) and the recent-
enquiries panel (five most recent `enquiry_record` rows, unfiltered, same fields as
`enquiry-management.md`'s list screen). Also read docs/features/enquiry-management.md for
the exact `enquiry_record` field set this task's panel and stats read (`status`, triage
flag, `source`, `created_at`, name/business/score-summary fields) — this task reads that
entity, it does not extend it.

## Mockup / UI reference
ui/mockups/g-admin-content/admin-dashboard.html — build the four stat cards and recent-
enquiries panel to this file's exact structure and copy.

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies — this task reads existing fields, doesn't
  add any).
- Fee amounts as structured min/max band (not applicable — this task touches no fee data).
- Content the firm can change lives in the database (not applicable — this task is read-only
  aggregate queries, no new editable content).
- Diagnostic scoring configuration is data, not logic (not applicable — this task doesn't
  touch scoring).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` on any page/route reading live DB content
  (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies if any client-side interactivity is added; this task is expected to be a
  Server Component with no client piece).
- Never let a `package.json` lifecycle script assume `.git` exists (not applicable — no
  lifecycle script changes here).
- Content the firm can edit lives in DB, edited via `/admin` (not applicable — no new
  editable content this task, read-only).
- The shared generic `page` entity pattern (not applicable — this screen isn't a marketing
  page).
- Every public page type carries meta_title/meta_description + OG/JSON-LD (not applicable —
  `/admin` is not a public/indexed page).
- Every conversion moment fires through the GTM dataLayer pattern (not applicable — no new
  conversion event here).
- Every scheduled/background job is its own Railway service (not applicable — no background
  job this task).
- The "one nav entry, second screen via inline link" pattern (not applicable — this is the
  dashboard itself, the landing screen, not a subordinate detail screen).

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
    task changed nothing firm-visible, note that explicitly rather than skipping silently
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.2 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
