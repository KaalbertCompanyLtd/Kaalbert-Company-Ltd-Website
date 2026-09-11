import { NextResponse } from "next/server";

import { LegalValidationError, updateFooterContent } from "@/lib/admin-legal";

/**
 * `PATCH /api/admin/footer-content` — request: `{scopeOfPracticeStatement,
 * companyRegistrationDetails}`; response: `{status}`. Parses the request and shapes the
 * response only — every validation rule lives in `lib/admin-legal.ts`'s
 * `updateFooterContent`.
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.scopeOfPracticeStatement !== "string" ||
    (body.companyRegistrationDetails !== null &&
      typeof body.companyRegistrationDetails !== "string")
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateFooterContent({
      scopeOfPracticeStatement: body.scopeOfPracticeStatement,
      companyRegistrationDetails: body.companyRegistrationDetails,
    });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof LegalValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
