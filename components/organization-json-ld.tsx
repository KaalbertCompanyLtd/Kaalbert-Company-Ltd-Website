import { getOrganizationJsonLd } from "@/lib/seo";

/**
 * `schema.org/Organization` structured data, sourced live from `site_settings`
 * (docs/features/seo-and-search-foundation.md's business rule: one shared source, never a
 * per-page copy). Rendered by every T2.1–T2.7 page component itself, not the root layout —
 * the root layout also wraps `/admin` and `/dev`, neither of which is public content this
 * schema describes, and `app/not-found.tsx` deliberately has zero DB dependency (see its own
 * comment) so it's excluded too. Deliberately outside GTM (ADR 0006) — see `lib/seo.ts`.
 */
export async function OrganizationJsonLd() {
  const data = await getOrganizationJsonLd();
  // JSON.stringify of server-built data (no visitor input reaches this string) — the
  // standard way to emit a JSON-LD `<script>` block in the App Router.
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
