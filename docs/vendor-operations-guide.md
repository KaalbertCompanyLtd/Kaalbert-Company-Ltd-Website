# Vendor / Developer Operations Guide — kaalbert.com

**Audience:** you, as the developer/vendor responsible for this platform — not the firm (see
`docs/user-guide.md` for that). This is the "everything I have to do or keep doing" reference:
what's left before this can be called properly launched, how to run the operations only a
developer can run (creating partner accounts, managing secrets, Railway infrastructure), and
what to keep doing on an ongoing basis after launch.

**Last updated:** 2026-09-12 (session 60, second pass — closed out most of the gaps this
guide itself flagged in its first pass the same session). Update this file the same way
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
- **The live app today** is reachable only at `https://kaalbert.up.railway.app` — **the real
  `kaalbert.com` domain has never been registered** (confirmed via WHOIS, `memory/
technical-debt.md`). This is the single biggest thing blocking a "real" production launch;
  see Section 3.

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

**Still deliberately left open — see §4/§5 for why:** Content-Security-Policy and persistent
rate-limit storage. Both need either a live domain to test against safely or a scoped
decision that's genuinely yours to make, not a same-session mechanical fix.

---

## 3. The one blocker that gates almost everything else: register the domain

`kaalbert.com` is not registered (`memory/technical-debt.md`, raised 2026-09-04, still Open,
**User-triggered** — an agent cannot register a domain). Until it is:

- Cloudflare (ADR 0004) has no zone to front the site with — no CDN, no edge-level security
  headers/WAF, no free TLS-at-the-edge beyond what Railway's own raw domain already gives you.
- Meta Business Manager domain verification and Google Search Console verification (both part
  of T5.5 and of "full SEO") cannot be completed — they verify ownership of a real domain.
- The canonical URLs, sitemap, Organization JSON-LD, and OG tags already correctly point at
  `https://www.kaalbert.com` (`lib/seo.ts`'s `getSiteUrl()` fallback) — but that domain isn't
  actually serving anything yet, so every one of those is describing a site that doesn't
  resolve.
- Brevo's transactional email sender is presumably still verified against whatever interim
  domain/email was used when it was set up (T3.7 chose Brevo specifically because it doesn't
  require a registered domain) — worth re-checking once `kaalbert.com` exists, in case the
  firm wants mail sent from a `@kaalbert.com` address for deliverability/trust reasons.

**What to actually do, once you/the firm decide to register it:**

1. Register `kaalbert.com` through a registrar of your choice.
2. Add the domain to Cloudflare, point its DNS at the Railway service (ADR 0004).
3. Add it as a custom domain on Railway: `railway domain kaalbert.com` (or via the dashboard).
4. Set `NEXT_PUBLIC_SITE_URL=https://www.kaalbert.com` on the live `kaalbert-web` service (it
   currently falls back to the right value anyway, but set it explicitly once the domain is
   live rather than relying on the fallback silently doing the right thing).
5. Re-check Section 6's full env-var table once the domain exists — a couple of rows (Brevo's
   sender address, in particular) are worth revisiting once a real `@kaalbert.com` address is
   possible.
6. Then, and only then, do T5.5 (Meta/Google/LinkedIn domain verification) — see
   `docs/tasks/05-landing-and-measurement.md`.
7. In Cloudflare's dashboard once the zone exists: turn on "Always Use HTTPS" and enable HSTS
   — this is the free, no-code way to get several of Section 4's security wins at the edge
   instead of (or in addition to) in `next.config.ts`.

Until this happens, treat the Railway URL as a working staging environment, not the live
public site — which, practically, is exactly what it is right now.

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

**Real gaps — still your next scoped piece of work, deliberately not done this session:**

1. **Content-Security-Policy — deliberately not drafted.** A CSP has to allowlist GTM's
   script host, Google Fonts (if used), the Cloudflare R2 public URL for images
   (`CLOUDFLARE_R2_PUBLIC_URL`), and Brevo/whatever else fires client-side — get any of that
   wrong and pages silently break (blocked scripts/images, no error surfaced to a visitor).
   Do this as its own task once the real domain exists, and verify every page type
   (home, an article with an R2 image, the diagnostic, `/admin`) via Playwright MCP with the
   browser console open before calling it done.

2. **Rate-limit state is in-memory** (flagged during T6.x build,
   `docs/sessions/session-38-admin-2fa-setup-flow.md`) — it resets on every Railway
   redeploy/restart and wouldn't be shared across multiple instances if the service ever
   scales beyond one. Fine at current traffic/instance-count; revisit if the service is ever
   scaled horizontally (move the counter to Postgres or a shared store).

3. **Dependency advisories**: `npm audit` shows 4 high-severity advisories, all inside
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

1. **Domain verification (Google Search Console + Meta Business Manager)** — blocked on
   domain registration (Section 3), then part of T5.5.
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
3. **T5.5's Meta/Google Ads/LinkedIn pieces** — see Section 3, needs the domain plus real ad
   accounts (Meta Business Manager + Pixel + CAPI token, Google Ads account, LinkedIn
   Campaign Manager access) that don't exist yet. Not a launch blocker per
   `docs/roadmap.md` — only needed once the firm is ready to run paid campaigns.

---

## 6. Environment variables — full reference

Set on the live `kaalbert-web` Railway service unless noted otherwise. Never put real values
in this file, `CLAUDE.md`, or anywhere committed — `CLAUDE.local.md` (gitignored) is where
your own local notes on these live.

| Variable                                                                                         | Status on live service                          | Notes                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                   | ✅ Set (`${{Postgres.DATABASE_URL}}` reference) | Railway's private network — see Section 7 on why there's only one database, not a separate "production" one to switch to.                                                                                                                                                       |
| `ADMIN_CHALLENGE_TOKEN_SECRET`                                                                   | ✅ Set and confirmed live — see Section 9       | Was missing entirely until session 54 (2026-09-11), which hard-blocked every real admin login. Confirmed live and working session 60 (a real account was created end-to-end, and the redeploy that picked up the fix was confirmed) — `memory/known-bugs.md`'s entry is closed. |
| `ADMIN_TOTP_ENCRYPTION_KEY`                                                                      | ✅ Set and confirmed live — same as above       | Same incident, same fix, now confirmed.                                                                                                                                                                                                                                         |
| `NEXT_PUBLIC_SITE_URL`                                                                           | ❌ Not set                                      | Falls back to `https://www.kaalbert.com` in code (`lib/seo.ts`), which is correct once that domain is live — but set it explicitly once it is, per Section 3.                                                                                                                   |
| `GTM_CONTAINER_ID`                                                                               | ✅ Set (`GTM-PDGKRKRN`)                         | Real container, live.                                                                                                                                                                                                                                                           |
| `META_CAPI_ACCESS_TOKEN`                                                                         | ❌ Blank everywhere                             | Genuinely blocked on a real Meta ad account existing — not a gap to fill speculatively (T5.5's own precondition).                                                                                                                                                               |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME`                                     | ✅ Set                                          | Real account, verified sender, live. Re-check the sender address once `kaalbert.com` exists (Section 3).                                                                                                                                                                        |
| `CLOUDFLARE_R2_ACCOUNT_ID` / `_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` / `_BUCKET` / `_PUBLIC_URL` | ✅ Set                                          | Provisioned session 54; now also correctly `preserve()`d in `.railway/railway.ts` (this session's fix).                                                                                                                                                                         |
| `PAYSTACK_SECRET_KEY`                                                                            | Not needed yet                                  | Milestone 13 (Phase 2, gated) — do not add until that trigger is met.                                                                                                                                                                                                           |
| Calendar-sync credentials                                                                        | Not needed yet                                  | Milestone 10 (Phase 2, gated).                                                                                                                                                                                                                                                  |
| CRM webhook target + auth                                                                        | Not needed yet                                  | Milestone 15 (Phase 2, gated).                                                                                                                                                                                                                                                  |

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

There is **no self-service "invite a partner" UI**, and that's a deliberate choice
(`scripts/create-admin-user.ts`'s own doc comment): with a fixed five partners and accounts
created rarely, a developer-run script is proportionate — a full invite UI would be more
process than this firm's scale justifies.

**How to create one — corrected this session, after your own attempt caught a real bug in
the first version of this guide.**

The first version told you to run `railway run --service kaalbert-web -- npm run
admin:create-user ...`. **That doesn't work, and can't be made to work as written**:
`railway run` executes the command on _your own machine_, only injecting the live service's
environment variables into it. `kaalbert-web`'s `DATABASE_URL` is declared as
`${{Postgres.DATABASE_URL}}`, which resolves to the **private-network** hostname
`postgres.railway.internal` — a hostname that only resolves _inside_ Railway's own
infrastructure. Injected into a process running on your laptop, it's simply unreachable —
exactly the `Can't reach database server at postgres.railway.internal` error you hit.

**What actually works — run it locally, no `railway run` wrapper:**

```bash
NEXT_PUBLIC_SITE_URL="https://kaalbert.up.railway.app" \
  npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"
```

This works because of something §7 already establishes: there is only **one** Postgres
instance, and your own `.env.local` already holds a working connection string to it — the
public TCP proxy (`metro.proxy.rlwy.net:...`), reachable from your own machine, pointed at
the exact same database the live app reads from `postgres.railway.internal`. Running the
script bare (letting `dotenv` load `.env.local` normally) reaches that same database
directly — no Railway wrapper needed at all. Verified working session 60: `npx prisma
migrate status` confirmed connectivity first, then the real command created a real account
and printed a real, working setup link.

The `NEXT_PUBLIC_SITE_URL` override matters **only until `kaalbert.com` is registered and
that variable is set on the live service (§3)** — without it, `getSiteUrl()`'s fallback
would print a setup link pointing at `https://www.kaalbert.com`, a domain that doesn't
resolve to anything yet, and the partner's link would be dead on arrival. Once the domain is
live and `NEXT_PUBLIC_SITE_URL` is set for real, drop the override — the script will pick up
the right base URL on its own.

1. Run the command above (omit `--password` to have the script generate a strong random one).
2. The script prints two things to your terminal — **never anywhere else, never logged, never
   stored a second time**: the generated initial password (skip this line if you supplied
   your own), and a one-time setup link, valid **7 days**.
3. **Send both to the partner over a secure channel** (not plaintext email if you can help
   it — WhatsApp or a password manager's sharing feature is better).
4. The partner opens the setup link, sets/confirms their password, and is walked through TOTP
   enrollment: scanning a QR code with an authenticator app (Google Authenticator, Authy,
   1Password, etc.) and saving the **8 single-use backup codes** shown once at enrollment —
   tell them explicitly to save these somewhere durable, since there's no way to view them
   again later.
5. From then on, the partner logs in normally at `/admin/login` with their email/password,
   then their live 6-digit TOTP code.

### Can this be run "on Railway" instead of locally?

Yes, via `railway ssh` — **not** `railway run`. `railway ssh --service kaalbert-web -- <cmd>`
opens a real connection into the actual running container, executing the command inside
Railway's own network (where `postgres.railway.internal` genuinely does resolve, and where
the live service's real env vars are the ones that apply — no `NEXT_PUBLIC_SITE_URL`
override needed once that's set for real). Tested session 60:

```bash
railway ssh --service kaalbert-web -- npm run admin:create-user -- --name "Full Name" --email "partner@kaalbert.com"
```

**One-time prerequisite**: this account has no SSH key registered yet — the first attempt
failed with `No registered SSH keys found`. Register one before this will work:

```bash
railway ssh keys add        # generates/registers a new key, or
railway ssh keys github     # imports from your GitHub account
```

This is a one-time step tied to your Railway account/identity, not something to do
automatically inside an agent session — do it yourself, once, then `railway ssh` works from
any terminal you're logged into Railway from. Until then, the local method above is the one
that actually works today, and is arguably simpler anyway (no SSH key management, and you
were going to need `.env.local` working for ordinary local dev regardless).

**Lost device and lost backup codes, together:** there is no self-service 2FA bypass anywhere
in this system, by design (`CLAUDE.md`'s Auth Pattern section). Another administrator has to
reset that partner's 2FA enrollment directly — there's no built `/admin` screen for this yet
either (5 partners, rare event); for now this means a direct database update
(`admin_user.totpSecret = null`, `totpVerifiedAt = null`) run by you, followed by the partner
going through `/admin/setup-2fa` again. If this becomes a recurring need, it's a small,
real candidate for a future admin-facing task — not built speculatively now.

**Verified working, session 60**: created a real account this way (`admin_user #15`), got a
real printed password and a real, resolving setup link at
`https://kaalbert.up.railway.app/admin/setup-2fa?token=...`. §9 covers the admin-login
secrets question this used to raise — now resolved.

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
# Create a new partner admin account (reaches the one shared database via .env.local's
# public proxy connection — see §8 for why `railway run` does NOT work for this)
NEXT_PUBLIC_SITE_URL="https://kaalbert.up.railway.app" \
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
