# ADR 0012: Brevo Campaigns for Subscriber Outreach (Phase 2), Not a Custom Bulk-Email Admin Tool

Status: Accepted (preliminary — see below)

Context: T4.5 (Insights subscription capture, Milestone 4) built a real `subscriber` table
and a working one-click unsubscribe, but no plan anywhere — not Document 13.03, not any
feature doc — described the firm actually emailing that list. Raised directly by the user
during T4.5's own session and scoped into Phase 2 as P2-8 (`scope.md`,
`docs/features/subscriber-outreach.md`). Two approaches were weighed for the eventual send
mechanism: build campaign composition, scheduling, sending, and open/click tracking inside
kaalbert.com's own hand-built admin (consistent with ADR 0001's general preference for
owned code); or sync subscribers into the firm's existing Brevo account (already integrated
for transactional email, T3.7) and let a partner compose and send the actual campaign
natively inside Brevo's own dashboard, a separate product not embedded into kaalbert.com at
all.

Decision: Sync only. The site keeps `subscriber` as the sole system of record for consent
and pushes a one-way sync to a dedicated Brevo contact list on every subscribe/re-confirm/
unsubscribe, with one inbound webhook path back for an unsubscribe/bounce/complaint that
happens on Brevo's own side. Composing, scheduling, and sending the actual campaign — and
reading its own open/click/unsubscribe performance — happens entirely inside Brevo's own
dashboard, by a partner, never rebuilt inside kaalbert.com's admin.

This is not a departure from ADR 0001's "no product owns the admin UI, the data model, or
the routes" rule — it is the same exception ADR 0001 itself already carves out for
infrastructure (hosting, DB, CDN, object storage): "using a managed platform to run custom
code is not the same as depending on a pre-built product to define what that code does."
Brevo's campaign dashboard never touches kaalbert.com's own `/admin`, never owns the
`subscriber` data model (the site does, and pushes to Brevo, not the reverse for consent),
and defines no route on this site. It is a separate tool a partner opens separately, doing
one well-scoped job — bulk email composition, delivery, and compliance handling — that this
firm's own publishing cadence (two articles a month, Document 13.03 Section 7) does not
justify reproducing from scratch, the same reasoning ADR 0006 already applied to choosing
GTM as the single measurement container over hand-rolling tag management.

Consequences: The firm gains a working outreach channel without this project taking on
bulk-email deliverability, sender-reputation management, or campaign-editor UI as build
scope — work with real ongoing cost (spam-filter behaviour changes, list-hygiene
requirements, compliance updates) that a mature product already carries. The cost is a
second integration surface with the same third-party account (Contacts API + one webhook,
both already a natural extension of the existing `@getbrevo/brevo` SDK dependency from
T3.7) and a real, if small, sync-timing gap between a site-side unsubscribe and its
reflection in Brevo (mitigated, not eliminated, by syncing on every write rather than
batching — see `subscriber-outreach.md`'s own edge cases). This status is explicitly
preliminary: this decision is made now, years ahead of P2-8's trigger being met, specifically
so the plan exists before it's needed (`scope.md`'s own stated purpose for all of Phase 2)
— but Brevo's own product offering, pricing, or the firm's provider relationship could
reasonably change by the time this trigger is actually met. If build work on P2-8 ever
begins, this ADR must be revisited and either reaffirmed against Brevo's (or a successor
provider's) actual capabilities at that time, or superseded per the Rollback/Revision
Protocol in `CLAUDE.md`.
