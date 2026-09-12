import { NextResponse } from "next/server";

import { deletePersonalData, EnquiryWriteValidationError } from "@/lib/admin-enquiries";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

/**
 * `DELETE /api/admin/enquiries/[id]/personal-data` (T8.4, FR-6.4) — no request body;
 * response: `{status: "ok"}`. Applied identically regardless of `status` (the firm confirmed
 * at T8.4 that a `converted` enquiry gets no special treatment — see
 * `memory/decision-log.md`). Every real rule (the enquiry existing, what actually gets nulled)
 * lives in `lib/admin-enquiries.ts`'s `deletePersonalData`, same split as this resource's own
 * `PATCH` handler.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ status: "error", message: "Invalid enquiry id." }, { status: 400 });
  }

  try {
    await deletePersonalData(id);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof EnquiryWriteValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
