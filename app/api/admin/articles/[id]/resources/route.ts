import { NextResponse } from "next/server";

import { addArticleResource, ArticleResourceValidationError } from "@/lib/admin-article-resources";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `POST /api/admin/articles/[id]/resources` — request: `{label, fileUrl}`; response:
 * `{status, resource}`. `fileUrl` comes from a prior, separate upload
 * (`POST /api/admin/media/downloads`, T7.5's `encodeDownloadFileUpload`) — this route only
 * ever creates the `article_resource` row pointing at an already-uploaded file, it never
 * itself handles file bytes. Parses the request and shapes the response only — the real
 * validation/creation logic lives in `lib/admin-article-resources.ts`'s `addArticleResource`.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const articleId = Number(idParam);
  if (!Number.isInteger(articleId)) {
    return NextResponse.json({ status: "error", message: "Invalid article id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).label !== "string" ||
    typeof (body as Record<string, unknown>).fileUrl !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }
  const { label, fileUrl } = body as { label: string; fileUrl: string };

  try {
    const resource = await addArticleResource(articleId, { label, fileUrl });
    return NextResponse.json({ status: "ok", resource }, { status: 201 });
  } catch (error) {
    if (error instanceof ArticleResourceValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
