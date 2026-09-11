# Epic: Content Management Admin

Roadmap milestone 7. Where "firm usage" genuinely begins: every entity seeded by migration in
Milestones 2–5 becomes partner-editable without a developer (FR-8, tested directly as AC-6).
Every task builds to its accepted mockup under `ui/mockups/g-admin-content/`. Nothing here
edits data with no public reader — every content area edits an entity a public page (built in
Milestones 2–5) already reads live.

---

### T7.1 — Admin dashboard — `/admin`

**Build:** Landing screen (screen-inventory.md #25) to its mockup: 4 read-only stat cards
(new enquiries, triage-flagged, diagnostics this month, published articles) and a recent-
enquiries panel — all aggregate queries over `enquiry_record`/`article`, no new entity.
**Input → Output:** Existing `enquiry_record`/`article` tables → 4 live counts + 5 most
recent enquiries.
**Acceptance criteria:** Each stat card's count matches a direct SQL query against the same
filter described in `content-management-admin.md`; the panel shows exactly the 5 most recent
`enquiry_record` rows, unfiltered.
**Size:** S **Dependencies:** T6.3, T3.5, T2.6, T4.1

### T7.2 — Articles editor + Categories

**Build:** Rich-text article editor (`ui/mockups/g-admin-content/admin-article-editor.html`)
— tables/pull-quotes/figures, category/author/preview-image selection, the 10.05-compliance
checkbox gating Publish alongside the required-preview-image gate; Categories CRUD
(create/rename/retire, unique-slug validation).
**Input → Output:** Article form submission → `article` row (`published_at` set only on
Publish); Category form → `category` row.
**Acceptance criteria:** Publish is disabled until both a preview image is set and the
10.05-compliance checkbox is checked (matches the mockup exactly, per this session's earlier
fix — re-verify in browser); retiring a category leaves its articles un-deleted, falling back
to no-category; a duplicate category slug is rejected inline, not silently duplicated.
**Size:** L **Dependencies:** T6.3, T4.1

**Addendum (session 04, 2026-09-05):** Before building the article `PATCH` handler, read
`memory/technical-debt.md` → "Two-partner simultaneous page edits use last-write-wins (no
optimistic locking)". `content-management-admin.md`'s edge case explicitly accepts
last-write-wins for Phase 1 (five partners, low edit frequency) — no fix is required to
ship this task. Make a conscious call and note which you chose in this task's
`memory/completed-work.md` entry: ship as documented (silent overwrite on a stale save), or
add the lightweight `updated_at`/version staleness check described in that debt entry while
already building the handler. Either is acceptable; silently doing neither (i.e., not even
considering it) is the thing to avoid.

**Addendum (session 26, 2026-09-06):** When building preview-image/resource upload here (the
"R2 media pipeline" this task and T7.6 both reference), read `memory/technical-debt.md` →
"Article download-resource availability is checked via a live per-request HEAD fetch, not a
real object-storage capability." `app/insights/[slug]/page.tsx` (T4.3) currently checks a
resource's existence by fetching its own `fileUrl` directly at render time, since no object
storage existed at T4.3 to answer this more cheaply. Once this task wires up real R2 uploads,
replace that live check with a real existence guarantee at the storage layer (e.g. only ever
generate/store a `fileUrl` for an object R2 confirms exists, or query R2 directly) rather than
leaving the interim live-fetch check in place indefinitely.

### T7.3 — Pages editor (marketing pages incl. Capabilities, Our Method; legal pages)

**Build:** One Pages content area editing the shared `page` entity (hero_kicker/
hero_heading/hero_lead/meta_title/meta_description, plus `intro_copy` where the page has it)
with its linked repeating section shown on the same screen — `capability` rows for
Capabilities, `method_stage` rows for Our Method — mirroring the Offer editor's
method-stages/deliverables pattern; legal pages and `footer_content` edited as a second panel
on the same screen (`legal-and-compliance-pages.md`), not a separate nav item.
**Input → Output:** Page content edits → `page`/`capability`/`method_stage`/`legal_page`/
`footer_content` rows; save → the corresponding public page (T2.3, T2.4, T2.7) reflects the
change immediately.
**Acceptance criteria:** Editing a Capabilities `capability` row updates `/capabilities`
without a deploy; editing a legal page's body updates its `/legal/[slug]` page; the
10.05-compliance sign-off gate (FR-5.4) applies to marketing-page publish actions the same way
it does to articles.
**Size:** L **Dependencies:** T6.3, T2.3, T2.4, T2.7

**Addendum (session 04, 2026-09-05):** Same debt item as T7.2's addendum above —
`memory/technical-debt.md` → "Two-partner simultaneous page edits use last-write-wins (no
optimistic locking)" — applies here too (this task literally is "the Pages editor" the debt
entry names). Make and record the same conscious call for this task's `page`/`capability`/
`method_stage`/`legal_page`/`footer_content` `PATCH` handlers: ship as documented, or add the
staleness check. Decide independently of whatever T7.2 chose — they're separate handlers and
don't need to match.

### T7.4 — Offer editor (fee bands, FAQs, and full field set)

**Build:** `ui/mockups/g-admin-content/admin-offer-editor.html` as fixed this session — the
full FR-4.1 field set in order: problem statement, who_for/who_not_for, deliverables,
client_inputs, indicative_timeline, structured fee band (`fee_amount_min`/`fee_amount_max`/
currency/scope_cap — never free text, never publishable without the scope cap), FAQs, CTA
label. Same structured-fee discipline applies to Advisory Retainer.
**Input → Output:** Offer form submission → `offer` row; save propagates to the same field
everywhere it's read (the nav fee-hint in `SiteHeader` reads the same
`fee_amount_min` — one save updates both places, no second copy).
**Acceptance criteria:** A fee update saved here is reflected in both the offer page (T2.2)
and the nav dropdown fee-hint in the same request cycle, verified in browser; the API rejects
a fee_amount_min/max submitted without scope_cap; FAQs render in the editor and on the public
page in the same order.
**Size:** M **Dependencies:** T6.3, T2.2

### T7.5 — Landing Pages admin

**Build:** `POST /api/admin/landing-pages` + an editor screen letting a non-technical partner
create a new `/lp/` instance from the template — headline, opening paragraph, body, CTA —
without vendor involvement (FR-4.3, the literal AC-6 bar for this specific task).
**Input → Output:** New landing-page form submission → live `landing_page` row → new working
`/lp/[slug]` page.
**Acceptance criteria:** A partner (tested via a non-technical walkthrough script, not just
API-level) creates a working new landing page end to end with zero code or deploy involved.
**Size:** M **Dependencies:** T6.3, T5.1

**Addendum (session 34, 2026-09-10):** `LandingPage.downloadFileUrl` (added at T5.2, after
this task was originally written) must also be exposed as an optional file-upload field on
this editor — the "download" version of a landing page's call to action (e.g. the
Funding-Readiness Checklist), uploaded via whichever R2 media pipeline T7.6 establishes for
author photos (ADR 0004) — build the upload mechanism once, reuse it for both. Null/absent
is a valid, already-handled state (`app/lp/[slug]/page.tsx`'s `LandingPageCta` falls back to
`ctaHref`/`ctaLabel`), so this field is optional in the editor, not required to publish. See
`memory/technical-debt.md` → "Landing Pages admin (T7.5) needs to expose `downloadFileUrl`,
wired to the R2 media pipeline."

### T7.6 — Team / author profile editor

**Build:** Self-service (and right-role-gated other-partner) editor for the `author` record
— photo (via the same R2 media pipeline as article preview images, ADR 0004), title (the
partner's rank — "Lead Partner"/"Partner", a free-text field defaulting to "Partner" for a
newly onboarded partner), practice area, credentials (stored verbatim, never
altered/abbreviated), personal statement, bio, order.
**Input → Output:** Profile form submission → `author` row; `published` stays false until
name/practice area/personal statement are set — photo and credentials are NOT publish-gating
(revised at T2.5 per explicit firm direction, session 11, 2026-09-05; see
`memory/decision-log.md` and `docs/features/about-and-partners-page.md`'s edge cases).
**Acceptance criteria:** A profile missing name/practice area/personal statement never
appears on `/about` or as an article byline — omitted entirely, not shown half-filled. A
profile with no photo yet DOES appear, rendered with an initials avatar
(`app/about/page.tsx`'s `PartnerAvatar`); uploading a photo later simply replaces the
initials on save, no separate publish step.
**Size:** M **Dependencies:** T6.3, T2.5, T4.3

**Addendum (session 42, 2026-09-10):** This task's editor is for the public-facing `author`
record only — a distinct, real gap remains for managing the underlying **login** identity
(`admin_user`), which this "Team" area is the natural home for too. Three concrete actions,
all already fully built at the `lib/` layer with nothing calling them yet:

- **Deactivate/reactivate a partner's account** — `admin-authentication.md`'s own edge case,
  and T6.5's own Input→Output line already named this task's area as the intended home
  ("this control ships functionally here; its UI home is Milestone 7's Team content area").
  Wire a toggle to `lib/auth/session.ts`'s `deactivateAdminUser(adminUserId)`.
- **Reset an existing partner's 2FA enrolment** — discovered at T6.6 (session 42): if a
  partner loses their authenticator device _and_ their backup codes simultaneously,
  `admin-authentication.md`'s own edge case says "account recovery requires another
  administrator to reset 2FA enrolment" — but no task anywhere actually builds that
  administrator-facing action. The mechanism already exists and is already tested
  (`lib/auth/totp-setup.ts`'s `issueSetupToken(adminUserId)`, the same function T6.6's CLI
  script and T6.4's backup-code recovery both already call) — this task just needs a button
  that calls it for an _existing_ account and displays the resulting link, the same way
  T6.6's script prints one for a _new_ account.
- **Reset an existing partner's password** — added at T6.7 (session 43): self-service
  password reset (T6.7) covers the case a partner still has their own email access, but not
  the case they don't (email compromised/inaccessible too, not just the password forgotten).
  `lib/auth/password-reset.ts`'s `issuePasswordResetToken(adminUserId, {baseUrl})` is already
  built and tested for exactly this reuse (T6.7's own doc-comment says so directly) — this
  task just needs a button that calls it for an _existing_ account and displays the resulting
  link, the same relay pattern as the other two actions above.

See `memory/technical-debt.md` → "No admin-facing way to deactivate/reactivate an account,
reset an existing partner's 2FA enrolment, or reset an existing partner's password" for the
full reasoning.

**Addendum (session 37, 2026-09-10):** Wire `Author.adminUserId` to a real Prisma relation
against `AdminUser` (added at T6.1) — currently a schema-only placeholder `Int?` with nothing
populating or reading it. This task's own "self-service" requirement (a logged-in partner
edits their own entry) needs it to resolve the authenticated session's `admin_user.id` to the
right `author` row. See `memory/technical-debt.md` → "`Author.adminUserId` is still a
schema-only placeholder FK, not a real Prisma relation" for the full reasoning and possible
fix.

**Addendum (session 11, 2026-09-05):** All 5 seeded partners (`prisma/seed.ts`'s
`seedAuthors`) currently publish with `photoUrl: null` — no partner photography exists yet
(see `memory/technical-debt.md` → "About page partners have no real photography yet").
**Trigger type: User-triggered.** Do not treat reaching this task as a cue to source or
generate partner photos — wait for the firm to say real photography is ready, then this
task's own editor (or a direct seed/DB update, whichever is faster at the time) uploads each
partner's real photo. Three partners (Ama Wiafe, Joseph Bordoh, Albert Kwakye Amponsah) also
have no `credentials` value seeded — real designations may not exist for these roles at all;
confirm with the firm before assuming a gap, rather than assuming one is missing.

**Addendum (session 45, 2026-09-11):** T7.2 already built the R2 media pipeline this task's
own "Build" line references ("via the same R2 media pipeline as article preview images") —
reuse `components/admin-image-upload-button.tsx` (`AdminImageUploadButton`) and `POST /api/
admin/media` directly for the photo field, don't build a second upload mechanism. As of T7.2,
that pipeline is still an interim one: Cloudflare R2 itself (ADR 0004) is not provisioned, so
`lib/media-storage.ts`'s `encodeImageUpload` returns a base64 `data:` URI stored straight in
the DB column, not a real object-storage URL — see `memory/technical-debt.md` → "Article/
author image uploads use an interim base64 data-URI store, not real Cloudflare R2." Check at
this task whether R2 credentials exist yet (`CLAUDE.local.md`'s Credentials section); if so,
this is the natural point to swap `lib/media-storage.ts`'s single function to a real upload
call (every caller — this task's photo field, T7.2's preview image/figure blocks, T7.5's
download file — already treats its return value as an opaque URL, so nothing else changes).
If R2 still isn't provisioned, build this task's photo field against the interim mechanism
exactly as T7.2 did, and leave the debt entry open.

### T7.7 — Diagnostic Configuration

**Build:** Editor for `diagnostic_question` (text/order/active), `diagnostic_dimension`
(weights), `diagnostic_threshold` — values only, never the scoring algorithm (FR-8's scope);
save-time validation that every active dimension retains at least one active question.
**Input → Output:** Configuration edit → updated question/dimension/threshold rows, live on
the next `/diagnostic` load.
**Acceptance criteria:** Attempting to deactivate the last active question in a dimension is
rejected inline, naming the dimension — the exact scenario `business-health-check-diagnostic
.md` describes as an uncaught 500 if it ever reached a visitor is proven here to never reach
save.
**Size:** M **Dependencies:** T6.3, T3.1, T3.3

**Addendum (session 18, 2026-09-05):** `diagnostic_question` has no queryable
`is_placeholder` column — T3.3 flagged the launch question set pending-review status only in
`prisma/seed.ts`'s own comment, since no such column exists on this model (unlike every other
content-bearing model in this schema) and T3.3's own scope didn't include a schema change.
See `memory/technical-debt.md` → "`diagnostic_question` has no queryable `is_placeholder`
column." Add a real `isPlaceholder Boolean @default(false)` column to `DiagnosticQuestion`
(a migration) as part of this task, set it `true` on T3.3's seeded rows, and surface it in
this editor the same way any other placeholder-flagged content would be shown.

**Addendum (session 22, 2026-09-05):** Score-band labels/statements (e.g. mockup's "Strong
Foundation"/"Running on Memory") are now modelled and displayed — a new `DiagnosticScoreBand`
model (migration `20260905235239_add_diagnostic_score_band`), seeded with the mockup's own
illustrative 4-band content flagged `isPlaceholder: true`, read via `lib/diagnostic-
flow.ts`'s `getScoreBand` and rendered on `app/diagnostic/results/page.tsx` (T3.6). What's
still this task's own job: extend this editor to cover `diagnostic_score_band` rows
(minScore/label/statement/isPlaceholder) the same way it covers question/dimension/threshold
rows — see `memory/technical-debt.md` → "Diagnostic results screen has no score-band label/
statement" for the full history.

**Addendum (session 23, 2026-09-06):** `DiagnosticScoreBand` gained a fourth content field,
`emailDetail` (migration `20260906023106_add_diagnostic_score_band_email_detail`) — the
user pointed out that T3.7's summary email was reusing the same short `statement` the results
screen already shows, so a "full written summary" wasn't actually fuller than the screen.
`emailDetail` is a separate, longer, multi-paragraph (blank-line-separated) narrative sent
only by `lib/diagnostic-request-summary.ts`'s `buildSummaryEmailHtml`, never rendered on
`/diagnostic/results` — that screen still reads only `statement`. This task's editor must
therefore expose **three** score-band content fields per row (label, statement, emailDetail),
not two — a textarea long enough for multi-paragraph prose for `emailDetail` specifically,
distinct from the single-line `statement` input. Seeded with real (placeholder-flagged)
detailed copy per band in `prisma/seed.ts`; verified end-to-end via a real
`/api/diagnostic/submit` call against the running dev server, confirming `getScoreBand`
returns the new field and `/diagnostic/results` itself is unchanged (still shows only the
short `statement`) — screenshotted at desktop width, no regression.

### T7.8 — Site Settings (singleton)

**Build:** Single settings form — phone_primary/secondary, email, whatsapp_number, address,
response_time_commitment, social_profile_urls — read live by SiteFooter, `/contact`, every
`WhatsAppLinkButton`, and the SEO Organization schema's `sameAs`.
**Input → Output:** Settings form submission → the one `site_settings` row updated.
**Acceptance criteria:** Changing the phone number here updates the footer, `/contact`, and
every WhatsApp button in one save, verified across at least two different pages in browser; a
blank required field causes the corresponding display to be omitted site-wide rather than
rendering broken.
**Size:** S **Dependencies:** T6.3, T2.6, T2.8

**Addendum (session 12, 2026-09-05):** Two items from `memory/technical-debt.md` land here:
(1) "`SiteFooter` callers still pass hardcoded address/phone props instead of reading
`site_settings`" — T2.6 materialized the real `site_settings` row and wired it into
`/contact`, but every page's `SiteFooter` call (T1.5's own precedent) still passes literal
strings; switch every caller to read `getSiteSettings()` (or thread it as a prop) as part of
this task, so a Site Settings edit actually reaches the footer everywhere, not just
`/contact`. (2) "`site_settings.response_time_commitment` has no real value yet" —
`Trigger type: User-triggered`; do not fabricate a response-time commitment or treat reaching
this task as a cue to invent one — only set it via this task's own form once the firm has
actually stated a real, keepable number.

**Addendum (session 13, 2026-09-05):** A third `memory/technical-debt.md` item lands here
too, from T2.7's Legal & compliance pages build: "`footer_content.scope_of_practice_statement`/
`company_registration_details` materialized but not wired into `SiteFooter`/
`ScopeOfPracticeNote`" — T2.7 materialized the `footer_content` singleton
(`legal-and-compliance-pages.md`'s second footer panel, alongside `site_settings` on this same
screen), but `ScopeOfPracticeNote` still renders T1.5's hardcoded scope-of-practice text and
has no `companyRegistrationDetails` prop at all. Same fix shape as item (1) above, and the
same seven `SiteFooter` call sites — do both in one pass: switch every caller to also read
`getFooterContent()` (write that resolver in `lib/legal.ts` when this is actually built) and
pass `scopeOfPracticeStatement`/`companyRegistrationDetails` through, rendering the
registration-details line only when non-null (`legal-and-compliance-pages.md`'s edge case).

### T7.9 — Subscribers list

**Build:** `ui/screen-inventory.md` #35a — `AdminDataTable` variant under Operations, listing
`subscriber` rows, export, manual removal.
**Input → Output:** `subscriber` table → paginated list; export action → downloadable file;
removal action → `unsubscribed_at` set (never a hard delete, consistent with
`insights-engine.md`'s own rule).
**Acceptance criteria:** Export produces a file matching the on-screen filtered set; manual
removal here has the identical effect as a visitor's own one-click unsubscribe link (same
underlying update, not a second code path).
**Size:** S **Dependencies:** T6.3, T4.5

**Addendum (session 28, 2026-09-06):** This screen gains a per-row "last synced to Brevo"
status column at Milestone 17 (`docs/tasks/17-subscriber-outreach.md`, T17.3) — Phase 2,
gated, not built now. Nothing about this task's own build needs to anticipate that column
structurally; it's a straightforward later addition to an existing table.

### T7.10 — Article downloadable-resource management

**Build:** A resource-management panel on the article editor (T7.2): list an article's
existing `article_resource` rows (label, file), attach a new one, reorder (`sortOrder`),
remove — reusing T7.2's `components/admin-image-upload-button.tsx` upload pattern
generalized to accept non-image files (`lib/media-storage.ts`'s current `encodeImageUpload`
is image-only; this task needs a parallel non-image variant, same interim base64/future-R2
storage approach).
**Input → Output:** Resource form submission (label + file) → `article_resource` row;
reorder → updated `sortOrder` values; remove → row deleted.
**Acceptance criteria:** A resource attached here appears correctly on the public article
page's download list (`app/insights/[slug]/page.tsx`'s `ResourceLink`) in the same order set
in the admin; removing a resource here removes its download link from the public page on the
same request cycle.
**Size:** S **Dependencies:** T7.2

**Addendum (session 45, 2026-09-11):** Split out of T7.2, whose own "Build" line named only
"tables/pull-quotes/figures" as in-scope content types — `article_resource` (downloadable
attachments) was a real, deliberately out-of-scope gap for that task, not an oversight. See
`memory/technical-debt.md` → "Article downloadable-resource attachment... is not built" for
the full reasoning, and → "Article download-resource availability is checked via a live
per-request HEAD fetch..." (T4.3, session 26) for the related, still-open live-HEAD-check
replacement this task's own upload flow unblocks (generate/confirm a resource's URL at
upload time instead of checking it live on every visitor page-render).

### T7.11 — Article byline resolves against a real `author.published` check

**Build:** `lib/insights.ts`'s several `article.author`-including queries (index cards,
related articles, `lib/home.ts`'s featured-Insights section) and `app/insights/[slug]/
page.tsx`'s byline currently read `author.name`/`author.practiceArea` directly with no
`published` check at all — discovered at T7.6 (session 49) while building the Team admin
editor, which can leave an `author` row unpublished (required fields cleared) while it
still has existing articles crediting it, once that editor's own protective validation is
ever relaxed or bypassed directly via the database. Requires a real product decision first,
not just a mechanical fix: either (a) an unpublished author's existing article bylines fall
back to a neutral attribution (omit the byline, or credit "Kaalbert & Company Ltd") once
their profile goes dark, or (b) a byline is a historical record of who wrote the piece and
stays exactly as it was regardless of the author's current profile state, and
`author.published` was never meant to reach bylines at all — confirm which with the firm
before implementing either. **Originally logged against `docs/tasks/04-insights.md` (the
Insights epic) but moved here at T7.6's own session — Milestone 4 had already fully shipped
by the time this gap was found, so a new task appended there would never be reached by a
future session; Milestone 7 (this epic) was still actively in progress, so this is the
correct home per CLAUDE.md's own "never sequence a new task into an already-shipped epic"
rule (added the same session this correction was made — see `memory/decision-log.md`).**
**Input → Output:** An `author` row with `published: false` → (a) every existing article
byline crediting them falls back to the neutral attribution, or (b) bylines are confirmed
exempt and no code changes — whichever the firm confirms.
**Acceptance criteria:** Once the firm's answer is confirmed: if (a), an author's articles'
bylines change the moment that author is unpublished, with no code change needed per
article (same "one edit, every reader" principle as every other admin-editable content in
this project); if (b), this task closes by updating `insights-engine.md`'s own documented
byline behaviour to state the exemption explicitly, so it's a recorded decision, not a
silent gap.
**Size:** S **Dependencies:** T7.6 (`lib/admin-authors.ts`'s `updateAuthor` is the one write
path this currently depends on staying protective in the meantime)
