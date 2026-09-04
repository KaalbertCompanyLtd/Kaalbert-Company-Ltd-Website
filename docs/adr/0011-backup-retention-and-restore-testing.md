# ADR 0011: Backup Retention and Restore-Test Policy

Status: Accepted

Context: NFR-8 requires "automated daily backups with a periodically tested restore
procedure," and `architecture.md`/`scope.md` both cite this requirement by ID without stating
concrete numbers — no document names an actual retention window, backup cadence, or
restore-test schedule. This ADR closes that gap with real, verified figures rather than
assumed ones, matching the standard already set for every other infrastructure decision in
this project (`research/hosting-and-infrastructure.md`).

Decision: Railway's native Point-in-Time Recovery for its bundled PostgreSQL (ADR 0003) is
used as-is, with no third-party backup service added. Verified against Railway's own current
documentation (September 2026): backups run automatically via pgBackRest — a full backup
every week and an incremental backup every day — giving point-in-time recovery to any moment
within roughly the last four weeks (the last four full backups are retained). Restoring is a
staged operation in the Railway dashboard: the target backup is selected by timestamp, Railway
mounts a new volume from that point without touching the live one, and the change is reviewed
before being deployed — so a restore attempt cannot silently overwrite live data before it is
confirmed.

**Restore-test cadence**: a real restore is performed and verified — not merely confirmed to
exist in the dashboard — once per quarter, and the result (date, target timestamp restored
to, pass/fail) is logged in the same handover-style record the firm already uses for other
recurring confirmations (`06.09 Information Request List.docx`'s pattern of a dated, owned
record, applied here). The first test is scheduled for the month after launch, not deferred
to whenever it's next convenient.

Consequences: A four-week retention window means data-loss exposure is bounded at roughly one
month in the worst case, not indefinite — acceptable given the project's real traffic and
change volume (`architecture.md`, Section 6), and consistent with what the GHS 150/month
provision already pays for without adding a second backup vendor or cost. No new account is
added to the Account Ownership Register — this capability is native to the Railway account
already held. If retention needs ever exceed four weeks (e.g. once client-scoped data exists
under the Phase 2 Client Portal, P2-3), a dedicated backup service with configurable retention
(such as the community `railway-postgres-backups` S3-based tooling) becomes the next decision
to evaluate — not assumed now, since Phase 1's data does not need it.

## Sources consulted

- [Point-in-Time Recovery — Railway Docs](https://docs.railway.com/volumes/point-in-time-recovery)
- [Automated PostgreSQL Backups — Railway Blog](https://blog.railway.com/p/automated-postgresql-backups)
- [Back Up and Restore Postgres — Railway Guides](https://docs.railway.com/guides/postgres-backups-restores)
