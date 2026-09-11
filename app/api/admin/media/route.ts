import { NextResponse } from "next/server";

import { encodeImageUpload, MediaValidationError } from "@/lib/media-storage";

/**
 * `POST /api/admin/media` — request: `multipart/form-data` with a single `file` field;
 * response: `{status, url}`. Used by the article editor's preview-image picker and figure
 * blocks (T7.2); reused as-is by T7.5 (landing-page download file) and T7.6 (author photo)
 * per `memory/technical-debt.md`. Parses the upload and shapes the response only — the real
 * validation/encoding rule lives in `lib/media-storage.ts` (CLAUDE.md's "business logic lives
 * in `lib/`" rule).
 */
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { status: "error", message: "No file was uploaded." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = encodeImageUpload({ buffer, contentType: file.type });
    return NextResponse.json({ status: "ok", url }, { status: 200 });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
