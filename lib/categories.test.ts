import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  CategoryValidationError,
  createCategory,
  listCategoriesWithCounts,
  renameCategory,
  retireCategory,
  slugify,
} from "@/lib/categories";

const findManyMock = vi.mocked(prisma.category.findMany);
const findUniqueMock = vi.mocked(prisma.category.findUnique);
const createMock = vi.mocked(prisma.category.create);
const updateMock = vi.mocked(prisma.category.update);
const deleteMock = vi.mocked(prisma.category.delete);

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

describe("slugify", () => {
  it("matches the mockup's own inline slugify exactly", () => {
    expect(slugify("Regulatory & Compliance")).toBe("regulatory-compliance");
    expect(slugify("  Leading/trailing  ")).toBe("leading-trailing");
    expect(slugify("Growth & Funding")).toBe("growth-funding");
  });
});

describe("listCategoriesWithCounts", () => {
  it("maps the Prisma _count shape to a flat articleCount", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: 1, name: "Financial Control", slug: "financial-control", _count: { articles: 4 } },
    ] as never);

    const result = await listCategoriesWithCounts();

    expect(result).toEqual([
      { id: 1, name: "Financial Control", slug: "financial-control", articleCount: 4 },
    ]);
  });
});

describe("createCategory", () => {
  it("rejects an empty name", async () => {
    await expect(createCategory("   ")).rejects.toThrow(CategoryValidationError);
  });

  it("rejects a name whose slug is already in use", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 1, slug: "financial-control" } as never);

    await expect(createCategory("Financial Control")).rejects.toThrow(CategoryValidationError);
  });

  it("creates a category with articleCount 0 when the slug is free", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({
      id: 3,
      name: "Regulatory & Compliance",
      slug: "regulatory-compliance",
    } as never);

    const result = await createCategory("Regulatory & Compliance");

    expect(result).toEqual({
      id: 3,
      name: "Regulatory & Compliance",
      slug: "regulatory-compliance",
      articleCount: 0,
    });
  });
});

describe("renameCategory", () => {
  it("allows renaming to a slug already owned by the same row (a no-op-ish rename)", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 5, slug: "financial-control" } as never);
    updateMock.mockResolvedValueOnce({
      id: 5,
      name: "Financial Control",
      slug: "financial-control",
      _count: { articles: 2 },
    } as never);

    const result = await renameCategory(5, "Financial Control");

    expect(result.articleCount).toBe(2);
  });

  it("rejects renaming into a slug owned by a different row", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 9, slug: "growth-funding" } as never);

    await expect(renameCategory(5, "Growth & Funding")).rejects.toThrow(CategoryValidationError);
  });
});

describe("retireCategory", () => {
  it("deletes the category row (onDelete: SetNull handles the articles)", async () => {
    deleteMock.mockResolvedValueOnce({} as never);

    await retireCategory(5);

    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});
