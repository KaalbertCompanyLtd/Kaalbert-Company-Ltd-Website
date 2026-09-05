import { randomUUID } from "node:crypto";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  scoreDiagnosticResponses,
  type DiagnosticAnswerInput,
  type DiagnosticScoringResult,
} from "@/lib/diagnostic-scoring";

export interface DiagnosticSubmitResult extends DiagnosticScoringResult {
  enquiryId: number;
}

/**
 * `POST /api/diagnostic/submit`'s own business logic (T3.5) — scores the response set (T3.2)
 * and creates the owning `enquiry_record` together with every `diagnostic_response` row in
 * one write. Contact details (`name`/`email`/`message`/`contactConsent`) are left `null` —
 * relaxed to nullable on `EnquiryRecord` at this same task specifically so a diagnostic
 * submission can exist before step 5's contact-consent ask (T3.7) ever happens (FR-2.3: the
 * step 4 result screen must never require them) — see `prisma/schema.prisma`'s
 * `EnquiryRecord` doc-comment. `DiagnosticResponse.sessionId` has no real visitor-session
 * concept to draw on (ADR 0005/0007's scope, and T3.4's client sends the complete response
 * set in one request with no session token of its own) — a fresh id generated per submission
 * satisfies the column's `NOT NULL` constraint and correctly represents "one attempt"; every
 * row it's written to is immediately linked to a real `enquiryId` regardless, which is what
 * actually correlates them from here on.
 *
 * Two errors this function can throw are not its own — they propagate straight from
 * `scoreDiagnosticResponses` (T3.2): `DiagnosticValidationError` (an incomplete/malformed
 * response set) and `DiagnosticConfigurationError` (a broken question-set configuration) —
 * the caller (the route handler) maps each to the right HTTP response, per that function's
 * own established contract.
 */
export async function submitDiagnosticResponses(
  answers: DiagnosticAnswerInput[],
): Promise<DiagnosticSubmitResult> {
  const result = await scoreDiagnosticResponses(answers);
  const sessionId = randomUUID();

  const enquiry = await prisma.enquiryRecord.create({
    data: {
      contactConsent: null,
      scoreSummary: result as unknown as Prisma.InputJsonValue,
      weakestDimensions: result.weakestDimensions,
      triageFlag: result.overallTriageFlag,
      diagnosticResponses: {
        create: answers.map((answer) => ({
          sessionId,
          questionId: answer.questionId,
          answerValue: answer.answer,
        })),
      },
    },
  });

  return { ...result, enquiryId: enquiry.id };
}

/**
 * `/diagnostic/results` (T3.6) — resolves an `enquiry_id` to its already-computed,
 * already-stored result. Reads `EnquiryRecord.scoreSummary` back as `DiagnosticScoringResult`
 * (the exact shape `submitDiagnosticResponses` above wrote it in) rather than recomputing
 * anything — this screen's whole job is displaying what was already scored, never
 * re-deriving a score, both because that would duplicate business logic outside `lib/` and
 * because it could disagree with what a partner later sees for the same enquiry in
 * Milestone 8's enquiry management screen. Returns `null` for a missing id or a row with no
 * stored `scoreSummary` (e.g. a contact-form-originated enquiry) — the caller (`app/
 * diagnostic/results/page.tsx`) turns that into a real `notFound()`, never a silently
 * rendered thin page.
 */
export async function getDiagnosticResultByEnquiryId(
  enquiryId: number,
): Promise<DiagnosticScoringResult | null> {
  const enquiry = await prisma.enquiryRecord.findUnique({ where: { id: enquiryId } });
  if (!enquiry?.scoreSummary) {
    return null;
  }
  return enquiry.scoreSummary as unknown as DiagnosticScoringResult;
}
