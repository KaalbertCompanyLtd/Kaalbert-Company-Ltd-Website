# Research: Auth Strategy

## The decision to be made

Authentication for (a) administrative/CMS access now, in Phase 1, and (b) the Phase 2 client
portal (`scope.md`, P2-3), planned now per this project's standing rule that gated future
phases get real depth alongside Phase 1, not a stub.

Two-factor authentication on administrative access is a hard requirement, not a design
choice — Document 13.03, Section 10 (Security row) states it explicitly: "administrative
access behind two-factor authentication." It is already NFR-3 in `requirements.md` and AC-4
in `AC/2026-09`, tested directly at handover.

## (a) Administrative / CMS Authentication — Phase 1

### Options evaluated

**A.** A hand-built login and 2FA flow: TOTP (authenticator-app) verification using a
well-vetted library for the cryptographic core, with every screen and the enforcement logic
built by hand.

**B.** Email-delivered one-time codes instead of TOTP.

**C.** A third-party auth-as-a-service product fronting the admin area.

### Criteria

Satisfies the hard 2FA requirement above; login reliability (must not depend on an external
delivery channel that can be delayed or filtered); real second-factor security, not a
channel the same compromised device already has open; setup friction for five non-technical
partner accounts; consistency with "custom build everything."

### Recommendation

**Option A — TOTP**, decided directly (not left as a preliminary lean) after weighing it
against email codes:

- **TOTP is a genuine second factor.** It doesn't depend on whatever inbox is already open
  on the same device being used to log in, unlike email codes, which can collapse into "the
  same device answering itself" if that device is compromised or simply left unlocked.
- **TOTP doesn't depend on email deliverability at the moment of login.** An email OTP adds a
  wait-for-delivery step to every single login and can fail on a delayed send or a spam
  filter, at exactly the moment a partner needs access. TOTP works offline once set up —
  nothing has to arrive.
- **The friction trade-off favours TOTP too**, not just its security profile: a one-time
  five-minute authenticator-app setup per partner is smaller ongoing friction than waiting
  for an email on every login thereafter, and several partners are likely to already have an
  authenticator app or a password manager with TOTP support from other accounts.
- The TOTP standard (RFC 6238) — secret generation, time-based code computation, verification
  — is implemented using a well-vetted library (e.g. `otplib` in the Node/TypeScript
  ecosystem), never hand-rolled cryptography, consistent with the project's standing rule:
  packages as building blocks for solved primitives, hand-built code for everything around
  them.

**What is hand-built, precisely:**

- The "set up 2FA" screen — shows the QR code, confirms the first entered code before
  enabling it
- The login sequence — password check, then a TOTP-code prompt, then session creation only
  after both pass
- Backup codes, generated at setup, so a partner who loses their device isn't permanently
  locked out — a single-use recovery code, not a fallback to a weaker method
- Enforcement — which roles require 2FA, and blocking admin access until it's configured
- The database fields tracking whether a user has 2FA enabled and their encrypted secret

Option B (email codes) is not chosen, for the reasons above. Option C (a hosted auth
service) is not chosen for the same reasoning as elsewhere in this project: it is an
unneeded extra vendor account and would own part of the application's user/permission model,
for five known administrative users this system can handle directly.

## (b) Client Portal Authentication — Phase 2, gated on P2-3's trigger

### Options evaluated

**A.** The same hand-built auth system (including TOTP) extended with a `client` role,
scoped per engagement via custom access-control logic in application code — which engagement
a given client account may see.

**B.** A separate, dedicated identity/auth service issuing access to a portal that may or may
not live inside the main application.

### Criteria

Engagement-level access scoping — FR-11.1/FR-11.2 require a client to "never see another
engagement's documents," which needs per-engagement, not just per-role, access control; 2FA
support (FR-11.4, extending the same TOTP requirement to client accounts); audit logging
(FR-11.3); consistency with the single-application, single-database principle established
across this project; the elevated confidentiality bar Document 13.03 names this capability as
carrying ("the highest-risk item on the list").

### Recommendation

**Preliminary lean toward Option A** — extending the same hand-built auth system, including
TOTP, with per-engagement scoping — for consistency with the rest of the platform: one login
system, one 2FA policy, and one audit trail to secure for the life of the project, rather
than a second identity system with its own account in the Ownership Register.

This is stated as a preliminary lean, not a locked decision, because `scope.md` already
requires a documented confidentiality and security review as a precondition to building this
capability at all. That review, conducted when P2-3's trigger is actually met, should
re-confirm this choice against whatever the security landscape looks like at that time,
rather than lock in an approach years ahead of using it.

## What this decision constrains or enables

Keeping client-portal auth inside the same application and database (rather than a separate
identity service) means the audit-logging requirement (FR-11.3) and the encryption-at-rest
requirement (FR-11.5) are additions to infrastructure already decided in
`hosting-and-infrastructure.md`, not a second system to secure.
