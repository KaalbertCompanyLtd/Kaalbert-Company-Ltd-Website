import { NextResponse } from "next/server";

import { OfferValidationError, updateAdvisoryRetainer } from "@/lib/admin-offers";
import type { AdvisoryRetainerSaveInput } from "@/lib/admin-offers";

function parseInput(body: unknown): AdvisoryRetainerSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.feeAmount !== "number" ||
    typeof c.feeCurrency !== "string" ||
    typeof c.billingPeriod !== "string" ||
    typeof c.description !== "string" ||
    typeof c.complianceChecked !== "boolean"
  ) {
    return null;
  }
  return {
    feeAmount: c.feeAmount,
    feeCurrency: c.feeCurrency,
    billingPeriod: c.billingPeriod,
    description: c.description,
    complianceChecked: c.complianceChecked,
  };
}

/**
 * `PATCH /api/admin/advisory-retainer` — request: `AdvisoryRetainerSaveInput`; response:
 * `{status}`. `AdvisoryRetainer` is a singleton (`capabilities-page.md`'s own model), edited
 * on the same Offers screen as the three core offers (`content-management-admin.md`'s User
 * flow step 5) but through its own route since it isn't slug-keyed like `Offer`.
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
    await updateAdvisoryRetainer(input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof OfferValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
