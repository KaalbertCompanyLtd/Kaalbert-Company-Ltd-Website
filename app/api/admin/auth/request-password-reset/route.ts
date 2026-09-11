import { NextResponse } from "next/server";

import { RateLimitError } from "@/lib/auth/rate-limit";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { getSiteUrl } from "@/lib/seo";

const GENERIC_MESSAGE = "If an account exists for that email, a reset link has been sent.";

/**
 * `POST /api/admin/auth/request-password-reset` (T6.7) — request: `{email}`; response is
 * always the same generic `{status: "ok", message}` shape, regardless of whether the email
 * matches a real account — `requestPasswordReset`'s own no-account-enumeration rule. Parses
 * the request body and shapes the response only; every real rule lives in
 * `lib/auth/password-reset.ts` (CLAUDE.md's "business logic lives in `lib/`" rule).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || typeof body.email !== "string") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await requestPasswordReset(body.email, { baseUrl: getSiteUrl() });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 429 });
    }
    throw error;
  }

  return NextResponse.json({ status: "ok", message: GENERIC_MESSAGE }, { status: 200 });
}
