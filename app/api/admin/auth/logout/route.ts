import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, destroySession } from "@/lib/auth/session";

/**
 * `POST /api/admin/auth/logout` — new at session 60, closing the gap the sidebar's own former
 * placeholder comment named directly ("no admin session exists until Milestone 6 wires real
 * auth... these two lines are structural placeholders") but nobody ever came back to build: a
 * real session existed from Milestone 6 onward with no way to end it from inside the app.
 * Destroys the session row server-side (`destroySession`, same mechanism
 * `confirmPasswordReset`/`deactivateAdminUser` already use to invalidate a session) and clears
 * the cookie — `path: "/"` matches exactly how `verify-totp`/`verify-backup-code` set it, since
 * a clear with a different `path` silently fails to remove the original cookie.
 */
export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySession(token);
  }

  const response = NextResponse.json({ status: "ok" }, { status: 200 });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
