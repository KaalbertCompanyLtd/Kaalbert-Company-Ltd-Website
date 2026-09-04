# ADR 0004: Cloudflare as CDN/Proxy Layer

Status: Accepted

Context: Railway (ADR 0003) has no built-in global CDN and typically serves from a single
region, which works against the LCP threshold (NFR-1) for visitors in Ghana on 3G/mid-range
Android connections — the audience `vision.md` names as primary.

Decision: kaalbert.com's DNS is routed through Cloudflare (free tier), which caches and
serves static assets from an edge node close to the visitor rather than from Railway's
origin server on every request. Cloudflare R2 is added as object storage for media once
volume justifies a dedicated store, rather than provisioned on day one.

Consequences: Closes Railway's one real performance gap at no additional cost, plus free
DDoS protection and TLS handling as a side benefit. Introduces a genuine single point of
failure — a Cloudflare outage would make the site unreachable, since DNS itself is routed
through it — accepted as a trade-off given Cloudflare's enterprise-grade uptime and the
manual fallback of pointing DNS directly at Railway if ever needed. See `architecture.md`,
Section 5, for the documented failure mode, and `docs/research/hosting-and-infrastructure.md`
for the full reasoning.
