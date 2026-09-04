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
cp .env.example .env    # fill in DATABASE_URL and the other values CLAUDE.local.md lists
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
