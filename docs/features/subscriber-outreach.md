# Feature: Subscriber Outreach via Brevo Campaigns (P2-8)

**Phase 2 — gated.** Trigger: the Insights subscriber list reaches a size where composing
and sending a campaign by hand in Brevo's own dashboard is worth a partner's time
(`scope.md`, P2-8). Not built until then.

**Not from Document 13.03.** Every other Phase 2 capability in this project traces to a
named item in Document 13.03, Section 14. This one doesn't — it surfaced during Phase 1
build itself, at T4.5 (Insights subscription capture, `insights-engine.md`), once a real
`subscriber` table existed holding real people's consent with no plan anywhere for actually
reaching them again. See `memory/decision-log.md` for the session this was raised and
scoped.

## Goal

Give the firm an actual way to reach the people who opted in to hear from it — closing the
gap between "the site collects real consent" and "the firm ever does anything with it" —
without building bulk-email composition, sending, and deliverability tooling from scratch
inside kaalbert.com's own hand-built admin.

## User flow

1. A visitor subscribes (or re-confirms, or unsubscribes) through the Insights subscribe
   form or its one-click unsubscribe link, exactly as T4.5 already built.
2. That change syncs, one-way, into a dedicated contact list inside the firm's existing
   Brevo account (the same account already sending transactional email since T3.7).
3. Whenever a partner wants to reach the list — most often shortly after publishing a new
   Insight — they open Brevo's own dashboard directly, compose the email there using Brevo's
   own campaign editor, and send it. No part of this step happens inside kaalbert.com.
4. If a recipient unsubscribes from inside that Brevo-sent email (via Brevo's own required
   unsubscribe link, distinct from the site's), Brevo notifies the site by webhook, and the
   site's own `subscriber.unsubscribed_at` is set — so the site's own record never falls out
   of step with reality on Brevo's side.
5. A partner checking the site's admin Subscribers list (`content-management-admin.md`,
   T7.9) can see, per subscriber, whether they're currently synced to Brevo — confirming the
   list is current before composing a send, without needing to open Brevo just to check.

## Business rules

- The site's own `subscriber` table is the sole system of record for consent — never Brevo's
  own contact/list state. A subscriber consented through the site's own dedicated,
  unticked-by-default opt-in (`insights-engine.md`'s FR-6.2 separation principle); that
  remains the authoritative fact regardless of what any synced copy elsewhere says.
- Sync is one-way outbound (site → Brevo) for subscribe/re-confirm/unsubscribe events, with
  exactly one inbound path back (Brevo's own unsubscribe/bounce/spam-complaint webhook) — the
  same "one-way at minimum, with the site remaining the record" shape `crm-integration.md`
  already establishes for a different downstream system, applied here.
- No campaign composition, scheduling, sending, or open/click tracking is built inside
  kaalbert.com's own admin. This is a deliberate build-vs-buy decision (ADR 0012), not an
  oversight — Brevo's own dashboard already does this well, and this firm's own publishing
  cadence (two articles a month, Document 13.03 Section 7) doesn't justify reproducing it.
- Subscribing does not fire a new measurement event (already established at T4.5); neither
  does anything in this capability — a Brevo campaign send/open/click/unsubscribe happens
  entirely outside any kaalbert.com page, so there is no `dataLayer` moment for GTM to
  observe. Brevo's own campaign statistics are where this performance data lives, not GA4.
- The two other places that collect Insights-marketing consent — the Contact form's and the
  diagnostic summary-request form's `marketing_consent` checkboxes (both wired into the same
  `subscriber` table at T4.5's own follow-up work) — sync to Brevo exactly the same way a
  direct Insights subscription does. There is no second contact list or second sync path for
  those.

## Data requirements

- No new fields on `subscriber` are strictly required — `email`, `consent`,
  `unsubscribe_token`, `subscribed_at`, `unsubscribed_at` (all from T4.5) are everything this
  sync needs to push and reconcile against Brevo.
- A `brevo_contact_id` and `brevo_synced_at` field on `subscriber` are the likely practical
  additions at build time, to make the sync idempotent and to power the admin's "last synced"
  indicator — not decided as final now, since this is exactly the kind of shape decision
  `crm-integration.md`'s own precedent leaves to the point the trigger is actually met.

## Interfaces

- An outbound sync, triggered on every `subscriber` create/update (the same three call sites
  T4.5 already has: `subscribeToInsights`, `unsubscribeFromInsights`, and the two
  `marketing_consent`-driven call sites in `lib/enquiries.ts` and
  `lib/diagnostic-request-summary.ts`), pushing to Brevo's Contacts API.
- An inbound webhook endpoint (e.g. `POST /api/brevo/webhook`) receiving Brevo's own
  unsubscribe/bounce/spam-complaint events for contacts in the dedicated list, updating the
  matching `subscriber.unsubscribed_at`.
- A small addition to the existing admin Subscribers list (T7.9) surfacing each row's sync
  status — a status view, not a new screen of its own (the "one nav entry, second screen via
  inline link" pattern doesn't even apply here; this is a column, not a screen).
- The actual campaign-composition/send interface is Brevo's own dashboard — explicitly not a
  kaalbert.com interface, and not specified further here for that reason.

## Edge cases

- Brevo's API is unavailable at the moment of sync: the affected `subscriber` write on the
  site itself already succeeded (this must never be undone by a sync failure) — the sync
  attempt is logged and should be retried, same "queue and retry, never drop, site stays
  authoritative in the meantime" shape as `crm-integration.md`'s own equivalent edge case.
- A recipient unsubscribes via Brevo's own in-email link rather than the site's: the webhook
  sets `subscriber.unsubscribed_at` the same as if they'd used the site's own link — from the
  subscriber's perspective, and the site's own records, there is only one kind of
  "unsubscribed," not two.
- A subscriber re-subscribes on the site after having unsubscribed via Brevo's own link: the
  existing T4.5 behaviour already clears `unsubscribed_at` and re-confirms; the sync then
  re-adds them to the Brevo list on its next push, same as any other re-confirmation.
- A partner composes a send in Brevo before a recent site-side unsubscribe has synced (a
  timing gap, not a logic error): this is a real, small risk inherent to any near-real-time
  one-way sync — mitigated by syncing on every write rather than batching, but not
  eliminated; not treated as a blocking edge case for this reason, since Brevo's own
  unsubscribe-link-in-every-email requirement is the actual, final backstop regardless of
  sync timing.
