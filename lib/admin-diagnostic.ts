import { DiagnosticResponseType, Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class DiagnosticConfigValidationError extends Error {}

export interface DiagnosticChoiceOptionInput {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface DiagnosticQuestionListRow {
  id: number;
  promptText: string;
  dimensionId: number;
  dimensionName: string;
  order: number;
  responseType: DiagnosticResponseType;
  active: boolean;
  isPlaceholder: boolean;
}

/** `content-management-admin.md`'s Diagnostic Questions list screen (#33c). */
export async function getDiagnosticQuestionList(): Promise<DiagnosticQuestionListRow[]> {
  const questions = await prisma.diagnosticQuestion.findMany({
    orderBy: [{ dimensionId: "asc" }, { order: "asc" }],
    include: { dimension: { select: { name: true } } },
  });
  return questions.map((q) => ({
    id: q.id,
    promptText: q.promptText,
    dimensionId: q.dimensionId,
    dimensionName: q.dimension.name,
    order: q.order,
    responseType: q.responseType,
    active: q.active,
    isPlaceholder: q.isPlaceholder,
  }));
}

export interface DiagnosticQuestionEditData {
  id: number;
  promptText: string;
  dimensionId: number;
  dimensionName: string;
  order: number;
  responseType: DiagnosticResponseType;
  choiceOptions: DiagnosticChoiceOptionInput[] | null;
  active: boolean;
  isPlaceholder: boolean;
}

export async function getDiagnosticQuestionForEdit(
  id: number,
): Promise<DiagnosticQuestionEditData | null> {
  const q = await prisma.diagnosticQuestion.findUnique({
    where: { id },
    include: { dimension: { select: { name: true } } },
  });
  if (!q) return null;
  return {
    id: q.id,
    promptText: q.promptText,
    dimensionId: q.dimensionId,
    dimensionName: q.dimension.name,
    order: q.order,
    responseType: q.responseType,
    choiceOptions: q.choiceOptions as unknown as DiagnosticChoiceOptionInput[] | null,
    active: q.active,
    isPlaceholder: q.isPlaceholder,
  };
}

export interface DiagnosticDimensionOption {
  id: number;
  name: string;
}

export async function getDiagnosticDimensionOptions(): Promise<DiagnosticDimensionOption[]> {
  return prisma.diagnosticDimension.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });
}

function validateChoiceOptions(
  responseType: DiagnosticResponseType,
  choiceOptions: DiagnosticChoiceOptionInput[] | null,
): DiagnosticChoiceOptionInput[] | null {
  if (responseType !== DiagnosticResponseType.choice) {
    return null;
  }
  if (!choiceOptions || choiceOptions.length === 0) {
    throw new DiagnosticConfigValidationError('A "choice" question needs at least one option.');
  }
  return choiceOptions.map((option) => {
    const label = option.label.trim();
    if (!label) {
      throw new DiagnosticConfigValidationError("Every choice option needs a label.");
    }
    const numericValue = Number.parseFloat(option.value);
    if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1) {
      throw new DiagnosticConfigValidationError(
        `Choice option "${label}"'s value must be a number between 0 and 1 (the same ` +
          "normalized range every diagnostic answer submits in).",
      );
    }
    return { label, value: option.value.trim() };
  });
}

/**
 * `business-health-check-diagnostic.md`'s own edge case, and this task's literal acceptance
 * criterion: attempting to deactivate the last active question in a dimension is rejected
 * inline, naming the dimension — the exact scenario `lib/diagnostic-scoring.ts`'s
 * `scoreDiagnosticResponses` would otherwise hit as an uncaught `DiagnosticConfigurationError`
 * reaching a real visitor's submission. `dimensionId`/`responseType` are never editable here
 * — frozen after creation (same "identity fields stay frozen" precedent as `Article.slug`):
 * reassigning a question to a different dimension would silently shift both dimensions'
 * scoring, and changing `responseType` after creation would orphan `choiceOptions` or turn a
 * previously-submitted `DiagnosticResponse.answerValue` inconsistent with the new type's
 * expected range for no visible reason.
 */
async function assertCanDeactivate(
  dimensionId: number,
  dimensionName: string,
  excludeQuestionId: number,
): Promise<void> {
  const otherActiveCount = await prisma.diagnosticQuestion.count({
    where: { dimensionId, active: true, id: { not: excludeQuestionId } },
  });
  if (otherActiveCount === 0) {
    throw new DiagnosticConfigValidationError(
      `Can't deactivate the last active question in "${dimensionName}" — every active ` +
        "dimension needs at least one active question.",
    );
  }
}

export async function updateDiagnosticQuestion(
  id: number,
  input: {
    promptText: string;
    active: boolean;
    isPlaceholder: boolean;
    choiceOptions: DiagnosticChoiceOptionInput[] | null;
  },
): Promise<void> {
  const existing = await prisma.diagnosticQuestion.findUnique({
    where: { id },
    include: { dimension: { select: { name: true } } },
  });
  if (!existing) {
    throw new DiagnosticConfigValidationError("Question not found.");
  }

  const promptText = input.promptText.trim();
  if (!promptText) {
    throw new DiagnosticConfigValidationError("Prompt text is required.");
  }

  if (existing.active && !input.active) {
    await assertCanDeactivate(existing.dimensionId, existing.dimension.name, id);
  }

  const choiceOptions = validateChoiceOptions(existing.responseType, input.choiceOptions);

  await prisma.diagnosticQuestion.update({
    where: { id },
    data: {
      promptText,
      active: input.active,
      isPlaceholder: input.isPlaceholder,
      choiceOptions: (choiceOptions ?? Prisma.JsonNull) as
        Prisma.InputJsonValue | typeof Prisma.JsonNull,
    },
  });
}

/**
 * The Questions list screen's own inline toggle (`ui/mockups/g-admin-content/admin-
 * diagnostic-questions-list.html`'s per-row switch) — a smaller, dedicated action than
 * `updateDiagnosticQuestion`'s full-form save, so flipping one switch doesn't require the
 * list screen to first load every other editable field. Same last-active-question guard.
 */
export async function setDiagnosticQuestionActive(id: number, active: boolean): Promise<void> {
  const existing = await prisma.diagnosticQuestion.findUnique({
    where: { id },
    include: { dimension: { select: { name: true } } },
  });
  if (!existing) {
    throw new DiagnosticConfigValidationError("Question not found.");
  }
  if (existing.active && !active) {
    await assertCanDeactivate(existing.dimensionId, existing.dimension.name, id);
  }
  await prisma.diagnosticQuestion.update({ where: { id }, data: { active } });
}

export interface DiagnosticQuestionCreateInput {
  dimensionId: number;
  promptText: string;
  responseType: DiagnosticResponseType;
  choiceOptions: DiagnosticChoiceOptionInput[] | null;
  isPlaceholder: boolean;
}

/** New questions always create `active: true` — a question a partner just added is meant to
 * be live immediately, matching every other "save is the publish moment" content type in
 * this admin with no separate publish step. */
export async function createDiagnosticQuestion(
  input: DiagnosticQuestionCreateInput,
): Promise<{ id: number }> {
  const dimension = await prisma.diagnosticDimension.findUnique({
    where: { id: input.dimensionId },
  });
  if (!dimension) {
    throw new DiagnosticConfigValidationError("Dimension not found.");
  }
  const promptText = input.promptText.trim();
  if (!promptText) {
    throw new DiagnosticConfigValidationError("Prompt text is required.");
  }
  const choiceOptions = validateChoiceOptions(input.responseType, input.choiceOptions);

  const lastQuestion = await prisma.diagnosticQuestion.findFirst({
    where: { dimensionId: input.dimensionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastQuestion?.order ?? 0) + 1;

  const created = await prisma.diagnosticQuestion.create({
    data: {
      dimensionId: input.dimensionId,
      promptText,
      responseType: input.responseType,
      choiceOptions: (choiceOptions ?? Prisma.JsonNull) as
        Prisma.InputJsonValue | typeof Prisma.JsonNull,
      active: true,
      isPlaceholder: input.isPlaceholder,
      order,
    },
  });
  return { id: created.id };
}

/**
 * Swaps this question's `order` with its adjacent sibling in the same dimension. Done as a
 * 3-step sequential transaction (this question → a temporary out-of-range order → the
 * sibling's old order; sibling → this question's old order) rather than a plain 2-statement
 * swap, because `@@unique([dimensionId, order])` is checked immediately in Postgres (Prisma
 * creates no deferrable constraints) — a direct swap would violate it mid-transaction the
 * instant the first `UPDATE` tries to claim the still-occupied slot.
 */
export async function moveDiagnosticQuestion(id: number, direction: "up" | "down"): Promise<void> {
  const question = await prisma.diagnosticQuestion.findUnique({ where: { id } });
  if (!question) {
    throw new DiagnosticConfigValidationError("Question not found.");
  }

  const sibling = await prisma.diagnosticQuestion.findFirst({
    where: {
      dimensionId: question.dimensionId,
      order: direction === "up" ? { lt: question.order } : { gt: question.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) {
    // Already first/last in its dimension — nothing to do, not an error.
    return;
  }

  await prisma.$transaction([
    prisma.diagnosticQuestion.update({ where: { id: question.id }, data: { order: -1 } }),
    prisma.diagnosticQuestion.update({
      where: { id: sibling.id },
      data: { order: question.order },
    }),
    prisma.diagnosticQuestion.update({
      where: { id: question.id },
      data: { order: sibling.order },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Dimension weights + thresholds ("Diagnostic Configuration" screen)
// ---------------------------------------------------------------------------

export interface DiagnosticDimensionWeightRow {
  id: number;
  name: string;
  weight: number;
}

export interface DiagnosticThresholdRow {
  id: number;
  dimensionId: number | null;
  dimensionName: string | null;
  thresholdValue: number;
  triagePriorityLevel: string;
}

export interface DiagnosticConfigurationData {
  dimensions: DiagnosticDimensionWeightRow[];
  overallThresholds: DiagnosticThresholdRow[];
  perDimensionThresholds: DiagnosticThresholdRow[];
}

export async function getDiagnosticConfiguration(): Promise<DiagnosticConfigurationData> {
  const [dimensions, thresholds] = await Promise.all([
    prisma.diagnosticDimension.findMany({ orderBy: { id: "asc" } }),
    prisma.diagnosticThreshold.findMany({
      include: { dimension: { select: { name: true } } },
      orderBy: { id: "asc" },
    }),
  ]);

  const overallThresholds = thresholds
    .filter((t) => t.dimensionId === null)
    .map((t) => ({
      id: t.id,
      dimensionId: null,
      dimensionName: null,
      thresholdValue: t.thresholdValue,
      triagePriorityLevel: t.triagePriorityLevel,
    }));
  const perDimensionThresholds = thresholds
    .filter((t) => t.dimensionId !== null)
    .map((t) => ({
      id: t.id,
      dimensionId: t.dimensionId,
      dimensionName: t.dimension?.name ?? null,
      thresholdValue: t.thresholdValue,
      triagePriorityLevel: t.triagePriorityLevel,
    }));

  return {
    dimensions: dimensions.map((d) => ({ id: d.id, name: d.name, weight: d.weight })),
    overallThresholds,
    perDimensionThresholds,
  };
}

export interface DiagnosticConfigurationSaveInput {
  dimensionWeights: { id: number; weight: number }[];
  overallThresholds: { id: number; thresholdValue: number; triagePriorityLevel: string }[];
  perDimensionThresholds: { id: number; thresholdValue: number }[];
}

/**
 * `business-health-check-diagnostic.md`'s "Diagnostic Configuration edits values... never the
 * scoring algorithm itself" — this only ever writes `weight`/`thresholdValue`/
 * `triagePriorityLevel`, never touches how `lib/diagnostic-scoring.ts` combines them.
 * Dimension weights must sum to 100 before saving — matching
 * `ui/mockups/g-admin-content/admin-diagnostic-configuration.html`'s own real UX rule (not
 * required by the scoring algorithm itself, which normalizes by total weight regardless, but
 * a deliberate mockup behaviour kept for administrator clarity: a weight is meant to read as
 * "this % of the score," which only holds if the set sums to 100).
 */
export async function updateDiagnosticConfiguration(
  input: DiagnosticConfigurationSaveInput,
): Promise<void> {
  const weightSum = input.dimensionWeights.reduce((sum, w) => sum + w.weight, 0);
  if (Math.abs(weightSum - 100) > 0.01) {
    throw new DiagnosticConfigValidationError(
      `Dimension weights must total 100% before saving (currently ${weightSum}%).`,
    );
  }
  for (const w of input.dimensionWeights) {
    if (!Number.isFinite(w.weight) || w.weight < 0) {
      throw new DiagnosticConfigValidationError("Every dimension weight must be 0 or higher.");
    }
  }
  for (const t of [...input.overallThresholds]) {
    if (!Number.isFinite(t.thresholdValue) || t.thresholdValue < 0 || t.thresholdValue > 100) {
      throw new DiagnosticConfigValidationError(
        "Every threshold value must be a number between 0 and 100.",
      );
    }
    if (!t.triagePriorityLevel.trim()) {
      throw new DiagnosticConfigValidationError("Every triage band needs a priority level.");
    }
  }
  for (const t of input.perDimensionThresholds) {
    if (!Number.isFinite(t.thresholdValue) || t.thresholdValue < 0 || t.thresholdValue > 100) {
      throw new DiagnosticConfigValidationError(
        "Every per-dimension threshold must be a number between 0 and 100.",
      );
    }
  }

  await prisma.$transaction([
    ...input.dimensionWeights.map((w) =>
      prisma.diagnosticDimension.update({ where: { id: w.id }, data: { weight: w.weight } }),
    ),
    ...input.overallThresholds.map((t) =>
      prisma.diagnosticThreshold.update({
        where: { id: t.id },
        data: {
          thresholdValue: t.thresholdValue,
          triagePriorityLevel: t.triagePriorityLevel.trim(),
        },
      }),
    ),
    // Per-dimension overrides always flag "High" priority regardless of overall score — the
    // mockup's own fixed business rule for this panel specifically ("Flag High priority
    // regardless of overall score, if any one dimension falls below its own threshold") —
    // only the threshold value itself is admin-editable here, matching the mockup's own
    // fields (no priority-level input on this panel).
    ...input.perDimensionThresholds.map((t) =>
      prisma.diagnosticThreshold.update({
        where: { id: t.id },
        data: { thresholdValue: t.thresholdValue, triagePriorityLevel: "High" },
      }),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Score bands
// ---------------------------------------------------------------------------

export interface DiagnosticScoreBandRow {
  id: number;
  minScore: number;
  label: string;
  statement: string;
  emailDetail: string;
  isPlaceholder: boolean;
}

export async function getDiagnosticScoreBands(): Promise<DiagnosticScoreBandRow[]> {
  const bands = await prisma.diagnosticScoreBand.findMany({ orderBy: { minScore: "desc" } });
  return bands.map((b) => ({
    id: b.id,
    minScore: b.minScore,
    label: b.label,
    statement: b.statement,
    emailDetail: b.emailDetail,
    isPlaceholder: b.isPlaceholder,
  }));
}

export interface DiagnosticScoreBandSaveInput {
  id: number;
  minScore: number;
  label: string;
  statement: string;
  emailDetail: string;
  isPlaceholder: boolean;
}

/**
 * Session-22/23 addenda — three distinct content fields per band, `statement` (short,
 * on-screen, `/diagnostic/results`) and `emailDetail` (longer, multi-paragraph, the summary
 * email only) never collapsed into one, per `lib/diagnostic-flow.ts`'s `DiagnosticScoreBand`
 * doc-comment and `content-management-admin.md`'s own business rule.
 */
export async function updateDiagnosticScoreBands(
  input: DiagnosticScoreBandSaveInput[],
): Promise<void> {
  for (const band of input) {
    if (!Number.isInteger(band.minScore) || band.minScore < 0 || band.minScore > 100) {
      throw new DiagnosticConfigValidationError(
        "Every score band's minimum score must be a whole number between 0 and 100.",
      );
    }
    if (!band.label.trim()) {
      throw new DiagnosticConfigValidationError("Every score band needs a label.");
    }
    if (!band.statement.trim()) {
      throw new DiagnosticConfigValidationError("Every score band needs an on-screen statement.");
    }
    if (!band.emailDetail.trim()) {
      throw new DiagnosticConfigValidationError(
        "Every score band needs the fuller email detail narrative.",
      );
    }
  }

  await prisma.$transaction(
    input.map((band) =>
      prisma.diagnosticScoreBand.update({
        where: { id: band.id },
        data: {
          minScore: band.minScore,
          label: band.label.trim(),
          statement: band.statement.trim(),
          emailDetail: band.emailDetail.trim(),
          isPlaceholder: band.isPlaceholder,
        },
      }),
    ),
  );
}
