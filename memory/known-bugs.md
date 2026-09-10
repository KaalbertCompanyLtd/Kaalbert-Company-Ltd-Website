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
