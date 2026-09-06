import { getArticleJsonLd } from "@/lib/seo";

type ArticleJsonLdProps = Parameters<typeof getArticleJsonLd>[0];

/**
 * `schema.org/Article` structured data for one Insights article (T4.3, NFR-5) — rendered
 * alongside (never instead of) `OrganizationJsonLd`, which every page already carries. Takes
 * its data as props rather than fetching, unlike `OrganizationJsonLd`: the caller
 * (`app/insights/[slug]/page.tsx`) already has everything `getArticleJsonLd` needs from its
 * own `getArticleBySlug` call, so a second fetch here would be redundant.
 */
export function ArticleJsonLd(props: ArticleJsonLdProps) {
  const data = getArticleJsonLd(props);
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
