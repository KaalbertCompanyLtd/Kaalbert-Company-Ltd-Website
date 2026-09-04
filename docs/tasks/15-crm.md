# Epic: CRM Integration (P2-6)

Roadmap milestone 15. **Gated — not scheduled.** Trigger: the firm operating a CRM it
actually maintains. Integrating with a system the firm hasn't committed to would automate
neglect, not solve it — this epic must not start on spec alone.

---

### T15.1 — Sync log data model + generic webhook/API push scaffold

**Build:** `crm_sync_log` (enquiry_record_id, sync_status, synced_at, crm_reference); a
webhook/API push scaffold generic enough to target whichever CRM the firm adopts (HubSpot,
Zoho, Pipedrive, etc. all accept inbound leads this way), with no product-specific code yet.
**Input → Output:** Schema + generic push scaffold → ready to receive field-mapping config
once the target CRM is known.
**Acceptance criteria:** The scaffold's retry/queue behaviour (below) is provable against a
mock endpoint before any real CRM is targeted.
**Size:** M **Dependencies:** T3.1 (enquiry_record)

### T15.2 — Field mapping to the target CRM (build-time task at trigger)

**Build:** The actual field-mapping code from `enquiry_record` to the specific CRM's lead
object — deliberately not written speculatively; this task's scope is only defined once the
firm's actual CRM choice is known.
**Input → Output:** Target CRM's lead schema → mapping config consumed by T15.1's scaffold.
**Acceptance criteria:** A real `enquiry_record` creation produces a correctly-populated lead
in the target CRM's own sandbox/test environment.
**Size:** M **Dependencies:** T15.1, **firm's CRM choice confirmed — required before this
task starts**

### T15.3 — One-way sync on enquiry creation/update, with dedup

**Build:** Sync triggered on `enquiry_record` creation/update; duplicate detection (same
visitor via more than one route) resolved before sync — only one syncs as a new lead, others
link to the same CRM record (FR-14.2).
**Input → Output:** New/updated `enquiry_record` → CRM lead created or linked; site's own
`enquiry_record` remains system of record (sync is one-way, site → CRM, FR-14.1).
**Acceptance criteria:** Two enquiries from the same visitor (matched by the dedup logic)
produce exactly one CRM lead, the second `crm_sync_log` row linked to it rather than creating
a duplicate lead.
**Size:** L **Dependencies:** T15.2

### T15.4 — Sync failure handling + admin sync-status view

**Build:** Queue-and-retry on CRM API unavailability (never dropped); rejection logging with
reason in `crm_sync_log`; `GET /admin/crm-sync-status` admin view.
**Input → Output:** A failed sync attempt → queued retry + logged reason, visible in the
admin view.
**Acceptance criteria:** A simulated CRM outage results in queued records that successfully
sync once the mock endpoint recovers, with zero record loss; a simulated CRM-side validation
rejection is visible in the sync-status view with its rejection reason, not silently dropped.
**Size:** M **Dependencies:** T15.3
