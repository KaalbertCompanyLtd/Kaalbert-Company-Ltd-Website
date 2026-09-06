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

**Addendum (session 11, 2026-09-05):** All 5 seeded partners (`prisma/seed.ts`'s
`seedAuthors`) currently publish with `photoUrl: null` — no partner photography exists yet
(see `memory/technical-debt.md` → "About page partners have no real photography yet").
**Trigger type: User-triggered.** Do not treat reaching this task as a cue to source or
generate partner photos — wait for the firm to say real photography is ready, then this
task's own editor (or a direct seed/DB update, whichever is faster at the time) uploads each
partner's real photo. Three partners (Ama Wiafe, Joseph Bordoh, Albert Kwakye Amponsah) also
have no `credentials` value seeded — real designations may not exist for these roles at all;
confirm with the firm before assuming a gap, rather than assuming one is missing.

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
