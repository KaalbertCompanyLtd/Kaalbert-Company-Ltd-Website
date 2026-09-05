import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diagnosticDimension: { findMany: vi.fn() },
    diagnosticThreshold: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  DiagnosticConfigurationError,
  DiagnosticValidationError,
  scoreDiagnosticResponses,
} from "@/lib/diagnostic-scoring";

const findManyDimensions = vi.mocked(prisma.diagnosticDimension.findMany);
const findManyThresholds = vi.mocked(prisma.diagnosticThreshold.findMany);

/** Two dimensions, two active questions each — enough to exercise per-dimension weighting. */
const TWO_DIMENSIONS = [
  {
    id: 1,
    name: "Structure",
    weight: 1,
    questions: [
      { id: 101, promptText: "Q1" },
      { id: 102, promptText: "Q2" },
    ],
  },
  {
    id: 2,
    name: "Records",
    weight: 1,
    questions: [
      { id: 201, promptText: "Q3" },
      { id: 202, promptText: "Q4" },
    ],
  },
];

beforeEach(() => {
  findManyDimensions.mockReset();
  findManyThresholds.mockReset();
});

describe("scoreDiagnosticResponses", () => {
  it("scores a full-marks response set as 100 across every dimension, with no triage flags", async () => {
    findManyDimensions.mockResolvedValue(TWO_DIMENSIONS as never);
    findManyThresholds.mockResolvedValue([
      { dimensionId: 1, thresholdValue: 50, triagePriorityLevel: "High" },
      { dimensionId: 2, thresholdValue: 50, triagePriorityLevel: "High" },
      { dimensionId: null, thresholdValue: 50, triagePriorityLevel: "High" },
    ] as never);

    const result = await scoreDiagnosticResponses([
      { questionId: 101, answer: "1" },
      { questionId: 102, answer: "1" },
      { questionId: 201, answer: "1" },
      { questionId: 202, answer: "1" },
    ]);

    expect(result.score).toBe(100);
    expect(result.dimensionScores).toEqual([
      { dimensionId: 1, name: "Structure", score: 100, triageFlag: false },
      { dimensionId: 2, name: "Records", score: 100, triageFlag: false },
    ]);
    expect(result.overallTriageFlag).toBe(false);
    // No dimension breached its threshold, so the "at least 2" fallback applies.
    expect(result.weakestDimensions).toHaveLength(2);
    expect(result.indicativeCostStatement).toContain("100/100");
    expect(result.indicativeCostStatement).not.toContain("priority");
  });

  it("scores a zero-marks response set as 0 across every dimension, tripping every threshold", async () => {
    findManyDimensions.mockResolvedValue(TWO_DIMENSIONS as never);
    findManyThresholds.mockResolvedValue([
      { dimensionId: 1, thresholdValue: 50, triagePriorityLevel: "High" },
      { dimensionId: 2, thresholdValue: 50, triagePriorityLevel: "High" },
      { dimensionId: null, thresholdValue: 50, triagePriorityLevel: "High" },
    ] as never);

    const result = await scoreDiagnosticResponses([
      { questionId: 101, answer: "0" },
      { questionId: 102, answer: "0" },
      { questionId: 201, answer: "0" },
      { questionId: 202, answer: "0" },
    ]);

    expect(result.score).toBe(0);
    expect(result.dimensionScores).toEqual([
      { dimensionId: 1, name: "Structure", score: 0, triageFlag: true },
      { dimensionId: 2, name: "Records", score: 0, triageFlag: true },
    ]);
    expect(result.overallTriageFlag).toBe(true);
    expect(result.weakestDimensions.sort()).toEqual(["Records", "Structure"]);
    expect(result.indicativeCostStatement).toContain("High priority");
  });

  it("trips the triage threshold on one dimension but not the other", async () => {
    findManyDimensions.mockResolvedValue(TWO_DIMENSIONS as never);
    findManyThresholds.mockResolvedValue([
      { dimensionId: 1, thresholdValue: 50, triagePriorityLevel: "High" },
      { dimensionId: 2, thresholdValue: 50, triagePriorityLevel: "High" },
    ] as never);

    // Structure scores 0 (breaches its 50 threshold); Records scores 100 (does not).
    const result = await scoreDiagnosticResponses([
      { questionId: 101, answer: "0" },
      { questionId: 102, answer: "0" },
      { questionId: 201, answer: "1" },
      { questionId: 202, answer: "1" },
    ]);

    expect(result.dimensionScores).toEqual([
      { dimensionId: 1, name: "Structure", score: 0, triageFlag: true },
      { dimensionId: 2, name: "Records", score: 100, triageFlag: false },
    ]);
    // Only one dimension flagged, so the "at least 2" fallback still applies to reach a
    // 2-3 count, but the flagged dimension (Structure) must be the one surfaced.
    expect(result.weakestDimensions).toContain("Structure");
    expect(result.score).toBe(50);
  });

  it("throws a caught, logged DiagnosticConfigurationError for a dimension with no active questions", async () => {
    findManyDimensions.mockResolvedValue([
      { id: 1, name: "Structure", weight: 1, questions: [] },
    ] as never);
    findManyThresholds.mockResolvedValue([]);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(scoreDiagnosticResponses([])).rejects.toBeInstanceOf(DiagnosticConfigurationError);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain("Structure");

    consoleError.mockRestore();
  });

  it("throws DiagnosticValidationError for a missing answer to an active question", async () => {
    findManyDimensions.mockResolvedValue(TWO_DIMENSIONS as never);
    findManyThresholds.mockResolvedValue([]);

    await expect(
      scoreDiagnosticResponses([
        { questionId: 101, answer: "1" },
        { questionId: 102, answer: "1" },
        { questionId: 201, answer: "1" },
        // 202 missing
      ]),
    ).rejects.toBeInstanceOf(DiagnosticValidationError);
  });

  it("throws DiagnosticValidationError for an out-of-range answer", async () => {
    findManyDimensions.mockResolvedValue(TWO_DIMENSIONS as never);
    findManyThresholds.mockResolvedValue([]);

    await expect(
      scoreDiagnosticResponses([
        { questionId: 101, answer: "1.5" },
        { questionId: 102, answer: "1" },
        { questionId: 201, answer: "1" },
        { questionId: 202, answer: "1" },
      ]),
    ).rejects.toBeInstanceOf(DiagnosticValidationError);
  });
});
