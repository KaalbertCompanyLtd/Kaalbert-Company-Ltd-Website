# Session 36 — Attribution capture, persistence, and 90-day retention

# Date: 2026-09-10

# Tasks completed: T5.4

## What Was Built

Client-driven first-touch campaign attribution: a new `Attribution` model (`session_id`
`@unique`, nullable `utm_source`/`utm_medium`/`utm_campaign`, `landing_page`, `first_seen`)
with an `EnquiryRecord.attributionId` foreign key, captured entirely client-side via
`localStorage` (no server session mechanism exists anywhere in this codebase) and resolved
server-side into both enquiry-creating write paths (`createContactEnquiry`,
`submitDiagnosticResponses`). A 90-day retention job (`lib/attribution-cleanup.ts`, runnable
via `npm run attribution:cleanup`) deletes expired, unreferenced rows — never one still
referenced by a real enquiry, regardless of age.

## Files Changed

- `prisma/schema.prisma` — new `Attribution` model; `EnquiryRecord.attributionId` relation.
- `prisma/migrations/20260910143644_t5_4_attribution/` (new).
- `lib/attribution-client.ts` (new) — client-safe capture (`captureAttributionOnce`,
  `getStoredAttribution`), no `@/lib/prisma` import.
- `lib/attribution.ts` (new) — server-side `resolveAttributionId` (defensive parse + upsert).
- `lib/attribution-cleanup.ts` (new) — `deleteExpiredAttributionRows`.
- `lib/attribution.test.ts`, `lib/attribution-cleanup.test.ts` (new).
- `scripts/cleanup-attribution.ts` (new) — standalone runner; `package.json`
  (`attribution:cleanup` script).
- `lib/enquiries.ts` + `lib/enquiries.test.ts` — `attribution` input, `attributionId` linked.
- `lib/diagnostic-submit.ts` + `lib/diagnostic-submit.test.ts` — same, plus a new
  `attribution` parameter.
- `app/api/contact/submit/route.ts` — passes `body.attribution` through.
- `app/api/diagnostic/submit/route.ts` — wire shape changed from a bare array to
  `{answers, attribution?}`.
- `components/contact-form.tsx`, `components/diagnostic-flow.tsx` — send
  `getStoredAttribution()` with their submissions.
- `components/attribution-capture.tsx` (new) — site-wide capture, mounted in `app/layout.tsx`.
- `docs/features/business-health-check-diagnostic.md`, `docs/features/contact-and-enquiry.md`,
  `docs/features/measurement-and-attribution.md` — updated to match the real, built contract.
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — new
  entries.

## Decisions Made

- **Attribution capture is entirely client-driven (`localStorage`), never a server session**
  — no session mechanism exists anywhere in this codebase to extend, and
  `measurement-and-attribution.md`'s own flow needs attribution to survive multiple full page
  navigations (landing page → `/diagnostic` → results → contact), which only persisted
  client storage genuinely does here.
- **`POST /api/diagnostic/submit`'s wire shape changed** from a bare JSON array to
  `{answers, attribution?}` — the smallest change that gives the new `attribution` payload
  somewhere to live. Updated the client, the route, and the feature doc's Interfaces section
  together, in the same change.
- **`resolveAttributionId` never throws** — malformed/missing/failed attribution resolution
  always degrades to `attributionId: null`, verified live against the real API (a
  deliberately garbage `attribution` payload still produced a `201` with the enquiry created).
- **Retention job verified against real seeded rows, not just a mocked unit test** — three
  rows (expired+unreferenced, expired+referenced, recent) confirmed the one deletable row was
  deleted and, critically, that an expired-but-referenced row survives regardless of age —
  the task's own explicit acceptance criterion, and the one case a mocked Prisma client
  can't truly prove.
- **Railway Cron Job scheduling is flagged as new technical debt, not built** — the cleanup
  script works standalone but nothing calls it on a schedule yet; wiring an actual Railway
  Cron Job is a dashboard action for the user to take, not something to do unasked.

## Current State

T5.4 is fully verified end-to-end against the real, live database: a UTM-tagged landing →
`/diagnostic` navigation → real submit call correctly produced an enquiry whose `attribution`
relation carried the original UTM values; a direct visit (no UTM params) correctly stored
null utm fields without blocking; a garbage attribution payload also never blocked
submission; the retention job correctly deleted only the one row that should be deleted. All
quality gates pass (lint, format:check, typecheck, 67/67 tests — 11 new). All test/scratch
rows were deleted afterward; the `attribution` table is empty on disk, as it should be before
any real traffic exists. Not yet committed.

**A real bug caught and fixed during this task's own verification**: the first version of
`scripts/cleanup-attribution.ts` statically imported `lib/prisma` alongside its own `dotenv`
`config()` calls — ES module `import` statements are hoisted above all other top-level code
regardless of source order, so `lib/prisma.ts` read `process.env.DATABASE_URL` before
`config()` ever ran, throwing "DATABASE_URL is not set" on every run. Fixed with
`await import(...)` inside `main()` instead of a static import; documented in the script's
own comment.

## Blockers

None for T5.4 itself. T5.5 (next in the epic) needs multiple real external
accounts/credentials before it can proceed — Meta Business Manager + a Meta CAPI access
token, a Google Ads account, and LinkedIn Campaign Manager access — none of which exist yet
(`META_CAPI_ACCESS_TOKEN` is still blank in `.env.local`/`.env.production`). Same pattern as
T5.3 needed GTM/GA4 before it could do anything real.

## Next Task

T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification
File: docs/tasks/05-landing-and-measurement.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — this task is one
part of a larger epic; the epic's opening paragraph and any task listed as a dependency below
give context this prompt summarizes but does not replace.

# Task T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification

**⚠️ Likely BLOCKED pending user action — read this before doing anything else.** This task
needs multiple real external accounts/credentials that do not exist yet, confirmed by
checking `.env.local`/`.env.production` this session: `META_CAPI_ACCESS_TOKEN` is blank, and
there is no existing GTM tag, technical-debt entry, or memory record indicating a Meta
Business Manager account, a Google Ads account, or LinkedIn Campaign Manager access exist for
this firm. Creating any of these accounts is an external action only the user can take (same
category as T5.3's GTM/GA4 account creation, T1.1's domain registration). **Do not create any
of these accounts, and do not treat reaching this task as a cue to act.** Start this session
by asking the user which of the following already exist, in order, since later parts of this
task depend on earlier ones:
1. A Meta Business Manager account for the firm, with a Meta Pixel created and its Pixel ID
   available, plus a **Conversions API access token** generated for that pixel (Meta Events
   Manager → the pixel's own Settings → Conversions API → generate access token). Needed for
   `META_CAPI_ACCESS_TOKEN`.
2. Whether `kaalbert.com`'s domain verification in Meta Business Manager (FR-7.9) has been
   started/completed — this itself may be blocked on the domain being registered at all
   (`memory/technical-debt.md` → "kaalbert.com not registered"), so check that dependency
   first if the domain still isn't registered.
3. A Google Ads account linked to the real GA4 property (`G-9VX9GS5L0X`, provisioned at T5.3)
   — needed for FR-7.5's "import from GA4, don't define separately" requirement.
4. A LinkedIn Campaign Manager account with access to install the LinkedIn Insight Tag.

If none of these exist yet, stop here and report back rather than attempting to simulate,
stub, or partially build around the missing accounts — same precedent as T5.3's own
blocked-start note. If some exist and others don't, do as much of the task as the available
accounts allow (e.g. the server-side Meta CAPI call's *code* can be built and unit-tested
with a mocked Meta endpoint even before domain verification completes, but say explicitly
which acceptance criteria remain unverified and why) — do not claim the whole task complete
on partial credentials.

## What to build
Server-side Meta Conversions API call (fire-and-forget, deduplicated against the client pixel
via a shared event ID tied to `enquiry_id`, never regenerated per attempt); Google Ads
conversion actions imported from GA4 (not defined separately, FR-7.5); LinkedIn Insight Tag
installed for retargeting accumulation only (FR-7.8 note); Meta Business Manager domain
verification for kaalbert.com (FR-7.9).

## Input → Output contract
The same six conversion moments → deduplicated Meta CAPI + pixel events, GA4-imported Google
Ads conversions, LinkedIn tag firing.

## Acceptance criteria
A Meta CAPI outage (simulated) never delays or breaks the visitor-facing response
(`architecture.md`, Section 5); a double-submit produces one deduplicated conversion, not
two, verified in Meta Events Manager's own dedup reporting; domain verification shows
confirmed in Meta Business Manager.

## Size / Dependencies
M, depends on: T5.3 (this epic's GTM container — GTM-PDGKRKRN, published live — and the real
GA4 property, G-9VX9GS5L0X; the Meta pixel itself installs as a GTM tag inside that same
container, not a separate script tag, per ADR 0006's "single container" rule), T5.4 (this
same session — the `attribution` table and `enquiry_record.attribution_id` relation this
task's own event payloads may need to reference; more directly, `lib/data-layer.ts`'s
`pushDataLayerEvent`/`DataLayerEvent` union is the established single mechanism every
conversion moment already fires through — this task's client-side Meta pixel tag inside GTM
listens to those same six `dataLayer` events, it does not invent a second push mechanism).

## Architecture constraints
- The Meta pixel itself is a **GTM tag inside the existing container**, not a separate
  hardcoded `<script>` — CLAUDE.md's "Things NOT to Do" explicitly forbids a hardcoded
  measurement/advertising tag outside GTM (Document 13.03, Section 11.1, contractual).
- The **server-side Conversions API call is a separate, custom integration** in `lib/`
  (a new `lib/meta-capi.ts` or similar) — not delegated to a GTM template's default
  behaviour (ADR 0006's own explicit decision) — called from the same route handlers that
  already create/update the relevant `enquiry_record` (`lib/enquiries.ts`,
  `lib/diagnostic-submit.ts`, `lib/diagnostic-request-summary.ts`), fire-and-forget relative
  to the visitor-facing response (same precedent as `lib/email.ts`'s
  `sendTransactionalEmail`/`EmailSendError` — a failed call is logged via `console.error`,
  never thrown back to the visitor, never retried inline). Simulate a Meta outage (e.g. an
  unreachable/invalid endpoint in a test) and confirm the response the visitor actually
  receives is unaffected — this is the task's own literal acceptance criterion, not
  optional.
- **Deduplication uses a shared event ID generated once per genuine conversion, tied to
  `enquiry_id`** — never regenerated per attempt (this task's own explicit edge case in
  `measurement-and-attribution.md`: "a conversion event fires twice due to a client-side
  double-submit... the event ID must be generated once per genuine conversion, not
  regenerated per attempt"). The same event ID must reach both the client-side pixel (fired
  via GTM, reading it from the `dataLayer` payload) and the server-side CAPI call, so Meta's
  own dedup logic can match them.
- **Diagnostic responses themselves are never sent to any advertising platform** — only the
  fact that a conversion occurred (Document 13.03, Section 9) — audit exactly what payload
  the server-side CAPI call sends and confirm no response content leaks in.
- **Google Ads conversions are imported from GA4, not defined as separate GA4/Ads-side
  conversion actions** (FR-7.5) — this is primarily a GA4/Google Ads dashboard configuration
  step (linking the two accounts, enabling conversion import), not new application code;
  confirm this is actually how it's done before writing any code for it.
- **LinkedIn Insight Tag is a GTM tag too**, installed for retargeting-audience accumulation
  only — the firm does not plan to advertise on LinkedIn to cold audiences at launch
  (Document 13.03, Section 11.1) — do not build any LinkedIn conversion-tracking beyond
  installing the tag itself.
- Domain verification in Meta Business Manager is a firm-owned-account handover step
  (`measurement-and-attribution.md`'s own Interfaces section) — a Business Manager dashboard
  action (adding a DNS TXT record or uploading a verification file), not application code.

## Relevant ADRs
- ADR 0006 — `docs/adr/0006-gtm-measurement-container.md` — GTM holds GA4, the Meta pixel,
  Google Ads, and the LinkedIn Insight Tag as GTM tags; the server-side Meta CAPI call is
  the one piece that is a custom `lib/` integration, not a GTM tag, specifically so
  event-ID deduplication is controlled directly by this codebase, not a GTM template.

## Relevant feature specification
`docs/features/measurement-and-attribution.md` — the CAPI deduplication business rule and
edge case, the Google Ads/LinkedIn business rules, the domain-verification interface, and
the "diagnostic responses never sent to any platform" rule this task must respect.

## Mockup / UI reference
Not applicable — this task has no UI surface of its own (server-side integration + GTM/
platform-dashboard configuration only).

## Coding standards
- Mockups are authoritative. (Not applicable.)
- Responsive built in from first implementation. (Not applicable.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable.)
- Feature docs are the data/interface contract. (Applies —
  `measurement-and-attribution.md`'s CAPI/dedup/Google Ads/LinkedIn rules are not optional.)
- Business logic lives in `lib/`. (Applies — the new Meta CAPI call belongs in `lib/`, called
  from existing route-adjacent business logic, never inline in a route handler.)
- Every entity field maps to the feature doc. (Not applicable — no new entity fields expected;
  if a shared event ID needs persisting anywhere, check whether `enquiry_id` alone already
  suffices as that ID before adding a new column.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Not applicable — no UI surface.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Not
  applicable — no new page/route this task; if the CAPI call is added inside an existing
  route handler, that route's existing dynamic-rendering status is unaffected.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Not applicable — the Meta CAPI call is server-only; no new client
  component this task beyond, at most, reading the shared event ID to include in a
  `dataLayer` push, which `lib/data-layer.ts`'s existing client-safe module already supports.)
- The shared generic `page` entity pattern. (Not applicable.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — no new page.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Directly
  applies — the Meta pixel/LinkedIn Insight Tag GTM tags listen to the same six events
  already firing via `pushDataLayerEvent`; this task adds tags/server logic around existing
  events, never a new push mechanism.)

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
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.1 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
