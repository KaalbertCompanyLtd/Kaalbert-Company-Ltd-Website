# Vendor / Developer Operations Guide — kaalbert.com

**Audience:** you, as the developer/vendor responsible for this platform — not the firm (see
`docs/user-guide.md` for that). This is the "everything I have to do or keep doing" reference:
what's left before this can be called properly launched, how to run the operations only a
developer can run (creating partner accounts, managing secrets, Railway infrastructure), and
what to keep doing on an ongoing basis after launch.

**Last updated:** 2026-09-16 (session 62) — `kaalbert.com` registered and added as a Railway
custom domain; Sections 1, 3, 4, 5, and 6 updated to reflect this. **Cloudflare (ADR 0004) is
deliberately deferred** — the user reviewed what it actually buys (edge caching/DDoS
protection, not a fix for anything broken) against the real DNS-cutover risk and chose to
skip it for now; not a gap, a decision (Section 3). **The Brevo sender is now domain-
authenticated and switched to `info@kaalbert.com`** (deliberately not `no-reply@` — see
Section 6 for the reasoning), verified end-to-end via a real password-reset send. **A
nonce-based Content-Security-Policy is now built and verified locally** (Section 4) — built
and committed, but not live until pushed (see Section 4's own note on why). Update this
file the same way
`docs/user-guide.md` is updated — incrementally, the session something changes, never as a
big end-of-project catch-up (`memory/decision-log.md`'s incremental-docs decision applies to
this file too, even though it isn't one of the two formal Firm-Facing Documentation
artifacts).

---

## 1. Where the project actually stands

- **Phase 1 (`docs/scope.md`'s full v1 launch scope, Milestones 1–8) is functionally
  complete** as of T8.4 (session 59): Foundation, Public Presentation, Diagnostic, Insights,
  Landing Pages + core measurement (GTM/GA4/consent mode), Admin Auth, Content Admin, and
  Enquiry Management are all built and shipped.
- **Deliberately not done yet, by design — not oversights:**
  - **T5.5** (Meta Conversions API, Google Ads import, LinkedIn Insight Tag, Meta domain
    verification) — resequenced to run immediately before Milestone 9, because it needs real
    ad accounts that don't exist yet and a registered domain to verify against. See
    `docs/tasks/05-landing-and-measurement.md`.
  - **Milestone 9** (Platform Performance Dashboards) — an unrequested bonus, explicitly
    ordered last.
  - **Phase 2** (Milestones 10–17: Booking, Case Studies, Client Portal, Payment, Training,
    CRM, Paid Diagnostic Suite, Brevo Campaigns) — fully planned, gated on real evidence
    triggers in `docs/scope.md`. **Do not start any of these** until the trigger is met and
    the user explicitly says to proceed.
- **The live app is now reachable at the real domain, `https://kaalbert.com`** (registered
  and added as a Railway custom domain 2026-09-16, session 62 — `railway domain` shows it
  `ACTIVE` with a valid Railway-issued TLS cert). The old Railway raw domain
  (`kaalbert.up.railway.app`) still works too. **Cloudflare (ADR 0004) is deliberately
  deferred** — not an oversight, a decision — see Section 3.

---

## 2. This session's production-hardening changes (already done, verify only)

**First pass:**

1. **Default OG/share image** — `lib/seo.ts`'s `buildPageMetadata` now falls back to
   `public/brand/og-default.png` (the firm-supplied `Logo_OG_Image_2000x1050.png`) instead of
   the primary logo. Verified live via a local dev server: `og:image`/`twitter:image` render
   correctly, the file serves `200 image/png`. An individual article's own `previewImage`
   still overrides this exactly as before. See `memory/completed-work.md` (T2.8 follow-up,
   session 60).
2. **`.railway/railway.ts` was missing `preserve()` declarations** for
   `ADMIN_CHALLENGE_TOKEN_SECRET`, `ADMIN_TOTP_ENCRYPTION_KEY`, and all five
   `CLOUDFLARE_R2_*` variables — meaning the **next** `railway config apply` would have
   silently deleted every one of them from the live service (the exact hazard CLAUDE.md
   already documents for this file). Added `preserve()` for all seven; confirmed with
   `railway config plan` that this is a true no-op against the live project (no drift).

**Second pass, same session, once you confirmed a redeploy had already happened:**

3. **Baseline HTTP security headers** — `next.config.ts` now sets `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`
   on every route. Verified live on a local dev server (`curl -I`), including on `/admin/login`.
4. **`app/robots.ts` added** — allows everything except `/admin`, points crawlers at the
   dynamic sitemap. Verified live at `/robots.txt`.
5. **Admin-login secrets bug closed** — you confirmed a real redeploy happened after the
   secrets were set (session 54); combined with the deployment-timeline evidence and the
   `GET /admin/login` 200 already gathered, `memory/known-bugs.md`'s entry is now `Fixed`.
6. **Your own admin account was created for real** — see §8's corrected instructions below;
   the ones in this guide's first pass had a real bug in them (`railway run` doesn't work for
   this, caught by your own attempt failing with `Can't reach database server at
postgres.railway.internal`).

**Still deliberately left open at the time — see §4/§5 for why:** Content-Security-Policy
(now built, session 62 — see §4) and persistent rate-limit storage (still open). Both needed
either a live domain to test against safely or a scoped decision that's genuinely yours to
make, not a same-session mechanical fix.

---

## 3. Domain registered; Cloudflare (ADR 0004) deliberately deferred, not built

`kaalbert.com` is registered and already added as a Railway custom domain (2026-09-16,
session 62 — `railway domain` shows it `ACTIVE`, serving real traffic over a valid
Railway-issued Let's Encrypt cert). `NEXT_PUBLIC_SITE_URL=https://kaalbert.com` is set live.

**Cloudflare is not fronting the domain, and that's a deliberate choice, not an open gap**
(`memory/technical-debt.md` → "Cloudflare not yet fronting kaalbert.com — deferred by user
choice"). Presented the tradeoff directly: Cloudflare would add edge-caching (relevant since
`docs/vision.md` names Ghana visitors on 3G/mid-range Android as the primary audience — the
one real thing Railway's single-region hosting doesn't give you), free DDoS/WAF, and one-click
HSTS/Always-Use-HTTPS — against a real DNS-cutover risk (get the MX/SPF/DKIM records wrong
during the nameserver change and mail breaks, not the site). The site works correctly today
without it. **Decision: skip it for now; revisit only if Ghana-based visitors actually report
slow load times, or the user raises it again** — not something to build proactively.

The DNS records and step-by-step migration guide below are kept **for reference, in case this
is revisited later** — not a to-do list to act on now. Until/unless it's taken up again:

- No CDN edge-caching, no edge-level WAF/security headers, no free TLS-at-the-edge beyond
  what Railway's own domain already gives you (which is real and working today — this is a
  performance/hardening gap, not a functional one).
- Meta Business Manager domain verification and Google Search Console verification (both part
  of T5.5 and of "full SEO") still can't be completed — not because the domain isn't
  registered anymore, but because they're gated on real ad-platform accounts that don't exist
  yet (Section 5).
- Brevo's transactional sender is now domain-authenticated and switched to
  `info@kaalbert.com` — this never needed Cloudflare either way, it just needed DNS records
  added wherever the zone was authoritative (the registrar); see Section 6 for what was done.

**The real DNS records live at `kaalbert.com` today** (captured 2026-09-16 via `dig
kaalbert.com @1.1.1.1` — **querying a real external resolver directly matters**: this
project's own agent-session sandbox has been observed returning bogus answers for
`kaalbert.com`'s DNS from its default resolver, so don't trust a plain `dig`/`nslookup` run
from inside an agent session without pinning `@1.1.1.1` or similar). **Every one of these
must be re-created in Cloudflare before cutting over DNS, or mail breaks the moment
nameservers change:**

| Record                          | Type                    | Value                                                                                                                                                        |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kaalbert.com` (apex)           | CNAME/ALIAS (flattened) | `qrulko1j.up.railway.app` (resolves to `69.46.46.50`)                                                                                                        |
| `kaalbert.com`                  | MX, priority 10         | `mx.zoho.com`                                                                                                                                                |
| `kaalbert.com`                  | MX, priority 20         | `mx2.zoho.com`                                                                                                                                               |
| `kaalbert.com`                  | MX, priority 50         | `mx3.zoho.com`                                                                                                                                               |
| `kaalbert.com`                  | TXT                     | `v=spf1 include:zohomail.com ~all`                                                                                                                           |
| `kaalbert.com`                  | TXT                     | `zoho-verification=zb33664172.zmverify.zoho.com`                                                                                                             |
| `zmail._domainkey.kaalbert.com` | TXT                     | Zoho's DKIM public key (fetch fresh from Zoho Mail Admin → Email Configuration → DKIM if it's changed since this was captured — don't retype it from memory) |

No `_dmarc.kaalbert.com` record exists today — optional, not required for the migration
itself (see the step list below). **`www.kaalbert.com` → apex redirect is already done**,
independently of Cloudflare — see Section 4's own note below; it didn't need
to wait for Cloudflare after all.

**What to actually do, in order, once you're ready to set this up (all of it your own
account/dashboard actions — not something to hand back to an agent session mid-way):**

1. Create a free Cloudflare account, add `kaalbert.com` as a site. Cloudflare will scan and
   import the existing DNS records automatically — **before continuing, compare what it
   imported against the table above** and fix anything it missed or got wrong (its auto-scan
   is usually good but not guaranteed complete, especially for MX priority order).
2. In Cloudflare's DNS tab: the apex `kaalbert.com` record should be proxied (orange cloud) —
   Cloudflare CNAME-flattens automatically at the apex, this is normal and expected. **All
   three MX records, and both TXT records, must stay "DNS only" (grey cloud)** — Cloudflare
   never proxies mail records regardless, but double-check the MX priorities (10/20/50)
   survived the import correctly, since a wrong priority silently reroutes mail delivery
   order rather than erroring.
3. ~~Add a `www` CNAME + Cloudflare Redirect Rule~~ — **already done a different way**
   (session 62): `www.kaalbert.com` is a second Railway custom domain with its own Railway-
   issued cert, and `proxy.ts` itself 308-redirects any `www.kaalbert.com` request to the
   same path on apex — see Section 4. No Cloudflare dependency after all.
4. Optional, recommended: add a `_dmarc.kaalbert.com` TXT record, e.g.
   `v=DMARC1; p=none; rua=mailto:albert@kaalbert.com` — a monitoring-only DMARC policy (not
   enforcing/rejecting), standard practice alongside SPF+DKIM, and low-risk to add.
5. At your domain registrar (Namecheap, based on the current `dns1/dns2.registrar-
servers.com` nameservers): change the nameservers to the two Cloudflare assigns you during
   setup. This is the actual cutover — expect it to take anywhere from a few minutes to
   ~24 hours to propagate.
6. Once Cloudflare shows the zone "Active": confirm `railway domain` still shows `kaalbert.com`
   `ACTIVE` (it should — Railway doesn't care which DNS provider points at it), then re-run
   `dig` against every record type above (again pinning a real resolver, e.g. `@1.1.1.1`) to
   confirm nothing silently dropped in the cutover — MX and the two TXT records especially,
   since a missed one breaks inbound mail or SPF/domain-verification, not the website.
7. In Cloudflare's dashboard: turn on "Always Use HTTPS" and enable HSTS (SSL/TLS →
   Edge Certificates) — the free, no-code way to get several of Section 4's security wins at
   the edge in addition to what `next.config.ts` already sets at the app layer.
8. Send a fresh WhatsApp/Facebook share of `https://kaalbert.com` afterward to confirm the OG
   preview still renders through the new edge — if a stale cached preview shows from before
   the cutover, force a re-scrape via Facebook's Sharing Debugger
   (developers.facebook.com/tools/debug/, the same crawler/cache WhatsApp uses).
9. Then, and only then, revisit T5.5 (Meta/Google/LinkedIn domain verification) — still also
   needs the real ad-platform accounts themselves (Section 5), not just the domain.

---

## 4. Security — what's solid, what's still open

**Already built and solid:**

- TOTP two-factor admin auth (ADR 0007), enforced server-side in `proxy.ts` (project root,
  never `app/proxy.ts` — see CLAUDE.md's own hard-won note on this) on every `/admin`/
  `/portal` request, never assumed from client-side routing.
- Password hashing via bcrypt/argon2 (`lib/auth/password.ts`), TOTP secrets encrypted at rest
  with AES-256-GCM (`lib/auth/totp-encryption.ts`), single-use backup codes.
- Rate limiting on the admin login/TOTP/password-reset routes (`lib/auth/rate-limit.ts`).
- Session policy: 30 min inactivity / 12 hr absolute (`docs/tasks/06-admin-auth.md`, T6.3).
- Automated backups: Railway's native PITR, ~4-week window, quarterly restore-test policy
  (ADR 0011).
- Personal-data deletion for enquiries (T8.4, just shipped) — the firm confirmed a converted
  enquiry is deleted the same as any other, no special retention carve-out.
- **Baseline HTTP security headers** (added session 60) — `next.config.ts`'s `headers()`
  sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on every route.
  HSTS already takes effect today — it only needs HTTPS, which Railway's raw domain already
  serves.
- **`app/robots.ts`** (added session 60) — allows everything except `/admin`, points at the
  dynamic sitemap. Verified live at `/robots.txt`.
- **Content-Security-Policy — built and verified, session 62.** Nonce-based, set in
  `proxy.ts` (not `next.config.ts` — CSP needs a fresh nonce per request, which a static
  header config can't generate), on every route site-wide, not just `/admin`. `script-src`
  uses `'nonce-<random>' 'strict-dynamic'` — the nonce is passed to GTM's bootstrap script
  (this project's one genuinely inline `<script>`) via `app/layout.tsx` reading an `x-nonce`
  request header, and Next.js's own framework-injected inline scripts (the hydration-payload
  `self.__next_f.push(...)` tags) pick up the same nonce automatically via Next's documented
  CSP-nonce mechanism (setting the header on both the outgoing request and the response —
  see `proxy.ts`'s own doc-comment). `'strict-dynamic'` is what lets GTM's nonce'd script load
  further scripts (GA4's `gtag.js`, and any future tag a partner adds via GTM's own UI,
  per `docs/user-guide.md`'s documented workflow) without each needing an explicit host
  entry. `img-src` includes `data:` (the admin 2FA setup screen's QR code renders as a
  data: URI) and the real `CLOUDFLARE_R2_PUBLIC_URL` origin (article/team images). Verified
  via a real local dev server with Playwright and the browser console open: home (GTM/GA4
  loaded, GA4's beacon sent, `strict-dynamic` confirmed working end-to-end), an Insights
  article, the diagnostic flow (including its inline-`style` progress bar), the contact form,
  full admin login (password → TOTP → session, using a computed real TOTP code, not
  skipped), the admin dashboard, Account & Security, and the 2FA setup screen's QR code —
  zero CSP violations on any of them. One inherent, documented limitation, not a bug: a
  genuinely new third-party domain added via GTM later (not just a new trigger/event using
  already-allowed hosts) would still need `connect-src`/`img-src`/`frame-src` updated here,
  since `strict-dynamic` only covers script loading, not the network calls those scripts
  make. **Not live yet** — built and committed locally, but this session cannot `git push`
  (CLAUDE.md's own blocked-by-design rule); the developer needs to push for it to actually
  deploy, then it's worth a quick live re-check the same way (Playwright, console open,
  same page list) since production is a materially different environment (real GTM/GA4
  traffic, not a dev-mode React build).
- **`www.kaalbert.com` → apex redirect — built and verified, session 62.** User added
  `www.kaalbert.com` as a second Railway custom domain (`railway domain` shows it `ACTIVE`
  with its own valid Railway-issued Let's Encrypt cert) plus the matching CNAME at the
  registrar. `proxy.ts` checks the request's `Host` header first, before any CSP/auth logic
  runs, and issues a `308 Permanent Redirect` to the same path + query string on
  `https://kaalbert.com` for anything hitting `www.kaalbert.com` — 308, not 301, so a non-GET
  request (a form POST, an API call) that somehow hit `www` keeps its method across the
  redirect, per RFC 7538. Verified locally via a spoofed `Host` header (`curl -H "Host:
www.kaalbert.com" ...`): correct `308` status, correct `location` with path/query
  preserved, and confirmed normal requests and the admin-auth redirect are both unaffected.
  **Not live yet** — same as CSP above, committed locally, needs a push. Once pushed, a
  real end-to-end check (visit `https://www.kaalbert.com/some-page` in a real browser,
  confirm it lands on the apex URL with no certificate warning) is worth doing, since a
  spoofed local `Host` header doesn't exercise the real DNS/TLS path.

**Real gaps — still your next scoped piece of work, deliberately not done this session:**

1. **Rate-limit state is in-memory** (flagged during T6.x build,
   `docs/sessions/session-38-admin-2fa-setup-flow.md`) — it resets on every Railway
   redeploy/restart and wouldn't be shared across multiple instances if the service ever
   scales beyond one. Fine at current traffic/instance-count; revisit if the service is ever
   scaled horizontally (move the counter to Postgres or a shared store).

2. **Dependency advisories**: `npm audit` shows 4 high-severity advisories, all inside
   Prisma CLI's **dev-only** dependency tree (`mysql2`, unrelated to this project's Postgres
   usage) — already tracked in `memory/technical-debt.md`, not a production runtime risk, no
   action needed beyond periodically checking whether a non-breaking Prisma CLI update
   clears it.

---

## 5. SEO — what's solid, what's still open

**Already built:**

- Per-page `meta_title`/`meta_description`, OG/Twitter tags, canonical URLs on every public
  page type (`lib/seo.ts`, Milestone 2's SEO foundation, T2.8).
- Organization JSON-LD sourced from `site_settings` on every page.
- Article-level structured data + correct `openGraph.type: "article"` with `Person`/
  `Organization` author fallback (T7.11).
- Dynamic, always-fresh XML sitemap (`app/sitemap.ts`) covering home/offers/pages/legal/
  articles.
- **Default OG/share image now uses the firm's dedicated image** (this session's fix, Section 2) instead of the plain logo — verified rendering correctly.
- **`robots.txt`** (added session 60) — see Section 4.

**Still open:**

1. **Domain verification (Google Search Console + Meta Business Manager)** — the domain
   itself is registered now (Section 3), so this is only blocked on the real ad-platform
   accounts (item 3 below) plus part of T5.5. Once those exist, Search Console verification
   can happen any time — it doesn't need Cloudflare in place first, just a DNS TXT record or
   the existing sitemap.
2. **Placeholder content still live** — this is the part of "full SEO" that isn't a code
   problem: indexing pages with clearly-marked draft/placeholder text is a real quality
   signal search engines and visitors both notice.
   - **3 of 4 legal pages** (`/legal/privacy-notice`, `/legal/cookie-notice`,
     `/legal/terms-of-use`) carry `isPlaceholder: true` content, each marked "Draft — pending
     legal review" on the page itself. `/legal/scope-of-practice` is real, firm-sourced
     content. **This needs the firm to supply final, counsel-reviewed wording** — not an
     engineering task (`docs/dashboard.md`'s Blocked On list).
   - **All diagnostic questions and score bands** are seeded `isPlaceholder: true` —
     illustrative content built from the mockups, flagged for firm review per
     `docs/roadmap.md`'s Milestone 3 goal, not blocking build but genuinely pending firm
     sign-off on the actual question wording/scoring bands before this is the _real_
     diagnostic the firm wants live.
   - When the firm supplies real copy for either, update the relevant rows via `/admin`
     (Milestone 7 built exactly this — Diagnostic Configuration, Legal pages) and flip
     `isPlaceholder` to `false` there; don't re-run `prisma/seed.ts` for this (seeding is
     idempotent but is the _initial_ content source, not the ongoing edit path once `/admin`
     exists).
3. **T5.5's Meta/Google Ads/LinkedIn pieces** — the domain precondition (Section 3) is now
   met; still needs real ad accounts (Meta Business Manager + Pixel + CAPI token, Google Ads
   account, LinkedIn Campaign Manager access) that don't exist yet. Not a launch blocker per
   `docs/roadmap.md` — only needed once the firm is ready to run paid campaigns.

---

## 6. Environment variables — full reference

Set on the live `kaalbert-web` Railway service unless noted otherwise. Never put real values
in this file, `CLAUDE.md`, or anywhere committed — `CLAUDE.local.md` (gitignored) is where
your own local notes on these live.

| Variable                                                                                         | Status on live service                             | Notes                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                   | ✅ Set (`${{Postgres.DATABASE_URL}}` reference)    | Railway's private network — see Section 7 on why there's only one database, not a separate "production" one to switch to.                                                                                                                                                                                                                                                                                       |
| `ADMIN_CHALLENGE_TOKEN_SECRET`                                                                   | ✅ Set and confirmed live — see Section 9          | Was missing entirely until session 54 (2026-09-11), which hard-blocked every real admin login. Confirmed live and working session 60 (a real account was created end-to-end, and the redeploy that picked up the fix was confirmed) — `memory/known-bugs.md`'s entry is closed.                                                                                                                                 |
| `ADMIN_TOTP_ENCRYPTION_KEY`                                                                      | ✅ Set and confirmed live — same as above          | Same incident, same fix, now confirmed.                                                                                                                                                                                                                                                                                                                                                                         |
| `NEXT_PUBLIC_SITE_URL`                                                                           | ✅ Set (`https://kaalbert.com`)                    | Set 2026-09-16 (session 62). Apex is canonical, not `www` — `www.kaalbert.com` exists as a Railway custom domain too, but `proxy.ts` redirects it to apex (Section 4). Code fallback in `lib/seo.ts` matches this too, so a future preview/staging environment that forgets to set it still gets the right production URLs.                                                                                     |
| `GTM_CONTAINER_ID`                                                                               | ✅ Set (`GTM-PDGKRKRN`)                            | Real container, live.                                                                                                                                                                                                                                                                                                                                                                                           |
| `META_CAPI_ACCESS_TOKEN`                                                                         | ❌ Blank everywhere                                | Genuinely blocked on a real Meta ad account existing — not a gap to fill speculatively (T5.5's own precondition).                                                                                                                                                                                                                                                                                               |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME`                                     | ✅ Set (`info@kaalbert.com`, domain-authenticated) | Switched from `kaalbert.company@gmail.com` 2026-09-16 (session 62). `kaalbert.com` is now Brevo-authenticated (Brevo-code TXT, 2 DKIM CNAMEs, DMARC TXT, plus branded-link CNAMEs). Verified end-to-end via a real password-reset send: Brevo's own event log shows `requests` → `delivered` → `opened`, `from: info@kaalbert.com`. The old Gmail sender is left in Brevo, unused, as a fallback — not deleted. |
| `CLOUDFLARE_R2_ACCOUNT_ID` / `_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` / `_BUCKET` / `_PUBLIC_URL` | ✅ Set                                             | Provisioned session 54; now also correctly `preserve()`d in `.railway/railway.ts` (this session's fix).                                                                                                                                                                                                                                                                                                         |
| `PAYSTACK_SECRET_KEY`                                                                            | Not needed yet                                     | Milestone 13 (Phase 2, gated) — do not add until that trigger is met.                                                                                                                                                                                                                                                                                                                                           |
| Calendar-sync credentials                                                                        | Not needed yet                                     | Milestone 10 (Phase 2, gated).                                                                                                                                                                                                                                                                                                                                                                                  |
| CRM webhook target + auth                                                                        | Not needed yet                                     | Milestone 15 (Phase 2, gated).                                                                                                                                                                                                                                                                                                                                                                                  |

**Brevo domain authentication — done, session 62.** The firm has Zoho mail hosting for
`kaalbert.com` (`albert@kaalbert.com` already existed). Considered `no-reply@kaalbert.com`
(the usual convention for automated mail) versus `info@kaalbert.com`, and chose
**`info@kaalbert.com`** — deliberately, after discussion: `sendTransactionalEmail` in
`lib/email.ts` is one shared utility used for _both_ internal admin mail (password resets,
team invites) _and_ the diagnostic's "email me the full summary" send, which is a
lead-nurturing touchpoint for a business-development site, not pure system plumbing. A
`no-reply@` sender on the exact email meant to keep an engaged prospect talking works against
the site's own conversion goal. `info@kaalbert.com` is used as `BREVO_SENDER_EMAIL`.

What was actually done:

1. **Zoho**: added `info` as an alias on `albert@kaalbert.com`'s mailbox (Users → Email
   Aliases → add `info`), **not** a separate mailbox ("Set as Mailbox" left unchecked) — mail
   to `info@kaalbert.com` lands directly in the inbox already being watched.
2. **Brevo**: Senders, Domains & Dedicated IPs → Domains → Add a domain → `kaalbert.com`.
   Brevo's own flow generated: a Brevo-verification TXT code, 2 DKIM CNAME records, a DMARC
   TXT record, and (opted into) 3 branded-link/image CNAMEs under a chosen `email.kaalbert.com`
   subdomain.
3. **DNS**, added manually at Namecheap (the registrar — Cloudflare is deferred, see Section
   3): all of the above, one record at a time via Namecheap's **manual** "Add New Record"
   flow.
   <br>**A real near-miss worth recording**: Namecheap's own "automatic" DNS-sync tool (a
   different, separate flow from manually adding records) surfaced a screen mid-setup showing
   it was about to "replace" the apex `kaalbert.com` CNAME record (the one pointing at
   Railway, `qrulko1j.up.railway.app`) — completely unrelated to anything Brevo actually
   needed. Caught before confirming, cancelled, and every record was instead added manually,
   one at a time, leaving the apex record and all existing Zoho records untouched. **Lesson:
   never use a registrar's "automatic"/"sync" DNS tool for a third-party integration setup —
   add each record manually, and scrutinize any screen claiming it will "replace" or
   "overwrite" an existing record before confirming**, especially one you didn't expect it to
   touch.
4. Brevo showed the domain **Authenticated**; added `info@kaalbert.com` as a sender
   (auto-verified, no 6-digit code needed since the domain was already authenticated).
5. Set `BREVO_SENDER_EMAIL=info@kaalbert.com` live (`.env.local`, `.env.production`,
   `railway variable set` — already `preserve()`d in `.railway/railway.ts`, no IaC change
   needed for a value change), which triggered a redeploy (confirmed completed).
6. **Verified end-to-end**, not just assumed: triggered a real password-reset email via
   `POST /api/admin/auth/request-password-reset` against the live site, then confirmed via
   Brevo's own `GET /v3/smtp/statistics/events` API that it shows `requests` → `delivered` →
   `opened`, `from: info@kaalbert.com`. The old `kaalbert.company@gmail.com` sender is left in
   Brevo, unused, as a fallback — not deleted, since there's no real cost to keeping an
   unused verified sender around.

**Adding a new variable safely, going forward:** set it live with `railway variable set
KEY=value --service kaalbert-web`, **then immediately add a matching `preserve()` entry to
`.railway/railway.ts`** in the same session — the two admin-auth secrets and all five R2
variables sat unprotected in the live service for weeks specifically because this second step
was skipped both times. Run `railway config plan` before ever running `railway config apply`
for any reason — it shows you exactly what would be deleted before it happens.

---

## 7. Database — there is no separate "production" database to switch to

This project deliberately uses **one** Railway-bundled Postgres instance for everything (ADR 0003) — there was never a plan for a separate dev/staging/production database tier. What
"local dev" and "the live app" actually differ on is only the **connection path**:

- Local dev (`.env.local`) connects via Railway's public TCP proxy
  (`railway tcp-proxy list --service Postgres`).
- The live `kaalbert-web` service connects via Railway's private network reference
  (`${{Postgres.DATABASE_URL}}`), which only resolves inside Railway's own network.

Both point at the same physical database. This means:

- **Migrations already run automatically on every deploy** — `.railway/railway.ts`'s
  `kaalbert-web` service `start` command is `npx prisma migrate deploy && npm start`. There
  is nothing further to "switch on" here.
- **Seeding has already happened against the real (only) database** — the live site is
  already showing seeded content (offers, pages, diagnostic questions, legal pages), which is
  only possible because `npm run db:seed` (`prisma/seed.ts`) has already run against this
  same instance. `prisma/seed.ts`'s writes are all `upsert`s, so re-running it is always safe
  — it will never duplicate rows or wipe partner-edited content it doesn't own.
- **What's actually still pending isn't "switching databases," it's replacing placeholder
  content** (Section 5, item 3) — a content task, not a database task.
- If real client/engagement data volume ever justifies it, revisit whether a second Postgres
  instance is warranted (e.g. once the Phase 2 Client Portal, gated, holds genuinely sensitive
  per-client data) — not needed today, and ADR 0003 doesn't currently call for it.

**A local `.env.local`/`.env.production` file is never read by the deployed app** (ADR 0008
— no dual-host portability design, so there's deliberately no "load from a file" fallback in
production). Every value the live app needs must be set directly on the Railway service, full
stop — this is exactly the mistake that caused the admin-secrets incident in Section 9.

---

## 8. Creating partner (admin) user accounts

**Superseded later in session 60 — the CLI script below is no longer the primary path.**
This section originally said there's no self-service invite UI and a developer-run script is
proportionate for five partners created rarely. That reasoning was directly overridden by the
user the same session, after testing the live app surfaced how much it was actually blocking
(zero of the 5 real partners had ever gotten a login as a result). A real in-app invite flow
now exists — use it. The CLI script is kept documented below only as a **disaster-recovery
fallback**: it's the one way to create a login when no Owner account exists to use the invite
screen with (e.g. a from-scratch environment, or every Owner account somehow lost at once).

### The normal way — invite from inside `/admin` (Owner-only)

1. Log in as an Owner account, go to **Team** in the sidebar, click **"Add partner"**
   (`/admin/team/new` — not visible to a Partner-role account, by design).
2. Choose **"Link an existing profile"** for one of the partner profiles already seeded
   (`Author.adminUserId` is still `null` on all 5 real partners as of session 61 — none has
   actually been invited yet, that's the firm's own call to make whenever ready), or **"Create
   a brand-new partner"** to build both the profile and the login together.
3. Enter the partner's real **email** and pick a **Role** (defaults to Owner automatically
   when linking a profile titled "Lead Partner," editable either way — see
   `docs/features/admin-authentication.md`'s Roles section for what each tier can do).
4. Click **Send invite**. This generates a real random password, creates the `admin_user`
   row (and the `author` link, or a brand-new `author` row), and attempts to email the
   partner a temporary password plus a 2FA setup link via the firm's own Brevo account. What
   you see next depends on whether that email actually sent — these are the only two
   outcomes, nothing in between:
   - **Normal case — the email sent successfully.** The screen shows a plain confirmation
     ("An invite email... has been sent to \<address\>") and **nothing else** — no password, no
     setup link, on screen or anywhere else. This is deliberate, not a shortened success
     message: once Brevo has accepted delivery, this app never displays a live credential
     again, the same discipline as every other credential in this system (a backup code, a
     reset link). If you see this message, there is nothing further for you to relay — the
     partner's own inbox has everything they need.
   - **Only if the email genuinely fails to send** (e.g. Brevo misconfigured or down) — the
     account is still created, but the screen instead shows the one-time password and setup
     link directly, for you to relay manually the same way the old script's output worked.
     This is the _only_ case where you ever see or handle these credentials yourself.
5. The partner follows the link, sets/confirms nothing extra (the password is already set —
   they can change it later from their own `/admin/account`), and completes TOTP enrollment:
   scanning a QR code, then saving the 8 single-use backup codes shown once.

Full field-by-field walkthrough (this exact flow, plus every other Team screen action) is in
`docs/user-guide.md`'s "Editing your team profile" section and its published Artifact mirror
— that's the canonical, kept-current version; don't let this guide's own copy of the steps
drift from it.

### The fallback way — `scripts/create-admin-user.ts`, when no Owner exists to invite from

Same real script as before, same real caveats about `railway run` vs. running it locally —
unchanged since last verified session 60:

`railway run --service kaalbert-web -- npm run admin:create-user ...` **does not work**:
`railway run` executes the command on _your own machine_, only injecting the live service's
environment variables into it. `kaalbert-web`'s `DATABASE_URL` resolves to the
**private-network** hostname `postgres.railway.internal`, unreachable from your laptop —
exactly the `Can't reach database server at postgres.railway.internal` error a first attempt
hits.

**What actually works — run it locally, no `railway run` wrapper:**

```bash
npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"
```

This works because of something §7 already establishes: there is only **one** Postgres
instance, and your own `.env.local` already holds a working connection string to it — the
public TCP proxy, reachable from your own machine, pointed at the exact same database the
live app reads from `postgres.railway.internal`. Running the script bare (letting `dotenv`
load `.env.local` normally) reaches that same database directly.

**No `NEXT_PUBLIC_SITE_URL` override needed anymore (updated session 62)** — `.env.local`
now sets it to the real, live, resolvable `https://kaalbert.com`, so the script's printed
setup link is already correct without any override. (Before the domain was registered, an
override to `https://kaalbert.up.railway.app` was required here — without it, `getSiteUrl()`'s
fallback printed a setup link pointing at a domain that didn't resolve. If you ever need to
generate a link against a different environment, e.g. a Railway preview, override
`NEXT_PUBLIC_SITE_URL` for that one run instead of relying on `.env.local`'s default.)

The script prints the generated password and a one-time setup link to your terminal — never
anywhere else. Relay both to the partner over a secure channel, same as the invite flow's own
email-failure fallback above. **One real gap this path has that the in-app invite doesn't**:
it only ever creates a brand-new `admin_user` row with no `Author` — it can't link the new
login to one of the 5 real partner profiles already seeded the way the in-app "Link an
existing profile" mode does. There's no CLI equivalent of that linking step; in practice,
prefer the in-app invite flow whenever any Owner account is reachable, and treat this script
as truly last-resort — the case it actually exists for.

Can also be run inside the live container instead of locally, via `railway ssh` (not
`railway run`) — needs `railway ssh keys add` done once first:

```bash
railway ssh --service kaalbert-web -- npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"
```

### Lost device and lost backup codes, together

**No longer a raw database update — a real Owner-facing button exists.** An Owner opens that
partner's entry under **Team**, and the **"Login account"** panel (only rendered for an
Owner viewer, once the partner actually has a linked login) has a **"Reset 2FA enrolment"**
button — click it, relay the one-time re-enrollment link it returns. This calls the same
`reissueSetupToken` mechanism session 60 fixed a real bug in (the original version issued a
link that could never actually be completed for an already-enrolled account — see
`memory/known-bugs.md`). There is still no self-service bypass of 2FA itself for the case
where a partner has genuinely lost both their device and their backup codes, by design
(`CLAUDE.md`'s Auth Pattern section) — but voluntarily switching devices while still holding
the old one is self-service now too, from that partner's own `/admin/account` → "Set up a new
device."

**Verified working, session 60**: created a real account this way (`admin_user #15`), got a
real printed password and a real, resolving setup link. §9 covers the admin-login secrets
question this used to raise — now resolved.

---

## 9. Resolved: admin login secrets bug

`memory/known-bugs.md` carried an **Open, High-severity** entry: the live `kaalbert-web`
service was found (session 54, 2026-09-11) missing `ADMIN_CHALLENGE_TOKEN_SECRET`/
`ADMIN_TOTP_ENCRYPTION_KEY` entirely, meaning every real `/admin/login` attempt was
hard-erroring. The values were set that session, but the follow-up redeploy needed to pick
them up was never confirmed as having actually happened.

**Closed session 60**: you confirmed a real redeploy did happen after the variables were set
— your own normal push, picked up automatically by `kaalbert-web`'s GitHub auto-deploy
wiring, with no separate manual `railway redeploy` ever actually needed. Combined with this
session's own evidence (the live deployment timestamp postdating the variable-set, and a
clean `200` from `GET /admin/login` rather than a crash) and this session's own account
creation succeeding end-to-end (§8), `memory/known-bugs.md`'s entry is now `Status: Fixed`.

Nothing further to do here. If admin login ever regresses again, the first thing to check is
still the same: `railway variables --service kaalbert-web` for both secrets being present,
then whether the live deployment actually postdates any recent variable change.

---

## 10. Ongoing responsibilities, after "launch"

These don't stop once the domain is live — they're the recurring part of the job:

- **Quarterly restore test** (ADR 0011) — the first one is scheduled for the month after
  launch; actually perform it (a real Railway PITR restore to a new volume, verified, not
  just confirmed to exist in the dashboard) and log the date/target timestamp/pass-fail
  result the same way the firm logs its other recurring confirmations.
- **Keep `.railway/railway.ts` and the live service in sync** — every time you add a real
  env var to the live service, add its `preserve()` (or real value/`ref()`, for a brand-new
  service) to the file in the same sitting. Always `railway config plan` before
  `railway config apply`, no exceptions — this is the exact mistake that caused two separate
  incidents already (Section 6).
- **Watch `memory/known-bugs.md` and `memory/technical-debt.md`** — check them at the start
  of a session touching related code, not just when something breaks.
- **Dependency hygiene** — periodically re-run `npm audit`, and keep an eye on whether a
  non-breaking Prisma CLI release clears the dev-only `mysql2` advisories (Section 4, item 3).
- **Respect the Phase 2 gate** — don't build or scope any of Milestones 10–17 until
  `docs/scope.md`'s specific evidence trigger for that capability is met _and_ the user says
  to proceed. This applies to you as much as it applies to any agent session.
- **Keep both firm-facing documents current as you work**, not just this one:
  `docs/user-guide.md` (every task that changes what a partner can do/see/monitor) and the
  "Website Build Status" Artifact (only at milestone/epic completion or a major
  architecture/process change) — see CLAUDE.md's "Firm-Facing Documentation" section for the
  exact update rules and current Artifact URLs.
- **Session discipline** — one task per session commit, full Task Completion Checklist every
  time, a session summary file before ending, per CLAUDE.md and the `session-management`
  skill. This guide is not a replacement for that process, just the parts of it specific to
  you as the vendor rather than to any one task.

---

## 11. Quick command reference

```bash
# Normal way to create a partner account: log in as an Owner, Team → "Add partner"
# (/admin/team/new) — see §8. The commands below are the disaster-recovery fallback only,
# for when no Owner account exists to invite from.

# Fallback: create a new admin account via the CLI script (reaches the one shared database
# via .env.local's public proxy connection — see §8 for why `railway run` does NOT work).
# No NEXT_PUBLIC_SITE_URL override needed — .env.local sets the real, live kaalbert.com.
npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"

# Same, but executed inside the live container over Railway's own network instead
# (needs `railway ssh keys add` done once first)
railway ssh --service kaalbert-web -- npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"

# Check what's currently set on the live service
railway variables --service kaalbert-web

# Preview an infrastructure change before it touches anything live
railway config plan

# Apply a reviewed infrastructure change
railway config apply

# Trigger a redeploy without a new push (e.g. to pick up a variable set with --skip-deploys)
railway redeploy --service kaalbert-web

# Full local quality gate before any commit
npm run lint && npm run format:check && npm run typecheck && npm run test
```
