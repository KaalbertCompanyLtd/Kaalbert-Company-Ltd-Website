# Feature: CRM Integration (P2-6)

**Phase 2 — gated.** Trigger: the firm operating a CRM it actually maintains (`scope.md`,
P2-6). Integrating with a system the firm has not committed to running would automate
neglect rather than solve it. Not built until then.

## Goal

Let partners work from their CRM without checking the site's own enquiry log separately,
once the firm actually has one it maintains (`scope.md`; `user-stories.md`, Story 21).

## User flow

1. A new enquiry or completed diagnostic is created on the site (`enquiry-management.md`).
2. The record syncs to the firm's CRM automatically, with no manual re-entry by a partner.
3. A partner reviewing leads works primarily from the CRM; the site's own
   `enquiry-management.md` view remains available as the source of truth and for anything
   CRM sync hasn't yet reflected.

## Business rules

- Sync is one-way (site to CRM) at minimum — the site's `enquiry_record` remains the system
  of record; the CRM is a downstream copy for partner workflow convenience (FR-14.1).
- Duplicate detection (the same visitor reaching the firm through more than one route) is
  resolved before a record is synced, not left for a partner to catch manually in the CRM
  (FR-14.2).
- No specific CRM product is chosen here — the sync uses a webhook/API push pattern generic
  enough to target whichever CRM the firm adopts, since virtually every modern CRM (HubSpot,
  Zoho, Pipedrive, etc.) accepts inbound leads this way (`docs/research/phase-2-
integrations.md`).
- The field-mapping code (which site field maps to which CRM field) is written once the
  target CRM is known — this is a build-time task at the point the trigger is met, not a
  decision this spec makes speculatively.

## Data requirements

- `crm_sync_log` — id, enquiry_record_id, sync_status (pending/synced/failed), synced_at,
  crm_reference (the record's ID in the target CRM once synced).
- No new fields required on `enquiry_record` itself — sync reads from the existing shape
  established in `business-health-check-diagnostic.md` and `contact-and-enquiry.md`.

## Interfaces

- An outbound webhook/API call, triggered on `enquiry_record` creation or update, target URL
  and auth configured once the CRM is known.
- `GET /admin/crm-sync-status` — a simple admin view showing sync health (last successful
  sync, any failed records), so a partner can tell sync is working without needing to check
  the CRM directly.

## Edge cases

- The CRM's API is unavailable at the moment of sync: the record is queued and retried, not
  dropped — `enquiry-management.md`'s own record remains authoritative in the meantime.
- The CRM rejects a record (a validation error on their side, e.g. a malformed field): logged
  with the rejection reason in `crm_sync_log`, surfaced in the admin sync-status view, not
  silently lost.
- Two enquiries determined to be duplicates of the same visitor: only one syncs to the CRM as
  a new lead; the other is linked to the same CRM record rather than creating a second one.
