import { NextResponse } from "next/server";

import { PageValidationError, updateCapabilitiesPage } from "@/lib/admin-pages";
import type { CapabilitiesPageSaveInput } from "@/lib/admin-pages";

function parseInput(body: unknown): CapabilitiesPageSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.heroKicker !== "string" ||
    typeof c.heroHeading !== "string" ||
    typeof c.heroLead !== "string" ||
    typeof c.metaTitle !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.complianceChecked !== "boolean" ||
    !Array.isArray(c.capabilities)
  ) {
    return null;
  }
  const capabilities = c.capabilities.map((row) => row as Record<string, unknown>);
  if (
    capabilities.some(
      (row) =>
        typeof row.id !== "number" ||
        typeof row.name !== "string" ||
        typeof row.shortDescription !== "string" ||
        typeof row.order !== "number",
    )
  ) {
    return null;
  }

  return {
    heroKicker: c.heroKicker,
    heroHeading: c.heroHeading,
    heroLead: c.heroLead,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    complianceChecked: c.complianceChecked,
    capabilities: capabilities as CapabilitiesPageSaveInput["capabilities"],
  };
}

/**
 * `PATCH /api/admin/pages/capabilities` — request: `CapabilitiesPageSaveInput`; response:
 * `{status}`. Parses the request and shapes the response only — every validation/gating
 * rule lives in `lib/admin-pages.ts`'s `updateCapabilitiesPage`.
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateCapabilitiesPage(input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof PageValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
