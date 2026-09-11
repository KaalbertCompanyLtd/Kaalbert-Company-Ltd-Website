# Epic: Insights

Roadmap milestone 4. "The firm's authority instrument" (Document 13.03, Section 7) — public
reading side only; the admin authoring screen is Milestone 7, but every task here is fully
functional against migrated content from the moment it ships. Builds to
`ui/mockups/a-public-site/insights-index.html` and `insights-article.html`.

---

### T4.1 — Data model: `article`, `author`, `category`, `article_resource`

**Build:** Tables per `docs/features/insights-engine.md`, with `published_at` as the single
source of truth for visibility (null = draft) — no separate `is_published` flag to fall out
of sync with it.
**Input → Output:** Schema definition → migrated tables.
**Acceptance criteria:** A row with `published_at: null` is provably excluded by every query
built in T4.2–T4.4 (covered by their own tests, not re-tested here) — this task only confirms
the schema itself has no redundant visibility flag.
**Size:** S **Dependencies:** T1.2

### T4.2 — Insights index — `/insights`

**Build:** Index screen to its mockup: category filter, search, article cards, performant to
100+ published articles (FR-3.6) via proper indexing on `published_at`/`category`.
**Input → Output:** `GET /insights` and `GET /insights?category=&q=` → filtered/searched
article list.
**Acceptance criteria:** Filter and search both produce shareable URLs (query params, not
client-only state); empty search results show the documented empty state, not a blank page;
draft articles never appear.
**Size:** M **Dependencies:** T4.1, T1.5

### T4.3 — Article template — `/insights/[slug]`

**Build:** Article template to its mockup: rich body content (tables, pull quotes, figures),
downloadable resources, named author byline with photo/practice area, contextual next-step
CTA, OG/Twitter metadata, `Article` JSON-LD (NFR-5) — the site-wide OG/structured-data rule
this task implements for every article, distinct from `seo-and-search-foundation.md`'s
page-level meta (that epic's task does not duplicate this one).
**Input → Output:** `article` row → rendered page with correct social preview card when
shared.
**Acceptance criteria:** A draft article's slug 404s exactly as if it never existed; a removed
`article_resource` file fails gracefully with a clear message, not a dead link; sharing the
URL via WhatsApp/LinkedIn/Facebook preview tools shows a correctly-dimensioned image and
correct title/description.
**Size:** L **Dependencies:** T4.1, T1.5

### T4.4 — Article content seed

**Build:** Seed script with the firm's real articles where supplied (Document 13.03, Section
13), and the mockup's illustrative article flagged `is_placeholder: true` standing in for any
not yet supplied — matching T2.9/T3.3's established placeholder convention.
**Input → Output:** Company Docs article content (or mockup illustrative content) → seeded
`article`/`author`/`category` rows.
**Acceptance criteria:** At least one real, non-placeholder author (a real partner) and
category are seeded even where article body content itself is placeholder, so the byline/
practice-area rendering (FR-3.3) is tested against real data, not fabricated names.
**Size:** S **Dependencies:** T4.1

### T4.5 — Subscription capture

**Build:** The subscribe form on the index and at the foot of every article, `subscriber`
entity, `POST /api/insights/subscribe`, `POST /api/insights/unsubscribe` — one explicit,
unticked consent checkbox, no separate contact-consent field (per the documented reasoning
that the signup itself is the consent).
**Input → Output:** `{email, consent}` → `subscriber` row; unsubscribe link (sent in every
transactional email, reusing T3.7's email utility) → `unsubscribed_at` set.
**Acceptance criteria:** A duplicate signup from an already-subscribed email does not create a
second row — re-confirms, and clears `unsubscribed_at` if it was set; no `subscription`
measurement event fires (deliberately not one of Document 13.03's fixed six events — this
task must not invent one).
**Size:** M **Dependencies:** T4.1, T3.7 (email utility)
