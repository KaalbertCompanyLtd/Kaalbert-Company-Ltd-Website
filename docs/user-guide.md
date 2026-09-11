# Platform User Guide — kaalbert.com

**A living reference for the firm: what the platform can do today, exactly how to do each
thing yourself, what to keep an eye on, and what still needs a developer.** Mirrored as an
Artifact page — <https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc> — both
copies are updated together, every time a task changes what's true here. This is not an
end-of-project audit; see "How this guide is maintained" below.

## How this guide is maintained

Updated task-by-task, not in one pass after everything is built (CLAUDE.md's Knowledge
Management Responsibilities section makes this a standing rule, not a one-off request).
Concretely: whenever a task changes what a partner can do, see, or needs to monitor — a new
page, a new admin capability, a new external account/dashboard, a new email or notification
behaviour — this file and its Artifact mirror are updated in the same session, as part of
that task's own completion checklist. Nothing here should ever be more than one completed
task out of date.

Every capability a partner can operate themselves is written as a **numbered walkthrough**,
not just a statement that it exists — the exact screen, the exact button/link text, and what
each field on it means. If you can't tell from a section below exactly what to click and
what to type, that's a gap in this file, not something to guess at in the admin area itself.

This file is the operational manual (what exists, how to run it day to day). A separate,
shorter Artifact — **"Website Build Status"**,
<https://claude.ai/code/artifact/a26811bf-998b-4899-b3ad-0d03ce7c828f> — is the
plain-language progress report for the firm; it's updated only at milestone/epic completion
or a major change, not every task. See CLAUDE.md's "Firm-Facing Documentation" section and
`memory/decision-log.md` for the exact update rule for each.

**As of:** 2026-09-11 (session 50) — Milestones 1–4 complete; Milestone 5 complete through
T5.1–T5.4 (T5.5 deliberately deferred to just before Milestone 9); Milestone 6 (Admin
Authentication) complete, plus a self-service password reset (T6.7) added after the fact.
Milestone 7 (Content Management Admin) underway — the admin dashboard (T7.1), Articles/
Categories admin (T7.2), Pages admin (Capabilities/Our Method/Legal/Footer, T7.3), Offers
admin (the three core offers plus the Advisory Retainer, T7.4), Landing Pages admin
(create-only, T7.5), Team admin (T7.6), and Diagnostic Configuration (T7.7) are all live; Site
Settings, Subscribers, and article-resource attachment are next.

---

## Logging in

Every screen below lives under `/admin`, and every one of them requires being logged in
first.

1. Go to `kaalbert.com/admin/login` (or wherever the site is currently hosted, if the
   domain isn't live yet).
2. Enter your **email** and **password**, click **Continue**.
3. Enter the current **6-digit code from your authenticator app**, click **Continue**. This
   step is never skippable — there is no admin action reachable with just a password.
4. You land on the **Dashboard** — see "Admin dashboard" below.

**Forgotten your password?** Click **"Forgot password?"** on the login screen, enter your
email, then check that inbox for a reset link (valid for 1 hour, works once). Follow it,
choose a new password. No developer or other partner needs to be involved, as long as you
still have access to your own email. This never bypasses your authenticator app — you'll
still need it to actually log in afterward.

**Lost your authenticator device?** Click **"Use a backup code instead"** on the code-entry
screen and enter one of the 8 backup codes you were shown once, at setup. This logs you in
and immediately forces you to set up a new device before you can do anything else — there is
no other way back in with a backup code alone. If you've lost both your device _and_ your
backup codes, there is no self-service recovery — ask another partner to reset your 2FA
enrolment from your entry under `/admin/team` (see "Team" below).

**Getting your very first account** isn't self-service — it's created by the developer, who
hands you a one-time setup link (valid 7 days) through whatever secure channel the firm
already uses. There is deliberately no "invite a partner" button anywhere in the admin area —
with five partners and new accounts created rarely, asking the developer each time is simpler
than a self-service invite flow used only a handful of times ever.

---

## Admin dashboard

Reached automatically after login, or any time via the **Dashboard** link at the top of the
sidebar.

**What it shows:** four live counts (new enquiries, triage-flagged, diagnostics completed
this month, published articles) and a table of the 5 most recent enquiries (name, source,
triage status, status). Everything on it is real, live data — there is nothing to configure
here.

**What you can't do here yet:** open an enquiry, change its status, or filter the list — that
arrives with Milestone 8 (Enquiry Management). Today's dashboard is look-but-not-touch. Every
enquiry currently shows status "New" and Triage as Flagged/Not flagged only (not a
High/Medium/Low priority) — both accurate today, not a bug; they become real once Milestone 8
ships.

---

## Editing marketing page copy (Capabilities, Our Method)

`/admin/pages` — click **Pages** in the sidebar. This screen is a simple menu: two page
cards (**Capabilities**, **Our Method**) and a link to the legal-pages/footer screen (see
below). Click a card's title to open its editor.

### Capabilities — `/admin/pages/capabilities`

1. **Hero** panel at the top — edit **Kicker** (the small label above the heading),
   **Heading**, **Lead** (the paragraph under it), plus **Meta title**/**Meta description**
   (what shows in a Google search result for this page).
2. **The eight service lines** panel below it — one fixed box per service (you can't add,
   remove, or reorder these; the page always has exactly eight). Each box shows its `slug` in
   grey (this is the internal lookup key `/contact?service=...` uses — it never changes here,
   not editable). Edit that service's **Name** and **Short description**.
3. Tick **"This complies with 10.05 Positioning and Claims Guidance Note"** at the bottom —
   the **Save** button stays disabled until you do. This page has no separate draft/publish
   step: clicking Save makes your change live immediately, so the checkbox is the sign-off
   moment, not a formality.
4. Click **Save**.

### Our Method — `/admin/pages/our-method`

Same shape as Capabilities, with two differences:

1. There's an extra **Intro copy** field in the Hero panel — the three core-offer names
   (Business Health Check, Financial Clarity Pack, Funding-Readiness Pack) are auto-linked
   wherever they appear in this text, no manual linking needed.
2. **The four stages** panel is fixed in order — Discover → Diagnose → Design → Deliver, the
   firm's actual method, not a reorderable list. Each stage box has **Description**, **What
   happens**, **What the client sees**, and **Decision point**; the Deliver stage alone also
   has a **Capability transfer note** field.
3. Same compliance checkbox and Save behaviour as Capabilities.

**What to monitor:** Home's own copy and Contact's static copy still need a developer to
change — neither has an admin screen yet. About's hero/firm-statement copy also still needs a
developer; the partner profiles it renders are edited from Team (see below), not here.

---

## Editing legal pages & the footer

`/admin/pages/legal` — from `/admin/pages`, click **"Manage legal pages & footer →"**.

### Editing a legal page

1. Use the dropdown at the top of the **Legal pages** panel to pick which page to edit —
   Privacy Notice, Cookie Notice, Terms of Use, or Scope of Practice.
2. Edit **Title** and **Meta description**.
3. Edit the **Body** using the block editor — click **"Add a block…"**, choose a block type
   (**Statement box**, **Prose paragraph**, **Pending note**, or **Table**), fill it in. Use
   the ▲/▼ icons on a block to reorder it, or the trash icon to remove it.
4. The **"Still a draft — pending legal review"** checkbox controls the badge shown on the
   live page: checked shows **"Draft — pending legal review"** to visitors, unchecked shows
   the page as final and stamps today's date as "Last revised." **Uncheck this only once the
   firm's counsel has actually confirmed the wording** — this is the real gate for these
   pages (there's no separate 10.05 compliance checkbox here, since legal content isn't a
   marketing claim).
5. Click **Save**.

### Editing the footer

The **Footer content** panel is always visible below the legal-pages panel — it's one shared
record, not edited per page, since the footer shows the same text on every single page of the
site (including landing pages).

1. Edit **Scope-of-practice statement**.
2. Edit **Company registration details** — leave it blank to omit that line from the footer
   entirely (it's not shown as an empty line, it just disappears).
3. Click **Save**.

**What to monitor:**

- The **Privacy Notice specifically** must have real wording before the site can go fully
  public — it's still draft/illustrative today. The other three legal pages are either
  already real (Scope of Practice) or lower-risk to leave in draft a little longer.
- Editing the footer's scope-of-practice/registration text works today, but **the public
  footer doesn't read it live yet** — that wiring is a known gap, sequenced into a later
  Milestone 7 task (Site Settings).

---

## Editing the three core offers & the Advisory Retainer

`/admin/offers` — click **Offers** in the sidebar.

### Editing a core offer

1. Use the dropdown at the top of the **Core offers** panel to pick which offer to edit —
   Business Health Check, Financial Clarity Pack, or Funding-Readiness Pack.
2. Edit, top to bottom:
   - **Offer name**
   - **Teaser** — the short summary shown on Home and Capabilities offer cards
   - **Problem statement** — written in the client's own language, not the firm's
   - **Who it's for** / **Who it's not for**
   - **Method stages** — an ordered list; use the block editor's add/reorder/remove controls
     the same way as the legal-page body editor above
   - Then, **either**:
     - For Financial Clarity Pack and Funding-Readiness Pack (single fee band): edit
       **Deliverables** (an add/remove list), **Required from you**, **Indicative timeline**,
       and the **Published fee band** — Amount from, Amount to, Currency, and **Scope cap**.
       **A fee band cannot be saved without its scope cap** — the system enforces this, they
       save together or not at all.
     - For Business Health Check (which has two pricing tiers instead of one fee band):
       edit **Pricing tiers** instead — the deliverables/timeline/fee fields above don't
       appear at all for this offer, since they'd have no effect on the public page.
   - **Out of scope** note
   - **Real questions** — three to five real FAQs, each with its own add/remove control
   - **Call-to-action label** and **link**
   - **Meta title** and **Meta description**
3. Tick **"This complies with 10.05 Positioning and Claims Guidance Note"** — Save stays
   disabled until you do. Same "save is the publish moment" rule as the marketing pages
   above.
4. Click **Save**. Updating a fee here updates it everywhere it appears — the offer page's
   own fee panel and the navigation dropdown's "From GHS ..." hint — in the same save, never
   a second copy to remember.

### Editing the Advisory Retainer

The **Advisory Retainer** panel is always visible below the core-offers panel (it's a single
retainer offering, not a full page, so it doesn't get its own screen). Edit its fee and
description directly, then click **Save**.

---

## Writing, editing, and publishing an Insights article

`/admin/articles` — click **Articles** in the sidebar for the list of all articles (title,
author, category, status). Click **"New Article"** to start one, or **"Edit"** on an existing
row to continue it.

1. Fill in **Title**, then choose a **Category** (or "No category") and an **Author** from
   the dropdowns — Author is required, Category isn't.
2. Write the **Excerpt** — the short teaser shown on article cards on the Insights index.
3. Fill in **Meta title** and **Meta description** — what shows in a Google search result.
4. Write the **Body** using the block editor — click **"Add a block…"** and choose from
   **Paragraph**, **Heading (H2)**, **Pull-quote**, **Bulleted list**, **Table**, or
   **Figure** (an uploaded image with a caption). Reorder with the ▲/▼ icons, remove with the
   trash icon, in any order and as many as you like.
5. Fill in the **Next step** panel — **Heading**, **Lead paragraph**, **Button label**, and
   **Link**. This is what a reader is pointed to after finishing the article, and it must be
   something specific to that article's topic (e.g. a relevant offer page), never a generic
   "contact us."
6. In the right-hand column, upload a **Preview image** — click **"Upload an image"**. This
   is required before the article can go live.
7. Tick **"This complies with 10.05 Positioning and Claims Guidance Note"**.
8. Click **"Save draft"** to save without publishing (you can come back and finish later —
   neither the image nor the checkbox is required for a draft), or **"Publish"** once both
   the preview image and the compliance checkbox are done — **Publish stays disabled until
   both are true.**

**What to monitor:**

- Article/figure images are stored as an interim data URI inside the database, not on a real
  image host yet (Cloudflare R2 isn't set up) — uploads work and are durable, but every image
  adds real weight to that article's own page.
- **Attaching a downloadable resource file to an article isn't built yet** — the handful of
  existing downloadable resources were set up directly by the developer.
- Subscriber addresses captured on the article page get a one-time confirmation only —
  nothing further is ever sent to them until Milestone 17 ships a real newsletter mechanism.

### Managing Insights categories

From `/admin/articles`, click **"Manage categories"**.

- **Add one:** type a name into **"New category name"**, click **"Add category"**. Its URL
  slug is generated automatically from the name.
- **Rename one:** click **"Rename"** on its row, edit the name in the dialog, click **Save**.
  A duplicate name is rejected inline before you can save it.
- **Retire one:** click **"Retire"** on its row, confirm in the dialog. This never deletes
  the articles that had that category — they just lose the tag and fall back to no category.

---

## Creating a landing page

`/admin/landing-pages` — click **Landing Pages** in the sidebar for the list of existing
campaign pages. Click **"New Landing Page"** to start one.

**Important:** this is create-only. Once you save a landing page, it cannot be edited or
removed from this screen afterward — get it right (or plan to hand the fix to the developer)
before you save.

1. Choose a **URL slug** — this becomes the page's real address,
   `kaalbert.com/lp/your-slug`, shown live above the field as you type. Pick something that
   matches whatever ad, print piece, or QR code will point to this page (e.g.
   `spring-2026-promo`). If the slug is already taken, saving is rejected with a clear inline
   message — nothing is silently overwritten.
2. Fill in **Kicker** (a small label above the headline), **Headline**, and **Opening
   paragraph**.
3. Build the **Body content** using the block editor — click **"Add a block…"** and choose
   from:
   - **Heading** — a plain section heading
   - **Paragraph** — body text
   - **Checklist** — a bulleted list; click **"Add item"** for each line
   - **Stat row** — a row of `value` + `label` pairs (e.g. "6 min" / "to complete"); click
     **"Add stat"** for each one
   - **Step row** — numbered steps, each with its own **title** and **description**; click
     **"Add step"** for each one

   Reorder blocks with the ▲/▼ icons, remove with the trash icon, in any order and as many as
   the campaign needs.

4. Fill in the **Call-to-action label** and **link** — this link is the real destination
   used even if you also attach a download file below.
5. **Download file** (optional) — if this campaign's call to action is "download our
   checklist" rather than "go to this page," click to upload a PDF here. Leave it blank to
   use an ordinary link instead; the call-to-action link above is always required either way,
   as the fallback destination.
6. Fill in **Campaign reference** — an internal tracking note (e.g. `SM/2026-09`), never
   shown to a visitor.
7. Fill in **Meta title** and **Meta description**.
8. Tick **"This complies with 10.05 Positioning and Claims Guidance Note"** — the **"Create
   landing page"** button stays disabled until you do.
9. Click **"Create landing page."**

**What to monitor:** the PDF upload uses the same interim storage as article images —
durable, but not a real image host yet (Cloudflare R2 isn't set up).

---

## Editing your team profile

`/admin/team` — click **Team** in the sidebar for the list of all five partners (name,
title, practice area, whether published on `/about`, whether they have a login yet, with
"(you)" marking your own row). Click **"Edit"** on any row to open its editor — the normal
path is editing your own, but nothing technically prevents editing a colleague's; that's the
firm's own internal discipline to manage, the same as every other content sign-off on this
platform.

1. Upload or replace a **photo** — click **"Upload a photo"** (or **"Replace photo"**/
   **"Remove photo"** if one's already set). No photo yet is fine — an initials avatar shows
   in its place automatically, never a placeholder image.
2. Fill in **Name**, **Title** (e.g. "Lead Partner"), **Practice area**, and
   **Credentials** (stored exactly as typed — never abbreviated or invented; leave it blank
   if there are none).
3. Write the **Personal statement** (shown on `/about`) and **Bio**.
4. Set **Display order** — the lowest number becomes the single featured "Lead Partner" card
   on `/about`.
5. Click **Save**.

**Publishing here is automatic, not a toggle:** the profile shows "Published" (and appears on
`/about` and in article bylines) the instant Name, Practice area, and Personal statement are
all filled in — "Not published" the instant any of those three goes blank. Photo and
credentials are never required for publishing. The editor shows a live "saving now would
publish/unpublish this profile" hint before you save, so you know the consequence in advance.
**A profile that already has published Insights articles can't be unpublished** — the system
blocks the save and names how many articles would be affected.

### Managing a colleague's login (once they have one)

If a partner already has a login account linked to their profile, a **"Login account"** panel
appears below the editor on their entry, showing their email and Active/Deactivated status:

- **Deactivate account** — click it, confirm in the dialog. Ends every session that partner
  has open, anywhere, on their very next click. Their public profile stays live; this only
  affects their login.
- **Reactivate account** — click it (no confirmation needed).
- **Reset 2FA enrolment** — click it. A fresh re-enrolment link appears on screen (shown once
  — relay it to the partner directly through whatever secure channel you'd use).
- **Reset password** — click it. Same pattern: a one-time reset link appears on screen, relay
  it to the partner directly.

**What to monitor:** none of the 5 real partners has a login account linked to their profile
yet — the "Login account" panel only appears once the developer creates that partner's actual
`/admin` login. No real partner photography exists yet either — every profile showing an
initials avatar is the correct, intended state right now, not a bug.

---

## Diagnostic Configuration

Two connected screens, both under **Diagnostic Configuration** in the sidebar (which opens
the Questions screen first).

### Editing the question set — `/admin/diagnostic-questions`

The list shows all 15 questions (order, prompt, dimension, response type, active/inactive,
and a "Placeholder" badge on any question still carrying the launch mockup's illustrative
wording rather than firm-reviewed final text).

**Reordering a question:** click the ▲ or ▼ button on its row — this swaps it with the
adjacent question **within the same dimension only** (the buttons grey out at the top/bottom
of each dimension's own group, since a question can't be reordered into a different
dimension this way). The change saves immediately, no separate Save step.

**Turning a question off:** click its switch in the **Active** column. **You cannot
deactivate the last active question in a dimension** — the system blocks it and names the
dimension in an inline message, because every active dimension needs at least one active
question for scoring to work at all.

**Editing an existing question:** click **"Edit"** on its row.

1. **Dimension** and **Response type** are shown read-only here — both are fixed the moment
   a question is created and can't be changed afterward (changing either would silently
   shift scoring or orphan previously-submitted answers).
2. Edit the **Prompt text**.
3. If the question is a **Choice** type, edit its **Choice options** — each option has a
   **Label** (what the visitor sees, e.g. "Yes") and a **Value** (a number between 0 and 1,
   the same normalized scale every diagnostic answer is scored on — e.g. "Yes" might be `1`,
   "Not yet" might be `0`). Click **"Add option"** for another, or **"Remove"** on one (you
   can't remove the last remaining option).
4. Toggle **Active**.
5. Toggle **Placeholder content** — check this if the wording is still draft/stand-in text
   the firm hasn't confirmed as final; uncheck it once real, firm-reviewed wording is in.
6. Click **Save**.

**Adding a brand-new question:** click **"New Question"** from the list screen.

1. Choose the **Dimension** it belongs to and its **Response type** — **Scale (1–5)**, **Yes
   / No**, or **Choice**. Choose carefully: neither can be changed once you save.
2. Write the **Prompt text**.
3. If you chose **Choice**, add its options the same way as the edit screen above — at least
   one option with a label and a value between 0 and 1 is required.
4. Toggle **Placeholder content** if this is draft wording.
5. Click **Save** — the new question is created **Active** automatically (a question you just
   added is meant to be live immediately, no separate publish step), and placed last within
   its dimension's own order.

### Editing weights, thresholds, and score bands — `/admin/diagnostic-configuration`

Reached from the Questions screen via the **"Edit dimension weights & thresholds →"** link
next to the question count.

**Dimension weights panel:** one number input per dimension — how much each one counts
toward the overall score. **The five must add up to exactly 100 before you can save** — a
running total is shown live, and the **"Save configuration"** button stays disabled until it
reads 100%.

**Triage priority panel:** the **High priority** and **Medium priority** thresholds are
editable number inputs ("overall score below ___"); **Low priority** is shown read-only,
since it's simply "everything at or above the Medium threshold," not a separately-set value.
A completed diagnostic gets flagged by whichever band its score falls into — a **lower**
score means **more** urgency, not less.

**Per-dimension override panel:** one number input per dimension — if any single dimension's
own score falls below its threshold here, the whole diagnostic is flagged **High** priority
regardless of the overall score (a business can look fine overall and still have one critical
gap). These are always High priority — there's no priority-level choice on this panel, only
the threshold value itself.

Click **"Save configuration"** to save all three panels above together.

**Score bands panel** (separate from the three above — has its own Save button): one block
per band, ordered highest score first. Each has:

- **Min score** — the lowest overall score this band applies to.
- **Label** — the band's short name (e.g. "Strong Foundation").
- **On-screen statement** — the shorter text shown to a visitor on the results page.
- **Email detail** — the longer, fuller narrative sent in the summary email only — always a
  different, more detailed text from the on-screen statement, never the same copy reused.
- A **Placeholder** toggle, same meaning as on a question.

Click **"Save score bands"** to save.

**What Diagnostic Configuration can never touch:** the scoring _algorithm_ itself — how
dimension scores combine into an overall score, and how a threshold breach becomes a triage
flag — is a developer change, not an admin edit. Everything on these two screens is scoring
_values_ only (weights, thresholds, question text/order/active state, choice-option
labels/values, score-band text) — see `docs/features/business-health-check-diagnostic.md`
for the full boundary.

**What to monitor:**

- Email delivery for the diagnostic's summary-email step depends on the **Brevo account**
  (`kaalbert.company@gmail.com`) and its verified sender — if summary emails stop arriving,
  check Brevo's sender-verification status first.
- Several questions and all four score bands are still flagged **Placeholder** — the launch
  mockup's illustrative wording, pending the firm's real review. Nothing stops you from
  publishing over them by simply editing the text and unchecking Placeholder.

---

## Measurement & attribution

No dedicated admin screen — this runs through Google Tag Manager's own console, not
`/admin`.

**What it does:**

- **Google Tag Manager** container `GTM-PDGKRKRN`, published live, holding a **GA4**
  configuration tag (property `G-9VX9GS5L0X`) and one event tag per conversion moment.
- **Six fixed conversion events** fire automatically at the right moment on the site:
  diagnostic started, diagnostic completed, summary requested, checklist downloaded, enquiry
  submitted, WhatsApp opened.
- A **cookie-consent banner** (Consent Mode v2) — a visitor's consent choice genuinely gates
  whether GA4 receives data, not just a cosmetic banner.
- **First-touch attribution**: which campaign/UTM link a visitor first arrived through is
  captured client-side and linked to every enquiry and diagnostic submission they later make,
  so an enquiry can be traced back to the ad or article that produced it. Kept for 90 days,
  then automatically deleted unless it's still attached to a real enquiry.

**How to add a new tag/trigger yourself:** the marketing team can create one directly in
GTM's own web UI (log in at tagmanager.google.com with the `kaalbert.company@gmail.com`
account) **as long as it listens to one of the six existing conversion events above** — a
genuinely new kind of conversion moment still needs a developer (a `lib/data-layer.ts`
change) before GTM has anything new to listen to.

**What to monitor:**

- **GTM's own script is cached for ~15 minutes** after any publish — if a newly-published tag
  seems to "do nothing," wait before concluding something is broken; this has already
  produced a false alarm once.
- The nightly **attribution-cleanup** job (a small always-on Railway service, `0 3 * * *`)
  should show successful runs in Railway's own service logs — a string of failures would mean
  the 90-day retention promise silently stops holding.
- **Meta Conversions API, Google Ads, and LinkedIn Insight Tag are deliberately not built
  yet** (T5.5) — it needs a Meta Business Manager account + Pixel + CAPI token, a Google Ads
  account, and LinkedIn Campaign Manager access, none of which exist for the firm yet.
  Resequenced to build immediately before Milestone 9 rather than abandoned.

---

## Business Health Check diagnostic (the visitor-facing flow)

`kaalbert.com/diagnostic` — a public, scored self-assessment completable in under six
minutes: question flow → instant results → a gated "email me the full written summary" step
(delivered via Brevo transactional email). Its question set, weights, and thresholds are
edited via **Diagnostic Configuration** above; there is nothing else to configure for the
flow itself.

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

- **Milestone 7 — Content Management Admin** (in progress): every piece of content seeded so
  far becomes partner-editable without a developer. Dashboard, Articles/Categories, Pages
  (Capabilities/Our Method/Legal/Footer), Offers (the three core offers plus the Advisory
  Retainer), Landing Pages (create-only), Team, and Diagnostic Configuration are all live;
  Site Settings, Subscribers, and article-resource attachment are next.
- **Milestone 8 — Enquiry Management**: a screen to see and triage incoming enquiries and
  diagnostic completions in one place.
- **Milestone 9 — Platform Performance Dashboards (Bonus)**: connection health + metrics for
  GA4, Meta, Google Ads, and LinkedIn — begins with the deferred T5.5 above, then proceeds.

## Change log

| Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Rewrote every admin section as a step-by-step "how to" walkthrough (exact screens, buttons, and what each field means) instead of a feature list — user feedback that the previous version told the firm _what_ exists but not _how_ to actually use it. No underlying platform change; documentation-only.                                                                                                                                                            |
| 2026-09-11 | Diagnostic Configuration (T7.7) went live — a partner can now add/edit/reorder/deactivate diagnostic questions (including choice-option labels/values), and edit dimension weights, triage thresholds, and score-band text — `/admin/diagnostic-questions` and `/admin/diagnostic-configuration`. Weights must total 100% before saving; the last active question in a dimension can't be deactivated; the scoring algorithm itself stays a developer-only change.     |
| 2026-09-11 | Team admin (T7.6) went live — a partner can now edit any partner's public profile (photo, title, practice area, credentials, personal statement, bio, display order) and deactivate/reactivate a colleague's login, or reset their 2FA enrolment/password on their behalf — `/admin/team`. Publishing is automatic (computed from name/practice area/personal statement), not a toggle; a profile already crediting published articles cannot be unpublished.          |
| 2026-09-11 | Landing Pages admin (T7.5) went live — a partner can now create a brand-new campaign landing page themselves (headline, opening paragraph, body content, CTA, an optional PDF download, meta tags) — `/admin/landing-pages` → "New Landing Page". Create-only for now: editing or retiring an existing landing page still needs a developer. The partner picks the page's own URL slug; a duplicate is rejected with a clear inline message.                           |
| 2026-09-11 | Offers admin (T7.4) went live — a partner can now edit all three core offer pages' full field set (problem statement, who it's for/not for, method stages, deliverables/required inputs, fee band, out-of-scope note, FAQs, CTA) and the Advisory Retainer's fee/description themselves — `/admin/offers`. A fee band still can't be saved without its scope cap, enforced by the system; updating a fee updates the offer page and the nav dropdown hint in one save. |
| 2026-09-11 | Pages admin (T7.3) went live — a partner can now edit Capabilities, Our Method, any of the four legal pages (including clearing the "Draft — pending legal review" marker themselves), and the shared footer's scope-of-practice/registration text. Corrected a drift: the "Public website pages" section's "what a partner can do" line had been updated in the Artifact mirror during T7.2 but not in this file — synced here.                                       |
| 2026-09-11 | Articles/Categories admin (T7.2) went live — a partner can now write, edit, and publish an article themselves (including images/figures), and create/rename/retire Insights categories, both fully self-service. Noted the two remaining gaps: image uploads use an interim storage method pending Cloudflare R2, and attaching a downloadable file to an article isn't built yet (T7.10).                                                                             |
| 2026-09-11 | Admin dashboard (T7.1) went live — real stat counts and a recent-enquiries panel replace the old placeholder; noted the two honest placeholders (status always "New", Triage shown as flagged/not-flagged only) that resolve once Milestone 8 ships.                                                                                                                                                                                                                   |
| 2026-09-11 | Added self-service password reset (T6.7) to the Admin Login section — a partner can now reset a forgotten password themselves, no developer or other partner needed.                                                                                                                                                                                                                                                                                                   |
| 2026-09-10 | Milestone 6 (Admin Login) complete — added its "What's live today" section, moved it out of "What's coming next", updated the two stale "no admin area yet" mentions above it.                                                                                                                                                                                                                                                                                         |
| 2026-09-10 | Guide created. Covers Milestones 1–4 (complete) and Milestone 5 (complete through T5.1–T5.4, T5.5 deferred before Milestone 9).                                                                                                                                                                                                                                                                                                                                        |
