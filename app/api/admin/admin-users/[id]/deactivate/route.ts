import { NextResponse } from "next/server";

import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionError, setAdminUserActive } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/deactivate` — response: `{status}`. `admin-
 * authentication.md`'s own edge case; `lib/auth/session.ts`'s `deactivateAdminUser` already
 * deletes every live session for the account in the same transaction — this route just
 * triggers it for an *existing* account (T7.6's session-42 addendum).
 *
 * Owner-only guard added at session 60 — this route previously had zero caller-identity
 * check, so any signed-in partner could deactivate any other partner's account.
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
    await setAdminUserActive(id, false, currentUser.id);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
