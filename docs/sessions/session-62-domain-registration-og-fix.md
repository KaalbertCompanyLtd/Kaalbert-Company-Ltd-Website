# Session 62 — Domain registration follow-through: OG-image bug fix, NEXT_PUBLIC_SITE_URL, Cloudflare deferred, Brevo sender resolved

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
`hello@` — a brand-voice call, not technical) and the user chose **`info@kaalbert.com`**, used
for both `BREVO_SENDER_EMAIL` and `site_settings.email`. Gave the user the exact step-by-step
Zoho/Brevo/DNS instructions to execute themselves right now. Did not change
`BREVO_SENDER_EMAIL` or `site_settings.email` in code/DB yet — waiting on the user to confirm
the alias exists and Brevo shows it verified.

## Files Changed

- `lib/seo.ts` — `getSiteUrl()` fallback changed from `https://www.kaalbert.com` to
  `https://kaalbert.com`; comment updated with the full root-cause explanation.
- `lib/seo.test.ts`, `lib/admin-authors.test.ts`, `lib/insights.test.ts`,
  `lib/auth/password-reset.test.ts` — updated the 4 dependent assertions to match.
- `lib/email.ts`, `app/api/insights/unsubscribe/route.ts`, `next.config.ts` — stale
  "domain not registered yet" comments updated to reflect current reality.
- `.env.example` — `NEXT_PUBLIC_SITE_URL` and Brevo comments updated.
- `.env.local`, `.env.production` (gitignored, not committed) — `NEXT_PUBLIC_SITE_URL` set.
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
  DNS record table, kept for reference) split out; new "Brevo sender still single-sender-
  verified" entry, revised in-session to recommend `info@kaalbert.com` (not `no-reply@`) with
  the full reasoning for the change.
- `memory/known-bugs.md` — new entry for the OG-image bug, `Fixed`.
- `memory/decision-log.md` — new entry recording the canonical-domain decision (apex, not
  www), the Cloudflare deferral, and the Brevo `info@kaalbert.com` decision with the
  reasoning behind the switch from the first-pass `no-reply@` recommendation.
- `memory/completed-work.md` — new entry for this session, updated in place to reflect the
  final decisions.
- `CLAUDE.local.md` (gitignored) — Brevo/Cloudflare notes updated to match.
- `.env.example` — Brevo comment updated to `info@kaalbert.com`.
- Two Artifacts republished: **Vendor Operations Guide**
  (<https://claude.ai/code/artifact/1b533df6-e704-49e1-a532-8dfb441ca813>) and **Platform
  User Guide** (<https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc>).
  **Website Build Status** artifact not touched — this wasn't a milestone/epic completion.

## Decisions Made

- **Canonical domain is apex `kaalbert.com`, not `www.kaalbert.com`** — the codebase and
  `docs/vendor-operations-guide.md` previously assumed `www` would be canonical, but only the
  apex domain was ever registered as a Railway custom domain. Chose apex to match reality
  rather than also registering `www` as a Railway domain; `www` can be added later as a
  Cloudflare redirect to apex (optional, not yet done).
- **Cloudflare (ADR 0004): deferred by explicit user choice**, not left open by default — the
  user reviewed the actual tradeoff and said "let's skip it for now, just mark it as
  deferred." Not something to revisit proactively; only if Ghana-based visitors report slow
  loads, or the user raises it again.
- **Brevo sender: `info@kaalbert.com`, not `no-reply@kaalbert.com`** — reversed the first
  pass's recommendation after the user correctly pointed out the shared send utility also
  carries the diagnostic's lead-facing summary email, where a `no-reply@` sender works
  against the site's own conversion goal. `info@kaalbert.com` used for both
  `BREVO_SENDER_EMAIL` and `site_settings.email` — one alias, one already-watched inbox.
- **Did not attempt Cloudflare setup or Brevo domain authentication this session** — both
  require external account actions (registrar nameserver change; Zoho mailbox creation +
  Brevo dashboard clicks) that only the user can take. Gave the user the exact step-by-step
  Zoho/Brevo/DNS instructions to execute themselves right now, for the Brevo/`info@` path.
- **Did not build a Content-Security-Policy**, even though the domain no longer blocks it —
  real, scoped work of its own (allowlisting GTM/R2/etc., verified per page type), out of
  scope for this session's focus. Left as an already-tracked open item.

## Current State

`kaalbert.com` is live, serving the real site with correct OG/canonical tags and a valid TLS
cert. Cloudflare (ADR 0004) is deliberately deferred at the user's request — not something to
revisit without a new prompt. Brevo is still sending from a Gmail address via single-sender
verification; the user is executing the `info@kaalbert.com` setup (Zoho alias + Brevo domain
authentication) right now, following the step-by-step guide given directly to them and
written into `docs/vendor-operations-guide.md` Section 6. Once they confirm it's verified,
still need to: set `BREVO_SENDER_EMAIL=info@kaalbert.com` (`.env.local`, `.env.production`,
`railway variable set`) and update `site_settings.email` via `/admin/site-settings`.

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
