# Session 05 — Shared layout shell, made responsive from the start

# Date: 2026-09-05

# Tasks completed: T01-05

## What Was Built

`SiteHeader`, `SiteFooter`, `ScopeOfPracticeNote`, and an empty authenticated `/admin` shell
(sidebar + placeholder content area), matching `ui/mockups/a-public-site/*.html`'s header/
footer markup exactly (confirmed byte-identical across every public mockup page). Mid-task,
the user required responsive design to be built in from every component's first
implementation rather than deferred, and specifically that the public-site mobile nav be a
side-sliding drawer, not a top-dropping panel — both were implemented immediately and codified
as a new standing CLAUDE.md rule, and the same side-drawer pattern was applied to the admin
shell's mobile nav too.

## Files Changed

- `components/site-header.tsx` — new: `SiteHeader`. Desktop (`lg:` and up): inline nav +
  Core Offers `DropdownMenu` (Base UI `Menu.Root`) + accent CTA, transparent-over-hero →
  solid-on-scroll toggle. Below `lg`: hamburger opening a right-sliding drawer built directly
  on Base UI's Dialog primitive (Core Offers flattened to a list, then nav links, then the
  CTA, each closing the drawer via `DialogClose` on click).
- `components/site-footer.tsx` — new: `SiteFooter` + `FooterLinkColumn`, `addressLine1`/
  `addressLine2`/`phonePrimary` as props (not hard-coded) for a future `site_settings` read,
  `grid-cols-2 md:grid-cols-4` responsive from the start.
- `components/scope-of-practice-note.tsx` — new: `ScopeOfPracticeNote`, extracted since
  `legal-and-compliance-pages.md` reuses it separately from `SiteFooter`.
- `components/admin-sidebar-nav.tsx` — new: `AdminSidebarNav`, shared between the persistent
  desktop sidebar and the mobile drawer via an optional `onNavigate` prop.
- `components/admin-mobile-sidebar.tsx` — new: `AdminMobileSidebar`, mobile-only topbar +
  left-sliding off-canvas drawer (left, matching the sidebar's own docked edge) for the admin
  shell, added mid-task alongside the responsive-design rule.
- `app/admin/layout.tsx` — new: the admin shell frame — `hidden lg:flex` persistent sidebar +
  `AdminMobileSidebar` below `lg`, placeholder content area.
- `app/admin/page.tsx` — new: placeholder dashboard content.
- `app/dev/layout-shell/home/page.tsx`, `app/dev/layout-shell/about/page.tsx` — new: scratch
  verification pages (T1.3/T1.4's `/dev/*` pattern) exercising SiteHeader/SiteFooter in two
  page contexts for the acceptance criteria.
- `CLAUDE.md` — new "Responsive is built in from a component's first implementation" rule
  under Code Conventions and Standards (with the side-drawer mobile-nav convention named
  explicitly), plus a matching Task Completion Checklist line.
- `docs/tasks/02-public-presentation.md` — T2.2's route corrected `/services/[slug]` →
  `/offers/[slug]` (found while checking my hardcoded nav hrefs against every doc that names
  this route — see Decisions Made).
- `memory/completed-work.md`, `memory/decision-log.md` — this session's entries.

## Decisions Made

- **Responsive made a standing rule, not a one-off ask** — added to CLAUDE.md rather than
  just fixed in this task's own components, since it changes how every future UI task must be
  built. See `memory/decision-log.md`.
- **Mobile nav breakpoint set at `lg` (1024px)** — an engineering judgement call, not read off
  any mockup (none of them address a narrower viewport at all): six nav items + a dropdown +
  a long CTA label don't fit comfortably below that width.
- **Admin mobile drawer slides from the left, public nav drawer slides from the right** — each
  matches the edge its persistent/trigger element is docked to (sidebar's home edge vs. the
  hamburger's position in the header), not a single arbitrary direction applied everywhere.
- **Base UI `nativeButton={false}` required on every `DialogClose` rendered as a `Link`** — a
  real bug (Next's dev overlay surfaced a console error) found and fixed while building the
  drawers. See `memory/decision-log.md` for the full mechanism (`NativeButtonProps` vs.
  `NonNativeButtonProps` default oppositely).
- **Fixed a route-naming inconsistency**: `docs/tasks/02-public-presentation.md`'s T2.2 said
  `/services/[slug]`; every other doc (the feature spec's own API contract included) says
  `/offers/[slug]`. Corrected T2.2 rather than leaving a future 404 mismatch with this
  session's hardcoded nav links.
- **Sandbox couldn't literally resize the browser below ~1600px** (`resize_window` capped) —
  verified the `lg`/`md` breakpoints two ways instead: reading the live compiled CSS's actual
  `@media` rules, and temporarily forcing the mobile-layout branch visible at full width to
  interact with it for real (both drawers opened, clicked through, confirmed navigation +
  auto-close, confirmed zero console errors). See `memory/completed-work.md`'s Notes for the
  full method.

## Current State

T1.5 is complete, including the mid-task responsive-design addition; Milestone 1 (Foundation)
has one task left (T1.6). `SiteHeader`/`SiteFooter`/the admin shell are ready for every later
public/admin page task to consume without re-deriving layout or responsive behaviour.

## Blockers

None.

## Next Task

T1.6 — Environment/secrets and GTM container stub
File: docs/tasks/01-foundation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/01-foundation.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T1.6 — Environment/secrets and GTM container stub

## What to build
Environment variable convention for secrets (DB URL, future gateway/API keys) via Railway's
env management; an empty GTM container (ADR 0006) loaded on every public page, ready for
Milestone 5 to populate with real tags.

## Input → Output contract
Railway project → documented env-var convention in the README; GTM snippet present in
`<head>`/`<body>` of the root layout, container ID present but no tags configured yet.

## Acceptance criteria
GTM Preview mode confirms the container fires on page load with zero tags active (no
premature/placeholder events sent).

## Size / Dependencies
S, depends on: T1.1 (provides the deployed Next.js app and root `app/layout.tsx` this task's
GTM snippet is added to — the app currently still has `app/layout.tsx` scaffolded by T1.1/T1.3
with no head/body script wiring yet, and no route group split between public/admin layouts).

Note: this task does NOT depend on T1.5 (Shared layout shell) even though T1.5 built the
first real composite components (`SiteHeader`/`SiteFooter`) and the `/admin` shell — the GTM
snippet belongs in the root `app/layout.tsx` (every route, public and admin alike), not inside
`SiteHeader`/`SiteFooter` themselves, so it is independent of how T1.5's components are
composed into pages later.

## Architecture constraints
- **Never a hard-coded measurement/advertising tag outside GTM** (Document 13.03, Section
  11.1 — an explicit, contractual requirement, not a style preference, restated in CLAUDE.md's
  "Things NOT to Do"). This task adds the GTM container itself, with zero tags configured
  inside it — do not also wire a direct GA4/Meta/Ads snippet anywhere as a "quick way to
  test"; verification is via GTM's own Preview mode only.
- **Every conversion moment fires through the existing GTM `dataLayer` pattern** (CLAUDE.md
  Recurring Patterns) — the six fixed events (diagnostic started/completed, summary requested,
  checklist downloaded, enquiry submitted, WhatsApp opened) are Milestone 5's job
  (`docs/tasks/05-landing-and-measurement.md`), not this task's. T1.6 only installs the empty
  container and the standard GTM bootstrap snippet (the `<head>` script + the no-script
  `<body>` iframe fallback) — no `dataLayer.push(...)` calls anywhere yet.
- **Content the firm can change lives in the database, never hard-coded** — the GTM container
  ID itself is a deployment secret/config value (`GTM_CONTAINER_ID`), not firm-editable
  content, so it belongs in environment variables (this task's own scope), not a database
  field.
- Standard env-var convention: `.env.local` (local dev, gitignored, loaded first),
  `.env.production` (local production-build testing only, gitignored, never read by the
  deployed app), Railway service variables (source of truth for the deployed app) — same
  three-tier pattern T1.2 already established for `DATABASE_URL`
  (`memory/decision-log.md`'s "Postgres password exposure and rotation" entry has the
  precedent and the exact precedence order `prisma7.config.ts` follows). Extend the same
  convention to `GTM_CONTAINER_ID`, not a parallel one.
- CLAUDE.md Quality Gates: `npm run lint`, `npm run format:check`, `npx tsc --noEmit` (via
  `npm run typecheck`, not bare `tsc`, per the Next.js 16 typed-routes note) must all stay
  passing across the whole tree.
- CLAUDE.md Git Commit Protocol: commit only after every Task Completion Checklist item
  passes; commit message format `chore(T01-06): <description>` (environment/config wiring —
  `chore`, not `feat`); never push directly — a human pushes manually after
  `git log --oneline` review.
- **Never commit a real `GTM_CONTAINER_ID` value or any other secret to `.env.example`** —
  placeholder values only, per CLAUDE.md's "What never gets committed" section
  (`.env`/`.env.local`/`.env.production` are all gitignored already, from T1.2).

## Relevant ADRs
ADR 0006 — docs/adr/0006-gtm-measurement-container.md — Google Tag Manager is the single
measurement container (GA4, Meta pixel, Google Ads, LinkedIn Insight Tag all live as GTM tags
inside it, fed by hand-written `dataLayer` pushes) — no tag is ever hard-coded into the theme
outside GTM. This task installs the empty container that decision depends on; it does not
configure any of the tags themselves.

## Relevant feature specification
`docs/features/measurement-and-attribution.md` is the eventual owner of everything GTM will
carry (the six `dataLayer` events, campaign-parameter persistence, server-side Conversions
API) — but that entire feature is Milestone 5 scope
(`docs/tasks/05-landing-and-measurement.md`), not this task's. T1.6 only reaches the point
that feature doc's own prerequisite assumes: "a single tag management layer" physically
present on every page with nothing plugged into it yet. Do not implement any part of that
feature doc's actual event list in this task.

## Mockup / UI reference
Not applicable — this task has no UI surface. The GTM snippet is inserted into
`app/layout.tsx`'s `<head>` and immediately after the opening `<body>` tag; it renders nothing
visible and does not touch any mockup-derived markup (including T1.5's `SiteHeader`/
`SiteFooter`, which this task does not modify).

## Coding standards
- The mockups are authoritative for UI tasks. (not applicable — no UI surface in this task)
- Responsive is built in from a component's first implementation. (not applicable — no UI
  surface; if it becomes relevant later, the GTM snippet itself has no layout to be responsive)
- Feature docs are the data/interface contract. (partially applies — see "Relevant feature
  specification" above: this task deliberately stops short of implementing
  `measurement-and-attribution.md`'s actual contract, it only prepares the container that
  contract will plug into later)
- Business logic lives in `lib/`, never inside a route handler or component beyond what's
  needed to call into `lib/` and render the result. (not applicable — no business logic in
  this task; the GTM snippet is a static script tag, not application logic)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (not applicable — no schema work in this task)
- Fee amounts are always a structured min/max band with a scope cap. (not applicable)
- Content the firm can change lives in the database, edited via `/admin`. (not applicable to
  the container ID itself — see Architecture constraints above for why it's an env var, not a
  database field; does not conflict with the rule since a GTM container ID is deployment
  config, not firm-editable page content)
- Diagnostic scoring configuration is data, not logic. (not applicable)
- Accessibility WCAG 2.1 AA via Base UI primitives. (not applicable — no interactive UI in
  this task)
- The "one nav entry, second screen via inline link" pattern. (not applicable)
- The shared generic `page` entity for marketing-page copy. (not applicable)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable to this task — that's each page task's own responsibility, e.g. T2.1)
- **Every conversion moment fires through the existing GTM `dataLayer` pattern.** (applies as
  a forward constraint: this task must not add any `dataLayer.push` calls itself, but must
  install the container correctly so Milestone 5's six events have somewhere to plug into
  without re-architecting the snippet placement)
- Never a hard-coded measurement/advertising tag outside GTM. (applies directly — see
  Architecture constraints above)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T2.1 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
