# Epic: Online Appointment Booking (P2-1)

Roadmap milestone 10. **Gated — not scheduled.** Trigger: sustained enquiry volume where
scheduling by message is genuinely costing partner time (`scope.md`). Fully planned here so
meeting the trigger converts directly into build work.

---

### T10.1 — Data model + partner-managed availability

**Build:** `booking_slot` (partner_id, start/end, status), `booking` (enquiry_id, slot_id,
confirmed_at); admin screen (`ui/screen-inventory.md` #52a) where each partner manages only
their own slots — never opened on a partner's behalf, since protecting real capacity is the
whole point.
**Input → Output:** Schema + slot-management form → partner-owned availability data.
**Acceptance criteria:** A partner can only create/edit their own `booking_slot` rows, never
another partner's, enforced server-side.
**Size:** M **Dependencies:** T6.1 (admin auth), T3.1 (enquiry_record exists)

### T10.2 — Availability API + calendar sync

**Build:** `GET /api/booking/availability?partner_or_service=[id]` routed by practice area/
service line; calendar sync against each partner's own external calendar preventing
double-booking against non-site work (FR-9.3).
**Input → Output:** Partner/service id → available slots reflecting real capacity (~40hrs/
month per partner, per 04.05 Firm Budget), minus externally-synced conflicts.
**Acceptance criteria:** A slot blocked on the partner's external calendar never appears
available here; if the external calendar is unreachable at sync time, availability shows as
none for that partner rather than a stale/incorrect list (documented edge case).
**Size:** L **Dependencies:** T10.1

### T10.3 — Booking flow on results/contact + confirmation

**Build:** "Book a call" option surfaced on `/diagnostic/results` and `/contact` alongside
existing routes; `POST /api/booking/confirm`; email + WhatsApp confirmation/reminder.
**Input → Output:** `{enquiry_id, slot_id}` → confirmed `booking`, slot marked unavailable,
confirmation sent; fires `consultation_booked` with the originating enquiry's attribution.
**Acceptance criteria:** Two simultaneous bookings for the same slot: the second fails
cleanly with "already taken" + refreshed availability, never a silent double-booking
(database-level lock, not app-level check); confirmation reaches both email and WhatsApp.
**Size:** M **Dependencies:** T10.2, T5.3 (measurement stack)

### T10.4 — Bookings list (admin)

**Build:** `ui/screen-inventory.md` #52b — `AdminDataTable` variant showing confirmed
bookings against the linked `enquiry_record`; calendar-sync connection status per partner.
**Input → Output:** `booking` table → list a partner can actually see their bookings on —
without this screen, a confirmed booking exists with no consuming counterpart.
**Acceptance criteria:** Every confirmed booking from T10.3 appears here linked correctly to
its enquiry.
**Size:** S **Dependencies:** T10.3

**Note (flagged, not resolved):** a booking whose referring enquiry is later deleted under a
data-deletion request retains its own operational data (time, partner, status) per the same
firm-policy boundary flagged in `08-enquiry-management.md` T8.4 — resolve both together, not
independently.
