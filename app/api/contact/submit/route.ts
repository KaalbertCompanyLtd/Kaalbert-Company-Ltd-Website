import { NextResponse } from "next/server";

import { ContactValidationError, createContactEnquiry } from "@/lib/enquiries";

/**
 * contact-and-enquiry.md's `POST /api/contact/submit` — request:
 * `{name, email, phone?, message, service?, contact_consent, marketing_consent?}`; response:
 * `{status, enquiry_id}`. Parses the request body and shapes the response only; validation
 * and the actual `enquiry_record` write live in `lib/enquiries.ts` (CLAUDE.md).
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
    const enquiry = await createContactEnquiry({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      service: body.service,
      contactConsent: body.contact_consent === true,
      marketingConsent: body.marketing_consent === true,
    });

    return NextResponse.json({ status: "ok", enquiry_id: enquiry.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
