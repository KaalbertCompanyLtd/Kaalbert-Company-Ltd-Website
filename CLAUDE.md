# CLAUDE.md

## Project

**kaalbert.com** — the qualification-and-authority website for Kaalbert & Company Ltd, a
Ghana-rooted business advisory firm. Not a brochure site: it is built around two conversion
instruments — a public, scored Business Health Check diagnostic completable in under six
minutes, and an Insights publishing engine — surrounded by three fee-transparent core offer
pages, a capabilities overview, and a full paid-advertising measurement layer so every
enquiry traces back to the page, article, or advertisement that produced it. See
`docs/vision.md` for the full picture, `docs/roadmap.md` and `docs/tasks/*.md` for what to
build and in what order, `docs/dashboard.md` for current project status.

## Tech Stack

- **Language/runtime:** TypeScript on Node.js (ADR 0002) — one language across the app, the
  admin UI, and the API.
- **Framework:** Next.js, App Router (ADR 0002) — one codebase for the public site, the
  diagnostic, and the hand-built `/admin` area.
- **Database:** PostgreSQL, Railway's own bundled, always-on instance (ADR 0003).
- **ORM:** Prisma (`docs/research/runtime-framework-and-admin.md`) — schema designed from
  scratch, no product-owned data model.
- **Hosting:** Railway, single deploy target, no dual-host portability design (ADR 0003, ADR
  0008).
- **CDN/proxy:** Cloudflare, free tier, DNS/proxy in front of Railway (ADR 0004). Object
  storage: Cloudflare R2, added once media volume justifies it.
- **Styling/components:** Tailwind CSS v4, CSS-first (`@theme` directive, **no**
  `tailwind.config.js`) + shadcn/ui generated on Base UI (not Radix) + Lucide icons (ADR
  0010). Design tokens live in `ui/design-system.md` and the app's global stylesheet — do not
  introduce a color, radius, or font outside that token set.
- **Admin auth:** Hand-built login + TOTP two-factor (a vetted library for the RFC 6238
  core only — never hand-rolled crypto) (ADR 0007).
- **Diagnostic engine:** Custom in-app module, data-driven (questions/dimensions/weights/
  thresholds are data, never hard-coded logic) (ADR 0005).
- **Measurement:** Google Tag Manager as the single container; hand-written `dataLayer`
  pushes; a custom server-side Meta Conversions API integration (ADR 0006). Never a
  hard-coded tag outside GTM.
- **Testing:** Vitest + React Testing Library for unit/component tests; Playwright Test for
  end-to-end flows (reusing the Playwright toolchain already required for interactive
  verification, see MCP Server Setup below).
- **Lint/format:** ESLint (`eslint-config-next`) + Prettier.
- **Package manager:** npm.

**The one rule everything above follows** (ADR 0001, restated because it governs every
future dependency choice too): packages and external APIs are building blocks inside code
this team writes and owns. No product — a CMS, a booking widget, a hosted checkout page, an
identity service — is ever allowed to own the admin UI, the data model, or the routes.
Infrastructure (hosting, database, CDN, object storage) is the deliberate exception to that
rule: using a managed platform to run custom code is not the same as depending on a
pre-built product to define what that code does.

## Essential Commands

```bash
npm install                      # install dependencies
npm run dev                      # start the dev server (Next.js, localhost:3000)
npm run build                    # production build
npm start                        # run the production build locally

npm run lint                     # ESLint — must exit 0 across the whole tree
npm run format                   # Prettier --write
npm run format:check             # Prettier --check (used by the lint gate / pre-push hook)
npm run typecheck                # `next typegen && tsc --noEmit` — see Next.js 16 note below

npm run test                     # Vitest — unit/component tests
npm run test:e2e                 # Playwright Test — end-to-end flows

npx prisma migrate dev           # apply a new migration in development
npx prisma generate              # regenerate the Prisma client after a schema change
npx prisma studio                # inspect the database visually
npm run db:seed                  # run the project's seed script (per-epic seed data,
                                  # see each docs/tasks/*.md task's seed step)
```

## Folder Structure

```
app/                  # Next.js App Router — public routes, /admin, /portal, API routes
  (public)/           # public site route group — home, offers, capabilities, our-method,
                       # about, contact, legal, insights, diagnostic, landing pages
  admin/               # authenticated partner admin area
  api/                 # route handlers (diagnostic submit, contact submit, admin CRUD, etc.)
components/            # shared React components — SiteHeader/SiteFooter, shadcn/ui-derived
                       # primitives, feature-specific components; see ui/components.md
lib/                   # scoring engine, auth/session logic, email utility, measurement
                       # helpers, Prisma client singleton — framework-agnostic application logic
prisma/                # schema.prisma, migrations/, seed.ts
public/                # static assets — public/brand/ holds the real logo files the
                       # mockups reference
docs/                  # the full planning record — READ THIS FIRST for any non-trivial task
  vision.md, requirements.md, user-stories.md, scope.md   # Phase 1
  research/            # Phase 2 — technology decisions with live-pricing sourcing
  architecture.md, adr/                                    # Phase 3
  features/            # Phase 4 — one file per feature, the data/interface contract to build to
  sessions/            # session summary files, one per working session (see Session Management)
ui/                     # Phase 5 — design-system.md, components.md, screen-inventory.md,
                       # and mockups/ (accepted, authoritative HTML wireframes — build to
                       # these, don't re-derive layout from feature docs)
memory/                 # persistent knowledge — see Knowledge Management Responsibilities
.claude/commands/       # /task and /review slash commands
```

## Code Conventions and Standards

- **The mockups are authoritative.** Every UI task in `docs/tasks/*.md` cites its mockup
  file under `ui/mockups/`. Build to that file's structure and copy; don't invent layout.
  Where a screen has no dedicated mockup, the task names which built screen's pattern to
  infer from (`ui/screen-inventory.md`'s "Can be inferred" mapping) — never guess fresh.
- **Feature docs (`docs/features/*.md`) are the data/interface contract.** Entity shapes,
  business rules, and edge cases documented there are not optional — they were written from
  a full requirements audit specifically so nothing gets discovered missing mid-build.
- Business logic lives in `lib/`, never inside a route handler or a React component beyond
  what's needed to call into `lib/` and render the result. A route handler validates input,
  calls a `lib/` function, and shapes the response — it does not itself contain scoring
  logic, auth logic, or business rules.
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  Prisma schema field of the same name — don't rename during implementation without updating
  the feature doc to match.
- Fee amounts are always a structured min/max band with a scope cap — never a single number,
  never free text (the `offer.fee_amount_min`/`fee_amount_max` pattern, fixed once already
  during planning specifically because it was wrong as a single field).
- Content the firm can change (contact details, response-time commitment, fee bands, page
  copy) is never hard-coded — it lives in the database, edited via `/admin`, per
  `docs/features/content-management-admin.md`.
- Diagnostic scoring configuration (questions, dimensions, weights, thresholds) is data, not
  logic (FR-2.2, ADR 0005) — the scoring _algorithm_ is a developer change; scoring _values_
  are an admin edit.
- Accessibility: WCAG 2.1 AA (NFR-2) is a hard requirement, not aspirational — Base UI's
  primitives exist specifically to make this achievable without hand-building ARIA/focus
  management; use them rather than a bare `<div>` for anything interactive.

## Quality Gates (must pass before every commit)

- `npm run lint` — ESLint, must exit 0 across the **whole tree**, not just changed files.
- `npm run format:check` — Prettier, must report no unformatted files.
- `npx tsc --noEmit` — must pass with zero errors.
- `npm run test` — Vitest suite must pass.
- Any task touching a real, runnable interface must be exercised for real via Playwright MCP
  (see MCP Server Setup below) before being called done — static analysis and mocked tests
  are not a substitute for watching the actual page/flow work.

A pre-push hook (see Lint/Format Configuration, set up in this same phase) runs lint,
format-check, type-check, and tests, and blocks the push if any fail — this is the mechanical
backstop for the checklist above, not a replacement for running it yourself first.

## Verifying a Change Against the Real Running Project

This is a **web app** — the configured verification tool is **Playwright MCP**
(`@playwright/mcp`, see MCP Server Setup below), enabled by default in `.mcp.json`.

1. Start the dev server: `npm run dev` (or use an already-running instance — check before
   starting a second one).
2. Use Playwright MCP to navigate to the real route you changed, interact with it as a real
   visitor or partner would (click through the diagnostic flow, submit a form, log into
   `/admin`, edit an offer), and confirm the actual rendered/functional result — not just
   that a test file passes.
3. For a visual/layout claim specifically, take a screenshot or read computed styles rather
   than re-reading the source and asserting it must look right — source and rendered output
   have diverged before on this project.
4. If Playwright MCP isn't usable in the current session (e.g. it was just added to
   `.mcp.json` and needs the restart+approval step a human must do), say so explicitly and
   fall back to the next-best real check (`curl` against an API route, manually inspecting a
   dev-server response) — never silently skip verification or claim it was done.

## Things NOT to Do

- Do not add a CMS, headless CMS, page-builder, or any product that would own the admin UI,
  data model, or routes (ADR 0001). Libraries only, as components inside owned code.
- Do not hard-code a measurement/advertising tag outside GTM (Document 13.03, Section 11.1
  — an explicit, contractual requirement, not a style preference).
- Do not store a fee as a single amount or as free text — always the structured min/max +
  currency + scope-cap shape.
- Do not build a Phase 2 (gated) capability — Booking, Case Studies, Client Portal, Payment,
  Training, CRM, Paid Diagnostic Suite — until `docs/roadmap.md`/`scope.md` confirms its
  specific evidence trigger has actually been met and the user has said to proceed. They are
  fully planned in `docs/tasks/10-16*.md`; planned is not the same as scheduled.
- Do not design or test the application as portable to a second hosting provider (ADR 0008)
  — ordinary env-var-based configuration is fine; actively building dual-host support is not.
- Do not hand-roll TOTP/password cryptography — use the vetted library named in
  `docs/features/admin-authentication.md` for the cryptographic core only; everything around
  it (UI, session handling, enforcement) is hand-built.
- Do not invent a scoring algorithm change disguised as a "configuration" edit — see the
  Diagnostic Configuration values-vs-logic boundary in `docs/features/business-health-check-
diagnostic.md` and `docs/features/content-management-admin.md`.
- Do not build the personal-data-deletion endpoint for a _converted_ enquiry
  (`docs/tasks/08-enquiry-management.md`, T8.4) or resolve the paid-diagnostic-suite refund
  policy (`docs/tasks/16-paid-diagnostic-suite.md`) without an explicit firm-policy answer
  first — both are flagged blockers in `docs/dashboard.md`, not engineering calls to make
  unilaterally.
- Do not fabricate legal text, diagnostic question wording, or any firm-supplied content —
  where real source content doesn't exist yet, seed it as clearly flagged placeholder
  (`is_placeholder` convention, see `docs/tasks/02-public-presentation.md` T2.9) and surface
  it as pending in `memory/known-bugs.md` or the relevant session summary, never present it
  as final.
- Do not `git push` from inside an agent session — blocked in `.claude/settings.json` by
  design (see Git Commit Protocol).

## Auth Pattern

Two independent auth surfaces, both hand-built, both extending the same core pattern (ADR
0007, ADR 0009):

- **Admin (`/admin`):** email + password (bcrypt/argon2 hash) → TOTP challenge (RFC 6238 via
  a vetted library) → session cookie. No admin route is reachable without a TOTP-verified
  session — enforced server-side on every request, never assumed from client-side routing.
  Session policy: 30 minutes inactivity, 12 hours absolute lifetime (decided in Phase 6 task
  planning, see `memory/decision-log.md`). Backup codes (single-use) cover lost-device
  recovery; a lost device _and_ lost backup codes requires another administrator to reset 2FA
  enrolment — there is no self-service 2FA bypass anywhere in this system.
- **Client portal (`/portal`, Phase 2/gated):** same underlying system extended with a
  `client` role and per-engagement scoping (ADR 0009, preliminary — a confidentiality/
  security review is a hard precondition before this is built at all, see
  `docs/tasks/12-client-portal.md` T12.1).

Use `lib/auth` (once scaffolded) for session verification in any route handler or Server
Component that touches admin or portal data — never re-implement session-checking logic
per-route.

**Next.js 16 note:** this project scaffolded on Next.js 16 (T1.1), where `middleware.ts` is
deprecated in favour of `app/proxy.ts` (a `proxy` function, running on the Node.js runtime by
default, not Edge). Any route-level enforcement for `/admin` or `/portal` session checks —
the "never assumed from client-side routing" requirement above — must be implemented in
`app/proxy.ts`, never `middleware.ts`: a stray `middleware.ts` is silently ignored at build
time with no error, which would make auth enforcement silently stop running.

**Next.js 16 note (typed routes):** plain `tsc --noEmit` fails on a fresh checkout —
`app/layout.tsx`'s `LayoutProps<'/'>` (and other typed-route helpers) are ambient types Next
generates into `.next/types/`, which don't exist until a build/dev run. Always type-check via
`npm run typecheck` (`next typegen && tsc --noEmit`), never bare `tsc --noEmit` — this is
wired into the `typecheck` script, the pre-push hook, and CI (`.github/workflows/ci.yml`)
already; keep any new type-check invocation consistent with it.

## Recurring Patterns

- **Content the firm can edit lives in the database, read live by every surface that
  displays it, edited once in `/admin`.** The Site Settings singleton (phone/WhatsApp/email/
  address/response-time) is the canonical example: SiteFooter, `/contact`, and every
  `WhatsAppLinkButton` all read the same record — never a second hard-coded copy anywhere.
- **The "one nav entry, second screen via inline link" pattern**: a subordinate concept
  (Diagnostic Configuration's question detail, Performance Overview's per-platform screen,
  Categories reached from Articles) gets its own screen but not its own top-level sidebar
  item — reached by a link from its parent screen instead.
  reached
- **The shared generic `page` entity** (hero_kicker/hero_heading/hero_lead/meta_title/
  meta_description, +`intro_copy` where a page has it) is the home for a marketing page's own
  copy when it has no other entity to attach to (Capabilities, Our Method) — check whether a
  new marketing page fits this pattern before inventing a new one-off entity.
- **Every public page type carries `meta_title`/`meta_description`**, and OG/Twitter tags +
  JSON-LD structured data per `docs/features/seo-and-search-foundation.md` — this is part of
  a page being "done," not a follow-up task.
- **Every conversion moment fires through the existing GTM `dataLayer` pattern** — the six
  fixed events (diagnostic started/completed, summary requested, checklist downloaded,
  enquiry submitted, WhatsApp opened) plus any Phase 2 addition (`consultation_booked`,
  `payment_completed`, `training_registered`) — never a new, separate measurement mechanism.

## Knowledge Management Responsibilities

Agents must treat repository documentation as the primary source of truth.

When work changes project knowledge:

- Update memory/completed-work.md
- Update memory/decision-log.md when decisions are made
- Update memory/architecture-decisions.md when architectural decisions change
- Update docs/architecture.md when system architecture changes
- Update relevant feature specifications when requirements evolve
- Update memory/technical-debt.md when shortcuts or compromises are introduced
- Update memory/known-bugs.md when unresolved issues remain

Do not rely on conversation history as project memory.

Documentation and memory updates are part of task completion.

A task is not considered complete until required documentation updates have been made.

### Capture durable rules the moment you meet them (prevent knowledge loss)

As the project grows, hard-won facts get forgotten between sessions and the same
regressions recur. Whenever you discover — or the user gives you — a rule, gate,
convention, or gotcha that will matter beyond the current task, record it immediately in
the same session, in the right place:

- CLAUDE.md — for anything that changes how work is done every time: a required
  command/quality gate, a coding convention, a workflow step, a recurring pitfall. Put it
  in the section it belongs to (Commands, Code Conventions, Checklist, CRITICAL: Never
  Violate, etc.) so it is in front of every future agent.
- MEMORY.md (+ a memory/<slug>.md file) — for user preferences, feedback, and project
  facts not derivable from the code.
- memory/technical-debt.md / memory/known-bugs.md / memory/decision-log.md — for
  shortcuts, unresolved issues, and decisions respectively.

If you catch yourself thinking "I'll remember this" or "next time I should…", that is the
signal to write it down now. Prefer updating an existing entry over adding a duplicate.
Treat this capture step as part of task completion — a rule that only lives in the
conversation is already lost.

## Rollback/Revision Protocol

When a previous decision needs to be reversed or significantly changed during implementation:

1. Create a new ADR that supersedes the old one, with:
   - Status: "Superseded by ADR [N+1]"
   - Explanation of why the original decision is being reversed
   - New decision and reasoning
2. Update all affected artifacts (architecture.md, relevant feature specs, etc.)
3. Add an entry in `memory/decision-log.md` explaining the reversal and why
4. If the change affects tasks already completed, add a note to `memory/technical-debt.md` unless the work is being re-done immediately

Example ADR supersedence format:

```md
# ADR 5: [New Title]

Status: Accepted
Supersedes: ADR 2
Context: [Original ADR 2 decision is causing problems because...]
Decision: [New decision]
Consequences: [What changes, what remains]
```

**This project's ADR 0009 is the concrete case to watch**: it is explicitly preliminary and
_must_ go through this exact protocol (reaffirm or supersede) the moment Phase 2 client-portal
build work actually begins — that is not hypothetical, it is a documented precondition.

## Deprecation Handling

### When You Encounter a Deprecation

If you discover a deprecated API, pattern, or package during implementation:

1. **Note it in `memory/technical-debt.md`** with:
   - What is deprecated
   - The current recommended alternative
   - Impact level (critical/high/medium/low)
   - Timeline for migration (if known)

2. **Update this section** by adding a new row to the deprecation table below

3. **Update the affected documentation** to reflect the new recommended approach

4. **If the deprecation is critical**, create a new ADR documenting the migration decision

**Deprecation table:**

| Deprecated                        | Alternative | Impact | Migration timeline |
| --------------------------------- | ----------- | ------ | ------------------ |
| _(none yet — pre-implementation)_ |             |        |                    |

(Already avoided during planning: `@modelcontextprotocol/server-puppeteer` — npm-flagged
deprecated/unsupported — in favor of Playwright MCP, per `docs/research/verification-
tooling.md`. Recorded here as the pattern to repeat, not as a table entry, since it was never
adopted in the first place.)

## Task Completion Checklist

Before marking work complete:

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
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>
```

Work is not complete until all applicable items are addressed.

## Git Commit Protocol

### When to commit

Commit once per completed task — after every item in the Task Completion
Checklist above has been satisfied. Never commit mid-task, never commit
untested code, never commit to fix a previous broken commit.

The commit sequence for every task is:

1. All checklist items pass
2. `git add` only the files changed by this task
3. `git commit` with the message format below
4. Write the session summary file
5. Stop — do not begin the next task in the same session

### Commit message format

```
<type>(T##-##): <short description>
```

Types: `feat` (feature/capability), `chore` (setup/config/scaffolding),
`fix` (bug fix), `test` (tests only), `docs` (memory/session files),
`refactor` (restructuring without behaviour change).

Examples:

```
chore(T01-01): scaffold Next.js app and deploy pipeline
feat(T03-05): add diagnostic submit endpoint with server-side scoring
test(T03-02): add scoring engine unit tests for threshold edge cases
docs(T02-01): update memory/completed-work.md for session 03
chore(T01-02): regenerate Prisma client after schema migration
```

### Co-authorship trailer

Never add `Co-Authored-By:` trailers to commit messages. Commit messages
contain only the type, task ID, and description. Nothing else.

### What to include in the commit

Include only files directly produced by this task: implementation files,
test files, migration files, memory file updates, session summary file.
Any generated artifacts (Prisma client, etc.) get their own separate commit,
e.g. `chore(T##-##): regenerate Prisma client and migration`.

### What never gets committed

Secrets and local-only files (`.env`, `.env.local`, `CLAUDE.local.md`) and build/dependency
artifacts (`node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`) — all covered by
`.gitignore`. Never include files from a different task in the same commit.

### Pushing to remote

`git push` must be blocked in `.claude/settings.json`. Claude Code commits
locally only. The developer reviews with `git log --oneline` and pushes
manually. This is the review gate between agent work and the remote repo.

## MCP Server Setup

This project uses MCP (Model Context Protocol) servers to extend agent capabilities.

**Config file location — do not get this wrong:** Claude Code's actual project-scope MCP
config file is **`.mcp.json` at the repository root.** It is _not_ `.claude/mcp.json` or
anything else under `.claude/` — Claude Code does not read any file in that directory for
server registration. A project whose config lives at the wrong path will have every server
silently fail to appear, with no error surfaced to the agent.

**Verify the file is actually being read** as part of setup: run `claude mcp list` in a
plain terminal, not nested inside an agent's own Bash tool. A correctly-registered server
shows as connected or **"⏸ Pending approval (run `claude` to approve)"**; a server absent
from the list entirely means the file is in the wrong place or isn't valid JSON.

**Newly added or changed servers need two things before they're usable:** a session
restart, _and_ explicit approval at the resulting startup prompt — an editing agent cannot
do either from inside its own session, so both fall to the human operator every time this
file changes.

### Essential Servers (Always Enabled)

These servers are configured in the root `.mcp.json` and should remain enabled:

- **Filesystem**: Required for reading and writing project files. Do not disable.
- **GitHub**: Required for version control operations (once the repo has a GitHub remote —
  omit/remove this server's block from `.mcp.json` until then, since it needs a real
  `GITHUB_PERSONAL_ACCESS_TOKEN`). Do not disable once added.
- **Database (PostgreSQL)**: Schema inspection and debugging against Railway's Postgres.
  Keep enabled — this project is DB-backed throughout.
- **Playwright MCP**: Verifies every real page/flow for real — the diagnostic's multi-step
  flow, the admin CMS usability bar (AC-6), cross-browser functional walkthroughs (AC-8).
  On by default per `docs/research/verification-tooling.md` — this project's stated,
  non-optional choice for a web app, over the deprecated Puppeteer MCP server.

### Visual & Interactive Verification (Always Enabled)

This is a web app (server-rendered/SPA via Next.js). "It typechecks and the unit tests
pass" is not the same claim as "I ran it and watched it work" — every task that touches a
real page, form, or admin screen must be exercised through Playwright MCP before being
called done (see Task Completion Checklist above).

**Setup:**

- Present in `.mcp.json` by default (see below) — no extra setup step for an agent to
  remember to turn it on.
- Points at a browser already installed on the build host via `--executable-path`, rather
  than assuming a fresh Chromium download succeeds in every sandboxed environment. If no
  system browser is available, fall back to `npx playwright install chromium` once, ahead of
  time, and drop `--executable-path`.
- **Adding/changing this server takes effect only after a session restart AND human
  approval at the startup prompt** — an agent that just edited `.mcp.json` cannot use the new
  tool in that same conversation; fall back to `curl`/direct shell invocation for the current
  task and leave the tool ready for the next session.
- Core operations an agent will use most: navigate to a URL, click, type/fill a form,
  snapshot the accessibility tree, screenshot a region for visual claims — see the tool's own
  descriptions when it's loaded; don't re-derive its interface from scratch each session.

### Optional Servers (Enable When Needed)

Not present in `.mcp.json` today. Add each one's real JSON block only at the point it's
actually needed, then restart + approve:

- **Sequential Thinking**: for complex architectural decisions or multi-step refactoring.
- **Fetch**: for reading external documentation or API references.
- **Linear** or **Jira**: for issue tracking integration, if the firm/vendor adopts one.
- **Figma**: for design token/spec reading, if mockups ever move into Figma instead of
  staying as the HTML files under `ui/mockups/`.

### Server Setup Instructions

**Filesystem Server:**

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

No additional configuration required.

**GitHub server** (once a remote exists):

```bash
npm install -g @modelcontextprotocol/server-github
```

Set `GITHUB_PERSONAL_ACCESS_TOKEN` in your real shell environment (`~/.bashrc`/`~/.zshrc`),
then reference it in `.mcp.json` via `${GITHUB_PERSONAL_ACCESS_TOKEN}` — never a literal
token value or placeholder string.

**Database Server (PostgreSQL):**

```bash
npm install -g @modelcontextprotocol/server-postgres
```

Set `DATABASE_URL` in your real shell environment and reference it as `${DATABASE_URL}` in
`.mcp.json` — same rule as above.

**Playwright MCP:**

```bash
# No global install needed — .mcp.json runs it via npx, e.g.:
npx -y @playwright/mcp@latest --browser chrome --executable-path <path-to-installed-browser> --headless --isolated
```

Adjust `--browser`/`--executable-path` to whatever browser is actually installed on the
build host.

### When to Use MCP Servers

- Always start with the Filesystem server enabled.
- Enable the GitHub server once this repo has a real remote and PRs are in play.
- Enable the Database server when debugging data issues or inspecting schema state.
- Use Playwright MCP whenever a task's completion checklist calls for confirming a change
  actually works — it's enabled by default, no extra setup needed.
- Enable other (Optional) servers only when their specific capabilities are required.

### MCP Discipline

- Remove servers not actively in use from `.mcp.json` entirely to reduce context noise —
  except Filesystem and Playwright MCP, which stay present by default.
- Never use MCP servers to modify production data or infrastructure.
- Prefer reading from the Filesystem over relying on conversation history.

## Session Management

At the end of every working session — or when a conversation is getting long — automatically produce a session summary file without being asked.

### When to Write a Session File

- After completing one or more tasks
- When switching to a significantly different area of the codebase
- When the conversation context is becoming long
- When stopping work for the day

### How to Name the File

```
docs/sessions/session-NN-<short-topic>.md
```

Where `NN` is the next sequential number (check existing files in `docs/sessions/` to determine it) and `<short-topic>` is 2–4 words describing what was done.

Examples:

- `session-01-django-init.md`
- `session-02-user-model-auth.md`
- `session-03-project-milestone-api.md`

### Session File Format

````md
# Session NN — [Topic]

# Date: YYYY-MM-DD

# Tasks completed: T##-## [, T##-##]

## What Was Built

[2–3 sentences describing what was implemented this session.]

## Files Changed

- path/to/file.<ext> — what was added or changed
- path/to/another — what was added or changed
- ...

## Decisions Made

- [Any deviation from the plan, or choice between options, with one-line reasoning]
- [If none: "No deviations from plan."]

## Current State

[One sentence describing where the project stands, e.g. "Core module scaffolded and unit-tested, ready for T01-03."]

## Blockers

[Any unresolved issues, or "None."]

## Next Task

T##-## — [Task title]
File: docs/tasks/[epic-file].md

## Paste This to Continue

```
[Output of /task T##-## goes here — the full generated prompt for the next task,
not a bare instruction. Run /task [NEXT_TASK_ID] and paste its entire output here.]
```

### Rules for Session Files

- Write the session file **before** ending the conversation — not after
- The "Paste This to Continue" block must contain the full output of `/task [NEXT_TASK_ID]` — not a bare "read CLAUDE.md and continue" line. Run the `/task` command for the next task and paste its complete output into the block.
- A new Claude Code session pasting the block gets full task context, architecture constraints, acceptance criteria, coding standards, and documentation requirements — everything needed to begin immediately without reading additional files first.
- Never rely on the conversation history to carry context between sessions; the session file is the handoff
- If multiple tasks were completed in one session, list all of them under "Tasks completed" and summarize all files changed
````
