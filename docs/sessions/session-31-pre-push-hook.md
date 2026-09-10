# Session 31 — Pre-push quality-gate hook

# Date: 2026-09-10

# Tasks completed: T01-01 follow-up (no new `docs/tasks/*.md` task — see Notes)

## What Was Built

The user reported CI failing repeatedly on GitHub and asked for a pre-push git hook so
failures surface locally first. CLAUDE.md already _described_ such a hook as existing (Quality
Gates section, and the Next.js 16 typed-routes note claiming it was "wired into ... the
pre-push hook ... already") but it had never actually been built. Root-caused the real last CI
failure (`npm run format:check` failing on two files with stray Prettier drift from session 30) and fixed it, then built the actual hook: a tracked `.githooks/pre-push` script running
lint → format:check → typecheck → test, aborting on first failure, activated via git's native
`core.hooksPath` (set by a new `prepare` npm script so every clone gets it automatically on
`npm install`/`npm ci` — no Husky or other dependency added). Also added a missing `Test` step
to `.github/workflows/ci.yml`, since CLAUDE.md's own Quality Gates list requires `npm run
test` as a hard gate and CI wasn't running it.

## Files Changed

- `.githooks/pre-push` — new. Runs lint, format:check, typecheck, test in order; exits 1 with
  a clear message on first failure; mentions `--no-verify` as the (discouraged) bypass.
- `package.json` — added `"prepare": "git config core.hooksPath .githooks"`.
- `.github/workflows/ci.yml` — added a `Test` step (`npm run test`) after `Format check`.
- `memory/decision-log.md` — new entry for the hook-design decision (native `core.hooksPath`
  over Husky), plus a Prettier formatting fix to an existing entry.
- `docs/sessions/session-30-planning-framework-alignment.md` — Prettier formatting fix only
  (two stray unwrapped lines from session 30), no content change.
- `memory/completed-work.md` — new entry, "T1.1 follow-up."

## Decisions Made

- Used git's native `core.hooksPath` + a tracked `.githooks/` directory instead of adding
  Husky as a dependency — consistent with ADR 0001's "packages as building blocks, not
  owners" ethos and the project's general preference against a dependency for what a
  one-line `git config` call already does. See `memory/decision-log.md`'s 2026-09-10 entry.
- Bundled the Prettier fix for the two already-broken files into this same commit rather than
  treating it as a separate task — it's what was actually breaking CI, discovered while
  verifying the new hook, and isn't attributable to any other in-flight task.
- No `memory/technical-debt.md` entry was written for the "hook never actually existed" gap:
  per CLAUDE.md's sequencing rule, a small fix whose owning task (T1.1) already shipped gets
  fixed immediately and logged as a "T##-## follow-up" in `completed-work.md` instead of
  filed as debt.

## Current State

`npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm run test` all pass
clean on `main`. The pre-push hook is active in this working copy (`core.hooksPath` set) and
verified directly: a clean run passes all four gates in order, and an injected formatting
error aborts with exit code 1 before reaching later gates. CI (`.github/workflows/ci.yml`)
now runs the same four gates GitHub-side. Commit `ad79359` on `main`, not pushed (pushing is
blocked from inside an agent session per CLAUDE.md's Git Commit Protocol — the developer
pushes manually).

## Blockers

None. One unrelated observation, not part of this task: while checking whether the test
suite needs a database connection (it doesn't — jsdom environment, no live Prisma calls),
`env | grep -i database_url` surfaced two real Postgres connection strings
(`EVERSHIELD_DATABASE_URL_DEV`/`_PROD`) already exported in this shell's environment. These
belong to an unrelated project ("Evershield") and are unrelated to kaalbert.com — flagged to
the user directly in-conversation since they're now visible in this session's transcript;
worth rotating if that shell profile is shared or that transcript is retained anywhere
sensitive. No action taken beyond noting it — not this project's credential to manage.

## Next Task

T5.1 — Landing page template — `/lp/[slug]`
File: `docs/tasks/05-landing-and-measurement.md`

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace. Note in particular the epic's own
"Decision made here, not left open" note: the `attribution` row's 90-day retention window
(implemented later, in T5.4) — not this task's concern, but establishes why this epic exists
as a unit.

# Task T5.1 — Landing page template — `/lp/[slug]`

## What to build
Template to `ui/mockups/a-public-site/landing-page.html` (or equivalent), reading
`landing_page` (`docs/features/landing-page-template.md`) — no site navigation chrome
(structurally absent, not hidden by a toggle), full Section 8.2 footer statement present via
the shared footer component (not a per-instance editable field), independently editable
headline/opening paragraph.

## Input → Output contract
`landing_page` row → rendered page with no nav, full footer statement, correct OG/Twitter
tags (NFR-5).

## Acceptance criteria
No site navigation renders under any circumstance on this template; the Section 8.2 statement
is present in full and identical to the one rendered elsewhere on the site (same shared
source); a request for a non-existent slug 404s.

## Size / Dependencies
M, depends on: T1.5 (provides `SiteFooter` — the shared component this task must reuse
unmodified for the Section 8.2 statement — and the admin shell pattern, not directly relevant
here; T1.5 is already complete).

## Architecture constraints
- Business logic (fetching the `landing_page` row, 404 handling) lives in `lib/`, called from
  the route's Server Component — not inlined in the page file beyond calling into `lib/` and
  rendering the result.
- This route reads live database content, so it **must** export `export const dynamic =
  "force-dynamic"` — without it, Next.js can statically prerender at build time (Prisma calls
  aren't tracked by Next's fetch-cache heuristics) and the Railway build container has no
  access to `*.railway.internal`, so a missed `force-dynamic` here fails the build outright,
  not just serves stale content (hit for real at T2.1, see `memory/decision-log.md`).
- If any client component on this page needs option/lookup data that lives near a
  DB-querying `lib/` module, do not let it import a *value* (not just a type) from that
  module — it silently breaks Turbopack dev compiles by pulling `@/lib/prisma` into the
  client bundle (hit for real at T3.4, see `memory/known-bugs.md`). Put client-safe data in
  its own `lib/`-adjacent file with zero `@/lib/prisma` import if this comes up.
- No full site navigation renders on this template under any circumstance — this is
  structural (the page does not render `SiteHeader` at all), not a CSS/toggle-based hide.
- The Section 8.2 scope-of-practice statement must come from the same shared `SiteFooter`/
  `footer_content` source every other page reads (`legal-and-compliance-pages.md`) — never a
  per-instance copy that could drift.
- Every page-type entity carries `meta_title`/`meta_description` + OG/Twitter tags + JSON-LD
  per `seo-and-search-foundation.md` — this is part of the page being "done," not a follow-up.
- Content the firm can edit (headline, opening paragraph, body, CTA) lives in the database
  (`landing_page` table), never hard-coded — this task only builds the template and its
  render path; T5.2 seeds the three real instances into it.
- Responsive is built in from first implementation: mobile (~375–430px), tablet (~768px), and
  desktop (the mockup's own width, ~1200px+) — the mockup is desktop-only, infer the
  narrower treatment from the design system's existing patterns, don't file a follow-up.
- Accessibility: WCAG 2.1 AA (NFR-2) — use Base UI primitives for anything interactive rather
  than a bare `<div>`, consistent with every other built page.

## Relevant ADRs
- ADR 0002 — `docs/adr/0002-nextjs-typescript.md` — Next.js App Router is the one framework
  for public routes, admin, and API — this page is a standard dynamic-segment route
  (`app/lp/[slug]/page.tsx`), following the same pattern as `app/offers/[slug]`,
  `app/legal/[slug]`, `app/insights/[slug]`, all already built.
- ADR 0010 — `docs/adr/0010-styling-and-component-stack.md` — Tailwind v4 (CSS-first, no
  config file) + shadcn/ui generated on Base UI + Lucide icons; shadcn/ui component source is
  owned in-repo, not an installed opaque library — reuse existing themed primitives rather
  than hand-rolling new ones.

## Relevant feature specification
`docs/features/landing-page-template.md` — the full data/interface contract: `landing_page`
entity fields (id, slug, headline, opening_paragraph, body_content, cta_label, cta_href,
campaign_reference, meta_title, meta_description), the `GET /lp/[slug]` interface, and the
edge cases (404 on missing slug; footer statement cannot be altered per-instance by
construction; no toggle exists to add navigation). Also read `docs/features/legal-and-
compliance-pages.md` for the shared `footer_content`/`SiteFooter` source this task must reuse,
and `docs/features/seo-and-search-foundation.md` for the exact OG/Twitter/meta-tag contract
(NFR-5) every page-type entity must satisfy.

## Mockup / UI reference
`ui/mockups/d-landing-pages/landing-business-health-check.html` is the primary reference for
this template's structure (no-nav, single-message-single-CTA shape — screen #14 in
`ui/screen-inventory.md`). `ui/mockups/d-landing-pages/landing-funding-readiness-checklist.html`
and `ui/mockups/d-landing-pages/landing-financial-clarity-pack.html` are the same template
with different content (screens #15/#16) — useful to confirm which parts of the markup are
template-structural versus per-instance content, since T5.2 will seed all three into this
same template. (The epic text's own citation, `ui/mockups/a-public-site/landing-page.html`,
does not exist under that path — these three `d-landing-pages/` files are the actual mockups;
treat them as "or equivalent" per the task's own wording.)

## Coding standards
- Mockups are authoritative — build to the `d-landing-pages/` files' structure/copy exactly
  where they overlap (they will overlap heavily since it's one template); don't invent layout.
  (Applies.)
- Responsive built in from first implementation, not a later pass. (Applies.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable — this
  template has no navigation at all, by design.)
- Feature docs are the data/interface contract — `landing-page-template.md`'s entity shape
  and edge cases are not optional. (Applies.)
- Business logic lives in `lib/`, never inline in a route handler/component beyond calling
  into `lib/` and rendering the result. (Applies.)
- Every entity field named in the feature doc's "Data requirements" maps to a Prisma field of
  the same name. (Applies — confirm/add the `landing_page` model in `prisma/schema.prisma` if
  it doesn't already exist from an earlier task's schema pass.)
- Fee amounts as structured min/max + scope cap, never a single number. (Not applicable — no
  fee data on this entity.)
- Content the firm can change lives in the database, edited via `/admin`. (Applies to the
  `landing_page` fields themselves; the admin *editor* screen for landing pages is a later
  Milestone 7 task, not this one — this task only needs the row to exist and render, seeded
  directly for now if no admin editor exists yet.)
- Diagnostic scoring config as data, not logic. (Not applicable — no diagnostic content here.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Applies to the CTA control at minimum.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Applies —
  see Architecture constraints above.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies if any client-side interactivity is added to this page.)
- The shared generic `page` entity pattern (hero_kicker/hero_heading/hero_lead/meta_title/
  meta_description). (Not applicable — `landing_page` is its own dedicated entity per the
  feature doc, not the generic `page` entity; don't conflate the two.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD.
  (Applies.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not this
  task's job to wire the actual GTM tags — that's T5.3 — but the CTA's destination page
  (diagnostic, checklist download, or enquiry route) already fires its own event on arrival;
  this task's CTA is a plain link/button to that destination, nothing new to instrument here.)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.2
in its "Paste This to Continue" block, then stop. Do not begin the next task in this same
session.
```
