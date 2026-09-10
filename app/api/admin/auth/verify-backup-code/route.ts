import { NextResponse } from "next/server";

import { LoginError, verifyBackupCodeLogin } from "@/lib/auth/login";
import { RateLimitError } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * `admin-authentication.md`'s `POST /api/admin/auth/verify-backup-code` — "same shape" as
 * `verify-totp` (that doc's own words): request `{challenge_token, code}`, session cookie
 * set on success. The one real difference: the response body also carries `setup_url` — the
 * forced re-enrolment redirect (T6.4's own Input→Output contract) — since a backup-code
 * login always lands somewhere other than `/admin` on success, unlike `verify-totp`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.challenge_token !== "string" ||
    typeof body.code !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const { session, setupUrl } = await verifyBackupCodeLogin(body.challenge_token, body.code);
    const response = NextResponse.json({ status: "ok", setup_url: setupUrl }, { status: 200 });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 429 });
    }
    if (error instanceof LoginError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
