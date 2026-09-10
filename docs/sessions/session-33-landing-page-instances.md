# Session 33 — Landing page instances seeded

# Date: 2026-09-10

# Tasks completed: T5.2

## What Was Built

The three named launch landing page instances (`business-health-check`,
`funding-readiness-checklist`, `financial-clarity-pack`) were seeded into T5.1's `/lp/[slug]`
template via a new `seedLandingPages()` function in `prisma/seed.ts`, sourced faithfully from
the three accepted mockups. The Funding-Readiness Pack offer page's checklist cross-promo
section (omitted at T2.2 because the landing page didn't exist) was added back, now linking
to the real, live route.

## Files Changed

- `prisma/seed.ts` — new `seedLandingPages()` function (three real instances, idempotent
  upsert, `isPlaceholder: false`), called from `main()`; new `LandingPageBodyBlock` type
  import.
- `app/offers/[slug]/page.tsx` — new checklist cross-promo section (conditional on
  `offer.slug === "funding-readiness-pack"`) linking to `/lp/funding-readiness-checklist`;
  new `BTN_SECONDARY` style constant.
- `memory/completed-work.md`, `memory/decision-log.md` — new T5.2 entries.
- `memory/technical-debt.md` — new Open entry ("Funding-Readiness Checklist landing page has
  no real downloadable asset yet"); existing cross-promo entry flipped `Open` → `Resolved`.

## Decisions Made

- **The funding-readiness-checklist instance's CTA routes through the real
  `/contact?service=funding-readiness-pack` enquiry path, not a fabricated download link.**
  That mockup's own inline email-capture form gates a real PDF checklist that doesn't exist
  yet, and `landing_page` has no capture-form fields to model one with anyway. Fabricating a
  placeholder checklist document was rejected — CLAUDE.md's "do not fabricate ... any
  firm-supplied content" rule applies to a real advisory document the same way it applies to
  legal text. Logged as `Trigger type: User-triggered`, `Sequenced into: T5.3`, since T5.3's
  own contract needs a real "checklist_downloaded" event source to exist before it can wire a
  GTM tag around it — currently there is none anywhere in the codebase. Full reasoning in
  `memory/decision-log.md`'s T5.2 entry.
- **All three instances seeded with `isPlaceholder: false`** — their copy is sourced directly
  and faithfully from the three accepted mockups, same "mockup copy is real, shipped copy"
  precedent `seedOffers`/`seedHomePageContent` already established, not draft/fabricated text.
- **`financial-clarity-pack`'s mockup-only `.fee-strip` was folded into a single-item `stats`
  block** (`{value: "GHS 4,500 – 9,500", label: "Published fee band"}`) rather than adding a
  dedicated fee-band field to `LandingPage` — reuses T5.1's existing block schema instead of
  extending it for one mockup's one outlier element.

## Current State

All three `/lp/[slug]` routes are live with distinct, real content and verified via Playwright
MCP (correct CTAs, no horizontal overflow at 390px/768px, the cross-promo link on
`/offers/funding-readiness-pack` pointing to the now-real landing page and absent from the
other two offer pages, `/lp/does-not-exist` still 404ing). All quality gates pass (lint,
format:check, typecheck, 56/56 tests). Not yet committed.

**Known limitation carried forward, not fixed this session:** the funding-readiness-checklist
landing page's headline promises a "Free Download" but its CTA currently leads to a contact
form, not an instant download — this is the deliberate interim described above, not an
oversight. T5.3 needs to re-check with the user whether the real checklist asset exists before
it can fully close out that one event.

## Blockers

**T5.3 is externally blocked, not just next in sequence.** No real Google Tag Manager
container exists for kaalbert.com yet (`GTM_CONTAINER_ID` unset in `.env.local`/
`.env.example`, confirmed this session) — creating one is an external action only the user can
take (`memory/technical-debt.md` → "GTM container not yet provisioned"). Whoever picks up
T5.3 must ask the user for a real `GTM-XXXXXXX` container ID before doing anything else, not
attempt to simulate or stub around the missing container.

## Next Task

T5.3 — GTM container: six conversion events + consent mode
File: docs/tasks/05-landing-and-measurement.md

## Paste This to Continue

```
# Task T5.3 — GTM container: six conversion events + consent mode

**⚠️ BLOCKED pending user action — read this before doing anything else.** No real Google
Tag Manager container exists for kaalbert.com yet (`GTM_CONTAINER_ID` is unset in
`.env.local`/`.env.example` as of this session — confirmed 2026-09-10). Creating a GTM
account is an external action only the user can take (`memory/technical-debt.md` → "GTM
container not yet provisioned"; the epic file's own T5.3 addendum, session 06). **Do not
create a GTM account, and do not treat reaching this task as a cue to act.** Start this
session by asking the user whether a real `GTM-XXXXXXX` container ID now exists. If not,
stop here and say so explicitly — do not attempt to simulate, stub, or work around the
missing container. If yes, set it as `GTM_CONTAINER_ID` (`.env.local` + the Railway
`kaalbert-web` service) and proceed with the task below as written.

Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace.

## What to build
Populate the T1.6 GTM container with the six defined events (diagnostic started, diagnostic
completed, summary requested, checklist downloaded, enquiry submitted, WhatsApp opened) as
GA4 key events (FR-7.3), consent banner + consent mode (FR-7.2, degrading measurement
gracefully on decline rather than blocking site function), all tags addable/removable through
GTM without a code deploy (FR-7.1).

## Input → Output contract
`dataLayer.push(...)` calls already present at each event's source (diagnostic flow, contact
form, WhatsApp links) → six firing GA4 key events, visible in GA4's Realtime view.

## Acceptance criteria
All six events fire exactly once per genuine conversion in GTM Preview mode; declining
consent still allows full site function while visibly reducing what's sent (consent mode
signal present in the network payload); no tag is hard-coded outside GTM.

## Size / Dependencies
L, depends on: T1.6 (installed the empty GTM bootstrap snippet — head script + `<body>`
noscript iframe — in the root `app/layout.tsx`, reading `GTM_CONTAINER_ID` from the
environment; verified end-to-end against a throwaway test ID, per `memory/technical-debt.md`
→ "GTM container not yet provisioned"), T3.4–T3.7 (the diagnostic flow's own
`diagnostic_started`/`diagnostic_completed`/`summary_requested` `pushDataLayerEvent` calls —
already wired, confirmed present in `components/diagnostic-flow.tsx`,
`components/diagnostic-completed-event.tsx`, `components/diagnostic-summary-request-form.tsx`),
T2.6 (the contact page's `enquiry_submitted`/`whatsapp_opened` calls — already wired,
confirmed present in `components/contact-form.tsx`/`components/whatsapp-link-button.tsx`).

**Five of six event sources already exist and push real events today** — `lib/data-layer.ts`'s
`pushDataLayerEvent` is the one shared mechanism every caller already uses. **The sixth,
`checklist_downloaded`, has no real trigger anywhere in the codebase** — flagged in
`memory/technical-debt.md` → "Funding-Readiness Checklist landing page has no real
downloadable asset yet" (raised at T5.2, session 33, `Trigger type: User-triggered`,
`Sequenced into: T5.3`, i.e. this task). That landing page's CTA currently routes through
`/contact?service=funding-readiness-pack` instead of a real download, because no real
firm-authored checklist PDF exists yet — building a capture mechanism or fabricating checklist
content was explicitly rejected as out of scope for T5.2. **This task cannot wire a real GTM
tag around an event with no trigger.** Confirm with the user whether the real checklist asset
now exists before attempting to instrument `checklist_downloaded` — if it still doesn't, wire
the other five events fully, leave `checklist_downloaded` configured in GTM as a key event
definition (so no further GTM-side config work is needed once the trigger exists) but without
a real trigger to test in Preview mode, and say so explicitly in the acceptance-criteria
write-up rather than claiming "all six events fire" when one demonstrably can't yet.

## Architecture constraints
- All tags deploy through the single GTM container (ADR 0006) — never a hard-coded
  measurement/advertising tag outside GTM (CLAUDE.md's "Things NOT to Do," Document 13.03
  Section 11.1 — contractual, not stylistic).
- Consent state is passed as consent mode signals, not used merely to block tags outright
  (FR-7.2) — the firm retains modelled measurement from visitors who decline; declining must
  never break site function.
- The six events are exactly the ones named in `lib/data-layer.ts`'s `DataLayerEvent` union —
  do not invent a seventh event or a second push mechanism; every conversion moment reuses
  `pushDataLayerEvent`.
- Diagnostic responses themselves must never be sent to any advertising platform — only the
  fact that a conversion occurred (Document 13.03, Section 9). Check what payload each
  existing `pushDataLayerEvent` call actually sends before wiring GTM variables/triggers
  around it, to confirm no response content leaks into a tag.
- This task only configures GTM (tags/triggers/variables/consent settings) and, if needed,
  the consent banner UI — it does not touch `lib/data-layer.ts`'s push call sites (already
  correct) except for `checklist_downloaded`'s absence, which is a decision point, not a
  silent fix (see Size/Dependencies above).
- No admin-editable content model changes — GTM configuration lives entirely inside GTM's own
  interface, not this codebase, per ADR 0006's "firm-owned, editable by anyone the firm grants
  access to" reasoning.

## Relevant ADRs
- ADR 0006 — `docs/adr/0006-gtm-measurement-container.md` — GTM is the single container
  holding GA4, the Meta pixel, Google Ads, and the LinkedIn Insight Tag as GTM tags, fed by
  hand-written `dataLayer` pushes at each of the six conversion points; the server-side Meta
  Conversions API call is a separate custom integration (T5.5), not delegated to a GTM
  template.

## Relevant feature specification
`docs/features/measurement-and-attribution.md` — the full six-event user flow, the consent
mode business rule (FR-7.2), the "diagnostic responses never sent to any platform" rule, and
the `attribution` data model (T5.4's concern, not this task's, but referenced by the same
doc).

## Mockup / UI reference
Not applicable for the GTM configuration itself (no UI surface — GTM's own web interface).
If a consent banner UI needs to be built (rather than already existing), no dedicated mockup
covers it — infer a reasonable treatment consistent with `ui/design-system.md`'s existing
patterns (a dismissible bar/panel, Base UI `Dialog`/similar primitive for accessibility) and
confirm with the user before inventing new copy for legally-relevant consent language.

## Coding standards
- Mockups are authoritative. (Not applicable — no mockup exists for this task's surface.)
- Responsive built in from first implementation. (Applies only if a consent banner UI is
  built — check at mobile/tablet/desktop same as any other UI surface.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies —
  `measurement-and-attribution.md`'s six-event list and consent-mode rule are not optional.)
- Business logic lives in `lib/`. (Applies to any new consent-state logic; GTM's own
  configuration lives in GTM, not this codebase.)
- Every entity field maps to the feature doc. (Not applicable — no new entity this task.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable — GTM tags are
  firm-owned inside GTM itself, the deliberate point of ADR 0006, not a `kaalbert.com`
  database concern.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Applies if a consent banner UI is built.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Not
  applicable — no new DB-backed route this task.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies if any new client component is added for the consent banner —
  `lib/data-layer.ts` itself has no `@/lib/prisma` import, so it's already safe to import from
  client components, same as every existing caller already does.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — no new page this task.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (This task's
  entire point — configuring GTM to actually consume the five (or six, if resolved) events
  already being pushed.)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.4 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
