import { NextResponse } from "next/server";

import { DiagnosticConfigurationError, DiagnosticValidationError } from "@/lib/diagnostic-scoring";
import { submitDiagnosticResponses } from "@/lib/diagnostic-submit";

/**
 * business-health-check-diagnostic.md's `POST /api/diagnostic/submit` — request: a bare JSON
 * array of `{question_id, answer}` (not wrapped in an object — matches
 * `components/diagnostic-flow.tsx`'s own POST body exactly); response: `{score,
 * dimension_scores, weakest_dimensions, indicative_cost_statement, enquiry_id}`. Parses the
 * request body and shapes the response only; scoring and the `enquiry_record`/
 * `diagnostic_response` writes live in `lib/diagnostic-submit.ts` (CLAUDE.md).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const answers = body.map((item: { question_id?: unknown; answer?: unknown }) => ({
    questionId: Number(item?.question_id),
    answer: String(item?.answer ?? ""),
  }));

  try {
    const result = await submitDiagnosticResponses(answers);

    return NextResponse.json(
      {
        score: result.score,
        dimension_scores: result.dimensionScores.map((dimension) => ({
          dimension_id: dimension.dimensionId,
          name: dimension.name,
          score: dimension.score,
          triage_flag: dimension.triageFlag,
        })),
        weakest_dimensions: result.weakestDimensions,
        indicative_cost_statement: result.indicativeCostStatement,
        enquiry_id: result.enquiryId,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DiagnosticValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    if (error instanceof DiagnosticConfigurationError) {
      // Already logged inside scoreDiagnosticResponses — a caught, clean 500, never an
      // uncaught exception reaching a visitor path (this task's own acceptance criterion).
      return NextResponse.json(
        { status: "error", message: "Something went wrong. Please try again shortly." },
        { status: 500 },
      );
    }
    throw error;
  }
}
