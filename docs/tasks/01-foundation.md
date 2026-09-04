# Epic: Foundation

Roadmap milestone 1. Nothing else builds until this exists. Kept as small as it can be —
just enough to render one real page — not a place to over-build infrastructure ahead of need.

---

### T1.1 — Repo, Next.js app, and deploy pipeline

**Build:** Next.js/TypeScript app (ADR 0002) in the repo root, deployed to Railway (ADR
0003), fronted by Cloudflare (ADR 0004). CI: type-check + lint on push.
**Input → Output:** Empty repo → a live URL on Railway serving the Next.js default page
through Cloudflare, with a working CI pipeline.
**Acceptance criteria:** `main` deploys automatically on push; the live URL resolves through
Cloudflare (not Railway's raw domain); `npm run typecheck` and `npm run lint` both run in CI
and fail the build on error.
**Size:** M **Dependencies:** none

**Addendum (session 01, 2026-09-04):** Everything else in this task is done and verified
(Next.js scaffold, CI, Railway deploy, GitHub-connected auto-deploy on push — all confirmed
working end to end). The Cloudflare acceptance criterion specifically is still open:
`kaalbert.com` is not registered (verified via WHOIS), so Cloudflare has no zone to front and
the live URL currently resolves through Railway's raw domain
(`https://kaalbert.up.railway.app`). See `memory/technical-debt.md` → "kaalbert.com not
registered." **Pick this up the moment the domain is registered** — add it to Cloudflare,
point DNS at the Railway service, add it as a custom domain via `railway domain
kaalbert.com`. Small enough to finish in the same sitting as whatever task is active when the
domain becomes available; does not need its own task ID.

### T1.2 — Postgres schema baseline + migration tooling

**Build:** Prisma schema (or equivalent) against Railway's bundled Postgres; migration
tooling wired into CI/deploy so `docs/features/*.md`'s entity lists become real tables
incrementally, epic by epic, rather than one big upfront schema.
**Input → Output:** Provisioned Postgres → a `schema.prisma` with a migration history, and a
documented `npm run migrate` / seed-script convention every later epic's tasks will follow.
**Acceptance criteria:** A migration applies cleanly on a fresh database; a seed script
convention exists and is documented in the repo README for later epics to extend.
**Size:** S **Dependencies:** T1.1

### T1.3 — Design tokens and Tailwind v4 setup

**Build:** Tailwind CSS v4 (CSS-first, no config file, per ADR 0010) with the design tokens
(colour, spacing, radius, type scale) extracted from the accepted mockups' shared CSS —
`ui/mockups/` is the source of truth for every value, not a fresh design pass.
**Input → Output:** Mockups' embedded CSS → a single tokens stylesheet imported app-wide,
producing pixel-equivalent output to the mockups for shared primitives (button, card radius,
colour palette).
**Acceptance criteria:** A test page rendering the shared primitives (buttons, cards, form
inputs) visually matches the corresponding elements in `ui/mockups/a-public-site/home.html`
side by side in a browser.
**Size:** M **Dependencies:** T1.1

### T1.4 — shadcn/ui + Base UI component scaffold

**Build:** shadcn/ui on Base UI, Lucide icons (ADR 0010) installed and configured against the
T1.3 tokens.
**Input → Output:** Design tokens → the shadcn/ui primitives (Button, Input, Dialog, Table,
etc.) themed to match, ready for feature epics to consume without re-theming per component.
**Acceptance criteria:** At least one instance of each primitive listed in `ui/components.md`
renders themed correctly on a scratch test page.
**Size:** S **Dependencies:** T1.3

**Addendum (session 01, 2026-09-04):** While touching `package.json`'s dependencies for
this task, also re-check whether `eslint@^10` can replace the currently-pinned `eslint@^9`
(EOL per npm) — run `npm info eslint-config-next peerDependencies` first; only bump if the
peer range cleanly includes ESLint 10 (it produced `ERESOLVE` warnings against
`eslint-config-next@16.3.4` at T1.1 time). See `memory/technical-debt.md` → "ESLint pinned
to the EOL 9.x line." Low priority — skip without blocking this task if the peer range still
doesn't support it; just don't forget to check.

### T1.5 — Shared layout shell: SiteHeader, SiteFooter, admin shell skeleton

**Build:** `SiteHeader` and `SiteFooter` (per `ui/components.md`, built to the mockups'
header/footer markup exactly, including the nav-dropdown fee hint reading `offer
.fee_amount_min`), plus an empty authenticated-shell layout for `/admin` (sidebar nav frame
only, no auth yet — that's Milestone 6).
**Input → Output:** `ui/mockups/a-public-site/*.html` header/footer markup + `ui/components.md`
→ two shared layout components used by every subsequent public page task, and one admin shell
layout used by every subsequent admin page task.
**Acceptance criteria:** SiteHeader/SiteFooter render identically (structure, spacing, nav
items) to the mockup on at least two different mockup pages; admin shell renders the sidebar
nav frame with placeholder content area.
**Size:** M **Dependencies:** T1.4

### T1.6 — Environment/secrets and GTM container stub

**Build:** Environment variable convention for secrets (DB URL, future gateway/API keys) via
Railway's env management; an empty GTM container (ADR 0006) loaded on every public page,
ready for Milestone 5 to populate with real tags.
**Input → Output:** Railway project → documented env-var convention in the README; GTM
snippet present in `<head>`/`<body>` of the root layout, container ID present but no tags
configured yet.
**Acceptance criteria:** GTM Preview mode confirms the container fires on page load with zero
tags active (no premature/placeholder events sent).
**Size:** S **Dependencies:** T1.1
