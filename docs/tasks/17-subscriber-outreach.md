# Epic: Subscriber Outreach via Brevo Campaigns (P2-8)

Roadmap milestone 17. **Gated — not scheduled.** Trigger: the Insights subscriber list
reaches a size where composing and sending a campaign by hand in Brevo's own dashboard is
worth a partner's time. Not from Document 13.03 — raised by the user during T4.5's own
build session once real subscriber consent existed with no distribution plan anywhere; see
`docs/features/subscriber-outreach.md` and ADR 0012 for the full account. This epic must not
start on spec alone, same discipline as every other gated Phase 2 epic.

---

### T17.1 — Brevo Contacts sync on every subscriber write

**Build:** A `syncSubscriberToBrevo` call added to each of `subscribeToInsights`,
`unsubscribeFromInsights` (`lib/insights-subscription.ts`, T4.5), and the two
`marketing_consent`-driven call sites (`lib/enquiries.ts`, `lib/diagnostic-request-summary.ts`)
— upserting the subscriber into a dedicated Brevo contact list via Brevo's Contacts API,
using the same `@getbrevo/brevo` SDK already integrated for transactional email (T3.7).
Likely adds `brevoContactId`/`brevoSyncedAt` fields to `Subscriber` to make the sync
idempotent (not decided further than that until this task actually starts, per
`crm-integration.md`'s own precedent for this kind of shape decision).
**Input → Output:** A `subscriber` row create/update → the matching Brevo contact
created/updated in the dedicated list, `brevoSyncedAt` recorded.
**Acceptance criteria:** A real subscribe, re-confirm, and unsubscribe on the site each
produce the matching state in Brevo's own contact list within one sync cycle; a subscriber
created via the Contact form or diagnostic summary-request's `marketing_consent` checkbox
syncs identically to one created via the dedicated Insights form — no second code path.
**Size:** M **Dependencies:** T4.5

### T17.2 — Brevo webhook: unsubscribe/bounce/complaint reconciliation

**Build:** `POST /api/brevo/webhook` receiving Brevo's own unsubscribe, hard-bounce, and
spam-complaint events for contacts in the dedicated list; verifies the request is genuinely
from Brevo (signature/secret check); sets the matching `subscriber.unsubscribedAt`.
**Input → Output:** A Brevo-side unsubscribe/bounce/complaint event → the matching
`subscriber.unsubscribedAt` set on the site, exactly as if the visitor had used the site's
own one-click link.
**Acceptance criteria:** Unsubscribing from inside a real Brevo-sent campaign email sets
`unsubscribedAt` on the corresponding `subscriber` row without any partner intervention; an
unverified/malformed webhook call is rejected, never trusted to mutate a subscriber's state.
**Size:** M **Dependencies:** T17.1

### T17.3 — Admin Subscribers list: sync status indicator

**Build:** Extends the existing admin Subscribers list (T7.9, `content-management-admin.md`)
with a per-row "last synced to Brevo" timestamp (or a clear "not yet synced" state) — a
status column, not a new screen, not a compose/send interface.
**Input → Output:** `subscriber.brevoSyncedAt` → visible per-row status in the existing list
view.
**Acceptance criteria:** A partner can tell, from the existing Subscribers screen alone,
whether the list they're about to email from Brevo's own dashboard reflects the site's
current state, without opening Brevo first to check.
**Size:** S **Dependencies:** T17.1, T7.9
