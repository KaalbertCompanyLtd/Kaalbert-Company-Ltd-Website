import { NextResponse } from "next/server";

import {
  LandingPageValidationError,
  parseLandingPageContentInput,
  updateLandingPage,
} from "@/lib/admin-landing-pages";

/**
 * `PATCH /api/admin/landing-pages/[slug]` — request: `LandingPageUpdateInput` (every field
 * `POST` takes except `slug`, which is fixed once a page is created — see
 * `updateLandingPage`'s own doc-comment for why); response: `{status}`. Parses the request
 * and shapes the response only — every validation/gating rule lives in
 * `lib/admin-landing-pages.ts`'s `updateLandingPage`.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const body = await request.json().catch(() => null);
  const input = parseLandingPageContentInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateLandingPage(slug, input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof LandingPageValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
