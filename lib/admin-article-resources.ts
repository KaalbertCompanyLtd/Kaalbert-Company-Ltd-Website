import { prisma } from "@/lib/prisma";

export class ArticleResourceValidationError extends Error {}

export interface ArticleResourceRow {
  id: number;
  label: string;
  fileUrl: string;
  sortOrder: number;
}

export async function getArticleResources(articleId: number): Promise<ArticleResourceRow[]> {
  const resources = await prisma.articleResource.findMany({
    where: { articleId },
    orderBy: { sortOrder: "asc" },
  });

  return resources.map((resource) => ({
    id: resource.id,
    label: resource.label,
    fileUrl: resource.fileUrl,
    sortOrder: resource.sortOrder,
  }));
}

/**
 * `ArticleResource.fileUrl` is non-nullable (`prisma/schema.prisma`'s own doc-comment: "a
 * resource row only ever exists once a real file has been attached") — this is the only
 * write path that ever creates a row, and it always requires a file already uploaded
 * (`fileUrl` from `components/admin-download-upload-button.tsx`'s `onUploaded`, T7.5's
 * `POST /api/admin/media/downloads`) — there is no "draft resource with no file yet" state,
 * unlike `Article.previewImage`. Appended at the end of the article's existing resources
 * (`sortOrder` one past the current highest), same "append, don't insert" precedent as
 * `lib/admin-diagnostic.ts`'s `createDiagnosticQuestion`.
 */
export async function addArticleResource(
  articleId: number,
  input: { label: string; fileUrl: string },
): Promise<ArticleResourceRow> {
  const label = input.label?.trim();
  const fileUrl = input.fileUrl?.trim();
  if (!label) {
    throw new ArticleResourceValidationError("A label is required.");
  }
  if (!fileUrl) {
    throw new ArticleResourceValidationError("A file is required.");
  }

  const last = await prisma.articleResource.findFirst({
    where: { articleId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const created = await prisma.articleResource.create({
    data: { articleId, label, fileUrl, sortOrder },
  });

  return {
    id: created.id,
    label: created.label,
    fileUrl: created.fileUrl,
    sortOrder: created.sortOrder,
  };
}

export async function removeArticleResource(id: number): Promise<void> {
  await prisma.articleResource.delete({ where: { id } });
}

/**
 * Swaps this resource's `sortOrder` with its adjacent sibling on the same article — same
 * 3-step sequential-transaction shape as `lib/admin-diagnostic.ts`'s
 * `moveDiagnosticQuestion`, required for the identical reason: `ArticleResource`'s
 * `@@unique([articleId, sortOrder])` constraint is checked immediately (Prisma creates no
 * deferrable constraints in Postgres), so a plain 2-statement swap would violate it the
 * instant the first `UPDATE` tries to claim the still-occupied slot.
 */
export async function moveArticleResource(id: number, direction: "up" | "down"): Promise<void> {
  const resource = await prisma.articleResource.findUnique({ where: { id } });
  if (!resource) {
    throw new ArticleResourceValidationError("Resource not found.");
  }

  const sibling = await prisma.articleResource.findFirst({
    where: {
      articleId: resource.articleId,
      sortOrder: direction === "up" ? { lt: resource.sortOrder } : { gt: resource.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) {
    // Already first/last for this article — nothing to do, not an error.
    return;
  }

  await prisma.$transaction([
    prisma.articleResource.update({ where: { id: resource.id }, data: { sortOrder: -1 } }),
    prisma.articleResource.update({
      where: { id: sibling.id },
      data: { sortOrder: resource.sortOrder },
    }),
    prisma.articleResource.update({
      where: { id: resource.id },
      data: { sortOrder: sibling.sortOrder },
    }),
  ]);
}
