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
**Sequenced into:** T1.4 (shadcn/ui + Base UI component scaffold) — see that task's
addendum in `docs/tasks/01-foundation.md`, which already re-checks a dependency version
while touching `package.json` for that task's own reason (the ESLint 9→10 debt item below).

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
**Trigger type:** Task-sequenced — whichever session works T1.4 should just check this in
passing, no separate user go-ahead needed.
**Sequenced into:** T1.4 (docs/tasks/01-foundation.md — addendum added session 01,
2026-09-04: T1.4 already touches `package.json`'s dependencies, natural moment to re-check)

---

## Anticipated (not yet raised — a placeholder to watch for)

`docs/features/content-management-admin.md`'s documented edge case: simultaneous edits to
the same page by two partners use last-write-wins, with no optimistic locking/conflict
detection, accepted for Phase 1 given five partners and low edit frequency. **Must be logged
as a real dated entry above (with a `Sequenced into:` target, per the rule) the moment
T7.2/T7.3 (the Articles/Pages editors) are implemented** — do not let this slip past
implementation silently.
