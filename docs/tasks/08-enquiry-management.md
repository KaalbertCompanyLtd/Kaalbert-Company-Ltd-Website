# Epic: Enquiry Management

Roadmap milestone 8. The consuming counterpart to every write-side task built earlier
(T2.6's contact form, T3.5's diagnostic submit) — those have been writing real
`enquiry_record` rows since Milestones 2–3; this epic is where a partner first sees them.
T8.2's list screen has no dedicated mockup — `ui/screen-inventory.md` documents it as
"Can be inferred" from screen #26 (`AdminDataTable`, the same list-with-filters/sort pattern
`app/admin/(shell)/articles/page.tsx` already establishes), with the `TriageBadge` variant.
T8.3's detail screen has its own dedicated mockup, `ui/mockups/h-admin-enquiries/
admin-enquiry-detail.html` — screen-inventory.md's own reasoning: "dense, unique layout" with
no equivalent pattern elsewhere in the admin. (Corrected session 55, T7.11: this paragraph
previously named a wrong directory, `g-admin-content`, and implied a dedicated list mockup
that was never built or planned — see `memory/decision-log.md`.)

---

### T8.1 — Enquiry schema extension

**Build:** Extend the existing `enquiry_record` (already live since T3.5) with `status`,
`assigned_partner_id`, `internal_notes`, `status_updated_at`.
**Input → Output:** Schema migration → existing enquiry rows backfilled with `status: new`.
**Acceptance criteria:** Every `enquiry_record` written since Milestone 2/3 (contact form and
diagnostic) is queryable through the extended schema with no data loss.
**Size:** S **Dependencies:** T3.1, T2.6

**Addendum (session 44, 2026-09-11):** While building T7.1 (Admin dashboard), the dashboard's
"New enquiries" stat and the recent-enquiries panel's Status badge both had to work around
`status` not existing yet — every row was shown/counted as unconditionally "new," which is
honest today (no status-transition capability exists yet to make a row anything else) but
must switch to a real `status = 'new'` filter/read once this task ships the column. See
`memory/technical-debt.md` → "Admin dashboard's New Enquiries stat and Status badge assume
every enquiry is 'new' because `enquiry_record` has no `status` column yet" — update
`lib/admin-dashboard.ts`'s `getAdminDashboardStats`/`getRecentEnquiries` (and their tests) in
this task, not just add the column.

Separately, also add a `triagePriorityLevel` (`String?`) column here while this task is
already extending this same table's schema: `lib/diagnostic-scoring.ts`'s
`resolveTriageBand` already computes an `overallPriorityLevel` ("High"/"Medium"/"Low", from
`diagnostic_threshold.triagePriorityLevel`) per submission, but `lib/diagnostic-submit.ts`
only ever persists the boolean `triageFlag` — the priority word itself is discarded after
being embedded in `indicativeCostStatement`'s prose, with no structured field to read it back
from later. `ui/mockups/g-admin-content/admin-dashboard.html`'s Triage column shows a
High/Medium/Low badge (`badge-triage-high/medium/low` in `ui/mockups/_shared.css`), but T7.1
could only render a plain Flagged/Not-flagged boolean since no structured field exists — see
`memory/technical-debt.md` → "Enquiry-level triage priority (High/Medium/Low) is computed at
diagnostic-scoring time but never persisted, so no admin screen can show it." When adding the
column here, also update `lib/diagnostic-submit.ts` to persist it (mirroring how
`triageFlag: result.overallTriageFlag` is already set) and revisit T7.1's dashboard Triage
badge to use the real value instead of the boolean approximation.

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

**Status: unblocked (session 59, 2026-09-12).** `enquiry-management.md` flagged the retention/
deletion boundary as a firm decision the build must not assume: what happens when a deletion
request arrives for an enquiry already marked "converted" (a paying client), where deleting
identifying data may conflict with legitimate engagement record-keeping. **The firm's answer:
delete identifying data regardless of status** — a converted enquiry is treated exactly like
any other; no special case, no separate minimal-record retention. See
`memory/decision-log.md` for the full record of this decision.
**Build:** An endpoint deleting contact details/identifying information from an
`enquiry_record` while retaining non-personal aggregate data (e.g. that a diagnostic was
completed, for KPI counting), per FR-6.4 — applied uniformly regardless of `status`.
**Input → Output:** Enquiry ID → identifying fields nulled, non-personal fields retained.
**Acceptance criteria:** A deleted enquiry no longer displays name/email/phone anywhere in the
admin, but still counts toward aggregate KPIs (e.g. "diagnostics this month" on the dashboard,
T7.1) exactly as before deletion. A converted enquiry is deleted exactly the same way as any
other status — no additional confirmation step or refusal path tied specifically to
`status: converted`.
**Size:** S **Dependencies:** T8.1 (the `status`/`enquiry_record` schema this operates on)
