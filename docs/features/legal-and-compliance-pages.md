# Feature: Legal and Compliance Pages

Phase 1. Document 13.03, Section 8, Section 9; FR-5.1, FR-6.5.

## Goal

Carry the four legally-required documents (privacy notice, cookie notice, terms of use,
scope-of-practice statement) and the shared footer that references them on every page,
satisfying the firm's compliance obligations and the advertising platforms' requirement for
a stable, direct privacy-policy URL (Document 13.03, Section 5, Section 9).

## User flow

1. Visitor reaches any of `/legal/privacy-notice`, `/legal/cookie-notice`,
   `/legal/terms-of-use`, `/legal/scope-of-practice` — from the footer, present on every page
   including every landing page.
2. Reads the plain-language content, supplied by the firm with counsel, not authored by the
   build team (Document 13.03, Section 17, Item 6).

## Business rules

- All four documents live at stable, individually-linkable URLs — not one combined page with
  anchors — because advertising platforms require a direct privacy-policy URL during account
  verification (`SM/2026-09`, Section 2).
- The scope-of-practice statement additionally renders as a shared footer component on every
  page site-wide, including every landing page (FR-5.1) — a single source, so a wording
  change after legal review propagates everywhere at once, never edited per-page.
- The privacy notice specifically must be live at its stable URL before the site becomes
  publicly reachable (FR-6.5) — this is a launch gate, not a nice-to-have.
- This content is drafted by the firm with counsel and supplied as copy (Document 13.03,
  Section 17, Item 6) — the build team implements the page and footer component, and does not
  draft or alter the legal text itself.
- Company registration details render in the footer once the firm supplies them
  post-incorporation (FR-5.2) — absent until then, not a placeholder.

## Data requirements

- `legal_page` — id, slug (one of the four fixed slugs), title, body (rich content),
  last_revised_at. Edited via `content-management-admin.md`'s Pages content area, the same as
  any other page. `meta_description` added at T2.7 (build), beyond this doc's original field
  list, per CLAUDE.md's "every public page type carries meta_title/meta_description" rule —
  `title` itself doubles as the page's meta title. `body` is implemented as an ordered array
  of content blocks (`lib/legal.ts`'s `LegalPageBlock`: `statement`/`prose`/`pending`/`table`
  kinds), not one opaque string — the four real mockups (`ui/mockups/e-legal/*.html`) don't
  share one uniform shape.
- `footer_content` — scope_of_practice_statement, company_registration_details (nullable
  until supplied). Distinct from `site_settings` (`content-management-admin.md`), which holds
  the footer's contact details (phone, email, address) — this entity is legal/compliance text
  specifically, supplied by counsel per the business rule above. Edited as a second panel on
  the same Site Settings screen as `site_settings` (both are singletons the footer reads from)
  — not a separate nav item, since it's one small block of text, not a content type of its
  own. Materialized at T2.7 but not yet wired into `SiteFooter`/`ScopeOfPracticeNote`, which
  still render T1.5's original hardcoded copy — see `memory/technical-debt.md`, sequenced into
  T7.8 alongside the equivalent `site_settings` gap.

## Interfaces

- `GET /legal/[slug]` — the legal page screen, four fixed instances.
- The shared footer component, rendered on every page and every landing page.

## Edge cases

- The site is ready to launch but the firm has not yet supplied the privacy notice: launch
  is blocked — this is the one content dependency treated as an absolute gate, not sequenced
  around, consistent with FR-6.5 and Document 13.03, Section 17, Item 6.
- Company registration details are not yet available at launch (incorporation still in
  progress): the footer omits that line entirely rather than showing a placeholder, and is
  updated the moment the firm supplies it — no rebuild required.
