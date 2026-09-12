# Session 59 — Personal-data deletion (T8.4)

# Date: 2026-09-12

# Tasks completed: T8.4

## What Was Built

T8.4 was blocked on a firm policy decision at the start of this session (carried over from
session 58's own explicit blocker note). Asked the user directly via `AskUserQuestion`: when
a deletion request arrives for an enquiry already marked `converted` (an active/former paying
client), does it get special retention treatment, or exactly the same treatment as any other
enquiry? **The firm chose: delete identifying data regardless of status, no special case.**
Recorded that decision in the epic file, feature doc, and `docs/dashboard.md`'s "Blocked On"
list _before_ writing any code, then built `DELETE /api/admin/enquiries/[id]/personal-data`:
nulls name/email/phone/message, retains everything else (score, status, notes, assignment,
the row itself, for KPI counting), records a new `personalDataDeletedAt` timestamp so the
admin UI can tell a genuine deletion apart from an enquiry that simply never gave a name, and
added a **Delete personal data** button (behind a real confirmation dialog) to T8.3's detail
screen. This completes Milestone 8 (Enquiry Management) in full — T8.1 through T8.4 are all
shipped.

## Files Changed

- `prisma/schema.prisma` — `EnquiryRecord.personalDataDeletedAt` (`DateTime?`).
- `prisma/migrations/20260912012155_t8_4_enquiry_personal_data_deletion/` — new migration.
- `lib/admin-enquiries.ts` — added `deletePersonalData` (idempotent: a second call preserves
  the original deletion timestamp); renamed `EnquiryUpdateValidationError` →
  `EnquiryWriteValidationError` (now shared by `updateEnquiry` and `deletePersonalData`,
  matching this codebase's one-error-class-per-lib-file convention); added
  `personalDataDeletedAt` to `EnquiryListItem`/`EnquiryDetail`.
- `lib/admin-enquiries.test.ts` — +3 tests for `deletePersonalData` (not-found, nulls fields,
  idempotent timestamp), renamed error-class references (27 tests total in this file).
- `app/api/admin/enquiries/[id]/personal-data/route.ts` (new) — `DELETE` handler.
- `app/api/admin/enquiries/[id]/route.ts` — renamed error-class import.
- `app/admin/(shell)/enquiries/[id]/delete-personal-data-button.tsx` (new) — `"use client"`,
  Base UI `AlertDialog` confirmation, `router.refresh()` after a successful delete.
- `app/admin/(shell)/enquiries/[id]/page.tsx` — heading and Contact details card both render
  a "Personal data deleted on [date]" state; renders the delete button when not yet deleted.
- `app/admin/(shell)/enquiries/page.tsx` — list's Name column shows "Personal data deleted"
  instead of a blank/absent name.
- `docs/tasks/08-enquiry-management.md`, `docs/features/enquiry-management.md`,
  `docs/dashboard.md` — recorded the firm's decision, unblocked T8.4, removed it from
  "Blocked On."
- `docs/user-guide.md` + Artifact mirror — "Enquiry detail" section now documents the delete
  walkthrough; Milestone 8 marked fully complete throughout (As of/coming-next/changelog).
- Website Build Status Artifact — Milestone 8 row has no caveat, the resolved policy question
  removed from "Waiting on you," summary/progress text updated.
- `memory/completed-work.md`, `memory/decision-log.md` — see below.

## Decisions Made

- **Firm decision (not engineering's to make):** a converted enquiry's personal data is
  deleted exactly like any other — no special exception, no separate minimal-record
  retention. Full record in `memory/decision-log.md`.
- Added `personalDataDeletedAt` rather than relying on the existing null `name`/`email`/
  `phone` fields alone — a real deletion and "never given" collapse to the same null
  otherwise, which would be actively misleading in the admin UI (the same category of
  problem the T8.2 triage-badge bug was, fixed the same way: make the real state
  distinguishable, don't let two different truths render identically).
- `EnquiryUpdateValidationError` renamed to `EnquiryWriteValidationError` — low-risk (only 3
  files referenced it, all within this same epic) and matches this codebase's established
  one-validation-error-class-per-lib-file convention now that the file has two write
  operations, not one.

## Current State

Milestone 8 (Enquiry Management) is fully shipped — T8.1 (schema), T8.2 (list), T8.3
(detail), T8.4 (personal-data deletion). All quality gates pass (lint, format:check,
`npm run typecheck`, `npm run test` — 338/338). Verified live via Playwright MCP: deleted a
real contact-form enquiry's personal data end-to-end, confirmed the confirmation dialog,
confirmed the deleted state renders correctly and immediately (via `router.refresh()`) on
both the detail screen and the list, confirmed every non-personal field survives intact.
Checked at desktop/tablet(768px)/mobile(390px). Both firm-facing Artifacts (User Guide,
Website Build Status) are current.

## Blockers

**T5.5 (Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification) cannot
start** — not a policy question this time, but a real external-provisioning gap: it needs a
Meta Business Manager with Pixel + Conversions API access, a Google Ads account, LinkedIn
Campaign Manager access, and the `kaalbert.com` domain actually registered (for Meta's domain
verification step) — none of which exist yet (`docs/tasks/05-landing-and-measurement.md`'s
own T5.5 entry, `memory/technical-debt.md`'s "kaalbert.com not registered" entry, both still
open). This is genuinely resequenced to run immediately before T9.1, not now — do not attempt
it, do not create placeholder/stub integrations "ready for when the accounts exist," and do
not treat reaching this point as a cue to ask the user to go create these accounts unprompted
mid-session; that's a real-world, multi-day provisioning task for the firm to do on its own
timeline, not something resolvable by a chat answer the way T8.4 was.

## Next Task

T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification
File: docs/tasks/05-landing-and-measurement.md
**Status: blocked — see "Blockers" above. Do not start implementation.**

## Paste This to Continue

```
T5.5 is blocked on real external accounts/domain registration that don't exist yet — do NOT
begin implementation from this prompt without first confirming with the user that the Meta
Business Manager (Pixel + Conversions API), Google Ads account, LinkedIn Campaign Manager
access, and kaalbert.com domain registration all now actually exist. Read CLAUDE.md in full
first anyway (tech stack, conventions, quality gates, checklist) since you'll need it the
moment this is actually unblocked.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — specifically its own
framing of T5.5 as "resequenced" (session 36+): Milestones 6–8 don't depend on it, only
Milestone 9 (`docs/tasks/09-performance-dashboards.md`'s T9.4/T9.5/T9.6) does, so it was
deliberately deferred from its original Milestone 5 slot to run immediately before T9.1,
"by which point those accounts are more likely to exist." Also read
docs/tasks/09-performance-dashboards.md's own opening note, which names this same precondition.

# Task T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification

## The blocker — confirm this first, before any code
Four real-world preconditions, none met as of session 59 (2026-09-12):
1. A Meta Business Manager account with a Pixel and Conversions API access provisioned.
2. A Google Ads account (conversions are imported from GA4 here, not defined separately,
   per FR-7.5 — so this doesn't need a second, separate conversion setup in Google Ads
   itself, just the account/import connection).
3. LinkedIn Campaign Manager access.
4. `kaalbert.com` registered as a real, owned domain — Meta's own domain-verification step
   (FR-7.9) requires proving ownership of a real domain, which a temporary Railway address
   cannot satisfy. `memory/technical-debt.md`'s "kaalbert.com not registered" entry is the
   tracked record of this gap; check whether it's been resolved before assuming domain
   verification can proceed even if the three ad accounts above exist.
Ask the user directly whether all four now exist before writing any code. If even one is
missing, stop and say so explicitly — do not build a partial version, do not stub out the
missing piece "for later," and do not proceed on the assumption that "close enough" accounts
exist.

## What to build (once unblocked)
Server-side Meta Conversions API call (fire-and-forget, deduplicated against the client pixel
via a shared event ID tied to `enquiry_id`, never regenerated per attempt); Google Ads
conversion actions imported from GA4 (not defined separately, FR-7.5); LinkedIn Insight Tag
installed for retargeting accumulation only (FR-7.8 note); Meta Business Manager domain
verification for kaalbert.com (FR-7.9).

## Input → Output contract (once unblocked)
The same six conversion moments (diagnostic started/completed, summary requested, checklist
downloaded, enquiry submitted, WhatsApp opened) → deduplicated Meta CAPI + pixel events,
GA4-imported Google Ads conversions, LinkedIn tag firing.

## Acceptance criteria (once unblocked)
A Meta CAPI outage (simulated) never delays or breaks the visitor-facing response
(`architecture.md`, Section 5); a double-submit produces one deduplicated conversion, not two,
verified in Meta Events Manager's own dedup reporting; domain verification shows confirmed in
Meta Business Manager.

## Size / Dependencies
M, depends on: T5.3 (GTM container + `dataLayer` pushes for the six conversion events, this
task's own event source), T5.4 (`Attribution`/`enquiry_id` linkage this task's deduplication
event ID is tied to), and the four external preconditions in "The blocker" above.

## Architecture constraints (once unblocked)
- Never a hard-coded measurement/advertising tag outside GTM (CLAUDE.md's own explicit,
  contractual "Things NOT to Do" rule, Document 13.03 Section 11.1) — the Meta pixel, Google
  Ads tag, and LinkedIn Insight Tag are all GTM tags, not inline `<script>` tags; only the
  server-side Conversions API call is custom application code (per ADR 0006's own decision:
  "a custom integration in the Application API Layer, not delegated to a GTM template's
  default behaviour, so event-ID deduplication... is controlled directly").
- Business logic lives in `lib/`, never inline in a route handler — the Meta CAPI call
  belongs in its own `lib/` module (e.g. `lib/meta-capi.ts`), called from wherever the six
  conversion events already fire server-side, not built inline at each call site.
- The Meta CAPI call must be genuinely fire-and-forget/non-blocking — a Meta outage must
  never delay or break the actual visitor-facing response (this task's own acceptance
  criterion, and `architecture.md` Section 5's standing rule). Do not `await` it in the
  request/response path in a way that could stall or fail the response to the visitor.
- Event-ID deduplication must use a stable ID tied to `enquiry_id` (or the relevant
  conversion's own natural key), generated once and reused across the client pixel and the
  server-side CAPI call for the same real-world event — never regenerated per attempt/retry,
  which would defeat deduplication entirely.

## Relevant ADRs
- ADR 0006 — `docs/adr/0006-gtm-measurement-container.md` — GTM as the single measurement
  container holding GA4/Meta pixel/Google Ads/LinkedIn Insight Tag as GTM tags, fed by
  existing `dataLayer` pushes; the server-side Conversions API call is this task's one
  custom, non-GTM integration, by this ADR's own explicit design.
- ADR 0004 — `docs/adr/0004-cloudflare-cdn-proxy.md` — kaalbert.com's DNS runs through
  Cloudflare; Meta's domain-verification step (a DNS TXT record or meta-tag/file proof of
  ownership) is configured against this same Cloudflare-managed DNS, not a separate registrar
  panel.

## Relevant feature specification
No dedicated feature doc beyond `docs/tasks/05-landing-and-measurement.md`'s own T5.5 entry
and `docs/adr/0006-gtm-measurement-container.md`'s Context section (which quotes Document
13.03 Section 11.1's exact requirement this task fulfils) — `measurement-and-attribution.md`
covers T5.1–T5.4's scope but doesn't itself define T5.5's specific CAPI/Ads/LinkedIn/
verification mechanics in further detail.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own (server-side integration + GTM/ad-
platform configuration only).

## Task Completion Checklist
```

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
[ ] memory/technical-debt.md updated (if applicable) — close "kaalbert.com not registered"
if domain registration is confirmed as part of unblocking this task
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
fix has Trigger type and Sequenced into filled in — never left blank
[ ] Every Task-sequenced Sequenced into target named or reused this session points at a task
in an epic that has NOT already fully shipped (check docs/roadmap.md/memory/completed-
work.md) — never a new task appended to an already-shipped epic file
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — this task
adds a new external-account-monitoring surface (Meta Events Manager, Google Ads, LinkedIn
Campaign Manager), so the "What to monitor" table almost certainly needs new rows
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation") —
applies once T5.5 ships: Milestone 5's own caveat about this deferred piece can finally
be removed
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

```

## Session boundary
Do not begin implementation this session unless the user has just confirmed all four
preconditions in "The blocker" above genuinely exist. If they have, complete the task fully,
then write the session summary file per CLAUDE.md's Session Management section, with the
output of /task T9.1 in its "Paste This to Continue" block (docs/tasks/09-performance-
dashboards.md). If they haven't, ask directly and stop — do not guess, and do not build a
partial/stubbed integration "ready for later."
```
