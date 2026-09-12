import { NextResponse } from "next/server";

import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { issueSetupToken } from "@/lib/auth/totp-setup";
import { getSiteUrl } from "@/lib/seo";

/**
 * `POST /api/admin/auth/reissue-2fa-setup` — response: `{status, setupUrl}`. Session-gated
 * only, no Owner requirement — `/admin/account`'s "Set up a new device" voluntary action
 * (session 60), for switching phones/authenticator apps, not recovery. Reuses the exact same
 * `issueSetupToken` mechanism an Owner-issued reset already calls
 * (`app/api/admin/admin-users/[id]/reset-2fa/route.ts`) — just self-triggered here instead of
 * requested from someone else. Landing on `/admin/setup-2fa?token=...` while already
 * logged in works the same as it does for anyone else — that page has no session check of
 * its own, by design (it's how a session gets its 2FA in the first place).
 */
export async function POST() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json(
      { status: "error", message: "Authentication required." },
      { status: 401 },
    );
  }

  const setupUrl = await issueSetupToken(currentUser.id, { baseUrl: getSiteUrl() });
  return NextResponse.json({ status: "ok", setupUrl }, { status: 200 });
}
