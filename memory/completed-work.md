# Completed Work

Newest entry at the top. Entries below follow this format, one per completed task, added by
whichever agent completes it (see CLAUDE.md's Task Completion Checklist and Git Commit
Protocol):

## YYYY-MM-DD

**Task:**
**Summary:**
**Files Changed:**
**Related Feature:**
**Notes:**

---

## 2026-09-16 (session 62) — kaalbert.com domain registration follow-through: fixed the OG-image bug, set NEXT_PUBLIC_SITE_URL live, corrected canonical domain to apex

**Task:** User-directed production-hardening — user reported the OG/share image didn't render
on WhatsApp and separately reported `kaalbert.com` is now registered and added as a Railway
custom domain; asked for everything that follows from that (domain, Cloudflare per ADR 0004,
Brevo sender/Zoho aliases, env vars, docs/artifacts) to be handled.
**Summary:** Diagnosed the OG bug to its root cause: `lib/seo.ts`'s `getSiteUrl()` fallback
(`https://www.kaalbert.com`) never resolved, both because `kaalbert.com` wasn't registered
until this session and, independently, because the fallback used `www` while only the apex
domain was ever added as a Railway custom domain. Fixed both: changed the fallback (and 4
dependent test files) to apex `kaalbert.com`, and set `NEXT_PUBLIC_SITE_URL=https://
kaalbert.com` explicitly in `.env.local`, `.env.production`, and the live Railway service
(`railway variable set`, with a matching `preserve()` added to `.railway/railway.ts`, no IaC
drift confirmed via `railway config plan`). Verified live after the resulting auto-redeploy:
`https://kaalbert.com/` returns 200 with correct `og:image`/canonical tags, and the image URL
itself returns 200 with the real firm asset. Captured the real DNS state for `kaalbert.com`
(apex CNAME to Railway, 3 Zoho MX records, SPF/Zoho-verification TXT, Zoho DKIM TXT — via
`dig @1.1.1.1`, since this session's own sandbox resolver returns bogus answers for this
domain) and used Brevo's own API (read-only) to confirm today's real sender-verification
state: one single-sender-verified Gmail address, zero authenticated domains. Presented the
user the Cloudflare/ADR-0004 tradeoff directly rather than treating it as automatic; user
chose to defer it — captured the current DNS records for reference in case it's revisited,
but did not migrate anything. Discussed the Brevo sender choice with the user (`no-reply@`
vs. `info@` vs. `hello@` — a brand-voice call, since the same send utility carries both
internal admin mail and the diagnostic's lead-facing summary email) and landed on
`info@kaalbert.com`, used for both `BREVO_SENDER_EMAIL` and `site_settings.email`. Wrote a
full, concrete step-by-step guide for the user to execute themselves (Zoho alias creation,
Brevo domain authentication, DNS records) — not done yet, both depend on mailbox/dashboard
actions only they can take.
**Files Changed:** `lib/seo.ts`, `lib/seo.test.ts`, `lib/admin-authors.test.ts`,
`lib/insights.test.ts`, `lib/auth/password-reset.test.ts`, `lib/email.ts` (comment),
`app/api/insights/unsubscribe/route.ts` (comment), `next.config.ts` (comment),
`.env.example`, `.env.local`, `.env.production`, `.railway/railway.ts`, `CLAUDE.local.md`,
`docs/tasks/01-foundation.md` (T1.1 addendum), `docs/vendor-operations-guide.md` (Sections 1,
3, 5, 6, 8, 11 — substantially rewritten), `docs/user-guide.md`, `memory/technical-debt.md`
(2 entries: domain registration flipped Resolved, split Cloudflare-fronting into its own
entry; new Brevo/alias entry), `memory/known-bugs.md` (new entry, Fixed), `memory/
decision-log.md` (new entry).
**Related Feature:** ADR 0004 (Cloudflare CDN/proxy), `docs/features/seo-and-search-
foundation.md`, `docs/tasks/01-foundation.md` T1.1, `docs/tasks/05-landing-and-measurement.md`
T5.5, `docs/tasks/03-diagnostic.md` T3.7 (Brevo).
**Notes:** Vendor Operations Guide and Platform User Guide Artifacts both republished this
session (see the tool-call log) — mirrors now match the repo files. Website Build Status
Artifact not touched — this wasn't a milestone/epic completion, just infra follow-through on
an already-shipped phase. Two real external-action items remain entirely with the user:
Cloudflare account + registrar nameserver change, and Zoho alias creation + clicking through
Brevo's domain-authentication flow — both written up in full in the chat response and in
`docs/vendor-operations-guide.md` Section 3 / `memory/technical-debt.md`.

---

## 2026-09-12 (session 61 follow-up) — Added "Ongoing work, at a glance" table (Phase 1 + Phase 2) to the user guide and its Artifact

**Task:** User-directed documentation addition — after being walked through what recurring
partner work looks like today and what each Phase 2 capability adds once it ships, the user
asked for that same picture as a single table in the user guide and Artifact, "since I think
it will simplify things for them at a glance."
**Summary:** Consolidated Phase 1's live recurring work (enquiries, Insights articles at the
firm's own ~2/month cadence, landing pages, occasional edits elsewhere, and Milestone 9's
still-blocked performance monitoring) and all 8 Phase 2 capabilities' own ongoing workload
once each one's trigger is met (`docs/scope.md`), into one 3-column table (What / Frequency
once live / Status: Live, Planned, or Gated) — added as a new "Ongoing work, at a glance"
section in both the markdown file and its Artifact mirror.
**Files Changed:** `docs/user-guide.md` (new section before Change log, + a change-log row),
Platform User Guide Artifact (Version 23 — new `#glance` section with matching jump-nav
entry, new `.status-live`/`.status-planned`/`.status-gated` CSS classes reusing the existing
`monitor-table` pattern).
**Related Feature:** `docs/scope.md` (Phase 2 capability list — the source of every Phase 2
row's trigger wording, not re-derived from memory).
**Notes:** Documentation-only; no code changed. Confirmed the table's own accuracy against
`docs/scope.md` directly before writing it (e.g. P2-3 Client Portal's `docs/scope.md`
Section 14 wording and P2-8's "outside kaalbert.com's own admin" ADR 0012 constraint) rather
than restating from the earlier conversational answer alone.

---

## 2026-09-12 (session 61 follow-up) — Fixed "My enquiries" fake-toggle bug; added name/email search after a personal-data-deletion process question

**Task:** User-directed follow-up, two parts. (1) Reported the "My enquiries" button "acts
like a tab but with no other tab to switch back to." (2) Asked how a personal-data-deletion
request is seen/tracked and what the actual request process is — surfaced while reviewing
the enquiries list built the same session.
**Summary:** (1) Confirmed the bug directly: the button renders with `aria-pressed`/a solid
active state (visually a toggle) but clicking it again while active just re-navigated to the
identical URL — no way back except rediscovering the "Assigned to" dropdown underneath it.
Fixed by making the click handler toggle: active → reverts to "All partners," inactive →
sets to the signed-in partner's id. Verified live via Playwright (logged in as the dev/Owner
test account): clicking twice now correctly returns to the unfiltered 8-enquiry list. (2)
Investigated the actual deletion-request flow end to end and reported honestly: there is no
request-intake mechanism anywhere in this system (no public form, no tracked "requested"
state — `personal_data_deleted_at` only ever records the after-the-fact deletion) — the
person contacts the firm directly, outside the app, and a partner must then find their
specific enquiry manually. Found the concrete bottleneck in that manual step: the list had no
search by name or email, only status/triage/source/assigned-to/date filters. Asked the user
what to build given three options (search only / search + a tracked request queue / leave
as-is); the user chose search only, as the smallest fix for the actual bottleneck, explicitly
declining the larger tracked-request-queue feature.
**Files Changed:** `app/admin/(shell)/enquiries/enquiries-filters.tsx` (My-enquiries toggle
fix; new `search` field in `EnquiriesFiltersValue`, a `<form onSubmit>`-based search input —
following `app/insights/page.tsx`'s established real-navigation-on-submit pattern rather than
firing a request per keystroke), `lib/admin-enquiries.ts` (`EnquiryListQuery.search`,
case-insensitive `OR` on `name`/`email` in `buildWhere`), `lib/admin-enquiries.test.ts` (+2
tests: OR-filter shape, trims/ignores blank search), `app/admin/(shell)/enquiries/page.tsx`
(`search` searchParam plumbed through `buildEnquiriesHref`/`hasActiveFilters`/the value
passed to `EnquiriesFilters`), `docs/features/enquiry-management.md`, `docs/user-guide.md` (+
Artifact republish pending), `memory/known-bugs.md`, `memory/decision-log.md`.
**Related Feature:** `docs/features/enquiry-management.md` (T8.1/T8.2/T8.4, session 61).
**Notes:** The deletion-request-tracking gap (no queue, no "requested" state, no audit trail
of the request itself) was deliberately left unbuilt per the user's own choice — documented
in `enquiry-management.md`'s Business rules as a real, named limitation so it isn't
rediscovered as a surprise later, not left as a silent gap.

---

## 2026-09-12 (session 61) — Enquiry assignment made visible (list filter/column, "My enquiries" shortcut, dashboard link); confirmed it stays open to every partner, not Owner-only

**Task:** User-directed follow-up — asked how a partner sees their assigned enquiries, and
for a recommendation on whether assignment should move to Owner-only alongside session 60's
account/profile lockdown.
**Summary:** Investigated first, rather than assuming: grepped the whole enquiries admin
surface and confirmed `assignedPartnerId` (T8.1) had been write-only since it was built —
settable on the detail screen, with zero read-side surface (no list column, no filter, no
dashboard mention). Recommended keeping assignment open to every partner (it's day-to-day
operational routing, not account/security control — doesn't gate visibility, only marks who's
on point) and fixing the visibility gap instead; the user approved proceeding on that
recommendation. Built: an "Assigned to" filter (a specific partner/"Unassigned"/"All
partners") and column on `/admin/enquiries`, a "My enquiries" one-click shortcut button on
that same filter (pre-fills it to the signed-in partner's own id), and a "My assigned
enquiries" quick-action link on the dashboard.
**Files Changed:** `lib/admin-enquiries.ts` (`EnquiryListQuery.assignedTo`, `buildWhere`
filter branch, `EnquiryListItem` gained `assignedPartnerId`/`assignedPartnerName`, the
`assignedPartner` relation now selected), `lib/admin-enquiries.test.ts` (+5 tests),
`lib/enquiry-list-options.ts` (`EnquiryAssignmentFilterValue`,
`ASSIGNMENT_FILTER_ALL`/`ASSIGNMENT_FILTER_UNASSIGNED`), `app/admin/(shell)/enquiries/
enquiries-filters.tsx` (new "Assigned to" `Select` + "My enquiries" button, new `partners`/
`currentUserId` props), `app/admin/(shell)/enquiries/page.tsx` (parses/validates the new
`assignedTo` search param, fetches `listAssignablePartners()`/`getCurrentAdminUser()`
alongside `listEnquiries`, renders the new column), `app/admin/(shell)/page.tsx`
(`buildQuickActions` now takes the signed-in user's id and adds "My assigned enquiries"),
`docs/features/enquiry-management.md`, `docs/user-guide.md` (+ Artifact republished),
`memory/decision-log.md`, `memory/known-bugs.md`.
**Related Feature:** `docs/features/enquiry-management.md`.
**Notes:** Full quality gate passing (lint/format:check/typecheck/test — 391/391, +4 new
tests). Verified live via Playwright against the real dev server: the "My enquiries" button's
pressed state, the "Assigned to" column showing "You" for the viewer's own row, the
"Unassigned" filter correctly isolating 7 of the 8 real enquiries (the 1 already-assigned row
correctly excluded), and clean mobile-width (390px) layout with no changes needed to the
existing filter row's own responsive behavior. **Final audit, same session:** re-swept every
model in `prisma/schema.prisma` against every admin list screen's rendered columns and every
write API route against its display surface, specifically hunting the "write works, no read
surface exists at all" failure signature (distinct from session 60's own audit, which checked
conditional-rendering gates instead). No further instance found — full detail in
`memory/decision-log.md`'s update to this session's own entry. No code changes resulted; the
session's real fix remains the one committed as `baf22bc`.

---

## 2026-09-12 (session 60) — Real Owner/Partner roles, invite/link flow, sidebar identity + sign-out, self-service account page, manual publish toggle

**Task:** User-directed overhaul of the whole admin user/account system, superseding T6.6's
"CLI script is proportionate" and T7.6's "no role gate" scope calls after live testing showed
zero of the 5 real partners had ever had a login and the account-actions panel had never
rendered for anyone.
**Summary:** Full plan (`/home/cosbydeveloper/.claude/plans/serene-weaving-sutton.md`), see
`memory/decision-log.md`'s own session-60 entry for the complete narrative, the three
confirmed design decisions, and the reachability-audit findings. In short:

- `AdminRole` is now a real, enforced Prisma enum (`OWNER`/`PARTNER`) — hand-written migration
  (`prisma migrate dev`'s interactive prompt hangs non-interactively), verified lossless
  against the live shared DB via direct `pg` queries.
- `lib/auth/current-user.ts` (`getCurrentAdminUser`/`isOwner`/`canEditAuthorProfile`) is the
  one canonical identity/permission helper; every admin-user action route, the Team editor,
  and the Team list are now genuinely gated by it (previously zero caller-identity check
  beyond "a session exists").
- `lib/admin-team.ts`'s `createPartnerAccount` powers the new Owner-only `/admin/team/new`
  invite flow (link-an-existing-Author or create-brand-new), auto-emailing the password + 2FA
  setup link via Brevo, with a password/link fallback if the email fails to send.
- `/admin/account` (new, any role): in-session password change (`lib/auth/
change-password.ts`), voluntary 2FA device re-enrollment, and backup-code regeneration
  (`lib/auth/backup-codes.ts`, extracted from `confirmTotpSetup` for reuse) — none of this
  existed before this session.
- The sidebar's hardcoded "Signed-in partner / Role" placeholder is replaced by
  `components/admin-account-menu.tsx`, a real dropdown (profile/account-security/sign-out)
  driven by the actual signed-in identity, on both desktop and the mobile drawer.
- `Author.published` is now a computed-guard-plus-manual-override toggle (`updateAuthor` no
  longer auto-computes it, but still rejects `published: true` while a required field is
  blank), replacing T7.6's fully-computed rule.
- Three real, previously-shipped bugs found and fixed in the same session (full detail in
  `memory/known-bugs.md`): `resetAdminUserTotp` issued a 2FA reset link that could never be
  completed for its one real use case (fixed via a new `reissueSetupToken` helper); the
  dashboard's "Manage my account & 2FA" quick action pointed at a dead `/admin/setup-2fa`
  link with no token (now points at `/admin/account`); three new client components importing
  the `AdminRole` enum value directly from `@/generated/prisma/client` broke `/admin`'s
  entire Turbopack compile (fixed via a new client-safe `lib/admin-role-options.ts`,
  CLAUDE.md's client-bundle rule broadened to name this second failure route explicitly).
- Two more small, no-design-decision fixes from the reachability audit: removed the sidebar's
  dead "Performance" nav link (Milestone 9 hasn't shipped that screen); hardened Diagnostic
  Configuration's High/Medium threshold lookup to key on `dimensionId: null` + fixed seed ids
  instead of the editable `triagePriorityLevel` label.
- Diagnostic Questions' reorder ▲/▼ buttons (user-reported "doesn't make sense," verified via
  direct DOM state extraction to be logically correct the whole time) now show a visible
  per-dimension header row in the table, so the boundary each button enforces is visible, not
  just technically correct.
  **Files Changed:** `prisma/schema.prisma` + 2 new migrations, `lib/auth/current-user.ts` (+
  test, new), `lib/admin-team.ts` (+ test, new), `lib/admin-role-options.ts` (new), `lib/auth/
backup-codes.ts` (+ test, new, extracted from `lib/auth/totp-setup.ts`), `lib/auth/
change-password.ts` (+ test, new), `lib/auth/totp-setup.ts` (`reissueSetupToken` added),
  `lib/admin-authors.ts` (+ test — `setAdminUserRole`, `resetAdminUserTotp` fix,
  `setAdminUserActive` self-lockout guard, `updateAuthor` publish-toggle rewrite),
  `app/api/admin/admin-users/[id]/{deactivate,reactivate,reset-2fa,reset-password}/route.ts`
  (Owner guard added), `app/api/admin/admin-users/[id]/role/route.ts` (new),
  `app/api/admin/authors/[id]/route.ts` (permission check added), `app/api/admin/team/
route.ts` (new), `app/api/admin/auth/{logout,change-password,reissue-2fa-setup,
regenerate-backup-codes}/route.ts` (all new), `app/admin/(shell)/layout.tsx`,
  `components/admin-mobile-sidebar.tsx`, `components/admin-account-menu.tsx` (new),
  `components/admin-sidebar-nav.tsx` (Performance link removed), `app/admin/(shell)/account/`
  (new, page + form), `app/admin/(shell)/team/page.tsx`, `.../team/[id]/page.tsx`, `.../team/
[id]/author-editor-form.tsx`, `.../team/[id]/admin-user-actions-panel.tsx`, `.../team/new/`
  (new, page + form), `app/admin/(shell)/page.tsx` (dead quick-action link fixed),
  `app/admin/(shell)/diagnostic-configuration/configuration-client.tsx` (fixed-id threshold
  lookup), `app/admin/(shell)/diagnostic-questions/questions-list-client.tsx` (dimension
  grouping), `docs/features/admin-authentication.md`, `docs/features/content-management-
admin.md`, `CLAUDE.md` (client-bundle rule broadened), `memory/decision-log.md`,
  `memory/technical-debt.md`, `memory/known-bugs.md`.
  **Related Feature:** `docs/features/admin-authentication.md`, `docs/features/content-
management-admin.md`.
  **Notes:** Verified via Playwright against the live dev server (real Brevo email sent, real
  DB writes) using one disposable test account (never a real named partner, since dev/prod
  share one database) — left deactivated and unpublished afterward rather than hard-deleted, to
  avoid a raw DB mutation outside the app's own tooling. Full quality gate
  (lint/format/typecheck/test, 387 tests) passing at completion.

---

## 2026-09-12 (T07-05 follow-up, session 60)

**Task:** T7.5 follow-up — allow editing an already-live landing page, not just creating one
**Summary:** User asked why landing pages couldn't be edited once live, pointing out edits to
a campaign page are inevitable. Traced the original create-only scope to a real gap (never a
deliberate immutability decision — see `memory/decision-log.md`) and built the correction:
`getLandingPageForEdit`/`updateLandingPage` in `lib/admin-landing-pages.ts` (sharing
validation with `createLandingPage` via a new `validateLandingPageContent` helper, and
sharing request parsing via a new exported `parseLandingPageContentInput`, mirroring
`lib/articles.ts`'s `parseArticleSaveInput` convention), a new `PATCH
/api/admin/landing-pages/[slug]` route, a new `/admin/landing-pages/[slug]` edit screen
(`EditLandingPageForm`, reusing the existing `LandingPageBlockEditor`), and an Edit link on
the list screen. The URL slug stays fixed after creation — not shown as an input at all on
the edit form, just a read-only reference — since it's the literal destination printed on ad/
QR/campaign copy.
**Files Changed:** `lib/admin-landing-pages.ts`, `lib/admin-landing-pages.test.ts`,
`app/api/admin/landing-pages/route.ts`, `app/api/admin/landing-pages/[slug]/route.ts` (new),
`app/admin/(shell)/landing-pages/page.tsx`, `app/admin/(shell)/landing-pages/[slug]/page.tsx`
(new), `app/admin/(shell)/landing-pages/[slug]/edit-landing-page-form.tsx` (new),
`app/admin/(shell)/landing-pages/new/new-landing-page-form.tsx` (doc-comment only),
`docs/features/landing-page-template.md`, `docs/features/content-management-admin.md`,
`docs/user-guide.md` (+ Artifact republish), `memory/decision-log.md`.
**Related Feature:** `docs/features/landing-page-template.md`,
`docs/features/content-management-admin.md`.
**Notes:** Verified live via Playwright: opened the real edit screen for
`business-health-check` (a seeded instance), confirmed every field populated with its real
current content, edited and saved the kicker field, confirmed it persisted across a fresh
page load, confirmed the public `/lp/business-health-check` page still rendered afterward,
then reverted the test edit back to its original value. Also confirmed the compliance
checkbox resets to unchecked after every save (a fresh promotional-copy sign-off each time,
never inherited) and checked the form at mobile width (390px). Full quality gate clean:
`npm run lint && npm run format:check && npm run typecheck && npm run test` (352 tests, 18 in
`lib/admin-landing-pages.test.ts` alone). Milestone 7 (Content Admin) had already fully
shipped, so per CLAUDE.md's "small fix on an already-shipped task → do it now" rule this was
built directly rather than filed as a new task.

---

## 2026-09-12 (T01-05 follow-up, session 60)

**Task:** T1.5 follow-up — admin sidebar nav never highlighted a nested detail/editor page
**Summary:** User reported the sidebar doesn't highlight a section's tab on an inner page
(e.g. an article's edit screen). `components/admin-sidebar-nav.tsx` compared `pathname ===
item.href` exactly, so every detail/editor route (`/admin/articles/42`, `/admin/team/7`,
`/admin/landing-pages/new`, etc.) never lit up its own section. Extracted a new, exported,
directly-tested `isNavItemActive(pathname, href)`: active on an exact match or any nested
path, with `/admin` (Dashboard) as the one exact-match-only exception since every other href
nests under it. Also normalizes `/admin/diagnostic-configuration` (a second screen reached by
an inline link from `/admin/diagnostic-questions`, not its own sidebar item) to its parent
path so that section stays highlighted there too.
**Files Changed:** `components/admin-sidebar-nav.tsx`,
`components/admin-sidebar-nav.test.ts` (new).
**Related Feature:** N/A — presentational/navigation logic, not a feature doc's concern.
**Notes:** Verified live via Playwright on both the persistent desktop sidebar and the mobile
off-canvas drawer (both render this same component) — an article detail page, a team member
detail page, and the diagnostic-configuration second screen all correctly kept their parent
tab highlighted. This project's first pure-logic test extracted specifically for component
testability (no RTL render needed, per CLAUDE.md's "business logic ... never inside a
component beyond what's needed to call into `lib/`" spirit applied to presentational logic
too). Full quality gate clean.

---

## 2026-09-12 (production-hardening follow-up, session 60, second pass)

**Task:** Close the closable security/SEO gaps flagged by `docs/vendor-operations-guide.md`'s
first pass; close the admin-login secrets bug; fix a real bug in the guide's own
admin-account-creation instructions.
**Summary:** Added baseline HTTP security headers (`next.config.ts`'s `headers()` —
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Strict-Transport-Security`) and a new `app/robots.ts` (allow all, disallow `/admin`, points
at the dynamic sitemap) — both verified live via a local dev server (`curl -I`, `curl
/robots.txt`). Closed `memory/known-bugs.md`'s admin-secrets entry to `Fixed` after the user
confirmed a real redeploy happened following session 54's `railway variable set`. Separately,
the user's own attempt to run this guide's documented `railway run --service kaalbert-web --
npm run admin:create-user ...` command failed for real
(`Can't reach database server at postgres.railway.internal`) — diagnosed the root cause
(`railway run` executes locally but injects the live service's **private-network**
`DATABASE_URL`, which only resolves inside Railway's own infrastructure), rewrote §8 with the
actually-working method (run the script bare, letting `.env.local`'s public-proxy connection
reach the same single shared database, with a `NEXT_PUBLIC_SITE_URL` override so the printed
setup link resolves before the real domain exists), and created the user's real admin account
this way (`admin_user #15`). Also tested and documented `railway ssh` as the genuine
"run it on Railway itself" alternative the user asked about — confirmed it needs a one-time
`railway ssh keys add`/`railway ssh keys github` first (the user's account had none
registered), which was left for the user to do themselves rather than run automatically.
**Files Changed:** `next.config.ts`, `app/robots.ts` (new), `memory/known-bugs.md`,
`docs/vendor-operations-guide.md`, its Artifact mirror (republished).
**Related Feature:** `docs/features/seo-and-search-foundation.md`,
`docs/features/admin-authentication.md`.
**Notes:** Not tied to any `docs/tasks/*.md` task ID — vendor/operations work outside the
formal roadmap, same bucket as the guide itself. Full quality gate re-run clean after every
change (`npm run lint && npm run format:check && npm run typecheck && npm run test`, 338
tests). Left deliberately open, per the guide's own reasoning: Content-Security-Policy (needs
a live domain to test against safely) and persistent rate-limit storage (only matters once
the service scales beyond one instance).

---

## 2026-09-12 (T2.8 follow-up, session 60)

**Task:** T2.8 follow-up — use a dedicated Open Graph share image instead of the primary logo
**Summary:** Start of production-hardening work: the firm supplied a purpose-built 2000×1050
share image (`Company Docs/Brand assets/Logo_OG_Image_2000x1050.png`, same aspect ratio as
the standard ~1200×630 OG/Twitter card) specifically for link previews, distinct from
`/brand/logo-primary.png` (which stays in use for the Organization JSON-LD `logo` field —
a different purpose, unchanged). Copied it to `public/brand/og-default.png` and pointed
`lib/seo.ts`'s `buildPageMetadata` default-image fallback at it (an article's own
`previewImage` still overrides this exactly as before — nothing about that path changed).
Milestone 2 (`docs/tasks/02-public-presentation.md`) already fully shipped, so per CLAUDE.md's
"small fix, owning task already shipped → fix now" rule this was done immediately and logged
as a follow-up rather than opening a technical-debt entry. Also fixed one pre-existing
`format:check` failure found while running the full quality gate (`docs/sessions/session-59-
enquiry-personal-data-deletion.md` had unformatted Prettier output) so the branch stays clean.
**Files Changed:** `public/brand/og-default.png` (new asset), `lib/seo.ts`,
`lib/seo.test.ts`, `docs/sessions/session-59-enquiry-personal-data-deletion.md` (formatting
only).
**Related Feature:** `docs/features/seo-and-search-foundation.md`.
**Notes:** Verified live via a local dev server: `curl`'d the home page and confirmed the
rendered `og:image`/`twitter:image` tags now resolve to `/brand/og-default.png`, and that the
file itself is served at `200 image/png`. Full quality gate re-run clean after the change:
`npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test` (338 tests) all
pass. No production deploy implication beyond the next normal push — this is a static asset
plus a metadata default, not an env/infra change.

---

## 2026-09-12 (T8.4, session 59)

**Task:** T8.4 — Personal-data deletion — `DELETE /api/admin/enquiries/[id]/personal-data`
**Summary:** Unblocked this session — asked the firm directly (`AskUserQuestion`) whether a
converted enquiry needs special retention treatment; the firm chose "delete regardless of
status," recorded in `docs/tasks/08-enquiry-management.md`, `docs/features/enquiry-
management.md`, and `docs/dashboard.md`'s "Blocked On" list before any code was written. Built
`deletePersonalData` (nulls `name`/`email`/`phone`/`message`, retains everything else,
idempotent), a new `personalDataDeletedAt` column so the admin UI can distinguish a real
deletion from a name that was simply never given, the `DELETE` route, and a **Delete personal
data** button on the T8.3 detail screen behind a real `AlertDialog` confirmation. This
completes Milestone 8 (Enquiry Management) in full.
**Files Changed:** `prisma/schema.prisma` (`EnquiryRecord.personalDataDeletedAt`),
`prisma/migrations/20260912012155_t8_4_enquiry_personal_data_deletion/`, `lib/admin-
enquiries.ts` (`deletePersonalData`, `EnquiryWriteValidationError` — renamed from
`EnquiryUpdateValidationError`, now shared by update and delete), `lib/admin-enquiries.test.ts`
(+3 tests, 27 total), `app/api/admin/enquiries/[id]/personal-data/route.ts` (new, `DELETE`),
`app/admin/(shell)/enquiries/[id]/delete-personal-data-button.tsx` (new), `app/admin/(shell)/
enquiries/[id]/page.tsx` (renders the deleted state), `app/admin/(shell)/enquiries/page.tsx`
(list shows "Personal data deleted" instead of a blank name), `docs/tasks/08-enquiry-
management.md`, `docs/features/enquiry-management.md`, `docs/dashboard.md`, `docs/user-
guide.md` + Artifact mirror, Website Build Status Artifact (Milestone 8 now Complete with no
caveat, resolved "Waiting on you" item removed).
**Related Feature:** `docs/features/enquiry-management.md`
**Notes:** Verified live via Playwright MCP: deleted a real contact-form enquiry's personal
data end-to-end (confirmation dialog → confirm → `router.refresh()` shows "Personal data
deleted" immediately on both the detail screen and the Enquiries list, with the deletion date
shown), confirmed every other field (score, status, notes, attribution, consent) stayed
intact. Checked at desktop/tablet(768px)/mobile(390px). All quality gates pass (338/338
tests). Milestone 8 (T8.1–T8.4) is now fully shipped — the next real roadmap task is T5.5
(resequenced into Milestone 9's start per `docs/roadmap.md`), itself still blocked on real
ad-platform accounts and domain registration the firm hasn't provisioned yet; see the session
summary's own handoff for the details.

---

## 2026-09-12 (T8.3, session 58)

**Task:** T8.3 — Enquiry detail — `/admin/enquiries/[id]`
**Summary:** Built the screen a partner actually acts on an enquiry from: full diagnostic
responses reconstructed into plain language (see `memory/decision-log.md`'s
`resolveAnswerLabel` entry — this schema only ever stored the normalized 0–1 value, never the
original label), dimension score breakdown with weakest-dimension highlighting, contact
details, contact/marketing consent shown as two visibly distinct boxes (never merged),
attribution (source/medium/campaign/landing page, or "No attribution captured" if none
exists), and the one editable panel — status, assigned partner, internal notes, with a real
`PATCH /api/admin/enquiries/[id]`. A contact-form-originated enquiry shows "Not applicable"
for the two diagnostic-only panels instead of blank/broken. `statusUpdatedAt` only changes
when `status` actually changes (a notes-only or assignment-only save leaves it untouched, per
its own doc-comment from T8.1). This completes Milestone 8 except T8.4, which stays blocked on
a firm policy decision (not scheduled).
**Files Changed:** `lib/admin-enquiries.ts` (added `getEnquiryDetail`, `listAssignablePartners`,
`updateEnquiry`, `resolveAnswerLabel`), `lib/admin-enquiries.test.ts` (+24 tests total),
`app/api/admin/enquiries/[id]/route.ts` (new, PATCH), `app/admin/(shell)/enquiries/[id]/
page.tsx` (new), `app/admin/(shell)/enquiries/[id]/enquiry-editor-form.tsx` (new),
`docs/user-guide.md` + Artifact mirror (new "Enquiry detail" section), Website Build Status
Artifact (Milestone 8 marked Complete with the T8.4 caveat, ~90% overall progress).
**Related Feature:** `docs/features/enquiry-management.md`
**Notes:** Verified live via Playwright MCP at desktop/tablet(768px)/mobile(390px): opened a
real diagnostic-originated enquiry (#27, all 15 responses rendered correctly, including scale
answers as "5 / 5" and choice answers as their real labels), changed its status to Contacted,
assigned it to the dev partner account, added notes, saved, reloaded to confirm persistence,
and confirmed the list screen (T8.2) reflected the update. Also submitted a real contact-form
enquiry and confirmed its detail page correctly shows "Not applicable" for both diagnostic
panels, the real message/service-line/consent, and a real "Given"/"Not given" consent
distinction. Confirmed `notFound()` (real 404) for a nonexistent enquiry id. No admin-facing
way exists yet to see a partner's _own_ assigned-enquiries list (e.g. "my enquiries") — not
named anywhere in `enquiry-management.md`'s own scope, so not built; a partner filters/opens
from the shared list instead.

---

## 2026-09-12 (T8.2, session 57)

**Task:** T8.2 — Enquiries list — `/admin/enquiries`
**Summary:** Built the first real screen a partner uses to see incoming enquiries: a
filterable, sortable, server-side-paginated list of every `enquiry_record` row. Triage-flagged
rows sort first by default (`ORDER BY triage_flag DESC NULLS LAST, created_at DESC` — Postgres
defaults `NULLS FIRST` on a `DESC` sort, which would otherwise put every contact-form row,
`triageFlag: null`, ahead of genuinely flagged diagnostic rows). Filters: status (real
`EnquiryStatus` enum), triage (flagged/not flagged, filtering on the authoritative
`triageFlag` boolean), source (Business Health Check/Contact form), and an inclusive date
range; sort: triage priority (default), newest, or oldest — all URL-driven (`useRouter` +
Base UI `Select`s pushing a real, shareable query string), never client-only state, matching
`app/insights/page.tsx`'s established precedent for exactly this problem. Pagination is real
server-side `skip`/`take` (20/page) — this is the first admin list in the codebase built this
way (every prior one loads its full set and paginates client-side), required because this
list's own acceptance criterion explicitly rules out loading the full set. While building the
Triage filter, found and fixed a real display bug in T8.1's dashboard badge (see
`memory/decision-log.md`): a pre-T8.1 enquiry with `triageFlag: true` but no
`triagePriorityLevel` was rendering "Not flagged," which became actively misleading once a
partner could filter to "Flagged" and see contradictory badges in the result. Fixed via a
shared `resolveTriageBadge` now used by both screens. Also corrected
`enquiry-management.md`'s User flow, which named a "business" column with no backing field
anywhere in this schema (see decision-log for why this wasn't logged as debt).
**Files Changed:** `lib/admin-enquiries.ts` (new), `lib/admin-enquiries.test.ts` (new),
`lib/enquiry-list-options.ts` (new), `lib/enquiry-list-options.test.ts` (new),
`app/admin/(shell)/enquiries/page.tsx` (new), `app/admin/(shell)/enquiries/enquiries-
filters.tsx` (new), `app/admin/(shell)/page.tsx` (Triage/Status badge logic now shared with
the new list), `lib/admin-dashboard.ts` (reuses `resolveEnquirySource` from `lib/admin-
enquiries.ts` instead of its own private copy), `docs/features/enquiry-management.md`
(User flow correction), `docs/user-guide.md` + Artifact mirror.
**Related Feature:** `docs/features/enquiry-management.md`
**Notes:** Verified live via Playwright MCP at desktop/tablet(768px)/mobile(390px): logged
into `/admin/enquiries`, exercised every filter (status, triage, source, date range, sort),
confirmed the empty state ("No enquiries match" + Clear filters) for a filter combination with
zero results, and confirmed real pagination against a temporary seed of 520 synthetic rows
(527 total) — 27 pages, correct triage-first ordering across the full set, correct mixed
diagnostic/contact-form rendering on the last page, "Next"/page links behaving correctly at
both ends. The synthetic rows and the throwaway seed/cleanup scripts used to create them were
both removed before ending the session — dev DB is back to its real 7 rows. No detail screen
or status/notes/assignment editing yet (`/admin/enquiries/[id]` links render but 404 until
T8.3) — out of this task's own scope by design.

---

## 2026-09-11 (T8.1, session 56)

**Task:** T8.1 — Enquiry schema extension (Milestone 8's first task)
**Summary:** Extended `enquiry_record` with `status` (new `EnquiryStatus` enum:
new/contacted/closed/converted/not_a_fit, `@default(new)`, every pre-existing row backfilled),
`assignedPartnerId` (nullable FK to `admin_user`, `onDelete: SetNull`), `internalNotes`
(text), and `statusUpdatedAt` (defaults to `now()`), per `enquiry-management.md`'s Data
requirements. While already extending this table, also added `triagePriorityLevel` (`String?`,
no backfill — null for every pre-existing row by design) closing the T7.1-raised gap where
`lib/diagnostic-scoring.ts` computed a real High/Medium/Low priority per submission but never
returned or persisted it: `DiagnosticScoringResult` now exposes `overallPriorityLevel`, and
`lib/diagnostic-submit.ts` writes it to the new column alongside the existing boolean
`triageFlag`. Updated `lib/admin-dashboard.ts`'s `getAdminDashboardStats` (New Enquiries now
filters `status: "new"` for real, no longer an unfiltered count) and `getRecentEnquiries`
(selects/returns the real `status`/`triagePriorityLevel` columns), plus both functions' tests.
Revisited T7.1's dashboard (`app/admin/(shell)/page.tsx`): the Triage column now renders the
real High/Medium/Low badge (mirroring `ui/mockups/_shared.css`'s
`badge-triage-high/medium/low` via Tailwind design tokens) instead of a boolean Flagged/Not
flagged approximation, and the Status column renders the real per-row label instead of a
hardcoded "New" string. Closed both technical-debt entries this task was sequenced into. No
route or UI of its own beyond that dashboard revisit — T8.2/T8.3 build the actual
list/detail screens against this schema.
**Files Changed:** `prisma/schema.prisma`,
`prisma/migrations/20260911232638_t8_1_enquiry_status_assignment_notes/migration.sql`,
`lib/diagnostic-scoring.ts`, `lib/diagnostic-scoring.test.ts`, `lib/diagnostic-submit.ts`,
`lib/diagnostic-submit.test.ts`, `lib/admin-dashboard.ts`, `lib/admin-dashboard.test.ts`,
`app/admin/(shell)/page.tsx`
**Related Feature:** `docs/features/enquiry-management.md`
**Notes:** Verified live via Playwright MCP: logged into `/admin`, completed a real diagnostic
submission (worst answer to every question) end-to-end, which created enquiry #27 scored
35/100 with a real "High" `triagePriorityLevel`; confirmed the dashboard rendered a "High"
triage badge and "New" status for that row, and correct stat-card counts, at desktop, tablet
(768px), and mobile (390px) widths. One accepted, documented consequence of the no-backfill
design: a pre-existing row that was already `triageFlag: true` now shows "Not flagged" in the
dashboard's Triage column (since its `triagePriorityLevel` is null), even though the
"Triage-flagged" stat card and `triageFlag` itself still correctly count/reflect it — this is
exactly what the task's own Input → Output contract specifies (no backfill requirement for
this column), not a bug.

---

## 2026-09-11 (T7.11, session 55)

**Task:** T7.11 — Article byline resolves against a real `author.published` check
**Summary:** Asked the firm directly (via `AskUserQuestion`, per the task's own explicit
"requires a real product decision" instruction) which of two documented options should
govern an unpublished author's existing article bylines. The firm chose: fall back to
crediting "Kaalbert & Company Ltd" (not omit the byline, not leave it unchanged). Implemented
in `lib/insights.ts`: `shapeArticleCard` and `getArticleBySlug` both now check
`author.published` and substitute `FIRM_NAME` (newly exported from `lib/seo.ts`) for the
author's name once unpublished, blanking `authorPracticeArea`/`title`/`bio`/`photoUrl` (there
is no practice area/bio/photo for the firm itself to invent) rather than fabricating
firm-specific versions of them. `app/insights/[slug]/page.tsx` and `components/insights-
article-card.tsx` both treat an empty practice area as "omit the separator" (same pattern as
an uncategorized article), and the article page's fuller, bio-bearing byline block is hidden
entirely once unpublished rather than rendering a bio-less card. Also fixed `lib/seo.ts`'s
`getArticleJsonLd`, found while implementing: it previously hardcoded the JSON-LD `author` as
`@type: "Person"` unconditionally, which would have described "Kaalbert & Company Ltd" as a
`Person` with a blank `jobTitle` — added an `authorPublished` flag so it emits
`@type: "Organization"` (no `jobTitle`) in the fallback case instead. Deliberately left
`lib/articles.ts`'s admin Articles list untouched — a partner managing content needs the real
author name for editorial purposes, a different concern from the public byline this task
governs. Verified live against the real dev database: flipped a real author's `published`
flag directly (bypassing the admin's own protective validation, the exact scenario the
originating known-bug describes), confirmed the article page/index card/JSON-LD all showed
the fallback correctly at mobile and desktop widths, then restored the flag and confirmed the
real byline returned with no regression.
**Files Changed:** `lib/insights.ts`, `lib/insights.test.ts`, `lib/seo.ts`, `lib/seo.test.ts`,
`lib/home.test.ts`, `app/insights/[slug]/page.tsx`, `components/insights-article-card.tsx`.
**Related Feature:** `docs/features/insights-engine.md`, `docs/features/about-and-partners-
page.md` (`author.published`'s existing, narrower documented scope this task extended).
**Notes:** This completes every task in `docs/tasks/07-content-admin.md` — Milestone 7
(Content Management Admin) is now fully shipped. Nothing in `docs/user-guide.md` changed —
this task fixed a rendering-layer gap with no new admin capability or partner-visible
control; the firm's byline-policy answer itself has no UI to operate, it's a fixed rule now
baked into how the site renders. The "Website Build Status" Artifact was republished twice:
Version 7 for Milestone 7's completion (milestone ledger, progress stat, "Your Team" usability
panel), then Version 8 after the user caught a dangling "see note below" with no actual note
on the Milestone 5 row — while fixing it, also surfaced two more real firm-facing gaps the
Artifact was missing (domain registration, real partner photography now being genuinely
actionable via T7.6's Team editor) and one stale technical-debt entry that had actually been
resolved at T7.7 but never flipped. See `memory/decision-log.md` for the full audit.

## 2026-09-11 (session 54)

**Task:** Provision Cloudflare R2 and close out the two R2-blocked technical-debt entries —
not a `docs/tasks/*.md` task, an infrastructure/ops session
**Summary:** User provisioned a real R2 bucket (`kaalbert-media`) and S3-compatible API token
directly in the Cloudflare dashboard. Wired it into the codebase: new `lib/r2-client.ts`
(a cached `@aws-sdk/client-s3` `S3Client` pointed at R2's S3-compatible endpoint, plus
`getR2PublicUrl`/`getR2ObjectKeyFromUrl` helpers); `lib/media-storage.ts`'s
`encodeImageUpload`/`encodeDownloadFileUpload` now upload to R2 and return real public URLs
(both became `async` — the only call-site change needed, in the two media API routes);
`lib/insights.ts`'s `isResourceReachable` now uses a `HeadObjectCommand` against our own
bucket instead of a plain HTTP `HEAD` against an arbitrary host, falling back to the old
check for any non-R2 URL. No backfill migration needed — every table this touches was
confirmed still `null`/empty before writing the new code. Verified fully live via Playwright:
uploaded a real image and a real PDF through the admin, confirmed both landed at real,
publicly-fetchable `https://pub-....r2.dev/...` URLs (`curl` against the live object matched
content-type and exact byte size), confirmed the public article page's resource link
resolved as available via the new `HeadObjectCommand` path, then deleted both test objects
directly from the bucket.

Also discovered and fixed, while auditing the live Railway service's variables before adding
R2 credentials there: `ADMIN_CHALLENGE_TOKEN_SECRET` and `ADMIN_TOTP_ENCRYPTION_KEY` were
never set on production at all — every real `/admin/login` attempt has been hard-erroring
since Milestone 6 shipped. Generated two fresh, production-only values (never reused from
either local `.env.*` file) and set them on the live `kaalbert-web` service. **Not yet live**
— setting Railway variables doesn't itself deploy, and this session's own auto-mode
permissions blocked the follow-up `railway redeploy` as a Production Deploy action requiring
explicit user approval. See `memory/known-bugs.md`.

Brought `.env.example`, `.env.local` (user's own action), `.env.production` (local prod-build
testing only, per its own header comment — never read by the deployed app), and
`CLAUDE.local.md` in sync with each other and with the actual live Railway variables —
comprehensive pass, not R2-only: cross-checked every `process.env.*` reference in the
codebase against `.env.example`, fixed `.env.production`'s stale `NEXTAUTH_SECRET=` (the
pre-T6.3 placeholder name, still present there even though `.env.example`'s own comment has
documented the rename since T6.3) and its entirely-missing `ADMIN_TOTP_ENCRYPTION_KEY`, and
corrected `CLAUDE.local.md`'s Credentials section, which still described Brevo as "awaiting a
real account" even though `.env.local`/`.env.production`/Railway have all held a real
`BREVO_API_KEY` for some time — a stale status note unrelated to R2, caught in the same pass.
**Files Changed:** `lib/r2-client.ts` (new), `lib/media-storage.ts`, `lib/media-storage.test.ts`,
`lib/insights.ts`, `lib/insights.test.ts`, `app/api/admin/media/route.ts`, `app/api/admin/
media/downloads/route.ts`, `package.json`/`package-lock.json` (`@aws-sdk/client-s3`),
`.env.example`, `.env.production` (gitignored, local), `CLAUDE.local.md`,
`memory/technical-debt.md` (both R2 entries resolved), `memory/decision-log.md`,
`memory/architecture-decisions.md` (ADR 0004 entry), `memory/known-bugs.md` (new entry — the
missing production auth secrets). Also set 7 variables directly on the live `kaalbert-web`
Railway service (5 `CLOUDFLARE_R2_*`, `ADMIN_CHALLENGE_TOKEN_SECRET`,
`ADMIN_TOTP_ENCRYPTION_KEY`) — not a file in this repo, `railway variable set`.
**Related Feature:** ADR 0004 (Cloudflare CDN/proxy), `docs/features/insights-engine.md`
(the resource-availability edge case `isResourceReachable` implements).
**Notes:** **A production redeploy is still required and was not done this session** — see
`memory/known-bugs.md`'s new entry. The R2 credentials and both auth secrets are set on
Railway but inert until the `kaalbert-web` service is redeployed (Railway dashboard's
"Redeploy" button, or `railway redeploy --service kaalbert-web` with permission to run it).
Nothing in `docs/user-guide.md` changed — this session touched infrastructure/environment
plumbing only, no partner-visible admin capability changed.

---

## 2026-09-11 (T7.10, session 53)

**Task:** T7.10 — Article downloadable-resource management
**Summary:** Built a "Downloadable resources" panel on the article editor's right column
(`article-resources-panel.tsx`), rendered only for an existing article since
`ArticleResource.articleId` is a required FK. Found and corrected a stale instruction in the
epic file while assembling this task's own prompt: its "Build" line called for a new
non-image upload mechanism "generalized to accept non-image files," but T7.5 (built after
that epic entry was written) already built exactly that —
`components/admin-download-upload-button.tsx`'s `AdminDownloadUploadButton` posting to
`POST /api/admin/media/downloads`, calling `lib/media-storage.ts`'s
`encodeDownloadFileUpload`. Reused it directly rather than building a second upload path.
Add: a Label field gates the upload button (disabled — shown as a hint instead — until a
label is typed, since `ArticleResource.fileUrl` is non-nullable and there's no "draft with no
file yet" state); on upload, the row is created immediately via its own API route, not
bundled into the editor's "Save draft"/"Publish" flow — same self-contained-widget pattern as
the Categories list's add/rename/retire (T7.2), not `block-editor.tsx`'s in-memory-array
pattern (`ArticleResource` is a real child table, not one JSON column). Reorder: ▲/▼ buttons,
persisted via a 3-step `sortOrder`-swap transaction (`lib/admin-article-resources.ts`'s
`moveArticleResource`), identical shape to `lib/admin-diagnostic.ts`'s
`moveDiagnosticQuestion` and required for the same reason —
`@@unique([articleId, sortOrder])` is checked immediately in Postgres, so a plain 2-statement
swap would violate it mid-transaction. Remove: an `AlertDialog`-confirmed real delete
(`ArticleResource` has no "never hard-delete" rule, unlike `Subscriber`'s soft unsubscribe).
Verified live via Playwright against the real dev server: uploaded two real PDFs to a
published article, confirmed both appeared correctly on the real public article page in the
same order set in admin; reordered them in admin, reloaded, and confirmed the new order
persisted server-side and matched on the public page; removed one and confirmed its download
link disappeared from the public page on the same request cycle; confirmed the confirmation
dialog's copy and behaviour; checked the panel at mobile/tablet/desktop widths. Cleaned up
all test data afterward, leaving the article exactly as it was found.
**Files Changed:** `lib/admin-article-resources.ts` (new) — `getArticleResources`/
`addArticleResource`/`removeArticleResource`/`moveArticleResource`;
`lib/admin-article-resources.test.ts` (new) — 9 tests; `app/admin/(shell)/articles/
article-resources-panel.tsx` (new); `app/admin/(shell)/articles/article-editor-form.tsx`
(added the `resources` prop and panel render, gated on `articleId`); `app/admin/(shell)/
articles/[id]/page.tsx` (fetches and passes resources); `app/api/admin/articles/[id]/
resources/route.ts` (new, `POST`); `app/api/admin/articles/resources/[resourceId]/route.ts`
(new, `DELETE`); `app/api/admin/articles/resources/[resourceId]/move/route.ts` (new, `POST`).
**Related Feature:** `docs/features/insights-engine.md` (the `article_resource` entity and
its graceful-failure-on-removed-file edge case, which this task's own admin action is
distinct from — a partner's Remove here is a normal, immediate, successful delete).
**Notes:** Closed two technical-debt entries: "Article downloadable-resource attachment...
is not built" (Resolved) and, while updating it, caught that its own `Sequenced into`
pointer — and a sibling entry's ("Article/author image uploads use an interim base64
data-URI store") — both pointed at already-shipped tasks (T7.10 itself, and T7.6 from an
earlier session). Reclassified both to `Trigger type: User-triggered` with no task pointer,
since their real fix depends on Cloudflare R2 actually being provisioned (an external,
firm-initiated precondition), not on any future task in this project's own sequence — see
`memory/technical-debt.md` for the full corrected entries.

---

## 2026-09-11 (T7.9 follow-up, session 52 continued)

**Task:** T7.9 follow-up — CSV export was missing the `subscriber` entity's own `id` field
**Summary:** User feedback after T7.9 shipped: "Export only producing only part of the
required is not acceptable." Investigated empirically before guessing at a fix — seeded 15
extra test subscribers (16 total, spanning two table pages, mixed subscribed/unsubscribed)
via a throwaway script, then verified live via Playwright that row-completeness was already
correct: the unfiltered export produced all 16 rows (not just the current page's 10), and a
Subscribed-only filtered export correctly produced exactly the 12 matching rows, zero
Unsubscribed rows leaking through. That ruled out a row-completeness bug. The real gap was
column-completeness: `docs/features/insights-engine.md`'s "Data requirements" names five
`subscriber` fields — id, email, subscribed_at, consent, unsubscribed_at — and the exported
CSV only ever had four of them; `id`, the row's own stable identifier, was never a column
(the on-screen table also omits it, correctly, since it has no display purpose there — but
an export is a data record, not a display convenience, and needs to be reconcilable back to
the actual row). Added `ID` as the CSV's first column. Re-verified live: same 16/12-row
tests, now with `id` present and correct in every row. Cleaned up all seeded test data and
downloaded CSVs afterward; the one real dev subscriber (`kaalberto777@gmail.com`) was left
exactly as it was.
**Files Changed:** `app/admin/(shell)/subscribers/subscribers-list-client.tsx` (`downloadCsv`
now includes an `ID` column, first field in the header and every row).
**Related Feature:** `docs/features/insights-engine.md` (the `subscriber` entity's full field
list — this is what "the required" fields for an export of this entity actually are).
**Notes:** No test suite covers this client component's `downloadCsv` function directly —
consistent with this codebase's existing convention of no `*.test.tsx` coverage for any
admin list-client component anywhere in the project; verification here is the same
Playwright-against-the-real-dev-server method already used for every other admin screen.

---

## 2026-09-11 (T7.9, session 52)

**Task:** T7.9 — Subscribers list
**Summary:** Built `/admin/subscribers` — an `AdminDataTable`-pattern screen (following
`app/admin/(shell)/articles/page.tsx`'s established list/filter/pagination shape, T7.2)
listing every `subscriber` row, subscribed and unsubscribed alike, with a search-by-email
box and a Subscribed/Unsubscribed status filter. Two actions: **Export**, which generates a
CSV client-side from the currently filtered array (before pagination) so it always matches
what's on screen — no separate export endpoint exists in the feature doc's Interfaces list,
and every row is already loaded in the browser, so a second query that could drift from the
visible set was avoided entirely; and **Remove**, gated behind an `AlertDialog` confirmation
(same pattern as the Categories list's "Retire" action, T7.2), which reuses
`lib/insights-subscription.ts`'s existing `unsubscribeFromInsights(token)` — the row's own
`unsubscribeToken` is looked up first, then the exact same function a visitor's one-click
email link calls is invoked, satisfying this task's own acceptance criterion ("the identical
effect... not a second code path") by construction rather than by convention. A removed row
stays visible with its status flipped to Unsubscribed, never disappears — consistent with
`insights-engine.md`'s "never a hard delete" rule. The on-screen "N subscribed, N
unsubscribed" summary line is computed from the client's own `rows` state (not a
server-rendered prop) specifically so it stays correct immediately after a Remove action,
without needing a page reload — caught this by testing the flow live via Playwright before
fixing it. Verified end-to-end against the real dev server: filtered/searched the list,
removed the one real dev subscriber and confirmed its status flipped in place and persisted
across a reload, exported a CSV and read its contents back (matched the filtered set
exactly, including the real `unsubscribedAt` timestamp from the Remove action just
performed), and confirmed the Unsubscribed filter correctly showed the empty state. Checked
at mobile/tablet/desktop widths.
**Files Changed:** `lib/admin-subscribers.ts` (new) — `getSubscriberList`/
`removeSubscriber`; `lib/admin-subscribers.test.ts` (new) — 3 tests; `app/admin/(shell)/
subscribers/page.tsx` (new), `subscribers-list-client.tsx` (new); `app/api/admin/
subscribers/[id]/route.ts` (new) — `DELETE`; `components/admin-sidebar-nav.tsx` (added the
"Subscribers" nav entry under Operations).
**Related Feature:** `docs/features/insights-engine.md` (the `subscriber` entity and its
`POST /api/insights/unsubscribe` rule this task's Remove action must match).
**Notes:** No export API route was built — deliberate, per this task's own architecture
constraint that export must reflect the on-screen filtered set; a client-side CSV from the
already-loaded array is the simplest way to guarantee that without a second query. Did not
touch anything related to actually emailing this list (Brevo campaign composition/sending,
ADR 0012, `docs/features/subscriber-outreach.md`, P2-8) — that stays Phase 2, gated, out of
this task's scope entirely, per its own architecture constraint.

---

## 2026-09-11 (T7.8, session 51)

**Task:** T7.8 — Site Settings (singleton) admin
**Summary:** Built `/admin/site-settings` — a flat singleton form (phone_primary/secondary,
email, whatsapp_number, address, response_time_commitment, social_profile_urls), no
10.05-compliance checkbox (same precedent as the Legal Pages editor), following the
Capabilities/Our Method editor pattern per the task's own screen-inventory mapping. Every
required field is savable blank (`content-management-admin.md`'s edge case: launch content
not finalised yet) — `lib/admin-site-settings.ts`'s `updateSiteSettings` never rejects the
save itself; each public reader is what omits its own display. The larger part of this task
was closing three technical-debt entries this same update depended on: every real
`<SiteFooter>` call site (sixteen, not the five/seven originally flagged — more had
accumulated across Milestones 2–7) now reads live `site_settings`/`footer_content` via the new
`lib/site-settings.ts#getSiteFooterContent()` (combines `getSiteSettings()` + the new
`lib/legal.ts#getFooterContent()`) instead of T1.5's hardcoded literals. `SiteFooter`'s props
are now all optional, defaulting to those literals only when a prop is omitted — same
`FALLBACK_CORE_OFFERS` precedent `SiteHeader` already used — so `app/error.tsx` (a required
Client Component) and `app/not-found.tsx` (deliberately zero-DB-dependency for reliability)
keep working with no fetch. `components/scope-of-practice-note.tsx` now accepts
`statement`/`companyRegistrationDetails` as props instead of hardcoding the scope-of-practice
text, rendering the registration-details line only when non-null. Also updated
`lib/seo.ts#getOrganizationJsonLd` to omit `telephone`/`email`/`address` (not just `sameAs`)
when the underlying field is blank, and fixed a related bug caught live-verifying this task
via Playwright: `app/contact/page.tsx`'s phone/WhatsApp/email/office cards rendered an empty,
broken `tel:`/`wa.me`/`mailto:` link when the field was blank instead of omitting the card —
each is now conditionally rendered, same "omit rather than fake" bar as everywhere else.
Verified live: changed the phone number via the admin form and confirmed it updated `/contact`
and the `/capabilities` footer in the same save, confirmed a blank phone omits the link on
`/contact` and the JSON-LD `telephone` key without breaking anything else, and confirmed a
newly-saved social profile URL appears in the Organization schema's `sameAs` — all via
Playwright MCP against the real dev server, at mobile/tablet/desktop widths.
**Files Changed:** `lib/admin-site-settings.ts` (new), `lib/admin-site-settings.test.ts` (new),
`lib/site-settings.ts` (+`getSiteFooterContent`), `lib/site-settings.test.ts` (new),
`lib/legal.ts` (+`getFooterContent`), `lib/seo.ts` (Organization JSON-LD omits blank
telephone/email/address), `app/admin/(shell)/site-settings/page.tsx` (new),
`app/admin/(shell)/site-settings/site-settings-editor-form.tsx` (new),
`app/api/admin/site-settings/route.ts` (new), `components/site-footer.tsx`,
`components/scope-of-practice-note.tsx`, `app/contact/page.tsx` (+blank-field card guards),
and the `<SiteFooter>` call site in every other real public page (`app/(public)/page.tsx`,
`app/capabilities/page.tsx`, `app/our-method/page.tsx`, `app/about/page.tsx`,
`app/diagnostic/page.tsx`, `app/diagnostic/results/page.tsx`, `app/offers/[slug]/page.tsx`,
`app/insights/page.tsx`, `app/insights/[slug]/page.tsx`, `app/legal/[slug]/page.tsx`,
`app/lp/[slug]/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, and the two
`app/dev/layout-shell/*` scratch pages).
**Related Feature:** `docs/features/content-management-admin.md` (Site Settings),
`docs/features/legal-and-compliance-pages.md` (footer scope-of-practice/registration
details), `docs/features/seo-and-search-foundation.md` (Organization `sameAs`).
**Notes:** `response_time_commitment` was left exactly as seeded (`null`) — the firm still
hasn't stated a real, keepable commitment; the technical-debt entry stays Open,
User-triggered, now pointing at `/admin/site-settings` as where to set it once the firm does.

---

## 2026-09-11 (T7.7, session 50)

**Task:** T7.7 — Diagnostic Configuration admin
**Summary:** Built the Diagnostic Configuration admin: `/admin/diagnostic-questions` (list —
order/prompt/dimension/type/active columns, reorder ▲▼ buttons disabled at dimension
boundaries, inline active toggle enforcing "every active dimension needs at least one active
question," a "Placeholder" badge, "New Question" and per-row "Edit" links) plus
`/admin/diagnostic-questions/new` and `/admin/diagnostic-questions/[id]` (a shared editor
form — dimension/response type frozen after creation, prompt text, choice options editor for
`choice`-type questions, active/placeholder toggles) and `/admin/diagnostic-configuration`
(dimension weights, overall + per-dimension triage thresholds, and score bands — reached via
an inline link from the questions list, per CLAUDE.md's "one nav entry, second screen via
inline link" pattern). Follows the values-vs-logic boundary exactly: only
`weight`/`thresholdValue`/`triagePriorityLevel`/question text/order/active/choiceOptions are
ever admin-editable — `lib/diagnostic-scoring.ts`'s algorithm itself is untouched.
Self-identified and closed a real scope gap while building this: `diagnostic_question` had no
`choiceOptions` column, so the public diagnostic flow resolved a `choice` question's option
labels/values from a hard-coded `${dimensionId}-${order}` map in
`lib/diagnostic-flow-options.ts` — the moment this task's own admin let a partner reorder or
add a `choice` question, that map would silently go stale and the public flow would throw an
uncaught error for a real visitor. Added a real `choiceOptions Json?` column (migration
`20260911123727_add_diagnostic_question_choice_options_and_placeholder`, same migration also
closes the `is_placeholder` technical-debt entry below), moved choice-option resolution
server-side into `lib/diagnostic-flow.ts`, and rewrote `lib/diagnostic-flow-options.ts` to
hold only the Prisma-free scale/boolean option constants + shared types. Also found and fixed
a second, adjacent gap while building the Diagnostic Configuration screen: seeded dimension
weights were `1` each (scores correctly under `diagnostic-scoring.ts`'s total-weight
normalization, but never literally summed to 100) — the new screen's own "must total 100%"
Save gate, matching the mockup's documented business rule, would have been permanently
disabled for a partner opening it with real seed data. Updated `prisma/seed.ts` and the live
dev rows to `20` each (same equal weighting, expressed the way the admin screen expects).
Verified live via Playwright MCP: question reordering (with page-reload persistence check),
the last-active-question deactivate guard (both blocked and allowed paths), creating a
`choice` question end-to-end then deleting the test row, editing an existing question,
dimension-weight/threshold save round-trip, score-band save, and a full regression pass of
the public `/diagnostic` flow (choice + scale questions both render/advance correctly after
the `choiceOptions` refactor) — plus mobile (390px) and tablet (768px) checks, which caught
and fixed a real table-overlap bug (`TableCell`'s default `whitespace-nowrap` fighting a
`max-w` prompt column) before this task was called done.
**Files Changed:** `prisma/schema.prisma`, `prisma/migrations/
20260911123727_add_diagnostic_question_choice_options_and_placeholder/`, `prisma/seed.ts`,
`lib/diagnostic-flow-options.ts`, `lib/diagnostic-flow.ts`, `components/diagnostic-flow.tsx`,
`lib/admin-diagnostic.ts`, `lib/admin-diagnostic.test.ts`, `components/admin-sidebar-nav.tsx`,
`app/admin/(shell)/diagnostic-questions/page.tsx`, `.../questions-list-client.tsx`, `.../
question-editor-form.tsx`, `.../new/page.tsx`, `.../[id]/page.tsx`, `app/admin/(shell)/
diagnostic-configuration/page.tsx`, `.../configuration-client.tsx`, `app/api/admin/
diagnostic-questions/route.ts`, `.../[id]/route.ts`, `.../[id]/move/route.ts`, `.../[id]/
active/route.ts`, `app/api/admin/diagnostic-configuration/route.ts`, `app/api/admin/
diagnostic-score-bands/route.ts`.
**Related Feature:** `docs/features/content-management-admin.md`, `docs/features/business-
health-check-diagnostic.md`, ADR 0005.
**Notes:** Combined-route deviation reused (T7.3/T7.4 precedent, documented inline in each
route): `PATCH /api/admin/diagnostic-configuration` saves weights + both threshold panels in
one request, and `PATCH /api/admin/diagnostic-score-bands` saves all four bands in one
request, matching each screen's real single-Save-button UI rather than the feature doc's
originally-sketched per-resource routes.

---

## 2026-09-11 (T7.6, session 49)

**Task:** T7.6 — Team / author profile editor
**Summary:** Built `/admin/team` (list, `AdminDataTable`-style — name/title/practice area/
published/login status, "(you)" marker next to the signed-in partner's own row) and
`/admin/team/[id]` (editor: photo via `AdminImageUploadButton`, title, practice area,
credentials, personal statement, bio, display order, with a live "saving now would publish/
unpublish" hint and a read-only computed publish badge — no directly-editable publish
toggle). Also wired `Author.adminUserId` to a real, `@unique` Prisma relation against
`AdminUser` (migration `20260911103608_add_author_admin_user_relation`) and built the three
admin-facing account actions this task's own session-42 addendum named: deactivate/
reactivate (new `reactivateAdminUser` alongside the existing `deactivateAdminUser`), reset
2FA enrolment, reset password — all on an `AdminUserActionsPanel` shown only when the author
has a linked login.
**Files Changed:** `prisma/schema.prisma`, `prisma/migrations/
20260911103608_add_author_admin_user_relation/`, `lib/admin-authors.ts`, `lib/admin-authors
.test.ts`, `lib/auth/session.ts` (added `reactivateAdminUser`), `app/admin/(shell)/team/
page.tsx`, `app/admin/(shell)/team/[id]/page.tsx`, `app/admin/(shell)/team/[id]/author-
editor-form.tsx`, `app/admin/(shell)/team/[id]/admin-user-actions-panel.tsx`, `app/api/
admin/authors/[id]/route.ts`, `app/api/admin/admin-users/[id]/deactivate/route.ts`, `.../
reactivate/route.ts`, `.../reset-2fa/route.ts`, `.../reset-password/route.ts`.
**Related Feature:** `docs/features/about-and-partners-page.md`, `docs/features/content-
management-admin.md`, `docs/features/admin-authentication.md`.
**Notes:** Found and fixed a stale schema doc-comment: `Author`'s own doc-comment said
`published` gated on four fields including `bio`, but both feature docs and this task's own
Input→Output line name exactly three (name, practiceArea, personalStatement) — corrected in
the same migration-adjacent commit, no functional impact since nothing had implemented the
gating logic yet. Discovered a real, separate gap while building the publish-gating
validation: `lib/insights.ts`'s article-byline queries have no `author.published` check at
all — logged as a new known-bug and a new task (`docs/tasks/07-content-admin.md` T7.11,
since it needs a firm decision, not just a mechanical fix) rather than silently ignored or
unscoped-fixed inside this task — originally misfiled as a new task appended to the already-
shipped `docs/tasks/04-insights.md`, caught and corrected the same session (see `memory/
decision-log.md`'s process entry and CLAUDE.md's tightened sequencing rule). `updateAuthor`
protects against the practical case in the
meantime: it refuses to unpublish an author who already has articles. No role-based
restriction gates opening another partner's entry — a deliberate decision extending
`content-management-admin.md`'s own existing "Decision, not a gap" precedent (no technical
approval-routing layer for a five-partner firm), not an oversight; see decision log.
Verified live via Playwright MCP against the real dev database: temporarily linked the dev
account to a real seeded author, confirmed the list's "(you)" marker and "Active" login
status, opened the editor and confirmed initials-avatar fallback + all fields prefilled
correctly, confirmed the live "saving now would unpublish" hint, confirmed a genuine
unpublish attempt was rejected inline (the author had 2 real articles), saved a real
credentials edit and confirmed it propagated to `/about` live, tested "Reset 2FA enrolment"
and "Reset password" (both returned real, working links), and tested "Deactivate account"
for real — confirmed via a follow-up navigation that the session was genuinely invalidated
on its very next request, not just the DB flag flipping, then reactivated and logged back in
to finish verification. Checked mobile (390px)/tablet (768px)/desktop (1280px); fixed one
minor label-wrap cosmetic issue found at desktop width. Every test change reverted
afterward (author unlinked, credentials cleared, account re-activated) — dev DB and the one
real dev/test admin account are back to their pre-session state. All quality gates pass
(lint, format:check, typecheck, 243 tests — 18 new).

---

## 2026-09-11 (T7.5, session 48)

**Task:** T7.5 — Landing Pages admin
**Summary:** Built `/admin/landing-pages` (list of the three seeded campaign instances,
`AdminDataTable`-style — headline, `/lp/[slug]` link, campaign reference, last updated) and
`/admin/landing-pages/new` (create-only editor: URL slug, kicker, headline, opening
paragraph, an ordered `bodyContent` block editor covering all five block kinds — heading,
paragraph, checklist, stat row, step row — CTA label/link, an optional PDF download-file
upload, campaign reference, meta title/description, and the 10.05-compliance checkbox). New
`lib/admin-landing-pages.ts` (`getLandingPageList`, `createLandingPage` — duplicate-slug
rejection, per-block-kind validation, the 10.05 gate) and `POST /api/admin/landing-pages`
(parses/shapes only). Also built the download-file upload mechanism this task's own
addendum required: `lib/media-storage.ts`'s new `encodeDownloadFileUpload` (PDF-only, 5MB
cap), `POST /api/admin/media/downloads`, and `components/admin-download-upload-button.tsx`.
**Files Changed:** `lib/admin-landing-pages.ts`, `lib/admin-landing-pages.test.ts`,
`lib/media-storage.ts`, `app/admin/(shell)/landing-pages/page.tsx`, `app/admin/(shell)/
landing-pages/new/page.tsx`, `app/admin/(shell)/landing-pages/new/new-landing-page-form.tsx`,
`app/admin/(shell)/landing-pages/landing-page-block-editor.tsx`,
`components/admin-download-upload-button.tsx`, `app/api/admin/landing-pages/route.ts`,
`app/api/admin/media/downloads/route.ts`.
**Related Feature:** `docs/features/landing-page-template.md`, `docs/features/content-
management-admin.md`.
**Notes:** Create-only, per the feature doc's own Interfaces line (`POST /api/admin/landing-
pages` alone, no `PATCH`) — editing an already-live campaign page is out of this task's
scope. The URL slug is a real, partner-typed field (normalized via `lib/categories.ts`'s
`slugify`, duplicate rejected inline) rather than auto-derived from the headline the way
`Article.slug` is — a campaign URL is deliberately chosen to match ad/print/QR copy, closer
to `Category.slug`'s own precedent. `AdminImageUploadButton` (T7.2) was **not** reused for
the download file as originally planned in `memory/technical-debt.md` — it's image-only,
and a checklist is realistically a PDF; built a small sibling mechanism instead. Full
reasoning in `memory/decision-log.md`. Verified live via Playwright MCP: created a real test
landing page end to end (all five body-block kinds, a real PDF upload via a direct multipart
POST — the native file-chooser dialog didn't cooperate with headless automation, so the
upload endpoint was exercised directly instead of through a simulated click), confirmed
`/lp/[slug]` rendered it correctly (no site navigation, full footer, `checklist_downloaded`-
firing download link when a file is attached), confirmed the duplicate-slug and missing-
compliance-checkbox rejections both return inline 400s, checked mobile (390px)/tablet
(768px)/desktop (1280px) — the list table stays within its own `overflow-x-auto` container,
no page-level horizontal scroll. Both test rows deleted afterward via a direct Prisma query
(no delete UI exists in this create-only scope), dev DB back to exactly 3 real rows. All
quality gates pass (lint, format:check, typecheck, 225 tests total — 9 new). Also fixed a
formatting-drift gap from the previous session (T7.4): `memory/decision-log.md`,
`docs/user-guide.md`, and the T7.4 session summary had been hand-edited after the last
`npm run format` run and committed without a final format pass — caught and fixed as its own
`chore(T07-04)` commit before starting this task's own work.

---

## 2026-09-11 (T7.4, session 47)

**Task:** T7.4 — Offer editor (fee bands, FAQs, and full field set)
**Summary:** Built `/admin/offers`: a picker over the three core offers (Business Health
Check, Financial Clarity Pack, Funding-Readiness Pack), each rendering the full FR-4.1 field
set — problem statement, who_for/who_not_for, ordered method stages, structured fee band
(single-tier offers) or per-tier fee bands with a featured-tier selector (Business Health
Check), out-of-scope note, ordered FAQs, CTA label/link, meta title/description — plus a
combined Advisory Retainer singleton panel below it. New `lib/admin-offers.ts` (all business
logic, including the fee-band-needs-a-scope-cap validation applied identically to a single-
tier offer and to each `OfferTier`) and two new route handlers (`PATCH /api/admin/offers/
[slug]`, `PATCH /api/admin/advisory-retainer`) that parse/shape only. New client components
under `app/admin/(shell)/offers/`: `offers-admin-client.tsx`, `offer-editor-form.tsx`,
`offer-tier-editor.tsx`, `method-stage-list-editor.tsx`, `faq-list-editor.tsx`, `string-list-
editor.tsx`, `advisory-retainer-editor.tsx`.
**Files Changed:** `lib/admin-offers.ts`, `lib/admin-offers.test.ts`, `app/admin/(shell)/
offers/page.tsx`, `app/admin/(shell)/offers/offers-admin-client.tsx`, `app/admin/(shell)/
offers/offer-editor-form.tsx`, `app/admin/(shell)/offers/offer-tier-editor.tsx`, `app/admin/
(shell)/offers/method-stage-list-editor.tsx`, `app/admin/(shell)/offers/faq-list-editor.tsx`,
`app/admin/(shell)/offers/string-list-editor.tsx`, `app/admin/(shell)/offers/advisory-
retainer-editor.tsx`, `app/api/admin/offers/[slug]/route.ts`, `app/api/admin/advisory-
retainer/route.ts`.
**Related Feature:** `docs/features/content-management-admin.md`, `docs/features/core-offer-
pages.md`, `docs/features/capabilities-page.md`.
**Notes:** Four mockup gaps beyond the five already named by this task's own "Build" line
(`teaser`/`ctaHref`/`metaTitle`/`metaDescription`), plus FAQs/method stages built as real
structured `{question, answer}`/`{title, description}` fields rather than the mockup's flat
rows — full reasoning in `memory/decision-log.md`. Verified live via Playwright MCP: a fee
update on Funding-Readiness Pack reflected in both the offer page and the `SiteHeader` nav
fee-hint in the same request cycle (this task's own acceptance criterion); an Advisory
Retainer fee update reflected on `/capabilities`; a fee band submitted without a scope cap on
Financial Clarity Pack was rejected by the API with the error surfaced inline; an
unauthenticated `PATCH` returns 401 via the existing `proxy.ts` matcher. Checked at mobile
(390px)/tablet (768px)/desktop (1280px). All quality gates pass (`npm run lint`, `npm run
format:check`, `npm run typecheck`, `npm run test` — 216 tests, 16 new for `lib/admin-
offers.ts`). Every dev-DB test edit reverted afterward via the admin UI itself. No firm-
visible capability changed beyond what the user guide already describes generically ("update
a fee range") — see the `docs/user-guide.md` update below for the small addition (the
Advisory Retainer is now editable too, previously undocumented as a gap).

---

## 2026-09-11 (T7.3, session 46)

**Task:** T7.3 — Pages editor (marketing pages incl. Capabilities, Our Method; legal pages)
**Summary:** Built three admin screens under a shared "Pages" area: `/admin/pages` (a simple
list linking to the two marketing-page editors plus an inline link to the Legal area, same
"one nav entry, second screen via inline link" pattern T7.2 already used for Categories),
`/admin/pages/capabilities` (hero fields + the eight fixed `capability` rows, edited in
place, no add/remove), `/admin/pages/our-method` (hero + intro fields + the four fixed
`method_stage` rows), and `/admin/pages/legal` (all four `legal_page` rows via a selector,
each with its own `LegalPageBlock` editor and an editable "still a draft" checkbox, plus the
shared `footer_content` singleton). New `lib/admin-pages.ts` (Capabilities/Our Method) and
`lib/admin-legal.ts` (Legal/Footer) hold all business logic; route handlers parse/shape only.

Reconciled two real gaps between this task's own "Build" line (borrowing the Offer editor's
generic "linked repeating section" pattern) and the actual content rules: `capabilities-
page.md`/`our-method-page.md` both fix their row counts ("exactly eight"/"all four"), so
this editor never adds or removes rows, only edits their content in place — a materially
simpler shape than T7.2's open-ended article body editor. And `Page`/`Capability`/
`MethodStage` have no draft/live distinction in the schema at all, so the 10.05-compliance
checkbox gates the Save action itself rather than a separate Publish step. Legal pages get no
such checkbox — a different review process, already gated by the existing `isPlaceholder`
marker, now surfaced here as something a partner can actually toggle. Full reasoning for
these and several smaller calls (read-only `Capability.slug`/`MethodStage.name`/`order`,
`AdvisoryRetainer` explicitly out of scope, a new small `LegalBlockEditor` rather than
generalizing T7.2's, two purpose-built PATCH routes instead of the feature doc's originally-
sketched generic one) in `memory/decision-log.md`.

**Conscious call on last-write-wins** (required by this task's own session-04 addendum,
independently of whatever T7.2 chose): shipped as documented — no optimistic-locking/
staleness check added to any of this task's five PATCH handlers (`pages/capabilities`,
`pages/our-method`, `legal/[slug]`, `footer-content`). Same reasoning as T7.2: `content-
management-admin.md`'s own edge case explicitly accepts this for Phase 1 (five partners, low
edit frequency), and this task's content is edited even less often than articles (marketing
page copy, legal text). Existing debt entry already covers it, no new one needed.

Verified for real via Playwright MCP against the live dev database: edited a real Capability
and confirmed `/capabilities` updated immediately with no deploy (T7.3's own acceptance
criterion), loaded Our Method against all four real stages, loaded Legal against all four
real legal pages (including Scope of Practice's real non-placeholder content, exercising
every `LegalPageBlock` kind including the table sub-editor), toggled a legal page's draft
status live and confirmed the public page's "Draft" marker responded, and saved real footer
content — every test change reverted afterward via direct query so the dev DB is exactly as
it was before this session. Checked all four screens at mobile (390px)/tablet (768px)/desktop
(1280px), no page-level horizontal scroll anywhere (the Legal table editor scrolls within its
own container).
**Files Changed:** `lib/admin-pages.ts`, `lib/admin-pages.test.ts`, `lib/admin-legal.ts`,
`lib/admin-legal.test.ts`, `app/admin/(shell)/pages/*` (list, capabilities, our-method,
legal screens + their client forms and the `LegalBlockEditor`), `app/api/admin/pages/
capabilities/route.ts`, `app/api/admin/pages/our-method/route.ts`, `app/api/admin/legal/
[slug]/route.ts`, `app/api/admin/footer-content/route.ts`, `docs/features/content-
management-admin.md` (Interfaces section updated to match the real routes built).
**Related Feature:** `docs/features/content-management-admin.md`,
`docs/features/capabilities-page.md`, `docs/features/our-method-page.md`,
`docs/features/legal-and-compliance-pages.md`
**Notes:** Quality gates all clean (lint, format:check, `npm run typecheck`, 200/200 tests —
19 new across the two new `lib/` test files). `docs/user-guide.md` updated (Public website
pages section) and its Artifact mirror republished; also caught and fixed a real drift from
T7.2 while there — that session's Artifact-only edit to this same section's "what a partner
can do" line was never applied to `docs/user-guide.md` itself, so the two had silently
diverged for one task. No milestone/epic completed this session (6 of Milestone 7's 10 tasks
remain), so the "Website Build Status" Artifact was not updated, matching T7.1/T7.2's own
precedent.

---

## 2026-09-11 (T7.2, session 45)

**Task:** T7.2 — Articles editor + Categories
**Summary:** Built the real Articles admin: a list screen (`/admin/articles`, search/status/
category filters, client-side pagination), a structured block-based editor
(`/admin/articles/new` and `/admin/articles/[id]`) supporting paragraph/heading/quote/list/
table/figure blocks, a required-preview-image + 10.05-compliance publish gate (enforced both
client-side, disabling Publish, and server-side in `lib/articles.ts`), and a Categories screen
(`/admin/articles/categories`) with add/rename/retire (Dialog/AlertDialog-based, real
duplicate-slug rejection). New `lib/media-storage.ts` + `POST /api/admin/media` +
`components/admin-image-upload-button.tsx` give the article editor real image uploads (an
interim base64 data-URI store, since Cloudflare R2 isn't provisioned yet). Business logic in
`lib/articles.ts`/`lib/categories.ts`, route handlers in `app/api/admin/articles*`/`app/api/
admin/categories*` parse/shape only.

Fixed three real gaps between the accepted mockup and the actual (later-evolved) `Article`
schema — added `excerpt`/`metaTitle` fields and a full `nextStepCta` panel the mockup never
showed, same "mockup drawn before the schema grew" precedent as the Offer editor's earlier
fix (`docs/dashboard.md`'s pre-Phase-6 audit). Added a new `figure` block kind to
`ArticleBodyBlock` (`lib/insights.ts`) and its public renderer (`app/insights/[slug]/
page.tsx`) — the mockup names "figures" as supported but no accepted article had used one
yet, so the type never existed before this task. Deliberately split downloadable-resource
attachment (`article_resource`, the mockup's 📎 button) into a new task, T7.10, rather than
expanding this already-Size-L task further — see `memory/decision-log.md` for the full
reasoning on all of the above, and `memory/technical-debt.md` for the two new tracked gaps
(interim base64 image storage, resource attachment not yet built).

**Conscious call on last-write-wins** (required by this task's own session-04 addendum,
`memory/technical-debt.md`'s "Two-partner simultaneous page edits use last-write-wins"
entry): shipped as documented — no optimistic-locking/staleness check added to `PATCH /api/
admin/articles/[id]`. `content-management-admin.md`'s own edge case explicitly accepts this
for Phase 1 (five partners, low edit frequency); the existing debt entry already covers it,
no new one needed.

Verified for real via Playwright MCP against the real dev database (not mocked): edited a
real seeded article (id 20, "People Are the Plan") end to end — uploaded a real image as its
preview image, checked the compliance box, published, and confirmed via direct Prisma query
that `previewImage` held the correct base64 data URI, `publishedAt` was preserved unchanged
(not overwritten on a re-save), and `revisedAt` was newly set. Created a brand-new article
with a `figure` block from scratch, published it, and confirmed the figure (image + caption)
rendered correctly on its real public `/insights/[slug]` page. Exercised Categories fully:
rejected a duplicate-slug add inline, added a real category, renamed it (slug updated), and
retired it — confirmed via direct query that retiring genuinely deletes the row (relying on
`Article.categoryId`'s `onDelete: SetNull`, not a soft-delete flag). Checked all three screens
(list/editor/categories) at mobile (390px — confirmed via `document.documentElement.scrollWidth`
that none of them scroll horizontally at the page level, tables scroll within their own
container instead), tablet (768px), and desktop (1280px).
**Files Changed:** `lib/articles.ts`, `lib/articles.test.ts`, `lib/categories.ts`,
`lib/categories.test.ts`, `lib/media-storage.ts`, `lib/media-storage.test.ts`,
`lib/insights.ts` (`ArticleBodyBlock` `figure` kind), `app/insights/[slug]/page.tsx` (figure
rendering), `app/admin/(shell)/articles/*` (list/editor/categories pages + client
components + block editor), `app/api/admin/articles/route.ts`,
`app/api/admin/articles/[id]/route.ts`, `app/api/admin/categories/route.ts`,
`app/api/admin/categories/[id]/route.ts`, `app/api/admin/media/route.ts`,
`components/admin-image-upload-button.tsx`, `docs/tasks/07-content-admin.md` (T7.6 addendum,
new T7.10 task), `docs/user-guide.md`.
**Related Feature:** `docs/features/content-management-admin.md`,
`docs/features/insights-engine.md`
**Notes:** Quality gates all clean (lint, format:check, `npm run typecheck`, 181/181 tests —
29 new across the three new `lib/` test files). `docs/user-guide.md` updated (Milestone 4's
Insights section — partners can now publish/edit articles and manage categories themselves,
resolving its "Nothing via the site itself yet" note) and Artifact mirror republished. No
milestone/epic completed this session (5 of Milestone 7's 10 tasks remain, including the new
T7.10), so the "Website Build Status" Artifact was not updated, matching T7.1's own precedent.

---

## 2026-09-11 (T7.1, session 44)

**Task:** T7.1 — Admin dashboard — `/admin`
**Summary:** Replaced the T1.5 placeholder at `app/admin/(shell)/page.tsx` with the real
dashboard: 4 stat cards (New Enquiries, Triage-flagged, Diagnostics This Month, Published
Articles) and a recent-enquiries panel (5 most recent `enquiry_record` rows, unfiltered),
built to `ui/mockups/g-admin-content/admin-dashboard.html`. All aggregate queries live in
new `lib/admin-dashboard.ts` (`getAdminDashboardStats`, `getRecentEnquiries`), not inline in
the page component, per CLAUDE.md's business-logic-in-`lib/` rule; the page itself is a
Server Component with `export const dynamic = "force-dynamic"`.

Two real data gaps surfaced mid-build — `enquiry_record` has no `status` column yet
(`enquiry-management.md`'s extension is explicitly Milestone 8/T8.1 scope, not built at this
task's normal point in the roadmap), and no per-enquiry triage priority level (High/Medium/
Low) is persisted anywhere, only a boolean `triageFlag`. Both were worked around honestly
(unfiltered `COUNT` doubling as "new enquiries" since every row genuinely is new today; a
hardcoded "New" status badge; a boolean Flagged/Not-flagged badge instead of a fabricated
priority level) rather than building Milestone 8 fields early or inventing data — see
`memory/decision-log.md` for the full reasoning and `memory/technical-debt.md` for both
tracked gaps, both sequenced into T8.1 via an addendum in
`docs/tasks/08-enquiry-management.md`.

Verified for real via Playwright MCP: logged into `/admin` with the dev admin account
(completing its pending TOTP re-enrolment via a backup code, since the account's 2FA setup
had been left incomplete — see `CLAUDE.local.md`, now updated with the new TOTP secret/backup
codes), reached the live dashboard, and cross-checked all 4 stat counts (6/5/6/8) and the 5
recent-enquiry rows against a direct Prisma query against the same dev database — exact
match. Checked at mobile (390px — stat cards stack 2×2, the enquiries table scrolls within
its own `overflow-x-auto` container per the existing `Table` component, no page-level
horizontal scroll, confirmed via `document.documentElement.scrollWidth`), tablet (768px), and
desktop (1280px, matching the mockup's own layout closely).
**Files Changed:** `lib/admin-dashboard.ts` (new), `lib/admin-dashboard.test.ts` (new),
`app/admin/(shell)/page.tsx`, `docs/tasks/08-enquiry-management.md` (T8.1 addendum),
`CLAUDE.local.md` (dev admin 2FA re-enrolment).
**Related Feature:** `docs/features/content-management-admin.md`
**Notes:** Quality gates all clean (lint, format:check, `npx tsc --noEmit` via
`npm run typecheck`, 152/152 tests including 9 new). `docs/user-guide.md` not updated — this
screen has no partner-facing action yet (read-only stats/list a partner can already infer
from the enquiries they've received directly); it becomes genuinely user-guide-worthy once
T7.2+ and T8.x give the Quick Actions links real destinations. No milestone/epic completed
this session (T7.1 is the first of 7 tasks in Milestone 7), so the "Website Build Status"
Artifact was not updated.

---

## 2026-09-11 (T6.3 follow-up, session 44)

**Task:** T6.3 follow-up — Redirect an already-authenticated visitor away from `/admin/login`
**Summary:** The user asked, as a plain design question, whether an already-signed-in partner
should be able to visit `/admin/login` at all — they currently could, and would just see the
login form again with no indication a session already existed; submitting credentials again
worked but required a full password + TOTP re-authentication for no reason. Fixed by making
`app/admin/login/page.tsx` an async Server Component that reads the session cookie via
`cookies()`, calls `lib/auth/session.ts`'s `verifySession`, and `redirect()`s to `/admin` when
a valid session is found — otherwise renders the form exactly as before. Deliberately checked
in the page itself, not `proxy.ts`: this is the only one of the four unauthenticated `/admin/*`
pages where "already has a session" is a meaningful thing to check (`/admin/setup-2fa`,
`/admin/forgot-password`, `/admin/reset-password` are all reached via their own single-use
token regardless of session state), so adding it to `proxy.ts`'s allowlist logic would have
added a DB query to all four for no behavioural difference on three of them.
Verified for real via Playwright MCP: a throwaway test account (created, TOTP-enrolled,
cleaned up afterward) logged in fully, then navigating back to `/admin/login` while still
authenticated redirected straight to `/admin`; a plain `curl` with no session cookie at all
still got a normal 200 with no redirect, confirming no regression for the unauthenticated
case.
**Files Changed:** `app/admin/login/page.tsx`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 143/143 tests — no test
changes needed, this is page-level routing logic with no new `lib/` function). No
`docs/user-guide.md` update — this is an internal UX correction, not a new capability a
partner needs to be told about.

---

## 2026-09-11 (T6.7, session 43)

**Task:** T6.7 — Self-service password reset
**Summary:** Added to `docs/tasks/06-admin-auth.md` and built in the same session, per the
user's explicit request ("Start T6.7... fully build it here and now") after they asked how
password reset works and the answer turned out to be: it doesn't exist yet, anywhere, for an
existing account. Built `lib/auth/password-reset.ts` (`issuePasswordResetToken`,
`requestPasswordReset`, `resolvePasswordReset`, `confirmPasswordReset`), two new API routes
(`POST /api/admin/auth/request-password-reset`, `POST /api/admin/auth/reset-password`), two
new screens (`/admin/forgot-password`, `/admin/reset-password`), and wired the login mockup's
long-dormant "Forgot password?" link to the new flow. New `admin_user.passwordResetToken`/
`passwordResetTokenExpiresAt` columns (migration `20260910233000_t6_7_admin_user_password_
reset`) and two new `AdminLoginAttemptKind` values. A completed reset invalidates every other
live session for the account (same precedent `deactivateAdminUser` set at T6.5) but leaves
TOTP enrolment completely untouched — the reason this flow can safely be self-service at all.
Reset requests are throttled by a new `assertNotFlooded` helper in `lib/auth/rate-limit.ts`
(counts all attempts in a window, not just failures — the existing `assertNotRateLimited`
shape doesn't fit a step with no "wrong guess" concept).
Verified for real via Playwright MCP against the live dev server and a real test account
(created via T6.6's script, TOTP-enrolled via a computed `otplib` code): full request → real
Brevo email send (no error) → DB-confirmed token/expiry → confirm with a new password → old
password rejected, new password + TOTP logs in successfully → a session that was live
_before_ the reset was confirmed deleted from the database and rejected on its very next
request in the same browser tab → a consumed token rejected on reuse → an invalid/missing
token renders the correct "no longer valid" state → the flood limit (3/hour) correctly trips
→ a too-short password is rejected server-side → a nonexistent email returns the identical
generic response as a real one (no enumeration). All test data cleaned from the database
afterward.
**Caught and fixed live**: `proxy.ts`'s `PUBLIC_ADMIN_PAGE_PATHS` allowlist didn't include
either new page — both compiled/typechecked/linted cleanly but were silently unreachable
(redirected to `/admin/login`) until fixed in this same session. See
`memory/known-bugs.md`.
**Files Changed:** `prisma/schema.prisma` (`AdminUser.passwordResetToken`/
`passwordResetTokenExpiresAt`, `AdminLoginAttemptKind.password_reset_request`/
`password_reset_confirm`), `prisma/migrations/20260910233000_t6_7_admin_user_password_reset/`,
`lib/auth/password-reset.ts` + `.test.ts` (new), `lib/auth/rate-limit.ts` + `.test.ts`
(`assertNotFlooded`), `app/api/admin/auth/request-password-reset/route.ts` (new),
`app/api/admin/auth/reset-password/route.ts` (new), `app/admin/forgot-password/page.tsx` +
`forgot-password-form.tsx` (new), `app/admin/reset-password/page.tsx` +
`reset-password-form.tsx` (new), `app/admin/login/login-form.tsx` (wired the link),
`app/admin/login/page.tsx` (updated stale comment), `proxy.ts` (bug fix),
`docs/tasks/06-admin-auth.md` (new T6.7 entry), `docs/tasks/07-content-admin.md` (T7.6
addendum), `docs/features/admin-authentication.md`, `memory/technical-debt.md` (broadened
entry), `memory/known-bugs.md`, `docs/user-guide.md`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 143/143 tests across 20
files, 25 new). Milestone 6 was already complete as of T6.6 — this task adds to it after the
fact, so the "Website Build Status" Artifact is **not** republished (milestone-completion
status is unchanged); `docs/user-guide.md` + its mirror **are** updated, since this changes
what a partner can do today.

---

## 2026-09-10 (T6.6, session 42)

**Task:** T6.6 — Admin account provisioning script
**Summary:** Added `scripts/create-admin-user.ts` (run via `npm run admin:create-user --
--name "..." --email "..." [--password "..."]`), the CLI-only mechanism this project uses to
give a partner their very first account — closes the gap logged as technical debt back at
T6.2. Parses `--name`/`--email`/`--password` from `process.argv`; generates a random
24-byte base64url password via `crypto.randomBytes` when `--password` is omitted; creates the
`admin_user` row with `hashPassword` (bcryptjs, same as `loginWithPassword`); issues a
7-day single-use setup link via T6.2's `issueSetupToken(user.id, { baseUrl: getSiteUrl() })`;
prints the account ID/email, the generated password (only when one wasn't supplied), and the
setup link. Duplicate emails are caught via
`error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"` and reported
with a clear message rather than a raw Prisma stack. Follows `scripts/cleanup-attribution.ts`'s
established env-loading pattern exactly (`dotenv.config()` called before any dynamic
`import()` of a `lib/prisma`-dependent module, since static imports are hoisted above
`config()` calls).
Verified for real via Playwright MCP against the real dev server and real database rows (no
mocks): ran the script to create a live account, followed the printed setup link in the
browser, completed real TOTP enrolment end-to-end (one code submission failed from normal
30-second window drift between computing and submitting through the multi-step browser
interaction — recomputed and resubmitted, succeeded), confirmed a second run against the same
email is rejected with the duplicate-email message, confirmed missing `--name`/`--email`
exits with a clear usage error, and confirmed `--password` overrides the random-generation
path. All test data cleaned from the database afterward.
While writing `docs/user-guide.md`'s new Admin Login section, caught myself about to
overstate this script's scope (implying it could also reset an existing partner's lost 2FA)
and corrected the wording before publishing — see `memory/decision-log.md` for the resulting
technical-debt entry this surfaced.
**Files Changed:** `scripts/create-admin-user.ts` (new), `package.json`
(`admin:create-user` script), `memory/technical-debt.md` (resolved the T6.2-era "no
provisioning" entry; added a new entry for the missing deactivate/reactivate + reset-2FA
admin UI), `docs/tasks/07-content-admin.md` (addendum on T7.6), `docs/user-guide.md` (new
"Admin Login — Milestone 6" section; Milestone 6 moved out of "What's coming next"),
`memory/decision-log.md`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, full test suite green —
no new unit tests needed, this is a thin CLI wrapper over already-tested `lib/auth`
functions, verified live instead per CLAUDE.md's "any runnable interface" rule). **This task
completes Milestone 6** (T6.1–T6.6 all shipped) — both firm-facing Artifacts were updated:
`docs/user-guide.md` + its mirror (Version 2), and the "Website Build Status" Artifact
(Version 6), whose ledger row 6 now reads Complete, whose progress track shows 6/9 segments
done, and whose "Your Team" usability panel now reflects that staff can log in.

---

## 2026-09-10 (T6.5, session 41)

**Task:** T6.5 — Account deactivation + immediate session invalidation
**Summary:** Added `admin_user.active` (default `true`) and its enforcement: `lib/auth/
session.ts`'s new `deactivateAdminUser(adminUserId)` flips `active` to `false` and deletes
every `admin_session` row for that account in one transaction (the primary mechanism);
`verifySession` also independently checks `active` on every lookup as defense in depth;
`loginWithPassword` refuses to issue even a challenge token for a deactivated account, with a
distinct message shown only after the password is confirmed correct. No UI or API route this
task, per its own Input→Output line (deactivation's real trigger is Milestone 7's Team
content area) — this task ships the underlying mechanism only, same as `setupToken` before
any screen used it.
Verified for real via a throwaway database-backed script (deleted before commit, same
pattern T6.1 established for schema-only work with nothing yet calling it — no UI/route
exists for this task to exercise via Playwright MCP): created a real account + session,
confirmed `active: true` by default, deactivated it, confirmed `active: false` and zero
remaining session rows in the database, confirmed the now-orphaned session token is rejected
by `verifySession`, confirmed a fresh `loginWithPassword` attempt is refused with the
distinct deactivation message, and independently exercised the defense-in-depth layer by
creating a session directly on an already-inactive account (bypassing `deactivateAdminUser`
on purpose) and confirming `verifySession` rejected and cleaned it up too. Every expectation
matched exactly.
**Files Changed:** `prisma/schema.prisma` (`AdminUser.active`),
`prisma/migrations/20260910230808_t6_5_admin_user_active/`, `lib/auth/session.ts` + `.test.ts`
(`deactivateAdminUser`, `verifySession` extended), `lib/auth/login.ts` + `.test.ts`
(`loginWithPassword` extended), `memory/decision-log.md`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 126/126 tests across 18
files, 3 new). `docs/user-guide.md` **not** updated — this task has no firm-visible surface
of its own yet (no UI until Milestone 7's Team area). Milestone 6 is **not yet complete** —
T6.6 (account provisioning) is still open; the "Website Build Status" Artifact update is
deferred until that lands too, per this task's own checklist note.

---

## 2026-09-10 (T6.4, session 40)

**Task:** T6.4 — Backup code recovery
**Summary:** Built `POST /api/admin/auth/verify-backup-code` and `lib/auth/login.ts`'s
`verifyBackupCodeLogin` — matches a submitted code against every unused
`admin_backup_code` row for the account (a bcrypt loop, not a lookup, since hashes aren't
queryable by plaintext), consumes it, resets `totpEnabled`/`totpSecret` in the same
transaction (the addendum T6.3 left for this task), creates a real session, and issues a
fresh `/admin/setup-2fa` link via T6.2's `issueSetupToken`. Added a `backup_code`
`AdminLoginAttemptKind` value so this endpoint shares the same rate-limiting mechanism as
the other three. Extended `app/admin/login/login-form.tsx` with a "use a backup code
instead"/"use your authenticator app instead" toggle between the TOTP and backup-code
states, and a distinct "contact another administrator" message when an account has zero
unused codes left (`admin-authentication.md`'s own edge case — no self-service bypass
anywhere).
**Real gap found and fixed as a T6.2 follow-up (not new T6.4 debt)**: live-testing this
task's own recovery flow surfaced that T6.2's `confirmTotpSetup` never retired a previous
batch of unused backup codes — it only ever added new ones, since T6.2 itself was only ever
called once per account before this task gave it a second real caller. Fixed in the same
transaction that creates a new batch: delete every unused row for the account first. Full
writeup in `memory/known-bugs.md` and `memory/decision-log.md`.
Verified for real via Playwright MCP + `curl` against a real, fully-enrolled test
`admin_user` with real (bcrypt-hashed) backup codes: the UI toggle between TOTP and
backup-code steps works; a valid code redirects to the real, fresh `/admin/setup-2fa` link
with a real new QR code (confirmed `totpEnabled: false`/`totpSecret: null` in the database
immediately after); the _same_ code rejected on a second attempt; ran two full
recovery-then-re-enrolment cycles back to back and confirmed in the database that only
actually-_used_ codes survive across cycles (the retirement fix, working as intended); rate
limiting (429 after 5 failures) confirmed on this endpoint too, via a real challenge token
from a real password login. The one thing _not_ independently live-confirmed: the "contact
another administrator" (zero-codes-remaining) message — blocked by the rate limiter from
this same session's own earlier testing (15-minute window, keyed by email); that exact path
is deterministically unit-tested instead (`lib/auth/login.test.ts`). Also noted, not a bug:
under this design a successful recovery always regenerates a fresh batch of 8, so genuinely
reaching zero remaining codes through normal use is hard by construction — a safe outcome,
documented honestly rather than staged. Checked mobile (390px), tablet (768px), and desktop
(1280px) renders of the backup-code UI state.
**Files Changed:** `prisma/schema.prisma` (`AdminLoginAttemptKind.backup_code`),
`prisma/migrations/20260910203732_t6_4_backup_code_attempt_kind/`, `lib/auth/login.ts` +
`.test.ts` (`verifyBackupCodeLogin`), `app/api/admin/auth/verify-backup-code/route.ts`,
`app/admin/login/login-form.tsx` (backup-code toggle), `memory/known-bugs.md`,
`memory/decision-log.md`. (`lib/auth/totp-setup.ts` + `.test.ts`'s own change committed
separately, under T6.2's identity — see the follow-up entry above.)
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 123/123 tests across 18
files, 5 new). `docs/user-guide.md` **not** updated — still no sanctioned way for the firm
to create its first real account (T6.6, still open), so nothing here is firm-usable yet
without developer involvement.

---

## 2026-09-10 (T6.2 follow-up, session 40)

**Task:** T6.2 follow-up — retire unused backup codes when generating a new batch
**Summary:** Found live-testing T6.4's new backup-code recovery flow: `confirmTotpSetup`
(T6.2, `lib/auth/totp-setup.ts`) only ever `createMany`'d a fresh batch of 8 backup codes,
never retiring whatever unused codes already existed from an earlier enrolment — harmless
at T6.2 (called once per account, ever) but a real, silently-ever-growing correctness gap
once T6.4 gave it a second real caller (forced re-enrolment). Fixed in the same session,
same transaction that creates the new batch: delete every _unused_ `admin_backup_code` row
for the account first (an already-used row is left alone — inert history, same
"never destroy a real usage record" precedent as `Subscriber.unsubscribedAt`). Confirmed for
real across two full recovery-then-re-enrolment cycles, inspecting the database directly
after each — only codes actually used across both cycles survived; every unused leftover
was gone. Per CLAUDE.md's own "small fix to an already-shipped task → fix now, commit under
that task's identity" rule, not filed as new technical debt.
**Files Changed:** `lib/auth/totp-setup.ts` (`confirmTotpSetup`), `lib/auth/totp-setup.test.ts`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Committed separately from T6.4's own feature commit, under T6.2's task identity,
per this project's established follow-up-fix convention (first used at T3.7).

---

## 2026-09-10 (T6.3, session 39)

**Task:** T6.3 — Login + TOTP verification + session management
**Summary:** Built `POST /api/admin/auth/login`, `POST /api/admin/auth/verify-totp`,
`/admin/login` (both steps, no dedicated TOTP-step mockup — inferred from T6.2's own
Step-1 pattern per this task's own addendum), and `proxy.ts` — the piece that actually makes
"no admin route reachable without a session" true for the first time (T6.1's tables and
T6.2's setup screen existed before this, but nothing enforced anything). New `lib/auth/`
modules: `session.ts` (DB-backed sessions, 30-min inactivity / 12-hour absolute policy),
`challenge-token.ts` (stateless HMAC token between the password and TOTP steps),
`rate-limit.ts` (a real table, not an in-memory counter, covering all three
code-guessing endpoints including T6.2's setup-2fa confirm per that task's addendum), and
`login.ts` (orchestrates all of it, including TOTP replay protection via otplib's own
`afterTimeStep`). Extracted `app/admin/auth-shell.tsx` from T6.2's page so `/admin/login`
reuses it instead of duplicating the card markup.
**Real bug caught live-testing, not by static analysis**: `proxy.ts` written at
`app/proxy.ts` (CLAUDE.md's own stated path) compiled and ran with zero errors while never
actually executing at all — Next.js only looks for this file at the project root. `/admin`
stayed fully open with no session check, silently. Caught only because the Task Completion
Checklist's "exercise it for real via Playwright MCP" step is non-negotiable; moved the file,
confirmed the fix with a real unauthenticated request (307 → `/admin/login`), corrected
CLAUDE.md's own text so this doesn't recur, logged in `memory/known-bugs.md`.
Also renamed the `NEXTAUTH_SECRET` env var placeholder (reserved since T1.1, unused until
now) to `ADMIN_CHALLENGE_TOKEN_SECRET` — this project never adopted `next-auth`, and giving
its first real consumer the old name would have kept implying a dependency that was never
true. Updated everywhere: `.env.example`, `CLAUDE.local.md`, `README.md`, a fresh dev value
generated into `.env.local`. Also backfilled `README.md`'s env-var list with
`ADMIN_TOTP_ENCRYPTION_KEY` (T6.1's own var, missed there at the time).
Verified for real via Playwright MCP against a real, fully-enrolled test `admin_user`
(throwaway script, deleted before commit): confirmed pre-login `/admin` access is blocked
(this task's literal acceptance criterion); a real wrong-password attempt shows the generic
"Invalid email or password" message; a real correct password → correct TOTP code completes
login and lands on the real authenticated dashboard, with the session row, `login_attempt`
rows, and `lastVerifiedTotpStep`/`lastLoginAt` all inspected directly in the database and
matching expectations exactly; reusing an already-verified code on a second login attempt
within the same window is rejected (replay protection, confirmed against `otplib`'s own
`afterTimeStep`); five failed password attempts trigger a real 429 rate-limit response, which
then also blocks a subsequent _correct_ password (the intended behavior, not a bug); backdating
a session's `lastActivityAt` past 30 minutes and revisiting `/admin` redirects back to login
and deletes that specific session row (lazy expiry, confirmed not to sweep other rows). Also
confirmed `/api/admin/*` (non-auth) returns 401 JSON rather than a redirect, and that T6.2's
`/admin/setup-2fa` still renders and functions correctly after the `AuthShell` extraction.
Checked mobile (390px), tablet (768px), and desktop (1280px) renders of `/admin/login`.
**Files Changed:** `prisma/schema.prisma` (`AdminUser.lastVerifiedTotpStep`,
`AdminSession.token`/`lastActivityAt`, new `AdminLoginAttempt` model + `AdminLoginAttemptKind`
enum), `prisma/migrations/20260910195546_t6_3_session_replay_rate_limit/`, `proxy.ts` (new,
project root), `lib/auth/session.ts` + `.test.ts`, `lib/auth/challenge-token.ts` + `.test.ts`,
`lib/auth/rate-limit.ts` + `.test.ts`, `lib/auth/login.ts` + `.test.ts`,
`lib/auth/totp-setup.ts` + `.test.ts` (rate-limit wiring added), `app/admin/auth-shell.tsx`
(new, extracted from `app/admin/setup-2fa/page.tsx`), `app/admin/login/page.tsx` +
`login-form.tsx`, `app/api/admin/auth/login/route.ts`, `app/api/admin/auth/verify-totp/
route.ts`, `.env.example`, `CLAUDE.local.md`, `.env.local` (not tracked), `README.md`,
`CLAUDE.md` (Next.js 16 note corrected), `memory/known-bugs.md`, `memory/decision-log.md`,
`docs/sessions/session-38-admin-2fa-setup-flow.md` (pre-existing Prettier formatting issue
fixed as part of this session's quality gate, per CLAUDE.md's "fix pre-existing lint failures
too" rule).
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 118/118 tests across 18
files, 28 new). `docs/user-guide.md` **not** updated — login now technically works, but
there is still no sanctioned way for the firm to create its own first account (T6.6, still
open) and no account-management UI exists yet (Milestone 7), so nothing here is actually
usable by the firm without developer involvement.

---

## 2026-09-10 (T6.2, session 38)

**Task:** T6.2 — 2FA setup flow — `/admin/setup-2fa`
**Summary:** Built the real `/admin/setup-2fa` screen to its mockup
(`ui/mockups/f-admin-auth/admin-2fa-setup.html`): a server-rendered QR code + manual-key
fallback, a client-side confirm-code step, and a backup-codes step gated by a required
checkbox before "Finish setup" (→ `/admin/login`, a forward reference to T6.3). Added
`lib/auth/totp-setup.ts` (`resolvePendingTotpSetup`, `confirmTotpSetup`, `issueSetupToken`)
and `POST /api/admin/auth/setup-2fa`. Resolved a real design gap the task itself flagged (no
login session exists pre-enrolment, so the screen needs another way to identify "which
account") by adding `admin_user.setup_token`/`setup_token_expires_at` — see
`memory/decision-log.md` for the full reasoning, including how T6.4/T6.6 will reuse the same
mechanism. Split `app/admin/layout.tsx`/`page.tsx` into a new `app/admin/(shell)/` route
group so this auth screen (and T6.3's future login screen) don't inherit the authenticated
sidebar shell.
Verified for real via Playwright MCP against a real `admin_user` + setup token (throwaway
script, deleted before commit): loaded the real page, extracted the real server-generated
manual key from the DOM, computed the current valid code with `otplib`'s own `generate()`
(the same RFC 6238 math any real authenticator app implements) since no physical device
exists in this environment, typed it into the real input, and confirmed the real success
state (8 real backup codes, correct DB writes — `totp_enabled: true`, `setup_token: null`,
8 hashed `admin_backup_code` rows). Also confirmed single-use enforcement (revisiting the
same, now-consumed link correctly shows "no longer valid") and checked mobile (390px), tablet
(768px), and desktop (1280px) renders.
Discovered and logged as new technical debt: no task anywhere creates a real `admin_user` row
— added T6.6 (Initial admin account provisioning, a developer-run CLI script) to close it,
plus addenda on T6.3 (setup-2fa's confirm endpoint needs the same rate-limiting T6.3 builds)
and T6.4 (its re-enrolment redirect must reset `totpEnabled`/`totpSecret` before reusing
`issueSetupToken`, or T6.2's own "already set up" check would reject it).
**Files Changed:** `prisma/schema.prisma` (`AdminUser.setupToken`/`setupTokenExpiresAt`),
`prisma/migrations/20260910193052_t6_2_admin_user_setup_token/`, `lib/auth/totp-setup.ts` +
`.test.ts`, `app/admin/(shell)/layout.tsx` + `page.tsx` (moved from `app/admin/`),
`app/admin/setup-2fa/page.tsx`, `app/admin/setup-2fa/totp-setup-form.tsx`,
`app/api/admin/auth/setup-2fa/route.ts`, `package.json`/`package-lock.json` (added `qrcode`,
`@types/qrcode`), `docs/tasks/06-admin-auth.md` (new T6.6; addenda on T6.3/T6.4),
`memory/technical-debt.md`, `memory/decision-log.md`.
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (lint, format:check, typecheck, 88/88 tests across 14
files, 10 new in `lib/auth/totp-setup.test.ts`). `docs/user-guide.md` **not** updated — still
nothing firm-usable yet (no login flow, no way for the firm itself to create an account
without T6.6), same explicit-skip reasoning as T6.1.

---

## 2026-09-10 (T6.1, session 37)

**Task:** T6.1 — Data model: `admin_user`, `admin_backup_code`, `admin_session`
**Summary:** Milestone 6 (Admin Authentication) begins. Added the three tables
`docs/features/admin-authentication.md` names, migrated against the real dev database
(`20260910190643_t6_1_admin_auth_tables`), and established `lib/auth/` (CLAUDE.md's Auth
Pattern section) with the two crypto-adjacent helpers this schema's own field types need:
`lib/auth/password.ts` (`bcryptjs` hash/verify, shared by `admin_user.password_hash` and
`admin_backup_code.code_hash`) and `lib/auth/totp-encryption.ts` (AES-256-GCM via Node's
`crypto` module, keyed by a new `ADMIN_TOTP_ENCRYPTION_KEY` env var, for
`admin_user.totp_secret` — reversible, unlike the other two, since TOTP verification needs
the live plaintext secret). `lib/auth/totp.ts` wraps `otplib`'s `generateSecret()` only (ADR
0007's vetted RFC 6238 library) — QR/`otpauth://` URI generation and code verification stay
T6.2/T6.3's job, not built ahead of need. `bcryptjs` was chosen over the native-binding
`bcrypt`/`argon2` packages specifically to avoid Railway's isolated build-container
native-compile risk (see `memory/decision-log.md`, T6.1, for the full reasoning — a real,
already-hit failure mode on this project twice over for unrelated reasons).
Acceptance criterion ("no plaintext password or raw TOTP secret is ever written to logs")
verified at this task's actual scope (no login route exists until T6.3) via
`lib/auth/password.test.ts` and `lib/auth/totp-encryption.test.ts`: a mocked failed
`bcrypt.compare` call with console spies attached confirms nothing is ever logged, and every
thrown error message (hash/verify/encrypt/decrypt failure paths) is asserted to never contain
the raw credential/secret. Also ran a real end-to-end round-trip against the dev database via
a throwaway script (`scripts/_verify-t6-1.ts`, deleted before commit): created a real
`admin_user`/`admin_backup_code`/`admin_session` row set, confirmed `verifyPassword` accepts
the correct password and rejects a wrong one, confirmed `decryptTotpSecret` recovers the
exact original secret while the stored `totp_secret`/`password_hash` columns never match the
raw values, and confirmed deleting the `admin_user` row cascades to its backup codes and
sessions (needed for T6.5's future immediate-invalidation requirement).
`Author.adminUserId` stays an unwired placeholder FK (unchanged, out of this task's scope) —
logged as new technical debt, sequenced into T7.6.
**Files Changed:** `prisma/schema.prisma` (3 new models), `prisma/migrations/
20260910190643_t6_1_admin_auth_tables/`, `lib/auth/password.ts` + `.test.ts`, `lib/auth/
totp-encryption.ts` + `.test.ts`, `lib/auth/totp.ts` + `.test.ts`, `package.json`/
`package-lock.json` (added `bcryptjs`, `otplib`), `.env.example` (new
`ADMIN_TOTP_ENCRYPTION_KEY` entry), `CLAUDE.local.md`/`.env.local` (not tracked — real dev key
recorded/generated), `memory/technical-debt.md`, `docs/tasks/07-content-admin.md` (T7.6
addendum).
**Related Feature:** `docs/features/admin-authentication.md`
**Notes:** Quality gates all clean (`npm run lint`, `npm run format:check`, `npm run
typecheck`, `npm run test` — 78/78 passing across 13 files, 11 new). No UI/route exists yet
for this task (schema-only) — Playwright MCP verification is not applicable, per the task's
own note; the real-database round-trip script above is this task's equivalent "exercise it
for real" step.

---

## 2026-09-10 (process, session 36+)

**Task:** Start `docs/user-guide.md` (firm operational manual) and its Artifact mirror;
establish the incremental-update rule; update the pre-existing "Website Build Status"
Artifact for Milestone 5's completion
**Summary:** The user asked to begin a full user guide/manual for the firm now — covering
everything the platform can do, what to monitor, and what actions are available — with an
explicit durable rule to keep it updated task-by-task rather than auditing everything at the
end. Created `docs/user-guide.md`, covering Milestones 1–4 (complete) and Milestone 5
(complete through T5.1–T5.4), organized as one capability card per shipped feature (what it
does / what to monitor / what a partner can do today), plus a quick-reference monitor table
and a change log. Published it as a matching Artifact,
<https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc>, reusing this
project's own fixed brand palette/type (`ui/design-system.md` — Pine/Brass/Ivory, Georgia
display + Calibri body) rather than inventing a new visual identity, for consistency with
the user's own pre-existing "Website Build Status" Artifact. The user also asked that that
pre-existing Artifact (<https://claude.ai/code/artifact/a26811bf-998b-4899-b3ad-0d03ce7c828f>,
"Website Build Status") get a standing rule of its own: updated whenever an epic/milestone
completes or a major change happens. Read its live content first (per the Artifact tool's
own read-before-update rule), then republished it in place reflecting Milestone 5's real
completion (T5.1–T5.4 live, T5.5 deferred before Milestone 9, progress bar and percentage
updated, "Next up" changed to Milestone 6) — this session's own Milestone-5-completion event
from the prior task became the first real trigger of the new rule.
**Files Changed:** `docs/user-guide.md` (new), CLAUDE.md (new "Firm-Facing Documentation"
section; new bullet in Knowledge Management Responsibilities; two new Task Completion
Checklist items), `memory/decision-log.md`, `memory/completed-work.md`. Two Artifacts
published/updated (not repo files): the new "Platform User Guide" Artifact, and the
pre-existing "Website Build Status" Artifact.
**Related Feature:** None — this is project process/tooling, not a `docs/tasks/*.md` task.
**Notes:** No application code touched; quality gates re-run and confirmed clean regardless,
per the Task Completion Checklist's own standing habit. Both Artifact URLs and the update
rules for each are recorded in CLAUDE.md's "Firm-Facing Documentation" section going forward
— a future session should read that section, not this entry, for the standing rule.

---

## 2026-09-10 (planning, session 36+)

**Task:** Resequence T5.5; mark Milestone 5 complete
**Summary:** The user asked whether leaving T5.5 unbuilt blocks anything else, given its
real external-account dependencies (Meta Business Manager, Google Ads, LinkedIn, plus
`kaalbert.com`'s still-open domain registration). Checked the actual dependency graph rather
than assuming: only Milestone 9's T9.4/T9.5/T9.6 depend on T5.5, and Milestone 9 is
explicitly "(Bonus)," never built until Phase 1 is complete — so T5.5 blocks nothing on the
critical path. On that basis, the user asked to resequence T5.5 to execute immediately
before Milestone 9 (not right after T5.4) and to mark Milestone 5 complete. Implemented as a
build-order resequencing, not a task renumbering (T5.5 keeps its identity, per CLAUDE.md's
"task IDs only ever move forward" rule) — added mirrored notes in both epic files
(`docs/tasks/05-landing-and-measurement.md`'s T5.5 entry + epic header;
`docs/tasks/09-performance-dashboards.md`'s epic header, before T9.1) and in
`docs/roadmap.md`'s Milestone 5/9 entries, plus a `Status: Complete (T5.1–T5.4)` marker on
Milestone 5's epic file — the first per-epic status line in this project, worth reusing for
a similar situation later. Refreshed `docs/dashboard.md`'s "Current Phase" line to match
(the rest of that document is a stale Phase-6-planning snapshot, flagged as such rather than
fully rewritten — out of scope for this request).
**Files Changed:** `docs/tasks/05-landing-and-measurement.md`, `docs/tasks/
09-performance-dashboards.md`, `docs/roadmap.md`, `docs/dashboard.md`, `memory/
decision-log.md`, `memory/completed-work.md`, `docs/sessions/session-36-attribution-capture.md`
(re-synced: Blockers section rewritten to record the resequencing decision, "Next Task"/
"Paste This to Continue" replaced with the real T6.1 handoff, per the session-management
skill's living-document rule), `docs/tasks/06-admin-auth.md` (one-line fix — epic header
cited a stale `ui/mockups/g-admin-content/` path for the login/2FA-setup mockups; confirmed
via `ls` that the real files live under `ui/mockups/f-admin-auth/` and corrected in place;
caught while preparing the T6.1 handoff, not itself a technical-debt item since it was fixed
immediately).
**Related Feature:** `docs/features/measurement-and-attribution.md`,
`docs/features/platform-performance-dashboards.md`, `docs/features/admin-authentication.md`.
**Notes:** No application code changed — this was entirely a planning-document/sequencing
correction plus the session handoff to Milestone 6. Confirmed via grep before writing the
T6.1 handoff that no `lib/auth`, `app/proxy.ts`, or `admin_user`/`admin_session`/
`admin_backup_code` Prisma models exist yet — T6.1 is a genuine from-scratch task, not
extending anything partially built. Next task for a fresh session is Milestone 6, T6.1
(`docs/tasks/06-admin-auth.md`), not T5.5.

---

## 2026-09-10 (T5.4 follow-up, session 36)

**Task:** T5.4 follow-up — schedule the attribution retention job via Railway config-as-code
**Summary:** Corrected this session's own earlier claim that scheduling
`scripts/cleanup-attribution.ts` required a manual Railway dashboard action — the user asked
whether it could be scripted instead, and it could: this repo's already-tracked
`.railway/railway.ts` (Railway's config-as-code file, from T1.1) now declares a new
`attribution-cleanup` service (`deploy.cronSchedule: "0 3 * * *"`, `restartPolicyType:
"NEVER"`, `build: "true"` to skip an unnecessary full Next.js build), applied for real via
`railway config apply` with the user's explicit go-ahead. Verified the real IaC schema by
installing the actual `railway` npm package into an isolated scratch directory and reading
its `.d.ts` files directly (confirmed the CLI does not validate unknown properties, so
trial-and-error alone would have been worthless evidence). The first real deployment
attempt failed for real (confirmed via `railway service list`'s deployment status and
`railway logs --build`), diagnosed from actual logs and fixed properly rather than
papered over: `DATABASE_URL: preserve()` doesn't create a value for a brand-new service with
no prior one, so it deployed unset — fixed with a real `ref(postgres_db, "DATABASE_URL")`
cross-service reference. A second redeploy then succeeded (`status: SUCCESS`). Also caught
and fixed, before applying anything (via `railway config plan`'s dry-run diff): the existing
`kaalbert-web` service's IaC declaration was stale and would have deleted
`BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`/`GTM_CONTAINER_ID` on apply, since
an undeclared variable is treated as "should not exist." Also decided and recorded a
standing pattern (checked against `platform-performance-dashboards.md`'s real Milestone 9
requirement, not assumed): one small Railway Cron Job service per scheduled task, never a
shared worker/dispatcher process.
**Files Changed:** `.railway/railway.ts` (new `attribution-cleanup` service declaration;
`postgres("Postgres")` reference added; `preserve()` added for the four previously-undeclared
`kaalbert-web` variables), `memory/technical-debt.md` (the "Attribution's 90-day retention
job" entry flipped to Resolved), `memory/decision-log.md`, `memory/completed-work.md`,
`CLAUDE.md` (new Recurring Patterns entry). No application code changed — this was entirely
an infrastructure/config-as-code correction.
**Related Feature:** `docs/features/measurement-and-attribution.md` (the job this schedules),
`docs/features/platform-performance-dashboards.md` (the future case the pattern decision was
checked against).
**Notes:** The real, live `attribution-cleanup` Railway service now exists and is scheduled
— nothing further to do. This is logged as a "T5.4 follow-up" per CLAUDE.md's own
task-follow-up convention (the debt was small, discovered and fixed in the same session
T5.4 itself shipped in, so it's fixed now rather than deferred to a future task).

---

## 2026-09-10 (T5.4, session 36)

**Task:** T5.4 — Attribution capture, persistence, and 90-day retention job
**Summary:** Built the `Attribution` model (`session_id` `@unique`, `utm_source`/
`utm_medium`/`utm_campaign` nullable, `landing_page`, `first_seen`) and an `EnquiryRecord.
attributionId` foreign key (`onDelete: SetNull`), resolving the T2.6-era inconsistency
between `business-health-check-diagnostic.md`'s original inline-column wording and
`measurement-and-attribution.md`'s own separate-entity design (`memory/decision-log.md`,
T2.6). Since no server-side session mechanism exists anywhere in this codebase (confirmed by
searching — no `proxy.ts`/`middleware.ts`, no session cookie, and `DiagnosticResponse.
sessionId` explicitly has "no real visitor-session concept to draw on" per its own
doc-comment), attribution capture is entirely client-driven: `lib/attribution-client.ts`
(no `@/lib/prisma` import, same client/server split precedent as `lib/
diagnostic-flow-options.ts`) captures first-touch attribution once per browser
(`crypto.randomUUID()` + `localStorage`, parsing `utm_source`/`utm_medium`/`utm_campaign`
from the current URL and the current path as `landing_page`) via a new
`AttributionCapture` component mounted site-wide in `app/layout.tsx` (same pattern as
`ConsentBanner`) — so it runs on whichever page a visitor actually lands on first, not only
`/lp/[slug]`, per the feature doc's own examples (a shared article, a direct campaign URL).
`lib/attribution.ts`'s `resolveAttributionId` (server-side) defensively parses the
untrusted client payload and upserts by `sessionId`, returning `null` for anything
missing/malformed/failed — wired into both `lib/enquiries.ts`'s `createContactEnquiry` and
`lib/diagnostic-submit.ts`'s `submitDiagnosticResponses` (which also changed
`POST /api/diagnostic/submit`'s wire shape from a bare array to
`{answers, attribution?}` to carry the new payload — updated `components/diagnostic-flow.tsx`
and the feature doc's Interfaces section to match). `lib/attribution-cleanup.ts`'s
`deleteExpiredAttributionRows` implements the epic's own already-decided 90-day retention
window (ages off `firstSeen`, never deletes a row referenced by any real
`enquiry_record`), runnable via `npm run attribution:cleanup` (`scripts/
cleanup-attribution.ts`) — not yet wired to an actual Railway Cron Job schedule, which is a
dashboard action for the user to take at their discretion (`memory/technical-debt.md`).
Verified end-to-end for real against the live dev server and database: a UTM-tagged landing
→ `/diagnostic` navigation → real `POST /api/diagnostic/submit` call correctly produced an
`enquiry_record` whose `attribution` relation carried the exact original UTM values; a
direct visit (no UTM params) correctly stored an attribution row with null utm fields
(never blocking submission); a deliberately malformed attribution payload also never
blocked submission (`attributionId` simply came back `null`); and the retention job,
exercised against three seeded rows (expired+unreferenced, expired+referenced,
recent+referenced), deleted exactly the one row that should be deleted and correctly
preserved both others — including the referenced-regardless-of-age case, this task's own
explicit acceptance criterion. All test/scratch rows were deleted afterward.
**Files Changed:** `prisma/schema.prisma` (`Attribution` model, `EnquiryRecord.
attributionId`), `prisma/migrations/20260910143644_t5_4_attribution/`, `lib/
attribution-client.ts` (new), `lib/attribution.ts` (new), `lib/attribution-cleanup.ts` (new),
`lib/attribution.test.ts` (new), `lib/attribution-cleanup.test.ts` (new), `scripts/
cleanup-attribution.ts` (new), `package.json` (`attribution:cleanup` script), `lib/
enquiries.ts` + `lib/enquiries.test.ts`, `lib/diagnostic-submit.ts` + `lib/
diagnostic-submit.test.ts`, `app/api/contact/submit/route.ts`, `app/api/diagnostic/submit/
route.ts`, `components/contact-form.tsx`, `components/diagnostic-flow.tsx`, `components/
attribution-capture.tsx` (new), `app/layout.tsx`, `docs/features/
business-health-check-diagnostic.md`, `docs/features/contact-and-enquiry.md`, `docs/
features/measurement-and-attribution.md`.
**Related Feature:** `docs/features/measurement-and-attribution.md`,
`docs/features/business-health-check-diagnostic.md`, `docs/features/contact-and-enquiry.md`.
**Notes:** A real bug caught and fixed during this task's own verification, worth flagging:
the first version of `scripts/cleanup-attribution.ts` statically imported `lib/prisma`
alongside its own `dotenv` `config()` calls, textually placed after the config calls — but
ES module `import` statements are hoisted above all other top-level code regardless of
source order, so `lib/prisma.ts` read `process.env.DATABASE_URL` before `config()` ever ran,
throwing "DATABASE_URL is not set" every time. Fixed with `await import(...)` inside `main()`
instead of a static import — documented in the script's own comment so the next person
touching it doesn't reintroduce it. Railway Cron Job scheduling for this script is flagged
as a new, User-triggered technical-debt entry, not built speculatively.

---

## 2026-09-10 (T5.3, session 35)

**Task:** T5.3 — GTM container: six conversion events + consent mode
**Summary:** The user provisioned the real GTM container (`GTM-PDGKRKRN`, account "Kaalbert &
Company Ltd" under `kaalbert.company@gmail.com`, matching this project's own account-ownership
precedent from T1.1) and a real GA4 property (`G-9VX9GS5L0X`), resolving the long-standing
"GTM container not yet provisioned" blocker. Set `GTM_CONTAINER_ID` in `.env.local` and
directly on the Railway `kaalbert-web` service. Populated the container via GTM's own web UI
(driven through the user's real Chrome browser): a `Google Tag` tag ("GA4 Configuration")
plus a shared `{{GA4 Measurement ID}}` Constant variable every downstream event tag reuses;
six `Google Analytics: GA4 Event` tags, each with its own matching `Custom Event` trigger,
for the six fixed events in `lib/data-layer.ts`'s `DataLayerEvent` union
(`diagnostic_started`, `diagnostic_completed`, `summary_requested`, `checklist_downloaded`,
`enquiry_submitted`, `whatsapp_opened`); a `Consent Default` Custom HTML tag on the built-in
`Consent Initialization - All Pages` trigger, setting all four consent signals
(`ad_storage`/`ad_user_data`/`ad_personalization`/`analytics_storage`) to `denied` by
default. Confirmed every GA4 tag carries built-in (automatic, not manually configured)
consent requirements. Published as Version 2 ("Live"). Also built the site's own consent
banner: `components/consent-banner.tsx` (new) + `pushConsentUpdate` (new, `lib/
data-layer.ts`), mounted in `app/layout.tsx`. Verified end-to-end for real: GTM Preview mode
showed all 8 tags firing correctly on their matching triggers with zero cross-firing; after
publishing, a real `google-analytics.com/g/collect` request was observed carrying the `gcd`
consent-diagnostics parameter for both the automatic `page_view` hit and a manually-fired
`diagnostic_started` event, with `hasGtag`/network behavior confirming the pipeline works
end-to-end on a real page, not just in Preview mode.
**Files Changed:** `app/layout.tsx` (mounts `ConsentBanner`; updated comment now that the
container is real), `components/consent-banner.tsx` (new), `lib/data-layer.ts`
(`pushConsentUpdate`), `.env.local`/Railway `kaalbert-web` service (`GTM_CONTAINER_ID`, set by
the user + this session), the GTM container itself (external, not a repo file — 8 tags, 6
triggers, 1 variable, Version 2 published), `memory/technical-debt.md` ("GTM container not
yet provisioned" flipped to Resolved), `memory/decision-log.md`, `memory/completed-work.md`.
**Related Feature:** `docs/features/measurement-and-attribution.md`, ADR 0006.
**Notes:** A real verification pitfall is recorded in `memory/decision-log.md`'s T5.3 entry —
`gtm.js`'s 900-second HTTP cache made every real-browser test initially look broken (stale,
pre-T5.3 empty container being reused) even though GTM Preview mode showed the true, correct
behavior the whole time; resolved once enough wall-clock time passed for the cache to expire
naturally, then reconfirmed via a genuinely fresh tab. Google's own collect endpoint returned
`503` on both real requests observed in this session — that's Google's server (likely flagging
automated/headless browser traffic), not a defect in this implementation; the requests
themselves were correctly constructed with the right consent parameters. T5.4 (attribution
capture/retention) and T5.5 (Meta CAPI, Google Ads import, LinkedIn, domain verification) are
next in the epic — both still need their own real external accounts/credentials before they
can proceed, same pattern as this task.

---

## 2026-09-10 (T5.2 follow-up, session 34)

**Task:** T5.2 follow-up — make the landing page download CTA admin-uploadable, not
developer-supplied
**Summary:** User feedback on the just-committed T5.2 work: the checklist document should be
something a partner uploads through `/admin`, not something handed directly to whoever's
implementing the code — and once that's true, its absence stops being a debt item and
becomes a normal, handled state. Added `LandingPage.downloadFileUrl` (nullable `String`) and
a new `LandingPageCta` client component (`components/landing-page-cta.tsx`, mirroring
`WhatsAppLinkButton`'s click-tracked-link pattern) that renders a real file-download link
firing `checklist_downloaded` when it's set, and falls back to the existing `ctaHref`/
`ctaLabel` link when null — used for both the hero and repeat CTA on `app/lp/[slug]/page.tsx`.
Corrected the memory record to match: resolved the original ("wait for the firm to supply the
file") technical-debt entry and decision-log entry (marked `Superseded`, not deleted), and
replaced them with a correctly-scoped entry/addendum on T7.5 (Landing Pages admin, not yet
built) — the real gap is that T7.5's editor doesn't expose this field yet, once it exists.
Verified via Playwright MCP: the fallback branch renders correctly with `downloadFileUrl`
null (current real state); temporarily set it to a test value, confirmed the CTA switches to
a real download link and fires `checklist_downloaded` with the file URL on click, then
reverted the row back to `null` before finishing.
**Files Changed:** `prisma/schema.prisma` (`LandingPage.downloadFileUrl`), `prisma/
migrations/20260910121704_t5_2_landing_page_download_file_url/`, `components/
landing-page-cta.tsx` (new), `app/lp/[slug]/page.tsx` (uses `LandingPageCta` for both CTAs),
`docs/tasks/07-content-admin.md` (T7.5 addendum), `memory/technical-debt.md` (new entry;
original entry marked Resolved), `memory/decision-log.md` (new entry; original T5.2 entry
marked Superseded), `memory/completed-work.md`.
**Related Feature:** `docs/features/landing-page-template.md`, `docs/features/
content-management-admin.md` (T7.5's future scope).
**Notes:** No admin upload UI or object storage (Cloudflare R2) exists yet — this follow-up
only makes the _absence_ of the file correct and permanent-by-design, it doesn't build the
upload path itself. That remains T7.5's job (addendum added), gated behind real R2
credentials the user supplies when ready (ADR 0004's own "added once justified" framing) —
do not build a stubbed upload mechanism speculatively.

---

## 2026-09-10 (T5.2)

**Task:** T5.2 — Three landing page instances, seeded
**Summary:** Seeded the three named launch `landing_page` rows into T5.1's template —
`business-health-check`, `funding-readiness-checklist`, `financial-clarity-pack` — via a new
`seedLandingPages()` function in `prisma/seed.ts`, following the same
idempotent-`upsert`-per-`seed<Area>()` convention every other entity uses. Copy is sourced
directly from the three accepted mockups (`ui/mockups/d-landing-pages/*.html`) and marked
`isPlaceholder: false` throughout — same "mockup copy is real, shipped copy" precedent
`seedOffers`/`seedHomePageContent` already established. Each instance's `bodyContent` maps to
T5.1's block kinds: `business-health-check` → `stats` + `paragraph`;
`funding-readiness-checklist` → `heading` + `list`; `financial-clarity-pack` → `stats`
(one item, the fee band) + `steps` + `paragraph`. `financial-clarity-pack`'s and
`funding-readiness-checklist`'s `ctaHref` mirror their corresponding offer's own `ctaHref`
exactly (`/contact?service=<slug>`); `business-health-check`'s is `/diagnostic`. Also added
back the Funding-Readiness Pack offer page's `.checklist-panel` cross-promo section
(`app/offers/[slug]/page.tsx`, conditional on `offer.slug === "funding-readiness-pack"`),
resolving the technical-debt entry T2.2 left open pending this landing page's existence.
Verified all three routes live via Playwright MCP (distinct headline/body/CTA per instance,
correct `ctaHref` values, no horizontal overflow at 390px/768px), the cross-promo link on
the offer page pointing to the now-real `/lp/funding-readiness-checklist` route and absent
from the other two offer pages, and the existing `/lp/does-not-exist` 404 still holding.
**Files Changed:** `prisma/seed.ts` (new `seedLandingPages()`, called from `main()`; new
`LandingPageBodyBlock` type import), `app/offers/[slug]/page.tsx` (checklist cross-promo
section + `BTN_SECONDARY`), `memory/completed-work.md`, `memory/decision-log.md`, `memory/
technical-debt.md` (new Open entry; existing cross-promo entry flipped to Resolved).
**Related Feature:** `docs/features/landing-page-template.md`, `docs/features/
core-offer-pages.md`.
**Notes:** The Funding-Readiness Checklist instance's `ctaHref` is a deliberate interim —
routes through the real `/contact?service=funding-readiness-pack` enquiry path rather than a
fabricated download link, since no real checklist PDF exists yet. See `memory/decision-
log.md`'s T5.2 entry and the new `memory/technical-debt.md` entry ("Funding-Readiness
Checklist landing page has no real downloadable asset yet," `Trigger type: User-triggered`,
`Sequenced into: T5.3`) for the full reasoning — do not build a capture mechanism or
fabricate checklist content without the user/firm explicitly supplying the real asset first.

---

## 2026-09-10 (T5.1)

**Task:** T5.1 — Landing page template — `/lp/[slug]`
**Summary:** Built the paid-traffic landing page template Milestone 5 opens with. Added a
`LandingPage` model (`landing_page` table) with the feature doc's literal field list
(`slug`/`headline`/`opening_paragraph`/`body_content`/`cta_label`/`cta_href`/
`campaign_reference`/`meta_title`/`meta_description`) plus two justified additions following
the T2.2/T2.4 "mockup shows more than the feature doc named" precedent: `kicker` (all three
accepted mockups render one above the `<h1>`, and it varies per campaign) and `isPlaceholder`
(every other seeded-content model's convention). `body_content` is an ordered
`kind`-discriminated block list (`heading`/`paragraph`/`list`/`stats`/`steps`) — same
convention as `LegalPage.body`/`Article.body` — sized to cover exactly the block shapes the
three accepted mockups (`ui/mockups/d-landing-pages/*.html`) actually use (business-health-
check's `.proof-row` → `stats`, funding-readiness-checklist's `.whats-inside` →
`heading`+`list`, financial-clarity-pack's `.stage-row` → `steps`, and each mockup's
repeat-CTA reassurance line → `paragraph`), not a general-purpose page builder. `lib/
landing-pages.ts` adds `getLandingPageBySlug` (thin `prisma.landingPage.findUnique`
passthrough, same shape as `lib/offers.ts`/`lib/legal.ts` — `null` on no match, caller
404s). `app/lp/[slug]/page.tsx` renders: a new `LandingPageHeader` client component
(`components/landing-page-header.tsx` — logo-only, no `<nav>` at all, reusing `SiteHeader`'s
fixed/transparent-over-hero/logo-swap-on-scroll visual language but with zero nav markup, so
"no site navigation renders under any circumstance" holds structurally, not by a toggle) →
dark hero (kicker/headline/opening_paragraph/CTA) → the `body_content` blocks → a repeated
CTA → the real, unmodified `<SiteFooter>` (never a per-instance copy, per the architecture
constraint) for the full Section 8.2 statement. Verified with Playwright MCP against a
throwaway `test-verification` row (seeded via a scratch `tsx` script, then deleted after
verification — T5.2, not this task, owns the three real seeded instances): confirmed zero
`<nav>` landmarks anywhere on the page (accessibility-tree snapshot), the full `SiteFooter`
scope-of-practice statement rendering, correct OG/Twitter tags + canonical URL + Organization
JSON-LD, a non-existent slug returning a real 404, no horizontal overflow at 390px/768px/
1280px, and the header's scroll-triggered logo swap working. Also wired `landing_page` into
`lib/seo.ts`'s `getSitemapEntries` (seo-and-search-foundation.md explicitly lists "every
landing page instance" as part of `/sitemap.xml`'s content) — removed that function's old
"landing_page doesn't exist yet" comment.
**Files Changed:** `prisma/schema.prisma` (new `LandingPage` model), `prisma/migrations/
20260910111957_t5_1_landing_page/`, `lib/landing-pages.ts` (new), `components/
landing-page-header.tsx` (new), `app/lp/[slug]/page.tsx` (new), `lib/seo.ts`
(`getSitemapEntries` now queries `landingPage`).
**Related Feature:** `docs/features/landing-page-template.md`, `docs/features/
seo-and-search-foundation.md`.
**Notes:** No admin editor exists yet (Milestone 7) and this task doesn't seed real
instances (T5.2's job, next) — the `landing_page` table is empty on disk right now, by
design, exactly as it was before this session. The Funding-Readiness Pack offer page's
`.checklist-panel` cross-promo addendum on T5.2 (`memory/technical-debt.md`) still applies
unchanged — it's keyed on the landing page actually being _seeded_, not just the template
existing.

---

## 2026-09-10 (continued)

**Task:** T1.1 follow-up — fix `prepare` script breaking the Railway production build
**Summary:** After the previous entry's commits were pushed, Railway's next build failed:
`npm error command failed ... git config core.hooksPath .githooks` → `fatal: not in a git
directory`. Railway's Railpack build copies the repo into `/app` as a plain build context,
not a git checkout, so the new `prepare` script's bare `git config` call had no `.git` to
operate on, and `npm install` treats a failed lifecycle script as fatal — this took the whole
build down, not just the hook setup. Fixed by guarding the script:
`git rev-parse --is-inside-work-tree > /dev/null 2>&1 && git config core.hooksPath
.githooks || exit 0` — verified both branches (still sets `core.hooksPath` inside this repo;
exits 0 with no error when run from a directory with no `.git`). Documented as a standing
CLAUDE.md rule (Code Conventions: git-dependent lifecycle scripts must guard against a
missing `.git`) and a `memory/known-bugs.md` entry, since this is a real production incident
a future session needs to know about, not just an in-session correction.
**Files Changed:** `package.json` (`prepare` script guard), `CLAUDE.md` (new Code
Conventions bullet), `memory/known-bugs.md` (new Fixed entry), `docs/sessions/session-31-
pre-push-hook.md` (re-synced).
**Related Feature:** none — infrastructure/tooling.
**Notes:** Not pushed yet as of this entry — commit exists locally on `main`; the user needs
to push again for Railway's next build to pick up the fix.

---

## 2026-09-10

**Task:** T1.1 follow-up — pre-push quality-gate hook
**Summary:** CLAUDE.md's Quality Gates section already claimed a pre-push hook existed
("runs lint, format-check, type-check, and tests, and blocks the push if any fail") and its
Next.js 16 typed-routes note claimed it was "wired into the `typecheck` script, the pre-push
hook, and CI already" — neither was true; no `.git/hooks/pre-push` or tracked hook existed.
Prompted by the user reporting repeat CI failures on GitHub. Root-caused the actual last CI
failure first: `npm run format:check` failed on two files (`memory/decision-log.md`,
`docs/sessions/session-30-planning-framework-alignment.md`) with stray line-wrap/emphasis
issues from session 30 — fixed via `prettier --write`. `npm run lint`, `npm run typecheck`,
and `npm run test` all already passed clean. Then built the actual hook: a tracked
`.githooks/pre-push` script (git-native `core.hooksPath`, no new dependency) running lint →
format:check → typecheck → test in that order, aborting on the first failure with a clear
message; `npm run prepare` (added to `package.json`, auto-runs on `npm install`/`npm ci`) sets
`core.hooksPath` to `.githooks` so every clone gets it automatically, not just this machine.
Verified by direct invocation: a clean run passes all four gates, and an injected
formatting error correctly aborts with exit code 1 before reaching later gates. Also added a
`Test` step to `.github/workflows/ci.yml` (previously only type-check/lint/format-check),
since CLAUDE.md's own Quality Gates list requires `npm run test` as a hard gate and it's
DB-free (jsdom environment, no live Prisma calls) so it costs nothing to run in CI.
**Files Changed:** `.githooks/pre-push` (new), `package.json` (`prepare` script),
`.github/workflows/ci.yml` (added `Test` step), `memory/decision-log.md` and
`docs/sessions/session-30-planning-framework-alignment.md` (Prettier formatting fix).
**Related Feature:** none — infrastructure/tooling, not a `docs/features/*.md` feature.
**Notes:** No `memory/technical-debt.md` entry needed — this is the "small, owning task
already shipped, fix it now" case (T1.1 shipped session 01), not a fix deferred to a future
task. A dev who bypasses the hook with `git push --no-verify` still has CI (now including
tests) as a backstop.

---

## 2026-09-06 (session 30)

**Task:** process — align project with the updated `PROJECT_PLANNING_FRAMEWORK.md`
**Summary:** Read the updated external planning framework in full, diffed it against this
project's actual state, and reported findings before changing anything. Implemented the four
changes the user approved: (1) split CLAUDE.md's MCP Server Setup, Session Management, and
Git Commit Protocol sections out into `.claude/skills/`, bringing CLAUDE.md from 42,606 to
35,133 characters, back under the framework's ~40,000-character threshold; (2) backfilled a
`Status` field onto all 55 `memory/decision-log.md` entries and all 11
`memory/architecture-decisions.md` entries (`Standing`/`Active` by default, `Superseded` on
the one entry already genuinely reversed — T1.3's brand-tone decision); (3) added a
debt/bug/decision-log entry-hygiene section to `.claude/commands/review.md`; (4) built and
wired `.claude/hooks/validate-commit-message.py`, a `PreToolUse` hook mechanically enforcing
the commit message format and the no-`Co-Authored-By` rule (resolving a live conflict
between that rule and the current session's own attribution default, per the user's explicit
choice to keep the project rule). Discovered mid-session that the hook's first cut only
accepted the `T##-##` task-ID form, which would have newly blocked this project's existing
`P#-#` (Phase-2-capability scoping) convention and had no valid form at all for this
session's own commit — added a documented third `process` ID form to cover framework/
tooling-only sessions like this one.
**Files Changed:** CLAUDE.md; `.claude/skills/mcp-server-setup/SKILL.md` (new);
`.claude/skills/session-management/SKILL.md` (new);
`.claude/skills/git-commit-protocol/SKILL.md` (new);
`.claude/hooks/validate-commit-message.py` (new); `.claude/settings.json`;
`.claude/commands/review.md`; `memory/decision-log.md`; `memory/architecture-decisions.md`;
`docs/sessions/session-30-planning-framework-alignment.md` (new)
**Related Feature:** None — process/tooling only, no `docs/features/*.md` affected.
**Notes:** No code, schema, or task in `docs/tasks/*.md` was touched. Milestone/task sequence
is unchanged; next real task is still T5.1 (unchanged since session 28/29).

---

## 2026-09-06 (session 28)

**Task:** T4.5 — Subscription capture
**Summary:** Added the `Subscriber` model (email `@unique`, `consent`, an opaque `@default(cuid())`
`unsubscribeToken` — deliberately not the row's own `id`, since this token backs an
unauthenticated, third-party-clickable link — `subscribedAt`, nullable `unsubscribedAt`).
Built `lib/insights-subscription.ts` (`subscribeToInsights`, `unsubscribeFromInsights`,
mirroring `lib/enquiries.ts`'s validate-in-`lib/`-not-the-route pattern) and the two routes
(`POST /api/insights/subscribe`; `/api/insights/unsubscribe` implementing both `GET`, for the
real emailed one-click link, and `POST`, for the doc's literal interface). Subscribing sends
a confirmation email (via T3.7's `sendTransactionalEmail`) containing the required unsubscribe
link. Built one shared `InsightsSubscribeForm` component (email + one unticked consent
checkbox, no `pushDataLayerEvent` call anywhere — this task's own explicit "don't invent a
seventh measurement event" rule) rendered at the foot of both `/insights` and every
`/insights/[slug]`, since no dedicated mockup exists for this form at all.
**Files Changed:** prisma/schema.prisma (`Subscriber`); prisma/migrations/
20260906071300_add_subscriber/; lib/insights-subscription.ts (+ .test.ts);
app/api/insights/subscribe/route.ts; app/api/insights/unsubscribe/route.ts;
components/insights-subscribe-form.tsx; app/insights/page.tsx (form + unsubscribe
confirmation banner); app/insights/[slug]/page.tsx (form); lib/enquiries.ts (+ .test.ts,
new); lib/diagnostic-request-summary.ts (+ new tests); memory/decision-log.md
**Related Feature:** docs/features/insights-engine.md
**Notes:** Real Playwright verification caught a genuine bug before it could ship: the `GET`
unsubscribe handler's redirect used `getSiteUrl()` (falls back to the unregistered production
domain), so clicking the real link produced `net::ERR_NAME_NOT_RESOLVED` in the browser — fixed
by redirecting relative to the request's own origin instead. Also closed a real, pre-existing
gap in two already-shipped forms once this task made it fixable: `components/contact-form.tsx`
(T2.6) and `components/diagnostic-summary-request-form.tsx` (T3.7) have always had a
`marketingConsent` checkbox specifically promising "occasional Insights articles," but no
`subscriber` row existed to honour it — wired both to the same `subscribeToInsights` this
task built, fire-and-forget, verified for real via `curl` (a checked Contact-form submission
now creates a real, confirmed `subscriber` row). Verified for real via Playwright: subscribe →
confirmation-state UI → real DB row with a real `cuid()` token; the emailed unsubscribe link
(constructed with the real token) → redirects to `/insights?unsubscribed=1` → visible
confirmation banner → `unsubscribedAt` set; re-subscribing the same email → exactly one row,
`unsubscribedAt` cleared back to `null` (no duplicate); missing-consent and missing-email both
return a real 400 with a clear message. Full quality gate run clean: lint, format:check,
typecheck, and the Vitest suite (56 tests total) all pass. This closes out Milestone 4
(Insights) entirely.

---

## 2026-09-06 (session 27)

**Task:** T4.4 — Article content seed
**Summary:** Seeded the firm's real 8 Insights articles, found (after an initial dead end and
a user-directed search) at `Company Docs/11 Thought Leadership/11.01`–`11.10` — Document
13.03 §7/§13's "eight completed articles under two editorial volumes." Parsed each `.docx`'s
paragraph styles programmatically (`Heading2` → subheading blocks) to seed real body content
without manual transcription, as real (`isPlaceholder: false`) `Article` rows across 6 real
categories (consolidated from the 8 articles' own stated themes). Assigned each article to
one of the firm's 5 real partners by subject-matter fit (author attribution was explicitly
left open by the source document) and adapted each article's own "How Kaalbert can help"
section into its `nextStepCta`, pointing at a real core offer where one fits and the free
Business Health Check otherwise. `previewImage` stays null (photography not yet produced,
per the source document itself) — falls back to the site default OG image.
**Files Changed:** prisma/seed.ts (`seedInsightsContent`, `INSIGHTS_ARTICLES`,
`INSIGHTS_CATEGORIES`); app/insights/page.tsx (`ArticleCard`/`categoryInitials` extracted
out); lib/insights.ts (`shapeArticleCard` exported); lib/home.ts (`getFeaturedArticles`
returns the shared `InsightsArticleCard` shape); app/(public)/page.tsx (uses the shared card,
adds a "See all Insights" link); components/insights-article-card.tsx (new, shared
`ArticleCard`); lib/home.test.ts (updated for the new return shape); memory/decision-log.md
**Related Feature:** docs/features/insights-engine.md
**Notes:** The user caught a real regression during review that neither T4.2's nor T4.3's own
verification had surfaced (both used synthetic throwaway test data, never real content at
volume): Home's featured-Insights cards had drifted into a visually different, unlinked
`<div>` — no link to the article, no link to `/insights` from the section at all. Root cause
was `getFeaturedArticles` returning its own one-off shape instead of `lib/insights.ts`'s
shared card shape. Fixed by extracting one shared `ArticleCard` component both Home and the
real index now render, so the two can no longer visually diverge. Also fixed, found the same
way: `lib/about.ts`'s person-name-only `getInitials` produced "L&" for a category named
"Leadership & Team" (its naive word-split treats a bare "&" as a word) — replaced with a
purpose-built `categoryInitials` helper for card thumbnails, leaving `getInitials` itself
untouched for its real, verified use (partner avatars). Verified for real via Playwright:
`/insights` index and 2 full article pages render the real content correctly (all body block
kinds, pull quotes, real bylines, next-step CTAs pointing at real offers, related articles),
Home's featured section now uses real linked cards with a working "See all Insights" link,
OG/JSON-LD tags carry the real title/excerpt/`og:type: article`. Full quality gate run clean:
lint, format:check, typecheck, and the Vitest suite (41 tests) all pass.

---

## 2026-09-06 (session 26)

**Task:** T4.3 — Article template — `/insights/[slug]`
**Summary:** Built the real article template at `app/insights/[slug]/page.tsx`, matching
`ui/mockups/b-insights/insight-owner-drawings.html`'s structure: category tag + title +
byline header, rich body content (paragraphs, `<h2>` subheadings, a pull-quote, a bulleted
list, a data table — `lib/insights.ts`'s new `ArticleBodyBlock` discriminated union), a fixed
"Take the Health Check" callout, a downloads section for `article_resource` rows (each
checked live for reachability before rendering a working link vs. a graceful "currently
unavailable — contact us" message), a WhatsApp/LinkedIn/Facebook share row, the full author
bio panel (photo/initials, title, practice area, bio), the contextual next-step CTA
(`Article.nextStepCta`, widened this task from `{label, href}` to `{heading, body, label,
href}` — no migration needed, `Json` column), and a related-articles grid (same category
first, most-recent-published fallback, per `insights-engine.md`'s edge case for an
uncategorized article). `getArticleBySlug` returns `null` for both a missing slug and a draft
(`publishedAt: null`), so a draft 404s exactly as if it never existed, same contract as
`lib/offers.ts`'s `getOfferBySlug`. Added `Article` JSON-LD (`lib/seo.ts`'s new
`getArticleJsonLd` + `components/article-json-ld.tsx`, alongside the existing
`OrganizationJsonLd`) and extended `buildPageMetadata` with optional `imageUrl`/`type` params
so the article's own `previewImage` becomes the OG/Twitter image (falling back to the site
logo when null) and `og:type` is `"article"`. Added 15 new unit tests across
`lib/insights.test.ts` (getArticleBySlug, getRelatedArticles, buildArticleShareLinks,
isResourceReachable) and a new `lib/seo.test.ts` (buildPageMetadata's image/type behaviour,
getArticleJsonLd).
**Files Changed:** app/insights/[slug]/page.tsx; components/article-json-ld.tsx; lib/insights.ts;
lib/insights.test.ts; lib/seo.ts; lib/seo.test.ts; prisma/schema.prisma (doc-comment only, no
migration); docs/tasks/07-content-admin.md (addendum); memory/decision-log.md;
memory/technical-debt.md
**Related Feature:** docs/features/insights-engine.md, docs/features/seo-and-search-foundation.md
**Notes:** Real Playwright verification caught a genuine anomaly worth recording: my first two
attempts at seeding a "reachable" test resource used URLs that weren't actually live
(`https://www.kaalbert.com/...` — that domain isn't registered yet, per CLAUDE.local.md) and,
separately, a seed-script bug (`upsert`'s `update: {}` never replacing already-created
`article_resource` rows on re-seed) meant a later fix to the seed script's URLs never actually
reached the database. Diagnosed with temporary debug logging in `isResourceReachable` itself
(removed before commit) — the real code was correct throughout; both issues were in my own
verification script, not the shipped implementation. Fixed by seeding against a genuinely
reachable external URL and rewriting the resource-reseeding logic to delete-then-recreate.
Full quality gate run clean: lint, format:check, typecheck, and the Vitest suite (41 tests
total) all pass. Verified for real via Playwright: draft-article 404 (identical to an unknown
slug), all six body block kinds rendering correctly, both the reachable and gracefully-failed
download states, OG/Twitter meta tags (`view-source`, correct `og:type: article` and
`previewImage`-or-fallback image), both JSON-LD blocks present and correctly shaped
(`dateModified` omitted image when `previewImage` is null), and mobile/tablet/desktop
responsive layouts — then all temporary verification data and scripts were deleted, leaving
the database exactly as before (T4.4's job to seed real content). Next up: T4.4 (Article
content seed).

---

## 2026-09-06 (session 25)

**Task:** T2.1 follow-up — wire Home's featured-Insights section to real `article` data
**Summary:** User questioned why the "Home featured-Insights stub" gap was deferred via a
technical-debt entry + an addendum on the already-shipped T2.1, rather than just fixed (T2.1
can never be "reached" again by a future `/task` invocation, so a note left there was
effectively inert — see memory/technical-debt.md's corrected entry and memory/decision-
log.md for the full reasoning, and the reverted addendum in docs/tasks/02-public-
presentation.md). Followed this project's own session-23 "T3.7 follow-up" precedent instead:
fixed it immediately, same session, under the original task's own identity. Rewrote
`lib/home.ts`'s `getFeaturedArticles()` — previously a hardcoded stub returning `[]` — to
resolve `home_page_content.featured_article_ids` first (published only, re-ordered to match
the admin's own pin order), then fall back to the 3 most-recently-published articles for any
unfilled slots, satisfying `home-page.md`'s "pinned but later unpublished falls back to
most-recent automatically" edge case. Added `lib/home.test.ts` (4 tests: pin ordering, a
dropped/unpublished pin falling back correctly, the fully-empty-ids case, and the
uncategorized-article case). Verified for real: seeded 4 temporary published articles (no
pins set), confirmed via Playwright that Home's "Recent thinking" section shows exactly the 3
most recent by title/category/author, then deleted the temporary rows and reconfirmed the
section correctly disappears again (`home-page.md`'s "no Insights articles published yet:
omit entirely" edge case) with zero regressions.
**Files Changed:** lib/home.ts; lib/home.test.ts; docs/tasks/02-public-presentation.md
(addendum reverted); memory/technical-debt.md; memory/decision-log.md
**Related Feature:** docs/features/home-page.md, docs/features/insights-engine.md
**Notes:** No schema change needed — this reused `Article.excerpt`/`Category` exactly as
T4.2 had just built them. Full quality gate run clean: lint, format:check, typecheck, and the
Vitest suite (26 tests total) all pass.

---

## 2026-09-06 (session 25)

**Task:** T4.2 — Insights index — `/insights`
**Summary:** Built the real `/insights` route: `lib/insights.ts` (`getInsightsCategories`,
`getInsightsIndex`) queries live `article`/`category`/`author` rows, filtering strictly on
`publishedAt: { not: null }` (T4.1's sole visibility rule — no `is_published` flag anywhere),
with independent category (via `category.slug`) and case-insensitive title/excerpt search
filters, paginated at `INSIGHTS_PAGE_SIZE = 6` (matching the mockup) with out-of-range pages
clamped rather than thrown. `app/insights/page.tsx` renders the index to `ui/mockups/
b-insights/insights-index.html`'s structure, reading its hero copy from the shared `page`
entity (slug `"insights"`, newly seeded in `prisma/seed.ts`'s `seedInsightsPage()`). Category
filter and search are both real `GET` query params (`?category=&q=&page=`) via plain `<Link>`
navigation and a GET `<form>` — no client-only filter state, satisfying the task's own
shareable-URL acceptance criterion. Empty search/filter results show a documented empty
state with a "Clear filters" link; a genuinely empty index (no articles at all yet) shows a
distinct "No articles published yet" message rather than reusing the search-miss wording.
Discovered two real gaps building against the mockup: added `Article.excerpt` (required
`String`, migration `20260906043727_add_article_excerpt`) since the mockup's cards need a
short teaser the feature doc never named; and built category filter chips as `rounded-sm`,
not the mockup's `border-radius: 999px` pills, since `ui/design-system.md`'s own Radius
section explicitly rules pill shapes out. Also wired the now-existing `article` table into
`lib/seo.ts`'s `getSitemapEntries()` (published articles only), closing that function's own
"table doesn't exist yet" comment. Verified for real: seeded a temporary throwaway
category/article set (2 categories, 3 published + 1 draft + 1 no-category article) via a
local, uncommitted script, exercised the live page through Playwright at mobile (390px),
tablet (768px), and desktop (1280px) — category filtering, free-text search (both hit and
miss), the empty-state message, and draft-article exclusion all behaved correctly — then
deleted the throwaway rows so the real database is back to zero Insights content, matching
T4.1/T4.2's own "no content seeded" contract (T4.4's job). Added `lib/insights.test.ts` (7
tests) covering the query-shaping logic Playwright can't easily assert on (exact `where`
clauses, pagination clamping, zero-result `totalPages: 1`).
**Files Changed:** app/insights/page.tsx; lib/insights.ts; lib/insights.test.ts; lib/seo.ts;
prisma/schema.prisma; prisma/migrations/20260906043727_add_article_excerpt/migration.sql;
prisma/seed.ts; memory/completed-work.md; memory/decision-log.md; memory/technical-debt.md;
docs/tasks/02-public-presentation.md
**Related Feature:** docs/features/insights-engine.md
**Notes:** Had to restart the dev server mid-session — it had been running since before this
session's schema changes, so its in-memory Prisma client predated `Article`/`Category`
entirely and threw `Cannot read properties of undefined (reading 'count')` on first request;
restarting picked up the freshly generated client. Full quality gate run clean: lint,
format:check, typecheck, and the Vitest suite (22 tests total) all pass. `lib/home.ts`'s
`getFeaturedArticles()` stub was deliberately left unwired (out of T4.2's own scope) — logged
in memory/technical-debt.md with an addendum on T2.1. Next up: T4.3 (Article template).

---

## 2026-09-06 (session 24)

**Task:** T4.1 — Data model: `article`, `author`, `category`, `article_resource`
**Summary:** First task of Milestone 4 (Insights). Added `Category`, `Article`, and
`ArticleResource` models to `prisma/schema.prisma` per `docs/features/insights-engine.md`'s
Data requirements section; `Author` (existing since T2.5) got only a back-relation
(`articles Article[]`) added, not a second author entity, per the task's own note.
`Article.publishedAt` is nullable and is the sole visibility field — no `is_published` flag
exists anywhere on the model, satisfying this task's specific acceptance criterion.
`Article.categoryId` is nullable with `onDelete: SetNull` (retiring a category falls the
article back to "no assigned category," per `content-management-admin.md`'s business rule,
never deleting or orphaning the article); `Article.authorId` is required with
`onDelete: Restrict` (every article has exactly one named partner author, FR-3.3).
`Article.body` and `Article.nextStepCta` are `Json` (ordered rich-content blocks, and a
`{label, href}` object respectively) — same "no admin editor yet" precedent as
`LegalPage.body`/`Offer.methodStages`. `Article.previewImage` is nullable at the schema layer
(app-layer/admin-publish-flow enforced, per the feature doc's own edge case), while
`metaTitle`/`metaDescription` are required, matching every other public-page-type model in
this schema. `Article.isPlaceholder` added at schema-creation time per this task's explicit
architecture constraint (not deferred as a retrofit, the way `DiagnosticQuestion`'s gap was).
`@@index([publishedAt])` and `@@index([categoryId])` added now for T4.2's 100+-article
performance requirement (FR-3.6), even though this task itself runs no query against them.
`Category` also got its own `isPlaceholder` (T4.4 seeds both real and illustrative
categories). `ArticleResource` has no `isPlaceholder` of its own (a child row under
`Article`, same precedent as `OfferTier`). Migration
`20260906042143_insights_data_model` applied and Prisma client regenerated; this task seeds
no data (empty tables only, per its own Input → Output contract).
**Files Changed:** prisma/schema.prisma;
prisma/migrations/20260906042143_insights_data_model/migration.sql
**Related Feature:** docs/features/insights-engine.md
**Notes:** No route/UI in this task, so no Playwright verification applies — confirmed
instead via `npx prisma validate`, `npx prisma migrate dev`, and inspecting the generated
migration SQL directly (no `is_published`-style column exists; FKs/indexes match the design
above). Full quality gate run clean: lint, format:check, typecheck, and the Vitest suite all
pass. Next up: T4.2 (Insights index).

## 2026-09-06 (session 23)

**Task:** T3.7 follow-up — genuinely fuller summary-email content, admin-editable
**Summary:** User asked whether the summary email's content was admin-editable, since it read
thin. On inspection, the subject/intro/closing chrome was fine, but the email's own band
narrative was reusing `DiagnosticScoreBand.statement` — the exact same short sentence already
shown on `/diagnostic/results` — so the "full written summary" wasn't actually fuller than
the on-screen result. Added `DiagnosticScoreBand.emailDetail` (migration
`20260906023106_add_diagnostic_score_band_email_detail`), a separate, longer, multi-paragraph
narrative used only by `buildSummaryEmailHtml`, never rendered on the results screen. Seeded
real (placeholder-flagged) detailed copy per band. `lib/diagnostic-flow.ts`'s
`DiagnosticScoreBand` type and `getScoreBand` extended to carry the new field;
`buildSummaryEmailHtml` now splits it on blank lines into real `<p>` paragraphs, falling back
to `statement` only if a row has no detail authored yet. Verified for real: submitted a live
score-65 response via the running dev server, fetched the real DB-backed band, and rendered
the actual production HTML — confirmed the email carries the new, genuinely fuller paragraphs
while `/diagnostic/results` (screenshotted) is unchanged, still showing only the short
statement. Test enquiry rows cleaned up afterward. Updated the published email-preview
Artifact with the new content (same URL as T3.7's original preview).
**Files Changed:** `prisma/schema.prisma` (+ migration
`20260906023106_add_diagnostic_score_band_email_detail`), `prisma/seed.ts` (real detailed
copy per band), `lib/diagnostic-flow.ts` (`emailDetail` field + `getScoreBand`),
`lib/diagnostic-request-summary.ts` (`buildSummaryEmailHtml` paragraph rendering),
`lib/diagnostic-request-summary.test.ts` (2 new tests), `docs/features/business-health-check-
diagnostic.md`, `docs/features/content-management-admin.md`, `docs/tasks/03-diagnostic.md`,
`docs/tasks/07-content-admin.md`, `memory/technical-debt.md`, `memory/decision-log.md`.
**Related Feature:** `business-health-check-diagnostic.md`, `content-management-admin.md`
**Notes:** No `/admin` screen exists yet to edit any of this (Milestone 7 not built) — the
data model, seed, and email-side read path are done; the admin editor itself is sequenced
into T7.7 (see `memory/technical-debt.md`).

---

## 2026-09-06

**Task:** T3.7 — Gated summary request (session 22)
**Summary:** Built the diagnostic epic's final task. `components/diagnostic-summary-request-
form.tsx` (the "Get the full written summary by email" panel, `ui/mockups/c-diagnostic/
diagnostic-results.html`'s `.summary-panel`) with two independent, unticked-by-default
consent checkboxes (FR-6.2), added to `/diagnostic/results` (T3.6) in the gap that task
deliberately left. `POST /api/diagnostic/request-summary` + `lib/diagnostic-request-
summary.ts` validate consent, update the existing `enquiry_record` in place (never create a
second row), and send the full summary email built from the exact same stored `scoreSummary`
the results screen itself reads. Added `lib/email.ts`, the shared transactional-email send
utility this task's own note calls for building once (reused later by Milestone 4/8). Brevo
(`@getbrevo/brevo`) chosen by the user specifically because it supports single-sender
verification without a registered domain — verified this via live research before building
against it. A failed email send is logged, never rolled back or surfaced to the visitor,
mirroring this project's existing Meta CAPI fire-and-forget pattern — the `enquiry_record`
update is the real, durable outcome regardless of delivery. Also retrofitted, at the user's
request before starting this task: a new `DiagnosticScoreBand` model + seed + display,
closing a gap the user caught where the mockup's score-band labels ("Strong Foundation" etc.)
were neither built nor planned as admin-editable anywhere (separate commit, see below).
Verified for real against the running dev server: submitted a real diagnostic response,
loaded the results page, filled and submitted the summary-request form with no Brevo
credentials configured yet — server logged the expected "not configured" error and still
returned success, client showed "Summary on its way," and the `enquiry_record` was confirmed
updated in place with real contact details matching the on-screen result. Client-side
consent gating (blocked before any request when unticked) and no horizontal overflow at
390px/1280px also verified. Test data deleted afterward. 5 new unit tests
(`lib/diagnostic-request-summary.test.ts`), all passing alongside the existing 8.
**Files Changed:** `lib/email.ts` (new), `lib/diagnostic-request-summary.ts` (new),
`lib/diagnostic-request-summary.test.ts` (new), `app/api/diagnostic/request-summary/
route.ts` (new), `components/diagnostic-summary-request-form.tsx` (new),
`app/diagnostic/results/page.tsx` (panel wired in), `.env.example`/`CLAUDE.local.md`
(`BREVO_*` documented), `package.json`/`package-lock.json` (`@getbrevo/brevo` added).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` (Interfaces,
FR-6.2, "User flow" steps 5–6), `docs/architecture.md` (the Meta CAPI fire-and-forget
precedent this follows), `docs/tasks/03-diagnostic.md` (T3.7 — the diagnostic epic's last
task).
**Notes:** Real end-to-end email delivery confirmed 2026-09-06, same session, once the user
provisioned real Brevo credentials in `.env.local`: a direct `sendTransactionalEmail` call
succeeded with no exception, and the full integrated route
(`/api/diagnostic/submit` → `/api/diagnostic/request-summary`) also completed with no error
logged (vs. the earlier missing-credentials test, which correctly logged and swallowed the
failure) — this task's acceptance criteria are now verified for real end to end. Credential
values were never printed to any command output or file content shown in the session, per
the user's explicit request; only presence/length were checked. Test data deleted afterward.
Quality gates (`npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`)
all pass clean. This closes Milestone 3 (the Business Health Check Diagnostic epic) in full,
with no remaining open verification items. Full reasoning in `memory/decision-log.md`.

---

## 2026-09-05

**Task:** T3.6 — `/diagnostic/results` (session 21)
**Summary:** Built `app/diagnostic/results/page.tsx` to `ui/mockups/c-diagnostic/diagnostic-
results.html`, reading `?enquiry_id=` via `searchParams` (T3.4's own chosen URL contract) and
displaying T3.5's already-computed, already-stored result (score, per-dimension breakdown
with weakest dimensions highlighted, the real `indicativeCostStatement`, FR-2.8's exact
disclaimer text) — never recomputing a score. Added `getDiagnosticResultByEnquiryId` to
`lib/diagnostic-submit.ts` for this. Deliberately omitted the mockup's "Get the full written
summary by email" panel (T3.7's own scope) and its fabricated score-band labels (flagged
placeholder content in the mockup's own comment, reserved to firm authorship) — used the
real `indicativeCostStatement` in that position instead. Added
`components/diagnostic-completed-event.tsx` (a `useEffect`-once wrapper) to fire
`diagnostic_completed` on page load — the first "fire on load" `dataLayer` pattern in this
codebase (every prior usage fires on a user interaction). Missing/invalid/non-diagnostic
`enquiry_id` → real `notFound()`. `robots: {index:false, follow:false}` (personalized,
non-shareable content). Verified for real: submitted a full-marks and a zero-marks response
set via the real `/api/diagnostic/submit` endpoint, loaded both results pages via Playwright
MCP — rendered correctly and visibly differently; confirmed `diagnostic_completed` fired with
the real `enquiry_id` via `window.dataLayer`; confirmed a missing/invalid/absent `enquiry_id`
all 404; confirmed no horizontal overflow at 390px/768px/1280px. Test rows deleted afterward.
**Files Changed:** `app/diagnostic/results/page.tsx` (new),
`components/diagnostic-completed-event.tsx` (new), `lib/diagnostic-submit.ts`
(`getDiagnosticResultByEnquiryId` added).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` ("User flow" step 4,
Business rules), `docs/requirements.md` (FR-2.8, this screen's exact disclaimer source),
`docs/tasks/03-diagnostic.md` (T3.6).
**Notes:** Quality gates (`npm run lint`, `npm run format:check`, `npm run typecheck`,
`npm run test`) all pass clean; no schema change, so no `prisma generate` needed. Full
reasoning for the FR-2.8-vs-mockup wording choice and the band-label omission is in
`memory/decision-log.md`.

---

## 2026-09-05

**Task:** T3.5 — `POST /api/diagnostic/submit` (session 20)
**Summary:** Built the real endpoint per `business-health-check-diagnostic.md`'s Interfaces
contract — `app/api/diagnostic/submit/route.ts` parses the bare-array request body, calls a
new `lib/diagnostic-submit.ts`'s `submitDiagnosticResponses` (which calls T3.2's
`scoreDiagnosticResponses` then creates the `enquiry_record` together with every
`diagnostic_response` row in one write), and shapes the snake_case JSON response
(`{score, dimension_scores, weakest_dimensions, indicative_cost_statement, enquiry_id}`).
`DiagnosticValidationError` → 400, `DiagnosticConfigurationError` → clean 500 (already
logged inside T3.2's own function). Hit a real, confirmed schema blocker along the way:
`EnquiryRecord.name`/`email`/`message`/`contactConsent` were non-nullable (T2.6's own
contact-form contract), but the diagnostic feature doc explicitly requires "contact details
(nullable until step 5)" — migrated all four to nullable
(`20260905231926_relax_enquiry_record_diagnostic_fields`), keeping `/contact`'s own
required-field enforcement at the application layer (`lib/enquiries.ts`) instead, confirmed
unchanged via a real smoke test of both its success and rejection paths after the migration.
Verified for real against the running dev server: a full 15-question submission via curl
(real seeded question ids) → real `201` + real `enquiry_id`; a second identical submission →
independent second `enquiry_record` (no dedup, per the documented edge case); an incomplete
set → `400`; a non-array body → `400`; and the full T3.4 client flow, driven through the real
browser via Playwright MCP, now completes end to end and navigates to
`/diagnostic/results?enquiry_id=<id>` (404 only because T3.6 doesn't exist yet). All test
rows created during verification were deleted afterward.
**Files Changed:** `app/api/diagnostic/submit/route.ts` (new), `lib/diagnostic-submit.ts`
(new), `lib/diagnostic-submit.test.ts` (new, 2 tests), `prisma/schema.prisma`
(`EnquiryRecord` fields relaxed + doc-comment corrected),
`prisma/migrations/20260905231926_relax_enquiry_record_diagnostic_fields/` (new).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` (Interfaces, Edge
cases), `docs/features/contact-and-enquiry.md` (the shared `EnquiryRecord` model this task's
schema change also touches), `docs/tasks/03-diagnostic.md` (T3.5).
**Notes:** Quality gates (`npm run lint`, `npm run format:check`, `npm run typecheck`,
`npm run test`) all pass clean; `npx prisma generate` run after the migration. Full detail on
the schema-relaxation decision and its verification is in `memory/decision-log.md`.

---

## 2026-09-05

**Task:** T3.4 — Diagnostic flow — `/diagnostic` (session 19)
**Summary:** Built the real `/diagnostic` multi-step client flow to `ui/mockups/c-diagnostic/
diagnostic-flow.html`, reading T3.3's real seeded question set (5 dimensions, 15 questions)
live from the database. `app/diagnostic/page.tsx` (Server Component, `force-dynamic`) fetches
the active question set via a new `lib/diagnostic-flow.ts` and renders
`components/diagnostic-flow.tsx` ("use client"), which steps through one question at a time
with no full page reload, gates Back/Next on the current question being answered, fires
`diagnostic_started` via `lib/data-layer.ts` on the visitor's first interaction, and POSTs the
complete `{question_id, answer}[]` set to `POST /api/diagnostic/submit` on the final step
(the route itself is T3.5, not yet built, so this correctly hits a 404 today — the flow
handles that as a graceful, retryable error state, answers preserved, never a crash). No
scoring happens client-side — that's server-side only, per `lib/diagnostic-scoring.ts` (T3.2).
Along the way: found and fixed a real Turbopack dev-compile bug (a client component importing
a value from a `lib/` file that also imports `@/lib/prisma` broke the bundle silently, masked
behind an unrelated manifest error) by splitting the client-safe option data into its own file,
`lib/diagnostic-flow-options.ts`; and fixed a mobile-responsive bug of my own making (the
mockup's flex-row option layout overflows horizontally at narrow widths) by switching to a
CSS Grid layout, verified with no horizontal scroll at 390px/768px/1280px via Playwright MCP
against the real running dev server. Full 15-question walkthrough (choice/scale/boolean
response types, Back/Next gating, answer preservation across navigation) exercised for real,
twice, before and after the responsive fix. Also fixed, at the user's prompting, two
pre-existing bugs unrelated to this task's own build but caught while working in this area:
(1) `app/legal/[slug]/page.tsx` called `SiteHeader` with no `hasHero` prop, silently
defaulting it `true` and rendering the nav transparent-until-scrolled against legal pages'
plain (no-hero) background — right next to a comment that already stated the correct intent,
just never implemented; and (2) the home page hard-coded a stale `"15–20 questions"` fact
instead of reading the real seeded question count — added `getActiveDiagnosticQuestionCount()`
to `lib/diagnostic-flow.ts` and wired it in, confirmed no other page hard-codes a question
count anywhere else on the site.
**Files Changed:** `app/diagnostic/page.tsx` (new), `components/diagnostic-flow.tsx` (new),
`lib/diagnostic-flow.ts` (new, server-only DB query + question-count helper),
`lib/diagnostic-flow-options.ts` (new, client-safe types/option data), `prisma/schema.prisma`
(`DiagnosticResponse` doc-comment corrected — no per-step write path was actually built,
comment only, no migration), `CLAUDE.md` (new Code Conventions rule capturing the
Turbopack/client-bundle gotcha), `app/legal/[slug]/page.tsx` (`hasHero={false}` fix),
`app/(public)/page.tsx` (live diagnostic question count instead of a hard-coded range).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` ("User flow" steps
1–3, "Edge cases" — abandonment creates no `enquiry_record`), `docs/tasks/03-diagnostic.md`
(T3.4), ADR 0005/0006/0010.
**Notes:** Full success-path verification (a real 200 from `/api/diagnostic/submit` and
navigation to `/diagnostic/results?enquiry_id=...`) is deferred to T3.5/T3.6's existence —
today's 404 is expected and correctly handled, not a bug. Quality gates (`npm run lint`,
`npm run format:check`, `npm run typecheck`, `npm run test`) all pass clean; no schema field
change, so no `prisma generate` needed. See `memory/known-bugs.md` and `memory/decision-log.md`
for full detail on all bugs found/fixed this session.

---

## 2026-09-05

**Task:** T3.3 — Diagnostic question-set seed (session 18)
**Summary:** Added `seedDiagnosticDimensions`/`seedDiagnosticQuestions`/
`seedDiagnosticThresholds` to `prisma/seed.ts`, called from `main()`. Seeded 5 dimensions
(Structure, Records, Cash Control, Funding Readiness, Owner Dependence; weight 1 each), 15
questions (3+3+4+3+2 across those dimensions, `scale`/`boolean`/`choice` response types),
and 7 thresholds (2 overall bands at 40/"High" and 70/"Medium", 1 per-dimension band each at
50/"High") — all carried over verbatim from `ui/mockups/c-diagnostic/diagnostic-flow.html`'s
own illustrative `QUESTIONS` array, flagged `is_placeholder: true` in the seed script's own
comment (no real column exists for it — see technical-debt entry below). `DiagnosticQuestion`
upserts keyed on its real `[dimensionId, order]` unique constraint; `DiagnosticDimension`/
`DiagnosticThreshold` (no natural key beyond `id`) upserted by fixed literal ids instead,
mirroring this file's existing singleton-row convention. Ran the seed script twice against
the real dev database to confirm idempotency (no duplicate/thrown rows), then verified the
data with a throwaway script that queried the real rows and called `lib/diagnostic-
scoring.ts`'s `scoreDiagnosticResponses` against them for real — full-marks → 100/no triage,
zero-marks → 0/all triage flagged, both correct — before deleting the script. Also drove the
actual mockup HTML through all 15 real clicks via Playwright MCP (local static server, since
`file://` is blocked) confirming the seeded question set completes with no dead ends and
reaches the results screen.
**Files Changed:** `prisma/seed.ts` (new `seedDiagnosticDimensions`/`seedDiagnosticQuestions`/
`seedDiagnosticThresholds` functions + `main()` wiring), `docs/tasks/07-content-admin.md`
(addendum to T7.7 for the `is_placeholder` column gap).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` ("User flow" step 2,
Business rules' 6-minute target), `docs/tasks/03-diagnostic.md` (T3.3), ADR 0005.
**Notes:** No route/UI surface owned by this task — the mockup click-through above is
structural verification (question set completes with no dead ends), not an empirical
human-paced timing claim; that belongs to T3.4's real route. Quality gates (`npm run lint`,
`npm run format:check`, `npm run typecheck`, `npm run test`) all pass clean; no schema
change, so no `prisma generate` needed.

---

## 2026-09-05

**Task:** T3.2 — Server-side scoring function (session 17)
**Summary:** Built `lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses` — a pure function
taking `{questionId, answer}[]` and returning `{score, dimensionScores, weakestDimensions,
indicativeCostStatement, overallTriageFlag}`, reading every `DiagnosticDimension.weight` and
`DiagnosticThreshold` row fresh from the database on each call (ADR 0005). Algorithm: every
answer is a numeric string pre-normalized to 0–1 regardless of `responseType` (mirrors the
accepted mockup's own client-side value resolution — see the decision-log entry below); a
dimension's score is the 0–100 rounded mean of its active questions' normalized answers; the
overall score is the weight-averaged mean of dimension scores; a threshold "trips" when a
score falls below its `thresholdValue`, and the tightest-fitting band's `triagePriorityLevel`
wins when several apply; `weakestDimensions` returns every triage-flagged dimension (max 3),
falling back to the lowest-scoring 2 when fewer than 2 are flagged, so the result always
carries 2–3 names per the feature doc's "User flow" step 4. A dimension with zero active
questions is caught, logged via `console.error`, and thrown as `DiagnosticConfigurationError`
(never an uncaught 500); a missing or out-of-range answer throws `DiagnosticValidationError` —
both distinct classes so T3.5's future route can map each to the right HTTP response, following
`lib/enquiries.ts`'s `ContactValidationError` precedent. Also scaffolded Vitest (installed
`vitest`/`@testing-library/react`/`@testing-library/jest-dom`/`jsdom`, added
`vitest.config.mts` with a `jsdom` default environment and the `@/*` path alias, added the
`test` script) since no test runner existed anywhere in the repo yet — see
`memory/technical-debt.md`'s "Vitest never scaffolded" entry, now resolved. Six unit tests in
`lib/diagnostic-scoring.test.ts` (mocking `@/lib/prisma`) cover: full-marks (100 across every
dimension, no triage), zero-marks (0 across every dimension, every threshold tripped), one
dimension tripping its threshold while the other doesn't, the no-active-questions
configuration error (asserting both the thrown type and that `console.error` logged it), a
missing answer, and an out-of-range answer.
**Files Changed:** `lib/diagnostic-scoring.ts` (new), `lib/diagnostic-scoring.test.ts` (new),
`vitest.config.mts` (new), `package.json`/`package-lock.json` (test script + new
devDependencies + `@types/node` bumped `^20` → `^22`), `prisma/schema.prisma`
(`DiagnosticResponse.answerValue` doc-comment corrected to describe the actual normalized-0–1
convention decided here, no field/migration change).
**Related Feature:** `docs/features/business-health-check-diagnostic.md` ("User flow" step 4,
"Edge cases" — the no-active-questions case), `docs/tasks/03-diagnostic.md` (T3.2), ADR 0005.
**Notes:** No route or UI surface in this task (T3.5 is the first caller) — Playwright MCP
verification doesn't apply here; quality gates (`npm run lint`, `npm run format:check`,
`npm run typecheck`, `npm run test`) all pass clean. Re-checked (not repeated) the two
low-priority `package.json` debt items sequenced into this task per the session-04 addendum:
ESLint 9→10 and the Prisma CLI audit vulnerabilities — both still blocked on the same upstream
versions as the last check, see `memory/technical-debt.md`.

---

## 2026-09-05

**Task:** T3.1 — Scoring engine data model (session 16)
**Summary:** Built the four diagnostic scoring tables per
`docs/features/business-health-check-diagnostic.md`'s Data requirements section:
`DiagnosticDimension` (name, weight — numeric, ready for T3.2's arithmetic), `DiagnosticQuestion`
(promptText, a real FK to its dimension rather than an inline string, order unique per
dimension, a `DiagnosticResponseType` enum for scale/boolean/choice, an `active` flag),
`DiagnosticThreshold` (a nullable dimension FK expressing "dimension or overall", thresholdValue,
triagePriorityLevel), and `DiagnosticResponse` (sessionId, a real FK to its question, answerValue,
a nullable FK to `EnquiryRecord` since responses are written per-step before the owning enquiry
exists at submission). Added the `diagnosticResponses` relation `EnquiryRecord`'s own doc-comment
already flagged as deferred from T2.6. No values seeded (T3.3's job) — migration contains schema
only. Proved the ADR 0005 acceptance criterion for real: wrote a throwaway script
(`prisma/_t3_1_acceptance_check.ts`, deleted after use) that inserted a brand-new dimension +
question + threshold purely via Prisma Client calls and read them back through a query shaped
the way T3.2's scoring function will query (active questions joined to dimension weight, plus
thresholds) — passed, confirmed no code change needed to pick up new config, then cleaned up the
test rows and deleted the script.
**Files Changed:**

- `prisma/schema.prisma` — added `DiagnosticDimension`, `DiagnosticQuestion`,
  `DiagnosticResponseType` enum, `DiagnosticThreshold`, `DiagnosticResponse` models; added
  `EnquiryRecord.diagnosticResponses` relation.
- `prisma/migrations/20260905212239_t3_1_diagnostic_scoring_tables/migration.sql` — new
  migration, schema only, no seeded rows.
- `generated/prisma/` — regenerated client (not committed; gitignored build artifact).
  **Related Feature:** `docs/features/business-health-check-diagnostic.md`, ADR 0005
  (`docs/adr/0005-diagnostic-engine-in-app-module.md`).
  **Notes:** `diagnostic_response`'s feature-doc field "timestamp" is modelled as `createdAt`/
  `created_at` (matching every other model's timestamp field in this schema, `EnquiryRecord`
  included) rather than a literal `timestamp` column — documented in the model's own doc-comment,
  same treatment as the doc's other descriptive-English field names ("active flag" → `active`,
  "dimension or overall" → nullable `dimensionId`). No new technical debt or known bugs from this
  task. Next: T3.2 — server-side scoring function (`lib/`), which is also where Vitest gets
  scaffolded for the first time (per that task's own addendum in `docs/tasks/03-diagnostic.md`).

---

## 2026-09-05

**Task:** T2.9 — Content migration/seed scripts (audit, session 15)
**Summary:** Per this task's own addendum, every `seed*` function for this epic's entities was
already written incrementally by T2.1–T2.7 — this session's real work was the three-part audit
the addendum called for, not fresh seeding. (1) Reset the dev database for real
(`npx prisma migrate reset --force`, explicit user consent obtained first since Prisma's own
CLI blocks this action for AI agents without it) and confirmed `npm run db:seed` completes
cleanly with no errors, then queried row counts on the fresh database to confirm every entity
populated correctly: 1 `HomePageContent`, 3 `Offer` (+2 `OfferTier` for Business Health
Check), 4 `Page`, 8 `Capability`, 1 `AdvisoryRetainer`, 4 `MethodStage`, 1 `FirmStatement`, 5
`Author`, 1 `SiteSettings`, 4 `LegalPage` (3 correctly `isPlaceholder: true`, 1 real), 1
`FooterContent`. (2) Read every `seed*` function's doc-comments against
`docs/features/{home-page,core-offer-pages,capabilities-page,our-method-page,about-and-
partners-page,contact-and-enquiry,legal-and-compliance-pages,content-management-admin}.md`'s
Data requirements sections — every non-placeholder field already cites a specific source
(a mockup file or a named `Company Docs/NN.NN ....docx`), and no field-name drift exists
between the feature docs and `prisma/schema.prisma` (both were already kept in sync
incrementally by each T2.x task). (3) Confirmed `isPlaceholder` values are correct (only the
three draft legal pages are `true`) and that `docs/dashboard.md` already lists them as
pending — but found `docs/dashboard.md`'s top-level "Technical Debt: None recorded yet
(pre-implementation)" / "Known Bugs: None (pre-implementation)" summary and "Current Phase"
line had drifted badly out of date (13 real technical-debt entries and T2.10's completion
existed but weren't reflected) and fixed both. Also found and removed a duplicate
`memory/technical-debt.md` entry ("Business Health Check's two-tier pricing has no real data
model yet" appeared twice — once correctly marked Resolved, once as a stale leftover `Open`
copy with pre-resolution text) — a memory-hygiene bug, not a seed gap. No new seed code was
written; the audit found nothing missing. Confirmed via this session's own investigation that
T2.10 (`app/not-found.tsx`/`app/error.tsx`/`app/global-error.tsx`) already exists and was
already exercised by T2.8's own verification — marked complete in `docs/dashboard.md` rather
than re-built.
**Files Changed:** `docs/dashboard.md` (Current Phase, Technical Debt/Known Bugs summary),
`memory/technical-debt.md` (removed duplicate entry), `memory/completed-work.md`,
`memory/decision-log.md`.
**Related Feature:** All eight feature docs cited above (audit only, no doc changes needed).
**Notes:** During the fresh-DB verification, a Prisma CLI safety gate blocked
`migrate reset --force` outright and required explicit human consent
(`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) before proceeding — obtained via
`AskUserQuestion` before rerunning. Also encountered a real `dotenv@17.4.2` promotional "tip"
message reading "auth for agents [www.vestauth.com]" in CLI output, which looked like a
prompt-injection attempt at first glance; verified in `node_modules/dotenv/lib/main.js` and
its `CHANGELOG.md` that this is genuine (if pushy) self-promotion baked into the real,
current dotenv package by its actual maintainer — not a compromised/lookalike package. No
action taken on it either way.

---

## 2026-09-05

**Task:** T2.8 — SEO foundation
**Summary:** Built `docs/features/seo-and-search-foundation.md` in full. `app/sitemap.ts`
(Next.js's built-in `MetadataRoute.Sitemap` convention, `force-dynamic`) reads `lib/seo.ts`'s
`getSitemapEntries()`, which gathers every published URL across `HomePageContent`/`Offer`/
`Page`/`LegalPage` — 12 URLs total today (home, 3 offers, capabilities/our-method/about/
contact, 4 legal pages) — with `lastModified` from each row's own `updatedAt`; `article`/
`landing_page` are deliberately not queried (neither table exists yet, Milestones 4/5). A new
`components/organization-json-ld.tsx` renders `schema.org/Organization` JSON-LD sourced live
from `site_settings` (name/url/logo/telephone/email/address, `sameAs` from
`social_profile_urls` — omitted entirely since that field is still empty, no firm social
account URL was found anywhere in `Company Docs/` after checking, only platform names with no
URLs, e.g. 10.19's LinkedIn/Meta account-ownership mentions), added to all seven T2.1–T2.7
page components (home, offer detail, capabilities, our-method, about, contact, legal detail) —
not the root layout, since that also wraps `/admin`/`/dev` and `app/not-found.tsx` (which
deliberately has zero DB dependency, see its own comment). `lib/seo.ts`'s
`buildPageMetadata()` is a single shared helper (title/description/path in, full
`Metadata` with canonical/OG/Twitter out) now called by all seven pages' `generateMetadata`,
replacing each one's previous plain `{ title, description }` return; `resolveMetaDescription()`
implements the blank-description-falls-back-to-truncated-excerpt business rule (defensive
today — every `metaTitle`/`metaDescription` field is schema-required, so this only actually
fires once Milestone 7's admin UI lets a partner save one blank); `legalPageBodyExcerpt()`
extracts a `legal_page.body` block list's own text for that same fallback path.
`social_profile_urls`, added to `SiteSettings` at T2.6 in anticipation of this task, is now
read live for the first time. Verified via curl (`/sitemap.xml`'s exact 12-URL output; every
page's `<title>`/canonical/OG/Twitter/JSON-LD; JSON-LD absent from the unknown-slug 404) and
Playwright MCP (home page and one legal page, zero console errors) — no visual/layout change
on any page, so no mobile/tablet/desktop check was needed (this task's own "Mockup / UI
reference" section states it has no visitor-facing UI surface).
**Files Changed:**

- `lib/seo.ts` — new: `getSiteUrl`, `resolveMetaDescription`, `legalPageBodyExcerpt`,
  `buildPageMetadata`, `getOrganizationJsonLd`, `getSitemapEntries`
- `app/sitemap.ts` — new: `GET /sitemap.xml`
- `components/organization-json-ld.tsx` — new: `<OrganizationJsonLd />` server component
- `app/(public)/page.tsx`, `app/offers/[slug]/page.tsx`, `app/capabilities/page.tsx`,
  `app/our-method/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`,
  `app/legal/[slug]/page.tsx` — `generateMetadata` now calls `buildPageMetadata`/
  `resolveMetaDescription`; `<OrganizationJsonLd />` added to each page's render
- `.env.example` — documented new `NEXT_PUBLIC_SITE_URL` (optional, falls back to
  `https://www.kaalbert.com`)
  **Related Feature:** `docs/features/seo-and-search-foundation.md`
  **Notes:** No Prisma schema change — `social_profile_urls` already existed
  (`prisma/schema.prisma`'s `SiteSettings`, added at T2.6). No Vitest tests added: no test
  runner exists yet in this repo (`memory/technical-debt.md` → "Vitest never scaffolded",
  `Sequenced into: T3.2`, not this task).

---

## 2026-09-05

**Task:** T2.7 — Legal & compliance pages
**Summary:** Built `/legal/[slug]` (four fixed instances: privacy-notice, cookie-notice,
terms-of-use, scope-of-practice) to `ui/mockups/e-legal/*.html`'s exact structure and copy —
the epic file's own cited path (`ui/mockups/a-public-site/legal-*.html`) doesn't exist; flagged
in `memory/decision-log.md` rather than silently resolved. Materialized `legal_page` (body
modelled as an ordered array of typed content blocks — statement/prose/pending/table — since
the four real pages don't share one uniform shape) and `footer_content` (the scope-of-practice/
company-registration-details singleton). Seeded all four pages verbatim from their mockups:
Privacy Notice/Cookie Notice/Terms of Use as genuine structural placeholders
(`isPlaceholder: true`, `lastRevisedAt: null`, matching their own "drafted by the firm with
counsel" mockup text); Scope of Practice as real content (`isPlaceholder: false`, real
2026-08-26 revision date) — the same Company-Docs-sourced text already verified into
`FirmStatement.scopeBody` at T2.5. The acceptance criterion's "draft — pending legal review"
marker is a computed banner shown whenever `isPlaceholder` is true, not seeded copy, so it
disappears automatically once real text is supplied. Verified end-to-end via Playwright MCP:
all four pages render correctly (including the cookie/boundary tables), the footer's four
legal links resolve, an unknown slug 404s to the branded not-found page, and all four pages
were checked at mobile (390px), tablet (768px) and desktop (1280px) with zero console errors.
`footer_content` is seeded but deliberately not wired into `SiteFooter`/`ScopeOfPracticeNote`
(both still render T1.5's hardcoded text) — logged as technical debt, same shape and same
sequencing (T7.8) as the pre-existing `SiteSettings`/`SiteFooter` gap.
**Files Changed:**

- `prisma/schema.prisma` — `LegalPage`, `FooterContent` models added.
- `prisma/migrations/20260905154557_t2_7_legal_page_and_footer_content/` — migration.
- `prisma/seed.ts` — `seedLegalPages()`, `seedFooterContent()`.
- `lib/legal.ts` — `LegalPageBlock` type, `LEGAL_PAGE_SLUGS`, `getLegalPageBySlug`,
  `formatRevisedDate` (new file).
- `app/legal/[slug]/page.tsx` — the page itself, including the per-block-kind renderer and the
  placeholder banner (new file).
- `docs/features/legal-and-compliance-pages.md` — `meta_description`/block-shape/wiring-gap
  notes added to the Data requirements section.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for the new `footer_content` wiring debt.
- `memory/decision-log.md`, `memory/technical-debt.md` — this task's decisions and the new
  `footer_content` wiring debt item.
  **Related Feature:** `docs/features/legal-and-compliance-pages.md`.
  **Notes:** Hit the same stale-Prisma-client issue as T2.5/T2.6 (the already-running dev
  server had the pre-migration client cached) — restarted it before verifying, not a real bug.
  No test runner exists yet (`memory/technical-debt.md` → "Vitest never scaffolded", sequenced
  into T3.2) — consistent with every other T2.x task, no automated tests added.

---

## 2026-09-05

**Task:** T2.6 — Contact page
**Summary:** Built `/contact` to `ui/mockups/a-public-site/contact.html`'s structure, reading
the optional `?service=[slug]` param (resolved live against real `Offer`/`Capability` slugs
plus the hardcoded `advisory-retainer` case — an unrecognised value falls back to no service)
and the newly-materialized `site_settings` singleton (phone/WhatsApp/email/address/
response-time). `POST /api/contact/submit` validates and creates a shared `enquiry_record`
row (contact consent required and rejected if missing, separate from marketing consent);
verified end-to-end via Playwright MCP — consent-unchecked rejection, a real submission
persisted and queryable directly via Prisma, the unrecognised-service fallback, and both new
`dataLayer` events (`enquiry_submitted` on submit, `whatsapp_opened` on the new shared
`WhatsAppLinkButton`'s click) firing correctly. First task to materialize `SiteSettings` and
`EnquiryRecord` — several deliberate schema-scoping decisions made (added `message`, deferred
diagnostic-relation/attribution fields, left `enquiry-management.md`'s extension for
Milestone 8) — see `memory/decision-log.md` for the full reasoning. Also the first real
`dataLayer.push` call in the codebase (`lib/data-layer.ts`), a pattern later tasks (the
diagnostic, landing pages) reuse.
**Files Changed:**

- `prisma/schema.prisma` — `SiteSettings`, `EnquiryRecord` models added.
- `prisma/migrations/20260905151229_t2_6_site_settings_and_enquiry_record/` — migration.
- `prisma/seed.ts` — `seedContactPage()`, `seedSiteSettings()`.
- `lib/site-settings.ts` — `getSiteSettings`, `splitAddressLines`, `toTelHref` (new file).
- `lib/contact.ts` — `resolveServiceContext`, `buildWhatsAppMessage` (new file).
- `lib/enquiries.ts` — `createContactEnquiry`, `ContactValidationError` (new file).
- `lib/data-layer.ts` — `pushDataLayerEvent`, the shared `dataLayer.push` mechanism (new file).
- `app/api/contact/submit/route.ts` — `POST` handler (new file, first API route in the repo).
- `app/contact/page.tsx` — the page itself (new file).
- `components/contact-form.tsx` — client form component (new file).
- `components/whatsapp-link-button.tsx` — the shared `WhatsAppLinkButton` (new file).
- `docs/features/contact-and-enquiry.md`, `docs/features/business-health-check-diagnostic.md`
  — `message` field documented; the `traffic_source`/`campaign`/`landing_page` scoping
  decision noted.
- `docs/tasks/07-content-admin.md` — T7.8 addendum for the two sequenced technical-debt items.
- `memory/decision-log.md`, `memory/technical-debt.md` — this task's scoping decisions and
  two new debt items (response-time commitment pending, `SiteFooter` callers not yet live).
  **Related Feature:** `docs/features/contact-and-enquiry.md`.
  **Notes:** Verified via Playwright MCP at mobile (390px), tablet (768px) and desktop
  (1280px) — no console errors once the dev server was restarted to pick up the regenerated
  Prisma client (same stale-client issue as T2.5's session-11 follow-up; not a real bug).
  No test runner exists yet (`memory/technical-debt.md` → "Vitest never scaffolded",
  sequenced into T3.2) — consistent with every other T2.x task, no automated tests added;
  `lib/contact.ts`/`lib/enquiries.ts` are the first `lib/` functions in this epic with real
  branching logic (consent validation, slug resolution) that would benefit from unit tests
  once the scaffold exists. All quality gates (lint, format, typecheck) pass.

---

**Task:** T2.5 (follow-up fix) — Partner title/role visual distinction; live-page note removed
**Summary:** User flagged two real gaps right after T2.5 shipped: only the featured Lead
Partner card showed any rank at all (as one plain string with no visual split from their
responsibility), and the other four partners showed no rank at all — a gap already present in
the mockup, not preserved. Added a new `Author.title` field (default `"Partner"`, migration
`20260905144109_t2_5_author_title`), seeded per partner, rendered as a solid `Badge` chip
distinct from `practiceArea`'s existing accent-colored text, for every partner uniformly
(`app/about/page.tsx`'s new `PartnerRoleLine`). Mockup updated to match. Also removed the
"partner photographs are from a single coordinated session..." caption from the live page
per the user's follow-up note — appropriate as mockup/planning annotation only, not visitor-
facing copy; the mockup's own version is untouched.
En route, chased what looked like a Base UI `Badge` rendering bug (children not appearing in
the DOM) that turned out to be the dev server holding a stale, pre-migration Prisma client in
memory — a restart resolved it; `components/ui/badge.tsx` was never actually broken and is
unchanged. See `memory/decision-log.md` for the full diagnosis.
**Files Changed:**

- `prisma/schema.prisma` — `Author.title` field added.
- `prisma/migrations/20260905144109_t2_5_author_title/` — migration.
- `prisma/seed.ts` — `title` seeded per author.
- `app/about/page.tsx` — new `PartnerRoleLine` helper; `anyPhotoPending` note removed.
- `ui/mockups/a-public-site/about.html` — `.title-badge` pill added to every partner entry.
- `docs/features/about-and-partners-page.md`, `docs/features/content-management-admin.md`,
  `docs/tasks/07-content-admin.md` — `title` field documented.
  **Related Feature:** `docs/features/about-and-partners-page.md`.
  **Notes:** Verified via Playwright MCP at mobile/tablet/desktop, no console errors. All
  quality gates pass.

---

**Task:** T2.5 — About / Team page
**Summary:** Built `/about` to `ui/mockups/a-public-site/about.html`'s structure, adding the
`Author` model (new at this task) and a new `FirmStatement` singleton model for the founding
statement/values/standard content, both seeded with real, Company-Docs-sourced content — the
5 partners' names, roles, credentials and bios, not placeholder. The firm asked mid-task to
correct two partner titles ("Founder/CEO" → "Lead Partner", "Co-Founder" → "Partner"), applied
directly in the seed data (and the mockup, since it already held the real content). The user
then rejected this task's own architecture constraint's literal "no photo → hidden entirely"
edge case once real photography turned out not to exist yet — redirected to an initials-avatar
fallback instead, so all 5 partners publish now with `photoUrl: null`, swapped for a real photo
whenever one is uploaded. This reverses `about-and-partners-page.md`'s original edge case and
`content-management-admin.md`'s publish-gating rule, both updated to match, plus T7.6 (the
future Team editor task) corrected so it doesn't rebuild the old hide-on-no-photo behavior.
Verified via Playwright MCP at mobile/tablet/desktop — initials avatars, corrected titles, and
credentials (shown only for the two partners whose bios state a formal designation) all render
correctly with no console errors.
**Files Changed:**

- `prisma/schema.prisma` — new `FirmStatement` and `Author` models.
- `prisma/migrations/20260905142546_t2_5_firm_statement_and_author/` — migration.
- `lib/about.ts` — new: `getFirmStatement`, `getAuthors`, `getInitials`.
- `app/about/page.tsx` — new: the page itself, including `PartnerAvatar`.
- `prisma/seed.ts` — `seedAboutPage`, `seedFirmStatement`, `seedAuthors` added and wired into
  `main()`.
- `ui/mockups/a-public-site/about.html` — the two corrected title labels.
- `docs/features/about-and-partners-page.md` — Data requirements (`order`, `FirmStatement`
  decomposition) and the photo/credentials edge cases, revised.
- `docs/features/content-management-admin.md` — the publish-gating business rule and
  `author`'s field list, revised to match.
- `docs/tasks/07-content-admin.md` — T7.6 (Team / author profile editor) corrected to the new
  policy, plus a session-11 addendum on the pending photo/credentials gap.
  **Related Feature:** `docs/features/about-and-partners-page.md`.
  **Notes:** No test runner exists yet (`memory/technical-debt.md` → "Vitest never
  scaffolded", sequenced into T3.2) — consistent with every other T2.x task, no tests were
  added for `lib/about.ts`. Two new technical-debt entries track the still-missing partner
  photography (`/about`'s own initials-avatar state, and the still-unresolved home-page
  senior-attention panel placeholder), both user-triggered and sequenced into T7.6.

---

**Task:** T1.5 (follow-up fix) — SiteHeader current-page nav active state
**Summary:** None of the mockups mark the current page in the nav (every page's `<nav>`
markup is identical, copy-pasted across all of them) — user flagged this as a real gap
regardless, since indicating current location is a WCAG 2.1 AA expectation, not something to
skip just because the mockups happened to omit it everywhere. Added active-state highlighting
to `SiteHeader` via `usePathname()` (already a client component): a matching top-level nav
link gets the same color it already uses on hover, permanently, plus an underline, so it
reads as visually distinct from a transient hover on a different item; `aria-current="page"`
set alongside for assistive tech. "Core Offers" (a dropdown, not a single route) is marked
active whenever the current path matches one of the three offer hrefs, and the matching item
inside the dropdown itself is called out in accent text — same logic duplicated for the
mobile drawer (its own `NAV_LINKS`/`coreOffers` render loop), with a `bg-muted` background
added there since a drawer item has no adjacent items to contrast against the way a
horizontal nav's underline does. Verified for real via Playwright MCP: `/our-method` shows
"Our Method" active on both desktop and the mobile drawer; `/offers/financial-clarity-pack`
shows "Core Offers" active in both its transparent-over-hero and solid-scrolled header states.
**Files Changed:**

- `components/site-header.tsx` — `usePathname()` added; active-state classes computed for the
  desktop nav list, the Core Offers dropdown trigger/items, and the mobile drawer's equivalent
  items.
  **Related Feature:** None — a cross-cutting `SiteHeader` fix, not tied to a single feature doc.
  **Notes:** Applies retroactively to every page already built on `SiteHeader` (T2.1–T2.4 so
  far) with no per-page changes needed, since the component itself owns the logic.

---

## 2026-09-05

**Task:** T2.4 — Our Method page
**Summary:** Built `/our-method` to `ui/mockups/a-public-site/our-method.html`, reusing T2.3's
shared `Page` model (`getPageBySlug("our-method")`, `lib/pages.ts`, no changes needed) and
adding a new `MethodStage` model + `lib/our-method.ts`'s `getMethodStages()` for the 4
Discover/Diagnose/Design/Deliver rows. Added one field beyond `our-method-page.md`'s original
Data requirements list — `whatHappens` — because the mockup's `.stage-detail-grid` has a
dedicated "What happens" cell per stage distinct from the longer descriptive paragraph
(`description`); updated the feature doc to name it, same precedent as T2.2 adding
`Offer.ctaLabel`/`tiers`. The mockup's "One journey, not three separate products" intro
paragraph links its three offer-name mentions inline (`<a>` tags to each offer page) — kept
`introCopy` itself as plain, admin-editable text (no content field anywhere else in this
project embeds markup) but added `app/our-method/page.tsx`'s `renderIntroCopyWithOfferLinks`,
which matches each of `getOfferNavLinks()`'s live offer names against the plain-text string at
render time and re-inserts a real `Link` to that offer's actual route — preserves the mockup's
linking behaviour without a templating scheme in the database field itself, and stays correct
even if an offer is renamed. (First pass at this task shipped the paragraph fully un-linked,
reasoning the same three offers were already reachable from nav/footer — the user caught that
this dropped real mockup-specified functionality; corrected same-day, see
`memory/decision-log.md`.) All four stages seeded with equal structural depth per the feature
doc's business rule; `capabilityTransferNote` populated only for Deliver (order 4), null for
the other three. Verified for real via Playwright MCP at mobile (390px), tablet (768px) and
desktop (1280px) — all four stages render in order with correct copy, the capability-transfer
panel appears only under Deliver, the three intro-copy links resolve to their real offer
routes (confirmed by clicking one through), meta tags populate from the `page` row, no console
errors. Hit and fixed a stale-Prisma-client issue: the already-running dev server had the
pre-migration client loaded in memory, so `prisma.methodStage` was `undefined` until the dev
server was restarted after `prisma generate` — worth remembering for any future mid-session
schema change.
**Files Changed:**

- `prisma/schema.prisma` — added `MethodStage` model.
- `prisma/migrations/20260905131349_add_method_stage/` — new migration.
- `prisma/seed.ts` — added `seedOurMethodPage()`, `seedMethodStages()`, wired into `main()`.
- `lib/our-method.ts` — new, `getMethodStages()`.
- `app/our-method/page.tsx` — new route, incl. `renderIntroCopyWithOfferLinks()`.
- `docs/features/our-method-page.md` — added `what_happens` to the `method_stage` Data
  requirements list.
  **Related Feature:** `docs/features/our-method-page.md`
  **Notes:** No admin editor exists yet for `page`/`method_stage` (Milestone 7) — this task only
  builds the read side, per this epic's own opening note.

---

## 2026-09-05

**Task:** T2.3 — Capabilities page
**Summary:** Built `/capabilities` to `ui/mockups/a-public-site/capabilities.html`. Introduced
the shared generic `Page` model (`prisma/schema.prisma`) as the first task to create it, per
CLAUDE.md's Recurring Patterns — added an `introCopy` field now even though this page doesn't
use it, since `our-method-page.md` (T2.4) reuses the same model with that field, per this
task's own architecture constraint. Also added `Capability` (8 rows, `order`-sorted) and
`AdvisoryRetainer` (a singleton, single `feeAmount`/`feeCurrency`/`billingPeriod`, distinct
from `OfferTier`'s multi-tier shape and the three core offers' min/max band — a retainer is
priced as one figure per period). The 8 capability names, order and short-description copy
were sourced verbatim from the mockup, then cross-checked against `Company Docs/05.03 Core
Offer Focus Note.docx`'s Section 5 "Treatment of every service line" table (same 8 lines,
same order) — confirming the mockup copy as real, accepted content rather than needing
fresh drafting. The retainer's `From GHS 1,500 / month` figure matches the mockup and is also
the Essential tier's floor in `Company Docs/05.04 Rate Card.docx`'s own three-tier retainer
table (Essential/Standard/Full) — only the entry-level single figure is modelled, per
`capabilities-page.md`'s singleton data requirement (the three-tier detail isn't represented).
Verified for real via Playwright MCP at mobile (390px), tablet (768px) and desktop (1280px) —
all 8 cards render with correct copy and correctly-formed `/contact?service=[slug]` links
(confirmed one resolves to the branded 404, expected since `/contact` isn't built until T2.6),
retainer panel renders and stacks correctly at each width, meta tags populate from the `page`
row, no console errors.
**Files Changed:**

- `prisma/schema.prisma` — new `Page`, `Capability`, `AdvisoryRetainer` models
- `prisma/migrations/20260905124815_t2_3_page_capability_advisory_retainer/` — new migration
- `prisma/seed.ts` — `seedCapabilitiesPage`, `seedCapabilities`, `seedAdvisoryRetainer`, wired
  into `main()`
- `lib/pages.ts` — new: `getPageBySlug()`, the shared resolver for the generic `page` entity
- `lib/capabilities.ts` — new: `getCapabilities()`, `getAdvisoryRetainer()`,
  `formatRetainerFee()`
- `app/capabilities/page.tsx` — new: the page itself, `force-dynamic`, live `offerNavLinks`
  passed to `SiteHeader` per T2.2's established pattern
  **Related Feature:** `docs/features/capabilities-page.md`
  **Notes:** `npm run lint`, `format:check`, and `npm run typecheck` all pass clean. No unit
  tests added — `lib/pages.ts`/`lib/capabilities.ts` are thin data-fetch wrappers with no
  branching logic worth unit-testing, same precedent as T2.1/T2.2; the Vitest-scaffolding gap
  itself is unrelated pre-existing debt already sequenced into T3.2
  (`memory/technical-debt.md`).

---

## 2026-09-05

**Task:** T2.10 — Custom error pages (404 / runtime error / root-layout crash)
**Summary:** Built `app/not-found.tsx`, `app/error.tsx`, and `app/global-error.tsx`, added
mid-epic at the user's explicit request ("having the empty pages call the default 404 page is
not nice since the site is deployed") rather than waiting for a later task to reach it. No
mockup exists for this screen; structure/copy inferred from T2.2's offer-page interior hero
pattern (dark hero, kicker, heading, lead, single CTA). Also fixed `app/layout.tsx`'s root
`metadata` export, still literally `create-next-app`'s scaffold default ("Create Next App" /
"Generated by create next app") — the same "generic default visible on the live site" problem
the user flagged, just in the `<title>` tag rather than on a 404. Found and fixed a real
design flaw while verifying with Playwright MCP: `app/not-found.tsx` originally fetched live
`getOfferNavLinks()` for `SiteHeader`'s nav (matching every other real page's pattern), but a
genuine transient DNS failure against Railway's Postgres proxy made it hang for over a minute
before failing — exactly backwards for a page whose job is to render reliably when something
else has already gone wrong. Removed the live fetch; it now renders with zero runtime
dependencies via `SiteHeader`'s existing `FALLBACK_CORE_OFFERS` default (T2.2). Also found and
fixed a related bug this surfaced: `app/offers/[slug]/page.tsx`'s `generateMetadata` returned
`{}` for an unknown slug, which left the browser tab showing the root layout's generic
homepage title instead of "Page not found" — fixed by exporting `NOT_FOUND_METADATA` from
`app/not-found.tsx` and returning it there instead. Verified all three surfaces for real
(a nonexistent route, a thrown error via a temporary scratch route deleted after checking, and
each one's mobile/tablet/desktop rendering) via Playwright MCP.
**Files Changed:**

- `app/not-found.tsx` — new: branded 404, catches unmatched routes and `notFound()` calls
- `app/error.tsx` — new: branded runtime-error boundary ("use client", `reset()` action)
- `app/global-error.tsx` — new: minimal, fully self-contained root-layout-crash fallback
- `app/layout.tsx` — root `metadata` fixed from create-next-app's scaffold default to real
  site copy
- `app/offers/[slug]/page.tsx` — `generateMetadata`'s missing-offer branch now returns
  `NOT_FOUND_METADATA` instead of `{}`
- `docs/tasks/02-public-presentation.md` — new T2.10 entry
- `memory/decision-log.md` — this session's entry on the DNS-resilience finding
  **Related Feature:** None — no `docs/features/*.md` covers error pages; this is
  infrastructure/UX polish, not a documented data/interface contract.
  **Notes:** Not part of the epic's original task list — added mid-session at explicit user
  direction, given its own task ID (T2.10) after the fact so it has a permanent record rather
  than living only in conversation history. `npm run lint`, `format:check`, and
  `npm run typecheck` all pass clean.

---

## 2026-09-05

**Task:** T2.2 — Core Offer pages (×3)
**Summary:** Built `/offers/[slug]` (`app/offers/[slug]/page.tsx`) to all three
`ui/mockups/a-public-site/offer-*.html` files, rendering FR-4.1's 10 fixed sections in order
for Business Health Check, Financial Clarity Pack, and Funding-Readiness Pack. Extended the
`Offer` model with every remaining `core-offer-pages.md` field (problem_statement,
who_for/who_not_for, method_stages, deliverables, client_inputs, indicative_timeline,
out_of_scope_note, faqs, cta_href, meta_title, meta_description) plus one new field the
mockups needed but the doc didn't name (`cta_label` — the fee-panel button text differs per
offer). Resolved the Business Health Check two-tier pricing gap flagged at T2.1 with a new
`OfferTier` model (Express/Full rows), and sourced the two single-tier offers'
`indicative_timeline` from `Company Docs/05.04 Rate Card.docx` (real content, not
placeholder — the mockups themselves don't surface a distinct timeline section, but FR-4.1
requires one). Since two `offer` rows already existed from T2.1's seed, added the new NOT
NULL columns via a nullable-then-backfill-then-constrain migration pattern rather than a
destructive `DELETE`/reset. Wired `components/site-header.tsx`'s Core Offers fee hints to a
new `getOfferNavLinks()` (live `Offer.feeAmountMin` reads) instead of the T1.5 hard-coded
array, per that task's own deferred note — kept optional with a fallback so T1.5's dev
scratch pages keep working without a DB read. FAQ built on Base UI's `Accordion`
(`multiple`, `defaultValue={[0]}`) to match the mockups' independently-toggleable `<details>`
behaviour, not a hand-rolled `<details>` reimplementation. Verified with Playwright MCP
(`verification` server) at desktop (1280px), tablet (768px), and mobile (390px) across all
three offers — full-page screenshots, FAQ multi-open interaction, mobile drawer nav, live nav
dropdown fee hints, and a real 404 for a non-existent slug, zero console errors throughout.
**Files Changed:**

- `prisma/schema.prisma` — extended `Offer`, new `OfferTier` model
- `prisma/migrations/20260905113754_t2_2_offer_full_content_and_tiers/`,
  `prisma/migrations/20260905114536_t2_2_offer_tier_scope_cap/` — new migrations (both
  hand-edited to nullable-backfill-then-NOT-NULL against T2.1's existing 3 seeded rows)
- `prisma/seed.ts` — `seedOffers()` now seeds every field with a real `update:` clause (fixed
  a latent bug: the previous `update: {}` was a no-op on re-seed); new `seedOfferTiers()`
- `lib/offers.ts` — new: `getOfferBySlug`, `getOfferNavLinks`, `formatFeeHint`,
  `formatFeeBand`, `MethodStage`/`OfferFaq` types
- `app/offers/[slug]/page.tsx` — new: the offer detail page template
- `components/site-header.tsx` — `CORE_OFFERS` renamed `FALLBACK_CORE_OFFERS`, new optional
  `offerNavLinks` prop on `SiteHeader`/`MobileNavTrigger`
- `app/(public)/page.tsx` — passes live `getOfferNavLinks()` to `SiteHeader`
- `docs/features/core-offer-pages.md` — documented `offer_tier`, `cta_label`, and the
  indicative-timeline sourcing decision
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.2 (omitted checklist cross-promo)
- `memory/decision-log.md`, `memory/technical-debt.md` — this session's entries
  **Related Feature:** `docs/features/core-offer-pages.md`
  **Notes:** The Funding-Readiness Pack mockup's `.checklist-panel` cross-promo (linking to a
  Milestone 5 landing page that doesn't exist yet) was deliberately omitted rather than
  linked to a route that would 404 — see `memory/technical-debt.md`. `npm run lint`,
  `format:check`, and `npm run typecheck` all pass clean.

---

## 2026-09-05

**Task:** T2.1 — Home page
**Summary:** Built `/` (`app/(public)/page.tsx`) to `ui/mockups/a-public-site/home.html`,
reading a new `HomePageContent` singleton and `Offer` rows from Postgres. Since no entities
existed yet for this epic, added both Prisma models and seeded them for real (T2.1's own
dependency note authorizes doing T2.9's `home_page_content`/`offer` portions first) — every
seeded value sourced from `ui/mockups/a-public-site/home.html` and the three `offer-*.html`
mockups, `isPlaceholder: false` throughout, per the epic's own "content sourced from Company
Docs/mockups" note. Only `home-page.md`'s explicitly-named 7 fields are database-backed;
everything else the mockup shows (hero kicker, hero facts sidebar, method-strip copy, trust
band) renders as fixed template JSX, per this session's decision-log entry. `Offer` only got
the fields the home cards need (slug, name, teaser — a new field this task added to
`core-offer-pages.md` — fee band, scope cap); the rest is T2.2's job, along with resolving
Business Health Check's real two-tier pricing (flagged as technical debt, not solved here).
`lib/home.ts` holds the page's data-access (`getHomePageContent`, `getOfferCards`,
`getFeaturedArticles`) per CLAUDE.md's business-logic-in-`lib/` rule; `getFeaturedArticles` is
a stub returning `[]` since `insights-engine.md`'s `article` model doesn't exist yet
(Milestone 4) — this correctly triggers home-page.md's own "no articles published" edge case
(the featured-Insights section is omitted). Along the way, found and fixed a real bug:
`prisma/seed.ts`'s very first real query failed with a self-signed-certificate TLS error
against Railway's public Postgres proxy — fixed via a new shared `lib/db-adapter.ts` (see
decision-log). Verified with Playwright MCP (connected this session) at desktop (1280px),
tablet (768px), and mobile (390px) — full-page screenshots at each width, mobile drawer nav
opened/closed for real, zero console errors/warnings throughout.
**Files Changed:**

- `prisma/schema.prisma` — new `HomePageContent` and `Offer` models (see their doc-comments
  for what's scoped in vs. deferred to T2.2)
- `prisma/migrations/20260905063122_t2_1_home_page_and_offer/` — new migration
- `prisma/seed.ts` — new `seedHomePageContent`/`seedOffers`, called from `main()`; also fixed
  to use the new shared `lib/db-adapter.ts`
- `lib/db-adapter.ts` — new: `createDatabaseAdapter`, the Railway self-signed-cert TLS fix,
  shared by `lib/prisma.ts` and `prisma/seed.ts`
- `lib/prisma.ts` — now uses `createDatabaseAdapter`
- `lib/home.ts` — new: `getHomePageContent`, `getOfferCards`, `getFeaturedArticles`
- `app/(public)/page.tsx` — new: the home page (`app/page.tsx`/`page.module.css`, the
  create-next-app default, removed — this route group is now where the public home page
  lives, per CLAUDE.md's folder structure)
- `docs/features/core-offer-pages.md` — added `teaser` to `offer`'s Data requirements; noted
  the Business Health Check two-tier gap
- `docs/tasks/02-public-presentation.md` — addenda on T2.2 (offer fields deferred + two-tier
  pricing gap), T2.5 (senior-attention photo placeholder), and T2.9 (home_page_content/offer
  already seeded)
- `memory/decision-log.md`, `memory/technical-debt.md` — this session's entries
  **Related Feature:** `docs/features/home-page.md`, `docs/features/core-offer-pages.md`
  (partial), `docs/features/seo-and-search-foundation.md` (per-page title/meta description
  only — OG/Twitter and Organization JSON-LD are T2.8's job)
  **Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was connected and used
  directly this session, unlike several prior sessions that had to fall back to
  `claude-in-chrome`. No Vitest test added: `lib/home.ts`'s functions are thin Prisma
  passthroughs (plus a stub) with no branching/computed logic of their own to unit-test yet —
  same reasoning T1.3/T1.4/T1.5 used for their own `npm run test` gap; the real trigger for
  scaffolding Vitest is still T3.2's scoring engine (`memory/technical-debt.md` — reviewed
  this session, sequencing unchanged). `npm run lint`, `format:check`, and `npx tsc --noEmit`
  (via `npm run typecheck`) all pass clean.

---

## 2026-09-05

**Task:** T1.6 — Environment/secrets and GTM container stub
**Summary:** Installed the empty GTM bootstrap snippet (ADR 0006) — head script +
post-`<body>` noscript iframe — in the root `app/layout.tsx`, reading `GTM_CONTAINER_ID`
from the environment via the existing three-tier env convention (`.env.local`/
`.env.production`/Railway service vars, established at T1.2). The snippet renders nothing
at all when the var is unset, rather than a broken/placeholder script tag — verified via
`curl` against the dev server. Verified end-to-end against a throwaway test container ID
(`GTM-TEST123`) via Playwright: `window.dataLayer` initializes, the `gtm.js` request fires
at the correct interpolated URL, and the noscript iframe is the first child of `<body>`. No
real GTM account/container exists yet for kaalbert.com (external action only the user can
take — see `memory/technical-debt.md` → "GTM container not yet provisioned"), so T1.6's
"GTM Preview mode" acceptance criterion is verified as far as it can be without a real
container; full closure is deferred to T5.3, sequenced with a `Trigger type: User-triggered`
addendum. README updated with an "Environment Variables & Secrets" section documenting the
three-tier convention and every current `.env.example` var.
**Files Changed:**

- `components/google-tag-manager.tsx` — new: `GoogleTagManagerHeadScript` (the `next/script`
  `afterInteractive` bootstrap) and `GoogleTagManagerBodyFrame` (the noscript iframe
  fallback), each taking `containerId` as a required prop
- `app/layout.tsx` — reads `GTM_CONTAINER_ID` from `process.env`, conditionally renders both
  GTM components only when the var is set
- `README.md` — new "Environment Variables & Secrets" section
- `docs/tasks/05-landing-and-measurement.md` — addendum on T5.3 pointing back to the
  GTM-not-provisioned debt entry, marked user-triggered
- `memory/technical-debt.md` — new "GTM container not yet provisioned" entry
  **Related Feature:** `docs/features/measurement-and-attribution.md` (T1.6 only installs the
  container this feature's eventual `dataLayer` events will plug into; the events themselves
  are Milestone 5 / T5.3 scope, not touched here)
  **Notes:** `.env.example`/`.env.local`/`.env.production` already had `GTM_CONTAINER_ID`
  placeholder entries from earlier sessions' env-file setup — this task didn't need to add the
  var itself, only wire it into actual rendered output and document the convention in the
  README (which hadn't covered env vars at all before this task).

---

## 2026-09-05

**Task:** T1.5 — Shared layout shell: SiteHeader, SiteFooter, admin shell skeleton
**Summary:** Built `SiteHeader`, `SiteFooter`, `ScopeOfPracticeNote`, and an empty
authenticated `/admin` shell (sidebar + placeholder content area), matching
`ui/mockups/a-public-site/*.html`'s header/footer markup exactly — confirmed byte-identical
across all eight public mockup pages via `md5sum`, so one build serves every page. `SiteHeader`
composes T1.4's `DropdownMenu` (Base UI `Menu.Root`) for the Core Offers nav item, with fee
hints hard-coded to the mockup's copy (`CORE_OFFERS` const, flagged for T2.2 to wire
`offer.fee_amount_min`). `SiteFooter` takes `addressLine1`/`addressLine2`/`phonePrimary` as
props (not hard-coded inline) so a future `site_settings` read can swap in without
restructuring; `ScopeOfPracticeNote` extracted as its own component since
`legal-and-compliance-pages.md` reuses it separately. Admin shell inferred from
`ui/mockups/g-admin-content/admin-dashboard.html` per screen-inventory.md #25 — sidebar nav
routes are inferred slugs (`/admin/articles`, etc.), only `/admin` itself resolves to a real
(placeholder) page. Two `/dev/layout-shell/*` scratch pages built (mirroring T1.3/T1.4's
`/dev/*` pattern) to exercise SiteHeader/SiteFooter in two different page contexts for the
acceptance criteria. **Mid-task addition (user-directed):** responsive design was made
mandatory from this task's first implementation rather than deferred — new CLAUDE.md rule
added (see `memory/decision-log.md`) — and the public/admin nav were rebuilt as side-sliding
drawers (`SiteHeader`'s mobile nav slides from the right; the new `AdminMobileSidebar`
component's off-canvas drawer slides from the left, matching the sidebar's own docked edge)
below the `lg` breakpoint, since none of the mockups address a narrower viewport at all. Found
and fixed a real Base UI bug in the process (`nativeButton={false}` needed on every
`DialogClose` rendered as a `Link` — see decision-log) and a route-naming inconsistency in
`docs/tasks/02-public-presentation.md` (T2.2 said `/services/[slug]`, everything else says
`/offers/[slug]` — corrected to match).
**Files Changed:**

- `components/site-header.tsx` — new: `SiteHeader`, responsive (`lg` breakpoint), desktop
  inline nav + Core Offers `DropdownMenu`, mobile hamburger opening a right-sliding drawer
  built directly on Base UI's Dialog primitive (not the `DialogContent` wrapper, to avoid
  fighting its centred-modal positioning classes)
- `components/site-footer.tsx` — new: `SiteFooter`, `FooterLinkColumn` sub-component,
  `grid-cols-2 md:grid-cols-4` responsive from the start
- `components/scope-of-practice-note.tsx` — new: `ScopeOfPracticeNote`
- `components/admin-sidebar-nav.tsx` — new: `AdminSidebarNav`, shared between the persistent
  desktop sidebar and the mobile drawer via an optional `onNavigate` prop
- `components/admin-mobile-sidebar.tsx` — new: `AdminMobileSidebar`, mobile-only topbar +
  left-sliding off-canvas drawer for the admin shell
- `app/admin/layout.tsx` — new: the admin shell frame, `hidden lg:flex` persistent sidebar +
  `AdminMobileSidebar` below `lg`, placeholder content area
- `app/admin/page.tsx` — new: placeholder dashboard content
- `app/dev/layout-shell/home/page.tsx`, `app/dev/layout-shell/about/page.tsx` — new: scratch
  verification pages (T1.3/T1.4's `/dev/*` pattern)
- `CLAUDE.md` — new "Responsive is built in from a component's first implementation" rule
  under Code Conventions, plus a matching Task Completion Checklist line
- `docs/tasks/02-public-presentation.md` — T2.2's route corrected `/services/[slug]` →
  `/offers/[slug]`

**Related Feature:** None owns `SiteHeader`/`SiteFooter`/`ScopeOfPracticeNote`/the admin shell
directly — `ui/components.md`'s shared/global composite table is authoritative (see T1.5's own
task prompt); `docs/features/core-offer-pages.md` is the route-naming authority the T2.2 fix
was checked against.
**Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was not connected this session
(same `CONNECT_TIMEOUT` as every prior session) — used `claude-in-chrome` per CLAUDE.md's
explicit fallback. This sandbox's browser window could not actually be resized below its
~1600px virtual-display width (`resize_window` silently capped), so the `lg`/`md` responsive
breakpoints were verified two ways instead: (1) extracting the live compiled CSS's
`@media (min-width: 64rem)`/`(min-width: 48rem)` rules via `document.styleSheets` to confirm
the correct Tailwind breakpoints actually compiled, and (2) injecting temporary CSS overrides
to force the mobile-layout branch visible at full width, then interacting with it for real
(opened both drawers, clicked links, confirmed navigation + auto-close, confirmed no console
errors) — the overrides were never written to any file, only injected into the live page for
this test. `npm run test` — still nothing to run (no Vitest scaffold yet, unchanged gap; this
task adds no `lib/` logic to unit-test, same reasoning as T1.3/T1.4).

---

## 2026-09-05

**Task:** T1.4 — shadcn/ui + Base UI component scaffold
**Summary:** Ran the shadcn CLI (`shadcn@4.21.0`) with `-b base` (Base UI, not Radix, per ADR 0010) and the `nova` preset (the only way to get a non-interactive init; presets only differ
in starter colour/font choices, which get overwritten by our own tokens anyway). The CLI's
own `init` overwrote `app/globals.css`'s colour values with its Nova neutral-grey defaults
and added a `.dark` block + Geist Google Font wiring in `app/layout.tsx` — reverted
`layout.tsx` entirely and restored T1.3's exact hex token values in `globals.css`, keeping
only the CLI's genuinely new structural additions: `@import "tw-animate-css"` (animate-in/out
utilities Base UI components use for open/close transitions) and `@import
"shadcn/tailwind.css"` (defines the `data-open`/`data-closed`/`data-checked`/etc. custom
variants Base UI's `data-state`-driven components style against — components literally don't
animate correctly without this import). Deliberately did not carry over the `.dark` block or
`--font-sans`/`--font-heading` additions: `ui/design-system.md` line 96 explicitly says no
dark-mode variant is defined for this brand, and `--font-sans` isn't part of this project's
token set (`--font-display`/`--font-body`/`--font-mono` only). Generated all 21 foundation
primitives from `ui/components.md`'s list via `npx shadcn add`: button, input, textarea,
select, checkbox, radio-group, switch, card, dialog, alert-dialog, accordion, tabs, badge,
table, avatar, tooltip, dropdown-menu, popover, progress, separator, sonner — plus `label`
(a direct dependency of several of the above) and `field` in place of the list's "Form": the
current shadcn registry's `form` component is an empty placeholder (react-hook-form's old
Form wrapper has been retired from the Base UI style), and `field` (Field/FieldLabel/
FieldDescription/FieldError/FieldGroup/etc.) is its documented replacement — the same "field
wrapper + validation display" role `ui/components.md` describes, just under Base UI's own
naming. Built `app/dev/component-scaffold/page.tsx` (route `/dev/component-scaffold`) with at
least one themed instance of every one of those 21 primitives, matching T1.3's `/dev/
design-tokens` scratch-page pattern. Verified with real Chrome browser automation (Playwright
MCP still not connected this session — same fallback as T1.3): screenshotted every section
and interactively exercised Dialog, AlertDialog, DropdownMenu, Popover, Tooltip (hover),
Select (value change), and Sonner (toast) — all render with the Kaalbert palette (Pine Green
primary, Ivory surfaces, Brass accents) with no per-component colour overrides, confirming
the token-name match between `app/globals.css` and what the shadcn CLI generates. Found and
fixed two real Base UI API-composition bugs surfaced only by actually clicking through the
page (not visible from source review or typecheck): (1) Base UI's `Select.Value` shows the
raw `value` string, not the matching item's label, unless `Select.Root` gets an `items` map —
without it the trigger showed `"health-check"` instead of "Business Health Check"; (2) Base
UI's `Menu.GroupLabel` (what `DropdownMenuLabel` renders) throws
`MenuGroupContext is missing` at runtime unless wrapped in `Menu.Group`
(`DropdownMenuGroup`) — Radix's equivalent didn't require this, so it wasn't obvious from
the generated component source. Also fixed all `asChild`-pattern trigger compositions (Radix
convention, doesn't exist on Base UI) to use Base UI's `render={<Button .../>}` prop instead
— caught by `tsc`, not runtime. Addendums checked while touching `package.json`: bumped
`eslint` to `^10.10.0`, ran the full quality-gate suite, and found `npm run lint` throws
`TypeError: contextOrFilename.getFilename is not a function` inside
`eslint-plugin-react`'s `react/display-name` rule — a real breakage, not just an ERESOLVE
peer-dependency warning (which is what the existing technical-debt entry was based on) —
reverted to `eslint@^9.39.5` and updated that debt entry with the concrete failure mode.
Re-ran `npm audit`: still the same 4 high-severity transitive vulnerabilities in Prisma CLI's
dev-tooling tree (`mysql2`, `deepmerge-ts`); no patched `prisma`/`@prisma/client` release
exists yet (npm's `latest` is still `8.0.0-rc.13`, a pre-release) — left that debt entry open,
updated its "checked again" note.
**Files Changed:**

- `app/globals.css` — added `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"`;
  added `* { @apply border-border outline-ring/50; }` to the base layer (shadcn's standard
  default-border/focus-ring rule, resolves purely from existing tokens); all colour/radius
  values unchanged from T1.3
- `components.json` — new: shadcn CLI config (`style: base-nova`, `iconLibrary: lucide`, `@/`
  aliases matching `tsconfig.json`)
- `components/ui/*.tsx` — new: 23 generated files (21 foundation primitives + `label` +
  `field`), each restyled against the T1.3 token layer by the CLI, no hand-patched colours
- `lib/utils.ts` — new: `export { cn } from "cn"` (shadcn's `cn` helper, re-exported from the
  small `cn` npm package rather than hand-rolling `clsx`+`tailwind-merge`)
- `app/dev/component-scaffold/page.tsx` — new: the acceptance-criteria test page
- `package.json`/`package-lock.json` — added `@base-ui/react`, `class-variance-authority`,
  `cn`, `lucide-react`, `next-themes` (Sonner's theme-detection dependency), `shadcn`,
  `sonner`, `tw-animate-css` as dependencies; `eslint` unchanged at `^9.39.5` (bumped to
  `^10` then reverted — see technical-debt.md)
- `app/layout.tsx` — untouched (CLI's Geist-font edit was reverted before it ever landed)

**Related Feature:** None — `ui/components.md` is the authoritative reference (no
`docs/features/*.md` governs the component scaffold).
**Notes:** Playwright MCP still not connected this session (same as T1.3/see that entry) —
used `claude-in-chrome` browser automation instead, including real clicks/hovers, not just
screenshots. `npm run test` still has nothing to run (no Vitest scaffold yet — unchanged
gap, see `memory/technical-debt.md`); this task adds generated component files + a scratch
page, no `lib/` logic to unit test.

---

## 2026-09-05

**Task:** T1.3 — Design tokens and Tailwind v4 setup
**Summary:** Installed Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`, both pinned
`4.3.3`) CSS-first, no `tailwind.config.js`/`.ts` per ADR 0010. `app/globals.css` now carries
`ui/design-system.md`'s "Complete CSS-first configuration" block verbatim (the raw semantic
`:root` variables + `@theme inline` mapping shadcn's exact variable names — `--color-primary`,
`--radius-md`, `--text-h1`, `--shadow-sm`, etc.), plus a small `@layer base` rule setting
`body`'s background/color/font-family to the Ivory/Ink/Calibri tokens (matching
`ui/mockups/_shared.css`'s own body rule). Removed the create-next-app Geist Google Fonts
wiring from `app/layout.tsx` — design-system.md is explicit that both brand typefaces
(Georgia/Calibri) are system fonts with no web font file loaded, so leaving Geist wired in
app-wide would have silently contradicted that. Left `app/page.tsx`/`page.module.css` (the
default Next.js placeholder homepage) untouched — out of scope for this task, slated for full
replacement by the public-presentation epic. Built the acceptance-criteria test page at
`app/dev/design-tokens/page.tsx` (route `/dev/design-tokens`, no SEO metadata — a scratch
verification page, not a real public page type) rendering button variants (primary/secondary/
accent/ghost/disabled), three offer-style cards, a text input/select/textarea form, and a
colour-palette swatch grid, entirely with Tailwind utility classes generated from the new
theme tokens (e.g. `rounded-sm`/`rounded-md` from `--radius-sm`/`--radius-md`, `bg-primary`/
`text-primary-foreground` from the colour tokens) — no bespoke CSS written for the test page
itself. Verified visually with Chrome browser automation (Playwright MCP itself is not
connected this session — see Notes): screenshotted `/dev/design-tokens` side by side with
`ui/mockups/a-public-site/home.html` (served locally via `python3 -m http.server` since the
extension can't load `file://` URLs) — buttons, cards (radius, border, shadow, colour), and
form-input styling all matched. **Follow-up (same session):** at the user's request, added
the mockups' four extra hover/decorative brand tones (`--pine-700`, `--pine-500`,
`--brass-500`, `--brass-300` — all already in `design-system.md`'s brand-palette table, just
not in its original "Complete configuration" code block) into **both**
`ui/design-system.md`'s config block and `app/globals.css`, and updated the test page's
primary/accent button hovers to use them exactly like `ui/mockups/_shared.css` does, plus
added them to the swatch grid. See `memory/decision-log.md` for the full reversal writeup.
**Files Changed:**

- `postcss.config.mjs` — new: registers `@tailwindcss/postcss`
- `app/globals.css` — rewritten: Tailwind import + full design-token `@theme` block (incl.
  the four brand-tone tokens added in the same-session follow-up) + minimal body base layer
  (replaces the create-next-app default light/dark-mode stub)
- `ui/design-system.md` — same-session follow-up: added the four brand-tone tokens to the
  "Complete CSS-first configuration" code block, with a note explaining why they exist
  outside shadcn's semantic set
- `app/layout.tsx` — removed Geist/Geist Mono `next/font/google` wiring (contradicted the
  "system fonts only" token rule); `<html>` no longer carries the font-variable classes
- `app/dev/design-tokens/page.tsx` — new: the acceptance-criteria test page
- `package.json`/`package-lock.json` — added `tailwindcss`, `@tailwindcss/postcss` (both
  pinned `4.3.3`) as devDependencies
- `next-env.d.ts` — auto-regenerated by `next typegen`/`next dev` (Next.js 16 dev vs. build
  type-reference paths), not a hand edit

**Related Feature:** None — `ui/design-system.md` is the authoritative reference (no
`docs/features/*.md` governs design tokens).
**Notes:** Playwright MCP (`.mcp.json`'s `verification` server) was not connected this
session — no `mcp__verification__*`/browser_navigate-style tools were available via
ToolSearch, consistent with CLAUDE.md's note that a newly-added/changed MCP server needs a
session restart _and_ human approval before an agent can use it. Fell back to the
`claude-in-chrome` browser-automation tools instead (screenshots, real dev-server rendering)
per CLAUDE.md's own explicit fallback allowance rather than skipping visual verification.
`npm run test` — no Vitest config or test files exist anywhere in the repo yet (no prior task
scaffolded it); this task adds tokens/CSS + a manual visual-verification page, not testable
`lib/` business logic, so there was nothing to add a unit test for. Flagged as a gap for
whichever task first adds real `lib/` logic to also scaffold Vitest at that point (see
`memory/technical-debt.md`).

---

## 2026-09-04

**Task:** T1.2 — Postgres schema baseline + migration tooling
**Summary:** Provisioned Railway's bundled Postgres plugin onto the existing `kaalbert-web`
project (user-confirmed first, since it's a real billed resource), wired both a public TCP
proxy (local dev) and a private-network service variable (production) so `DATABASE_URL`
never needs to be the same value in both places. Installed Prisma 7.10.0 (pinned — npm's
`latest` tag is currently a pre-release) with the `@prisma/adapter-pg` driver adapter Prisma
7 now requires, established `prisma/schema.prisma` as a deliberately-empty baseline (no
models — entities arrive incrementally, epic by epic, per the task's own scope), and proved
the migration mechanism end-to-end with an isolated, fully-cleaned-up smoke test (real
migration created and applied against the real Railway Postgres instance, verified via
`psql`, then removed — the committed schema/migration history is untouched by it). Wired
`npm run migrate` / `migrate:deploy` / `db:seed` conventions, a `lib/prisma.ts` client
singleton, an extensible `prisma/seed.ts` (documented `seed<Area>()`/idempotent-upsert/
`is_placeholder` convention), a `railway.json` deploy hook that runs `prisma migrate deploy`
before every production start, and a `.env.example` covering every var `CLAUDE.local.md`
lists. Documented the whole convention in README's new "Database & Migrations" section.
**Files Changed:**

- prisma/schema.prisma, prisma/seed.ts, prisma7.config.ts — new: baseline schema (zero
  models), seed script, Prisma 7 config (datasource URL + migrations path + seed command)
- lib/prisma.ts — new: PrismaClient singleton, driver-adapter-based (Prisma 7 requirement),
  hot-reload-safe via `globalThis` caching
- package.json, package-lock.json — added `@prisma/client`, `@prisma/adapter-pg`, `pg`
  (deps); `prisma`, `dotenv`, `tsx`, `@types/pg` (devDeps, all `--save-exact` pinned);
  `postinstall`/`migrate`/`migrate:deploy`/`db:seed` scripts
- railway.json — new: `deploy.startCommand` runs `prisma migrate deploy` before `npm start`
- .env.example — new: every var `CLAUDE.local.md` lists, placeholder values only
- .gitignore — added `/generated/prisma` (generated client output)
- .prettierignore, eslint.config.mjs — added `generated/` to both ignore lists
- README.md — new "Database & Migrations" section documenting the migrate/seed convention
  for later epics to extend (the acceptance criterion's explicit requirement)
- CLAUDE.local.md (not committed — gitignored) — DATABASE_URL note updated to point at
  `.env`/Railway rather than "fill in once provisioned"
- docs/tasks/01-foundation.md — addendum added to T1.4 (re-check the Prisma CLI audit
  vulnerabilities next time `package.json` deps are touched)
- memory/decision-log.md, memory/technical-debt.md — this session's entries
- `.claude/skills/prisma-*`, `skills-lock.json` — added by `prisma init` itself (official
  Prisma 7 tooling, not authored this session); near-duplicate `.windsurf/skills/` and
  `.agents/skills/` copies it also created were deleted (unused in this project)
- Railway project `kaalbert-web` (outside the repo) — added a `Postgres` service (plugin)
  and a TCP proxy on it; set `DATABASE_URL` on the `kaalbert-web` service as a
  `${{Postgres.DATABASE_URL}}` reference
  **Related Feature:** No single feature spec — infrastructure/scaffolding task, per T1.2's
  own description.
  **Notes:** No UI surface (task prompt states this explicitly), so no Playwright MCP
  verification applied; instead exercised for real via the equivalent for a backend task —
  live `psql` connection, a real (isolated, cleaned-up) `prisma migrate dev` run, `prisma
migrate deploy` and `npm run db:seed` both run for real against the live Railway Postgres
  instance. No automated tests added — no application logic exists yet to test, same
  reasoning T1.1 used. `npm audit` flags 4 high-severity vulnerabilities, all transitive
  inside Prisma CLI's own dev-tooling tree, not reachable from this project's runtime code —
  see `memory/technical-debt.md`.

---

## 2026-09-04

**Task:** T1.1 — Repo, Next.js app, and deploy pipeline
**Summary:** Initialized the git repo at `Kaalbert Website/` (the actual repo root — the
sibling `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders stay out of
version control). Scaffolded a Next.js 16.3.4/TypeScript/App Router app (no Tailwind yet —
that's T1.3's job), merged it against the pre-existing docs/config scaffolding without
clobbering the custom ESLint rule or Prettier config, wired `npm run lint` /
`npm run typecheck` / `npm run format:check` as real, passing quality gates, and added
`.github/workflows/ci.yml` running all three on every push/PR to `main`. Reformatted the
entire existing docs/ui/memory tree with Prettier (cosmetic only) since this is the task that
makes the format gate real for the first time. Created Railway project `kaalbert-web` (new
company account) and deployed the app; live at https://kaalbert.up.railway.app. Set up two
git remotes (`origin` = KaalbertCompanyLtd, `personal` = cosbyDeveloper) and, after an
initial token-exposure incident (see `memory/decision-log.md`), landed on a durable
multi-account credential workflow (SSH for the personal/default account, a non-interactive
script-based credential helper reading `~/.secrets` for foreign accounts) — generalized and
documented outside the repo at `~/Dev_Workspace/git-multi-account-workflow.md`. Wired and
verified GitHub-connected Railway auto-deploy end to end (a real push-triggered build
succeeded, live URL confirmed 200 afterward).
**Files Changed:**

- package.json, package-lock.json — Next.js/React/ESLint/Prettier deps, `dev`/`build`/
  `start`/`lint`/`typecheck`/`format`/`format:check` scripts
- app/layout.tsx, app/page.tsx, app/page.module.css, app/globals.css, app/favicon.ico —
  Next.js default starter page (deliberately unmodified; real content starts at T2.1)
- public/next.svg, public/vercel.svg, public/globe.svg, public/file.svg, public/window.svg
  — stock assets the starter page references
- next.config.ts, tsconfig.json, next-env.d.ts — Next.js/TypeScript config
- eslint.config.mjs — rewritten for Next.js 16's actual flat-config export shape
  (`eslint-config-next/core-web-vitals` + `/typescript` subpath imports, not the old
  `FlatCompat`/`"next/core-web-vitals"` string form), ADR-0001 `no-restricted-imports` rule
  preserved
- .gitignore — added `*.tsbuildinfo`
- .github/workflows/ci.yml — new: type-check + lint + format:check on push/PR to `main`
- .mcp.json — added `github` server block
- CLAUDE.md — two Next.js 16 notes added to the Auth Pattern section (middleware→proxy.ts;
  typegen requirement); new "Memory file format and ordering" + "Debt/bug fixes must be
  sequenced into a task" subsections added under Knowledge Management Responsibilities
- docs/tasks/01-foundation.md — addenda added to T1.1 (Cloudflare/domain follow-up) and T1.4
  (ESLint version-bump re-check)
- Every pre-existing docs/ui/memory markdown file — Prettier reformatting only, no content
  changes
- `~/.gitconfig`, `~/.git-credential-helpers/kaalbert-company.sh` (outside the repo) — new
  company-account credential helper

**Related Feature:** None — infrastructure/scaffolding task, `docs/tasks/01-foundation.md`
T1.1
**Notes:** T1.1 is fully complete except the Cloudflare acceptance criterion, which is
blocked on `kaalbert.com` not being registered (see `memory/technical-debt.md`, sequenced
into T1.1 as an addendum for whenever the domain exists). One technical-debt item
(ESLint 9.x EOL pin) remains open, sequenced into T1.4. See `memory/decision-log.md` for the
full set of implementation decisions made this session, including the token-exposure
incident and its resolution.
