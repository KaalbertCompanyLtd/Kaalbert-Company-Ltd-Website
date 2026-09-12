import { NextResponse } from "next/server";

import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { regenerateBackupCodes } from "@/lib/auth/backup-codes";

/**
 * `POST /api/admin/auth/regenerate-backup-codes` — response: `{status, codes}`. Session-gated
 * only, no Owner requirement — `/admin/account`'s voluntary "Regenerate backup codes" action
 * (session 60), for a partner who's used most of theirs or thinks they've been exposed.
 * `codes` is the one and only time this batch's plaintext values ever leave the server —
 * shown once on the page, never persisted anywhere but the hashes.
 */
export async function POST() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json(
      { status: "error", message: "Authentication required." },
      { status: 401 },
    );
  }

  const codes = await regenerateBackupCodes(currentUser.id);
  return NextResponse.json({ status: "ok", codes }, { status: 200 });
}
