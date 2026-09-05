import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/seo";

// Reads live `home_page_content`/`offer`/`page`/`legal_page` rows on every request — same
// reasoning as every other route built against seeded content this epic
// (memory/decision-log.md, T2.1): Railway's build container can't reach the private-network
// DB host to statically prerender this route at build time, and this content is meant to
// become admin-editable (Milestone 7), so a stale build-time sitemap would drift immediately.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries();
}
