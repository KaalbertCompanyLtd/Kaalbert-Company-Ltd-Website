# Feature: Content Management Admin

Phase 1. The hand-built admin layer — ADR 0001, FR-8.

## Goal

Let a partner with no technical training publish an article, edit page copy (including legal
pages), update a published fee range, create a new landing page from a template, keep their
own public profile current, tune the diagnostic's questions and thresholds, and keep the
firm's public contact details correct — entirely unsupervised, without contacting the
developer (FR-8; tested directly as AC-6).

## Admin dashboard (screen-inventory.md #25)

The landing screen after login is a summary, not a content area of its own — its four stat
cards and "recent enquiries" panel are read-only aggregate queries over data already owned
elsewhere in this doc or in `enquiry-management.md`, not a new entity:

- **New enquiries** / **Triage-flagged** — `COUNT(enquiry_record)` filtered by `status = new`
  / by the triage flag, both fields already defined in `enquiry-management.md`.
- **Diagnostics this month** — `COUNT(enquiry_record)` where diagnostic-originated
  (`business-health-check-diagnostic.md`) and `created_at` falls in the current month.
- **Published articles** — `COUNT(article)` where `published_at IS NOT NULL`
  (`insights-engine.md`).
- **Recent enquiries panel** — the five most recent `enquiry_record` rows, same fields as
  `enquiry-management.md`'s list screen, just unfiltered and unpaginated.

## User flow

1. Partner logs in at `/admin`, authenticating with password + TOTP (see
   `admin-authentication.md`).
2. Partner selects a content area: Articles, Categories, Pages (including legal pages),
   Offers (fee ranges), Landing Pages, Team, Diagnostic Configuration, Site Settings, or
   Subscribers.
3. **Publish an article**: create/edit an article using the rich-text editor (tables, pull
   quotes, figures supported), set category, author, preview image (required before
   publishing), and publish.
4. **Edit page copy**: select an existing page (marketing page or legal page), edit its
   content blocks in place, save.
5. **Update a fee range**: select a core offer page or the Advisory Retainer, edit the
   published fee band field (structured, not free text — see `core-offer-pages.md`,
   `capabilities-page.md`), save.
6. **Create a landing page**: select the landing page template, set the independently-
   editable headline and opening paragraph, save — a new live `/lp/` page exists.
7. **Maintain a profile**: a partner opens their own entry under Team and edits their
   photograph, practice area, credentials, and personal statement — the `author` record used
   by both `about-and-partners-page.md` and `insights-engine.md` (FR-3.3). A partner with the
   right role may also edit another partner's entry (e.g. onboarding a new co-founder), but
   the normal path is self-service.
8. **Adjust the diagnostic**: a partner with the right role edits question text, order, and
   active flag, dimension weights, and triage thresholds — the exact configuration data named
   in `business-health-check-diagnostic.md` (FR-2.2). The underlying scoring algorithm stays
   developer-owned per FR-8's scope; this screen edits values, not logic.
9. **Update site settings**: a partner edits the firm's phone numbers, WhatsApp number,
   email, office address, and the Contact page's response-time commitment — a single
   settings record read by the footer, the Contact page, and every `WhatsAppLinkButton`
   site-wide, so it's corrected once, everywhere, not per page.
10. **Manage categories**: a partner creates, renames, or retires an Insights category (name,
    slug) directly, rather than being limited to whatever categories a developer seeded at
    launch (`insights-engine.md`).
11. **View subscribers**: a partner sees the list of Insights subscribers, exports it, and can
    manually remove an entry on request — `insights-engine.md`'s `subscriber` list, an
    `AdminDataTable` variant grouped under Operations, not Content, since it's a list of real
    people's data rather than editorial content.

## Business rules

- No code change or developer involvement is required for any of the eleven tasks above
  (FR-8.1) — this is the literal acceptance bar for AC-6.
- No page, landing page, or advertisement copy is marked publishable without a recorded
  firm sign-off (FR-5.4) — the publish action itself is the partner's own sign-off record;
  the admin does not publish on anyone's behalf without an explicit action by an
  authenticated partner. Publishing requires checking a required "this complies with 10.05
  Positioning and Claims Guidance Note" confirmation before the Publish button enables —
  operationalizing Document 13.03 Section 8.2's review requirement as a real, unavoidable
  step, not merely a written policy nobody is prompted to follow.
- **Decision, not a gap**: Document 13.03, Section 8.2 also names copy approval "a reserved
  matter" held specifically by the Lead Managing Partner. This is _not_ built as a login-role
  restriction — with five partners and one shared admin system, a technical approval-routing
  layer (drafts, a review queue, a second-partner sign-off gate) is more process than a firm
  this size needs, and the 10.05-compliance checkbox above already forces the review the
  policy exists to guarantee. Who personally exercises that judgment before publishing is the
  firm's own internal discipline, the same way it already is for which partner writes which
  content (Document 13.03, Section 13's ownership table) — recorded here as a deliberate
  choice so it's never mistaken for an overlooked requirement.
- Publishing an article requires a preview image to be set (enforces `insights-engine.md`'s
  OG/Twitter card requirement at the point of publishing, not after).
- Fee ranges are edited as structured fields (amount, currency, scope cap), never as free
  text within page copy — this prevents a fee being published without its scope cap, which
  Document 13.03, Section 13, calls "a commitment the firm cannot hold."
- Every admin account requires TOTP before any content action is available (NFR-3).
- A partner's public entry (About page, article bylines) does not go live until every
  required field is set — name, photo, practice area, credentials, personal statement — so a
  half-finished profile is never publicly visible (Document 13.03's "smaller and complete
  beats larger and unfinished" principle, applied here as in
  `about-and-partners-page.md`'s edge cases). Professional designations are stored exactly as
  the partner supplies them; the admin does not alter or abbreviate a credential string.
- Diagnostic Configuration edits values (question text, order, active flag, dimension
  weights, triage thresholds), never the scoring algorithm itself — restructuring how a score
  is computed is a developer change, per FR-8's scope and `business-health-check-diagnostic.md`
  (FR-2.2). A configuration change must pass validation (every active dimension has at least
  one active question) before it can be published — this is the same check named as a launch
  edge case in that feature doc, now given an owner: this admin screen, not a database
  migration.
- Site Settings holds exactly one record (there is one firm, one set of contact details) —
  this is a singleton edit form, not a list. Every place that displays a phone number,
  WhatsApp number, email, or address (the footer, `/contact`, every `WhatsAppLinkButton`)
  reads it live from this record; none of them hardcode a copy (Document 13.03's general
  principle that content the firm supplies and can change is never a build decision, applied
  here as it already is to the Contact page's response-time commitment).
- The Core Offers navigation menu's fee-hint text (e.g. "From GHS 1,000") reads the same
  `offer.fee_amount_min` field the offer page's own `FeeBandDisplay` reads — it is not a second,
  separately-edited copy. Updating a fee via the Offers content area updates it everywhere the
  fee appears, including the nav, in one save.
- Retiring a category does not delete the articles in it: those articles fall back to
  "no assigned category" (already a defined state per `insights-engine.md`'s edge cases —
  still listed on the index, excluded from category-filtered views), never deleted or
  orphaned by a category change.

## Data requirements

Shares the schema of the features it edits (`article`, `category`, `page`, `legal_page`,
`offer` with structured fee fields, `advisory_retainer` with the same fee-field discipline,
`landing_page`, `author`, `diagnostic_question`, `diagnostic_dimension`,
`diagnostic_threshold`) — this feature is the UI and authorization layer over that data, not
a separate data model. `author`
— id, admin_user_id (FK), name, photo_url, practice_area, credentials, personal_statement,
bio, published (bool) — one record per partner, linked to but distinct from their login
identity so public profile edits never touch authentication data. `site_settings` — a
singleton record: phone_primary, phone_secondary (nullable), email, whatsapp_number, address,
response_time_commitment, social_profile_urls (list, nullable —
`seo-and-search-foundation.md`'s Organization schema `sameAs` source). Additionally:
`admin_user` — id, name, email, role, TOTP secret (encrypted), created_at, last_login.

## Interfaces

- `/admin` — authenticated area, screens per content type listed above.
- `PATCH /api/admin/articles/[id]`, `PATCH /api/admin/pages/[id]`, `PATCH
/api/admin/offers/[id]`, `POST /api/admin/landing-pages`, `PATCH /api/admin/authors/[id]`,
  `PATCH /api/admin/diagnostic-questions/[id]`, `PATCH /api/admin/diagnostic-dimensions/[id]`,
  `PATCH /api/admin/diagnostic-thresholds/[id]`, `PATCH /api/admin/site-settings`, `POST
/api/admin/categories`, `PATCH /api/admin/categories/[id]` — all requiring a valid
  authenticated session with the appropriate role. Photo upload reuses the same media
  pipeline as an article's required preview image (Cloudflare R2, per ADR 0004) — no separate
  upload mechanism.

## Edge cases

- Partner attempts to publish an article with no preview image: blocked with a clear
  inline error, not a silent failure.
- Two partners edit the same page simultaneously: last write wins at launch — optimistic
  locking/conflict detection is not required for Phase 1 given five partners and low edit
  frequency, but is noted here as a known simplification (recorded in
  `memory/technical-debt.md` once implementation begins).
- Partner attempts to publish a fee band without its scope cap: the form requires both
  fields together; the API rejects a fee update missing the scope cap.
- Session expires mid-edit: unsaved changes are lost; the admin UI should warn before
  navigating away with unsaved edits (a UX requirement, not a data-loss risk, since nothing
  is persisted until save).
- A partner's `author` record is missing a required field (no photo yet, most commonly at
  launch): `published` stays false and the entry is simply omitted from `/about` and from
  article bylines until it's complete — never shown half-filled.
- A Diagnostic Configuration change would leave a dimension with no active questions: the
  save is rejected with an inline error naming the dimension, before publish — this is the
  scenario `business-health-check-diagnostic.md` describes as a 500 if it ever reaches a
  visitor; the validation here is what prevents that.
- A required `site_settings` field is left blank (e.g. before launch content is finalised):
  the corresponding display (phone link, WhatsApp button) is omitted from the public site
  rather than rendering broken or empty, consistent with the "smaller and complete" principle
  applied elsewhere in this feature.
- A partner creates a category whose name produces a slug already in use: rejected with an
  inline error, same pattern as any other unique-slug conflict in the admin, rather than
  silently creating a second category with a colliding URL.
