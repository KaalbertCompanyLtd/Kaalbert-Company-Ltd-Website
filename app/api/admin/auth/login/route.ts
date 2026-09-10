import { NextResponse } from "next/server";

import { LoginError, loginWithPassword } from "@/lib/auth/login";
import { RateLimitError } from "@/lib/auth/rate-limit";

/**
 * `admin-authentication.md`'s `POST /api/admin/auth/login` — request: `{email, password}`;
 * response: a challenge token requiring a subsequent TOTP step, never a session. Parses the
 * request body and shapes the response only; every real rule (rate limiting, password
 * verification, challenge-token issuance) lives in `lib/auth/login.ts` (CLAUDE.md's
 * "business logic lives in `lib/`" rule).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const challengeToken = await loginWithPassword(body.email, body.password);
    return NextResponse.json({ status: "ok", challenge_token: challengeToken }, { status: 200 });
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
