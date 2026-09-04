# Technical Debt

Newest entry at the top. Entries below follow this format, one per debt item — see
CLAUDE.md's "Memory file format and ordering" section for the exact field rules and the
sequencing requirement:

## <Title>

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
