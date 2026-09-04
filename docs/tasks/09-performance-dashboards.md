# Epic: Platform Performance Dashboards (Bonus)

Roadmap milestone 9. **Not requested by the firm, not an AC/2026-09 acceptance requirement.**
Built only after Phase 1 launch and acceptance are complete — this epic must never be pulled
forward ahead of any Milestone 1–8 task, and must never be reported as blocking launch.
Builds to its `ui/mockups/g-admin-content/` overview + four platform-detail mockups.

---

### T9.1 — Platform connection data model + OAuth scaffold

**Build:** `platform_connection`, `platform_metric_snapshot` tables; a shared OAuth-connect/
disconnect scaffold reused by all four platforms, but each platform's actual integration
built and failing independently of the others.
**Input → Output:** Schema + scaffold → ready for four independent platform integrations.
**Acceptance criteria:** The scaffold enforces the three-state model (not connected / erroring
/ healthy) generically, provable before any real platform is wired to it.
**Size:** M **Dependencies:** T6.1

### T9.2 — Overview — `/admin/performance`

**Build:** Four cards, one per platform, each showing connection state + headline number if
connected, to its mockup.
**Input → Output:** `platform_connection` rows → 4 status cards.
**Acceptance criteria:** One platform in an error state renders correctly without affecting
the other three cards' display (tested by seeding one connection as `error` and three as
`connected`).
**Size:** S **Dependencies:** T9.1

### T9.3 — GA4 integration

**Build:** OAuth connect flow, scheduled daily sync pulling only aggregate metrics (never
visitor-level or diagnostic data), `/admin/performance/ga4` detail screen, cache-backed
rendering.
**Input → Output:** GA4 OAuth grant → daily `platform_metric_snapshot` rows → rendered detail
screen.
**Acceptance criteria:** Screen renders from cache, not a live API call, verified by
disconnecting network and confirming the last-synced data still displays with its
last-updated timestamp; no visitor-level or diagnostic data appears anywhere on this screen.
**Size:** M **Dependencies:** T9.2, T5.3

### T9.4 — Meta integration

**Build:** Same pattern as T9.3, against Meta Events Manager's aggregate metrics.
**Input → Output/Acceptance criteria:** Same shape as T9.3, scoped to Meta.
**Size:** M **Dependencies:** T9.2, T5.5

### T9.5 — Google Ads integration

**Build:** Same pattern, against Google Ads.
**Input → Output/Acceptance criteria:** Same shape as T9.3, scoped to Google Ads.
**Size:** M **Dependencies:** T9.2, T5.5

### T9.6 — LinkedIn integration

**Build:** Same pattern, against LinkedIn Campaign Manager — explicitly the most likely to be
delayed or denied approval (documented risk).
**Input → Output:** LinkedIn OAuth grant (if approved) → synced metrics; if never approved,
permanent "not connected, pending approval" state.
**Acceptance criteria:** A permanently-unapproved LinkedIn connection renders its documented
fallback state indefinitely without ever being flagged as a bug, and without affecting any
other platform's screen (tested by simulating permanent OAuth denial).
**Size:** M **Dependencies:** T9.2, T5.5

### T9.7 — Independent failure isolation (cross-cutting verification)

**Build:** No new feature — a verification task confirming the independence rule
(`platform-performance-dashboards.md`'s central business rule) holds across all four real
integrations, not just the scaffold-level test in T9.2.
**Input → Output:** All four integrations live → a deliberate failure test per platform.
**Acceptance criteria:** Killing/erroring any one of the four platform integrations (token
revoked, API breaking change simulated) leaves the other three screens and the rest of
`/admin` fully functional, each verified independently.
**Size:** S **Dependencies:** T9.3, T9.4, T9.5, T9.6
