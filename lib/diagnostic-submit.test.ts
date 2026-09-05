import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { create: vi.fn() },
  },
}));

vi.mock("@/lib/diagnostic-scoring", async () => {
  const actual = await vi.importActual<typeof import("@/lib/diagnostic-scoring")>(
    "@/lib/diagnostic-scoring",
  );
  return { ...actual, scoreDiagnosticResponses: vi.fn() };
});

import { prisma } from "@/lib/prisma";
import { scoreDiagnosticResponses, type DiagnosticScoringResult } from "@/lib/diagnostic-scoring";
import { submitDiagnosticResponses } from "@/lib/diagnostic-submit";

const scoreMock = vi.mocked(scoreDiagnosticResponses);
const createMock = vi.mocked(prisma.enquiryRecord.create);

const STUB_RESULT: DiagnosticScoringResult = {
  score: 62,
  dimensionScores: [{ dimensionId: 1, name: "Structure", score: 62, triageFlag: false }],
  weakestDimensions: ["Structure"],
  indicativeCostStatement: "Overall score 62/100.",
  overallTriageFlag: false,
};

beforeEach(() => {
  scoreMock.mockReset();
  createMock.mockReset();
});

describe("submitDiagnosticResponses", () => {
  it("scores the response set and creates an enquiry_record with every diagnostic_response row in one write", async () => {
    scoreMock.mockResolvedValue(STUB_RESULT);
    createMock.mockResolvedValue({ id: 42 } as never);

    const answers = [
      { questionId: 101, answer: "1" },
      { questionId: 102, answer: "0.5" },
    ];
    const result = await submitDiagnosticResponses(answers);

    expect(scoreMock).toHaveBeenCalledWith(answers);
    expect(result).toEqual({ ...STUB_RESULT, enquiryId: 42 });

    const createArgs = createMock.mock.calls[0][0] as {
      data: {
        contactConsent: boolean | null;
        scoreSummary: unknown;
        weakestDimensions: string[];
        triageFlag: boolean;
        diagnosticResponses: {
          create: Array<{ sessionId: string; questionId: number; answerValue: string }>;
        };
      };
    };
    expect(createArgs.data.contactConsent).toBeNull();
    expect(createArgs.data.scoreSummary).toEqual(STUB_RESULT);
    expect(createArgs.data.weakestDimensions).toEqual(STUB_RESULT.weakestDimensions);
    expect(createArgs.data.triageFlag).toBe(STUB_RESULT.overallTriageFlag);

    const responseCreates = createArgs.data.diagnosticResponses.create;
    expect(responseCreates).toHaveLength(2);
    expect(responseCreates[0]).toMatchObject({ questionId: 101, answerValue: "1" });
    expect(responseCreates[1]).toMatchObject({ questionId: 102, answerValue: "0.5" });
    // Every row in one submission shares the same sessionId.
    expect(responseCreates[0].sessionId).toBe(responseCreates[1].sessionId);
    expect(typeof responseCreates[0].sessionId).toBe("string");
  });

  it("propagates DiagnosticValidationError/DiagnosticConfigurationError from scoreDiagnosticResponses uncaught, for the route to map", async () => {
    const { DiagnosticValidationError } = await vi.importActual<
      typeof import("@/lib/diagnostic-scoring")
    >("@/lib/diagnostic-scoring");
    scoreMock.mockRejectedValue(new DiagnosticValidationError("Missing answer."));

    await expect(submitDiagnosticResponses([])).rejects.toBeInstanceOf(DiagnosticValidationError);
    expect(createMock).not.toHaveBeenCalled();
  });
});
