import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    articleResource: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  addArticleResource,
  ArticleResourceValidationError,
  getArticleResources,
  moveArticleResource,
  removeArticleResource,
} from "@/lib/admin-article-resources";

const findManyMock = vi.mocked(prisma.articleResource.findMany);
const findFirstMock = vi.mocked(prisma.articleResource.findFirst);
const findUniqueMock = vi.mocked(prisma.articleResource.findUnique);
const createMock = vi.mocked(prisma.articleResource.create);
const deleteMock = vi.mocked(prisma.articleResource.delete);
const transactionMock = vi.mocked(prisma.$transaction);

beforeEach(() => {
  findManyMock.mockReset();
  findFirstMock.mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
  deleteMock.mockReset();
  transactionMock.mockReset();
});

describe("getArticleResources", () => {
  it("returns rows ordered by sortOrder ascending", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: 2, label: "B", fileUrl: "data:...", sortOrder: 1 },
      { id: 1, label: "A", fileUrl: "data:...", sortOrder: 0 },
    ] as never);

    const result = await getArticleResources(5);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { articleId: 5 },
      orderBy: { sortOrder: "asc" },
    });
    expect(result.map((r) => r.id)).toEqual([2, 1]);
  });
});

describe("addArticleResource", () => {
  it("rejects a blank label", async () => {
    await expect(addArticleResource(1, { label: "  ", fileUrl: "data:x" })).rejects.toThrow(
      ArticleResourceValidationError,
    );
  });

  it("rejects a blank fileUrl", async () => {
    await expect(addArticleResource(1, { label: "Checklist", fileUrl: "" })).rejects.toThrow(
      ArticleResourceValidationError,
    );
  });

  it("appends at sortOrder 0 when the article has no existing resources", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({
      id: 1,
      label: "Checklist",
      fileUrl: "data:x",
      sortOrder: 0,
    } as never);

    await addArticleResource(1, { label: "Checklist", fileUrl: "data:x" });

    const createArgs = createMock.mock.calls[0][0] as { data: { sortOrder: number } };
    expect(createArgs.data.sortOrder).toBe(0);
  });

  it("appends one past the current highest sortOrder", async () => {
    findFirstMock.mockResolvedValueOnce({ sortOrder: 3 } as never);
    createMock.mockResolvedValueOnce({
      id: 2,
      label: "Checklist 2",
      fileUrl: "data:y",
      sortOrder: 4,
    } as never);

    await addArticleResource(1, { label: "Checklist 2", fileUrl: "data:y" });

    const createArgs = createMock.mock.calls[0][0] as { data: { sortOrder: number } };
    expect(createArgs.data.sortOrder).toBe(4);
  });
});

describe("removeArticleResource", () => {
  it("deletes the row by id", async () => {
    deleteMock.mockResolvedValueOnce({} as never);

    await removeArticleResource(7);

    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});

describe("moveArticleResource", () => {
  it("throws when the resource doesn't exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(moveArticleResource(1, "up")).rejects.toThrow(ArticleResourceValidationError);
  });

  it("is a no-op when already first and moving up", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 1, articleId: 1, sortOrder: 0 } as never);
    findFirstMock.mockResolvedValueOnce(null);

    await moveArticleResource(1, "up");

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("swaps sortOrder with the adjacent sibling via a 3-step transaction", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 1, articleId: 1, sortOrder: 1 } as never);
    findFirstMock.mockResolvedValueOnce({ id: 2, sortOrder: 0 } as never);
    transactionMock.mockResolvedValueOnce([] as never);

    await moveArticleResource(1, "up");

    expect(transactionMock).toHaveBeenCalledTimes(1);
    const steps = transactionMock.mock.calls[0][0] as unknown as unknown[];
    expect(steps).toHaveLength(3);
  });
});
