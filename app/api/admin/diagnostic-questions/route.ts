import { NextResponse } from "next/server";

import { DiagnosticResponseType } from "../../../../generated/prisma/client";
import { createDiagnosticQuestion, DiagnosticConfigValidationError } from "@/lib/admin-diagnostic";
import type {
  DiagnosticChoiceOptionInput,
  DiagnosticQuestionCreateInput,
} from "@/lib/admin-diagnostic";

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

function parseInput(body: unknown): DiagnosticQuestionCreateInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;
  if (
    typeof c.dimensionId !== "number" ||
    typeof c.promptText !== "string" ||
    typeof c.responseType !== "string" ||
    !Object.values(DiagnosticResponseType).includes(c.responseType as DiagnosticResponseType) ||
    typeof c.isPlaceholder !== "boolean"
  ) {
    return null;
  }

  const choiceOptions = parseChoiceOptions(c.choiceOptions);
  if (choiceOptions === INVALID) {
    return null;
  }

  return {
    dimensionId: c.dimensionId,
    promptText: c.promptText,
    responseType: c.responseType as DiagnosticResponseType,
    choiceOptions,
    isPlaceholder: c.isPlaceholder,
  };
}

/**
 * `POST /api/admin/diagnostic-questions` — request: `DiagnosticQuestionCreateInput`;
 * response: `{status, id}`. Parses the request and shapes the response only — every
 * validation/gating rule lives in `lib/admin-diagnostic.ts`'s `createDiagnosticQuestion`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const { id } = await createDiagnosticQuestion(input);
    return NextResponse.json({ status: "ok", id }, { status: 201 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
