# Architecture Decisions

## Custom-Built Application, No CMS Platform

**Status:** Active

Date: Phase 3 planning
Related ADR: 0001

Decision: The entire application — public site, diagnostic, admin/content-editing area — is
built from scratch. No CMS product owns the admin UI, data model, or routes. Libraries are
used as components inside hand-written code, never as the whole admin experience.
Reasoning: FR-8's non-technical-partner-editable requirement, NFR-1's performance budget,
FR-7.4's server-side Conversions API need — and an explicit, direct rejection of WordPress.
Trade-offs: Materially more build effort than a pre-built CMS/admin-kit. The team owns
security patching for every library directly (mitigated by a deliberately small dependency
list).

## Next.js + TypeScript as the Application Framework

**Status:** Active

Date: Phase 3 planning
Related ADR: 0002

Decision: TypeScript + Next.js (App Router), one codebase for the public site, diagnostic,
and admin area.
Reasoning: One language across the whole system (NFR-7 maintainability); built-in SSR/SSG,
code-splitting, image optimisation serve the LCP/page-weight targets natively; React's
client-rendering model fits the diagnostic's no-full-reload requirement (FR-2.1).
Trade-offs: A hand-rolled Node/Express + plain React stack was rejected as reinventing
solved infrastructure for no real gain in customness.

## Railway for Application Hosting and Database

**Status:** Active

Date: Phase 3 planning
Related ADR: 0003

Decision: Railway hosts both the application and its own bundled, always-on PostgreSQL.
Reasoning: Fits the real GHS 150/month provision (Vercel's Pro floor alone exceeds it);
always-on Postgres avoids cold-start latency risk on the diagnostic specifically, a risk a
one-off Lighthouse acceptance test could mask while it still periodically hits real visitors.
Trade-offs: Neon's free scale-to-zero tier was seriously considered and rejected for that
cold-start risk.

## Cloudflare as CDN/Proxy Layer

**Status:** Active

Date: Phase 3 planning
Related ADR: 0004

Decision: DNS routed through Cloudflare (free tier) in front of Railway; Cloudflare R2 added
for object storage once media volume justifies it.
Reasoning: Closes Railway's one real gap — no built-in global CDN — directly serving the LCP
target for Ghanaian 3G/mid-range-Android visitors, at no additional cost.
Trade-offs: Introduces a genuine single point of failure (a Cloudflare outage makes the site
unreachable, since DNS itself routes through it) — accepted given Cloudflare's uptime record
and a documented manual DNS-fallback path.

## Diagnostic Engine as an In-App, Data-Driven Module

**Status:** Active

Date: Phase 3 planning
Related ADR: 0005

Decision: The diagnostic is a custom module inside the main Next.js app — data-driven schema
in the same Postgres database, API routes for step handling/scoring, client-rendered
step-by-step UI, no full page reloads.
Reasoning: Must hold questions/dimensions/weights/thresholds as data, not hard-coded logic
(FR-2.2); must integrate tightly with the enquiry record; must scale to Phase 2's paid suite
(P2-7) as a config change, not a rebuild.
Trade-offs: A third-party quiz plugin and a fully separate decoupled application were both
rejected — the former still needs the same custom integration work to reach the enquiry
record/measurement stack, the latter reintroduces a second system to host and secure.

## Google Tag Manager as the Single Measurement Container

**Status:** Active

Date: Phase 3 planning
Related ADR: 0006

Decision: GTM holds GA4, the Meta pixel, Google Ads, and the LinkedIn Insight Tag as tags,
fed by hand-written `dataLayer` pushes at the six conversion points; the server-side
Conversions API call is a custom integration, not a GTM template default.
Reasoning: Document 13.03, Section 11.1 explicitly forbids tags hard-coded into the theme.
Trade-offs: One more account on the Account Ownership Register — negligible cost against
never needing a code deploy to change which tags fire.

## TOTP for Administrative Two-Factor Authentication

**Status:** Active

Date: Phase 3 planning
Related ADR: 0007

Decision: TOTP (authenticator app), well-vetted library for the RFC 6238 core, hand-built
setup/login/backup-code/enforcement flow.
Reasoning: Document 13.03, Section 10 requires 2FA on admin access, tested as AC-4. TOTP
doesn't depend on email deliverability at login and is a genuine second factor, unlike
email-OTP checked on the same device.
Trade-offs: A one-time authenticator-app setup per partner, smaller than recurring
per-login email-code friction. Backup codes generated at setup prevent permanent lockout.

## Single Deploy Target — No Dual-Host Portability Design

**Status:** Active

Date: Phase 3 planning
Related ADR: 0008

Decision: Railway is the decided host, not one of two actively-supported targets. Ordinary
portable practices (env-var config, standard Prisma/Postgres, S3-compatible storage client)
are followed anyway at no cost; actively designing/testing/documenting dual-host switchability
is not.
Reasoning: Removes an ongoing "does this work on both hosts" design tax for optionality
unlikely to be exercised, given Vercel is already ruled out on cost (ADR 0003).
Trade-offs: None significant — once real client data exists, moving hosts stops being
low-stakes regardless of code portability, so little was actually being bought by designing
for it.

## Phase 2 Client-Portal Auth Extends the Existing System (Preliminary)

**Status:** Active

Date: Phase 3 planning
Related ADR: 0009

Decision: Preliminary lean toward extending the existing hand-built auth system (TOTP
included) with a `client` role and per-engagement scoping, rather than a separate identity
service.
Reasoning: Consistency — one login system, one 2FA policy, one audit trail across the whole
application.
Trade-offs: **Explicitly not locked.** `scope.md` requires a documented confidentiality and
security review, conducted when P2-3's trigger is actually met, that must re-confirm this
choice against the security landscape at that time — not accept a years-old default. If P2-3
build work begins, this ADR must be reaffirmed (status updated) or superseded per the
Rollback/Revision Protocol.

## Tailwind CSS v4 + shadcn/ui on Base UI + Lucide Icons

**Status:** Active

Date: Phase 3 planning
Related ADR: 0010

Decision: Tailwind v4, CSS-first (`@theme` directive, no config file). shadcn/ui generated on
Base UI (not Radix). Lucide (`lucide-react`) for icons.
Reasoning: Base UI became shadcn/ui's default primitive library (July 2026); shadcn/ui's CLI
copies component source directly into the codebase, so the team owns and can edit every
component file — consistent with ADR 0001. Base UI's unstyled behavioural primitives (focus
management, ARIA, keyboard nav) directly serve WCAG 2.1 AA (NFR-2) without hand-building
accessibility from scratch.
Trade-offs: None significant — confirmed via live research, not an assumption.

## Backup Retention and Restore-Test Policy

**Status:** Active

Date: Phase 6 planning (closed a documentation gap found during the pre-Phase-6 audit)
Related ADR: 0011

Decision: Railway's native Point-in-Time Recovery (pgBackRest — weekly full + daily
incremental, ~4-week restore window) used as-is, no third-party backup service. A real
restore is performed and verified quarterly, first test scheduled the month after launch.
Reasoning: NFR-8 requires "automated daily backups with a periodically tested restore
procedure" but no document had ever named concrete numbers — this ADR closes that gap with
verified figures rather than assumed ones.
Trade-offs: None — Railway's built-in mechanism already meets the requirement; the only real
addition is the discipline of actually running and logging the quarterly test, not just
trusting the dashboard's own confirmation.
