# Session 62 — Domain registration follow-through: OG-image bug fix, NEXT_PUBLIC_SITE_URL, Cloudflare/Brevo planning

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
single-sender-verified address, zero authenticated domains). Wrote a full, concrete
step-by-step guide for the two things only the user can execute: putting Cloudflare in front
of the domain per ADR 0004 (with the exact DNS records to re-create so mail doesn't break on
cutover), and creating `no-reply@kaalbert.com`/`info@kaalbert.com` Zoho aliases plus Brevo
domain authentication to replace the Gmail sender. Did not change `BREVO_SENDER_EMAIL` or
`site_settings.email` — both depend on mailboxes that don't exist yet.

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
  (domain status, the full Cloudflare DNS-migration guide with real record values, Brevo
  upgrade note, simplified `admin:create-user` instructions now that `.env.local` carries the
  right `NEXT_PUBLIC_SITE_URL`).
- `docs/user-guide.md` — domain/email references updated; a pending-email-upgrade note added
  to the Site Settings walkthrough.
- `memory/technical-debt.md` — "kaalbert.com not registered" flipped to Resolved; new "Cloudflare
  not yet fronting kaalbert.com" entry (with the real DNS record table) split out; new "Brevo
  sender still single-sender-verified" entry.
- `memory/known-bugs.md` — new entry for the OG-image bug, `Fixed`.
- `memory/decision-log.md` — new entry recording the canonical-domain decision (apex, not
  www) and the Cloudflare/Brevo follow-up plan.
- `memory/completed-work.md` — new entry for this session.
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
- **Did not attempt Cloudflare setup or Brevo domain authentication this session** — both
  require external account actions (Cloudflare account creation + registrar nameserver
  change; Zoho mailbox creation + Brevo dashboard clicks) that only the user can take. Wrote
  a concrete, step-by-step guide for each instead of doing anything partial/unverifiable.
- **Did not build a Content-Security-Policy**, even though the domain no longer blocks it —
  real, scoped work of its own (allowlisting GTM/R2/etc., verified per page type), out of
  scope for this session's focus. Left as an already-tracked open item.

## Current State

`kaalbert.com` is live, serving the real site with correct OG/canonical tags and a valid TLS
cert. Cloudflare (ADR 0004) is not yet in front of it — DNS is still on the registrar's
default nameservers. Brevo is still sending from a Gmail address via single-sender
verification, not a domain-authenticated `@kaalbert.com` address. Both are real, identified,
user-actionable follow-ups with exact instructions already written into
`docs/vendor-operations-guide.md` Section 3 and Section 6's Brevo callout.

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
