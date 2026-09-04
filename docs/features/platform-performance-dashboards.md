# Feature: Platform Performance Dashboards

**A bonus addition, outside Document 13.03's requested scope.** Not part of Phase 1 launch,
not an acceptance requirement in `AC/2026-09`, and must never block or compete with anything
already agreed. Built after Phase 1 launch, once the site is live and stable.

## Goal

Give partners one place inside kaalbert.com's own admin to check each ad/analytics
platform's key numbers, instead of logging into four separate external dashboards (GA4, Meta
Events Manager, Google Ads, LinkedIn Campaign Manager) every time the Partner Council reviews
performance (Document 13.03, Section 15's monthly review). This was not requested by the
firm — it is offered as a convenience beyond what was asked for.

## User flow

1. Partner navigates to `/admin/performance`, sees four cards, one per platform (GA4, Meta,
   Google Ads, LinkedIn), each showing its connection state and a headline number if
   connected.
2. Partner opens a specific platform's own dedicated screen (`/admin/performance/ga4`, etc.)
   for a deeper view of that platform's metrics.
3. If a platform has never been connected, the partner sees a clear "Connect [Platform]"
   action, which starts that platform's OAuth flow.
4. Data shown is refreshed on a schedule, not queried live on every visit.

## Business rules

- **Each platform integration is fully independent.** One platform being disconnected,
  unauthorized, or erroring must never affect any other platform's screen or any other part
  of the admin — this is the entire reason for four dedicated screens rather than one merged
  view, given LinkedIn's Marketing API access is the most likely of the four to be delayed or
  denied.
- **Three distinct states per screen, never collapsed into one:** not connected (needs
  authorization), connected but currently erroring (e.g. an expired token or a platform API
  change), and connected and healthy. A non-technical partner — or a future maintainer with
  no context — must be able to tell which one they're looking at.
- **Only aggregate metrics are pulled, never visitor-level or diagnostic data.** This mirrors
  Document 13.03, Section 9's rule in the other direction (diagnostic responses are never
  sent to advertising platforms) — these screens only pull the aggregate numbers each
  platform already computes and reports, not raw data about individual visitors.
- Data is cached and refreshed on a schedule (e.g. daily), not fetched live on every page
  load — respects each platform's API rate limits and keeps the admin responsive regardless
  of any one platform's API latency.
- Only authenticated partner accounts can view these screens — the same access restriction as
  `enquiry-management.md`.
- Built and enabled only after Phase 1 launch and acceptance are complete, so it never
  competes for build time or priority against anything in `AC/2026-09`.

## Data requirements

- `platform_connection` — id, platform (`ga4`/`meta`/`google_ads`/`linkedin`), status
  (connected/disconnected/error), access_token (encrypted), refresh_token (encrypted),
  connected_by (references `admin_user`), connected_at, last_synced_at, last_error
  (nullable).
- `platform_metric_snapshot` — id, platform_connection_id, metric_date, metric_name, value —
  a per-platform, per-day cache of pulled metrics, so screens render from cache rather than a
  live API call on every visit.

## Interfaces

- `/admin/performance` — overview, one card per platform.
- `/admin/performance/ga4`, `/admin/performance/meta`, `/admin/performance/google-ads`,
  `/admin/performance/linkedin` — four independent, dedicated screens.
- `POST /api/admin/performance/[platform]/connect` — initiates that platform's OAuth flow.
- `POST /api/admin/performance/[platform]/disconnect` — revokes and removes stored tokens.
- A scheduled sync job per platform (e.g. a daily triggered route), implemented
  independently per platform so one platform's sync failure cannot affect another's.

## Edge cases

- LinkedIn's API access is never approved: that screen permanently shows "not connected,
  pending approval" — never blocks anything else, never treated as a bug to fix.
- A platform's OAuth token expires or is revoked externally: the screen shows a clear "needs
  reconnecting" state, distinct from both "never connected" and "temporarily erroring."
- A platform changes its API in a breaking way: that platform's scheduled sync starts
  failing; its screen falls back to the last successfully cached data with a visible "may be
  out of date, last updated [date]" notice, rather than showing nothing or crashing the page.
- A non-admin attempts to reach these URLs directly: blocked by the same authentication as
  the rest of `/admin`.
- A platform's API rate limit is hit during a scheduled sync: that job backs off and retries
  on its next scheduled run, rather than retrying aggressively in a way that risks further
  throttling.
