import { NextResponse } from "next/server";

import { AdminRole } from "@/generated/prisma/client";
import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import {
  type CreatePartnerAccountInput,
  CreatePartnerError,
  createPartnerAccount,
} from "@/lib/admin-team";

function parseRole(value: unknown): AdminRole | null {
  return value === "OWNER" || value === "PARTNER" ? value : null;
}

function parseInput(body: unknown): CreatePartnerAccountInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const role = parseRole(b.role);
  if (!role || typeof b.email !== "string") return null;

  if (b.mode === "link") {
    if (typeof b.authorId !== "number") return null;
    return { mode: "link", email: b.email, role, authorId: b.authorId };
  }

  if (b.mode === "create") {
    if (
      typeof b.name !== "string" ||
      typeof b.title !== "string" ||
      typeof b.practiceArea !== "string" ||
      typeof b.personalStatement !== "string" ||
      typeof b.bio !== "string" ||
      (b.photoUrl !== null && typeof b.photoUrl !== "string") ||
      (b.credentials !== null && typeof b.credentials !== "string")
    ) {
      return null;
    }
    return {
      mode: "create",
      email: b.email,
      role,
      name: b.name,
      photoUrl: b.photoUrl,
      title: b.title,
      practiceArea: b.practiceArea,
      credentials: b.credentials,
      personalStatement: b.personalStatement,
      bio: b.bio,
    };
  }

  return null;
}

/**
 * `POST /api/admin/team` — Owner-only. Creates a real login, either linking it to an
 * existing `Author` profile or creating a brand-new one, per `lib/admin-team.ts`'s
 * `createPartnerAccount`. Response: `{status, emailSent, setupUrl?, password?}` — the last
 * two only present when the invite email failed to send (see that function's own
 * doc-comment).
 */
export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser || !isOwner(currentUser)) {
    return NextResponse.json(
      { status: "error", message: "Owner access required." },
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
    const result = await createPartnerAccount(input);
    return NextResponse.json({ status: "ok", ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof CreatePartnerError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
