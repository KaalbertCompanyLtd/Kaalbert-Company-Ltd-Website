# ADR 0003: Railway for Application Hosting and Database

Status: Accepted

Context: Hosting has to fit the real GHS 150/month provision, and the database backing the
diagnostic's scoring engine has to deliver consistent response time against a contractually
tested performance threshold (`AC/2026-09`, AC-1). Three configurations were evaluated with
live 2026 pricing: Vercel + Neon + R2; Railway (app + bundled Postgres) + Cloudflare;
Railway (app) + Neon (DB, free tier) + Cloudflare.

Decision: Railway hosts both the application and its own bundled PostgreSQL database.
Vercel is disqualified outright — its Pro tier has a fixed $20–24/month floor, roughly
double the entire monthly provision, regardless of actual usage. Between the two
Railway-based configurations, Railway's own always-on Postgres is chosen over Neon's free,
scale-to-zero Postgres, specifically to avoid cold-start latency risk on the diagnostic — a
launch-stage site's bursty traffic pattern (activity around a published article or a
campaign, then quiet) is exactly the pattern most likely to hit a cold start repeatedly, and
a three-run Lighthouse acceptance test would likely pass cleanly by warming the instance on
its first run, masking the risk from acceptance testing while it still periodically reaches
real visitors.

Consequences: One vendor account for compute and database (simpler entry in the Account
Ownership Register, `MHC/2026-09`) rather than three. A small, deliberate cost premium over
the cheapest possible configuration, accepted for reliability on the site's single most
important feature. This decision was reached only after live pricing research corrected an
earlier cost-driven lean toward Neon — see
`docs/research/hosting-and-infrastructure.md` for the full pricing table and reasoning.
