# Technical Debt

None logged yet (pre-implementation). One item is already anticipated and must be logged
here with a real date the moment T7.2/T7.3 (the Articles/Pages editors) are implemented —
`docs/features/content-management-admin.md`'s documented edge case: simultaneous edits to the
same page by two partners use last-write-wins, with no optimistic locking/conflict detection,
accepted for Phase 1 given five partners and low edit frequency. Do not let this slip past
implementation without an entry below.

Entries below follow this format, one per debt item:

## Debt Item

Date:
Reason:
Impact:
Recommended Resolution:
Priority:

## kaalbert.com not registered — Cloudflare-fronted domain not yet in place (ADR 0004)

Date: 2026-09-04
Reason: T1.1's acceptance criterion "the live URL resolves through Cloudflare, not Railway's
raw domain" can't be met — WHOIS confirms `kaalbert.com` isn't registered, and Cloudflare has
no zone to front without a real domain. User chose to finish the rest of T1.1 and defer this
rather than register a placeholder domain. The live app is currently only reachable at
`https://kaalbert.up.railway.app` (Railway's raw domain).
Impact: T1.1's Cloudflare acceptance criterion is not satisfied. No functional impact yet —
purely a domain-registration/DNS step, not a code change.
Recommended Resolution: Once `kaalbert.com` (or a decided interim domain) is registered, add
it to Cloudflare, point DNS at the Railway service, and add it as a custom domain via
`railway domain kaalbert.com`.
Priority: Medium — blocks a T1.1 acceptance criterion but not any other task's start.

## GitHub-connected Railway auto-deploy not yet wired (ADR 0003/0008)

Date: 2026-09-04
Reason: T1.1's "main deploys automatically on push" acceptance criterion needs
`railway service source connect --repo KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website
--branch main`, which requires the `main` branch to already exist on GitHub. The repo exists
(Railway's GitHub App is already authorized against it — the connect command got past auth
and failed only on "branch does not exist") but nothing has been pushed yet, since agents
never push directly (CLAUDE.md Git Commit Protocol). Currently, the only working deploy path
is a manual `railway up` CLI upload, not push-triggered.
Impact: T1.1's auto-deploy acceptance criterion is not satisfied yet. `railway up` remains
available as a manual fallback in the meantime.
Recommended Resolution: After the human pushes this task's commit to `origin main`, run
`railway service source connect --repo KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website
--branch main` (or via the Railway dashboard) to complete the wiring.
Priority: High — this is T1.1's own acceptance criterion, not a future task's concern.

## ESLint pinned to the EOL 9.x line

Date: 2026-09-04
Reason: `eslint@^10` is current, but bumping produced `ERESOLVE overriding peer dependency`
warnings against `eslint-config-next@16.3.4`'s plugin chain (something in that chain still
peer-depends on ESLint 9). `create-next-app`'s own generated `package.json` for this exact
Next.js version independently chose `eslint@^9`, so matched that rather than force an
unproven combo on day one. npm flags `eslint@9.39.5` as "no longer supported."
Impact: No functional impact today — lint passes clean. Risk is losing ESLint 10-only
rules/fixes and eventually losing security patches on the 9.x line.
Recommended Resolution: Re-attempt the `eslint@^10` bump once `eslint-config-next` publishes
a release with a peer range that includes ESLint 10 cleanly (check
`npm info eslint-config-next peerDependencies` before retrying).
Priority: Low — revisit opportunistically, not urgent.
