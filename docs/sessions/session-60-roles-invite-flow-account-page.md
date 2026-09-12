# Session 60 — Real Owner/Partner roles, invite flow, self-service account page

# Date: 2026-09-12

# Tasks completed: T01-05 follow-up, T07-05 follow-up, T07-06 follow-up (user-directed scope override, no new roadmap task — see below)

## What Was Built

Three smaller fixes landed early this session and were already committed before this
summary was written: T01-05 follow-up (admin sidebar nav highlighting on nested/detail
pages), T07-05 follow-up (editing an already-live landing page), and a `process` commit
(security headers/robots.txt, the admin-login-secrets bug closed, vendor-ops-guide fixes).

The rest of the session is one large, user-directed overhaul, uncommitted until this session
summary: the user tested the live app and found the entire admin user/account system had
"no control, no actual admin holding power, no account management." This reversed two prior,
individually-reasoned scope decisions (T6.6: a CLI script instead of an invite UI; T7.6: no
role gate, since no role vocabulary existed) after a direct database query confirmed the
consequence — zero of the 5 real seeded partners had ever had a login, and the
deactivate/reset-2FA/reset-password panel T7.6 built had literally never rendered for anyone.

Built, per a plan the user rejected and revised three times before approving (each rejection
surfacing a real gap found by verification, not inference — see `memory/decision-log.md`'s
full session-60 entry for the complete narrative):

- A real, enforced `AdminRole` enum (`OWNER`/`PARTNER`), replacing a plain never-read string.
- `lib/auth/current-user.ts` as the one canonical identity/permission helper — every
  admin-user action route and the Team editor/list are now genuinely gated by it.
- `/admin/team/new` (Owner-only): an invite flow that links an existing `Author` profile or
  creates a brand-new one, auto-emailing a temporary password + 2FA setup link via Brevo.
- `/admin/account` (any role, new): in-session password change, voluntary 2FA
  re-enrollment, and backup-code regeneration — none of this existed before.
- A real sidebar account menu (`components/admin-account-menu.tsx`) with a working sign-out,
  replacing a hardcoded placeholder.
- `Author.published` is now a computed-guard-plus-manual-override toggle, not a fully
  computed value.
- Three real, previously-shipped bugs found and fixed: `resetAdminUserTotp` issued a 2FA
  reset link that could never be completed for its one real use case; the dashboard's
  "Manage my account & 2FA" quick action pointed at a dead link; three client components
  importing `AdminRole` directly from `@/generated/prisma/client` broke `/admin`'s entire
  Turbopack compile (CLAUDE.md's client-bundle rule broadened to cover this).
- Two more small audit fixes: removed the sidebar's dead "Performance" link; hardened
  Diagnostic Configuration's threshold lookup to use fixed ids instead of a free-text label.
- Diagnostic Questions' reorder buttons now show a visible per-dimension header row, so a
  user-reported "doesn't make sense" pattern (verified to be logically correct all along) is
  now visually self-explanatory.

## Files Changed

- `prisma/schema.prisma` + `prisma/migrations/20260912111000_t60_admin_role_enum/` +
  `prisma/migrations/20260912111506_t60_change_password_attempt_kind/` — the `AdminRole` enum
  and a new `AdminLoginAttemptKind` value.
- `lib/auth/current-user.ts` (+ test, new) — `getCurrentAdminUser`/`isOwner`/
  `canEditAuthorProfile`.
- `lib/admin-team.ts` (+ test, new) — `createPartnerAccount`, `getUnlinkedAuthors`.
- `lib/admin-role-options.ts` (new) — client-safe `AdminRoleValue`/`ADMIN_ROLE_OPTIONS`.
- `lib/auth/backup-codes.ts` (+ test, new) — `generateHashedBackupCodes`/
  `regenerateBackupCodes`, extracted from `lib/auth/totp-setup.ts`'s `confirmTotpSetup`.
- `lib/auth/change-password.ts` (+ test, new) — `changeOwnPassword`.
- `lib/auth/totp-setup.ts` — added `reissueSetupToken` (resets `totpEnabled`/`totpSecret`
  before reissuing — the fix for the dead-2FA-reset-link bug).
- `lib/admin-authors.ts` (+ test) — `setAdminUserRole` (new, last-owner-protected),
  `resetAdminUserTotp` (fixed), `setAdminUserActive` (self-lockout guard), `updateAuthor`
  (publish-toggle rewrite), `AuthorListRow`/`LinkedAdminUser` gained `role`.
- `app/api/admin/admin-users/[id]/{deactivate,reactivate,reset-2fa,reset-password}/route.ts`
  — Owner-only guard added to all four.
- `app/api/admin/admin-users/[id]/role/route.ts` (new) — role promotion/demotion.
- `app/api/admin/authors/[id]/route.ts` — permission check added (`canEditAuthorProfile`).
- `app/api/admin/team/route.ts` (new) — the invite endpoint.
- `app/api/admin/auth/{logout,change-password,reissue-2fa-setup,regenerate-backup-codes}/
route.ts` (all new).
- `app/admin/(shell)/layout.tsx` — now `async`, resolves `getCurrentAdminUser()`, renders
  `AdminAccountMenu` in place of the old hardcoded placeholder.
- `components/admin-mobile-sidebar.tsx` — accepts/renders `currentUser` for the drawer.
- `components/admin-account-menu.tsx` (new) — the real sidebar account menu/dropdown.
- `components/admin-sidebar-nav.tsx` — removed the dead "Performance" link.
- `app/admin/(shell)/account/` (new) — `page.tsx` + `account-security-form.tsx`.
- `app/admin/(shell)/team/page.tsx` — Role column, Owner-only "Add partner" button, switched
  to `getCurrentAdminUser()`.
- `app/admin/(shell)/team/[id]/page.tsx` — Owner-or-self view gating.
- `app/admin/(shell)/team/[id]/author-editor-form.tsx` — real `Switch` for `published`,
  `readOnly` prop.
- `app/admin/(shell)/team/[id]/admin-user-actions-panel.tsx` — Role dropdown added.
- `app/admin/(shell)/team/new/` (new) — `page.tsx` + `add-partner-form.tsx`.
- `app/admin/(shell)/page.tsx` — dead "Manage my account & 2FA" quick-action link fixed.
- `app/admin/(shell)/diagnostic-configuration/configuration-client.tsx` — fixed-id threshold
  lookup instead of a free-text label match.
- `app/admin/(shell)/diagnostic-questions/questions-list-client.tsx` — visible per-dimension
  grouping in the table.
- `CLAUDE.md` — client-bundle rule broadened to cover the `@/generated/prisma/client` route
  into the same Turbopack failure.
- `docs/features/admin-authentication.md`, `docs/features/content-management-admin.md` —
  Roles section, new endpoints, invite-flow/publish-control business rules.
- `docs/user-guide.md` (+ Artifact republished, Version 19) — Team section rewritten,
  Account & security section added, login-recovery language updated.
- "Website Build Status" Artifact republished (Version 11) — "Your Team" panel and "Waiting
  on you" updated to reflect the invite tool now existing.
- `memory/decision-log.md` — new session-60 entry; T6.6 and T7.6 entries' `Status` flipped to
  Superseded in place.
- `memory/technical-debt.md` — the `adminUserId` backfill entry updated to note the real
  in-app path.
- `memory/known-bugs.md` — two new Fixed entries (the Turbopack/client-bundle bug, the
  `resetAdminUserTotp` dead-link bug).
- `memory/completed-work.md` — new session-60 entry.

## Decisions Made

- Three confirmed directly with the user before building (full reasoning in
  `memory/decision-log.md`): two-tier Owner/Partner role model; auto-emailed invites via
  Brevo, not a manually-relayed link; publish state as a computed guard plus manual override,
  not either extreme.
- Found and fixed, rather than deferred, three real bugs surfaced mid-session (the
  `resetAdminUserTotp` dead link, the dashboard's dead quick-action link, the Turbopack
  client-bundle panic) — all small, no design decision needed, and directly relevant to the
  reachability theme this whole session is about.
- Left the one disposable Playwright test account (never a real named partner) deactivated
  and unpublished rather than hard-deleting it, since a raw DB delete outside the app's own
  tooling was correctly blocked by the session's safety classifier as a shared-resource
  mutation — deactivated/unpublished via the app's own real, already-verified actions
  instead.
- Committing this as one `T07-06` follow-up rather than a new roadmap task ID: this whole
  body of work is fundamentally a correction/supersession of T7.6's own original scope call
  (and, secondarily, T6.6's), not a new planned capability — the established "task follow-up"
  pattern (CLAUDE.md's Knowledge Management Responsibilities section) fits directly.

## Current State

Full quality gate passing: `npm run lint`, `npm run format:check`, `npm run typecheck`,
`npm run test` (387/387). Verified live via Playwright against the real dev server (not just
mocked tests) — logged in as the Owner dev/test account, created a real disposable Partner
account through the invite flow (a real Brevo email was sent), confirmed the
previously-unreachable `AdminUserActionsPanel` rendered for the first time, exercised role
promotion/demotion, the publish toggle (including its still-enforced blank-field rejection),
deactivate/reactivate, a full change-password round-trip (forced re-login with the new
password), 2FA reissue, backup-code regeneration, sign-out, the Owner-only
`/admin/team/new` redirect for a Partner-role account, and read-only rendering of another
partner's profile for that same Partner account. Checked at mobile width (390px) too. Both
firm-facing Artifacts are current. No real partner has actually been invited yet — that
remains the firm's own call, now that the tool to do it exists.

## Blockers

None for this session's own scope. **T5.5 (Meta CAPI, Google Ads import, LinkedIn Insight
Tag, domain verification) remains blocked** exactly as recorded at the end of session 59 —
still waiting on four real external preconditions (a Meta Business Manager with Pixel + CAPI
access, a Google Ads account, LinkedIn Campaign Manager access, and the `kaalbert.com` domain
actually registered) that this session did not touch or resolve. See session 59's own summary
for the full precondition list — nothing about that blocker has changed.

## Next Task

T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification
File: docs/tasks/05-landing-and-measurement.md
**Status: still blocked — see "Blockers" above and session 59's own summary. Do not start
implementation until the user explicitly confirms all four preconditions now exist.**

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

Nothing about session 60's role/permission/invite overhaul changes any of T5.5's own
preconditions or scope — it touched only the admin user/account system, not measurement,
attribution, or the diagnostic itself.

# Task T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification

## The blocker — confirm this first, before any code
Four real-world preconditions, none met as of session 60 (2026-09-12):
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
