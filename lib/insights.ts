import { prisma } from "@/lib/prisma";

/**
 * `ui/mockups/b-insights/insights-index.html`'s own `PAGE_SIZE` — kept identical so the grid
 * behaves the same once real pagination replaces the mockup's client-only slice.
 */
export const INSIGHTS_PAGE_SIZE = 6;

export interface InsightsCategory {
  name: string;
  slug: string;
}

export interface InsightsArticleCard {
  slug: string;
  title: string;
  excerpt: string;
  previewImage: string | null;
  category: InsightsCategory | null;
  authorName: string;
  authorPracticeArea: string;
}

export interface InsightsIndexQuery {
  /** A `category.slug`, or `undefined` for "All". An unknown slug simply matches nothing. */
  category?: string;
  /** Free-text search over title/excerpt, or `undefined`/empty for none. */
  q?: string;
  /** 1-based. Out-of-range values are clamped, never thrown. */
  page?: number;
}

export interface InsightsIndexResult {
  articles: InsightsArticleCard[];
  categories: InsightsCategory[];
  /** Echoes back the query actually applied, after clamping — e.g. `page` after clamping. */
  page: number;
  totalPages: number;
  totalCount: number;
}

/**
 * All admin-manageable categories, for the index's filter row (`content-management-admin.md`:
 * a partner creates/renames/retires these directly — this always reflects the live set, never
 * a developer-fixed list). Ordered by name since there's no admin-assigned display order for
 * categories, unlike `Capability.order`/`MethodStage.order`.
 */
export async function getInsightsCategories(): Promise<InsightsCategory[]> {
  return prisma.category.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/**
 * The index's filtered/searched/paginated article list. `publishedAt: { not: null }` is the
 * only visibility check anywhere in this query (T4.1: `published_at` is the sole source of
 * truth) — a draft is excluded here the same way it will be everywhere else that reads this
 * table (T4.3's article route, Home's featured section). `category`/`q` are independent
 * filters, combined with AND, matching the mockup's own `getMatches()` behaviour. An unknown
 * `category` slug resolves to zero matches (the documented empty state), not a thrown error —
 * a mistyped or stale query param is a normal, recoverable visitor state, not a 404-worthy one
 * the way a draft article's own `/insights/[slug]` is (T4.3's different, stricter rule).
 */
export async function getInsightsIndex({
  category,
  q,
  page = 1,
}: InsightsIndexQuery): Promise<InsightsIndexResult> {
  const trimmedQuery = q?.trim() ?? "";

  const where = {
    publishedAt: { not: null },
    ...(category ? { category: { slug: category } } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" as const } },
            { excerpt: { contains: trimmedQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalCount, categories] = await Promise.all([
    prisma.article.count({ where }),
    getInsightsCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / INSIGHTS_PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const rows = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (clampedPage - 1) * INSIGHTS_PAGE_SIZE,
    take: INSIGHTS_PAGE_SIZE,
    include: { author: true, category: true },
  });

  const articles: InsightsArticleCard[] = rows.map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    previewImage: article.previewImage,
    category: article.category
      ? { name: article.category.name, slug: article.category.slug }
      : null,
    authorName: article.author.name,
    authorPracticeArea: article.author.practiceArea,
  }));

  return { articles, categories, page: clampedPage, totalPages, totalCount };
}
