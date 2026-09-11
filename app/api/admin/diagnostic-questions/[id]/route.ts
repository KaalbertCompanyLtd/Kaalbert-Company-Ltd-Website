import { NextResponse } from "next/server";

import { DiagnosticConfigValidationError, updateDiagnosticQuestion } from "@/lib/admin-diagnostic";
import type { DiagnosticChoiceOptionInput } from "@/lib/admin-diagnostic";

const INVALID = Symbol("invalid");

function parseChoiceOptions(value: unknown): DiagnosticChoiceOptionInput[] | null | typeof INVALID {
  if (value === null) return null;
  if (!Array.isArray(value)) return INVALID;
  const options: DiagnosticChoiceOptionInput[] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (typeof r.label !== "string" || typeof r.value !== "string") return INVALID;
    options.push({ label: r.label, value: r.value });
  }
  return options;
}

interface UpdateInput {
  promptText: string;
  active: boolean;
  isPlaceholder: boolean;
  choiceOptions: DiagnosticChoiceOptionInput[] | null;
}

function parseInput(body: unknown): UpdateInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.promptText !== "string" ||
    typeof c.active !== "boolean" ||
    typeof c.isPlaceholder !== "boolean"
  ) {
    return null;
  }
  const choiceOptions = parseChoiceOptions(c.choiceOptions);
  if (choiceOptions === INVALID) {
    return null;
  }
  return {
    promptText: c.promptText,
    active: c.active,
    isPlaceholder: c.isPlaceholder,
    choiceOptions,
  };
}

/**
 * `PATCH /api/admin/diagnostic-questions/[id]` — request: `{promptText, active,
 * isPlaceholder, choiceOptions}`; response: `{status}`. Parses the request and shapes the
 * response only — every validation/gating rule (including the can't-deactivate-the-last-
 * active-question check) lives in `lib/admin-diagnostic.ts`'s `updateDiagnosticQuestion`.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ status: "error", message: "Invalid question id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateDiagnosticQuestion(id, input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
