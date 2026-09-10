# Session 35 — GTM measurement container: six events + consent mode

# Date: 2026-09-10

# Tasks completed: T5.3

**Note on numbering:** memory entries for the T5.2 follow-up (the `downloadFileUrl`
correction) were labeled "session 34," but that work happened inline within the same
conversation as session 33 and was folded into `session-33-landing-page-instances.md` rather
than getting its own file — there is no `session-34-*.md`. This file picks up the sequence at
35 to stay consistent with those memory labels rather than renumber them retroactively.

## What Was Built

The real GTM container (`GTM-PDGKRKRN`) and GA4 property (`G-9VX9GS5L0X`) — both provisioned
by the user this session, resolving the long-standing "GTM container not yet provisioned"
blocker — were populated with a GA4 Configuration tag, six GA4 event tags (one per fixed
conversion event) with matching Custom Event triggers, and a Consent Default tag setting all
four consent signals to `denied` by default. The container was published live. The site's own
consent banner (`components/consent-banner.tsx`) was built and wired in, letting a visitor
grant or decline, with the choice pushed as a real `consent update` command.

## Files Changed

- `app/layout.tsx` — mounts `ConsentBanner`; updated the now-stale "empty container" comment.
- `components/consent-banner.tsx` (new) — the cookie consent banner.
- `lib/data-layer.ts` — new `pushConsentUpdate` helper.
- `.env.local` / Railway `kaalbert-web` service — `GTM_CONTAINER_ID` set (by the user, then
  mirrored onto Railway via `railway variables --set` this session).
- The GTM container itself (external, GTM-PDGKRKRN): 8 tags, 6 triggers, 1 variable,
  published as Version 2 ("Live").
- `memory/technical-debt.md` — "GTM container not yet provisioned" flipped to Resolved.
- `memory/decision-log.md`, `memory/completed-work.md` — new T5.3 entries.

## Decisions Made

- **GTM account created under `kaalbert.company@gmail.com`, not a personal account** — the
  user asked for guidance on this specifically; answered from this project's own explicit
  account-ownership rule (`docs/requirements.md`, Constraint 5/NFR-9) and the existing T1.1
  precedent (Railway provisioned the same way). Confirmed Brevo already used the same
  company account too, so no gap there.
- **One shared `{{GA4 Measurement ID}}` Constant variable, reused by all six event tags** via
  GTM's "Google tag found in this container" auto-detection, rather than re-entering the
  Measurement ID six times — avoids drift if the ID ever needs to change.
- **Consent Default via Custom HTML on the built-in `Consent Initialization - All Pages`
  trigger** — confirmed no native "Consent Mode" tag type exists in this account (checked the
  tag-type catalog directly, including after enabling the container's "Consent overview"
  (BETA) setting), so Custom HTML is the correct, officially documented mechanism here, not a
  workaround.
- **No manual per-tag consent configuration needed** — every `Google Analytics: GA4 Event`
  tag already carries built-in (automatic) consent requirements
  (`ad_storage`/`ad_user_data`/`ad_personalization`/`analytics_storage`), confirmed by
  inspecting one tag's Advanced Settings directly.
- **Consent banner uses plain native `<button>`s, not a Base UI primitive** — native buttons
  are already fully accessible; Base UI is for composing behavior a bare `<div>` wouldn't
  have, not required here.
- **A necessary, justified `react-hooks/set-state-in-effect` suppression** in the consent
  banner — the "start hidden during SSR, decide real visibility only once mounted" pattern
  genuinely requires `setState` inside `useEffect`; documented with a reasoning comment
  rather than contorted into an artificial `useSyncExternalStore` rewrite.

## Current State

T5.3 is fully verified end-to-end on the real, published container: GTM Preview mode showed
all 8 tags firing correctly with zero cross-firing, and after publishing, a real
`google-analytics.com/g/collect` request was observed carrying the `gcd` consent-diagnostics
parameter for both the automatic `page_view` hit and a manually-fired `diagnostic_started`
event. All quality gates pass (lint, format:check, typecheck, 56/56 tests). Not yet committed.

**A real verification pitfall worth flagging to anyone continuing this epic**: `gtm.js` is
served with `Cache-Control: private, max-age=900`. Every browser used for testing this
session had already cached the _empty_ pre-T5.3 container from earlier (when
`GTM_CONTAINER_ID` was first set but no tags existed yet), so every "fresh" page load for the
next 15 minutes kept silently reusing that stale script — even across new tabs and a hard
reload — while GTM Preview mode (which uses its own debug-token URL, never cached) showed the
true, correct behavior the entire time. Resolved once enough wall-clock time passed for the
cache to expire naturally. If a future session edits this container and the live site
"doesn't seem to pick up the change," check this before assuming a real bug.

## Blockers

None for T5.3 itself. T5.4 (attribution capture/retention) and T5.5 (Meta CAPI, Google Ads
import, LinkedIn Insight Tag, domain verification) are next in the epic — T5.5 in particular
needs its own set of real external accounts/credentials (Meta Business Manager, Google Ads)
before it can proceed, same pattern as T5.3 needed GTM/GA4.

## Next Task

T5.4 — Attribution capture, persistence, and 90-day retention job
File: docs/tasks/05-landing-and-measurement.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace. In particular, re-read the epic
file's own "Decision made here, not left open" note at the top: the `attribution` row's
retention window is already decided (90 days) — this task implements that decision, it does
not re-open it.

# Task T5.4 — Attribution capture, persistence, and 90-day retention job

## What to build
`attribution` table (`measurement-and-attribution.md`) capturing
utm_source/medium/campaign/landing_page/first_seen per session, persisted through the entire
multi-step diagnostic flow; a scheduled job deleting `attribution` rows older than 90 days
that are not referenced by any `enquiry_record` (rows still referenced by a real enquiry are
never deleted by this job — retention of the enquiry itself is a separate, longer policy under
FR-6.4, not overridden by this 90-day window).

## Input → Output contract
Campaign-tagged first visit → persisted `attribution` row, foreign-keyed from any
`enquiry_record` created in that session; job run → rows past 90 days with no referencing
enquiry removed.

## Acceptance criteria
UTM parameters present on landing survive through diagnostic completion and appear correctly
on the resulting enquiry in a direct DB check (admin display of this is Milestone 8); an
`attribution` row referenced by an enquiry is never deleted by the 90-day job regardless of
its own age; a session with no campaign parameters stores null/direct, never blocking the
flow.

## Size / Dependencies
M, depends on: T3.5 (the diagnostic flow's multi-step session persistence — this task's
`attribution` row must survive the same session the way diagnostic responses already do;
check `lib/diagnostic-submit.ts`/`lib/diagnostic-flow.ts` for the existing session-handling
pattern to extend rather than duplicate), T5.3 (this session — provides the real, live GTM
container and the six `dataLayer` events this task's `landing_page` field and the resulting
`enquiry_record` foreign key ultimately feed measurement for; also confirms `pushDataLayerEvent`/
`pushConsentUpdate` in `lib/data-layer.ts` as the established pattern, not directly reused by
this task but establishing the same "one shared mechanism, not a second one" precedent to
follow for the `attribution` capture mechanism itself).

## Architecture constraints
- Business logic (parsing UTM params, resolving/creating the `attribution` row, the 90-day
  cleanup job's deletion logic) lives in `lib/`, never inline in a route handler/component.
- `attribution` rows are captured on **first visit with campaign parameters present** — a
  session with no UTM params must store null/direct, per this task's own acceptance
  criterion, and must never block or delay the visitor-facing flow (same "never break the
  visitor experience for a measurement concern" precedent as T5.5's planned Meta CAPI
  fire-and-forget behavior, `architecture.md` Section 5).
- The 90-day retention job must **never** delete an `attribution` row that's referenced by a
  real `enquiry_record`, regardless of the row's own age — check the actual foreign-key
  relationship/query shape carefully; this is the task's own explicit acceptance criterion,
  not just documentation color.
- `docs/features/measurement-and-attribution.md`'s `attribution` entity fields
  (session id, utm_source, utm_medium, utm_campaign, landing_page, first_seen) map to Prisma
  schema fields of the same name, per CLAUDE.md's field-naming rule — confirm exact field
  names against that doc before naming the Prisma model.
- Diagnostic responses themselves are never sent to any advertising platform (Document
  13.03, Section 9) — not directly this task's concern (that's T5.3/T5.5's GTM/CAPI payload
  shape), but relevant context: this task's own `attribution` row must not itself become a
  vector for that if it's ever surfaced anywhere.
- Where does the scheduled 90-day cleanup job actually run? Check `docs/architecture.md` and
  `docs/adr/0003-railway-hosting-and-postgres.md` for this project's established pattern for
  scheduled/background jobs (if one exists yet) before inventing a new one — Railway itself
  supports cron-triggered services; confirm whether an earlier task already established this
  pattern or whether this is the first task that needs it.

## Relevant ADRs
- ADR 0006 — `docs/adr/0006-gtm-measurement-container.md` — this task's `attribution` table
  is what eventually lets an `enquiry_record` be traced back to its originating campaign; the
  six `dataLayer` events this ADR governs are the measurement side, this task is the
  attribution-persistence side of the same feature.

## Relevant feature specification
`docs/features/measurement-and-attribution.md` — the full `attribution` entity, the
first-visit capture flow, and the retention policy this task implements. Also
`docs/features/business-health-check-diagnostic.md` for how the multi-step diagnostic
session already persists state (to extend, not duplicate) and `docs/features/
contact-and-enquiry.md`/`enquiry-management.md` for the `enquiry_record` foreign-key side.

## Mockup / UI reference
Not applicable — this is a backend/data-capture task with no dedicated UI surface of its
own (attribution data display in admin is Milestone 8, explicitly out of scope here per this
task's own acceptance criteria wording).

## Coding standards
- Mockups are authoritative. (Not applicable — no UI surface this task.)
- Responsive built in from first implementation. (Not applicable.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies —
  `measurement-and-attribution.md`'s `attribution` entity fields are not optional.)
- Business logic lives in `lib/`. (Applies — capture logic and the retention job's logic.)
- Every entity field maps to the feature doc. (Applies — `attribution` model's fields.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable — this is captured
  visitor data, not firm-authored content.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no UI surface.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Applies if
  this task touches any existing page/route to read UTM params from the request — check
  whether that's already covered by existing dynamic routes or needs its own.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies if any client-side capture logic is added — e.g. reading
  `document.location.search` for UTM params client-side vs. server-side; decide which side
  captures this and follow the existing precedent for that choice.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — no new page.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not directly
  this task — this task is the attribution-persistence side, not a new conversion event.)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T5.5 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
