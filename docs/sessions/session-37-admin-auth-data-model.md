# Session 37 — Admin Auth Data Model

# Date: 2026-09-10

# Tasks completed: T06-01

## What Was Built

Milestone 6 (Admin Authentication) begins. Added the three tables
`docs/features/admin-authentication.md` names (`admin_user`, `admin_backup_code`,
`admin_session`), migrated against the real dev database, and established `lib/auth/`
(CLAUDE.md's Auth Pattern section) with password hashing (`bcryptjs`), TOTP-secret
encryption-at-rest (AES-256-GCM via Node's own `crypto` module), and TOTP secret generation
(`otplib`, ADR 0007's vetted RFC 6238 library). The task's literal acceptance criterion — no
plaintext password or raw TOTP secret ever written to logs — was verified with unit tests
covering every error path these two helper modules have, plus a real end-to-end round-trip
against the dev database (create/verify/decrypt/cascade-delete), since no login route exists
yet to test a literal failed login against.

## Files Changed

- `prisma/schema.prisma` — added `AdminUser`, `AdminBackupCode`, `AdminSession` models
- `prisma/migrations/20260910190643_t6_1_admin_auth_tables/` — new migration, applied
- `lib/auth/password.ts` + `.test.ts` — `bcryptjs` hash/verify, shared by
  `admin_user.password_hash` and `admin_backup_code.code_hash`
- `lib/auth/totp-encryption.ts` + `.test.ts` — AES-256-GCM encrypt/decrypt for
  `admin_user.totp_secret`, keyed by `ADMIN_TOTP_ENCRYPTION_KEY`
- `lib/auth/totp.ts` + `.test.ts` — `otplib`'s `generateSecret()` wrapper only; QR/URI
  generation and code verification are T6.2/T6.3's job
- `package.json` / `package-lock.json` — added `bcryptjs`, `otplib`
- `.env.example` — new `ADMIN_TOTP_ENCRYPTION_KEY` entry with generation instructions
- `CLAUDE.local.md` / `.env.local` (not tracked) — real dev-only key generated and recorded
- `memory/completed-work.md`, `memory/decision-log.md`, `memory/technical-debt.md` — this
  task's entry, the `bcryptjs`/AES-GCM decisions, and a new debt item
- `docs/tasks/07-content-admin.md` — addendum on T7.6 (Team/author profile editor) for
  wiring `Author.adminUserId` to the new `AdminUser` table

## Decisions Made

- **`bcryptjs` over native `bcrypt`/`argon2`** — avoids Railway's isolated build-container
  native-compile risk, a real failure mode already hit twice on this project for unrelated
  reasons. See `memory/decision-log.md`.
- **AES-256-GCM via Node's own `crypto` module, keyed by a new server-held env var, for
  TOTP-secret-at-rest encryption** — not a KMS/vault product, which isn't justified at this
  project's current scale (one shared admin system, five partners). Does not conflict with
  ADR 0007's "never hand-rolled crypto": the cipher itself is Node's own audited primitive,
  the module only manages the key and call shape. See `memory/decision-log.md`.
- **`Author.adminUserId` stays unwired this task** — it's a real, sequenceable gap (now that
  `AdminUser` exists) but belongs to T7.6's self-service editor, not this schema-only task.
  Logged as new technical debt, addended onto T7.6.

## Current State

`admin_user`/`admin_backup_code`/`admin_session` tables exist in the dev database and are
exercised end-to-end (real Prisma round-trip, not just migration success). `lib/auth/` is
established with the three helper modules T6.2/T6.3 will build directly on. No UI/route
exists yet — this was a schema-only task, so Playwright MCP verification and the mobile/
tablet/desktop UI check are not applicable (per the task's own note). `docs/user-guide.md`
was **not** updated this session — nothing firm-visible changed (no login screen exists
yet); this is a deliberate, explicit skip per the Task Completion Checklist's own instruction
to note it rather than silently omit it.

## Blockers

None.

## Next Task

T06-02 — 2FA setup flow — `/admin/setup-2fa`
File: docs/tasks/06-admin-auth.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/06-admin-auth.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. Note the epic's own header decision:
session policy is fixed at 30 minutes inactivity / 12-hour absolute lifetime (implemented at
T6.3, not this task).

# Task T6.2 — 2FA setup flow — `/admin/setup-2fa`

## What to build
QR code display, confirmation-code entry, one-time backup-codes display, to its mockup.

## Input → Output contract
New `admin_user` (no `totp_enabled`) → confirmed TOTP enrolment, `totp_enabled: true`,
backup codes generated and shown exactly once.

## Acceptance criteria
Backup codes are never retrievable again after this screen is left; scanning the QR code in
a real authenticator app and entering the generated code completes setup successfully.

## Size / Dependencies
M, depends on: T6.1 (provides the `admin_user`/`admin_backup_code` tables this task writes
to, plus `lib/auth/password.ts` for backup-code hashing, `lib/auth/totp-encryption.ts` for
encrypting the confirmed secret at rest, and `lib/auth/totp.ts`'s `generateTotpSecret()` for
the raw secret this flow generates — already shipped, no further action needed from it).

## Architecture constraints
- **Never hand-roll TOTP or password cryptography.** Use `otplib` (already installed at
  T6.1) for the RFC 6238 core — QR/`otpauth://` URI generation (`generateURI`) and code
  verification (`verify`) are this task's own job, built directly against `otplib`, not
  wrapped in a new abstraction ahead of need. Backup-code hashing reuses `lib/auth/
  password.ts`'s `hashPassword` (already used generically for both `admin_user.password_hash`
  and `admin_backup_code.code_hash` — see that file's doc-comment).
- **TOTP secrets are encrypted at rest.** The raw secret from `lib/auth/totp.ts`'s
  `generateTotpSecret()` must be run through `lib/auth/totp-encryption.ts`'s
  `encryptTotpSecret()` before it is ever written to `admin_user.totp_secret` — the raw
  value must exist only transiently (in memory during setup, and inside the QR code/URI
  shown to the partner), never logged, never stored anywhere unencrypted.
  `admin_user.totp_secret`/`totp_enabled` must only flip to their confirmed state
  (`totp_enabled: true`) after the partner successfully enters a real generated code back —
  not merely after the QR code is displayed (a row can legitimately have a `totpSecret` set
  with `totpEnabled` still `false` mid-setup, per `AdminUser`'s own schema doc-comment).
- **Backup codes are shown exactly once.** Generate the batch (8 codes, per the mockup),
  hash each with `lib/auth/password.ts`'s `hashPassword` before writing to
  `admin_backup_code.code_hash`, and return the plaintext codes to the client only in the
  response that completes setup — nothing after this screen (no admin page, no API route)
  may ever return them again, since only the hash is ever stored.
- **Business logic lives in `lib/`, never inline in a route handler or component.** Add the
  setup-flow logic (generate secret + URI, verify the confirmation code, generate/hash/store
  backup codes, flip `totpEnabled`) as new `lib/auth/` functions — the route handler(s) this
  task adds under `app/api/admin/` only validate input, call into `lib/auth/`, and shape the
  response.
- **No plaintext password or raw TOTP secret in logs.** Same standing rule T6.1 established
  and tested — audit this task's own new error-path logging (a failed Prisma write, a caught
  `otplib` error) the same way, not just the happy path.
- Accessibility: WCAG 2.1 AA (NFR-2) is a hard requirement — build the QR display, code
  input, and backup-codes/confirm-checkbox step using Base UI primitives (via shadcn/ui) for
  any interactive element, not a bare `<div>`/`<input>` with hand-rolled ARIA.
- **Responsive is built in from first implementation.** The mockup
  (`ui/mockups/f-admin-auth/admin-2fa-setup.html`) is a desktop-only wireframe — this screen
  must also work at mobile (~375–430px) and tablet (~768px) before the task is done, even
  though the mockup shows only one width.
- **Never let a `"use client"` component import a value (not just a type) from a `lib/`
  file that also imports `@/lib/prisma`.** This task's confirmation-code-entry step is
  necessarily a client component (interactive form state across two steps, per the mockup's
  own `showStep()` JS) — if it needs any option/lookup data from a `lib/auth/` module that
  also touches `@/lib/prisma`, split that data into its own prisma-free file rather than
  importing the DB-touching module directly (T3.4's own real incident — see
  `memory/known-bugs.md`).
- **Any page/route that reads live database content must export `export const dynamic =
  "force-dynamic"`.** Applies to `/admin/setup-2fa` itself once it reads the current
  `admin_user` row server-side.
- This is the epic's second task — it does **not** implement login or session issuance
  (T6.3's job). This flow must be reachable in a way that doesn't depend on a working login
  session existing yet (e.g. a direct link/token for a newly created account, or however this
  task's own design resolves "which `admin_user` is being set up") — resolve this explicitly
  as part of the task rather than assuming a session mechanism T6.3 hasn't built yet.

## Relevant ADRs
- ADR 0007 — `docs/adr/0007-totp-two-factor-auth.md` — TOTP (not email-delivered codes) is
  the required admin two-factor method, using `otplib` for the RFC 6238 cryptographic core;
  the setup screen itself (this task), login sequence, backup codes, and enforcement logic
  are all hand-built. Backup codes exist specifically so a lost authenticator device doesn't
  cause permanent lockout.
- ADR 0010 — `docs/adr/0010-styling-and-component-stack.md` — Tailwind CSS v4 (CSS-first,
  `@theme`, no `tailwind.config.js`) + shadcn/ui generated on Base UI (not Radix) + Lucide
  icons. Build this screen's form/checkbox/button elements as shadcn/ui-derived components on
  Base UI primitives, styled with existing `ui/design-system.md` tokens — never a new ad hoc
  color/radius/font.

## Relevant feature specification
`docs/features/admin-authentication.md` — this task builds its "Setup (once per partner)"
user flow step and its `/admin/setup-2fa` interface entry (QR code display, confirmation
code entry, backup codes shown once) in full; also read its Business rules (TOTP required
before any content action, backup codes single-use) and Edge cases (lost device + lost
backup codes → another administrator must reset enrolment — no self-service bypass anywhere,
including on this screen) sections, since this task's UI must not create any path around
those rules.

## Mockup / UI reference
`ui/mockups/f-admin-auth/admin-2fa-setup.html` — two-step card: Step 1 (QR code placeholder,
"enter the setup key manually" fallback link, 6-digit confirmation code input, "Confirm and
continue"), Step 2 (8 backup codes in a fixed grid, a required "I've saved these backup codes
somewhere secure" checkbox, "Finish setup" button). Note the mockup's Step 2 "Finish setup"
link target (`../g-admin-content/admin-dashboard.html`) is illustrative only — this task
does not build the admin dashboard; route "Finish setup" to wherever this task's own design
lands post-setup (e.g. back to login, since T6.3's session issuance isn't built yet).

## Coding standards
- Mockups are authoritative. (Applies — build `/admin/setup-2fa` to the exact two-step
  structure and copy of `ui/mockups/f-admin-auth/admin-2fa-setup.html`.)
- Responsive built in from first implementation. (Applies — see Architecture constraints
  above.)
- Public-site mobile navigation is a side-sliding drawer/sheet. (Not applicable — this is an
  admin auth screen, not public-site navigation.)
- Feature docs are the data/interface contract. (Applies — `admin-authentication.md`'s
  Interfaces section names this screen and its behavior directly.)
- Business logic lives in `lib/`, never inline. (Applies — see Architecture constraints
  above.)
- Every entity field maps to the feature doc. (Not applicable — no new entity fields this
  task; T6.1 already modeled every field this flow writes to.)
- Fee amounts as structured min/max + scope cap. (Not applicable.)
- Content the firm can change lives in the database. (Not applicable — this screen's copy is
  fixed UI chrome, not firm-editable content.)
- Diagnostic scoring config as data, not logic. (Not applicable.)
- Accessibility WCAG 2.1 AA via Base UI primitives. (Applies — see Architecture constraints
  above.)
- `export const dynamic = "force-dynamic"` on any route reading live DB content. (Applies —
  see Architecture constraints above.)
- Never let a `"use client"` component value-import from a `lib/` file that also imports
  `@/lib/prisma`. (Applies — see Architecture constraints above; this is this rule's first
  real test since it was written at T3.4.)
- Never let a `package.json` lifecycle script assume `.git` exists. (Not applicable — no
  lifecycle script change this task.)
- The shared generic `page` entity pattern. (Not applicable — this is an auth screen, not a
  marketing page.)
- Every public page type carries meta_title/meta_description + OG/Twitter + JSON-LD. (Not
  applicable — `/admin/setup-2fa` is not a public/indexable page.)
- Every conversion moment fires through the existing GTM `dataLayer` pattern. (Not
  applicable — no conversion event defined for admin 2FA setup.)

## Task Completion Checklist
[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
    files (npm run lint && npm run format:check) — this is a hard gate; a pre-push hook / CI
    runs it, so a skipped lint fails the push. Fix pre-existing lint failures too, so the
    branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
    screen), it was exercised for real using Playwright MCP — not confirmed only by static
    analysis or mocked tests. If the tool isn't usable this session, say so explicitly
    rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
    (~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
    fix has Trigger type and Sequenced into filled in — never left blank
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
    in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
    what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if this
    task changed nothing firm-visible, note that explicitly rather than skipping silently
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
    the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation")
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task T6.3 in its
"Paste This to Continue" block, then stop. Do not begin the next task in this same session.
```
