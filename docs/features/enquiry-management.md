# Feature: Enquiry Management

Phase 1. The per-enquiry visibility layer `measurement-and-attribution.md` referred to but
did not itself provide.

## Goal

Let a partner see and triage every incoming enquiry — from the diagnostic or the plain
contact form — with full context (responses, score, triage flag, attribution) in one place,
so the first call is informed rather than cold (Document 13.03, Section 6: "the partner
opening that enquiry already knows the business's shape").

## User flow

1. Partner logs into `/admin` (see `admin-authentication.md`) and opens Enquiries.
2. Sees a list of enquiries, triage-flagged ones surfaced first, with name, score summary (if
   from the diagnostic), source, date, and status at a glance. (Corrected at T8.2: this line
   previously also named a "business" column — no field anywhere in this schema, the contact
   form, or the diagnostic ever captures a business/company name, so there was never real data
   to show there. See `memory/decision-log.md`, session 57.)
3. Filters/sorts by status (new/contacted/closed/converted/not-a-fit), triage flag, date
   range, or source.
4. Opens an enquiry to see full detail: complete diagnostic responses and score breakdown (if
   applicable), contact details, which consent was given (contact vs. marketing, shown
   distinctly), and the attribution (campaign, source, landing page) it arrived with.
5. Updates the enquiry's status and adds internal notes (never visitor-facing).
6. Optionally assigns or reassigns the enquiry to a specific partner. Any signed-in partner
   can assign or reassign any enquiry to anyone — deliberately not restricted to Owners
   (session 61, decided explicitly, not an oversight): assignment doesn't gate _visibility_
   (every partner already sees every enquiry's full contents regardless of assignment), it
   only marks who's on point for follow-up, so it stays in the same "open to any partner"
   category as every other day-to-day content/operations action in this admin, not the
   account/security-control category `admin-authentication.md`'s Roles section locked down
   to Owners at session 60.

## Business rules

- Only authenticated partner accounts can view enquiry data (FR-6.3: "access to submitted
  data restricted to named partner accounts") — this is client-adjacent confidential business
  information under 07.08 Confidentiality and Data Protection Policy, not general site
  content.
- A visitor's submitted diagnostic responses are never editable here — only the firm's own
  status, notes, and assignment fields are.
- Contact consent and marketing consent are displayed as visibly distinct fields, never
  merged into one "consented" flag, so a partner cannot accidentally market to someone who
  only agreed to be contacted about their specific enquiry (enforces FR-6.2 at the point of
  use, not only at capture).
- Triage-flagged enquiries (FR-2.6) are visually distinguished and sorted first by default.
- Supports deletion of an individual's personal data on request (FR-6.4) — deleting contact
  details and identifying information from an enquiry record while the record's non-personal
  aggregate data (e.g. that a diagnostic was completed, for KPI counting) is retained. Applied
  uniformly regardless of `status` — the firm confirmed at T8.4 (session 59, 2026-09-12) that
  a converted enquiry (an active/former paying client) gets exactly the same treatment as any
  other, no special case. See `memory/decision-log.md` for the full record of this decision.
- An enquiry may originate from the diagnostic (full responses and score present) or the
  plain contact form (`contact-and-enquiry.md`, no diagnostic fields) — both render in the
  same list and detail view, with diagnostic-specific fields simply absent for the latter.
- **Real gap found and fixed at session 61**: `assigned_partner_id` (T8.1) was write-only for
  its first two sessions of existence — settable on the detail screen, but with no way for a
  partner to ever find "my assigned enquiries" again afterward (no list column, no filter, no
  dashboard surface). The list screen now has an "Assigned to" filter/column, and the
  dashboard's Quick Actions has a "My assigned enquiries" link straight into that filter.
- **Second real gap found and fixed the same session**: the "My enquiries" button rendered
  with `aria-pressed`/a solid active state — visually a toggle — but clicking it again while
  already active just re-navigated to the same URL, with no way back except rediscovering the
  "Assigned to" dropdown underneath it. It's now a genuine toggle: clicking it again reverts
  to "All partners."
- **Personal-data deletion (FR-6.4) has no request-intake mechanism at all, by design, and
  that's a real limitation to flag, not a bug**: nothing in this system tracks that a
  deletion request came in, who asked, when, or via what channel — `personal_data_deleted_at`
  only records the after-the-fact result. The person contacts the firm directly (phone,
  email — outside this app; there's no public "request my data be deleted" form), and a
  partner then has to find that person's specific enquiry to act on it. Session 61 added a
  name/email search field to the list specifically to make that lookup possible (previously
  the only way was paging through the list by eye) — but there is still no queue, no pending
  state, and no audit trail of the request itself, only of the deletion once it happens. If
  the firm ever wants a tracked request queue, that's a separate, larger feature (a new field/
  workflow), not something this session's fix attempted.

## Data requirements

Extends the `enquiry_record` entity already defined in
`business-health-check-diagnostic.md` (shared across both diagnostic- and contact-form-
originated enquiries) with: `status` (new/contacted/closed/converted/not-a-fit),
`assigned_partner_id` (nullable, references `admin_user`), `internal_notes` (text,
admin-only), `status_updated_at`. T8.4 (FR-6.4) adds `personal_data_deleted_at` (nullable
timestamp) — set the moment a partner deletes this enquiry's personal data, so the admin UI
can tell a genuine deletion apart from a `name`/`email`/`phone` that was simply never given
(both render as null otherwise).

## Interfaces

- `/admin/enquiries` — list screen with filters and sort, including an "Assigned to" filter
  (a specific partner, "Unassigned," or "All partners") and an "Assigned to" column
  (session 61 — see this section's own note below on why this was added after the fact), plus
  a case-insensitive name/email search field (session 61 follow-up — the concrete process gap
  it closes: finding the one enquiry a personal-data-deletion request refers to, previously
  only possible by paging through the list by eye).
- `/admin/enquiries/[id]` — detail screen.
- `PATCH /api/admin/enquiries/[id]` — update status, notes, or assignment.
- `DELETE /api/admin/enquiries/[id]/personal-data` — supports FR-6.4.

## Edge cases

- An enquiry from the plain Contact form: score/dimension fields render as not applicable,
  not blank or broken.
- Two partners edit the same enquiry simultaneously: last-write-wins, the same accepted
  simplification noted in `content-management-admin.md`.
- A deletion request arrives for an enquiry already marked "converted" (became a paying
  client): deleted exactly the same way as any other enquiry — the firm confirmed at T8.4
  (session 59) that no special retention exception applies here.
- The enquiry list must stay performant as records accumulate over years — paginated, not
  loaded in full on every visit.
