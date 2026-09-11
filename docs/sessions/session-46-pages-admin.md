# Session 46 — Pages Admin (Capabilities, Our Method, Legal & Footer)

# Date: 2026-09-11

# Tasks completed: T7.3

## What Was Built

Three admin screens under `/admin/pages`: a simple list linking out to Capabilities and Our
Method editors plus an inline link to a combined Legal Pages & Footer screen (the "one nav
entry, second screen via inline link" pattern, same as T7.2's Categories). Capabilities and
Our Method each edit hero fields plus their fixed repeating section (eight `capability` rows,
four `method_stage` rows) in place — no add/remove, per those features' own "exactly
eight"/"all four" business rules. The Legal screen lets a partner pick any of the four fixed
`legal_page` rows, edit its title/meta/body blocks, and toggle its "Draft — pending legal
review" marker themselves for the first time; a second panel edits the shared `footer_content`
singleton. New `lib/admin-pages.ts` and `lib/admin-legal.ts` hold all business logic.

## Files Changed

- `lib/admin-pages.ts`, `lib/admin-pages.test.ts` — Capabilities/Our Method read+update.
- `lib/admin-legal.ts`, `lib/admin-legal.test.ts` — Legal pages/footer read+update.
- `app/admin/(shell)/pages/page.tsx` — Pages list.
- `app/admin/(shell)/pages/capabilities/page.tsx`, `capabilities-editor-form.tsx`.
- `app/admin/(shell)/pages/our-method/page.tsx`, `our-method-editor-form.tsx`.
- `app/admin/(shell)/pages/legal/page.tsx`, `legal-admin-client.tsx`, `legal-block-editor.tsx`.
- `app/api/admin/pages/capabilities/route.ts`, `app/api/admin/pages/our-method/route.ts`,
  `app/api/admin/legal/[slug]/route.ts`, `app/api/admin/footer-content/route.ts`.
- `docs/features/content-management-admin.md` — Interfaces section updated to name the real
  routes built (two purpose-built routes, not the originally-sketched generic one).
- `memory/decision-log.md`, `memory/completed-work.md` — T7.3 entries.
- `docs/user-guide.md` — Public website pages section rewritten; also caught and fixed a
  real drift left over from T7.2 (an Artifact-only edit that never made it into this file);
  Artifact mirror republished (version 6).

## Decisions Made

- **No add/remove on `capability`/`method_stage` rows** — both are fixed-count by their own
  feature docs' business rules ("exactly eight"/"all four"). Materially simpler than T7.2's
  open-ended article body editor, despite both being "repeating sections on a page editor."
- **`Capability.slug` and `MethodStage.name`/`order` render read-only** — `slug` is
  `lib/contact.ts`'s live `/contact?service=[slug]` lookup key; `method_stage`'s name/order
  represent the firm's actual fixed method sequence, not an arbitrary display order.
- **The 10.05 compliance checkbox gates the Save action itself for Capabilities/Our Method**
  — `Page`/`Capability`/`MethodStage` have no draft/live distinction at all, so there's no
  separate Publish step the way Articles have one; the one save that exists _is_ the publish
  moment.
- **No compliance checkbox on Legal pages/footer_content** — a different real review process
  (the existing `isPlaceholder` marker), not FR-5.4's marketing-claims gate.
- **`LegalPage.lastRevisedAt` set only when a save leaves `isPlaceholder: false`** — the
  field means "genuinely legally reviewed," not "last edited."
- **`AdvisoryRetainer` explicitly out of scope** — `capabilities-page.md` itself names it as
  T7.4's (Offers) responsibility, not this task's, despite appearing on the same public page.
- **A new, small `LegalBlockEditor`** rather than generalizing T7.2's `block-editor.tsx` —
  `LegalPageBlock`'s kind set differs from `ArticleBodyBlock`'s; duplicating the small
  add/move/remove mechanics was judged lower-risk than refactoring shipped article-editor
  code for a one-time reuse.
- **Two purpose-built PATCH routes** instead of the feature doc's originally-sketched generic
  `PATCH /api/admin/pages/[id]` — each compound-updates a `page` row with its own linked
  repeating section; feature doc updated to match.
- **Last-write-wins shipped as documented** (this task's own session-04 addendum, decided
  independently of T7.2) — same Phase-1 acceptance as `content-management-admin.md`'s edge
  case already covers.

Full reasoning in `memory/decision-log.md` (T7.3, session 46).

## Current State

Milestone 7 has 3 of 10 tasks done (dashboard, Articles/Categories, Pages). Verified for real
via Playwright MCP against the live dev database: edited a real Capability and confirmed
`/capabilities` updated with no deploy; loaded Our Method against all four real stages; loaded
Legal against all four real pages including Scope of Practice's real non-placeholder content
(every `LegalPageBlock` kind, including the table sub-editor, rendering and editing
correctly); toggled a legal page's draft status live and confirmed the public page responded;
saved real footer content. Every test change reverted afterward via direct query. All four
new screens checked at mobile/tablet/desktop, no page-level horizontal scroll anywhere.

## Blockers

None for T7.4. No new technical debt from this session — the one pre-existing gap this task
touches (`footer_content` not yet wired into the public `SiteFooter`) was already tracked and
already sequenced into a later Milestone 7 task before this session began.

## Next Task

T7.4 — Offer editor (fee bands, FAQs, and full field set)
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task T7.4 — Offer editor (fee bands, FAQs, and full field set)

## What to build
`ui/mockups/g-admin-content/admin-offer-editor.html` as fixed this session — the full FR-4.1
field set in order: problem statement, who_for/who_not_for, deliverables, client_inputs,
indicative_timeline, structured fee band (`fee_amount_min`/`fee_amount_max`/currency/
scope_cap — never free text, never publishable without the scope cap), FAQs, CTA label. Same
structured-fee discipline applies to Advisory Retainer.

## Input → Output contract
Offer form submission → `offer` row; save propagates to the same field everywhere it's read
(the nav fee-hint in `SiteHeader` reads the same `fee_amount_min` — one save updates both
places, no second copy).

## Acceptance criteria
A fee update saved here is reflected in both the offer page (T2.2) and the nav dropdown
fee-hint in the same request cycle, verified in browser; the API rejects a
fee_amount_min/max submitted without scope_cap; FAQs render in the editor and on the public
page in the same order.

## Size / Dependencies
M, depends on: T6.3 (login + session management — this task builds inside the already-secured
`/admin` shell), T2.2 (the three core `offer` rows and their `offer_tier` rows this task
edits already exist and are seeded).

## Architecture constraints
- Business logic lives in `lib/`, never inside the route/page component — write offer/tier/
  Advisory Retainer read/update logic as `lib/` functions. Likely a new `lib/admin-offers.ts`
  (mirror T7.3's `lib/admin-pages.ts` naming), keeping the public-facing `lib/offers.ts` and
  `lib/capabilities.ts` (which already has `getAdvisoryRetainer`) as read-only as they are
  today — same split T7.2/T7.3 already established between public read-side files and new
  admin-specific write-side files.
- **The `Offer` model has two real shapes, not one**: a single-tier offer (Financial Clarity
  Pack, Funding-Readiness Pack) uses its own top-level `deliverables`/`clientInputs`/
  `indicativeTimeline`/`feeAmountMin`/`feeAmountMax`/`feeCurrency`/`scopeCap` fields directly,
  with an empty `tiers` relation; Business Health Check instead has real `OfferTier` rows
  (each with its own name/durationLabel/scopeLabel/scopeCap/fee fields/deliverables/
  clientInputs/sortOrder/isFeatured) and its own top-level fee/deliverables/clientInputs
  fields go unused. Read `prisma/schema.prisma`'s `Offer`/`OfferTier` model doc-comments in
  full before designing this editor's form — a single form that assumes only one shape will
  be wrong for Business Health Check specifically. `methodStages` (`Json`, `{title,
  description}[]`) and `faqs` (`Json`, `{question, answer}[]`) are both ordered block-like
  arrays similar in spirit to T7.2/T7.3's block editors, but with fixed, simple field sets
  per item — a repeating add/remove/reorder list of small forms, not a `kind`-discriminated
  union like `ArticleBodyBlock`/`LegalPageBlock`.
- **The fee band is never publishable without `scope_cap`** (CLAUDE.md's own explicit,
  repeated rule, "fixed once already during planning specifically because it was wrong as a
  single field") — validate this server-side in `lib/admin-offers.ts`, not only via a
  disabled-until-filled client-side field.
- **Advisory Retainer editing lives on this same screen** (`capabilities-page.md`'s own Data
  requirements section: "Edited via `content-management-admin.md`'s Offers content area,
  alongside the three core offer fee bands") — not a separate page, not `/admin/pages`. It's
  a singleton (`AdvisoryRetainer`: feeAmount/feeCurrency/billingPeriod/description, a single
  recurring fee not a band) — a smaller, structurally distinct form from the three real
  offers, likely its own small panel on this screen (mirror T7.3's Legal-page-plus-footer
  "combined screen, two panels" shape).
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.**
- **Never let a `"use client"` component import a value from a `lib/` file that also imports
  `@/lib/prisma`.**
- Accessibility: WCAG 2.1 AA — use Base UI primitives (`components/ui/*`), matching T7.2/
  T7.3's own component choices.
- Responsive from first implementation — mobile (~375–430px), tablet (~768px), desktop.

## Relevant ADRs
- ADR 0010 — docs/adr/0010-styling-and-component-stack.md — Tailwind CSS v4 CSS-first +
  shadcn/ui on Base UI + Lucide icons; use existing design tokens and `components/ui/*`
  primitives.

## Relevant feature specification
- docs/features/content-management-admin.md — "User flow" step 5 (update a fee range) and
  its Business rules (fee structured-field discipline; the nav fee-hint reads the same field
  the offer page does, "not a second, separately-edited copy").
- docs/features/core-offer-pages.md — the full `offer`/`offer_tier` field set and business
  rules (FR-4.1's field list, the tiered-vs-single-tier distinction, FAQ ordering, the
  out-of-scope note).
- docs/features/capabilities-page.md — `advisory_retainer`'s field set and its explicit
  "edited via the Offers content area" placement.

## Mockup / UI reference
`ui/mockups/g-admin-content/admin-offer-editor.html` — "as fixed this session" per this
task's own "Build" line, referring to `docs/dashboard.md`'s pre-Phase-6 audit note that this
mockup was found missing five real fields (`who_for`/`who_not_for`/`client_inputs`/
`indicative_timeline`/`faqs`) and was corrected before Phase 6 planning finished — the
mockup file itself should already reflect the full real field set, unlike T7.2/T7.3's
mockups which needed fresh gap-fixing during the build itself. Confirm this by reading the
mockup directly rather than assuming; if it still doesn't show a field this task's own
"Build" line names, treat that the same way T7.2/T7.3 treated their own mockup gaps (add the
missing field, note the fix in `memory/decision-log.md`). No dedicated mockup exists for the
Advisory Retainer panel — infer a small singleton form consistent with this same screen's
design.

## Coding standards
- Business logic in `lib/`, never in the route/page component (applies).
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name (applies).
- **Fee amounts as structured min/max band, never a single number or free text** (applies
  directly — this is the literal task this rule was written for).
- Content the firm can change lives in the database, edited via `/admin` (applies).
- Accessibility WCAG 2.1 AA via Base UI primitives (applies).
- `export const dynamic = "force-dynamic"` (applies).
- Never let a `"use client"` component import a value from a `@/lib/prisma`-importing `lib/`
  file (applies).
- The "Core Offers navigation menu's fee-hint text... reads the same `offer.fee_amount_min`
  field... not a second, separately-edited copy" (applies — verify this in browser per the
  acceptance criterion, don't just trust that it follows from the schema).

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T7.5 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
