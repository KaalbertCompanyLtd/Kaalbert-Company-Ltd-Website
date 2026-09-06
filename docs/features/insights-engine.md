# Feature: Insights Engine

Phase 1. The firm's authority instrument — Document 13.03, Section 7.

## Goal

Let a founder who has never heard of Kaalbert build trust in the firm's expertise before any
contact, and give the firm a realistic route to search visibility on problem-shaped queries
it can actually win, rather than generic terms it cannot (Document 13.03, Section 1, Job 2;
Section 7).

## User flow

1. Visitor arrives at `/insights` (from Home, navigation, or a search result) or directly at
   an article via `/insights/[slug]` (from a shared link or search result).
2. On the index, the visitor filters by category and/or searches, sees related articles, and
   opens one.
3. On an article, the visitor reads content that may include tables, pull quotations,
   figures, and downloadable resources, sees the named partner author with photo and practice
   area, and reaches a contextual next step tied to the article's subject at the end.
4. The visitor may share the article link via WhatsApp, LinkedIn, or Facebook; the recipient
   sees a correct preview card.
5. **Subscription** — a visitor not ready for the diagnostic can instead subscribe to
   Insights by email: a short capture form on the Index and at the foot of every article
   (Document 13.03, Section 6 names this, alongside the funding-readiness checklist, as one
   of exactly two "secondary capture routes... lighter commitments for a visitor not yet
   ready for the diagnostic"). Subscribing requires nothing more than an email address and
   one explicit, unticked consent checkbox — there is no separate "contact consent" here,
   since a newsletter signup is itself the marketing communication being consented to
   (FR-6.2's separation principle is satisfied by this being its own dedicated opt-in, never
   bundled with any other form's consent).

## Business rules

- Every article has exactly one named partner author with photo and practice area (FR-3.3).
- Every article ends with a contextual next step specific to its subject — never a generic
  "contact us" (FR-3.4).
- Every article and every other page on the site carries complete Open Graph and Twitter Card
  metadata, including a correctly-dimensioned preview image (FR-3.5) — this is a site-wide
  rule enforced by the page-rendering layer, not something authored per article.
- The system must perform without degradation to list, search, or filter response time at a
  minimum of 100 published articles (FR-3.6).
- Publication cadence at launch is two articles a month across five partners (Document
  13.03, Section 7) — a content-operations fact, not a build constraint, but the admin's
  publishing flow (see `content-management-admin.md`) must not add friction that works
  against that cadence.
- `published_at` is the single source of truth for whether an article is live: null means
  draft. The index, category filter, search, "related articles," Home's featured-Insights
  section (`home-page.md`), and article author bylines everywhere else on the site all read
  live from this same field — a draft article is never returned by any of them, and there is
  no separate "is this visible" flag to fall out of sync with it. Requesting a draft
  article's own URL directly (`/insights/[slug]`) 404s for a visitor exactly as if the slug
  didn't exist; only an authenticated partner previewing their own draft in the admin can see
  it un-published.
- Subscribing does not fire a new named conversion event — Document 13.03's Section 11.1 list
  of six tracked events (diagnostic started/completed, summary requested, checklist
  downloaded, enquiry submitted, WhatsApp opened) is fixed, and subscription is not one of
  them. It is still captured as real, admin-visible data (below); a deliberate scoping choice
  not to invent a seventh event, not an oversight.

## Data requirements

- `article` — id, slug, title, body (rich content), author_id, category, published_at,
  revised_at, preview_image, meta_title, meta_description, next_step_cta.
- `article_resource` — id, article_id, file reference (downloadable attachment).
- `author` — id (a partner), name, photo, practice_area, bio.
- `category` — id, name, slug. Managed via `content-management-admin.md`'s Categories area —
  a partner creates and retires categories directly, not limited to a developer-seeded list.
- `subscriber` — id, email, subscribed_at, consent (bool, explicit and unticked by default),
  unsubscribed_at (nullable). Viewable/exportable in a new "Subscribers" area under admin's
  Operations group (`content-management-admin.md`), inferred from the same `AdminDataTable`
  pattern as the Enquiries list — a real, distinct list of real people's data, not folded
  into Enquiries, since a subscriber and an enquiry are different relationships with the
  firm. This entity captures and stores consent only — Phase 1 never actually emails this
  list beyond the one-time subscription confirmation (T4.5). Actually reaching subscribers
  is `docs/features/subscriber-outreach.md` (P2-8), a gated Phase 2 capability, not this
  task's or this milestone's scope.

## Interfaces

- `GET /insights` — index, screen with category filter and search.
- `GET /insights?category=[slug]&q=[query]` — filtered/searched results, shareable URL.
- `GET /insights/[slug]` — article template screen.
- Structured data (JSON-LD, `Article` schema) rendered on every article page (NFR-5).
- `POST /api/insights/subscribe` — request: `{email, consent}`; response: `{status}`.
- `POST /api/insights/unsubscribe` — a one-click link in every sent email, per standard
  practice; sets `unsubscribed_at`, never deletes the record outright (so re-subscription
  doesn't look like a first-time signup to anyone reviewing the list).

## Edge cases

- An article with no assigned category: still listed on the index, excluded from
  category-filtered views, included in search and "related articles."
- A visitor requests a draft article's URL directly, or a search engine has an old link to an
  article since unpublished (`published_at` reverted to null): the route 404s for a visitor,
  same as a slug that never existed — never a partially-rendered draft.
- A shared link pasted before OG/meta fields are fully populated (e.g. article published via
  the admin without a preview image set): the admin's publish flow must require a preview
  image before allowing publication, not allow a broken preview card to go live (see
  `content-management-admin.md`).
- Search with no matching results: an empty state, not a blank page, with a link back to the
  full index.
- A downloadable resource file is removed after an article referencing it is already
  published: the article's download link must fail gracefully with a clear message, not a
  broken link with no explanation.
- An already-subscribed email subscribes again: no duplicate record — treated as a
  re-confirmation, and if `unsubscribed_at` was set, it's cleared rather than creating a
  second row for the same person.
