import { NextResponse } from "next/server";

import { createLandingPage, LandingPageValidationError } from "@/lib/admin-landing-pages";
import type { LandingPageCreateInput } from "@/lib/admin-landing-pages";
import type { LandingPageBodyBlock } from "@/lib/landing-pages";

function parseBodyBlock(row: Record<string, unknown>): LandingPageBodyBlock | null {
  switch (row.kind) {
    case "heading":
    case "paragraph":
      return typeof row.text === "string" ? { kind: row.kind, text: row.text } : null;
    case "list": {
      if (!Array.isArray(row.items) || row.items.some((v) => typeof v !== "string")) return null;
      return { kind: "list", items: row.items as string[] };
    }
    case "stats": {
      if (!Array.isArray(row.items)) return null;
      const items: { value: string; label: string }[] = [];
      for (const item of row.items) {
        const i = item as Record<string, unknown>;
        if (typeof i.value !== "string" || typeof i.label !== "string") return null;
        items.push({ value: i.value, label: i.label });
      }
      return { kind: "stats", items };
    }
    case "steps": {
      if (!Array.isArray(row.items)) return null;
      const items: { title: string; description: string }[] = [];
      for (const item of row.items) {
        const i = item as Record<string, unknown>;
        if (typeof i.title !== "string" || typeof i.description !== "string") return null;
        items.push({ title: i.title, description: i.description });
      }
      return { kind: "steps", items };
    }
    default:
      return null;
  }
}

function parseInput(body: unknown): LandingPageCreateInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;

  if (
    typeof c.slug !== "string" ||
    typeof c.kicker !== "string" ||
    typeof c.headline !== "string" ||
    typeof c.openingParagraph !== "string" ||
    !Array.isArray(c.bodyContent) ||
    typeof c.ctaLabel !== "string" ||
    typeof c.ctaHref !== "string" ||
    (c.downloadFileUrl !== null && typeof c.downloadFileUrl !== "string") ||
    typeof c.campaignReference !== "string" ||
    typeof c.metaTitle !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.complianceChecked !== "boolean"
  ) {
    return null;
  }

  const bodyContent: LandingPageBodyBlock[] = [];
  for (const row of c.bodyContent) {
    const block = parseBodyBlock(row as Record<string, unknown>);
    if (!block) return null;
    bodyContent.push(block);
  }

  return {
    slug: c.slug,
    kicker: c.kicker,
    headline: c.headline,
    openingParagraph: c.openingParagraph,
    bodyContent,
    ctaLabel: c.ctaLabel,
    ctaHref: c.ctaHref,
    downloadFileUrl: c.downloadFileUrl as string | null,
    campaignReference: c.campaignReference,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    complianceChecked: c.complianceChecked,
  };
}

/**
 * `POST /api/admin/landing-pages` — request: `LandingPageCreateInput`; response:
 * `{status, slug}`. Create-only, per `landing-page-template.md`'s own Interfaces line —
 * parses the request and shapes the response only, every validation/gating rule (including
 * the duplicate-slug rejection and the 10.05-compliance gate) lives in
 * `lib/admin-landing-pages.ts`'s `createLandingPage`.
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
