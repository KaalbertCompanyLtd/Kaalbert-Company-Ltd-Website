import { NextResponse } from "next/server";

import { CategoryValidationError, renameCategory, retireCategory } from "@/lib/categories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

/** `PATCH /api/admin/categories/[id]` — request: `{name}` (rename); response: `{status, category}`. */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ status: "error", message: "Invalid category id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.name !== "string") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const category = await renameCategory(id, body.name);
    return NextResponse.json({ status: "ok", category }, { status: 200 });
  } catch (error) {
    if (error instanceof CategoryValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}

/**
 * `DELETE /api/admin/categories/[id]` — "retire" (`content-management-admin.md`'s own
 * wording). Deletes the `Category` row; `Article.categoryId`'s `onDelete: SetNull`
 * (`prisma/schema.prisma`) leaves every referencing article intact with no category, per
 * that feature doc's own rule.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ status: "error", message: "Invalid category id." }, { status: 400 });
  }

  await retireCategory(id);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
