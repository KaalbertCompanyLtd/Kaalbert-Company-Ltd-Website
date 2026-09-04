# Feature: Training Registration (P2-5)

**Phase 2 — gated.** Trigger: a scheduled programme with dates and capacity (`scope.md`,
P2-5). Not built until then.

## Goal

Let a founder register for a training session and know immediately whether they have a
confirmed seat or are waitlisted, without the firm overselling a session's real capacity
(`scope.md`; `user-stories.md`, Story 20).

## User flow

1. Visitor reaches a training session page (built from the landing page template,
   `landing-page-template.md`, with a registration form in place of an enquiry form).
2. Sees the session's date, time, capacity, and fee if applicable.
3. Submits registration.
4. If capacity remains, sees an immediate confirmation; if full, is added to a waitlist and
   told so plainly.
5. A `training_registered` event fires through the existing measurement stack.

## Business rules

- Reuses the landing page template's independently-editable content pattern (FR-13.3) — a
  training page is a landing page with a registration form instead of an enquiry form, not a
  new template type.
- Capacity is enforced server-side at the moment of registration, not merely displayed as a
  number the client trusts — two simultaneous registrations for the last seat must not both
  succeed.
- A waitlisted registrant is told clearly they are waitlisted, not given a confirmation
  that implies a seat.
- If a confirmed registrant cancels, the next waitlisted registrant is offered the freed
  seat (not automatically confirmed without their acceptance, since availability may no
  longer suit them).

## Data requirements

- `training_session` — id, title, date, time, capacity, fee (nullable), landing_page_id.
- `training_registration` — id, session_id, name, email, phone, status
  (confirmed/waitlisted/cancelled), registered_at.

## Interfaces

- `GET /training/[slug]` — the training session page itself (screen-inventory.md #57),
  reading the `training_session` entity — the registration endpoints below act against it,
  but the page's own read route was missing from an earlier pass of this doc.
- `POST /api/training/register` — request: `{session_id, name, email, phone}`; response:
  `{status: confirmed|waitlisted}`.
- `POST /api/training/[registration_id]/cancel` — client-initiated cancellation.
- Admin-side: create/edit a `training_session` (title, date, time, capacity, fee) from the
  landing page template's create-from-template flow (`content-management-admin.md`'s Landing
  Pages content area) — a training session page is structurally a landing page instance with
  a registration form, not a new content type needing its own admin area.

## Edge cases

- Two registrations for the last seat submitted within milliseconds of each other: handled
  with a database-level constraint/lock on capacity, not an application-level check that can
  race.
- A registrant cancels after being confirmed: their seat is offered to the next waitlisted
  registrant, who must actively accept it (not auto-confirmed) since their availability may
  have changed since registering.
- A session is cancelled by the firm entirely: all registrants (confirmed and waitlisted)
  are notified; this is an admin action, not a feature this spec defines the UI for beyond
  noting it must exist.
