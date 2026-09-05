import { prisma } from "@/lib/prisma";

/**
 * The home page is a singleton (`docs/features/home-page.md`) — exactly one row is ever
 * seeded (`prisma/seed.ts`'s `seedHomePageContent`). Throws rather than falling back to
 * placeholder copy if it's somehow missing, since a missing singleton row is a seed/migration
 * bug, not a real "no content yet" state a visitor should ever see.
 */
export async function getHomePageContent() {
  const content = await prisma.homePageContent.findFirst({ orderBy: { id: "asc" } });
  if (!content) {
    throw new Error("home_page_content has no row — run `npm run db:seed` (see prisma/seed.ts).");
  }
  return content;
}

/**
 * home-page.md's "fewer than three published offer pages exist" edge case: this simply
 * returns however many `offer` rows exist (0–3 today), and the page renders only those —
 * there's no `published` flag on `Offer` to filter by (all seeded offers are live).
 */
export async function getOfferCards() {
  return prisma.offer.findMany({ orderBy: { id: "asc" } });
}

/**
 * home-page.md's featured-Insights section resolves `featured_article_ids` with a
 * most-recent fallback once articles exist. No `article` table exists yet
 * (`docs/features/insights-engine.md` is Milestone 4, not built yet as of T2.1) — so this
 * always returns no articles for now, which correctly triggers the page's own "no Insights
 * articles published yet: omit the section entirely" edge case rather than rendering
 * anything broken. Replace this stub with a real query (pinned ids first, most-recent
 * fallback for unpublished/missing pins) once Milestone 4 adds the `article` model.
 */
export async function getFeaturedArticles(_featuredArticleIds: number[]) {
  void _featuredArticleIds;
  return [] as Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    authorName: string;
    authorPracticeArea: string;
  }>;
}
