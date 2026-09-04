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
2. Sees a list of enquiries, triage-flagged ones surfaced first, with name, business, score
   summary (if from the diagnostic), source, date, and status at a glance.
3. Filters/sorts by status (new/contacted/closed/converted/not-a-fit), triage flag, date
   range, or source.
4. Opens an enquiry to see full detail: complete diagnostic responses and score breakdown (if
   applicable), contact details, which consent was given (contact vs. marketing, shown
   distinctly), and the attribution (campaign, source, landing page) it arrived with.
5. Updates the enquiry's status and adds internal notes (never visitor-facing).
6. Optionally assigns or reassigns the enquiry to a specific partner.

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
  aggregate data (e.g. that a diagnostic was completed, for KPI counting) may be retained;
  the exact retention/deletion boundary is a firm policy decision, not an engineering one —
  flagged here for the firm to confirm before this is built, not assumed.
- An enquiry may originate from the diagnostic (full responses and score present) or the
  plain contact form (`contact-and-enquiry.md`, no diagnostic fields) — both render in the
  same list and detail view, with diagnostic-specific fields simply absent for the latter.

## Data requirements

Extends the `enquiry_record` entity already defined in
`business-health-check-diagnostic.md` (shared across both diagnostic- and contact-form-
originated enquiries) with: `status` (new/contacted/closed/converted/not-a-fit),
`assigned_partner_id` (nullable, references `admin_user`), `internal_notes` (text,
admin-only), `status_updated_at`.

## Interfaces

- `/admin/enquiries` — list screen with filters and sort.
- `/admin/enquiries/[id]` — detail screen.
- `PATCH /api/admin/enquiries/[id]` — update status, notes, or assignment.
- `DELETE /api/admin/enquiries/[id]/personal-data` — supports FR-6.4, pending the firm's
  retention-policy confirmation above.

## Edge cases

- An enquiry from the plain Contact form: score/dimension fields render as not applicable,
  not blank or broken.
- Two partners edit the same enquiry simultaneously: last-write-wins, the same accepted
  simplification noted in `content-management-admin.md`.
- A deletion request arrives for an enquiry already marked "converted" (became a paying
  client): deleting identifying data may conflict with legitimate engagement record-keeping
  — this is the firm policy question flagged above, not resolved unilaterally here.
- The enquiry list must stay performant as records accumulate over years — paginated, not
  loaded in full on every visit.
