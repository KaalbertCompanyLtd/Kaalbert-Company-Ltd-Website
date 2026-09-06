import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    article: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getInsightsIndex, INSIGHTS_PAGE_SIZE } from "@/lib/insights";

const countMock = vi.mocked(prisma.article.count);
const findManyMock = vi.mocked(prisma.article.findMany);
const categoriesFindManyMock = vi.mocked(prisma.category.findMany);

const ARTICLE_ROW = {
  slug: "owner-drawings",
  title: "Owner Drawings",
  excerpt: "Mixing personal and business cash is a habit that quietly sinks SMEs.",
  previewImage: null,
  category: { name: "Financial Control", slug: "financial-control" },
  author: { name: "Evans Agyemang", practiceArea: "Financial Control & Compliance" },
};

beforeEach(() => {
  countMock.mockReset();
  findManyMock.mockReset();
  categoriesFindManyMock.mockReset();
  categoriesFindManyMock.mockResolvedValue([]);
});

describe("getInsightsIndex", () => {
  it("filters on published_at as the only visibility check — never a second flag", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await getInsightsIndex({});

    const countArgs = countMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(countArgs.where).toMatchObject({ publishedAt: { not: null } });
    const findArgs = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(findArgs.where).toMatchObject({ publishedAt: { not: null } });
  });

  it("filters by category slug via the relation, not a raw categoryId the caller can't know", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([ARTICLE_ROW] as never);

    await getInsightsIndex({ category: "financial-control" });

    const findArgs = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(findArgs.where).toMatchObject({ category: { slug: "financial-control" } });
  });

  it("searches title and excerpt, case-insensitively, when q is given", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([ARTICLE_ROW] as never);

    await getInsightsIndex({ q: "drawings" });

    const findArgs = findManyMock.mock.calls[0][0] as { where: { OR: unknown[] } };
    expect(findArgs.where.OR).toEqual([
      { title: { contains: "drawings", mode: "insensitive" } },
      { excerpt: { contains: "drawings", mode: "insensitive" } },
    ]);
  });

  it("omits the search filter entirely for a blank/whitespace-only q", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await getInsightsIndex({ q: "   " });

    const findArgs = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(findArgs.where.OR).toBeUndefined();
  });

  it("clamps an out-of-range page into [1, totalPages] rather than returning an empty page or throwing", async () => {
    countMock.mockResolvedValue(INSIGHTS_PAGE_SIZE * 2); // exactly 2 pages
    findManyMock.mockResolvedValue([ARTICLE_ROW] as never);

    const result = await getInsightsIndex({ page: 99 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    const findArgs = findManyMock.mock.calls[0][0] as { skip: number; take: number };
    expect(findArgs.skip).toBe(INSIGHTS_PAGE_SIZE); // page 2's offset
    expect(findArgs.take).toBe(INSIGHTS_PAGE_SIZE);
  });

  it("reports totalPages: 1 (not 0) when there are no matches at all, so pagination never divides by zero", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    const result = await getInsightsIndex({ page: 5 });

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.totalCount).toBe(0);
    expect(result.articles).toEqual([]);
  });

  it("shapes each row into a flat card, including an article with no assigned category", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([{ ...ARTICLE_ROW, category: null }] as never);

    const result = await getInsightsIndex({});

    expect(result.articles).toEqual([
      {
        slug: "owner-drawings",
        title: "Owner Drawings",
        excerpt: ARTICLE_ROW.excerpt,
        previewImage: null,
        category: null,
        authorName: "Evans Agyemang",
        authorPracticeArea: "Financial Control & Compliance",
      },
    ]);
  });
});
