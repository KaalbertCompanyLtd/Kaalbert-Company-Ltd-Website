import { NextResponse } from "next/server";

import { LegalValidationError, updateLegalPage } from "@/lib/admin-legal";
import type { LegalPageSaveInput } from "@/lib/admin-legal";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

function parseInput(body: unknown): LegalPageSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.title !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.isPlaceholder !== "boolean" ||
    !Array.isArray(c.body)
  ) {
    return null;
  }
  return {
    title: c.title,
    metaDescription: c.metaDescription,
    isPlaceholder: c.isPlaceholder,
    body: c.body as LegalPageSaveInput["body"],
  };
}

/**
 * `PATCH /api/admin/legal/[slug]` — request: `LegalPageSaveInput`; response: `{status}`.
 * Parses the request and shapes the response only — every validation rule lives in
 * `lib/admin-legal.ts`'s `updateLegalPage`.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateLegalPage(slug, input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof LegalValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
