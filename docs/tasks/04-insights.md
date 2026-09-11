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

### T4.6 — Article byline resolves against a real `author.published` check

**Build:** `lib/insights.ts`'s several `article.author`-including queries (index cards,
related articles, `lib/home.ts`'s featured-Insights section) and `app/insights/[slug]/
page.tsx`'s byline currently read `author.name`/`author.practiceArea` directly with no
`published` check at all — discovered at T7.6 (session 49) while building the Team admin
editor, which can leave an `author` row unpublished (required fields cleared) while it still
has existing articles crediting it, once that editor's own protective validation is ever
relaxed or bypassed directly via the database. Requires a real product decision first, not
just a mechanical fix: either (a) an unpublished author's existing article bylines fall back
to a neutral attribution (omit the byline, or credit "Kaalbert & Company Ltd") once their
profile goes dark, or (b) a byline is a historical record of who wrote the piece and stays
exactly as it was regardless of the author's current profile state, and `author.published`
was never meant to reach bylines at all — confirm which with the firm before implementing
either.
**Input → Output:** An `author` row with `published: false` → (a) every existing article
byline crediting them falls back to the neutral attribution, or (b) bylines are confirmed
exempt and no code changes — whichever the firm confirms.
**Acceptance criteria:** Once the firm's answer is confirmed: if (a), an author's articles'
bylines change the moment that author is unpublished, with no code change needed per article
(same "one edit, every reader" principle as every other admin-editable content in this
project); if (b), this task closes by updating `insights-engine.md`'s own documented byline
behavior to state the exemption explicitly, so it's a recorded decision, not a silent gap.
**Size:** S **Dependencies:** T4.1, T7.6 (`lib/admin-authors.ts`'s `updateAuthor` is the one
write path this currently depends on staying protective in the meantime)
