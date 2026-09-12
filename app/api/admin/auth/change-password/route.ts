import { NextResponse } from "next/server";

import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { ChangePasswordError, changeOwnPassword } from "@/lib/auth/change-password";

/**
 * `PATCH /api/admin/auth/change-password` — request: `{currentPassword, newPassword}`;
 * response: `{status}`. Session-gated only, no Owner requirement — everyone manages their
 * own password. Sits under `/api/admin/auth/*`, which `proxy.ts` deliberately treats as
 * public (that's how a session gets created in the first place) — so this route has to check
 * for a real session itself rather than relying on `proxy.ts` to have already done it.
 */
export async function PATCH(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json(
      { status: "error", message: "Authentication required." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { currentPassword?: unknown }).currentPassword !== "string" ||
    typeof (body as { newPassword?: unknown }).newPassword !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = body as {
    currentPassword: string;
    newPassword: string;
  };

  try {
    await changeOwnPassword(currentUser.id, currentPassword, newPassword);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof ChangePasswordError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
