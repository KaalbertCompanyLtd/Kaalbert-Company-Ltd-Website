import { NextResponse } from "next/server";

import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionError, setAdminUserActive } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/reactivate` — response: `{status}`. The reverse of
 * `POST /api/admin/admin-users/[id]/deactivate` — `lib/auth/session.ts`'s new
 * `reactivateAdminUser` (T7.6).
 *
 * Owner-only guard added at session 60 — see `deactivate/route.ts`'s own doc-comment.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    await setAdminUserActive(id, true, currentUser.id);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
