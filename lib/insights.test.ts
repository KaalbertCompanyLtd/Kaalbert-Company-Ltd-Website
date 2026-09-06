import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    article: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  buildArticleShareLinks,
  getArticleBySlug,
  getInsightsIndex,
  getRelatedArticles,
  isResourceReachable,
  INSIGHTS_PAGE_SIZE,
} from "@/lib/insights";

const countMock = vi.mocked(prisma.article.count);
const findManyMock = vi.mocked(prisma.article.findMany);
const findUniqueMock = vi.mocked(prisma.article.findUnique);
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
  findUniqueMock.mockReset();
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

const FULL_ARTICLE_ROW = {
  id: 1,
  slug: "owner-drawings",
  title: "Owner Drawings",
  excerpt: "Excerpt.",
  body: [{ kind: "paragraph", text: "Body." }],
  previewImage: null,
  metaTitle: "Owner Drawings — Kaalbert & Company Ltd",
  metaDescription: "Meta description.",
  publishedAt: new Date("2026-08-03T00:00:00.000Z"),
  revisedAt: null,
  nextStepCta: { heading: "Next", body: "Body", label: "Go", href: "/offers/x" },
  categoryId: 10,
  category: { name: "Financial Control", slug: "financial-control" },
  author: {
    name: "Evans Agyemang",
    photoUrl: null,
    title: "Co-Founder",
    practiceArea: "Financial Control & Compliance",
    bio: "A chartered accountant...",
  },
  resources: [{ id: 5, label: "Checklist", fileUrl: "https://example.com/file.pdf", sortOrder: 0 }],
};

describe("getArticleBySlug", () => {
  it("returns null when no row matches the slug, so the caller 404s", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getArticleBySlug("missing");

    expect(result).toBeNull();
  });

  it("returns null for a draft (publishedAt: null) — a draft 404s exactly as if it never existed", async () => {
    findUniqueMock.mockResolvedValue({ ...FULL_ARTICLE_ROW, publishedAt: null } as never);

    const result = await getArticleBySlug("owner-drawings");

    expect(result).toBeNull();
  });

  it("shapes a published row into an ArticleDetail", async () => {
    findUniqueMock.mockResolvedValue(FULL_ARTICLE_ROW as never);

    const result = await getArticleBySlug("owner-drawings");

    expect(result).toMatchObject({
      id: 1,
      slug: "owner-drawings",
      title: "Owner Drawings",
      excerpt: "Excerpt.",
      category: { name: "Financial Control", slug: "financial-control" },
      categoryId: 10,
      nextStepCta: { heading: "Next", body: "Body", label: "Go", href: "/offers/x" },
      resources: [{ id: 5, label: "Checklist", fileUrl: "https://example.com/file.pdf" }],
    });
  });
});

describe("getRelatedArticles", () => {
  it("queries the same category first, excluding the article itself", async () => {
    findManyMock.mockResolvedValueOnce([ARTICLE_ROW, ARTICLE_ROW, ARTICLE_ROW] as never);

    await getRelatedArticles({ id: 1, categoryId: 10 });

    const args = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(args.where).toMatchObject({
      publishedAt: { not: null },
      categoryId: 10,
      id: { not: 1 },
    });
  });

  it("falls back to most-recent-published (no category filter) for an uncategorized article", async () => {
    findManyMock.mockResolvedValueOnce([ARTICLE_ROW, ARTICLE_ROW, ARTICLE_ROW] as never);

    await getRelatedArticles({ id: 1, categoryId: null });

    expect(findManyMock).toHaveBeenCalledTimes(1); // no same-category query attempted at all
    const args = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(args.where).not.toHaveProperty("categoryId");
  });

  it("tops up with most-recent-published when the category has too few articles", async () => {
    findManyMock.mockResolvedValueOnce([ARTICLE_ROW] as never); // 1 same-category match
    findManyMock.mockResolvedValueOnce([ARTICLE_ROW, ARTICLE_ROW] as never); // fallback fills the rest

    const result = await getRelatedArticles({ id: 1, categoryId: 10 }, 3);

    expect(result).toHaveLength(3);
    const fallbackArgs = findManyMock.mock.calls[1][0] as { take: number };
    expect(fallbackArgs.take).toBe(2);
  });
});

describe("buildArticleShareLinks", () => {
  it("builds a wa.me share link (no target number) with the title and url URL-encoded", () => {
    const links = buildArticleShareLinks({
      title: "Owner Drawings",
      url: "https://www.kaalbert.com/insights/owner-drawings",
    });

    expect(links.whatsapp).toBe(
      "https://wa.me/?text=" +
        encodeURIComponent(
          "Owner Drawings — a Kaalbert & Company Insight https://www.kaalbert.com/insights/owner-drawings",
        ),
    );
    expect(links.linkedin).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent("https://www.kaalbert.com/insights/owner-drawings"),
    );
    expect(links.facebook).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent("https://www.kaalbert.com/insights/owner-drawings"),
    );
  });
});

describe("isResourceReachable", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns true for a 2xx HEAD response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as never;

    await expect(isResourceReachable("https://example.com/file.pdf")).resolves.toBe(true);
  });

  it("returns false for a non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as never;

    await expect(isResourceReachable("https://example.com/gone.pdf")).resolves.toBe(false);
  });

  it("returns false (never throws) on a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error")) as never;

    await expect(isResourceReachable("https://example.com/file.pdf")).resolves.toBe(false);
  });
});
