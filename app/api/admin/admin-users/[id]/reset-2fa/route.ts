import { NextResponse } from "next/server";

import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionError, resetAdminUserTotp } from "@/lib/admin-authors";

/**
 * `POST /api/admin/admin-users/[id]/reset-2fa` — response: `{status, url}`. Issues a fresh
 * `/admin/setup-2fa` link (`lib/auth/totp-setup.ts`'s `issueSetupToken`) for an *existing*
 * account whose partner lost their authenticator device and backup codes both
 * (`admin-authentication.md`'s edge case: "requires another administrator to reset 2FA
 * enrolment") — the admin relays the returned link to that partner.
 *
 * Owner-only guard added at session 60 — a partner voluntarily re-enrolling their *own*
 * device now has a genuine self-service path (`/admin/account`'s "Set up a new device"),
 * so this route is only ever for resetting *someone else's* 2FA.
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
    const url = await resetAdminUserTotp(id);
    return NextResponse.json({ status: "ok", url }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminUserActionError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 404 });
    }
    throw error;
  }
}
