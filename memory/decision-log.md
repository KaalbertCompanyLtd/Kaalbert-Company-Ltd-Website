# Decision Log

Newest entry at the top — see CLAUDE.md's "Memory file format and ordering" section.

## 2026-09-04 (T1.2)

**Summary:**

- **Postgres provisioned via Railway's own bundled plugin** (`railway add --database
postgres`), attached to the existing `kaalbert-web` project — per ADR 0003, confirmed with
  the user first since this is a real, billed resource (Railway Hobby plan $5/mo base +
  usage; small Postgres instances typically run $5–15/mo on top). User explicitly said "go
  ahead, provision it" before this ran.
- **Network topology: public TCP proxy for local dev, private network for production.**
  Railway's Postgres template only generates a private-network `DATABASE_URL`
  (`RAILWAY_PRIVATE_DOMAIN`-based, unreachable outside Railway). Created a public TCP proxy
  (`railway tcp-proxy create --port 5432 --service Postgres`) and built a public
  `DATABASE_URL` from `PGUSER`/`PGPASSWORD`/`PGDATABASE` + the proxy host:port for local
  `.env`. Separately set `DATABASE_URL=${{Postgres.DATABASE_URL}}` on the `kaalbert-web`
  service itself, so the deployed app connects over Railway's private network (no public
  exposure needed for production traffic). Real credentials were never printed into the
  conversation — fetched via `railway variables --json` into scratch files, read with `jq`,
  written straight to `.env`, then the scratch files were deleted immediately.
- **Prisma pinned to 7.10.0, not npm's `latest` tag** — `prisma`'s `latest` dist-tag
  currently points to a pre-release (`8.0.0-rc.13`) while `@prisma/client`'s `latest` is the
  stable `7.10.0`; installed both pinned to `7.10.0` (prisma's own `prev` tag) to avoid
  shipping an RC and to keep the CLI and client in lockstep.
- **Prisma 7 requires an explicit driver adapter** (`@prisma/adapter-pg` + `pg`) — the
  generated `PrismaClient` constructor no longer reads `DATABASE_URL` itself. Wired in both
  `lib/prisma.ts` (the app's singleton) and `prisma/seed.ts`.
- **Prisma's per-project AI-agent skill scaffold** (`.claude/skills/prisma-*`,
  `skills-lock.json`, `prisma7.config.ts`) is installed automatically by `prisma init` in
  Prisma 7 — this is official Prisma tooling, not something this session added deliberately.
  Also auto-installed near-duplicate copies under `.windsurf/skills/` and `.agents/skills/`;
  deleted both since this project only uses Claude Code (`AGENTS.md` already covers "any
  other agent" as a single doc, not a skills directory) and keeping three copies of the same
  content was pure repo bloat.
- **Baseline schema has zero models, deliberately** — per the task's explicit scope note
  ("not every epic's entities yet"). To still prove "a migration applies cleanly on a fresh
  database" without inventing a fake permanent entity or a fake permanent migration, ran a
  fully isolated smoke test (its own scratch `schema.prisma`/`prisma7.config.ts`/migrations
  folder, one throwaway model, against the same real Postgres instance): migration created
  and applied successfully, table confirmed via `psql`, then dropped and the scratch files
  deleted. The committed `prisma/schema.prisma` and `prisma/migrations/` are unaffected —
  zero models, zero migrations, exactly matching the task's stated scope.
- **Generated Prisma client output moved from Prisma's own default** (`app/generated/prisma`,
  inside the Next.js App Router tree) **to repo-root `generated/prisma`** — keeps generated
  code out of `app/` entirely; `lib/prisma.ts` (CLAUDE.md's designated home for the client
  singleton) imports from it instead.
- **`npm audit` flags 4 high-severity vulnerabilities, left unfixed** — both are transitive
  dependencies inside Prisma CLI's own dev-tooling tree (`mysql2`, `deepmerge-ts`), not
  reachable from this project's runtime code (we don't use MySQL). `npm audit fix --force`
  would downgrade `prisma` to `6.19.3`, the opposite of the RC-avoidance decision above. See
  `memory/technical-debt.md`.

## 2026-09-04

Multi-account git credential workflow established; GitHub-connected Railway auto-deploy
wired and verified. Closes out T1.1 (except the still-open Cloudflare/domain item — see
`memory/technical-debt.md`).

**Summary:**

- **Token exposure incident and fix**: a company GitHub PAT was briefly embedded in a
  remote URL and then exposed via an unredacted `git remote -v`. The token was revoked and
  regenerated. Root-caused and fixed properly rather than just rotated-and-moved-on: built a
  non-interactive, per-account git credential helper (`~/.git-credential-helpers/*.sh`,
  reading a token from `~/.secrets` fresh on every invocation, never caching or embedding it
  in a URL) wired via `~/.gitconfig`'s `[credential "https://github.com/<account>"]` blocks —
  the same pattern the user's existing personal accounts already used with
  `git-credential-libsecret`, adapted because libsecret needs one interactive prompt to seed
  the OS keyring, which isn't available from a Claude Code `!`-prefixed command (runs
  non-interactively; confirmed `~/.bashrc` skips sourcing `~/.secrets` for non-interactive
  shells, which was the root cause of an earlier "Invalid username or token" failure too).
  Generalized into a durable, account-agnostic workflow doc outside the repo at
  `~/Dev_Workspace/git-multi-account-workflow.md` (covers both the script-helper approach
  for automation and the libsecret approach for normal interactive terminal use), specifically
  so the user can apply the same pattern to future foreign-account repos without
  re-deriving it. Both `origin` and `personal` remotes on this repo now use clean URLs with
  no embedded credentials.
- **GitHub-connected Railway auto-deploy wired and verified end-to-end** — not just that
  `railway service source connect` returned success, but that connecting the source
  triggered a real GitHub-sourced build, which reached `SUCCESS`, and the live URL was
  confirmed 200 afterward. T1.1's "main deploys automatically on push" acceptance criterion
  is now genuinely satisfied.
- **Memory-file format and debt/bug-sequencing rules established** — at the user's explicit
  request, to keep future sessions from letting debt/bugs sit orphaned in memory with no
  path back into the task sequence. Written into CLAUDE.md's Knowledge Management
  Responsibilities section (new "Memory file format and ordering" and "Debt/bug fixes must
  be sequenced into a task" subsections) so it applies durably, not just this session. All
  four `memory/*.md` files retrofitted to the new newest-first, bolded-field format; the two
  open technical-debt items (Cloudflare/domain, ESLint EOL pin) each got a `Sequenced into:`
  task addendum (T1.1 and T1.4 respectively, in `docs/tasks/01-foundation.md`).

**Related Documents:**

- memory/technical-debt.md
- ~/Dev_Workspace/git-multi-account-workflow.md (outside the repo)
- ~/.gitconfig, ~/.git-credential-helpers/kaalbert-company.sh (outside the repo)
- docs/tasks/01-foundation.md (T1.1, T1.4 addenda)
- CLAUDE.md (Knowledge Management Responsibilities section)

## 2026-09-04

T1.1 implementation decisions, made while scaffolding the repo/app/deploy pipeline.

**Summary:**

- **Repo root confirmed as `Website Build/`**, not its parent folder — the sibling
  `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders are business/
  admin material with no reason to ever reach GitHub, even privately.
- **Next.js 16.3.4** (latest stable at the time, not an older pinned major) — chosen since
  this is a greenfield scaffold with no prior version commitment. Two Next.js 16 behaviour
  changes recorded directly in CLAUDE.md's Auth Pattern section since they'll bite future
  tasks otherwise: `middleware.ts` is deprecated in favour of `app/proxy.ts` (Node runtime,
  not Edge — relevant to Milestone 6 admin-session enforcement), and plain `tsc --noEmit`
  fails on a fresh checkout because typed-route ambient types (e.g. `LayoutProps<'/'>`)
  don't exist until `next typegen` runs — so `npm run typecheck` is
  `next typegen && tsc --noEmit`, never bare `tsc`.
- **ESLint pinned to `^9`, not the newly-released `^10`** — bumping produced
  `ERESOLVE overriding peer dependency` warnings against `eslint-config-next@16.3.4`'s
  plugin chain; `create-next-app`'s own generated `package.json` (same Next.js version)
  independently chose `^9`, so matched that rather than force an unproven combo. `eslint@9`
  is flagged EOL/"no longer supported" by npm — see `memory/technical-debt.md`, revisit once
  `eslint-config-next` bumps its tested peer range.
- **Prettier run across the entire pre-existing docs/ui/memory tree**, not just new files —
  T1.1 is explicitly where "ESLint + Prettier must both be configured and passing from this
  task's first commit onward" (CLAUDE.md Coding Standards) becomes real; every file had to
  reach compliance, not just this task's own diff. Verified the diff was cosmetic only
  (emphasis-marker style, blank-line-after-heading) on a sample file before running
  tree-wide.
- **Cloudflare/domain step deferred** — `kaalbert.com` is not registered (WHOIS: no match),
  so Cloudflare has no zone to front. User chose to finish everything else and log this as a
  known blocker rather than register a placeholder domain. See `memory/technical-debt.md`.
- **Railway provisioned under a new company account** (kaalbert.company@gmail.com), not the
  personal account the CLI was originally logged into — user deliberately created a separate
  company Railway account first. Initial deploy done via `railway up` (CLI upload) to prove
  the pipeline works; GitHub-connected auto-deploy was wired in a later decision entry above.
- **Two GitHub remotes**: `origin` → `KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website`
  (authoritative — Railway auto-deploy and all CI point here) and `personal` →
  `cosbyDeveloper/Kaalbert-Company-Ltd-Website` (push-only, for the user's own contribution
  graph — not a second source of truth). `github` MCP server added to `.mcp.json`,
  referencing `${KAALBERT_GITHUB_TOKEN}` (the user's own env var name, sourced from
  `~/.secrets` via `~/.bashrc`) rather than CLAUDE.md's example `GITHUB_PERSONAL_ACCESS_TOKEN`
  name — same pattern, actual variable name kept as the user set it up.

**Related Documents:**

- docs/tasks/01-foundation.md (T1.1)
- docs/adr/0002-nextjs-typescript.md
- docs/adr/0003-railway-hosting-and-postgres.md
- docs/adr/0004-cloudflare-cdn-proxy.md
- CLAUDE.md (Auth Pattern section, MCP Server Setup section)

## 2026-09-04

Two engineering-authority decisions made during Phase 6 task planning, closing items each
feature doc had explicitly deferred to "Phase 6 task planning" rather than left silently
unresolved:

**Summary:**

- Attribution retention window set to 90 days (`docs/tasks/05-landing-and-measurement.md`,
  T5.4), matching GA4/Meta's own standard attribution lookback.
- Admin session policy set to 30 minutes inactivity / 12 hours absolute
  (`docs/tasks/06-admin-auth.md`, T6.3), matching Document 13.03 §10's confidentiality bar.

**Related Documents:**

- docs/features/measurement-and-attribution.md
- docs/features/admin-authentication.md
- docs/tasks/05-landing-and-measurement.md
- docs/tasks/06-admin-auth.md

## 2026-09-04

Project initialized.

**Summary:** Initial project structure created. Full planning pipeline (Phases 1–7 of
`PROJECT_PLANNING_FRAMEWORK.md`) completed before any implementation began, including a
dedicated pre-Phase-6 audit pass that found and closed 7 requirements/consistency gaps (see
`docs/dashboard.md`) before task planning was written.

**Related Documents:**

- docs/vision.md
- docs/requirements.md
- docs/architecture.md
- docs/roadmap.md
- docs/dashboard.md
