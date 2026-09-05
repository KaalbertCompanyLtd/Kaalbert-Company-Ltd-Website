import { prisma } from "@/lib/prisma";

/**
 * Thrown for a structurally-present-but-invalid response set (a missing answer for an active
 * question, or an answer value outside the accepted range) — the caller (T3.5's route) maps
 * this to a 400, matching `ContactValidationError`'s precedent in `lib/enquiries.ts`.
 */
export class DiagnosticValidationError extends Error {}

/**
 * Thrown when the scoring *configuration* itself is broken — today, only "a dimension has no
 * active questions" (business-health-check-diagnostic.md's documented edge case). This is a
 * data-authoring bug (an admin unpublished every question in a dimension), not a visitor
 * mistake, so it's logged here — scoring can't proceed without this being fixed at the source
 * — before being thrown; the caller (T3.5's route) catches it and returns a clean 500, per
 * this task's own acceptance criterion ("a caught, logged error, never an uncaught 500
 * reaching a visitor path").
 */
export class DiagnosticConfigurationError extends Error {}

export interface DiagnosticAnswerInput {
  questionId: number;
  answer: string;
}

export interface DiagnosticDimensionScore {
  dimensionId: number;
  name: string;
  /** 0–100. */
  score: number;
  /** Whether this dimension's score breached its own configured threshold(s), if any exist. */
  triageFlag: boolean;
}

export interface DiagnosticScoringResult {
  /** 0–100, the weighted average of `dimensionScores` by each dimension's configured weight. */
  score: number;
  dimensionScores: DiagnosticDimensionScore[];
  /** The 2–3 lowest-scoring dimensions (business-health-check-diagnostic.md's "User flow"). */
  weakestDimensions: string[];
  indicativeCostStatement: string;
  /** Whether the overall score breached a configured overall threshold (`dimensionId: null`) — what T3.5 writes to `enquiry_record.triage_flag` (FR-2.6). */
  overallTriageFlag: boolean;
}

interface ThresholdBand {
  thresholdValue: number;
  triagePriorityLevel: string;
}

/**
 * Every response type (scale/boolean/choice) is submitted as a plain numeric string already
 * normalized to the 0–1 range — mirroring exactly what the accepted mockup does
 * (`ui/mockups/c-diagnostic/diagnostic-flow.html`'s `scoreAndFinish`, which stores
 * `parseFloat(inp.value)` uniformly regardless of `q.type`: a boolean's Yes/No option is
 * `1`/`0`, a scale's 1–5 rating is `v / 5`, and each choice option carries its own pre-authored
 * 0–1 value, e.g. "3–12 months" → `0.66`). `diagnostic_question` has no column to store a
 * choice option's label-to-value mapping (`docs/features/business-health-check-
 * diagnostic.md`'s Data requirements section doesn't name one, and T3.1's schema — already
 * migrated — matches that list exactly), so that mapping is authored once, client-side, the
 * same way the mockup authors it — this function only ever needs the final normalized number,
 * not the responseType, to score an answer.
 */
function parseNormalizedAnswer(raw: string, questionId: number): number {
  const value = Number.parseFloat(raw);

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new DiagnosticValidationError(
      `Answer for question ${questionId} must be a number between 0 and 1 (received "${raw}").`,
    );
  }

  return value;
}

/**
 * A threshold "trips" when the score falls below its `thresholdValue` (mirrors the accepted
 * mockup's own weak-dimension check, `d.score < 75`, generalized to a real, data-driven value
 * instead of a hard-coded one). Among every band the score falls under, the one with the
 * smallest `thresholdValue` is the tightest fit — e.g. bands at 40 ("High") and 70 ("Medium"):
 * a score of 30 falls under both, but 40 is the more specific, more urgent band, so it wins.
 */
function resolveTriageBand(
  score: number,
  thresholds: ThresholdBand[],
): { flagged: boolean; priorityLevel: string | null } {
  const breached = [...thresholds]
    .sort((a, b) => a.thresholdValue - b.thresholdValue)
    .find((threshold) => score < threshold.thresholdValue);

  return breached
    ? { flagged: true, priorityLevel: breached.triagePriorityLevel }
    : { flagged: false, priorityLevel: null };
}

/**
 * Deliberately makes no numeric cost claim (never fabricate content, CLAUDE.md) — there's no
 * firm-supplied cost-of-inaction figure to draw on yet (`user-stories.md` names this a
 * "cost-of-inaction statement", but no data source for a real number exists in this schema).
 * Instead it states the real, computed score and — when a configured threshold was actually
 * breached — that threshold's own `triagePriorityLevel` text (admin-tunable data, per
 * `docs/features/business-health-check-diagnostic.md`'s "triage thresholds ... configuration
 * data, not hard-coded logic"), alongside the real weakest-dimension names already computed
 * from this response set. No dimension name is ever branched on in code — only interpolated
 * as data, per this task's own architecture constraint.
 */
function buildIndicativeCostStatement(
  overallScore: number,
  weakestDimensions: string[],
  priorityLevel: string | null,
): string {
  const areas = weakestDimensions.join(", ");

  if (priorityLevel) {
    return (
      `Overall score ${overallScore}/100 — ${priorityLevel} priority. Businesses scoring in ` +
      `this range typically carry avoidable cost in ${areas} until it's addressed — a partner ` +
      `conversation can turn this into a specific figure for this business.`
    );
  }

  return (
    `Overall score ${overallScore}/100. No configured triage threshold was breached, but ` +
    `${areas} remain the areas most likely to carry avoidable cost as the business grows.`
  );
}

/**
 * Pure(ish) scoring function — response set → `{score, dimension_scores, weakest_dimensions,
 * indicative_cost_statement}` (docs/tasks/03-diagnostic.md T3.2), reading every dimension
 * weight and threshold value from the database on each call (ADR 0005 — scoring
 * configuration is data, never hard-coded). No route or component calls this directly yet;
 * T3.5's `POST /api/diagnostic/submit` is the first caller.
 *
 * Business logic lives here, not in a route handler (CLAUDE.md): this function owns the whole
 * algorithm — how a dimension's score is built from its questions' answers, how the overall
 * score combines dimension scores by weight, and how a threshold breach becomes a triage flag
 * — none of which is configurable data itself, only the weights/thresholds it operates on are.
 */
export async function scoreDiagnosticResponses(
  answers: DiagnosticAnswerInput[],
): Promise<DiagnosticScoringResult> {
  const [dimensions, thresholds] = await Promise.all([
    prisma.diagnosticDimension.findMany({
      include: { questions: { where: { active: true }, select: { id: true, promptText: true } } },
    }),
    prisma.diagnosticThreshold.findMany({
      select: { dimensionId: true, thresholdValue: true, triagePriorityLevel: true },
    }),
  ]);

  const overallThresholds = thresholds.filter((threshold) => threshold.dimensionId === null);
  const dimensionThresholds = new Map<number, ThresholdBand[]>();
  for (const threshold of thresholds) {
    if (threshold.dimensionId === null) continue;
    const bands = dimensionThresholds.get(threshold.dimensionId) ?? [];
    bands.push(threshold);
    dimensionThresholds.set(threshold.dimensionId, bands);
  }

  const answersByQuestionId = new Map(answers.map((a) => [a.questionId, a.answer]));

  const dimensionScores: DiagnosticDimensionScore[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dimension of dimensions) {
    if (dimension.questions.length === 0) {
      const message =
        `Diagnostic dimension "${dimension.name}" (id ${dimension.id}) has no active ` +
        `questions — scoring cannot proceed until the question set is corrected.`;
      console.error(`[diagnostic-scoring] ${message}`);
      throw new DiagnosticConfigurationError(message);
    }

    const normalizedValues = dimension.questions.map((question) => {
      const raw = answersByQuestionId.get(question.id);
      if (raw === undefined) {
        throw new DiagnosticValidationError(
          `Missing answer for question ${question.id} ("${question.promptText}").`,
        );
      }
      return parseNormalizedAnswer(raw, question.id);
    });

    const rawAverage =
      normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;
    const dimensionScore = Math.round(rawAverage * 100);
    const { flagged } = resolveTriageBand(
      dimensionScore,
      dimensionThresholds.get(dimension.id) ?? [],
    );

    dimensionScores.push({
      dimensionId: dimension.id,
      name: dimension.name,
      score: dimensionScore,
      triageFlag: flagged,
    });

    weightedSum += dimensionScore * dimension.weight;
    totalWeight += dimension.weight;
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const { flagged: overallTriageFlag, priorityLevel: overallPriorityLevel } = resolveTriageBand(
    overallScore,
    overallThresholds,
  );

  const sortedByScore = [...dimensionScores].sort((a, b) => a.score - b.score);
  const flaggedWeakest = sortedByScore.filter((d) => d.triageFlag).slice(0, 3);
  const weakestDimensions = (
    flaggedWeakest.length >= 2 ? flaggedWeakest : sortedByScore.slice(0, 2)
  ).map((d) => d.name);

  return {
    score: overallScore,
    dimensionScores,
    weakestDimensions,
    indicativeCostStatement: buildIndicativeCostStatement(
      overallScore,
      weakestDimensions,
      overallPriorityLevel,
    ),
    overallTriageFlag,
  };
}
