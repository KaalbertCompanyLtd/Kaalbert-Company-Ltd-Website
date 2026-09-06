import { NextResponse } from "next/server";

import {
  DiagnosticSummaryRequestValidationError,
  requestDiagnosticSummary,
} from "@/lib/diagnostic-request-summary";

/**
 * business-health-check-diagnostic.md's `POST /api/diagnostic/request-summary` — request:
 * `{enquiry_id, name, email, phone?, contact_consent, marketing_consent}`; response:
 * `{status}`. Parses the request body and shapes the response only; consent validation, the
 * `enquiry_record` update, and the email send live in `lib/diagnostic-request-summary.ts`
 * (CLAUDE.md).
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
    await requestDiagnosticSummary({
      enquiryId: Number(body.enquiry_id),
      name: body.name,
      email: body.email,
      phone: body.phone,
      contactConsent: body.contact_consent === true,
      marketingConsent: body.marketing_consent === true,
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticSummaryRequestValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
