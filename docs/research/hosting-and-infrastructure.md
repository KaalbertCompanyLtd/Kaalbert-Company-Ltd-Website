# Research: Hosting, Database & Infrastructure

## The decision to be made

Where the custom Next.js application runs, what database backs it, and how backups,
security, and media storage are handled — within the GHS 150/month ongoing provision
(Document 13.03, Section 16 and Section 17.5) and the NFR-1/NFR-3/NFR-8 requirements. This
is infrastructure hosting, not a content platform — using managed compute, database, or
storage services here does not conflict with the "custom build everything" decision in
`runtime-framework-and-admin.md`, in the same way building a custom application doesn't
mean running your own data centre.

## Options evaluated

**A. Railway** for both the application and its PostgreSQL database, as a single platform
with one dashboard and one bill, with Cloudflare in front for CDN/proxy and Cloudflare R2
for media storage.

**B. Vercel + Neon + Cloudflare R2** — Vercel for the application (built by the same team as
Next.js, with a native global edge network), Neon for serverless Postgres, R2 for object
storage.

**C. Railway for the application, Neon for the database (its free tier), Cloudflare for CDN
and R2** — a cost-minimising variant of Option A.

## Criteria

- Real monthly cost against the GHS 150/month provision, verified against current 2026
  pricing rather than assumed
- Consistency of response time — no cold-start latency on the database connection, since the
  diagnostic's scoring engine and the site's hard LCP threshold both depend on it, and the
  diagnostic is described in Document 13.03 as "the single most important conversion asset
  on the site"
- Performance for visitors in Ghana specifically: response latency and edge/CDN coverage for
  static assets, directly serving NFR-1's LCP target on 3G/mid-range Android
- Operational burden matching a firm with no dedicated ongoing infrastructure-administration
  capacity (NFR-7)
- Number of separate vendor accounts to hold and secure under firm-owned credentials (NFR-9,
  and the Account Ownership Register in `MHC/2026-09`)

## Current pricing (checked September 2026, not assumed)

| Service       | Real cost                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel        | Hobby tier is free but contractually barred from commercial use. Pro is **$20/seat/month billed annually, $24/month billed monthly** — a fixed floor, not usage-based.   |
| Railway       | Hobby plan: $5/month base (includes $5 usage credit) plus metered CPU/RAM/egress on top. Real-world reports put a Node app + Postgres together at **$6–12/month total**. |
| Neon          | Free tier: 100 CU-hours/month, 0.5GB storage, scale-to-zero, no monthly minimum. Effectively $0 at this project's traffic level.                                         |
| Cloudflare R2 | 10GB storage and generous operation limits free; zero egress fees at any volume. Effectively $0 at this project's media footprint.                                       |

## Recommendation

**Option A — Railway for both the application and its own bundled PostgreSQL database,
Cloudflare in front as a CDN/reverse-proxy layer, Cloudflare R2 added for media storage once
volume justifies it.**

### Why

- **Vercel is disqualified on cost, not narrowly rejected.** Its Pro tier's fixed $20–24/month
  floor is roughly double the entire GHS 150/month provision before anything else is added —
  this isn't a close call decided on secondary factors, the floor itself doesn't fit.
- **Reliability, not cost-minimisation, is the deciding factor between Options A and C.**
  Neon's free tier is genuinely the cheapest database option evaluated, and was seriously
  considered as Option C. It is not chosen because its scale-to-zero behaviour introduces a
  cold-start delay on the _first_ request after a quiet period — and a launch-stage
  advisory-firm site, with traffic arriving in bursts around published articles or campaign
  activity rather than continuously, is exactly the traffic pattern most likely to hit that
  cold state repeatedly, not rarely. A three-run Lighthouse acceptance test (`AC/2026-09`,
  AC-1) would likely warm the instance on its first run and pass cleanly regardless — meaning
  this risk could pass acceptance testing while still periodically reaching real visitors on
  the site's single most important conversion asset. Railway's Postgres is always-on; this
  risk does not exist there. The cost difference between the two (roughly $6–12/month for
  Railway's bundled database versus close to $0 for Neon's free tier) is real but small, and
  is not worth trading against consistent performance on a component this central to why the
  site exists.
- **One platform, one account.** Application and database live under a single Railway
  account — one entry in the Account Ownership Register rather than two or three, a genuine
  simplification against Option B's three separate vendor relationships (Vercel, Neon,
  Cloudflare), each with its own billing, credentials, and ownership confirmation to hold,
  for a project with no one dedicated to administering multiple vendor accounts.
- **Cloudflare closes Railway's one real gap.** Railway has no built-in global CDN and
  typically serves from a single region, which works against LCP for Ghanaian visitors on 3G
  if nothing sits in front of it. Routing kaalbert.com's DNS through Cloudflare (free tier)
  solves this directly — static assets are cached and served from an edge node close to the
  visitor rather than from Railway's origin server on every request — and comes with free
  DDoS protection and TLS handling as a side benefit.
- **R2 only when needed.** Media (partner photographs, article images, the downloadable
  funding-readiness checklist PDF) starts on Railway's own storage; R2 is added the moment
  media volume or egress actually justifies a dedicated object store, not provisioned
  speculatively on day one.

### Why this is a single decision, not a build-for-either-host design

An earlier line of thinking considered building the application to be equally deployable to
Railway or Vercel, deferred to a later choice based on budget at the time. That is not
carried forward here. Writing portable code — configuration through environment variables,
standard Prisma/Postgres usage, an S3-compatible storage client rather than a
provider-specific one — is followed anyway, at no extra cost, because it is ordinary good
practice and avoids gratuitous lock-in. But actively designing, testing, and documenting the
application as switchable between two hosting providers at will is not: Vercel's fixed cost
floor already rules it out under this project's real budget, so treating it as a live
parallel option resolves nothing further. And once the site holds real enquiry and client
data, moving it between hosts stops being a low-stakes decision regardless of how portable
the code is — so there is little practical optionality being bought by designing for it now.
Railway is decided as the host, not merely the current front-runner.

### Trade-offs

- Railway's single-region hosting is a real gap without Cloudflare in front of it — accepted
  because Cloudflare's free tier closes it at no additional cost.
- Railway's bundled Postgres costs more than Neon's free tier — accepted deliberately, for
  the reliability reasoning above.

### Future scaling considerations

If the Phase 2 client portal (P2-3) or the paid diagnostic suite (P2-7) later need more
compute, a dedicated database instance, or a stricter security posture (encryption at rest),
Railway's usage-based model scales up directly without a platform change, and Cloudflare's
CDN/proxy layer and R2 storage both scale independently of the application host.

## Database schema ownership

The database schema — articles, pages, core offer pages, published fee bands, landing page
instances, diagnostic questions/dimensions/weights/thresholds, diagnostic responses,
enquiry records, admin user accounts — is designed entirely by the team building this
project, accessed through Prisma (the ORM chosen in `runtime-framework-and-admin.md`) purely
as a type-safe access layer. No table structure is inherited from a CMS product; the schema
is written from first principles against `requirements.md` and `scope.md`.

## What this decision constrains or enables

The Account Ownership Register in `MHC/2026-09` gains two new entries from this decision —
Railway and Cloudflare — both created under firm-owned credentials in Week 2 of `TL/2026-09`.
Media URLs referenced from the CMS schema point at wherever media is actually stored
(Railway initially, R2 once added), which the diagnostic's downloadable-resource requirement
(FR-3.2) also depends on.

## Sources consulted

- [Pricing Plans — Railway Docs](https://docs.railway.com/pricing/plans)
- [Railway Pricing 2026: Free Plan, Postgres & Alternatives](https://www.srvrlss.io/provider/railway/)
- [Vercel Pricing 2026: Hobby, Pro, Enterprise and Hidden Costs](https://kuberns.com/blogs/vercel-pricing/)
- [Vercel Pricing 2026: Hobby Free, Pro $20/developer/month](https://costbench.com/software/developer-tools/vercel/)
- [Neon Pricing 2026: Total Cost & Competitors Compared](https://checkthat.ai/brands/neon/pricing)
- [Neon Serverless Postgres Pricing 2026: Complete Breakdown](https://vela.run/articles/neon-serverless-postgres-pricing-2026/)
- [Cloudflare R2 — Egress-Free Object Storage](https://www.cloudflare.com/products/r2/)
- [Cloudflare R2 Pricing 2026: $0 Egress Fees, Storage & Operations](https://egresscost.com/cloudflare/)
