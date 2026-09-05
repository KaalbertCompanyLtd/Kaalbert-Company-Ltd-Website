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
