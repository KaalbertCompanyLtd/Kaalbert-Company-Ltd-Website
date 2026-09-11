import { NextResponse } from "next/server";

import { ArticleResourceValidationError, moveArticleResource } from "@/lib/admin-article-resources";

/**
 * `POST /api/admin/articles/resources/[resourceId]/move` — request:
 * `{direction: "up" | "down"}`; response: `{status}`. Same shape as
 * `POST /api/admin/diagnostic-questions/[id]/move` — parses the request and shapes the
 * response only, the reorder logic (a 3-step swap safe against
 * `@@unique([articleId, sortOrder])`) lives in `lib/admin-article-resources.ts`'s
 * `moveArticleResource`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const { resourceId: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid resource id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const direction = (body as Record<string, unknown> | null)?.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await moveArticleResource(id, direction);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof ArticleResourceValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
