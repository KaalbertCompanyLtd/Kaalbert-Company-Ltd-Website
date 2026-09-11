# Platform User Guide — kaalbert.com

**A living reference for the firm: what the platform can do today, what to keep an eye on,
and what a partner can (and can't yet) do about it.** Mirrored as an Artifact page —
<https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc> — both copies are
updated together, every time a task changes what's true here. This is not an end-of-project
audit; see "How this guide is maintained" below.

## How this guide is maintained

Updated task-by-task, not in one pass after everything is built (CLAUDE.md's Knowledge
Management Responsibilities section makes this a standing rule, not a one-off request).
Concretely: whenever a task changes what a partner can do, see, or needs to monitor — a new
page, a new admin capability, a new external account/dashboard, a new email or notification
behaviour — this file and its Artifact mirror are updated in the same session, as part of
that task's own completion checklist. Nothing here should ever be more than one completed
task out of date.

This file is the operational manual (what exists, how to run it day to day). A separate,
shorter Artifact — **"Website Build Status"**,
<https://claude.ai/code/artifact/a26811bf-998b-4899-b3ad-0d03ce7c828f> — is the
plain-language progress report for the firm; it's updated only at milestone/epic completion
or a major change, not every task. See CLAUDE.md's "Firm-Facing Documentation" section and
`memory/decision-log.md` for the exact update rule for each.

**As of:** 2026-09-11 (session 44) — Milestones 1–4 complete; Milestone 5 complete through
T5.1–T5.4 (T5.5 deliberately deferred to just before Milestone 9); Milestone 6 (Admin
Authentication) complete, plus a self-service password reset (T6.7) added after the fact.
Milestone 7 (Content Management Admin) underway — the admin dashboard (T7.1) is live; the
rest of Milestone 7 (Articles, Pages, Offers, Landing Pages, Team, Diagnostic Configuration)
is next.

---

## What's live today

### Public website pages — Milestone 2

**What it does:** Home, the three fee-transparent core offer pages, Capabilities, Our
Method, About, Contact, and the four legal pages, all live and responsive (mobile/tablet/
desktop).

**What to monitor:**

- The **Privacy Notice, Cookie Notice, and Terms of Use** are structurally complete but
  carry draft/illustrative text only, each marked "Draft — pending legal review" on the page
  itself. The site cannot go fully public until the firm's lawyer supplies real wording for
  the Privacy Notice specifically. The fourth legal page, Scope of Practice, is real content
  already.
- The **Contact page's response-time commitment** (e.g. "we reply within one business day")
  is still blank — the firm hasn't confirmed a number yet.
- **kaalbert.com itself is not registered yet** — the live site currently sits on a Railway-
  provided address, not the firm's own domain, so no DNS/Cloudflare setup exists either.

**What a partner can do about it today:** Nothing via the site itself — the admin area now
exists and partners can log in (see "Admin Login" below), but it has no content-editing
screens yet (that's Milestone 7). Any copy, fee, or content change still currently requires a
developer.

### Business Health Check diagnostic — Milestone 3

**What it does:** A public, scored self-assessment completable in under six minutes:
question flow → instant results → a gated "email me the full written summary" step
(delivered via Brevo transactional email).

**What to monitor:**

- Email delivery depends on the **Brevo account** (`kaalbert.company@gmail.com`) and its
  verified sender — if summary emails stop arriving, check Brevo's sender-verification
  status first.
- The diagnostic's question set is the mockups' illustrative content, flagged internally as
  placeholder pending the firm's real question review — there is no visible "draft" marker
  on the public page itself the way the legal pages have one, so this is easy to forget is
  still provisional.

**What a partner can do about it today:** Nothing via the site itself yet — editing
questions/weights/thresholds without a developer is Milestone 7's Diagnostic Configuration
screen.

### Insights (articles) — Milestone 4

**What it does:** An articles index and article template, live with the firm's real eight
articles, plus a reader email-subscribe capture on every article.

**What to monitor:**

- Subscriber addresses are captured and get a one-time confirmation — **nothing further is
  ever sent to them yet.** There's no ongoing newsletter/campaign mechanism until Milestone
  17 (gated on the list reaching a size worth a partner's time to compose for).

**What a partner can do about it today:** Nothing via the site itself yet — Milestone 7.

### Landing pages — Milestone 5 (T5.1–T5.2)

**What it does:** Three seeded, dedicated landing-page instances for ad campaigns (one of
which cross-promotes a downloadable checklist as its own call to action).

**What to monitor:** Only these three exist. A new landing page for a new campaign currently
needs a developer to add.

**What a partner can do about it today:** Nothing via the site itself yet — Milestone 7.

### Measurement & attribution — Milestone 5 (T5.3–T5.4)

**What it does:** The full first-party measurement layer:

- **Google Tag Manager** container `GTM-PDGKRKRN`, published live, holding a **GA4**
  configuration tag (property `G-9VX9GS5L0X`) and one event tag per conversion moment.
- **Six fixed conversion events** fire automatically at the right moment on the site:
  diagnostic started, diagnostic completed, summary requested, checklist downloaded, enquiry
  submitted, WhatsApp opened.
- A **cookie-consent banner** (Consent Mode v2) — visitors' consent choice genuinely gates
  whether GA4 receives data, not just a cosmetic banner.
- **First-touch attribution**: which campaign/UTM link a visitor first arrived through is
  captured client-side and linked to every enquiry and diagnostic submission they later make,
  so an enquiry can be traced back to the ad or article that produced it. Kept for 90 days,
  then automatically deleted unless it's still attached to a real enquiry.

**What to monitor:**

- **GTM's own script is cached for ~15 minutes** after any publish — if a newly-published
  tag seems to "do nothing," wait before concluding something is broken; this has already
  produced a false alarm once.
- The nightly **attribution-cleanup** job (a small always-on Railway service, `0 3 * * *`)
  should show successful runs in Railway's own service logs — a string of failures would mean
  the 90-day retention promise silently stops holding.
- **T5.5 — Meta Conversions API, Google Ads (via GA4 import), and LinkedIn Insight Tag — is
  deliberately not built yet.** It needs a Meta Business Manager account + Pixel + CAPI
  token, a Google Ads account, and LinkedIn Campaign Manager access, none of which exist for
  the firm yet. It's been resequenced to build immediately before Milestone 9 rather than
  abandoned — see `memory/decision-log.md`.

**What a partner can do about it today:** The marketing team can create new tags/triggers
directly in GTM's own web UI (same `kaalbert.company@gmail.com` account) without a developer,
**as long as the new tag listens to one of the six existing conversion events above** — a
genuinely new kind of conversion moment still needs a developer (a `lib/data-layer.ts`
change) before GTM has anything new to listen to.

### Admin Login — Milestone 6

**What it does:** Real partner login at `/admin/login`, protecting everything under
`/admin/*` — no page or (once Milestone 7 adds them) API route under that path is reachable
without a valid session, checked on every single request.

- **Password + authenticator app (TOTP)**, both required, every time — no admin action is
  ever available with just a password. A session then lasts up to 12 hours, or 30 minutes of
  inactivity, whichever comes first.
- **Forgot your password?** A partner can reset it themselves from the login page's "Forgot
  password?" link — enter your email, click the link that arrives (valid for 1 hour, works
  once), choose a new password. No other partner or the developer needs to be involved, as
  long as you still have access to your own email. This never bypasses two-factor
  authentication — your authenticator app is untouched, so you still need it to actually log
  in afterward.
- **Lost your authenticator device?** A one-time backup code (8 were shown once, at setup)
  logs a partner back in and immediately forces them to set up a new device before continuing
  — there is no other way back in. If a partner has lost both their device _and_ their backup
  codes, there is no self-service recovery at all, by design — another administrator has to
  ask the developer to reset their enrolment directly (not yet a packaged, self-service admin
  action — see "What's not built yet" below).
- **Deactivating an account** (e.g. a partner leaves the firm) immediately ends every session
  that partner has open, anywhere, on their very next click — not just at their next login.
  This also isn't a self-service admin action yet — ask the developer.
- **Getting a partner their very first account** is currently a step only the developer can
  do (`npm run admin:create-user`) — it creates the account and hands back a one-time setup
  link valid for 7 days, which gets sent to the new partner through whatever secure channel
  the firm already uses (not email — nothing here sends it automatically). There is
  deliberately no self-service "invite a partner" button in the admin area itself; with five
  partners and new accounts created rarely, asking the developer each time is simpler than
  building and maintaining an invite flow for something that happens a handful of times ever.

**What's not built yet:** Deactivating/reactivating an existing account, resetting an
existing partner's 2FA enrolment, and resetting a partner's password **on their behalf**
(i.e. if their email is unreachable too, not just their password forgotten) all have a real,
working mechanism behind them already — just no button anywhere to trigger any of the three.
A developer can do all three directly today; they're sequenced into Milestone 7's Team
screen (T7.6) as follow-up work, not yet built (see `memory/technical-debt.md`). Note this is
distinct from the self-service password reset above, which is already fully built and needs
no one else's involvement.

**What to monitor:** Nothing external — this milestone introduces no new third-party
account/dashboard dependency, everything runs inside the app and its own database. One
internal thing to know, not to worry about: on the dashboard below, every enquiry currently
shows a "New" status badge and the Triage column shows only Flagged/Not flagged (not a
High/Medium/Low priority) — both are accurate today (there's no way yet for an enquiry to be
anything other than "new," and no priority level is saved anywhere per enquiry yet), not a
bug; both become real once Milestone 8 (Enquiry Management) ships.

**What a partner can do about it today:** Log in, reset their own forgotten password
self-service, and see the real admin dashboard (T7.1) — four at-a-glance counts (new
enquiries, triage-flagged, diagnostics completed this month, published articles) and the 5
most recent enquiries, both reading real, live data. There is nothing to actually *edit* yet
(that's the rest of Milestone 7), and no way yet to open an enquiry, change its status, or
filter the list (that's Milestone 8) — today's dashboard is look-but-not-touch. Deactivating
another partner's account, resetting a partner's 2FA or password on their behalf, and
creating a brand-new partner's first account all still require the developer directly.

---

## What to monitor — the short list

A quick-reference roll-up of every external account/dashboard this platform currently
depends on:

| System              | What it's for                                           | Where                 |
| ------------------- | ------------------------------------------------------- | --------------------- |
| Google Tag Manager  | Container `GTM-PDGKRKRN` — all measurement tags         | tagmanager.google.com |
| Google Analytics 4  | Property `G-9VX9GS5L0X` — conversion reporting          | analytics.google.com  |
| Brevo               | Transactional email (diagnostic summary emails)         | app.brevo.com         |
| Railway             | Hosting, database, and the attribution-cleanup cron job | railway.app           |
| Domain registration | **Not yet done** — kaalbert.com isn't registered        | —                     |

## What's coming next

- **Milestone 7 — Content Management Admin** (next up): every piece of content seeded so far becomes
  partner-editable without a developer — this is where most of the "Nothing via the site
  itself yet" notes above get resolved.
- **Milestone 8 — Enquiry Management**: a screen to see and triage incoming enquiries and
  diagnostic completions in one place.
- **Milestone 9 — Platform Performance Dashboards (Bonus)**: connection health + metrics for
  GA4, Meta, Google Ads, and LinkedIn — begins with the deferred T5.5 above, then proceeds.

## Change log

| Date       | What changed                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Admin dashboard (T7.1) went live — real stat counts and a recent-enquiries panel replace the old placeholder; noted the two honest placeholders (status always "New", Triage shown as flagged/not-flagged only) that resolve once Milestone 8 ships. |
| 2026-09-11 | Added self-service password reset (T6.7) to the Admin Login section — a partner can now reset a forgotten password themselves, no developer or other partner needed.           |
| 2026-09-10 | Milestone 6 (Admin Login) complete — added its "What's live today" section, moved it out of "What's coming next", updated the two stale "no admin area yet" mentions above it. |
| 2026-09-10 | Guide created. Covers Milestones 1–4 (complete) and Milestone 5 (complete through T5.1–T5.4, T5.5 deferred before Milestone 9).                                                |
