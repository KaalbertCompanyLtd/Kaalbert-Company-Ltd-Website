# Session 62 — Domain registration follow-through: OG fix, Brevo/Zoho, CSP, www redirect, GA4 cleanup, monitoring guide

# Date: 2026-09-16

# Tasks completed: chore(process) — no task ID; infra/production-hardening follow-through on

already-shipped work, same category as sessions 54/60's own `chore(process)` commits

## What Was Built

User reported two things: an OG/share-image bug (no preview image when the site's link was
shared on WhatsApp), and that `kaalbert.com` is now registered and already added as a Railway
custom domain. Root-caused and fixed the OG bug: `lib/seo.ts`'s `getSiteUrl()` fallback
hardcoded `https://www.kaalbert.com`, but only the apex domain was ever registered/added as a
Railway custom domain — `www.kaalbert.com` has no DNS record — so the fallback never resolved
either way (first because the domain wasn't registered at all, then because of the `www`
mismatch). Fixed the fallback to apex `kaalbert.com` (and its 4 dependent test files), and set
`NEXT_PUBLIC_SITE_URL=https://kaalbert.com` explicitly in `.env.local`, `.env.production`, and
the live Railway service (with a matching `preserve()` added to `.railway/railway.ts`).
Verified live after the resulting auto-redeploy: `https://kaalbert.com/` returns correct
`og:image`/canonical tags, and the image URL itself resolves. Captured the real DNS state for
`kaalbert.com` (apex CNAME to Railway, 3 Zoho MX records, SPF/Zoho-verification TXT, Zoho DKIM
TXT) and checked Brevo's real sender-verification state via its own API (one Gmail
single-sender-verified address, zero authenticated domains).

Presented the Cloudflare/ADR-0004 tradeoff directly to the user rather than proceeding on it
— edge caching relevant to the Ghana/3G audience `docs/vision.md` names, versus real
DNS-cutover risk to mail, versus the site already working fine without it. **User's call:
skip it, mark it deferred.** First pass also recommended `no-reply@kaalbert.com` for the
Brevo sender — the user pushed back (rightly): the same shared send utility carries the
diagnostic's lead-facing summary email, not just internal admin mail, so a `no-reply@`
undercuts the site's own conversion goal. Discussed the real options (`no-reply@` / `info@` /
`hello@` — a brand-voice call, not technical) and the user chose **`info@kaalbert.com`**.
Gave the user the exact step-by-step Zoho/Brevo/DNS instructions, and **they executed all of
it in the same session**: created the alias, authenticated the domain in Brevo, added every
DNS record manually (catching a real near-miss where Namecheap's own "automatic" tool tried
to touch the unrelated apex CNAME pointing at Railway). Set
`BREVO_SENDER_EMAIL=info@kaalbert.com` live and **verified it end-to-end for real** —
triggered a live password-reset email, confirmed delivery via Brevo's own event-log API
(`requests` → `delivered` → `opened`, `from: info@kaalbert.com`).

Finally, built the Content-Security-Policy the user asked for, built and closed rather than
deferred again. Researched every real source of client-side content first (GTM's one inline
script, real R2 image URLs, the admin 2FA screen's `data:`-URI QR code, 3 inline `style`
attributes, no Google Fonts). Implemented a nonce-based CSP in `proxy.ts` — broadened its
matcher from `/admin`-only to every route (the highest-risk part of this change, given
`proxy.ts`'s history of subtle bugs at T6.3/T6.7), while re-scoping the existing admin
session-check logic inside an explicit `isAdminPath` check so the auth-check surface itself
never changed. `script-src` uses a per-request nonce plus `'strict-dynamic'`, chosen
specifically to not break `docs/user-guide.md`'s documented "a partner can add a new GTM tag
themselves" workflow. Verified for real: local dev server, Playwright with the console open,
across home (confirmed GTM → GA4 → a real analytics beacon under the new policy), an
Insights article, the diagnostic flow, the contact form, and a full admin login (real
computed TOTP code, not skipped) through the dashboard, Account & Security, and the 2FA
QR-code screen — zero violations. Full quality gate re-run clean after.

At the user's request, removed every "`site_settings.email` still pending" mention from
docs, memory, and both Artifacts — it was never technical debt, just a quick admin UI step,
and tracking it as an open item wasn't wanted.

User then recalled that the original GTM/GA4 setup session (T5.3, session 35) used the
Railway domain somewhere with the intent to swap it once `kaalbert.com` was registered, and
asked to find and fix it. Confirmed nothing in the repo itself references a Railway domain
for GTM/GA4 (correct by design — ADR 0006, that config lives outside this codebase). Checked
directly in GA4's own dashboard via Chrome (logged in as `kaalbert.company@gmail.com`, same
account session 35 used): the Data Stream's **Stream URL** field was still
`https://kaalbert.up.railway.app`. Fixed it live — Admin → Data Streams → kaalbert.com →
edit → `https://kaalbert.com`, saved, confirmed. Also checked GA4's cross-domain measurement
suggestions (found only auto-detected entries, none saved/accepted — left alone, not a bug,
not a feature this single-domain site needs).

Also rewrote `docs/user-guide.md`'s "What to monitor" section — previously just a bare
name/URL table — into real step-by-step "how to check it yourself" walkthroughs for GTM,
GA4, Brevo, Railway, and the domain registrar, framed explicitly against Milestone 9's
absence (this is the real, complete monitoring picture until an in-app dashboard exists).

Finally, built the `www.kaalbert.com` → apex redirect the user asked to be guided on, then
executed themselves (added `www.kaalbert.com` as a second Railway custom domain + its DNS
record) before asking for the actual redirect. Added a `Host`-header check to the very top
of `proxy.ts` — before the CSP nonce or admin session logic runs, since a redirect needs
neither — issuing a `308 Permanent Redirect` (method-preserving, RFC 7538) to the same path
and query string on `https://kaalbert.com`. Verified locally via a spoofed `Host` header:
correct status, correct `location`, normal requests and the admin-auth redirect both
unaffected. Full quality gate clean after.

## Files Changed

- `lib/seo.ts` — `getSiteUrl()` fallback changed from `https://www.kaalbert.com` to
  `https://kaalbert.com`; comment updated with the full root-cause explanation.
- `lib/seo.test.ts`, `lib/admin-authors.test.ts`, `lib/insights.test.ts`,
  `lib/auth/password-reset.test.ts` — updated the 4 dependent assertions to match.
- `lib/email.ts`, `app/api/insights/unsubscribe/route.ts`, `next.config.ts` — stale
  "domain not registered yet" comments updated to reflect current reality.
- `.env.example` — `NEXT_PUBLIC_SITE_URL` and Brevo comments updated.
- `.env.local`, `.env.production` (gitignored, not committed) — `NEXT_PUBLIC_SITE_URL` set,
  then later in the session `BREVO_SENDER_EMAIL` switched to `info@kaalbert.com`.
- `.railway/railway.ts` — added `NEXT_PUBLIC_SITE_URL: preserve()`.
- `CLAUDE.local.md` (gitignored, not committed) — domain-registration and Brevo-upgrade notes
  added to the Credentials section.
- `docs/tasks/01-foundation.md` — T1.1 addendum updated: domain-registration half resolved,
  Cloudflare-fronting half still open.
- `docs/vendor-operations-guide.md` — Sections 1, 3, 5, 6, 8, 11 substantially rewritten
  (domain status, Cloudflare reframed as deferred-by-choice with its DNS records kept for
  reference only, the concrete Zoho/Brevo/DNS steps for `info@kaalbert.com`, simplified
  `admin:create-user` instructions now that `.env.local` carries the right
  `NEXT_PUBLIC_SITE_URL`).
- `docs/user-guide.md` — domain/email references updated; a pending-email-upgrade note added
  to the Site Settings walkthrough, referencing `info@kaalbert.com`.
- `memory/technical-debt.md` — "kaalbert.com not registered" flipped to Resolved; new
  "Cloudflare not yet fronting kaalbert.com — deferred by user choice" entry (with the real
  DNS record table, kept for reference) split out; "Brevo sender still single-sender-
  verified" entry also flipped to Resolved by end of session, with the full execution record
  (Zoho alias, Brevo authentication, the Namecheap near-miss, and the live verification).
- `memory/known-bugs.md` — new entry for the OG-image bug, `Fixed`.
- `memory/decision-log.md` — new entry recording the canonical-domain decision (apex, not
  www), the Cloudflare deferral, and the Brevo `info@kaalbert.com` decision with the
  reasoning behind the switch from the first-pass `no-reply@` recommendation.
- `memory/completed-work.md` — new entry for this session, updated in place to reflect the
  final decisions, plus a dedicated entry for the CSP work.
- `CLAUDE.local.md` (gitignored) — Brevo/Cloudflare notes updated to match.
- `.env.example` — Brevo comment updated to `info@kaalbert.com`.
- `proxy.ts` — matcher broadened to every route; added nonce generation and CSP header
  construction; existing admin auth logic re-scoped inside `isAdminPath`, behavior unchanged.
- `app/layout.tsx` — reads the CSP nonce via `headers()`, made `async`; passes it to the GTM
  script component.
- `components/google-tag-manager.tsx` — accepts and forwards a `nonce` prop.
- `next.config.ts` — comment updated to explain why CSP lives in `proxy.ts`, not here.
- `proxy.ts` — `Host`-header check added at the top of `proxy()` for the `www` → apex
  redirect; doc-comment updated to describe all three jobs the file now does.
- GA4 dashboard (external, not a repo file): Data Stream Stream URL corrected from the
  Railway domain to `https://kaalbert.com`.
- Both Artifacts republished multiple times through the session as each piece landed —
  final state covers all of the above: **Vendor Operations Guide**
  (<https://claude.ai/code/artifact/1b533df6-e704-49e1-a532-8dfb441ca813>) and **Platform
  User Guide** (<https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc>).
  **Website Build Status** artifact not touched — this wasn't a milestone/epic completion.

## Decisions Made

- **Canonical domain is apex `kaalbert.com`, not `www.kaalbert.com`** — the codebase and
  `docs/vendor-operations-guide.md` previously assumed `www` would be canonical, but only the
  apex domain was registered as a Railway custom domain at first. Chose apex to match
  reality. **`www` → apex redirect: done later the same session**, without Cloudflare —
  `www.kaalbert.com` is now its own Railway custom domain, and `proxy.ts` 308-redirects it to
  apex (see below).
- **Cloudflare (ADR 0004): deferred by explicit user choice**, not left open by default — the
  user reviewed the actual tradeoff and said "let's skip it for now, just mark it as
  deferred." Not something to revisit proactively; only if Ghana-based visitors report slow
  loads, or the user raises it again.
- **Brevo sender: `info@kaalbert.com`, not `no-reply@kaalbert.com`** — reversed the first
  pass's recommendation after the user correctly pointed out the shared send utility also
  carries the diagnostic's lead-facing summary email, where a `no-reply@` sender works
  against the site's own conversion goal.
- **Content-Security-Policy: nonce-based via `proxy.ts`, not a static host-allowlist.** The
  user asked for it built and closed, not deferred again. A hash-based approach for GTM's one
  inline script was considered and rejected — Next.js's own framework-injected hydration
  scripts are dynamic and can't be hashed, so a nonce (forwarded to Next's renderer via its
  documented request-header mechanism) was the only approach covering both. `'strict-
dynamic'` chosen over a rigid host allowlist specifically to protect `docs/user-guide.md`'s
  already-documented "a partner can add a new GTM tag via its own UI, no developer needed"
  workflow, which a rigid allowlist would silently break. Full reasoning in
  `memory/decision-log.md`.
- **The user executed the Zoho/Brevo/DNS setup themselves, same session** — gave them the
  exact step-by-step guide, they created the `info` alias at Zoho, authenticated
  `kaalbert.com` in Brevo, and added every DNS record manually at Namecheap. Caught a real
  near-miss along the way: Namecheap's own "automatic" DNS-sync tool tried to "replace" the
  unrelated apex `kaalbert.com` CNAME (pointing at Railway) — cancelled before confirming,
  worked around via manual record entry instead. Once Brevo showed the domain Authenticated,
  set `BREVO_SENDER_EMAIL=info@kaalbert.com` live (`railway variable set`, confirmed
  redeploy) and **verified it end-to-end for real**: triggered a live password-reset email,
  then confirmed via Brevo's own event-log API that it shows `requests` → `delivered` →
  `opened`, `from: info@kaalbert.com`. Left the old Gmail sender in Brevo, unused, as a
  fallback (not deleted, per the user's own call).
- **`www` → apex redirect: a code redirect in `proxy.ts`, not a registrar-level "URL
  Redirect Record."** Considered and rejected Namecheap's own forwarding feature — it
  doesn't reliably provision a matching TLS cert for the redirected subdomain, risking a
  certificate warning on `https://www.kaalbert.com` before the redirect can even happen.
  Instead: `www.kaalbert.com` as its own Railway custom domain (real Railway-issued cert)
  plus an application-level 308 redirect, checked first in `proxy.ts` before any other logic
  runs.
- **Removed the "`site_settings.email` still pending" tracking everywhere**, per explicit
  user instruction — not technical debt, just noise.

## Current State

`kaalbert.com` is live, serving the real site with correct OG/canonical tags and a valid TLS
cert. Cloudflare (ADR 0004) is deliberately deferred at the user's request — not something to
revisit without a new prompt. Brevo is now domain-authenticated and sending from
`info@kaalbert.com`, verified end-to-end in production. GA4's Data Stream URL is corrected to
the real domain, and `docs/user-guide.md` now has real external-tool monitoring
walkthroughs. **The user pushed this session's commits**, and both remaining code changes
are now confirmed live via direct re-verification against production (not just the earlier
local passes): **(1)** the nonce-based Content-Security-Policy — `curl` confirms the real
header (dev-only `'unsafe-eval'` correctly absent), and a real Chrome pass with the console
open across home, an Insights article, the diagnostic, and `/admin/login` showed zero
console messages on any page; **(2)** the `www.kaalbert.com` → apex redirect — `curl`
confirms the `308`/`location`, the live TLS cert on `www.kaalbert.com` is valid, and a real
Chrome navigation to `https://www.kaalbert.com/` landed cleanly on `https://kaalbert.com/`
with no certificate warning. This session is fully closed — every item the user raised has a
confirmed-live final state, nothing left open or unverified.

## Blockers

None for this session's own scope. T5.5 (Meta CAPI, Google Ads import, LinkedIn Insight Tag,
domain verification) remains blocked — the domain-registration precondition is now satisfied,
but the three real ad-platform accounts (Meta Business Manager, Google Ads, LinkedIn Campaign
Manager) still don't exist.

## Next Task

T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification
File: docs/tasks/05-landing-and-measurement.md
**Status: still blocked — three of four preconditions remain unmet. Do not start
implementation until the user explicitly confirms all three now exist.**

## Paste This to Continue

```
T5.5 is blocked on real external ad-platform accounts that don't exist yet — do NOT begin
implementation from this prompt without first confirming with the user that the Meta Business
Manager (Pixel + Conversions API), Google Ads account, and LinkedIn Campaign Manager access
all now actually exist. Read CLAUDE.md in full first anyway (tech stack, conventions, quality
gates, checklist) since you'll need it the moment this is actually unblocked.

Then read the full epic file: docs/tasks/05-landing-and-measurement.md — specifically its own
framing of T5.5 as "resequenced" (session 36+): Milestones 6–8 don't depend on it, only
Milestone 9 (`docs/tasks/09-performance-dashboards.md`'s T9.4/T9.5/T9.6) does, so it was
deliberately deferred from its original Milestone 5 slot to run immediately before T9.1, "by
which point those accounts are more likely to exist." Also read
docs/tasks/09-performance-dashboards.md's own opening note, which names this same
precondition.

One precondition is now met (session 62, 2026-09-16): `kaalbert.com` is registered and live,
so Meta's own domain-verification step (FR-7.9) is no longer blocked on domain registration
itself — Cloudflare isn't fronting the domain yet either (`memory/technical-debt.md`'s
"Cloudflare not yet fronting kaalbert.com" entry), but that's a separate, non-blocking
concern for domain verification specifically, which just needs a real, resolvable domain.

Nothing about sessions 54/60/61's role/permission/enquiry-assignment work, or session 62's
own domain-registration follow-through, changes T5.5's remaining scope — none of them touched
measurement, attribution, or the diagnostic itself.

# Task T5.5 — Meta CAPI, Google Ads import, LinkedIn Insight Tag, domain verification

## The blocker — confirm this first, before any code
Three real-world preconditions, none met as of session 62 (2026-09-16):
1. A Meta Business Manager account with a Pixel and Conversions API access provisioned.
2. A Google Ads account (conversions are imported from GA4 here, not defined separately, per
   FR-7.5 — so this doesn't need a second, separate conversion setup in Google Ads itself,
   just the account/import connection).
3. LinkedIn Campaign Manager access.
(A fourth precondition — `kaalbert.com` registered as a real, owned domain — was met this
session; see `memory/technical-debt.md` and `memory/decision-log.md`.)
Ask the user directly whether all three now exist before writing any code. If even one is
missing, stop and say so explicitly — do not build a partial version, do not stub out the
missing piece "for later," and do not proceed on the assumption that "close enough" accounts
exist.

## Build
Server-side Meta Conversions API call (fire-and-forget, deduplicated against the client pixel
via a shared event ID tied to `enquiry_id`, never regenerated per attempt); Google Ads
conversion actions imported from GA4 (not defined separately, FR-7.5); LinkedIn Insight Tag
installed for retargeting accumulation only (FR-7.8 note); Meta Business Manager domain
verification for kaalbert.com (FR-7.9) — the domain now exists to verify against.

## Input → Output
The same six conversion moments (diagnostic started/completed, summary requested, checklist
downloaded, enquiry submitted, WhatsApp opened) → deduplicated Meta CAPI + pixel events,
GA4-imported Google Ads conversions, LinkedIn tag firing.

## Acceptance criteria
A Meta CAPI outage (simulated) never delays or breaks the visitor-facing response
(`docs/architecture.md`, Section 5); a double-submit produces one deduplicated conversion,
not two, verified in Meta Events Manager's own dedup reporting; domain verification shows
confirmed in Meta Business Manager.

## Size
M **Dependencies:** T5.3, T5.4 (both complete)

## Quality gates before calling this done
`npm run lint && npm run format:check && npx tsc --noEmit && npm run test` must all pass;
real interactive verification via Playwright MCP is required per CLAUDE.md's Task Completion
Checklist — this task specifically needs the real Meta/Google/LinkedIn accounts to verify
against, not just static analysis. Update `memory/completed-work.md`,
`memory/decision-log.md` (T5.5 was a real resequencing decision, already logged — note its
resolution here), and `docs/user-guide.md`/its Artifact mirror (Milestone 9's "still waiting"
language needs updating once this ships). Write `docs/sessions/session-NN-<topic>.md` before
ending, with the next task's full `/task` output in "Paste This to Continue."
```
