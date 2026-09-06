import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getFeaturedArticles } from "@/lib/home";

const findManyMock = vi.mocked(prisma.article.findMany);

function row(
  overrides: {
    id?: number;
    slug?: string;
    title?: string;
    excerpt?: string;
    categoryName?: string | null;
    authorName?: string;
    authorPracticeArea?: string;
  } = {},
) {
  return {
    id: overrides.id ?? 1,
    slug: overrides.slug ?? "article-slug",
    title: overrides.title ?? "Article Title",
    excerpt: overrides.excerpt ?? "Article excerpt.",
    category:
      overrides.categoryName === undefined
        ? { name: "Financial Control" }
        : overrides.categoryName === null
          ? null
          : { name: overrides.categoryName },
    author: {
      name: overrides.authorName ?? "Evans Agyemang",
      practiceArea: overrides.authorPracticeArea ?? "Financial Control & Compliance",
    },
  };
}

beforeEach(() => {
  findManyMock.mockReset();
});

describe("getFeaturedArticles", () => {
  it("resolves pinned ids first, in the admin's own pin order, filtered to published only", async () => {
    findManyMock.mockResolvedValueOnce([
      row({ id: 2, title: "Second pin" }),
      row({ id: 1, title: "First pin" }),
    ] as never);
    findManyMock.mockResolvedValueOnce([row({ id: 3, title: "Fallback" })] as never);

    const result = await getFeaturedArticles([1, 2]);

    expect(result[0].title).toBe("First pin");
    expect(result[1].title).toBe("Second pin");
    const pinnedCallArgs = findManyMock.mock.calls[0][0] as { where: { publishedAt: unknown } };
    expect(pinnedCallArgs.where.publishedAt).toEqual({ not: null });
  });

  it("drops a pinned id that no longer resolves (unpublished or deleted) and falls back for that slot", async () => {
    findManyMock.mockResolvedValueOnce([row({ id: 1, title: "Still published" })] as never); // id 2 dropped
    findManyMock.mockResolvedValueOnce([
      row({ id: 3, title: "Fallback A" }),
      row({ id: 4, title: "Fallback B" }),
    ] as never);

    const result = await getFeaturedArticles([1, 2]);

    expect(result.map((a) => a.title)).toEqual(["Still published", "Fallback A", "Fallback B"]);
    const fallbackArgs = findManyMock.mock.calls[1][0] as { take: number };
    expect(fallbackArgs.take).toBe(2); // 3 - 1 resolved pin
  });

  it("falls back entirely to most-recent-published when featuredArticleIds is empty", async () => {
    findManyMock.mockResolvedValueOnce([
      row({ id: 1, title: "Recent 1" }),
      row({ id: 2, title: "Recent 2" }),
      row({ id: 3, title: "Recent 3" }),
    ] as never);

    const result = await getFeaturedArticles([]);

    expect(findManyMock).toHaveBeenCalledTimes(1); // no pinned lookup at all
    expect(result).toHaveLength(3);
    const args = findManyMock.mock.calls[0][0] as { orderBy: unknown; take: number };
    expect(args.orderBy).toEqual({ publishedAt: "desc" });
    expect(args.take).toBe(3);
  });

  it("returns an empty string category (never null/undefined) for an uncategorized article", async () => {
    findManyMock.mockResolvedValueOnce([row({ id: 1, categoryName: null })] as never);

    const result = await getFeaturedArticles([]);

    expect(result[0].category).toBe("");
  });
});
