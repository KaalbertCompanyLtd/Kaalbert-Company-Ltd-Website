# Epic: Training Registration (P2-5)

Roadmap milestone 14. **Gated — not scheduled.** Trigger: a scheduled programme with dates
and capacity.

---

### T14.1 — Data model

**Build:** `training_session` (title, date, time, capacity, fee nullable, landing_page_id),
`training_registration` (session_id, name, email, phone, status, registered_at) — structurally
a landing page instance with a registration form, not a new template type (FR-13.3).
**Input → Output:** Schema → migrated tables.
**Acceptance criteria:** `training_session` FKs correctly to an existing `landing_page` row,
proven by seeding one against a real landing page created via T5.1's template.
**Size:** S **Dependencies:** T5.1, T1.2

### T14.2 — Training session page — `GET /training/[slug]`

**Build:** The session page itself (`ui/screen-inventory.md` #57), reading `training_session`
— date, time, capacity, fee if applicable, registration form in place of the landing
template's default enquiry form.
**Input → Output:** `training_session` row → rendered page with registration form.
**Acceptance criteria:** Page renders correctly with and without a fee set; reuses the landing
page template's independently-editable content pattern with no forked template code.
**Size:** M **Dependencies:** T14.1

### T14.3 — Registration with server-side capacity enforcement

**Build:** `POST /api/training/register`, capacity enforced via a database-level constraint/
lock (never an application-level check that can race), waitlisting when full,
`POST /api/training/[registration_id]/cancel`.
**Input → Output:** `{session_id, name, email, phone}` → `{status: confirmed|waitlisted}`.
**Acceptance criteria:** Two registrations for the literal last seat submitted within
milliseconds both resolve correctly (one confirmed, one waitlisted) under concurrent-request
testing, not just sequential testing; a waitlisted registrant's confirmation message states
waitlisted plainly, never implying a seat; `training_registered` fires only for actual
registration (confirmed or waitlisted), through the existing measurement stack.
**Size:** M **Dependencies:** T14.2, T5.3

### T14.4 — Cancellation → waitlist promotion (offer, not auto-confirm)

**Build:** On a confirmed registrant's cancellation, the next waitlisted registrant is
notified and offered the freed seat — requires their active acceptance, never auto-confirmed
(their availability may have changed since registering).
**Input → Output:** Cancellation → notification to next waitlisted registrant → their
accept/decline action → seat confirmed or offer passed to the next person in line.
**Acceptance criteria:** A waitlisted registrant who does not respond does not get
auto-confirmed after any timeout implemented — acceptance must be an explicit action.
**Size:** M **Dependencies:** T14.3

### T14.5 — Admin: session creation via Landing Pages + session-cancellation notice

**Build:** Session create/edit reusing the Landing Pages content area's create-from-template
flow (`content-management-admin.md`) — no new admin content type; an admin action to cancel
an entire session, notifying all registrants (confirmed and waitlisted).
**Input → Output:** Admin form submission → `training_session` row; cancel action → all
registrants notified.
**Acceptance criteria:** A firm partner creates a working training session page end to end
through the existing Landing Pages screen with zero new UI to learn.
**Size:** S **Dependencies:** T14.1, T7.5 (Landing Pages admin)
