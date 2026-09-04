# Epic: Enquiry Management

Roadmap milestone 8. The consuming counterpart to every write-side task built earlier
(T2.6's contact form, T3.5's diagnostic submit) — those have been writing real
`enquiry_record` rows since Milestones 2–3; this epic is where a partner first sees them.
Builds to `ui/mockups/g-admin-content/` enquiries list/detail mockups.

---

### T8.1 — Enquiry schema extension

**Build:** Extend the existing `enquiry_record` (already live since T3.5) with `status`,
`assigned_partner_id`, `internal_notes`, `status_updated_at`.
**Input → Output:** Schema migration → existing enquiry rows backfilled with `status: new`.
**Acceptance criteria:** Every `enquiry_record` written since Milestone 2/3 (contact form and
diagnostic) is queryable through the extended schema with no data loss.
**Size:** S **Dependencies:** T3.1, T2.6

### T8.2 — Enquiries list — `/admin/enquiries`

**Build:** List screen to its mockup: triage-flagged rows surfaced first by default,
filter/sort by status/triage/date range/source, paginated (must stay performant as records
accumulate over years — not loaded in full).
**Input → Output:** `enquiry_record` table → paginated, filtered, sorted list.
**Acceptance criteria:** A triage-flagged enquiry appears above non-flagged ones with default
sort; a contact-form-originated enquiry renders correctly alongside a diagnostic-originated
one in the same list, diagnostic fields simply absent for the former; list remains responsive
against a seeded set of 500+ synthetic enquiries.
**Size:** M **Dependencies:** T8.1

### T8.3 — Enquiry detail — `/admin/enquiries/[id]`

**Build:** Detail screen: full diagnostic responses + score breakdown (if applicable),
contact details, contact consent and marketing consent shown as visibly distinct fields
(never merged), attribution (campaign/source/landing page from T5.4's `attribution` row),
status/notes/assignment editing.
**Input → Output:** Enquiry ID → full detail view; `PATCH /api/admin/enquiries/[id]` → updated
status/notes/assigned_partner_id.
**Acceptance criteria:** A visitor's own submitted responses are read-only on this screen —
only status/notes/assignment are editable; a contact-form enquiry shows score fields as "not
applicable," never blank or broken; the attribution block matches what T5.4 captured for that
session.
**Size:** M **Dependencies:** T8.2, T5.4

### T8.4 — Personal-data deletion — `DELETE /api/admin/enquiries/[id]/personal-data`

**Status: blocked on firm policy confirmation, not an engineering gap.**
`enquiry-management.md` explicitly flags the retention/deletion boundary — specifically,
what happens when a deletion request arrives for an enquiry already marked "converted" (a
paying client), where deleting identifying data may conflict with legitimate engagement
record-keeping — as a firm decision the build must not assume. This is carried into
`docs/dashboard.md`'s "Blocked On" list rather than resolved unilaterally here.
**Build (once unblocked):** An endpoint deleting contact details/identifying information from
an `enquiry_record` while retaining non-personal aggregate data (e.g. that a diagnostic was
completed, for KPI counting), per FR-6.4.
**Input → Output:** Enquiry ID → identifying fields nulled, non-personal fields retained.
**Acceptance criteria (once unblocked):** A deleted enquiry no longer displays name/email/
phone anywhere in the admin, but still counts toward aggregate KPIs (e.g. "diagnostics this
month" on the dashboard, T7.1) exactly as before deletion.
**Size:** S **Dependencies:** T8.1, **firm confirmation of the retention/deletion policy for
converted enquiries — required before work starts, not during**
