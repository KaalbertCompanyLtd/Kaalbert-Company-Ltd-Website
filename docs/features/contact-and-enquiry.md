# Feature: Contact and Enquiry

Phase 1. Document 13.03, Section 5; FR-1.2, FR-7.8.

## Goal

Give a visitor who isn't ready for the diagnostic a short, direct route to reach the firm —
by form, WhatsApp, phone, or email — while still capturing enough context (which service
line, if any) that the firm isn't starting cold (`user-stories.md`, Stories 4, 8).

## User flow

1. Visitor reaches `/contact`, optionally with a `?service=[slug]` parameter carried from
   `capabilities-page.md` or a core offer page.
2. Sees: a short form, a WhatsApp link, a phone number, an email address, the office
   location, and a stated response-time commitment the firm can actually keep.
3. Visitor submits the form, or clicks WhatsApp/phone/email directly.
4. On form submission, an `enquiry_record` is created (shared entity with
   `business-health-check-diagnostic.md`) and the firm is notified.

## Business rules

- This is deliberately not a generic "request a consultation" form — it is short, and any
  `service` parameter present is stored against the resulting enquiry so the firm knows which
  capability prompted it (FR-1.2), consistent with Document 13.03, Section 4's rejection of a
  form that "captures names, not context."
- The WhatsApp link carries a pre-filled message identifying the page/context it came from
  and fires a tracked click event (FR-7.8) — the same pattern as every other WhatsApp link
  site-wide.
- The stated response-time commitment is content the firm supplies and must actually be able
  to keep (Document 13.03, Section 5) — not a build decision, and specifically not a
  hardcoded string: it lives in `site_settings` (`content-management-admin.md`) alongside the
  phone numbers, WhatsApp number, email, and address this page displays, so correcting any of
  them is a Site Settings edit, not a code change.
- Contact consent is captured on form submission, separate from any marketing consent
  (FR-6.2) — this page's form does not bundle the two.

## Data requirements

- Shares `enquiry_record` with `business-health-check-diagnostic.md` and
  `enquiry-management.md`: diagnostic-specific fields (responses, score) remain null for a
  contact-form-originated enquiry; `service_line` (nullable, from the query parameter) is
  populated here specifically.
- `message` (text, required) — added at T2.6 (`docs/tasks/02-public-presentation.md`): the
  form's free-text body ("What's going on with the business?"), not originally named in this
  doc's data requirements list but required by this feature's own Input → Output contract.
  Added the same way `core-offer-pages.md`'s `offer` entity gained `cta_label`/tiers beyond
  its own original field list (see `memory/decision-log.md`).
- Reads (does not own) `site_settings` — phone numbers, WhatsApp number, email, address,
  response_time_commitment — defined and edited in `content-management-admin.md`.

## Interfaces

- `GET /contact` — the page screen, reading the optional `service` query parameter.
- `POST /api/contact/submit` — request: `{name, email, phone?, message, service?,
contact_consent}`; response: `{status, enquiry_id}`. Fires `enquiry_submitted`.

## Edge cases

- An unrecognised `service` parameter value: treated as no parameter (a general enquiry),
  per `capabilities-page.md`'s edge case.
- Form submitted with contact consent unchecked: rejected — the firm cannot act on an
  enquiry it has no consent to respond to.
- Duplicate submissions from the same visitor in quick succession: not deduplicated at
  launch, the same accepted simplification noted for the diagnostic (FR-14.2 defers this to
  Phase 2 CRM sync).
