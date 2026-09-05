# Session 04 — shadcn/ui + Base UI component scaffold

# Date: 2026-09-05

# Tasks completed: T1.4

## What Was Built

Installed shadcn/ui generated on Base UI (not Radix), per ADR 0010, and generated all 21
foundation-layer primitives named in `ui/components.md` (plus `label`/`field` in place of the
registry's now-empty "form" entry) restyled against the T1.3 token layer with zero
per-component colour overrides. Built `app/dev/component-scaffold/page.tsx` exercising one
themed instance of every primitive, and verified it for real with Chrome browser automation —
screenshots plus interactive clicks/hovers on every interactive primitive (Dialog,
AlertDialog, DropdownMenu, Popover, Tooltip, Select, Sonner) — catching and fixing two real
Base UI composition bugs along the way (Select label display, DropdownMenu group
requirement).

## Files Changed

- `app/globals.css` — added `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"`
  (Base UI's required `data-open`/`data-closed`/etc. animation variants); added
  `* { @apply border-border outline-ring/50; }` to the base layer; all T1.3 colour/radius
  values unchanged
- `components.json` — new: shadcn CLI config (`style: base-nova`, `base: base` (Base UI),
  `iconLibrary: lucide`, `@/` aliases matching `tsconfig.json`)
- `components/ui/*.tsx` — new: 23 generated files — `button`, `input`, `textarea`, `select`,
  `checkbox`, `radio-group`, `switch`, `card`, `dialog`, `alert-dialog`, `accordion`, `tabs`,
  `badge`, `table`, `avatar`, `tooltip`, `dropdown-menu`, `popover`, `progress`, `separator`,
  `sonner`, `label`, `field`
- `lib/utils.ts` — new: `export { cn } from "cn"`
- `app/dev/component-scaffold/page.tsx` — new: the acceptance-criteria test page
  (`/dev/component-scaffold`)
- `package.json` / `package-lock.json` — added `@base-ui/react`, `class-variance-authority`,
  `cn`, `lucide-react`, `next-themes`, `shadcn`, `sonner`, `tw-animate-css` as dependencies;
  `eslint` re-verified still pinned to `^9.39.5` (bumping to `^10` was tried and reverted —
  see Decisions Made / `memory/technical-debt.md`)
- `app/layout.tsx` — untouched (the shadcn CLI's Geist-font edit to this file was reverted
  before being committed)
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — updated
  for the T1.4 work itself
- `memory/technical-debt.md` — follow-up pass (two more commits, same session): fixed two
  entries (ESLint 9→10, Prisma npm-audit) that had drifted into an orphaned
  `Sequenced into: None yet` state after their T1.4 re-check, contrary to CLAUDE.md's rule
  that this is a temporary state only, never a final one; and converted the undated
  "Anticipated" placeholder (the `content-management-admin.md` two-partner simultaneous-edit
  simplification) into a real, fully-fielded entry at the user's explicit request, rather
  than waiting for T7.2/T7.3 implementation as the feature doc originally planned
- `docs/tasks/03-diagnostic.md` — added a session-04 addendum to T3.2 re-checking the ESLint/
  Prisma debt items (T3.2 is the next confirmed `package.json` touch after T1.4)
- `docs/tasks/07-content-admin.md` — added session-04 addenda to both T7.2 and T7.3 pointing
  at the last-write-wins debt entry, so whichever session builds those editors makes a
  conscious, recorded call rather than the limitation landing silently

## Decisions Made

- Ran `shadcn init` with the `nova` preset (no non-interactive way to skip preset selection),
  then discarded every colour/font choice it made in favour of T1.3's already-verified
  tokens — kept only its two genuinely new structural CSS imports. See decision-log.md.
- Used shadcn's `field` component (Field/FieldLabel/FieldDescription/FieldError/FieldGroup)
  in place of `ui/components.md`'s "Form" — the registry's `form` entry is now an empty
  placeholder; `field` is Base UI's documented replacement for the same role. See
  decision-log.md.
- Composed all triggers (Dialog/AlertDialog/Popover/Tooltip/DropdownMenu) with Base UI's
  `render={<Button .../>}` prop, not Radix's `asChild` — Base UI doesn't support `asChild`
  at all (`tsc` rejects it). See decision-log.md.
- Re-attempted the ESLint 9→10 bump (per T1.4's addendum): the peer-range warning from T1.1
  is gone, but `eslint@10` now crashes `npm run lint` outright with a real `TypeError` inside
  `eslint-plugin-react`. Reverted to `eslint@^9.39.5`. Re-checked the Prisma CLI npm-audit
  debt too — no patched release exists yet, left open. Both technical-debt entries updated
  with the concrete re-check findings rather than left stale.
- Follow-up (user-flagged, same session): both of those re-checked entries had been left with
  `Sequenced into: None yet`, which CLAUDE.md's memory rules treat as a bug in the memory
  system itself if it's the final state. Grepped `docs/tasks/*.md` for the next real
  `package.json` touch after T1.4 (T3.2 — already installing Vitest per an existing debt
  entry) and re-sequenced both into it with a real addendum.
- Follow-up (user-flagged, same session, separate request): converted the undated
  "Anticipated" placeholder at the bottom of `memory/technical-debt.md` (the
  `content-management-admin.md` last-write-wins simplification) into a real dated entry now,
  at the user's explicit instruction, rather than leaving it for T7.2/T7.3 implementation
  time as the feature doc originally specified. Sequenced into both T7.2 and T7.3 with
  addenda in `docs/tasks/07-content-admin.md` — the entry requires a conscious decision at
  that point, not a mandatory fix, since the feature doc already accepts last-write-wins for
  Phase 1.

## Current State

All 21 `ui/components.md` foundation-layer primitives are generated, themed correctly against
the Kaalbert palette with no hand-patched colours, and verified working (including
interactive states) on the `/dev/component-scaffold` scratch page. Three commits this
session (`f3ad0e5` T1.4 itself, `98a3b48` and `b484736` the two memory/docs follow-ups above).
`npm run lint`, `npm run format:check`, and `npm run typecheck` all re-verified passing clean
across the whole tree as of the last commit; working tree is clean; no dev server left
running. Every open `memory/technical-debt.md` entry with a real fix now has a concrete
`Sequenced into:` target backed by an actual addendum in the named task file (spot-checked
this session — no orphaned entries remain). Ready for T1.5 to build the real
SiteHeader/SiteFooter/admin-shell components on top of this primitive layer.

## Blockers

None. Playwright MCP (`.mcp.json`'s `verification` server) is still not connected in this
session — same gap noted in the T1.3 session file — so real-browser verification was done via
`claude-in-chrome` browser automation instead, per CLAUDE.md's explicit fallback allowance.
This does not block T1.4 or any future task; it only means a human should restart the
session and approve the MCP prompt at some point to get the originally-intended tool back.

## Next Task

T1.5 — Shared layout shell: SiteHeader, SiteFooter, admin shell skeleton
File: docs/tasks/01-foundation.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/01-foundation.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T1.5 — Shared layout shell: SiteHeader, SiteFooter, admin shell skeleton

## What to build
`SiteHeader` and `SiteFooter` (per `ui/components.md`, built to the mockups' header/footer
markup exactly, including the nav-dropdown fee hint reading `offer.fee_amount_min`), plus an
empty authenticated-shell layout for `/admin` (sidebar nav frame only, no auth yet — that's
Milestone 6).

## Input → Output contract
`ui/mockups/a-public-site/*.html` header/footer markup + `ui/components.md` → two shared
layout components used by every subsequent public page task, and one admin shell layout used
by every subsequent admin page task.

## Acceptance criteria
SiteHeader/SiteFooter render identically (structure, spacing, nav items) to the mockup on at
least two different mockup pages; admin shell renders the sidebar nav frame with placeholder
content area.

## Size / Dependencies
M, depends on: T1.4 (provides the themed shadcn/Base UI primitive layer this task's
`SiteHeader` nav dropdown is built on — specifically `DropdownMenu` for the "Core Offers"
nav item, restyled and verified working in the previous session at
`app/dev/component-scaffold/page.tsx`).

## Architecture constraints
- ADR 0010 (styling/components): build `SiteHeader`'s Core Offers nav dropdown using the
  `DropdownMenu` primitive from `components/ui/dropdown-menu.tsx` (Base UI, not a hand-rolled
  dropdown) — remember it renders Base UI's `Menu.Root`/`Menu.Group` under the hood, so any
  `DropdownMenuLabel` must be wrapped in `DropdownMenuGroup` or it throws
  `MenuGroupContext is missing` at runtime (a real bug hit and fixed in the T1.4 session,
  see `memory/decision-log.md`). Any trigger composition (if you wrap a custom element as a
  dropdown/tooltip trigger) uses Base UI's `render={<Element />}` prop, not Radix's `asChild`
  (Base UI doesn't support `asChild` — `tsc` will reject it).
- **The `offer.fee_amount_min` nav-dropdown fee hint cannot be a live database read yet.**
  `prisma/schema.prisma` has no models at all (T1.2 deliberately left it empty — entities are
  added incrementally, epic by epic). The `Offer` entity (with `fee_amount_min`/
  `fee_amount_max`) isn't built until T2.2 (`docs/tasks/02-public-presentation.md`). Match
  the mockup's markup and copy exactly (hard-coded per-offer fee text, matching what
  `ui/mockups/a-public-site/home.html`'s nav dropdown actually shows) rather than attempting
  a Prisma query against a table that doesn't exist — do not invent a placeholder schema
  model to unblock this; that's T2.2's job. Note the hard-coded value clearly (e.g. a short
  comment or a named constant) so T2.2 knows exactly where to wire the real data through.
- **The mockups are authoritative.** Both `SiteHeader` and `SiteFooter` must be built to
  `ui/mockups/a-public-site/*.html`'s actual header/footer markup and copy — don't invent
  layout or nav items beyond what's there. Cross-check against at least two mockup pages
  (e.g. `home.html` and `about.html`) since the acceptance criteria requires identical
  structure/spacing/nav items across pages, not just one.
- **Admin shell has no dedicated mockup file for the shell itself** — infer the
  sidebar-plus-content-area frame from `ui/mockups/g-admin-content/admin-dashboard.html`,
  per `ui/screen-inventory.md`'s note that this screen "establishes the sidebar-plus-
  content-area shell every other admin screen inherits" (screen #25). Build only the frame
  (sidebar nav + placeholder content area) — no real admin content, no auth enforcement
  (that's Milestone 6 / `docs/tasks/06-admin-auth.md`).
- `SiteFooter` reads Site Settings (phone/WhatsApp/email/address/response-time) per
  `ui/components.md` — but like the offer fee hint, there is no `site_settings` table yet
  (that's a later content-management-admin task). Hard-code the mockup's actual contact
  values for now, structured so a future task can swap in a live database read without
  restructuring the component (e.g. accept the values as props rather than hard-coding them
  inline in JSX, even though the caller passes literals today).
- `ScopeOfPracticeNote` (embedded in `SiteFooter` per `ui/components.md`) should be a small
  extracted piece even in this task, since `ui/components.md` lists it as its own composite
  component reused elsewhere (`legal-and-compliance-pages.md`) — don't inline its copy
  directly into `SiteFooter` where it can't be reused later.
- Accessibility: WCAG 2.1 AA (NFR-2) — the nav dropdown and any interactive nav element must
  keep the Base UI-supplied focus management/ARIA/keyboard behaviour from the underlying
  `DropdownMenu` primitive intact; don't strip it while matching mockup visuals.
- CLAUDE.md Quality Gates: `npm run lint`, `npm run format:check`, `npx tsc --noEmit` (via
  `npm run typecheck`, not bare `tsc`, per the Next.js 16 typed-routes note) must all stay
  passing across the whole tree.
- CLAUDE.md Git Commit Protocol: commit only after every Task Completion Checklist item
  passes; commit message format `feat(T01-05): <description>` (this task adds real,
  user-facing layout components, not just scaffolding — use `feat`, not `chore`); never push
  directly — a human pushes manually after `git log --oneline` review.
- This task has no database/schema surface of its own (see the hard-coded-values note
  above) — don't add Prisma models as part of this task.

## Relevant ADRs
ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first + shadcn/
ui generated on Base UI (not Radix) + Lucide icons; this task is the first to compose the
T1.4 primitive layer into real, reusable feature components (`SiteHeader`/`SiteFooter`/admin
shell) rather than a scratch test page.

## Relevant feature specification
No single feature specification governs this task directly — `SiteHeader`/`SiteFooter`/
`ScopeOfPracticeNote` are shared/global composite components per `ui/components.md`'s
"Composite components — Phase 1 (shared / global)" table, consumed by nearly every later
feature doc (`home-page.md`, `core-offer-pages.md`, `contact-and-enquiry.md`,
`legal-and-compliance-pages.md`, and more) rather than owned by one of them. The admin shell
similarly has no owning feature doc yet — `content-management-admin.md` and
`enquiry-management.md` will build real content into it later, but this task only builds the
empty frame.

## Mockup / UI reference
`ui/mockups/a-public-site/*.html` — use at least two pages (e.g. `home.html` and
`about.html`) to confirm SiteHeader/SiteFooter markup, spacing, and nav items are identical
across pages, per the acceptance criteria. For the admin shell: no dedicated mockup — infer
the sidebar-plus-content-area frame from `ui/mockups/g-admin-content/admin-dashboard.html`
per `ui/screen-inventory.md`'s "Can be inferred" mapping (screen #25, "establishes the
sidebar-plus-content-area shell every other admin screen inherits") — build only the frame
shown there, not the dashboard's actual content.

## Coding standards
- The mockups are authoritative for UI tasks. (applies directly — see Architecture
  constraints above)
- Feature docs (`docs/features/*.md`) are the data/interface contract. (not directly
  applicable — no single feature doc owns these shared components, see "Relevant feature
  specification" above; the components must still be built so later feature docs' data needs
  — `offer.fee_amount_min`, Site Settings fields — can be wired in without restructuring)
- Business logic lives in `lib/`, never inside a route handler or component. (not applicable
  — this task is pure layout/presentation, no business logic)
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name. (not applicable — no schema work in this task; see
  the hard-coded-values note above for why `fee_amount_min`/Site Settings fields aren't wired
  to a real database yet)
- Fee amounts are always a structured min/max band with a scope cap. (partially applies —
  the nav dropdown only shows a "from" minimum per `ui/components.md`'s description of the
  fee hint; don't invent a full min/max display here, just match what the mockup's nav
  dropdown actually shows)
- Content the firm can edit lives in the database, edited via `/admin`. (not yet applicable —
  no `/admin` content editing exists until Milestone 7; hard-code mockup values for now per
  the notes above, structured for an easy future swap)
- Diagnostic scoring configuration is data, not logic. (not applicable — no diagnostic
  surface in this task)
- Accessibility WCAG 2.1 AA via Base UI primitives. (applies — see Architecture constraints
  above)
- Content the firm can edit lives in the database, read live by every surface that displays
  it (Site Settings singleton pattern). (not yet applicable this task, but design
  `SiteFooter`'s props so this pattern can be wired in later without restructuring — see
  Architecture constraints)
- The "one nav entry, second screen via inline link" pattern. (not applicable — no
  subordinate-screen navigation in this task)
- The shared generic `page` entity for marketing-page copy. (not applicable — no database
  entities in this task)
- Every public page type carries `meta_title`/`meta_description` + OG/Twitter/JSON-LD. (not
  applicable — `SiteHeader`/`SiteFooter`/admin shell are layout components, not page types;
  metadata is each page's own responsibility in later tasks)
- Every conversion moment fires through the GTM `dataLayer` pattern. (not applicable — no
  conversion surface in this task; `WhatsAppLinkButton` if used in the footer is a later
  composite component, not built here)

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
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T1.6 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
