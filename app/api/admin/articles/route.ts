import { NextResponse } from "next/server";

import { ArticleValidationError, createArticle, parseArticleSaveInput } from "@/lib/articles";

/**
 * `POST /api/admin/articles` — request: an `ArticleSaveInput` plus `{publish: boolean}`;
 * response: `{status, id}`. Parses the request body and shapes the response only — every
 * validation/gating rule lives in `lib/articles.ts`'s `createArticle` (CLAUDE.md's "business
 * logic lives in `lib/`" rule).
 */
export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const input = parseArticleSaveInput(rawBody);

  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const result = await createArticle(input, {
      publish: (rawBody as { publish?: boolean }).publish === true,
    });
    return NextResponse.json({ status: "ok", id: result.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ArticleValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
