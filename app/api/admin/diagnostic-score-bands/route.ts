import { NextResponse } from "next/server";

import {
  DiagnosticConfigValidationError,
  updateDiagnosticScoreBands,
} from "@/lib/admin-diagnostic";
import type { DiagnosticScoreBandSaveInput } from "@/lib/admin-diagnostic";

function parseInput(body: unknown): DiagnosticScoreBandSaveInput[] | null {
  if (!Array.isArray(body)) return null;
  const rows: DiagnosticScoreBandSaveInput[] = [];
  for (const row of body) {
    const r = row as Record<string, unknown>;
    if (
      typeof r.id !== "number" ||
      typeof r.minScore !== "number" ||
      typeof r.label !== "string" ||
      typeof r.statement !== "string" ||
      typeof r.emailDetail !== "string" ||
      typeof r.isPlaceholder !== "boolean"
    ) {
      return null;
    }
    rows.push({
      id: r.id,
      minScore: r.minScore,
      label: r.label,
      statement: r.statement,
      emailDetail: r.emailDetail,
      isPlaceholder: r.isPlaceholder,
    });
  }
  return rows;
}

/**
 * `PATCH /api/admin/diagnostic-score-bands` — request: `DiagnosticScoreBandSaveInput[]`;
 * response: `{status}`. One combined route for the fixed 4-band set (no add/remove), same
 * "one screen action, one request" reasoning as `PATCH /api/admin/diagnostic-configuration`
 * — the feature doc's own sketched `PATCH /api/admin/diagnostic-score-bands/[id]` would need
 * 4 requests for what this screen treats as a single save. Parses the request and shapes the
 * response only — every validation rule lives in `lib/admin-diagnostic.ts`'s
 * `updateDiagnosticScoreBands`.
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
    await updateDiagnosticScoreBands(input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
