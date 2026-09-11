import { NextResponse } from "next/server";

import { PageValidationError, updateOurMethodPage } from "@/lib/admin-pages";
import type { OurMethodPageSaveInput } from "@/lib/admin-pages";

function parseInput(body: unknown): OurMethodPageSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.heroKicker !== "string" ||
    typeof c.heroHeading !== "string" ||
    typeof c.heroLead !== "string" ||
    typeof c.introCopy !== "string" ||
    typeof c.metaTitle !== "string" ||
    typeof c.metaDescription !== "string" ||
    typeof c.complianceChecked !== "boolean" ||
    !Array.isArray(c.stages)
  ) {
    return null;
  }
  const stages = c.stages.map((row) => row as Record<string, unknown>);
  if (
    stages.some(
      (row) =>
        typeof row.id !== "number" ||
        typeof row.description !== "string" ||
        typeof row.whatHappens !== "string" ||
        typeof row.clientSees !== "string" ||
        typeof row.decisionPoint !== "string" ||
        (row.capabilityTransferNote !== null && typeof row.capabilityTransferNote !== "string"),
    )
  ) {
    return null;
  }

  return {
    heroKicker: c.heroKicker,
    heroHeading: c.heroHeading,
    heroLead: c.heroLead,
    introCopy: c.introCopy,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    complianceChecked: c.complianceChecked,
    stages: stages as OurMethodPageSaveInput["stages"],
  };
}

/**
 * `PATCH /api/admin/pages/our-method` — request: `OurMethodPageSaveInput`; response:
 * `{status}`. Parses the request and shapes the response only — every validation/gating
 * rule lives in `lib/admin-pages.ts`'s `updateOurMethodPage`.
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
    await updateOurMethodPage(input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof PageValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
