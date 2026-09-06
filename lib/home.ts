import { prisma } from "@/lib/prisma";
import { shapeArticleCard } from "@/lib/insights";
import type { InsightsArticleCard } from "@/lib/insights";

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
 * T2.1 follow-up (session 25) — home-page.md's featured-Insights section, resolving
 * `featured_article_ids` with a most-recent fallback, now that `article` exists (Milestone 4,
 * T4.1/T4.2). The original T2.1 build shipped this as a stub returning `[]` (no `article`
 * table existed yet) — replaced here rather than left as deferred technical debt, following
 * the same same-session "task follow-up" precedent as T3.7 (session 23, see
 * memory/completed-work.md and memory/technical-debt.md).
 *
 * Pinned ids are resolved first, filtered to published only and re-ordered to match the
 * admin's own pin order (never the database's arbitrary row order) — an unpublished or
 * deleted pin is silently dropped, satisfying home-page.md's "pinned but later unpublished
 * falls back to most-recent automatically" edge case. Any remaining slots (fewer than 3 pins
 * resolved, or `featuredArticleIds` is empty) are filled with the most recently published
 * articles not already included. Returns the same `InsightsArticleCard` shape `lib/insights.ts`
 * uses everywhere else (revised at T2.1 follow-up, session 27, from an earlier `category`-as-
 * plain-string shape — that divergence is exactly what let Home's own card render drift into a
 * visually different, unlinked component from the real Insights index; see
 * memory/decision-log.md, session 27) — this is what lets Home reuse the exact same shared
 * `ArticleCard` component (`components/insights-article-card.tsx`) the index itself renders.
 */
export async function getFeaturedArticles(
  featuredArticleIds: number[],
): Promise<InsightsArticleCard[]> {
  const FEATURED_COUNT = 3;

  const pinnedRows =
    featuredArticleIds.length > 0
      ? await prisma.article.findMany({
          where: { id: { in: featuredArticleIds }, publishedAt: { not: null } },
          include: { author: true, category: true },
        })
      : [];

  const pinned = featuredArticleIds
    .map((id) => pinnedRows.find((row) => row.id === id))
    .filter((row): row is (typeof pinnedRows)[number] => row !== undefined)
    .slice(0, FEATURED_COUNT);

  const remaining = FEATURED_COUNT - pinned.length;
  const fallback =
    remaining > 0
      ? await prisma.article.findMany({
          where: {
            publishedAt: { not: null },
            id: { notIn: pinned.map((row) => row.id) },
          },
          orderBy: { publishedAt: "desc" },
          take: remaining,
          include: { author: true, category: true },
        })
      : [];

  return [...pinned, ...fallback].map(shapeArticleCard);
}
