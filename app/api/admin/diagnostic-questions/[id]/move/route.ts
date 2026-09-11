import { NextResponse } from "next/server";

import { DiagnosticConfigValidationError, moveDiagnosticQuestion } from "@/lib/admin-diagnostic";

/**
 * `POST /api/admin/diagnostic-questions/[id]/move` — request: `{direction: "up" | "down"}`;
 * response: `{status}`. Parses the request and shapes the response only — the reorder logic
 * (a 3-step order swap, safe against the `@@unique([dimensionId, order])` constraint) lives
 * in `lib/admin-diagnostic.ts`'s `moveDiagnosticQuestion`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid question id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const direction = (body as Record<string, unknown> | null)?.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await moveDiagnosticQuestion(id, direction);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
