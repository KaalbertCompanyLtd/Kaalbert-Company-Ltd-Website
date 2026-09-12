import { NextResponse } from "next/server";

import { canEditAuthorProfile, getCurrentAdminUser } from "@/lib/auth/current-user";
import { AuthorValidationError, updateAuthor } from "@/lib/admin-authors";
import type { AuthorSaveInput } from "@/lib/admin-authors";

function parseInput(body: unknown): AuthorSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.name !== "string" ||
    (c.photoUrl !== null && typeof c.photoUrl !== "string") ||
    typeof c.title !== "string" ||
    typeof c.practiceArea !== "string" ||
    (c.credentials !== null && typeof c.credentials !== "string") ||
    typeof c.personalStatement !== "string" ||
    typeof c.bio !== "string" ||
    typeof c.order !== "number" ||
    typeof c.published !== "boolean"
  ) {
    return null;
  }
  return {
    name: c.name,
    photoUrl: c.photoUrl as string | null,
    title: c.title,
    practiceArea: c.practiceArea,
    credentials: c.credentials as string | null,
    personalStatement: c.personalStatement,
    bio: c.bio,
    order: c.order,
    published: c.published,
  };
}

/**
 * `PATCH /api/admin/authors/[id]` — request: `AuthorSaveInput`; response: `{status}`. Parses
 * the request and shapes the response only — every validation/gating rule lives in
 * `lib/admin-authors.ts`'s `updateAuthor`.
 *
 * Owner-or-self guard added at session 60 — this route previously let any signed-in partner
 * edit any other partner's entry, with nothing checking who was asking
 * (`memory/decision-log.md`'s T7.6 entry records that as a deliberate, now-reversed call).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid author id." }, { status: 400 });
  }

  const currentUser = await getCurrentAdminUser();
  if (!canEditAuthorProfile(currentUser, id)) {
    return NextResponse.json(
      { status: "error", message: "You can only edit your own profile." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateAuthor(id, input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
