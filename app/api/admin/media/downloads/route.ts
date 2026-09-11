import { NextResponse } from "next/server";

import { encodeDownloadFileUpload, MediaValidationError } from "@/lib/media-storage";

/**
 * `POST /api/admin/media/downloads` — request: `multipart/form-data` with a single `file`
 * field; response: `{status, url}`. Sibling to `POST /api/admin/media` (T7.2, image-only) —
 * used by the Landing Pages admin editor's optional checklist-download upload (T7.5). Parses
 * the upload and shapes the response only — the real validation/encoding rule lives in
 * `lib/media-storage.ts` (CLAUDE.md's "business logic lives in `lib/`" rule).
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
    const url = encodeDownloadFileUpload({ buffer, contentType: file.type });
    return NextResponse.json({ status: "ok", url }, { status: 200 });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
