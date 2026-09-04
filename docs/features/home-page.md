# Feature: Home Page

Phase 1. Document 13.03, Section 5.

## Goal

Answer three questions above the fold — what the firm does, who it's for, what to do next —
so a visitor can judge fit within seconds, then present the firm's substance (offers,
method, senior attention, Insights) with one repeated primary call to action (`vision.md`;
`user-stories.md`, Story 1).

## User flow

1. Visitor lands on `/`.
2. Above the fold: a statement of what the firm does, who it serves, and one primary call to
   action — no scrolling required to answer those three questions.
3. Scrolling reveals, in order: the three core offer cards; the four-stage method as a single
   graphic; a short passage on senior attention; two or three Insights articles; the
   diagnostic presented as the primary call to action.
4. Visitor either clicks through to an offer page, the diagnostic, an Insights article, or a
   secondary route (Contact, About).

## Business rules

- One primary action per screen section, repeated — never multiple competing buttons
  (Document 13.03, Section 5).
- The diagnostic is the primary call to action, consistent with it being "the single most
  important conversion asset on the site."
- Content blocks (hero statement, offer cards, method graphic, senior-attention passage,
  featured Insights) are editable by a non-technical partner (FR-8) without needing a
  developer for routine copy changes.
- The two or three featured Insights articles are either manually pinned or automatically the
  most recent — this is a content-operations choice for `content-management-admin.md` to
  support, not resolved here.

## Data requirements

- `home_page_content` — id, hero_statement, primary_cta_label, primary_cta_href,
  senior_attention_copy, featured_article_ids (up to 3, nullable = most-recent fallback),
  meta_title, meta_description (NFR-5; `seo-and-search-foundation.md`).
- References `offer` (for the three cards) and `article` (for featured Insights) —
  no duplicate data, just relations.

## Interfaces

- `GET /` — the home page screen, server-rendered.
- Editable via `content-management-admin.md`'s Pages screen.

## Edge cases

- Fewer than three published offer pages exist (e.g. during content migration before
  launch): the offer-card section renders only the offers that exist, never a broken
  placeholder card.
- No Insights articles are published yet: the featured-Insights section is omitted entirely
  rather than shown empty, consistent with Document 13.03, Section 4's principle that an
  empty section reads worse than a smaller, complete page.
- Featured articles manually pinned but later unpublished: the section falls back to
  most-recent automatically rather than showing a broken reference.
