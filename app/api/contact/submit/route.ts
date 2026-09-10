import { NextResponse } from "next/server";

import { ContactValidationError, createContactEnquiry } from "@/lib/enquiries";

/**
 * contact-and-enquiry.md's `POST /api/contact/submit` — request:
 * `{name, email, phone?, message, service?, contact_consent, marketing_consent?, attribution?}`;
 * response: `{status, enquiry_id}`. `attribution` (added T5.4) is the untrusted client
 * payload from `lib/attribution-client.ts`'s `getStoredAttribution()` — parsed and resolved
 * to a real `attribution_id` inside `lib/enquiries.ts`, never trusted or validated here.
 * Parses the request body and shapes the response only; validation and the actual
 * `enquiry_record` write live in `lib/enquiries.ts` (CLAUDE.md).
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
      attribution: body.attribution,
    });

    return NextResponse.json({ status: "ok", enquiry_id: enquiry.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
