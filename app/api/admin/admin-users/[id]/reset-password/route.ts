import { NextResponse } from "next/server";

import { AdminUserActionError, resetAdminUserPassword } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/reset-password` — response: `{status, url}`. Issues a
 * fresh `/admin/reset-password` link (`lib/auth/password-reset.ts`'s
 * `issuePasswordResetToken`) for an *existing* account whose partner lost email access too,
 * not just their password — T6.7's own self-service flow only covers the case where the
 * partner still has their own inbox. The admin relays the returned link out of band.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid account id." }, { status: 400 });
  }

  try {
    const url = await resetAdminUserPassword(id);
    return NextResponse.json({ status: "ok", url }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
