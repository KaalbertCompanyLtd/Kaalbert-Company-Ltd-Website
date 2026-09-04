# Feature: Booking and Scheduling (P2-1)

**Phase 2 — gated.** Trigger: sustained enquiry volume where scheduling by message is
genuinely costing partner time (`scope.md`, P2-1). Not built until then.

## Goal

Let a founder with a strong diagnostic result book a first call directly with the right
partner, without a WhatsApp back-and-forth to find a time — while protecting partners' real,
limited capacity rather than presenting an open calendar (`scope.md`; `user-stories.md`,
Story 16).

## User flow

1. On `/diagnostic/results` or `/contact`, visitor sees a "book a call" option alongside the
   existing summary-request/contact routes.
2. Visitor sees only slots reflecting the relevant partner's real, limited availability
   (routed by practice area or the originating service line, not a generic pool).
3. Visitor selects a slot, confirms, and receives a confirmation with reminder messaging by
   email and WhatsApp.
4. The booking is written to the enquiry record with the same source attribution as the
   diagnostic session or enquiry that led to it.

## Business rules

- Slot types are configured against each partner's actual committed capacity (roughly forty
  hours a month each, per 04.05 Firm Budget and Cash Flow) — never an open, unlimited
  calendar (FR-9.2).
- Booking routes to a specific partner by practice area or originating service line,
  consistent with the firm's stated differentiator of senior attention (Document 13.03,
  Section 3).
- Calendar sync with each partner's own calendar prevents double-booking against client work
  scheduled outside the site (FR-9.3).
- A `consultation_booked` event fires through the existing GTM/measurement stack, carrying
  the same attribution as everything else (FR-9.4).

## Data requirements

- `booking_slot` — id, partner_id, start_time, end_time, status (available/booked).
- `booking` — id, enquiry_id (references `enquiry_record`), booking_slot_id, confirmed_at.

## Interfaces

- `GET /api/booking/availability?partner_or_service=[id]` — available slots.
- `POST /api/booking/confirm` — request: `{enquiry_id, slot_id}`; response: `{status,
booking_id}`.
- Admin-side (within `/admin`, under Operations): each partner manages their own
  `booking_slot` rows directly — no one else opens slots on a partner's behalf, since the
  whole point of the feature is protecting that partner's real capacity (the business rule
  above). Calendar-sync connection status is shown per partner. A "Bookings" list (an
  `AdminDataTable` variant) shows confirmed bookings against the linked `enquiry_record` —
  without this, a booking exists in the database with no screen a partner ever sees it on.

## Edge cases

- A slot is booked by two visitors simultaneously: the second request fails cleanly with an
  "already taken" response and refreshed availability, not a silent double-booking.
- A partner's external calendar is unreachable at the moment of sync: the booking screen
  shows no availability for that partner rather than risking a stale/incorrect slot list.
- A visitor books, then the referring enquiry is later deleted under a data-deletion request
  (`enquiry-management.md`): the booking's own record (time, partner, status) is retained for
  the firm's operational scheduling needs even if personal contact data tied to it is
  removed — the exact boundary is a firm policy decision, flagged the same way as in
  `enquiry-management.md`.
