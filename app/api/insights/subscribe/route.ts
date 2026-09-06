import { NextResponse } from "next/server";

import { SubscriptionValidationError, subscribeToInsights } from "@/lib/insights-subscription";

/**
 * insights-engine.md's `POST /api/insights/subscribe` — request: `{email, consent}`; response:
 * `{status}`. Parses the request body and shapes the response only; validation and the actual
 * `subscriber` write live in `lib/insights-subscription.ts` (CLAUDE.md).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await subscribeToInsights({
      email: body.email,
      consent: body.consent === true,
    });

    return NextResponse.json({ status: "ok" }, { status: 201 });
  } catch (error) {
    if (error instanceof SubscriptionValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
