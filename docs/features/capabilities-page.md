# Feature: Capabilities Page

Phase 1. Document 13.03, Section 5; FR-1.2.

## Goal

Let a visitor with an adjacent need see the firm covers it, without diluting the three core
offers with equally-weighted service pages the firm isn't ready to lead with (Document
13.03, Section 4).

## User flow

1. Visitor reaches `/capabilities` from Home or navigation.
2. Sees all eight service lines in summary, including the Advisory Retainer presented as a
   continuing arrangement (not a fourth offer page, per Document 13.03, Section 17, Item 3).
3. Clicks a service line, reaching a parameterised enquiry route (`/contact?service=[slug]`)
   rather than a dedicated page for that line.

## Business rules

- Exactly eight service line summaries appear, each a short description, not a full offer
  page (only the three core offers get full pages — `core-offer-pages.md`).
- Every service-line link routes to Contact with a `service` parameter identifying which line
  the visitor clicked, so the firm sees which capability generated a given enquiry (FR-1.2).
- The Advisory Retainer's summary describes it as a continuing arrangement, distinct in tone
  from the transactional framing of the eight service lines.
- The Advisory Retainer's fee follows the same structured-field discipline as the three core
  offers (`core-offer-pages.md`, `content-management-admin.md`) — an amount, a currency, and
  a billing period, edited as fields, never as free text folded into the page copy.

## Data requirements

- `capability` — id, name, slug, short_description, order. Edited via
  `content-management-admin.md`'s Pages content area, as a linked repeating section on this
  page's editor screen — the same one-screen-multiple-entities pattern
  `core-offer-pages.md`'s editor uses for method stages and deliverables together, not a
  separate top-level nav item for eight rows of content.
- `advisory_retainer` — a singleton: fee_amount, fee_currency, billing_period (e.g.
  "month"), description. Edited via `content-management-admin.md`'s Offers content area,
  alongside the three core offer fee bands.
- `page` (shared with `our-method-page.md`) — id, slug, hero_kicker, hero_heading, hero_lead,
  meta_title, meta_description. Holds this page's own hero text, distinct from the eight
  `capability` rows.

## Interfaces

- `GET /capabilities` — the capabilities page screen.
- Each capability card links to `/contact?service=[slug]`.

## Edge cases

- A capability's slug doesn't match any expected value on the Contact page: Contact treats
  an unrecognised `service` parameter as no parameter at all (a general enquiry), rather than
  erroring.
