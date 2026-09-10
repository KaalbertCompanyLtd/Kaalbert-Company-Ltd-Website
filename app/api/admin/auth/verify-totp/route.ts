import { NextResponse } from "next/server";

import { LoginError, verifyTotpLogin } from "@/lib/auth/login";
import { RateLimitError } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * `admin-authentication.md`'s `POST /api/admin/auth/verify-totp` — request:
 * `{challenge_token, code}`; response: session cookie set on success, the only place in this
 * codebase a real admin session is ever issued (`lib/auth/session.ts`'s `createSession`, via
 * `lib/auth/login.ts`'s `verifyTotpLogin`). `httpOnly`/`sameSite: "lax"`/`path: "/"` so the
 * same cookie also protects future `/api/admin/*` content routes (Milestone 7), not just
 * `/admin/*` pages; `secure` is conditional on `NODE_ENV` so this still works over plain
 * `http://localhost` in local dev.
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
    const { token, expiresAt } = await verifyTotpLogin(body.challenge_token, body.code);
    const response = NextResponse.json({ status: "ok" }, { status: 200 });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
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
