import { prisma } from "@/lib/prisma";

export class CategoryValidationError extends Error {}

export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  articleCount: number;
}

/**
 * Matches `ui/mockups/g-admin-content/admin-categories-list.html`'s own inline `slugify` —
 * kept identical so a name that would collide in the browser's own illustrative check also
 * collides here, the real source of truth.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listCategoriesWithCounts(): Promise<CategoryListItem[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    articleCount: category._count.articles,
  }));
}

/**
 * `content-management-admin.md`'s edge case: "a partner creates a category whose name
 * produces a slug already in use... rejected with an inline error... rather than silently
 * creating a second category with a colliding URL." Checked at the application layer (not
 * only the schema's own `@unique` constraint) so the caller gets a clean, expected
 * `CategoryValidationError` rather than a raw Prisma unique-constraint exception.
 */
export async function createCategory(name: string): Promise<CategoryListItem> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new CategoryValidationError("Category name is required.");
  }

  const slug = slugify(trimmedName);
  if (!slug) {
    throw new CategoryValidationError("That name doesn't produce a usable slug.");
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new CategoryValidationError(
      "That name produces a slug already in use — try a different name.",
    );
  }

  const category = await prisma.category.create({ data: { name: trimmedName, slug } });
  return { id: category.id, name: category.name, slug: category.slug, articleCount: 0 };
}

/** Same duplicate-slug rule as `createCategory`, excluding the category's own current row. */
export async function renameCategory(id: number, name: string): Promise<CategoryListItem> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new CategoryValidationError("Category name is required.");
  }

  const slug = slugify(trimmedName);
  if (!slug) {
    throw new CategoryValidationError("That name doesn't produce a usable slug.");
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    throw new CategoryValidationError(
      "That name produces a slug already in use — try a different name.",
    );
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: trimmedName, slug },
    include: { _count: { select: { articles: true } } },
  });
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    articleCount: category._count.articles,
  };
}

/**
 * `content-management-admin.md`'s "retiring a category does not delete the articles in it" —
 * enforced at the schema layer, not here: `Article.categoryId`'s `onDelete: SetNull`
 * (`prisma/schema.prisma`) means deleting the `Category` row automatically nulls every
 * referencing article's `categoryId` in the same operation, never cascading the delete to
 * the articles themselves.
 */
export async function retireCategory(id: number): Promise<void> {
  await prisma.category.delete({ where: { id } });
}
