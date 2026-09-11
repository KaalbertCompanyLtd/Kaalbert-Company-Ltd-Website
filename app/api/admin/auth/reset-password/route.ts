import { NextResponse } from "next/server";

import { confirmPasswordReset, PasswordResetError } from "@/lib/auth/password-reset";
import { RateLimitError } from "@/lib/auth/rate-limit";

/**
 * `POST /api/admin/auth/reset-password` (T6.7) — request: `{token, password}`; response:
 * `{status: "ok"}` on success. Parses the request body and shapes the response only; every
 * real rule (token validity, password-length validation, rate limiting, the actual write)
 * lives in `lib/auth/password-reset.ts` (CLAUDE.md's "business logic lives in `lib/`" rule).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.token !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await confirmPasswordReset(body.token, body.password);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 429 });
    }
    if (error instanceof PasswordResetError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
