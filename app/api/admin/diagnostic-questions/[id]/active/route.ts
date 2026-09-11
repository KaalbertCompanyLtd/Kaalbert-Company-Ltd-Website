import { NextResponse } from "next/server";

import {
  DiagnosticConfigValidationError,
  setDiagnosticQuestionActive,
} from "@/lib/admin-diagnostic";

/**
 * `POST /api/admin/diagnostic-questions/[id]/active` — request: `{active: boolean}`;
 * response: `{status}`. The Questions list screen's own inline toggle — parses the request
 * and shapes the response only, the can't-deactivate-the-last-active-question guard lives in
 * `lib/admin-diagnostic.ts`'s `setDiagnosticQuestionActive`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid question id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const active = (body as Record<string, unknown> | null)?.active;
  if (typeof active !== "boolean") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await setDiagnosticQuestionActive(id, active);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
