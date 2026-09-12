# Feature: Landing Page Template

Phase 1. Document 13.03, Section 11.2; FR-4.2, FR-4.3.

## Goal

Carry paid traffic to a page with one message and one call to action, distinct from the main
site, built so a partner can launch a new campaign page without the vendor (`vision.md`;
`user-stories.md`, Story 10).

## User flow

1. Visitor arrives from a paid advertisement at `/lp/[slug]`.
2. Sees no full site navigation — one headline, one message, one call to action, and the
   full scope-of-practice footer statement in full (Document 13.03, Section 8.2).
3. Acts on the call to action (typically the diagnostic, the funding-readiness checklist
   download, or an enquiry route).

## Business rules

- No full site navigation renders on any `/lp/` page (Document 13.03, Section 5, Section
  11.2) — this is a template-level rule, not a per-page choice.
- The headline and opening paragraph are independently editable from the rest of the page
  body, so the same template serves multiple campaigns without a rebuild (FR-4.2).
- A non-technical partner can create a new landing page instance from the template without
  vendor involvement (FR-4.3) — this is the literal acceptance bar tested in AC-6 alongside
  the other content-management tasks.
- A partner can also edit every field of an already-live instance except its URL `slug`,
  which is fixed once the page is created — the same "stable, shareable/indexable URL"
  reasoning `insights-engine.md` applies to an article's slug, sharpened here by the fact
  that a landing page's URL is the literal destination printed on an ad, a QR code, or
  campaign copy: changing it after launch would silently break whatever already points at
  it. A partner who genuinely needs a new URL creates a new landing page instead of editing
  the old one's slug.
- The Section 8.2 footer statement is present in full on every instance — "a landing page
  stripped of navigation is not stripped of this obligation" (Document 13.03, Section 8.2).
- Three instances exist at launch: `/lp/business-health-check`, `/lp/funding-readiness-
checklist`, `/lp/financial-clarity-pack` (`SM/2026-09`).
- Meets the same NFR-1 performance threshold as every other page, and Document 13.03 notes
  it matters more here, "because paid traffic is lost during the wait."

## Data requirements

- `landing_page` — id, slug, headline, opening_paragraph, body_content, cta_label, cta_href,
  campaign_reference (for internal tracking, distinct from UTM parameters which are captured
  per visit, see `measurement-and-attribution.md`), meta_title, meta_description. NFR-5's
  complete-OG/Twitter-tags requirement applies to every page including these — a landing
  page is a paid-ad destination, not meant for organic search, but it is still shared and
  previewed (an ad platform's own preview, a forwarded link) and needs correct tags for that
  (`seo-and-search-foundation.md`).

## Interfaces

- `GET /lp/[slug]` — the landing page screen, no navigation chrome.
- `POST /api/admin/landing-pages` — create a new instance from the template (see
  `content-management-admin.md`).
- `PATCH /api/admin/landing-pages/[slug]` — edit an already-live instance's content (every
  field except the URL `slug` itself, which is fixed once created — added session 60,
  correcting this document's original create-only scope: nothing in FR-4.2/FR-4.3 ever asked
  for editing to be excluded, and a live campaign needing a copy fix or a corrected CTA link
  is the ordinary case, not the exception; see `memory/decision-log.md`, sessions 48 and 60).

## Edge cases

- A landing page is requested for a slug that doesn't exist: standard 404.
- A landing page is created without the mandatory footer statement somehow being altered:
  the footer component is shared and not editable per-instance, so this cannot occur by
  construction (see `legal-and-compliance-pages.md`'s shared footer source).
- A partner attempts to add full navigation to a landing page instance: the template does
  not expose that option — navigation is structurally absent from this template, not merely
  hidden by a toggle a partner could accidentally enable.
