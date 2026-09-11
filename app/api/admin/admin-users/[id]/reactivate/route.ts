import { NextResponse } from "next/server";

import { AdminUserActionError, setAdminUserActive } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/reactivate` — response: `{status}`. The reverse of
 * `POST /api/admin/admin-users/[id]/deactivate` — `lib/auth/session.ts`'s new
 * `reactivateAdminUser` (T7.6).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid account id." }, { status: 400 });
  }

  try {
    await setAdminUserActive(id, true);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
