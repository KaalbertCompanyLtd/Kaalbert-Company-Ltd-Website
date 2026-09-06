import { NextResponse } from "next/server";

import { unsubscribeFromInsights } from "@/lib/insights-subscription";

/**
 * insights-engine.md names this interface as `POST /api/insights/unsubscribe`, but describes
 * its actual use as "a one-click link in every sent email" — a plain `<a href>` a mail client
 * renders can only ever issue a `GET` when clicked; nothing in a transactional email can
 * submit a `POST` form. Both methods are implemented here, sharing the same
 * `unsubscribeFromInsights` call: `GET` is what the real emailed link points to (and redirects
 * to a visible confirmation on `/insights`, since a bare JSON response would be all a real
 * visitor's browser ever showed them), `POST` exists for the literal documented interface —
 * e.g. a future "manage your subscription" page that submits a form instead of following a
 * link. See memory/decision-log.md (session 28) for the full reasoning.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token) {
    await unsubscribeFromInsights(token);
  }
  // `request.url` (this request's own origin), never `getSiteUrl()`'s hardcoded production
  // fallback — a redirect after following a link must land back on whichever host actually
  // served the request (dev, a Railway preview, or production), not unconditionally on
  // `kaalbert.com`. That domain isn't registered yet (CLAUDE.local.md), so redirecting there
  // from any non-production environment resolves to nothing (caught for real in session 28's
  // own Playwright verification — the browser couldn't resolve the redirect target at all).
  return NextResponse.redirect(new URL("/insights?unsubscribed=1", request.url));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body && typeof body === "object" ? body.token : undefined;

  if (typeof token !== "string" || !token) {
    return NextResponse.json(
      { status: "error", message: "A subscription token is required." },
      { status: 400 },
    );
  }

  await unsubscribeFromInsights(token);
  return NextResponse.json({ status: "ok" });
}
