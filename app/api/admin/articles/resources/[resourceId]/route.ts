import { NextResponse } from "next/server";

import { removeArticleResource } from "@/lib/admin-article-resources";

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

/**
 * `DELETE /api/admin/articles/resources/[resourceId]` — a real row delete, unlike
 * `Subscriber`'s soft "unsubscribe" — `ArticleResource` has no "never a hard delete" rule
 * anywhere in `insights-engine.md`; the row and its download link genuinely stop existing.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { resourceId: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid resource id." }, { status: 400 });
  }

  await removeArticleResource(id);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
