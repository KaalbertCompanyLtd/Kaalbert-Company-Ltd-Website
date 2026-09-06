# Session 30 — Planning framework alignment

# Date: 2026-09-06

# Tasks completed: None (process/tooling alignment only — no docs/tasks/*.md task executed)

## What Was Built

The user pointed at an updated `PROJECT_PLANNING_FRAMEWORK.md` (external to this repo, under
`Planning framework and trigger/`) and asked what changed since this project's own planning
was completed, and how it could improve this project. Read the full framework (1,563 lines)
and diffed it against this project's actual state — file sizes, `.claude/` contents, memory
files — rather than assuming, then reported findings before changing anything. On the user's
approval, implemented four changes: split three inline CLAUDE.md sections into
`.claude/skills/`; backfilled a `Status` field onto every `memory/decision-log.md` and
`memory/architecture-decisions.md` entry; added entry-hygiene checks to `/review`; and built
a commit-message-format `PreToolUse` hook. No application code, schema, or task in
`docs/tasks/*.md` was touched.

## Files Changed

- CLAUDE.md — condensed MCP Server Setup, Session Management, and Git Commit Protocol to
  short pointer sections (42,606 → 35,133 characters); updated "Memory file format and
  ordering" to document the new `Status` field on `decision-log.md`/`architecture-
  decisions.md`; updated Rollback/Revision Protocol to require flipping the original entry's
  `Status` to `Superseded` in place; added two Task Completion Checklist items for
  orphaned-fix and Status-flip hygiene.
- `.claude/skills/mcp-server-setup/SKILL.md` — new, full MCP setup/verification/server-install
  detail moved here from CLAUDE.md.
- `.claude/skills/session-management/SKILL.md` — new, full session-file naming/template/rules
  moved here from CLAUDE.md.
- `.claude/skills/git-commit-protocol/SKILL.md` — new, full commit sequence/format/examples/
  staging rules moved here from CLAUDE.md; documents the three commit-ID forms (`T##-##`,
  `P#-#`, `process`).
- `.claude/hooks/validate-commit-message.py` — new. `PreToolUse` hook (matcher: `Bash`)
  parsing `-m` and heredoc commit forms, denying a commit whose header doesn't match
  `<type>(<id>): <description>` or whose message contains a `Co-Authored-By` trailer; allows
  silently for non-commit commands, `--amend`, or anything it can't confidently parse.
  Pipe-tested against five synthesized payloads before trusting it.
- `.claude/settings.json` — wired the hook into `hooks.PreToolUse` with `"matcher": "Bash"`.
- `.claude/commands/review.md` — added a "Debt/bug and decision-log entry hygiene" section
  (orphaned-fix check, Status-flip check).
- `memory/decision-log.md` — backfilled `**Status:** Standing` onto all 55 pre-existing
  entries (one, T1.3's brand-tone decision, correctly marked `Superseded` instead, since it
  was genuinely reversed by the entry immediately above it); added a new session-30 entry
  recording this session's findings and decisions, including the Co-Authored-By conflict
  resolution and the new three-form commit-ID convention.
- `memory/architecture-decisions.md` — backfilled `**Status:** Active` onto all 11 entries.
- `memory/completed-work.md` — added the session-30 entry.
- `docs/sessions/session-30-planning-framework-alignment.md` — this file.

## Decisions Made

- **Kept the project's no-`Co-Authored-By` rule over the session's own attribution default.**
  The updated framework's required hook blocks `Co-Authored-By` trailers — the same rule
  CLAUDE.md already stated — but this session's harness-level instructions called for adding
  one. Surfaced the conflict directly; the user chose to keep the project rule for this repo.
  See `memory/decision-log.md` (session 30 entry) for the full reasoning.
- **Added a third commit-ID form, `process`, alongside `T##-##` and the pre-existing `P#-#`
  convention.** The hook's first cut only accepted `T##-##`, which would have newly blocked
  this project's own established `P#-#` Phase-2-scoping precedent (e.g. `docs(P2-8): ...`,
  session 29) and had no valid ID at all for this session's own tooling-only commit. Rather
  than invent a fake task ID, documented all three forms in the `git-commit-protocol` skill.
- **Did not live-test the hook via a real `git commit` in this session.** A `.claude/
  settings.json` hook change, like an MCP server change, only takes effect after a session
  restart. Running a real commit against the not-yet-reloaded settings risked creating an
  unwanted commit if the hook silently wasn't active yet — verified the script's logic via
  direct pipe-testing instead (five synthesized payloads, all correct).
- **AGENTS.md left untouched.** It has no skill-loading mechanism and must stay fully
  self-contained for non-Claude-Code tools, so the framework's "keep CLAUDE.md lean via
  skills" split doesn't apply to it.

## Current State

Milestones 1–4 remain fully shipped and unchanged; Phase 2 still has its eight fully-specced,
gated capabilities (unchanged since session 29). Project process/tooling is now aligned with
the updated `PROJECT_PLANNING_FRAMEWORK.md` on the four points the user approved. The
commit-message hook is wired but not yet proven live end-to-end in a real session (see
Blockers). No product code changed.

## Blockers

The commit-message hook (`.claude/hooks/validate-commit-message.py`, wired this session) will
only actually run once this session restarts (same restart-and-approve requirement as an
MCP server change). The very next `git commit` in a fresh session is the first real,
end-to-end proof it fires — if that commit is unexpectedly denied or unexpectedly allowed
despite a bad message, re-check `.claude/settings.json`'s `hooks.PreToolUse` wiring and the
hook script directly before assuming the logic itself is wrong (it was pipe-tested clean).

## Next Task

T5.1 — Landing page template — `/lp/[slug]`
File: `docs/tasks/05-landing-and-measurement.md`

(Unchanged from sessions 28/29 — this session was process/tooling-only and doesn't affect
what's next to build. The full `/task T5.1` output below is carried over verbatim from
session 29's own handoff, with its embedded Task Completion Checklist refreshed to match
CLAUDE.md's current checklist, which gained two items this session.)

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly. Note that CLAUDE.md's MCP Server Setup,
Session Management, and Git Commit Protocol sections are now short pointers into
`.claude/skills/mcp-server-setup/SKILL.md`, `.claude/skills/session-management/SKILL.md`, and
`.claude/skills/git-commit-protocol/SKILL.md` respectively (session 30) — read the relevant
skill file when you reach that point rather than expecting the full detail inline.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace. Note the epic's own opening: this
milestone "closes out everything Document 13.03 asked of the public-facing site — after this,
the site can carry paid traffic and prove it's working." It also records a real decision made
at epic-planning time, not left open: the `attribution` row's retention window (a later task
in this same epic, T5.4) is 90 days, matching GA4/Meta's own standard attribution lookback.

# Task T5.1 — Landing page template — `/lp/[slug]`

## What to build
Template to `ui/mockups/a-public-site/landing-page.html` (or equivalent),
reading `landing_page` (`docs/features/landing-page-template.md`) — no site navigation chrome
(structurally absent, not hidden by a toggle), full Section 8.2 footer statement present via
the shared footer component (not a per-instance editable field), independently editable
headline/opening paragraph.

## Input → Output contract
`landing_page` row → rendered page with no nav, full footer
statement, correct OG/Twitter tags (NFR-5).

## Acceptance criteria
No site navigation renders under any circumstance on this
template; the Section 8.2 statement is present in full and identical to the one rendered
elsewhere on the site (same shared source); a request for a non-existent slug 404s.

## Size / Dependencies
M, depends on: T1.5 (this task deliberately does *not* reuse `SiteHeader`/`SiteFooter`
wholesale — see the "Important" note below on which pieces of that shared work actually
apply here).

**Important — read before starting:**
1. **The epic file's own cited mockup path is stale.** `ui/mockups/a-public-site/
   landing-page.html` does not exist. The real mockups are the three named launch instances
   at `ui/mockups/d-landing-pages/landing-business-health-check.html`,
   `landing-funding-readiness-checklist.html`, and `landing-financial-clarity-pack.html` —
   all three share one structural template (build to that shared structure; T5.2 is what
   seeds the three distinct instances of real content into it, not this task).
2. **This template does NOT reuse `<SiteHeader>`/`<SiteFooter>` wholesale.** Checked directly
   against the real mockup: the header is logo-only, centered, with no `<nav>` element at all
   (not `SiteHeader` with navigation hidden by a prop — a structurally different, minimal
   header markup, per this task's own "structurally absent, not hidden by a toggle"
   acceptance criterion). The footer is also minimal — logo plus the scope-of-practice
   statement only (no address/nav-link columns) — but it must still render the *exact same*
   shared statement everywhere else on the site does. Reuse `components/scope-of-practice-
   note.tsx`'s `<ScopeOfPracticeNote />` directly inside this template's own minimal footer
   markup, rather than the full `<SiteFooter>` (which the mockup doesn't show) or a
   copy-pasted second version of that statement's text (which would violate this task's own
   "same shared source" acceptance criterion the moment the real text is ever edited).

## Architecture constraints
- Business logic lives in `lib/` — add `getLandingPageBySlug` (or similar) to a new
  `lib/landing-pages.ts`, mirroring `lib/offers.ts`'s `getOfferBySlug` /
  `lib/legal.ts`'s `getLegalPageBySlug` pattern exactly: return `null` for an unknown slug,
  let the route handler call `notFound()`.
- **Schema**: add a new `LandingPage` model to `prisma/schema.prisma` —
  `landing-page-template.md`'s Data requirements list is literal: `id`, `slug` (`@unique`),
  `headline`, `openingParagraph`, `bodyContent`, `ctaLabel`, `ctaHref`, `campaignReference`,
  `metaTitle`, `metaDescription`. No prior task built this table (T5.1 is the first task in
  this epic) — run `npx prisma migrate dev` for it. Follow this schema's own established
  `isPlaceholder`/`createdAt`/`updatedAt` conventions on every content-bearing model even
  though the feature doc's own field list doesn't restate them.
- `export const dynamic = "force-dynamic"` — reads live `landing_page` content on every
  request, same reasoning as every other DB-backed public page.
- A non-existent slug must 404 exactly the same way `app/offers/[slug]/page.tsx` and
  `app/legal/[slug]/page.tsx` already do (`notFound()` from `getLandingPageBySlug` returning
  `null`) — this task's own explicit acceptance criterion.
- Every public page type carries `meta_title`/`meta_description`/complete OG+Twitter tags
  (NFR-5) — reuse `lib/seo.ts`'s `buildPageMetadata` exactly as every other page does, even
  though this page has no navigation; a landing page is still a paid-ad destination that gets
  previewed/shared/forwarded (the feature doc's own Data requirements note this explicitly).
- Do not let this page accidentally inherit any conversion-event wiring from components it
  borrows — this task doesn't touch measurement at all (T5.3 does); a landing page CTA is a
  plain link to its real destination (`/diagnostic`, a checklist download, `/contact`) for now.

## Relevant ADRs
- ADR 0002 — docs/adr/0002-nextjs-typescript.md — a Next.js App Router dynamic route
  (`app/lp/[slug]/page.tsx`), TypeScript, Prisma as the only data-access layer.
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind v4 CSS-first styling;
  the minimal header/footer this task builds still draws from `ui/design-system.md`'s
  existing tokens, not new ad hoc values, even though it isn't the standard `SiteHeader`/
  `SiteFooter` markup.

## Relevant feature specification
docs/features/landing-page-template.md — "Business rules" (no-navigation rule, independently
editable headline/opening paragraph, the Section 8.2 footer-statement rule, the three named
launch instances), "Data requirements" (the `landing_page` entity's literal field list), and
"Edge cases" (unknown slug 404s, navigation is structurally unavailable to a partner, not just
hidden) are this task's exact contract.

## Mockup / UI reference
`ui/mockups/d-landing-pages/landing-business-health-check.html` (plus the other two instances
in that same directory for cross-reference on which parts of the structure are genuinely
shared vs. per-campaign) — note the epic file's own cited path
(`ui/mockups/a-public-site/landing-page.html`) is stale; see the "Important" note above.

## Coding standards
- Mockups are authoritative for UI (applies) — build to the shared structure across all three
  real instances in `ui/mockups/d-landing-pages/`, not an invented layout.
- Responsive built in from first implementation (applies) — mobile (~375–430px), tablet
  (~768px), desktop (~1200px+), even though the mockup is desktop-only.
- Feature docs are the data/interface contract (applies) — landing-page-template.md's Data
  requirements section is this task's literal field list.
- Business logic lives in `lib/` (applies) — `lib/landing-pages.ts`, not inline in the route.
- Every entity field maps to the feature doc (applies) — `LandingPage`'s fields match that
  doc's literal list.
- Content the firm can change lives in the database (applies) — this is exactly what makes a
  landing page instance's headline/copy/CTA database-backed and independently editable
  per campaign (FR-4.2), rather than a hand-coded page per campaign.
- Every public page type carries `meta_title`/`meta_description` (applies — see Architecture
  constraints above).
- Every conversion moment fires through the GTM `dataLayer` pattern (not applicable to this
  task specifically — T5.3 wires the six fixed events; this task's CTA is a plain link to a
  destination that already fires its own event on its own page, e.g. `/diagnostic`).

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
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per the session-management skill) with the output of /task T5.2
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
