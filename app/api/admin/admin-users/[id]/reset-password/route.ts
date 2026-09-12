import { NextResponse } from "next/server";

import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionError, resetAdminUserPassword } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/reset-password` — response: `{status, url}`. Issues a
 * fresh `/admin/reset-password` link (`lib/auth/password-reset.ts`'s
 * `issuePasswordResetToken`) for an *existing* account whose partner lost email access too,
 * not just their password — T6.7's own self-service flow only covers the case where the
 * partner still has their own inbox. The admin relays the returned link out of band.
 *
 * Owner-only guard added at session 60 — a partner with working email already has two
 * self-service paths (`/admin/forgot-password`, `/admin/account`'s in-session change-
 * password), so this route is only ever for resetting *someone else's* password.
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
    const url = await resetAdminUserPassword(id);
    return NextResponse.json({ status: "ok", url }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
