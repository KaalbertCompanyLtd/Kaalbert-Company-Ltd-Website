# Known Bugs

Newest entry at the top, added the moment a bug is found (never held until a "cleanup
session"). Entries below follow this format, one per bug — see CLAUDE.md's "Memory file
format and ordering" section for the exact field rules and the sequencing requirement:

## <Bug Title>

**Status:** Open | Fixed
**Severity:**
**Date found:** YYYY-MM-DD
**Description:**
**Workaround:**
**Planned Fix:**
**Sequenced into:** T##-## (task name) — required whenever a Planned Fix exists

---

## Production `kaalbert-web` Railway service was missing `ADMIN_CHALLENGE_TOKEN_SECRET`/`ADMIN_TOTP_ENCRYPTION_KEY` entirely — every real admin login attempt hard-errored

**Status:** Fixed
**Severity:** High
**Date found:** 2026-09-11 (R2 provisioning session, session 54)
**Date fixed:** 2026-09-12 (session 60) — confirmed live, not just assumed from the deploy
timeline: the user confirmed a real redeploy happened after the variables were set that
session, and this session found the live deployment currently serving traffic
(`8bb479ae...`, `2026-09-11 22:40:34`, `SUCCESS`) postdates the `railway variable set`
call — the same deployment `GET /admin/login` already returned a clean `200` on (not the
crash this bug describes). `.railway/railway.ts` was also missing `preserve()` for both
variables (and all five `CLOUDFLARE_R2_*` ones) — fixed the same session (T2.8 follow-up
commit) so a future `railway config apply` can no longer delete them, closing the underlying
process gap that let this happen in the first place.
**Description:** Discovered while checking the live Railway service's variables before adding
Cloudflare R2 credentials there: `ADMIN_CHALLENGE_TOKEN_SECRET` (`lib/auth/challenge-token.ts`)
and `ADMIN_TOTP_ENCRYPTION_KEY` (`lib/auth/totp-encryption.ts`) were never set on the live
`kaalbert-web` service at all — only in `.env.local`/`.env.production` (both gitignored,
neither read by the deployed app, per ADR 0008). Both files throw a hard `Error` the instant
either is read with no value set (confirmed by reading each file's own guard clause), meaning
`/admin/login` and every TOTP-touching request has been throwing in production since
Milestone 6 shipped — no real partner could have logged in against the live site at any point
until this was found. CLAUDE.local.md's own prior text said production "needs its own
separately-generated value set directly on the `kaalbert-web` Railway service" for both, but
that step was apparently never actually carried out, and nothing in this project's own
`docs/dashboard.md`/session summaries flagged it as still-pending — a real gap in how a
"needs to be done separately on Railway" note was tracked, not just a one-off miss.
**Workaround (historical):** None from the visitor/partner side — this genuinely blocked
every real login attempt until fixed. Session 54 generated two fresh, separately-random
values (never reused from either local `.env.*` file, matching this project's own
per-environment-secret convention) and set them on the live `kaalbert-web` service via
`railway variable set ... --skip-deploys`, but couldn't self-approve the follow-up
`railway redeploy` needed to make them take effect.
**Resolution (session 60, 2026-09-12):** A redeploy did happen (the user's own normal push
after session 54, per this project's `source: github(...)` auto-deploy wiring) — no separate
`railway redeploy` was actually needed in the end. Confirmed via a real login test is still
the ideal final check, but the deployment-timeline evidence plus the user's own direct
confirmation that a redeploy occurred were treated as sufficient to close this out.
**Trigger type:** User-triggered (historical) — resolved by the user's own push/redeploy,
not by a future task reaching anything.
**Sequenced into:** No task — was, and remains, a direct operational fix, not tied to any
`docs/tasks/*.md` item.

---

## Article byline rendering (`lib/insights.ts`) has no `author.published` check

**Status:** Fixed
**Severity:** Low
**Date found:** 2026-09-11 (T7.6, session 49)
**Date fixed:** 2026-09-11 (T7.11, session 55)
**Description:** `lib/insights.ts`'s several `article.author` queries (index, related
articles, `lib/home.ts`'s featured-Insights section) and `app/insights/[slug]/page.tsx`'s
byline all read `author.name`/`author.practiceArea` directly with no `published` filter —
if an `author` row ever became unpublished (its required name/practice-area/
personal-statement fields cleared) while it still had existing articles, those articles'
bylines would keep showing that now-incomplete profile, contradicting
`content-management-admin.md`'s "never shown half-filled" principle and T7.6's own
acceptance criterion ("never appears... as an article byline"). Does not affect any real
data today — all 5 seeded authors are, and remain, published — this is a latent gap in the
rendering layer, not an observed failure.
**Workaround:** `lib/admin-authors.ts`'s `updateAuthor` (T7.6) closes the practical path to
this state: it refuses to save a change that would leave an author unpublished if that
author already has any articles, so an author with articles can never actually reach the
missing-required-field state through the admin editor. The rendering-layer gap remains
real, just currently unreachable through the one write path that exists.
**Planned Fix:** Either (a) have `lib/insights.ts`'s various author-including queries select
`published` and have `shapeArticleCard`/the detail-page byline fall back to a neutral
attribution (e.g. omit the byline, or credit "Kaalbert & Company Ltd") when `!author.
published`, or (b) formally decide bylines are exempt from the publish gate (an article, once
published, is a historical record and its byline should stay stable regardless of the
author's current profile state) and document that as the real rule instead. Needs a real
decision, not just a mechanical fix — flagged here rather than guessed at.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.11 (`docs/tasks/07-content-admin.md`) — corrected same session:
originally sequenced into a new T4.6 appended to `docs/tasks/04-insights.md`, but Milestone 4
had already fully shipped, so nothing would ever reach it. Moved into Milestone 7 (this
epic, still actively in progress) instead — see CLAUDE.md's tightened "Debt/bug fixes must be
sequenced into a task, never left orphaned" rule and `memory/decision-log.md` for the full
correction.
**Resolution (session 55):** The firm confirmed option (a)'s "credit 'Kaalbert & Company
Ltd'" variant (see `memory/decision-log.md`) — not option (b), and not the "omit entirely"
variant of (a). `lib/insights.ts`'s `shapeArticleCard` and `getArticleBySlug` now select
`author.published` and substitute `FIRM_NAME` (imported from `lib/seo.ts`, now exported) for
`authorName`, with `authorPracticeArea`/`title`/`bio`/`photoUrl` all blanked rather than
fabricated. `app/insights/[slug]/page.tsx` and `components/insights-article-card.tsx` treat
an empty `authorPracticeArea` as "omit the separator," and the article page's fuller,
bio-bearing byline block is hidden entirely for an unpublished author (no bio exists for the
firm itself to show). `lib/seo.ts`'s `getArticleJsonLd` now takes an `authorPublished` flag
and emits `@type: "Organization"` instead of `Person` with a blank `jobTitle` in that case —
a correctness fix beyond the task's own text, found while implementing (a real `Person`
schema.org author needs a name; crediting an organization as a `Person` is invalid
structured data). Verified live: an author's `published` flag was flipped directly in the
dev database (bypassing the admin's own protective validation, exactly the scenario this bug
describes), the article page/index card/JSON-LD were confirmed to show the firm-attribution
fallback correctly at desktop and mobile widths, then flipped back and confirmed the real
byline returned with no regression. Deliberately left `lib/articles.ts`'s admin Articles list
(`content-management-admin.md`'s internal partner-facing table) untouched — it shows the
real author name regardless of `published` for editorial/management purposes, a different
concern from the public-facing byline this task's own text is about.

---

## `proxy.ts` didn't allowlist T6.7's two new unauthenticated pages

**Status:** Fixed
**Severity:** High — the entire feature was completely unreachable by its only real audience
(an unauthenticated partner who forgot their password); compiled, typechecked, and linted
with zero errors, so nothing short of actually loading the page in a browser would ever have
caught it.
**Date found:** 2026-09-11 (T6.7, session 43 — found live-testing via Playwright MCP: clicking
`/admin/login`'s "Forgot password?" link, and navigating directly to `/admin/forgot-password`,
both silently redirected to `/admin/login` instead of rendering the new page.)
**Description:** `proxy.ts`'s `PUBLIC_ADMIN_PAGE_PATHS` set (added at T6.3, session 39) is the
explicit allowlist of `/admin/*` pages reachable without a session — `/admin/login` and
`/admin/setup-2fa` were the only two entries. T6.7 added two more unauthenticated pages
(`/admin/forgot-password`, `/admin/reset-password`) but the set was never updated, so
`proxy.ts`'s own fallback path (no valid session → redirect to `/admin/login`) caught both new
pages exactly as if they required authentication, even though neither one does or ever could
(an unauthenticated partner is the only visitor either page is ever reached by). The same
class of "looks correct in every static check, silently never actually reachable" failure as
the `app/proxy.ts`-vs-`proxy.ts` bug at T6.3.
**Workaround:** None needed — found and fixed in the same session, before commit.
**Planned Fix:** Added both new paths to `PUBLIC_ADMIN_PAGE_PATHS`; `proxy.ts`'s own
doc-comment now names this specific failure explicitly, as a standing note for the next
unauthenticated `/admin/*` page this project adds. Re-verified live afterward: both pages
render correctly, and the full self-service reset flow (request → email → confirm → old
password rejected → new password + TOTP logs in) works end-to-end.
**Sequenced into:** N/A — already fixed in this same session/commit (T06-07).

---

## `confirmTotpSetup` never retired a previous batch of unused backup codes

**Status:** Fixed
**Severity:** Medium — not a security hole in the classic sense (an old code was never
guessable by anyone but its original owner), but a real correctness gap: the "8 backup
codes" a partner is shown and told to save was never actually the _complete_ current set
once they re-enrolled more than once — stale codes from every earlier enrolment silently
stayed valid forever alongside each new batch.
**Date found:** 2026-09-10 (T6.4, session 40 — found live-testing the new backup-code
recovery flow: recovered with a code, completed re-enrolment, then inspected the database
directly and found the _previous_ enrolment's unused codes still sitting there, `usedAt:
null`, right next to the brand-new 8)
**Description:** `lib/auth/totp-setup.ts`'s `confirmTotpSetup` (T6.2) only ever
`createMany`'d a fresh batch of 8 backup codes on success — it never had a reason to do
otherwise, since at T6.2 it was only ever called once per account (first-time setup). T6.4
added a second real caller (forced re-enrolment after backup-code recovery), which exposed
that `confirmTotpSetup` doesn't know it might be running a second, third, or Nth time for
the same account — each call just added 8 more rows on top of whatever was already there.
**Workaround:** None needed — found and fixed in the same session, before commit.
**Planned Fix:** In the same transaction that flips `totp_enabled` and creates the new
batch, `confirmTotpSetup` now deletes every _unused_ `admin_backup_code` row for that
account first (`usedAt: null` — an already-used row is left alone, it's inert history, same
"never destroy a real usage record" precedent as `Subscriber.unsubscribedAt`). Confirmed for
real: ran two full recovery-then-re-enrolment cycles back to back and verified directly in
the database that only the codes actually _used_ across both cycles survived — every
unused leftover was gone after each new batch was created.
**Sequenced into:** T06-02 (follow-up — fixed same session as T06-04, see
`memory/completed-work.md`)

---

## `proxy.ts` written at `app/proxy.ts` never ran at all — no error, no warning

**Status:** Fixed
**Severity:** High — the exact failure mode this file exists to prevent: `/admin` (and every
route under it) was fully reachable with zero session check, silently, on the same commit
that was meant to make T6.3's own literal acceptance criterion ("no admin route reachable
without a valid session") true.
**Date found:** 2026-09-10 (T6.3, session 39 — caught by the Task Completion Checklist's own
"exercise it for real via Playwright MCP" requirement; a static read of the file would never
have caught this, since it compiles, type-checks, and lints cleanly at the wrong path)
**Description:** CLAUDE.md's own Auth Pattern section said route-level session enforcement
"must be implemented in `app/proxy.ts`." Wrote it there. `npm run dev` started clean, no
compile error, no console warning — and `GET /admin` with no session cookie returned 200
with the full authenticated dashboard shell, not a redirect. This project's own bundled
Next.js docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
proxy.md`) say plainly: "Create a `proxy.ts`... in the project root... so that it is located
at the same level as `pages` or `app`" — i.e. a sibling of `app/`, never a file inside it.
Next.js 16 simply never looks inside `app/` for this file at all; nothing about that failure
mode surfaces anywhere (no build warning, no dev-server log line, no lint rule) — the route
just silently stays unprotected forever, exactly like this project's own documented
`middleware.ts`-vs-`proxy.ts` naming trap, but one level more specific and not something
CLAUDE.md's existing note had covered.
**Workaround:** None needed — caught and fixed the same session, before any commit.
**Planned Fix:** Moved the file from `app/proxy.ts` to `proxy.ts` (project root); confirmed
via a real `curl`/Playwright navigation to `/admin` with no cookie that it now 307-redirects
to `/admin/login`. Corrected CLAUDE.md's own Next.js 16 note (the exact text that caused this)
to state the project-root location explicitly, with this bug cited as why it matters — see
`memory/decision-log.md` for the full correction.
**Sequenced into:** T06-03 (already fixed same session — see `memory/completed-work.md`)

---

## `prepare` script's bare `git config` broke the Railway production build

**Status:** Fixed
**Severity:** High — took down the production deploy pipeline entirely, not a degraded
page. `npm install` treats a failed lifecycle script as fatal, so this failed the whole
Railway build (`npm error command failed ... git config core.hooksPath .githooks`) on the
very next push after the pre-push hook was added.
**Date found:** 2026-09-10 (T1.1 follow-up, session 31 — surfaced by the user pasting the
Railway build log after pushing)
**Description:** `package.json`'s new `prepare` script ran a bare
`git config core.hooksPath .githooks` to wire up the tracked `.githooks/pre-push` hook.
That works for a developer's local clone (a real git checkout) but Railway's Railpack build
copies the repo contents into `/app` as a build context, not a git checkout — no `.git`
directory exists there — so `git config` exited 128 with `fatal: not in a git directory` and
took `npm install` (and the whole build) down with it.
**Workaround:** None needed — fixed same session before the next deploy attempt.
**Planned Fix:** Guarded the `prepare` script so it only runs `git config` when
`git rev-parse --is-inside-work-tree` succeeds, no-op (exit 0) otherwise:
`git rev-parse --is-inside-work-tree > /dev/null 2>&1 && git config core.hooksPath .githooks
|| exit 0`. Verified both branches: inside this repo it still sets `core.hooksPath`
correctly; run from a directory with no `.git` it exits 0 without error. Also documented as
a standing rule in CLAUDE.md's Code Conventions (git-dependent lifecycle scripts must guard
themselves) so this class of mistake isn't repeated by a future lifecycle-script change.
**Sequenced into:** T01-01 (already fixed same session — see `memory/completed-work.md`)

---

## Home page hard-coded "15–20 questions" instead of reading the real seeded question count

**Status:** Fixed
**Severity:** Low — cosmetic/staleness risk only, but a real one: once T7.7's config admin
lets a partner add/remove diagnostic questions, this fact on the home page would silently
drift out of sync with the truth, exactly the kind of "second hard-coded copy" CLAUDE.md's
Recurring Patterns section warns against for other content.
**Date found:** 2026-09-05 (T3.4, session 19 — flagged by the user, who pushed back after an
initial check only covered `/diagnostic` itself and missed this second, separate mention
elsewhere on the site)
**Description:** `app/(public)/page.tsx`'s diagnostic-teaser section (the "Find out where
your business really stands" dark band) rendered a fixed `<span>15–20 questions</span>` fact
alongside "Indication, not an assessment" and "Your responses stay confidential" — a plain
placeholder range from before T3.3 seeded any real question set. `/diagnostic` itself
already read the real count live (`{questions.length}` in its own H1/progress label,
correct from the start), but this second mention on the home page was never wired up.
**Workaround:** None needed.
**Planned Fix:** ~~Add a live count query and use it here too.~~ Done — added
`getActiveDiagnosticQuestionCount()` to `lib/diagnostic-flow.ts` (a plain
`prisma.diagnosticQuestion.count({ where: { active: true } })`, cheaper than fetching full
question rows just for a number), wired into `app/(public)/page.tsx`'s existing
`Promise.all` data fetch, replacing the hard-coded span with `{diagnosticQuestionCount}
questions`. Verified live: the rendered home page now shows "15 questions" (the real seeded
count), confirmed via Playwright MCP against the real running dev server. Searched the rest
of the site (`grep -rEn "[0-9]+(–|-)?[0-9]*\s*question"` across `app/`/`components/`/`lib/`)
for any other hard-coded question-count mention — none found.
**Sequenced into:** N/A — fixed in the same session it was found.

---

## `app/legal/[slug]/page.tsx` called `SiteHeader` with no `hasHero`, defaulting it wrongly `true` on a page with no hero

**Status:** Fixed
**Severity:** Medium — purely visual, but a real bar to legibility: `SiteHeader`'s
`hasHero: true` default renders the header transparent-until-scrolled, meant to sit over a
dark hero image/color; on legal pages (no hero at all, `ui/mockups/e-legal/*.html`'s plain
`<body>`) that made the nav render against the page's own light background at the top —
exactly the illegible state `hasHero={false}` exists to prevent (`components/site-
header.tsx`'s own doc-comment: "without a hero behind it, the header renders solid from the
first frame instead of transparent-until-scrolled").
**Date found:** 2026-09-05 (T3.4, session 19 — flagged by the user, who recalled the mistake
"slipped by me too until several sessions after" it was first introduced at T2.7)
**Description:** `app/legal/[slug]/page.tsx` (T2.7, `docs/tasks/02-public-presentation.md`)
rendered `<SiteHeader offerNavLinks={offerNavLinks} />` with no `hasHero` prop at all — right
next to a comment on the following line that correctly states "No hero — ui/mockups/e-legal/
*.html's plain `<body>`, per this task's own architecture constraint." The comment named the
right intent; the code never implemented it, because omitting `hasHero` doesn't mean
"no hero" — `SiteHeader`'s own default parameter is `hasHero = true`. Every other real page
in the app either genuinely has a hero (and passes `hasHero` — no bug) or is `/diagnostic`
(T3.4, this session, built with the fix already applied). Legal was the only page with this
specific mismatch between its own comment and its own code.
**Workaround:** None needed — trivial one-line fix.
**Planned Fix:** ~~Add `hasHero={false}` to the `SiteHeader` call.~~ Done — fixed directly in
this session; verified visually via Playwright MCP against the real running `/legal/privacy-
notice` route (header now renders solid/legible from the first frame, no scroll needed).
**Sequenced into:** N/A — fixed in the same session it was found.

## A "use client" component importing any value (not just a type) from a Prisma-touching `lib/` file silently breaks Turbopack's dev compile

**Status:** Fixed
**Severity:** High while open — the affected route 500s on every request, and the actual
cause never surfaces in any error message (Turbopack instead reports an unrelated
`ENOENT: ... build-manifest.json` on the route's very first compile attempt, then serves
that same cached failure forever until the whole dev server restarts).
**Date found:** 2026-09-05 (T3.4, session 19)
**Description:** `lib/diagnostic-flow.ts` originally held both `getActiveDiagnosticFlow`
(a server-only DB query importing `@/lib/prisma`, which builds a real `PrismaClient` +
driver adapter at module scope) and a set of plain, client-safe constants
(`DIAGNOSTIC_BOOLEAN_OPTIONS`, `DIAGNOSTIC_SCALE_OPTIONS`, `getChoiceOptions`) in one file.
`components/diagnostic-flow.tsx` ("use client") imported only the constants — a type-only
import of another symbol from the same file worked fine, but importing an actual _value_
pulled the entire module, including its `@/lib/prisma` import chain, into the client bundle.
Turbopack didn't report this as a bundling error at all: the affected route (`/diagnostic`,
and later an isolated throwaway test route) consistently 500'd with
`ENOENT: no such file or directory, open '.../build-manifest.json'` on its first-ever
compile in a fresh `.next` — a red herring pointing at manifest loading, not the real cause.
Confirmed via bisection: stripped the client component down to a bare stub (fixed, 200),
added back pieces one at a time (`useRouter`, `pushDataLayerEvent` — both fine, 200), then
re-added the value import from the mixed file alone — broke it again (500), isolating the
cause precisely.
**Workaround (while investigating):** None viable short of avoiding the import entirely —
this is why it took a real bisection to find, not a quick retry/restart (a full `.next`
wipe + server restart was tried repeatedly and made no difference).
**Planned Fix:** Split the file: `lib/diagnostic-flow-options.ts` (client-safe types/
constants, zero `@/lib/prisma` import) and `lib/diagnostic-flow.ts` (server-only,
`getActiveDiagnosticFlow`, imported only by the Server Component `app/diagnostic/page.tsx`).
**Sequenced into:** N/A — fixed in the same session it was found (T3.4). Worth remembering
for every later task with a client component reading option/lookup data that lives near a
DB-querying `lib/` module: keep client-safe exports in their own file, never mixed with a
`@/lib/prisma` import, regardless of which specific export the client component actually
uses.
