import { NextResponse } from "next/server";

import {
  createLandingPage,
  LandingPageValidationError,
  parseLandingPageContentInput,
} from "@/lib/admin-landing-pages";
import type { LandingPageCreateInput } from "@/lib/admin-landing-pages";

function parseInput(body: unknown): LandingPageCreateInput | null {
  if (!body || typeof body !== "object" || typeof (body as { slug?: unknown }).slug !== "string") {
    return null;
  }
  const content = parseLandingPageContentInput(body);
  if (!content) {
    return null;
  }
  return { slug: (body as { slug: string }).slug, ...content };
}

/**
 * `POST /api/admin/landing-pages` — request: `LandingPageCreateInput`; response:
 * `{status, slug}`. Parses the request and shapes the response only — every validation/
 * gating rule (including the duplicate-slug rejection and the 10.05-compliance gate) lives
 * in `lib/admin-landing-pages.ts`'s `createLandingPage`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const { slug } = await createLandingPage(input);
    return NextResponse.json({ status: "ok", slug }, { status: 201 });
  } catch (error) {
    if (error instanceof LandingPageValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
