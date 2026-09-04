# Epic: Client Portal (P2-3)

Roadmap milestone 12. **Gated — not scheduled.** Trigger: enough concurrent engagements to
justify it, and a documented confidentiality/retention position complete. Document 13.03's
"highest-risk item on the list" — a confidentiality and security review reconfirming ADR
0009's auth approach is a hard precondition on T12.1, not a formality.

---

### T12.1 — Confidentiality/security review + auth extension (precondition)

**Build:** The documented review reconfirming ADR 0009 (client portal auth extends the
existing system) covers the multi-user-per-engagement model specifically, since it widens
access beyond a single credential; `portal_user` role extending `admin_authentication.md`'s
pattern (password + mandatory TOTP, FR-11.4) to a `client` role.
**Input → Output:** Review sign-off → confirmed auth design; schema → `portal_user`,
`password_reset_token`.
**Acceptance criteria:** Review is documented and signed off before any other task in this
epic starts (hard gate, not advisory); TOTP is enforced on every client account with no
exception path.
**Size:** M **Dependencies:** none (this is the epic's own entry gate)

### T12.2 — Engagement creation (admin-side — the necessary first step)

**Build:** `engagement` entity + the admin screen (`ui/screen-inventory.md` #50a) where the
assigned partner creates the record: client reference, offer_id (seeding the deliverables
tracker from that offer's named `deliverables`), assigned_partner_ids, current_stage.
**Input → Output:** Partner-submitted form → `engagement` row + seeded `deliverable` rows.
**Acceptance criteria:** Without this screen nothing else in the epic has an engagement to
attach to — verified by confirming every other task's entity is FK-scoped to a real
`engagement.id` created here, never a standalone record.
**Size:** M **Dependencies:** T12.1

### T12.3 — Client login + engagement overview

**Build:** `/portal` authenticated area (overview screen): four-stage method status, assigned
partner(s), key dates — scoped so a client sees only their own engagement(s), never another
client's (FR-11.1), enforced server-side on every request, not assumed from UI routing.
**Input → Output:** Authenticated `portal_user` session → their engagement(s) overview only.
**Acceptance criteria:** Direct URL access to another client's engagement-scoped route is
rejected at the API layer, tested explicitly (not just relying on the UI never linking there).
**Size:** M **Dependencies:** T12.1, T12.2

### T12.4 — Information requests + document exchange

**Build:** `information_request` (structured: item_name/status/due_date, mirroring 06.09
Information Request List, never free text), `engagement_document` (encrypted at rest, FR-11.5)
with upload/download; admin screen (#50b) to create/edit requests.
**Input → Output:** Client upload against a request → `engagement_document` row, request
marked fulfilled; admin-created request → visible client-side checklist item.
**Acceptance criteria:** An upload that fails encryption-at-rest processing fails visibly,
never silently stored unencrypted (documented edge case); uploading against an
already-fulfilled request replaces the linked document rather than creating a second
ambiguous file (documented edge case).
**Size:** L **Dependencies:** T12.3

### T12.5 — Deliverables tracker

**Build:** Client-facing deliverables view reading the `deliverable` rows seeded in T12.2,
each pending/delivered, linked to the actual file once delivered.
**Input → Output:** `deliverable` rows → rendered tracker.
**Acceptance criteria:** Tracker exactly matches the offer's own `deliverables` field at
engagement creation, and updates live when the partner marks an item delivered.
**Size:** S **Dependencies:** T12.2, T12.4

### T12.6 — Engagement-scoped messaging

**Build:** `engagement_message` (sender_id, body, sent_at); `POST /api/portal/messages`;
partner-side reply within the admin.
**Input → Output:** Client or partner message → visible thread scoped to that one engagement
only — never a firm-wide or cross-engagement inbox (documented business rule).
**Acceptance criteria:** No UI or API path exposes a cross-engagement message view, tested
directly.
**Size:** M **Dependencies:** T12.3

### T12.7 — Account, team management, and access logging

**Build:** Self-service profile/password/notification-preference edits; `primary`-only
invite/remove of `member` users on the same engagement; `admin_user`-side portal-user
management (#50c); `document_access_log`, `account_change_log` on every access/download/
upload/message/account-change.
**Input → Output:** Team invite → new `portal_user` scoped to the engagement; every action →
a log row.
**Acceptance criteria:** A `member` attempting to invite/remove another user is rejected
(documented edge case); the `primary` removing themselves while `member`s remain triggers the
documented partner-notification-and-new-primary-required flow, so the engagement never ends
up with no one able to manage its team; removing a user revokes access immediately, not on
next login, while their prior activity remains in the log.
**Size:** L **Dependencies:** T12.3, T12.1
