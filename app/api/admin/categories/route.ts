import { NextResponse } from "next/server";

import { CategoryValidationError, createCategory } from "@/lib/categories";

/**
 * `POST /api/admin/categories` — request: `{name}`; response: `{status, category}`. Parses
 * the request and shapes the response only — the duplicate-slug rule lives in
 * `lib/categories.ts`'s `createCategory`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || typeof body.name !== "string") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const category = await createCategory(body.name);
    return NextResponse.json({ status: "ok", category }, { status: 201 });
  } catch (error) {
    if (error instanceof CategoryValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
