# Technical Debt

Newest entry at the top. Entries below follow this format, one per debt item — see
CLAUDE.md's "Memory file format and ordering" section for the exact field rules and the
sequencing requirement:

## Title

**Status:** Open | Resolved
**Date raised:** YYYY-MM-DD
**Date resolved:** YYYY-MM-DD (omit if still Open)
**Reason:**
**Impact:**
**Priority:** High | Medium | Low
**Possible Fix/Fixes:**
**Trigger type:** Task-sequenced | User-triggered
**Sequenced into:** T##-## (task name)

---

## `footer_content.scope_of_practice_statement`/`company_registration_details` materialized but not wired into `SiteFooter`/`ScopeOfPracticeNote`

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.7 (`docs/tasks/02-public-presentation.md`) materialized the `footer_content`
singleton (seeded with the same scope-of-practice wording `components/scope-of-practice-
note.tsx` already hardcodes, plus `companyRegistrationDetails: null`), reading it live on
every new `/legal/[slug]` page's own body content. But `ScopeOfPracticeNote` (rendered inside
`SiteFooter` on every public page) still renders T1.5's original hardcoded text, and has no
prop for `companyRegistrationDetails` at all — the exact same "second hardcoded copy" gap
already flagged for `SiteSettings`/`SiteFooter`'s address/phone props (see the entry directly
below this one), now also true for this entity. Deliberately not fixed as part of T2.7 itself
— that task's own architecture constraint allowed either resolving or logging this gap, and
fixing it would mean threading `getFooterContent()`-fetched props through all seven `SiteFooter`
call sites (home, capabilities, our-method, about, contact, offers/[slug], and the new legal
page) for a Small-sized task, the same cost/precedent T2.6 weighed for the site_settings gap.
**Impact:** Low today (the hardcoded text and the seeded `footer_content` row match exactly,
and `companyRegistrationDetails` was never shown anywhere before this row existed either), but
identical staleness risk to the `SiteSettings` gap below: once T7.8 makes this content
admin-editable, an edit won't propagate to the footer until this is fixed. Also means the
footer never shows company registration details even once the firm supplies them, until fixed.
**Priority:** Medium
**Possible Fix/Fixes:** Same shape as the `SiteSettings`/`SiteFooter` fix directly below —
change `ScopeOfPracticeNote` to accept `scopeOfPracticeStatement`/`companyRegistrationDetails`
as props (rendering the registration-details line only when non-null, per this feature's own
edge case), and update every `SiteFooter` caller to fetch `getFooterContent()` (a resolver not
yet written — add it to `lib/legal.ts` when this is actually wired in) and pass them through.
Natural to do in the same pass as the `SiteSettings` fix, since both are footer singletons
read by the same seven call sites.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.8 (Site Settings singleton, `docs/tasks/07-content-admin.md`) —
addendum added this session pointing back here, alongside the existing `SiteSettings` entry.

---

## `site_settings.response_time_commitment` has no real value yet — firm hasn't confirmed a number

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.6 (`docs/tasks/02-public-presentation.md`) materialized the `site_settings`
singleton and built `/contact` to read it live, but the firm has not yet supplied a
response-time commitment it can actually keep (`contact-and-enquiry.md`'s business rule:
"content the firm supplies and must actually be able to keep"). Seeded `null` rather than
carrying over the mockup's own "Response-time commitment: pending." text, which is a
mockup-authoring annotation, not real visitor copy (same treatment as the photo-pending
caption removed from `/about` at T2.5).
**Impact:** Low — `/contact` correctly omits the response-time panel entirely while null
(`content-management-admin.md`'s edge case: a blank required field is omitted from the public
display, not shown broken), so nothing renders incorrectly. The gap is simply that a real
visitor sees no stated response-time commitment at all until the firm confirms one.
**Priority:** Medium
**Possible Fix/Fixes:** Once the firm states a real, keepable response-time commitment, set
`site_settings.response_time_commitment` via T7.8's Site Settings admin screen (no code
change required — this is a content edit, not a build task).
**Trigger type:** User-triggered — do not fabricate a response-time commitment or treat
reaching T7.8 as a cue to invent one; wait for the firm to state a real number first.
**Sequenced into:** T7.8 (Site Settings singleton, `docs/tasks/07-content-admin.md`) —
addendum added this session pointing back here.

---

## `SiteFooter` callers still pass hardcoded address/phone props instead of reading `site_settings`

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.6 is the first task to materialize a real `site_settings` row, and wires it
into `/contact`'s own channel cards and `WhatsAppLinkButton` — but every public page's
`SiteFooter` call (T1.5's own precedent, `app/(public)/page.tsx`, `app/capabilities/page.tsx`,
`app/our-method/page.tsx`, `app/about/page.tsx`, and this task's own `app/contact/page.tsx`)
still passes `addressLine1`/`addressLine2`/`phonePrimary` as literal hardcoded strings, since
no `site_settings` table existed when those callers were written. CLAUDE.md's Recurring
Patterns rule ("SiteFooter, /contact, and every WhatsAppLinkButton all read the same record —
never a second hard-coded copy anywhere") is now violated the moment this real row exists
alongside those still-hardcoded props — flagged per this task's own architecture constraint
rather than silently left unnoticed.
**Impact:** Low today (the hardcoded values and the seeded `site_settings` row match exactly),
but a future Site Settings edit (e.g. an office move, a phone number change) would update
`/contact` and `WhatsAppLinkButton` everywhere while every page's footer silently kept
showing the old value — a real staleness risk once T7.8 ships and a partner starts editing.
**Priority:** Medium
**Possible Fix/Fixes:** Change `SiteFooter`'s callers to fetch `getSiteSettings()` (or accept
it as a prop threaded from each page's own already-fetched data) instead of passing literal
strings — a mechanical change across five call sites, natural to do alongside T7.8's own
Site Settings admin build, when the record becomes editable and staleness actually starts to
matter.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.8 (Site Settings singleton, `docs/tasks/07-content-admin.md`) —
addendum added this session pointing back here.

---

## Funding-Readiness Pack's checklist cross-promo panel omitted from the offer detail page

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** `ui/mockups/a-public-site/offer-funding-readiness-pack.html` has a
`.checklist-panel` section between the fee panel and the out-of-scope note, promoting a free
"Funding-Readiness Checklist" download and linking to
`ui/mockups/d-landing-pages/landing-funding-readiness-checklist.html`. That landing page is
Milestone 5 scope (T5.1/T5.2, `docs/tasks/05-landing-and-measurement.md`) and doesn't exist
as a real route yet at T2.2. This section isn't one of FR-4.1's 10 fixed fields (it's a lead-
magnet cross-promo, not part of `core-offer-pages.md`'s documented `offer` entity), so T2.2
omitted it entirely from `app/offers/[slug]/page.tsx` rather than link to a route that would
404, or fabricate a substitute destination.
**Impact:** Low — the Funding-Readiness Pack page is otherwise complete per FR-4.1. This is a
missed cross-sell opportunity to the checklist lead magnet until Milestone 5 ships it, not a
correctness or compliance issue.
**Priority:** Low
**Possible Fix/Fixes:** Once T5.2 seeds the `/lp/funding-readiness-checklist` landing page
instance, add the `.checklist-panel` section back to the Funding-Readiness Pack offer page
(`app/offers/[slug]/page.tsx`), linking to that real route.
**Trigger type:** Task-sequenced
**Sequenced into:** T5.2 (Three landing page instances, seeded,
`docs/tasks/05-landing-and-measurement.md`) — addendum added this session pointing back here.

---

## Business Health Check's two-tier pricing has no real data model yet

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-05 (T2.2, same day — this project's sessions have run in rapid
succession)
**Reason:** T2.1 needed real `Offer` rows to seed the home page's offer cards. Two of the
three offers (Financial Clarity Pack, Funding-Readiness Pack) have a single published fee
band each, matching `core-offer-pages.md`'s documented `fee_amount_min`/`fee_amount_max`/
`scope_cap` shape exactly. Business Health Check does not — its own mockup
(`ui/mockups/a-public-site/offer-business-health-check.html`) shows two real tiers (Express:
GHS 1,000–2,000, 5 working days, single location; Full: GHS 3,000–6,500, 2 weeks, up to 3
locations), each with its own deliverables, and the mockup itself labels the Full tier's
band as "the published fee band" while the nav/home-card fee hint shows Express's floor
("From GHS 1,000"). Nothing in `core-offer-pages.md` accounted for a multi-tier offer.
**Impact:** T2.1 seeded a provisional `feeAmountMin: 1000, feeAmountMax: 6500` (Express's
floor to Full's ceiling) and a prose `scopeCap` describing both tiers, so the home card's
"From GHS 1,000" rendered correctly — but that was a stopgap, not a real representation of
the two tiers.
**Priority:** N/A — resolved
**Possible Fix/Fixes:** ~~Most likely a dedicated `OfferTier` model~~ Done: added a real
`OfferTier` model (`offer_id`, `name`, `is_featured`, `duration_label`, `scope_label`,
`scope_cap`, `fee_amount_min/max`, `fee_currency`, `deliverables`, `client_inputs`,
`sort_order`), seeded with Business Health Check's real Express/Full rows
(`prisma/seed.ts`'s `seedOfferTiers()`). `app/offers/[slug]/page.tsx` renders a tier grid
(deliverables + fee) and a per-tier "required from you" section when `offer.tiers.length >
0`, and resolves the fee-panel's "published fee band" to whichever tier has `is_featured:
true` (Full), with the other tier(s) surfaced as the panel's alt-note. `Offer`'s own
`feeAmountMin/Max` (Express's floor to Full's ceiling) is kept unchanged for the home-card/
nav-dropdown "From GHS 1,000" hint — that's a genuinely different summary than the detail
page's own fee panel, not a duplicate to be removed.
**Trigger type:** N/A — resolved
**Sequenced into:** T2.2 (Core Offer pages, `docs/tasks/02-public-presentation.md`) — closed
out per that task's own addendum.

---

## Temporary favicon in use — pending the firm's confirmed final icon

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** User asked to use the "KB" monogram favicon from `Company Docs/Brand
assets/` (the site's `app/favicon.ico` was still Next.js's default) explicitly as a
temporary stand-in, until the firm confirms a real, final icon. Used the pre-generated
iconifier.net set already present there rather than regenerating one:
`Company Docs/Brand assets/favicon.ico` → `app/favicon.ico` (multi-res .ico, matches
`Brand assets/iconified/favicon.ico` byte-for-byte) and
`Brand assets/iconified/apple-touch-icon-180x180.png` → `app/apple-icon.png` (Next.js's
file-based icon convention only wires one apple-touch size automatically; 180×180 is the
modern-device-covering size, per the other pre-generated sizes in that folder being for
older/smaller devices this project doesn't need to support separately).
**Impact:** None functionally — the site now has a real (if provisional) favicon/apple
touch icon instead of Next's default. Purely a "don't treat this as the final brand
decision" flag.
**Priority:** Low
**Possible Fix/Fixes:** Once the firm confirms a final icon, replace `app/favicon.ico` and
`app/apple-icon.png` directly with the confirmed assets (re-run them through an
iconifier-style tool first if only a source logo is supplied, not a ready `.ico`).
**Trigger type:** User-triggered — do not treat reaching T2.8 (or any other task) as a cue
to swap this on its own; only replace it when the user says the firm has confirmed a final
icon.
**Sequenced into:** T2.8 (SEO foundation, `docs/tasks/02-public-presentation.md`) — a
checkpoint to confirm whether a final icon exists yet by the time that task is reached, not
an instruction to act unprompted.

---

## Business Health Check's two-tier pricing has no real data model yet

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.1 needed real `Offer` rows to seed the home page's offer cards. Two of the
three offers (Financial Clarity Pack, Funding-Readiness Pack) have a single published fee
band each, matching `core-offer-pages.md`'s documented `fee_amount_min`/`fee_amount_max`/
`scope_cap` shape exactly. Business Health Check does not — its own mockup
(`ui/mockups/a-public-site/offer-business-health-check.html`) shows two real tiers (Express:
GHS 1,000–2,000, 5 working days, single location; Full: GHS 3,000–6,500, 2 weeks, up to 3
locations), each with its own deliverables, and the mockup itself labels the Full tier's
band as "the published fee band" while the nav/home-card fee hint shows Express's floor
("From GHS 1,000"). Nothing in `core-offer-pages.md` accounts for a multi-tier offer.
**Impact:** T2.1 seeded a provisional `feeAmountMin: 1000, feeAmountMax: 6500` (Express's
floor to Full's ceiling) and a prose `scopeCap` describing both tiers, so the home card's
"From GHS 1,000" renders correctly — but this is a stopgap, not a real representation of the
two tiers, and can't support T2.2's full offer-detail page (which needs to show both tiers
with their own deliverable lists and required-inputs).
**Priority:** Medium — doesn't block T2.1's own acceptance criteria, but blocks T2.2 from
building a correct Business Health Check detail page.
**Possible Fix/Fixes:** Most likely a dedicated `OfferTier` model (offer_id, name, fee_min,
fee_max, duration, scope description, deliverables list), with `Offer.feeAmountMin`/`Max`
either dropped in favour of tier rows or kept as a derived "from X" summary. Needs a real
design decision, not a mechanical schema add — flagged for T2.2 to make.
**Trigger type:** Task-sequenced
**Sequenced into:** T2.2 (Core Offer pages, `docs/tasks/02-public-presentation.md`) — see
that task's addendum.

---

## About page partners have no real photography yet

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.5 sourced real names, roles, credentials and bios for all 5 partners from
`ui/mockups/a-public-site/about.html`/Company Docs, but no partner photograph exists anywhere
in the repo (checked `public/` and `ui/mockups/assets/` before building — neither has one).
Per revised policy (session 11, `memory/decision-log.md`), this does not block publishing:
all 5 `author` rows are seeded `published: true` with `photoUrl: null`, rendered on `/about`
with an initials avatar (`app/about/page.tsx`'s `PartnerAvatar`) in place of a photo.
**Impact:** Low — cosmetic only; every partner's real profile is fully visible and correct,
just without a photograph. `/about` is not "half-finished" by this project's own revised
standard, but a photo does read more credibly than initials long-term.
**Priority:** Low
**Possible Fix/Fixes:** Once the firm delivers real partner photography (single coordinated
session, per Document 13.03 Section 13), upload each photo and set that `author` row's
`photoUrl` — via T7.6's Team editor once built, or a direct seed/DB update if that's not yet
available. No other code change needed; the avatar swaps automatically the moment `photoUrl`
is set.
**Trigger type:** User-triggered
**Sequenced into:** T7.6 (Team / author profile editor, `docs/tasks/07-content-admin.md`) —
see that task's session-11 addendum. Do not source or generate partner photos proactively;
wait for the firm to say photography is ready.

---

## Home page senior-attention panel has no real partner photography yet

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** `ui/mockups/a-public-site/home.html`'s Senior Attention section pairs its copy
with a photo/credentials panel; the mockup itself only shows an italic wireframe note
("Real partner photography and credentials appear here at build time..."), since no partner
photo assets exist in `public/brand/` yet (only the two logo files). T2.1 kept an equivalent
honest placeholder note rather than inventing or stock-sourcing imagery (CLAUDE.md's
placeholder-content rule, applied to an image asset gap rather than text copy).
**Impact:** Low — cosmetic only, doesn't block T2.1's own acceptance criteria. The home page
currently ships an admittedly-provisional panel in a section that's meant to build trust.
**Priority:** Low
**Possible Fix/Fixes:** T2.5 (now complete) sourced real partner names/bios/credentials for
`/about`, but not real photography (see "About page partners have no real photography yet"
above — same underlying asset gap). Once that gap closes, swap this panel for a real photo
(or small multi-partner strip) instead of the italic note; until then, this panel and
`/about`'s own initials-avatar treatment are consistent with each other, not a contradiction.
**Trigger type:** User-triggered
**Sequenced into:** T7.6 (Team / author profile editor, `docs/tasks/07-content-admin.md`) —
tied to the same photography delivery as the entry above; revisit both together once photos
exist.

---

## GTM container not yet provisioned

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T1.6 installed the empty GTM bootstrap snippet (head script + `<body>` noscript
iframe, ADR 0006) in the root `app/layout.tsx`, reading `GTM_CONTAINER_ID` from the
environment. No real Google Tag Manager account/container exists for kaalbert.com yet —
creating one is an external action only the user can take (same category as the
`kaalbert.com` domain registration in T1.1's addendum), so it was not created this session.
The snippet was verified working end-to-end against a throwaway test ID (`GTM-TEST123`) via
Playwright: `window.dataLayer` initializes correctly, the `gtm.js` script tag requests the
right URL with the container ID interpolated, and the noscript iframe renders immediately
after `<body>` — the only thing missing is a real container ID. When `GTM_CONTAINER_ID` is
unset (current state), the snippet renders nothing at all, verified via `curl` against the
dev server — no broken/placeholder script tag ships.
**Impact:** T1.6's acceptance criterion ("GTM Preview mode confirms the container fires on
page load with zero tags active") cannot be fully closed out — GTM Preview mode requires a
real container to preview against. No functional impact on the site: with no container ID
set, the site renders with zero GTM-related markup, so nothing is broken or half-shipped in
the meantime.
**Priority:** Medium — blocks full sign-off of T1.6's acceptance criterion and is a hard
prerequisite for T5.3 (which populates the container with the six conversion events).
**Possible Fix/Fixes:** Once the user creates a GTM account/container for kaalbert.com, set
the real `GTM-XXXXXXX` ID as `GTM_CONTAINER_ID` in `.env.local` and on the Railway
`kaalbert-web` service, then run GTM's own Preview mode against the deployed/dev site to
confirm it fires with zero tags active — closing T1.6's acceptance criterion retroactively.
**Trigger type:** User-triggered — do not create a Google/GTM account or treat reaching
T5.3 as a cue to sign up for one; wait for the user to say the GTM container exists and
provide the real container ID.
**Sequenced into:** T5.3 (GTM container: six conversion events + consent mode,
`docs/tasks/05-landing-and-measurement.md`) — addendum added this session pointing back
here; T5.3 cannot start until this is resolved, since it populates the same container.

---

## Two-partner simultaneous page edits use last-write-wins (no optimistic locking)

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** `docs/features/content-management-admin.md`'s "Edge cases" section documents:
"Two partners edit the same page simultaneously: last write wins at launch — optimistic
locking/conflict detection is not required for Phase 1 given five partners and low edit
frequency, but is noted here as a known simplification (recorded in
`memory/technical-debt.md` once implementation begins)." Logged now, proactively, at the
user's explicit request this session, rather than waiting for T7.2/T7.3 to actually be
implemented as the feature doc's own text originally planned — the user flagged that leaving
it as an undated "Anticipated" placeholder (with no `Sequenced into:` target, no `Status`,
no `Priority`) wasn't real due diligence and asked for it to become a proper entry now.
**Impact:** If two partners save overlapping edits to the same `article`/`page`/other
admin-editable entity within the same window, the second `PATCH` silently overwrites the
first partner's changes with no warning to either partner — no error, no merge, no "someone
else edited this" notice. Explicitly accepted as tolerable for Phase 1 launch given the
firm's actual partner count (five) and edit frequency (low) — this is a documented,
deliberate simplification, not an oversight, and does not need to be fixed before T7.2/T7.3
ship.
**Priority:** Low — accepted for Phase 1 by the feature doc itself; revisit only if the
partner count grows or edit frequency increases enough that real collisions start
happening in practice.
**Possible Fix/Fixes:** Lightest option: an `updated_at` (or a dedicated `version` column)
check on each `PATCH` that rejects a stale write with a "someone else has edited this since
you opened it — reload to see their changes" error, rather than silently overwriting.
Heavier option: a "currently being edited by [name]" banner shown to the second partner
before they even start editing. Full real-time collaborative editing (Google-Docs-style) is
explicitly out of scope for this project's size. No fix is required to ship T7.2/T7.3 —
this entry exists so the limitation is a conscious, documented choice at that point, not a
silently-shipped gap.
**Trigger type:** Task-sequenced — whichever session builds T7.2/T7.3 should read this entry
and consciously decide "ship as documented last-write-wins" vs. "add the lightweight
staleness check while already building the PATCH handler" — not treated as a mandatory fix,
just a required conscious decision point.
**Sequenced into:** T7.2 (Articles editor + Categories) and T7.3 (Pages editor), both in
`docs/tasks/07-content-admin.md` — addenda added this session to both task entries pointing
back here.

---

## ESLint pinned to the EOL 9.x line

**Status:** Open
**Date raised:** 2026-09-04
**Reason:** `eslint@^10` is current, but bumping produced `ERESOLVE overriding peer
dependency` warnings against `eslint-config-next@16.3.4`'s plugin chain (something in that
chain still peer-depends on ESLint 9). `create-next-app`'s own generated `package.json` for
this exact Next.js version independently chose `eslint@^9`, so matched that rather than force
an unproven combo on day one. npm flags `eslint@9.39.5` as "no longer supported."
**Impact:** No functional impact today — lint passes clean. Risk is losing ESLint 10-only
rules/fixes and eventually losing security patches on the 9.x line.
**Priority:** Low — revisit opportunistically, not urgent.
**Possible Fix/Fixes:** Re-attempt the `eslint@^10` bump once `eslint-config-next` publishes
a release with a peer range that includes ESLint 10 cleanly (check `npm info
eslint-config-next peerDependencies` before retrying).
**Trigger type:** Task-sequenced — re-check opportunistically whenever `package.json` is next
touched for an unrelated reason; no separate user go-ahead needed.
**Sequenced into:** T3.2 (Server-side scoring function, `docs/tasks/03-diagnostic.md`) — the
next confirmed `package.json` touch after T1.4 (grepped across every `docs/tasks/*.md` for an
`npm install`/dependency mention; nothing between T1.5 and T3.1 qualifies), and it's already
installing Vitest there anyway — see that task's session-04 addendum.

**Re-checked (session 04, 2026-09-05, T1.4):** `npm info eslint-config-next@16.3.4
peerDependencies` now reports `eslint: >=9.0.0` — technically includes 10 — and a dry-run
install shows no ERESOLVE errors at all (the warning above no longer reproduces; a
transitive dependency must have relaxed its range since T1.1). Actually installed
`eslint@^10.10.0` and ran `npm run lint` for real: it crashes outright —
`TypeError: contextOrFilename.getFilename is not a function` thrown inside
`eslint-plugin-react`'s `react/display-name` rule (`node_modules/eslint-config-next/
node_modules/eslint-plugin-react/lib/util/version.js`), because that rule calls an ESLint 9
context API removed in ESLint 10. This is a harder blocker than the original ERESOLVE
warning — a real runtime crash, not just an unresolved peer range — so `eslint-config-next`
must ship a `eslint-plugin-react` bump before this can move. Reverted to `eslint@^9.39.5`
(confirmed `npm run lint` passes clean again) rather than leave the repo on a broken lint
config.

---

## Vitest never scaffolded (no test runner exists yet)

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** CLAUDE.md names Vitest + React Testing Library as the unit/component-testing
stack, but no task through T1.3 has actually installed or configured it — there's no
`vitest.config.ts`, no `test` script in `package.json`, and no `*.test.*` file anywhere in
the repo. T1.3 (design tokens + a scratch visual-verification page) had nothing worth
unit-testing, so it surfaced the gap without being the right place to close it.
**Impact:** `npm run test` (part of CLAUDE.md's Quality Gates) currently has nothing to run.
No functional risk yet — no `lib/` business logic exists yet either — but the gap must close
before the first task that ships real business logic, or that task's own unit-test
acceptance criteria can't be met.
**Priority:** Medium — not urgent today, but blocking the moment it's needed.
**Possible Fix/Fixes:** Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
(and a DOM environment, e.g. `jsdom` or `happy-dom`); add `vitest.config.ts`; add a `test`
script to `package.json`.
**Trigger type:** Task-sequenced
**Sequenced into:** T3.2 (Server-side scoring function, `docs/tasks/03-diagnostic.md`) — the
first task with real `lib/` logic and explicit unit-test acceptance criteria; see that task's
addendum.

---

## railway.json (Config as Code) is deprecated in favour of .railway/railway.ts

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-05 (same session — turned out to be more urgent than "Low
priority": `railway.json`'s `deploy.startCommand` had never actually applied to the live
service at all, unrelated to the deprecation itself; see `memory/decision-log.md`'s
"railway.json never applied; migrated to Infrastructure as Code" entry for the full
investigation)
**Reason:** `railway status` printed: "Config as Code (railway.json / railway.toml) is
deprecated. Prefer Infrastructure as Code (.railway/railway.ts)." T1.2 added `railway.json`
(for the `deploy.startCommand` that runs `prisma migrate deploy && npm start`) before
noticing this warning on a later `railway status` check.
**Impact:** Turned out to be more than the deprecation warning alone — `railway.json` was
never actually being read by Railway at all (`serviceManifest.deploy.startCommand` stayed
`null` on every deployment), so `prisma migrate deploy` had never run in production.
**Priority:** Low → became urgent once discovered the config wasn't applying at all
**Possible Fix/Fixes:** ~~Run `railway config migrate`~~ Done: migrated to
`.railway/railway.ts` via `railway config migrate --service kaalbert-web --apply
--delete-files`, then hand-fixed the auto-generated file (it omitted `source`/`variables`,
which would have deleted `DATABASE_URL` and disconnected the GitHub source on apply) before
running `railway config apply --yes`. Verified via deployment logs: `prisma migrate deploy`
now runs before `next start` in production.
**Trigger type:** N/A — resolved
**Sequenced into:** T1.2 (this session, follow-up work) — closes out what was originally
sequenced into T1.6; no further action needed there.

---

## 4 high-severity npm audit vulnerabilities in Prisma CLI's dev-tooling tree

**Status:** Open
**Date raised:** 2026-09-04
**Reason:** `npm audit` (after T1.2's `prisma@7.10.0`/`@prisma/client@7.10.0` install)
reports 4 high-severity advisories, all transitive: `mysql2` (auth-plugin credential leak,
decompression-bomb DoS) and `deepmerge-ts` (stack exhaustion), both pulled in by
`@prisma/config` inside the `prisma` CLI package's own dependency tree — not by this
project's runtime code (`mysql2` exists for Prisma's optional MySQL support; this project
only ever uses `postgresql`).
**Impact:** Low in practice — `prisma` is a dev-only CLI tool, never bundled into the
deployed Next.js app, and the vulnerable code paths (MySQL auth, `@prisma/config`'s merge
logic under attacker-controlled input) aren't reachable from anything this project actually
runs. Kept open rather than dismissed because `npm audit`/CI dependency scanners will keep
flagging it.
**Priority:** Low
**Possible Fix/Fixes:** `npm audit fix --force` "fixes" it by downgrading `prisma` to
`6.19.3` — rejected, since 7.10.0 was deliberately chosen over npm's `latest` tag
(`8.0.0-rc.13`, a pre-release — see `memory/decision-log.md`) specifically to be current and
stable, and downgrading to 6.x is a step backward on both counts. Real fix is a future
Prisma 7.x patch release (or a stabilized 8.0) that bumps `mysql2`/`deepmerge-ts` — revisit
next time `package.json` dependencies are touched.
**Trigger type:** Task-sequenced
**Sequenced into:** T3.2 (Server-side scoring function, `docs/tasks/03-diagnostic.md`) — the
next confirmed `package.json` touch after T1.4 (same grep-across-`docs/tasks/*.md` check as
the ESLint entry above), already installing Vitest there anyway — see that task's session-04
addendum.

**Re-checked (session 04, 2026-09-05, T1.4):** `npm info prisma version` /
`@prisma/client version` / `@prisma/adapter-pg version` all still report `7.10.0` as latest
stable; npm's `latest` dist-tag for `prisma` is still `8.0.0-rc.13` (a pre-release, unchanged
from T1.2). `npm audit --json` still reports the same 4 high-severity advisories via the same
`mysql2`/`deepmerge-ts` chain, with the same `npm audit fix --force` "fix" (downgrade to
`6.19.3`) still the only automated option — still rejected for the same reason. No action
taken; nothing has changed since T1.2.

---

## GitHub-connected Railway auto-deploy

**Status:** Resolved
**Date raised:** 2026-09-04
**Date resolved:** 2026-09-04 (same session, after the human pushed `main` to `origin`)
**Reason:** T1.1's "main deploys automatically on push" acceptance criterion needed
`railway service source connect`, which requires `main` to already exist on GitHub — agents
never push directly (CLAUDE.md Git Commit Protocol), so this waited on the human's push.
**Impact:** T1.1's auto-deploy acceptance criterion was not satisfied until resolved.
`railway up` (manual CLI upload) was the fallback deploy path in the meantime.
**Priority:** N/A — resolved
**Possible Fix/Fixes:** `railway service source connect --repo
KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website --branch main`, run once `main` existed on
GitHub.
**Resolution:** Ran successfully; connecting the source triggered an immediate GitHub-sourced
build (deployment `3e469209...`), which reached `SUCCESS`, and the live URL
(https://kaalbert.up.railway.app) was confirmed 200 afterward — end-to-end proof the
push-triggered path works, not just that the connection command succeeded. Kept here (rather
than deleted) as a record that this was verified, not assumed.
**Trigger type:** N/A — resolved
**Sequenced into:** T1.1 (already complete — this closes its last open acceptance criterion
alongside the Cloudflare item below, which remains open)

## kaalbert.com not registered — Cloudflare-fronted domain not yet in place (ADR 0004)

**Status:** Open
**Date raised:** 2026-09-04
**Reason:** T1.1's acceptance criterion "the live URL resolves through Cloudflare, not
Railway's raw domain" can't be met — WHOIS confirms `kaalbert.com` isn't registered, and
Cloudflare has no zone to front without a real domain. User chose to finish the rest of T1.1
and defer this rather than register a placeholder domain.
**Impact:** T1.1's Cloudflare acceptance criterion is not satisfied. No functional impact
yet — purely a domain-registration/DNS step, not a code change. Live app is currently only
reachable at `https://kaalbert.up.railway.app` (Railway's raw domain).
**Priority:** Medium — blocks a T1.1 acceptance criterion but not any other task's start.
**Possible Fix/Fixes:** Once `kaalbert.com` (or a decided interim domain) is registered: add
it to Cloudflare, point DNS at the Railway service, add it as a custom domain via `railway
domain kaalbert.com`.
**Trigger type:** User-triggered, not task-sequenced — domain registration is a real-world
purchase only the user can make (an agent can't initiate it). Do not treat reaching T1.1 (or
any task) as a cue to act; wait for the user to say the domain is registered and ask for this
explicitly.
**Sequenced into:** T1.1 (docs/tasks/01-foundation.md — addendum added session 01,
2026-09-04, explicitly marked user-triggered)
