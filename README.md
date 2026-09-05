# kaalbert.com

kaalbert.com is the qualification-and-authority website for Kaalbert & Company Ltd, a
Ghana-rooted business advisory firm. It is not a brochure site. It is built around two
conversion instruments — a public, scored Business Health Check diagnostic that a founder
can complete in under six minutes and get genuinely useful output from before ever speaking
to a partner, and an Insights publishing engine carrying the firm's own analytical writing —
surrounded by three deep, fee-transparent core offer pages, a capabilities overview, and a
full paid-advertising measurement layer so every enquiry the firm receives can be traced
back to the specific page, article, or advertisement that produced it.

## Quick Start

### Installation

```bash
npm install
cp .env.example .env.local    # fill in DATABASE_URL and the other values CLAUDE.local.md lists
npx prisma migrate dev
npm run db:seed
```

### Run locally

```bash
npm run dev
# → http://localhost:3000
```

### Run tests

```bash
npm run test         # unit/component tests (Vitest)
npm run test:e2e      # end-to-end flows (Playwright Test)
```

## Database & Migrations

Postgres schema baseline, established in T1.2 (`docs/tasks/01-foundation.md`). Entities are
added incrementally — each epic's tasks add the tables its own `docs/features/*.md` "Data
requirements" section calls for, not modeled upfront.

```bash
npm run migrate         # prisma migrate dev — create + apply a migration in development
npm run migrate:deploy  # prisma migrate deploy — apply pending migrations, no dev prompts
                         # (this is what Railway runs automatically before every deploy —
                         # see railway.json)
npm run db:seed         # prisma db seed — run prisma/seed.ts
```

**Convention every later epic's tasks follow when adding models or seed data:**

- Add the new model(s) to `prisma/schema.prisma`, field names matching the relevant
  `docs/features/*.md` "Data requirements" section exactly, then run `npm run migrate` and
  give the migration a descriptive `--name`.
- Add a `seed<Area>()` function to `prisma/seed.ts` (e.g. `seedOffers()`), called from
  `main()` in dependency order. Every seed write is an idempotent `upsert` keyed on a
  stable natural key — never a bare `create` — so re-running the seed script against a
  database that already has data never throws or duplicates rows.
- Firm-supplied content that doesn't exist yet at seed-authoring time is seeded as
  placeholder text with the entity's `is_placeholder` field set `true` (see
  `docs/tasks/02-public-presentation.md` T2.9) — never fabricated as if it were final copy.
- `npx prisma generate` regenerates the client into `generated/prisma/` (gitignored) — run
  it any time the schema changes; it also runs automatically via `postinstall`.

Local development connects to Railway's Postgres over its public TCP proxy (`DATABASE_URL`
in `.env.local`); the deployed app connects over Railway's private network instead
(`DATABASE_URL` set on the `kaalbert-web` service as a reference to the `Postgres` service's
own `DATABASE_URL` — no public exposure needed in production). `.env.production` exists only
for testing a local production build (`npm run build && npm start`) — never read by the
deployed app.

## Environment Variables & Secrets

Three-tier convention, established at T1.2 for `DATABASE_URL` and extended to every secret
added since (see `memory/decision-log.md`'s "Postgres password exposure and rotation"
entry):

- **`.env.local`** — local dev, gitignored, loaded first, what `next dev` actually reads.
- **`.env.production`** — local production-build testing only (`npm run build && npm
start`), gitignored, never read by the deployed app.
- **Railway service variables** — source of truth for the deployed app, set directly on the
  `kaalbert-web` service (`railway variable set`), never read from a file in this repo.

`.env.example` is the checked-in template: every var the app reads gets a placeholder entry
and a one-line comment saying what it's for and where to find the real value — never a real
secret. Copy it to `.env.local` (and `.env.production` if needed) and fill in real values;
`CLAUDE.local.md` (gitignored) tracks which values are already provisioned and where they
came from.

Current vars (`.env.example`):

- `DATABASE_URL` — Railway Postgres connection string. See "Database & Migrations" above.
- `NEXTAUTH_SECRET` — session-signing secret (ADR 0007, admin auth — not yet consumed by
  any code; reserved for Milestone 6).
- `GTM_CONTAINER_ID` — Google Tag Manager container ID (ADR 0006). Read server-side in the
  root `app/layout.tsx`; when unset (e.g. no GTM account exists yet), the GTM snippet
  doesn't render at all rather than emitting a broken script tag — see
  `memory/technical-debt.md` → "GTM container not yet provisioned." Once a real container
  exists, set it in `.env.local` and on the Railway service and the snippet activates with
  no code change.
- `META_CAPI_ACCESS_TOKEN` — Meta Conversions API token (ADR 0006, Milestone 5, not yet
  consumed by any code).
- `CLOUDFLARE_R2_*`, Phase-2 vars (`PAYSTACK_SECRET_KEY`, calendar-sync credentials, CRM
  webhook auth) — commented out in `.env.example` until each capability's evidence trigger
  is met (`docs/scope.md`).

## Documentation

- [Vision & Requirements](docs/vision.md)
- [Architecture](docs/architecture.md)
- [Feature Specs](docs/features/)
- [Task Planning](docs/roadmap.md)
- [Project Health Dashboard](docs/dashboard.md)
- [Memory & Decisions](memory/)
- [Mockups (accepted, authoritative)](ui/mockups/)

For AI coding agents: read `CLAUDE.md` (Claude Code) or `AGENTS.md` (any other agent) in
full before making a change — they define the tech stack, conventions, quality gates, and
documentation obligations every change is held to.

## Tech Stack

- TypeScript on Node.js, Next.js (App Router) — one codebase for the public site, the
  diagnostic, and the hand-built admin area
- PostgreSQL via Prisma, hosted on Railway (bundled, always-on instance)
- Cloudflare CDN/proxy in front of Railway; Cloudflare R2 for object storage
- Tailwind CSS v4 (CSS-first) + shadcn/ui on Base UI + Lucide icons
- Hand-built TOTP two-factor admin authentication
- Custom, data-driven diagnostic scoring engine
- Google Tag Manager as the single measurement container, with a hand-built server-side Meta
  Conversions API integration
- Vitest + React Testing Library (unit/component), Playwright Test (end-to-end)
- ESLint + Prettier

No CMS, page-builder, or admin-kit product is used anywhere in this codebase — every part of
the application is built and owned by this team (see `docs/adr/0001-custom-build-no-cms-
platform.md`).

## Contributing

This is a vendor-built project for a single client. See `CLAUDE.md`'s Git Commit Protocol
for the commit/branch workflow: one commit per completed task, agents never push directly,
a human reviews with `git log --oneline` before pushing.

## License

Proprietary — all rights reserved by Kaalbert & Company Ltd.
