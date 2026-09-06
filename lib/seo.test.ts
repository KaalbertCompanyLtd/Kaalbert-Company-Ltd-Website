import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    homePageContent: { findFirst: vi.fn() },
    offer: { findMany: vi.fn() },
    page: { findMany: vi.fn() },
    legalPage: { findMany: vi.fn() },
    article: { findMany: vi.fn() },
    siteSettings: { findFirst: vi.fn() },
  },
}));

import { buildPageMetadata, getArticleJsonLd } from "@/lib/seo";

// Next's `Metadata["openGraph"]` read-back type doesn't re-expose `type` per discriminated
// variant the way the input to `buildPageMetadata` does — a narrow local cast for test
// assertions only, not a claim about the real shape `buildPageMetadata` accepts/returns.
function openGraphType(metadata: ReturnType<typeof buildPageMetadata>): string | undefined {
  return (metadata.openGraph as { type?: string } | undefined)?.type;
}

describe("buildPageMetadata", () => {
  it("defaults to the site logo and type: website when no imageUrl/type is given", () => {
    const metadata = buildPageMetadata({
      title: "Capabilities",
      description: "Desc.",
      path: "/capabilities",
    });

    expect(openGraphType(metadata)).toBe("website");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://www.kaalbert.com/brand/logo-primary.png" },
    ]);
    expect(metadata.twitter?.images).toEqual(["https://www.kaalbert.com/brand/logo-primary.png"]);
  });

  it("uses an article's own previewImage and type: article when given", () => {
    const metadata = buildPageMetadata({
      title: "Owner Drawings",
      description: "Desc.",
      path: "/insights/owner-drawings",
      imageUrl: "/uploads/owner-drawings.jpg",
      type: "article",
    });

    expect(openGraphType(metadata)).toBe("article");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://www.kaalbert.com/uploads/owner-drawings.jpg" },
    ]);
  });
});

describe("getArticleJsonLd", () => {
  const BASE_ARTICLE = {
    title: "Owner Drawings",
    authorName: "Evans Agyemang",
    authorPracticeArea: "Financial Control & Compliance",
    publishedAt: new Date("2026-08-03T00:00:00.000Z"),
    revisedAt: null,
    previewImage: null,
  };

  it("builds Article JSON-LD with dateModified falling back to publishedAt when never revised", () => {
    const data = getArticleJsonLd(BASE_ARTICLE);

    expect(data["@type"]).toBe("Article");
    expect(data.headline).toBe("Owner Drawings");
    expect(data.author).toEqual({
      "@type": "Person",
      name: "Evans Agyemang",
      jobTitle: "Financial Control & Compliance",
    });
    expect(data.datePublished).toBe("2026-08-03T00:00:00.000Z");
    expect(data.dateModified).toBe("2026-08-03T00:00:00.000Z");
    expect(data.image).toBeUndefined();
  });

  it("uses revisedAt as dateModified when the article has been revised post-publish", () => {
    const data = getArticleJsonLd({
      ...BASE_ARTICLE,
      revisedAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    expect(data.dateModified).toBe("2026-09-01T00:00:00.000Z");
  });

  it("includes image only when previewImage is set — never a placeholder/broken URL", () => {
    const data = getArticleJsonLd({ ...BASE_ARTICLE, previewImage: "/uploads/owner-drawings.jpg" });

    expect(data.image).toBe("https://www.kaalbert.com/uploads/owner-drawings.jpg");
  });
});
