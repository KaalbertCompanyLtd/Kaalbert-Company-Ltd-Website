# Feature: Client Portal (P2-3)

**Phase 2 — gated.** Trigger: enough concurrent engagements to justify it, and a documented
confidentiality and retention position (`scope.md`, P2-3). Document 13.03 names this "the
highest-risk item on the list." Not built until then, and not built at all until the
confidentiality/security review below is complete.

## Goal

Give an active client one secure place to conduct the whole ongoing relationship with the
firm during an engagement — not just document exchange, but seeing where the engagement
stands, what the firm still needs from them, what's been delivered, a way to communicate
without falling back to email, and ordinary account management — scoped strictly to that one
engagement at a time (`scope.md`; `user-stories.md`, Story 18).

## User flow

1. Client logs into the portal (password + TOTP, per `admin-authentication.md`'s pattern
   extended to a `client` role — see ADR 0009), or uses self-service "forgot password" if
   needed.
2. Client sees only their own active engagement(s), never another client's, landing on an
   **engagement overview**: current stage of the four-stage method (Discover, Diagnose,
   Design, Deliver), assigned partner(s), key dates.
3. **Information requests**: client sees a checklist of what the firm still needs from them,
   marks items fulfilled by uploading against each one directly.
4. **Document exchange**: client uploads or downloads documents freely, beyond specifically
   requested items.
5. **Deliverables**: client sees the named deliverables the relevant offer promised, each
   marked pending or delivered, linked to the actual file once delivered.
6. **Messaging**: client and assigned partner(s) exchange messages within the engagement.
7. **Account and team management**: the primary client contact can update their own profile
   (name, phone, notification preferences), change their password, and invite additional
   people from their own company (e.g. a finance lead) to the same engagement — the firm can
   also add or remove portal users directly.
8. Every access, upload, download, message, and account change is logged.

## Business rules

- A client sees only the engagement(s) they are scoped to — never a firm-wide file store, and
  never another client's overview, requests, deliverables, messages, or team (FR-11.1).
- Access to any of the above is restricted to the partner(s) assigned to that specific
  engagement (FR-11.2).
- Every document access, download, message, and account change is logged with actor,
  timestamp, and action (FR-11.3).
- Two-factor authentication is required on every client account, not only administrative
  ones (FR-11.4).
- Documents are encrypted at rest, in addition to the in-transit encryption required
  generally (FR-11.5).
- **Multiple named users per engagement are supported**, each with a role: `primary` (can
  invite/remove other users on the engagement, set at onboarding by the assigned partner) or
  `member` (full access to the engagement's requests/documents/deliverables/messages, cannot
  manage other users). This matches how Kaalbert's clients actually operate — a business
  with more than one person who needs visibility, not a single individual.
- Self-service password reset uses a time-limited, single-use emailed link; it never resets
  2FA enrolment — a client who has also lost their TOTP device must go through the same
  firm-mediated 2FA reset as an admin account (`admin-authentication.md`'s equivalent edge
  case), never a self-service 2FA bypass.
- Notification preferences control which events trigger an email (new message, new
  information request, deliverable updated) — opt-out of convenience notifications is
  allowed; the underlying portal data is never gated by notification preference, only the
  email nudges are.
- Removing a portal user (by the primary contact or the firm) revokes their access
  immediately, not on next login, and their prior activity remains in the access log.
- Information requests are structured (a named item, a status: outstanding/fulfilled, an
  optional due date), not a free-text list, mirroring how the firm already works from 06.09
  Information Request List.
- The deliverables tracker reflects the deliverables named on the specific offer the
  engagement was sold against (`core-offer-pages.md`), populated at engagement creation.
- Messaging is engagement-scoped only — no firm-wide or cross-engagement inbox.
- A documented retention and deletion policy for engagement documents and messages must exist
  before this is built — a precondition, not something inferred afterward (`scope.md`).
- **A confidentiality and security review, conducted at the point this trigger is actually
  met, must reconfirm the auth approach in ADR 0009 before any of the above is built** —
  including the multi-user-per-engagement model, since it widens who can access a given
  engagement's data beyond a single credential.

## Data requirements

- `engagement` — id, client reference, offer_id (references `offer`), assigned_partner_ids,
  current_stage (discover/diagnose/design/deliver), status, key_dates.
- `portal_user` — id, engagement_id, name, email, phone, password_hash, totp_secret
  (encrypted), role (primary/member), notification_preferences, invited_by (nullable,
  references another `portal_user`), created_at.
- `password_reset_token` — id, portal_user_id, token_hash, expires_at, used_at (nullable).
- `information_request` — id, engagement_id, item_name, status (outstanding/fulfilled),
  due_date (nullable), fulfilled_document_id (nullable, references `engagement_document`).
- `engagement_document` — id, engagement_id, uploaded_by (references `portal_user`), file
  reference (encrypted at rest), uploaded_at, linked_information_request_id (nullable),
  linked_deliverable_id (nullable).
- `deliverable` — id, engagement_id, name (seeded from the offer's `deliverables` field),
  status (pending/delivered), delivered_document_id (nullable).
- `engagement_message` — id, engagement_id, sender_id, body, sent_at.
- `document_access_log` — id, engagement_document_id, actor_id, action
  (view/download/upload), timestamp.
- `account_change_log` — id, portal_user_id, actor_id, change (profile_updated/
  password_changed/user_invited/user_removed), timestamp.

## Interfaces

- `/portal` — authenticated client area: overview, requests, documents, deliverables,
  messages, account settings, team.
- `POST /api/portal/documents/upload`, `GET /api/portal/documents/[id]/download` — scoped to
  the requesting user's engagement membership, checked on every request.
- `PATCH /api/portal/information-requests/[id]` — mark fulfilled, linking an uploaded
  document.
- `POST /api/portal/messages` — send a message within the engagement.
- `PATCH /api/portal/account` — update profile/notification preferences.
- `POST /api/portal/account/change-password`, `POST /api/portal/account/forgot-password` —
  standard self-service flows.
- `POST /api/portal/team/invite`, `DELETE /api/portal/team/[user_id]` — primary-contact-only,
  scoped to their own engagement.
- Admin-side (partner view, within `/admin`): the assigned partner **creates the `engagement`
  record itself** — client reference, the offer it was sold against (seeding the deliverables
  tracker from that offer's named deliverables), assigned partner(s) — at the point an
  engagement is accepted, before a client ever logs in; then create/edit information
  requests, view the deliverables tracker, respond to messages, advance the engagement's
  stage, manage portal users directly. Without this first step, nothing else on this list has
  an engagement to attach to.

## Edge cases

- A partner is reassigned off an engagement mid-way: their access is revoked immediately, not
  on next login, and the access log retains their prior activity.
- A client attempts to access any engagement-scoped URL directly without correct membership:
  rejected at the API layer regardless of what the UI would have prevented — access control
  is enforced server-side, never assumed from UI routing.
- An uploaded file fails encryption-at-rest processing: the upload fails visibly, never
  silently stored unencrypted.
- A client uploads a document against an information request already marked fulfilled: the
  new upload replaces the linked document and the request stays fulfilled, rather than
  creating an ambiguous second file with no clear status.
- The `primary` contact removes themselves from the engagement while `member` users remain:
  the assigned partner is notified and must designate a new primary before further team
  changes are allowed, so an engagement never ends up with no one able to manage its team.
- A `member` user attempts to invite or remove another user: rejected — only the `primary`
  role or the firm can manage team membership.
- An engagement ends (deliverable stage complete) while messages or documents are still
  present: access for all portal users on that engagement is retained read-only for the
  documented retention period, not revoked immediately at close, so a client isn't cut off
  from their own delivered work product the moment the engagement ends.
