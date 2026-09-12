import { NextResponse } from "next/server";

import { AdminRole } from "@/generated/prisma/client";
import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionError, setAdminUserRole } from "@/lib/admin-authors";

function parseRole(value: unknown): AdminRole | null {
  return value === "OWNER" || value === "PARTNER" ? value : null;
}

/**
 * `PATCH /api/admin/admin-users/[id]/role` — request: `{role: "OWNER" | "PARTNER"}`;
 * response: `{status}`. New at session 60, alongside `AdminUser.role` finally becoming a
 * real, checked enum — every validation/gating rule (including the "can't demote the last
 * Owner" guard) lives in `lib/admin-authors.ts`'s `setAdminUserRole`.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid account id." }, { status: 400 });
  }

  const currentUser = await getCurrentAdminUser();
  if (!currentUser || !isOwner(currentUser)) {
    return NextResponse.json(
      { status: "error", message: "Owner access required." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const role =
    body && typeof body === "object" ? parseRole((body as { role?: unknown }).role) : null;
  if (!role) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await setAdminUserRole(id, role);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
