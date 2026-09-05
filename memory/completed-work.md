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
**Summary:** Initialized the git repo at `Website Build/` (the actual repo root — the
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
