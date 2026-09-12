import { NextResponse } from "next/server";

import { EnquiryStatus } from "@/generated/prisma/client";
import { EnquiryUpdateValidationError, updateEnquiry } from "@/lib/admin-enquiries";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

/**
 * `PATCH /api/admin/enquiries/[id]` (T8.3) — request: `{status, internalNotes, assignedPartnerId}`;
 * response: `{status: "ok"}`. Shape-checks the body only — every real validation rule
 * (a genuine `EnquiryStatus`, a genuine `admin_user` id, the enquiry itself existing) lives in
 * `lib/admin-enquiries.ts`'s `updateEnquiry`, same split as every other admin `PATCH` route in
 * this project (`app/api/admin/categories/[id]/route.ts`, `app/api/admin/articles/[id]/route.ts`).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ status: "error", message: "Invalid enquiry id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.status !== "string" ||
    !(body.status in EnquiryStatus) ||
    (body.internalNotes !== null && typeof body.internalNotes !== "string") ||
    (body.assignedPartnerId !== null && typeof body.assignedPartnerId !== "number")
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateEnquiry(id, {
      status: body.status as EnquiryStatus,
      internalNotes: body.internalNotes,
      assignedPartnerId: body.assignedPartnerId,
    });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof EnquiryUpdateValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
