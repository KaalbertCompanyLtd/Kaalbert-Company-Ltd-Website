import { NextResponse } from "next/server";

import { ArticleValidationError, parseArticleSaveInput, updateArticle } from "@/lib/articles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `PATCH /api/admin/articles/[id]` — request: an `ArticleSaveInput` plus `{publish:
 * boolean}`; response: `{status, id}`. Parses the request and shapes the response only —
 * every validation/gating rule lives in `lib/articles.ts`'s `updateArticle`.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid article id." }, { status: 400 });
  }

  const rawBody = await request.json().catch(() => null);
  const input = parseArticleSaveInput(rawBody);

  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const result = await updateArticle(id, input, {
      publish: (rawBody as { publish?: boolean }).publish === true,
    });
    return NextResponse.json({ status: "ok", id: result.id }, { status: 200 });
  } catch (error) {
    if (error instanceof ArticleValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
