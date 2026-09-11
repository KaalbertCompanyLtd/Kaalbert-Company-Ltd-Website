import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    author: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  ArticleValidationError,
  createArticle,
  getArticleForEdit,
  getArticleFormOptions,
  getArticleList,
  parseArticleSaveInput,
  updateArticle,
} from "@/lib/articles";
import type { ArticleSaveInput } from "@/lib/articles";

const articleFindManyMock = vi.mocked(prisma.article.findMany);
const articleFindUniqueMock = vi.mocked(prisma.article.findUnique);
const articleCreateMock = vi.mocked(prisma.article.create);
const articleUpdateMock = vi.mocked(prisma.article.update);
const authorFindManyMock = vi.mocked(prisma.author.findMany);
const categoryFindManyMock = vi.mocked(prisma.category.findMany);

beforeEach(() => {
  articleFindManyMock.mockReset();
  articleFindUniqueMock.mockReset();
  articleCreateMock.mockReset();
  articleUpdateMock.mockReset();
  authorFindManyMock.mockReset();
  categoryFindManyMock.mockReset();
});

function validInput(overrides: Partial<ArticleSaveInput> = {}): ArticleSaveInput {
  return {
    title: "Owner Drawings",
    excerpt: "A short teaser.",
    categoryId: null,
    authorId: 1,
    metaTitle: "Owner Drawings — Meta Title",
    metaDescription: "Meta description.",
    previewImage: null,
    body: [],
    nextStepCta: {
      heading: "Talk to us",
      body: "Lead paragraph.",
      label: "Get in touch",
      href: "/contact",
    },
    complianceChecked: false,
    ...overrides,
  };
}

describe("getArticleList", () => {
  it("derives status from publishedAt", async () => {
    articleFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        title: "Published one",
        publishedAt: new Date("2026-08-03"),
        author: { name: "Evans Agyemang" },
        category: { name: "Financial Control" },
      },
      {
        id: 2,
        title: "Draft one",
        publishedAt: null,
        author: { name: "John Dogbey" },
        category: null,
      },
    ] as never);

    const result = await getArticleList();

    expect(result[0]).toMatchObject({ status: "published", categoryName: "Financial Control" });
    expect(result[1]).toMatchObject({ status: "draft", categoryName: null });
  });
});

describe("getArticleFormOptions", () => {
  it("returns authors and categories", async () => {
    authorFindManyMock.mockResolvedValueOnce([{ id: 1, name: "Evans Agyemang" }] as never);
    categoryFindManyMock.mockResolvedValueOnce([{ id: 1, name: "Financial Control" }] as never);

    const result = await getArticleFormOptions();

    expect(result).toEqual({
      authors: [{ id: 1, name: "Evans Agyemang" }],
      categories: [{ id: 1, name: "Financial Control" }],
    });
  });
});

describe("getArticleForEdit", () => {
  it("returns null for a missing article", async () => {
    articleFindUniqueMock.mockResolvedValueOnce(null);

    await expect(getArticleForEdit(999)).resolves.toBeNull();
  });
});

describe("parseArticleSaveInput", () => {
  it("returns null for a structurally invalid body", () => {
    expect(parseArticleSaveInput({ title: "Missing everything else" })).toBeNull();
    expect(parseArticleSaveInput(null)).toBeNull();
  });

  it("parses a fully-shaped body, defaulting categoryId/previewImage to null when absent", () => {
    const result = parseArticleSaveInput({
      title: "T",
      excerpt: "E",
      metaTitle: "MT",
      metaDescription: "MD",
      authorId: 1,
      body: [],
      complianceChecked: true,
      nextStepCta: { heading: "H", body: "B", label: "L", href: "/x" },
    });

    expect(result).toMatchObject({ categoryId: null, previewImage: null, authorId: 1 });
  });
});

describe("createArticle", () => {
  it("rejects a missing title", async () => {
    await expect(createArticle(validInput({ title: "  " }), { publish: false })).rejects.toThrow(
      ArticleValidationError,
    );
  });

  it("rejects an incomplete next-step CTA (FR-3.4 — never a generic contact-us fallback)", async () => {
    await expect(
      createArticle(
        validInput({ nextStepCta: { heading: "H", body: "", label: "L", href: "/x" } }),
        { publish: false },
      ),
    ).rejects.toThrow(ArticleValidationError);
  });

  it("does not require a preview image or compliance checkbox when saving a draft", async () => {
    articleFindUniqueMock.mockResolvedValueOnce(null); // slug uniqueness check
    articleCreateMock.mockResolvedValueOnce({ id: 10 } as never);

    await expect(createArticle(validInput(), { publish: false })).resolves.toEqual({ id: 10 });
    const createArgs = articleCreateMock.mock.calls[0][0] as { data: { publishedAt: unknown } };
    expect(createArgs.data.publishedAt).toBeNull();
  });

  it("rejects publishing without a preview image", async () => {
    await expect(
      createArticle(validInput({ previewImage: null, complianceChecked: true }), {
        publish: true,
      }),
    ).rejects.toThrow(ArticleValidationError);
  });

  it("rejects publishing without the compliance checkbox, even with a preview image set", async () => {
    await expect(
      createArticle(
        validInput({ previewImage: "data:image/png;base64,abc", complianceChecked: false }),
        {
          publish: true,
        },
      ),
    ).rejects.toThrow(ArticleValidationError);
  });

  it("sets publishedAt on a first publish when both gates pass", async () => {
    articleFindUniqueMock.mockResolvedValueOnce(null);
    articleCreateMock.mockResolvedValueOnce({ id: 11 } as never);

    await createArticle(
      validInput({ previewImage: "data:image/png;base64,abc", complianceChecked: true }),
      { publish: true },
    );

    const createArgs = articleCreateMock.mock.calls[0][0] as { data: { publishedAt: Date | null } };
    expect(createArgs.data.publishedAt).toBeInstanceOf(Date);
  });

  it("appends a numeric suffix when the derived slug collides", async () => {
    articleFindUniqueMock
      .mockResolvedValueOnce({ id: 1 } as never) // "owner-drawings" taken
      .mockResolvedValueOnce(null); // "owner-drawings-2" free
    articleCreateMock.mockResolvedValueOnce({ id: 12 } as never);

    await createArticle(validInput(), { publish: false });

    const createArgs = articleCreateMock.mock.calls[0][0] as { data: { slug: string } };
    expect(createArgs.data.slug).toBe("owner-drawings-2");
  });
});

describe("updateArticle", () => {
  it("throws when the article does not exist", async () => {
    articleFindUniqueMock.mockResolvedValueOnce(null);

    await expect(updateArticle(999, validInput(), { publish: false })).rejects.toThrow(
      ArticleValidationError,
    );
  });

  it("never touches publishedAt when saving a draft, even for an already-published article", async () => {
    const existingPublishedAt = new Date("2026-08-03");
    articleFindUniqueMock.mockResolvedValueOnce({ publishedAt: existingPublishedAt } as never);
    articleUpdateMock.mockResolvedValueOnce({ id: 5 } as never);

    await updateArticle(5, validInput(), { publish: false });

    const updateArgs = articleUpdateMock.mock.calls[0][0] as {
      data: { publishedAt: Date; revisedAt?: Date };
    };
    expect(updateArgs.data.publishedAt).toBe(existingPublishedAt);
    expect(updateArgs.data.revisedAt).toBeUndefined();
  });

  it("sets revisedAt, not a new publishedAt, when publishing an already-published article", async () => {
    const existingPublishedAt = new Date("2026-08-03");
    articleFindUniqueMock.mockResolvedValueOnce({ publishedAt: existingPublishedAt } as never);
    articleUpdateMock.mockResolvedValueOnce({ id: 5 } as never);

    await updateArticle(
      5,
      validInput({ previewImage: "data:image/png;base64,abc", complianceChecked: true }),
      { publish: true },
    );

    const updateArgs = articleUpdateMock.mock.calls[0][0] as {
      data: { publishedAt: Date; revisedAt?: Date };
    };
    expect(updateArgs.data.publishedAt).toBe(existingPublishedAt);
    expect(updateArgs.data.revisedAt).toBeInstanceOf(Date);
  });

  it("sets publishedAt (first publish), not revisedAt, for a draft being published for the first time", async () => {
    articleFindUniqueMock.mockResolvedValueOnce({ publishedAt: null } as never);
    articleUpdateMock.mockResolvedValueOnce({ id: 5 } as never);

    await updateArticle(
      5,
      validInput({ previewImage: "data:image/png;base64,abc", complianceChecked: true }),
      { publish: true },
    );

    const updateArgs = articleUpdateMock.mock.calls[0][0] as {
      data: { publishedAt: Date | null; revisedAt?: Date };
    };
    expect(updateArgs.data.publishedAt).toBeInstanceOf(Date);
    expect(updateArgs.data.revisedAt).toBeUndefined();
  });
});
