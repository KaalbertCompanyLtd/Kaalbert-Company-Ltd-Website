# ADR 0009: Phase 2 Client-Portal Auth Extends the Existing System (Preliminary)

Status: Accepted (preliminary — see below)

Context: The Phase 2 client portal (`scope.md`, P2-3) needs authenticated, per-engagement-
scoped access for clients, with 2FA and audit logging (FR-11). Document 13.03 names this
"the highest-risk item on the list." Two approaches were weighed: extending the existing
hand-built auth system with a `client` role and per-engagement scoping, or standing up a
separate identity/auth service.

Decision: Preliminary lean toward extending the existing auth system (including TOTP) with
per-engagement access-control logic, rather than a separate identity service — for
consistency with every other decision in this project: one login system, one 2FA policy, one
audit trail.

Consequences: This status is explicitly preliminary, not locked, because `scope.md` requires
a documented confidentiality and security review as a precondition to building this
capability at all — that review, conducted when P2-3's trigger is actually met, must
re-confirm this choice against the security landscape at that time, not accept a choice made
years in advance of using it. If build work on P2-3 ever begins, this ADR must be revisited
and either reaffirmed with Status updated to reflect the completed review, or superseded per
the Rollback/Revision Protocol in `CLAUDE.md`. See `docs/research/auth-strategy.md`.
