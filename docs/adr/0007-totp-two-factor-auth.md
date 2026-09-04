# ADR 0007: TOTP for Administrative Two-Factor Authentication

Status: Accepted

Context: Document 13.03, Section 10 (Security), explicitly requires "administrative access
behind two-factor authentication" — a hard requirement (NFR-3, tested as AC-4), not a design
choice. Two methods were weighed: TOTP (authenticator app) and email-delivered one-time
codes, the latter raised directly during planning as "is it going to be by mail."

Decision: TOTP, using a well-vetted library (e.g. `otplib`) for the RFC 6238 cryptographic
core, with the setup screen, login sequence, backup codes, and enforcement logic hand-built.

Consequences: Login does not depend on email deliverability at the moment of access — no
wait for a code to arrive, no risk of a delayed or spam-filtered email locking a partner out.
TOTP is a genuine second factor, not one that collapses into "the same device answering
itself" if a device is compromised, the way email codes checked on the same device can. The
accepted cost is a one-time authenticator-app setup per partner, smaller than the recurring
per-login friction email codes would add. Backup codes are generated at setup so a lost
device doesn't cause permanent lockout. See `docs/research/auth-strategy.md`.
