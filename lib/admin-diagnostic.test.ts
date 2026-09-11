import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diagnosticQuestion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    diagnosticDimension: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    diagnosticThreshold: { findMany: vi.fn(), update: vi.fn() },
    diagnosticScoreBand: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { Prisma } from "../generated/prisma/client";
import {
  DiagnosticConfigValidationError,
  createDiagnosticQuestion,
  getDiagnosticConfiguration,
  getDiagnosticDimensionOptions,
  getDiagnosticQuestionForEdit,
  getDiagnosticQuestionList,
  getDiagnosticScoreBands,
  moveDiagnosticQuestion,
  setDiagnosticQuestionActive,
  updateDiagnosticConfiguration,
  updateDiagnosticQuestion,
  updateDiagnosticScoreBands,
} from "@/lib/admin-diagnostic";
import type {
  DiagnosticConfigurationSaveInput,
  DiagnosticScoreBandSaveInput,
} from "@/lib/admin-diagnostic";

const questionFindManyMock = vi.mocked(prisma.diagnosticQuestion.findMany);
const questionFindUniqueMock = vi.mocked(prisma.diagnosticQuestion.findUnique);
const questionFindFirstMock = vi.mocked(prisma.diagnosticQuestion.findFirst);
const questionUpdateMock = vi.mocked(prisma.diagnosticQuestion.update);
const questionCreateMock = vi.mocked(prisma.diagnosticQuestion.create);
const questionCountMock = vi.mocked(prisma.diagnosticQuestion.count);
const dimensionFindManyMock = vi.mocked(prisma.diagnosticDimension.findMany);
const dimensionFindUniqueMock = vi.mocked(prisma.diagnosticDimension.findUnique);
const thresholdFindManyMock = vi.mocked(prisma.diagnosticThreshold.findMany);
const scoreBandFindManyMock = vi.mocked(prisma.diagnosticScoreBand.findMany);
const transactionMock = vi.mocked(prisma.$transaction);

beforeEach(() => {
  questionFindManyMock.mockReset();
  questionFindUniqueMock.mockReset();
  questionFindFirstMock.mockReset();
  questionUpdateMock.mockReset();
  questionCreateMock.mockReset();
  questionCountMock.mockReset();
  dimensionFindManyMock.mockReset();
  dimensionFindUniqueMock.mockReset();
  thresholdFindManyMock.mockReset();
  scoreBandFindManyMock.mockReset();
  transactionMock.mockReset();
});

function questionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    promptText: "Is the business registered?",
    dimensionId: 1,
    order: 1,
    responseType: "choice",
    choiceOptions: [{ label: "Yes", value: "1" }],
    active: true,
    isPlaceholder: false,
    dimension: { name: "Structure" },
    ...overrides,
  };
}

describe("getDiagnosticQuestionList", () => {
  it("flattens each row's dimension name", async () => {
    questionFindManyMock.mockResolvedValueOnce([questionRow()] as never);
    const result = await getDiagnosticQuestionList();
    expect(result[0]).toMatchObject({ id: 1, dimensionName: "Structure" });
  });
});

describe("getDiagnosticQuestionForEdit", () => {
  it("returns null for an unknown id", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(null);
    expect(await getDiagnosticQuestionForEdit(999)).toBeNull();
  });

  it("returns the row's choiceOptions as-is", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    const result = await getDiagnosticQuestionForEdit(1);
    expect(result?.choiceOptions).toEqual([{ label: "Yes", value: "1" }]);
  });
});

describe("getDiagnosticDimensionOptions", () => {
  it("returns id/name pairs", async () => {
    dimensionFindManyMock.mockResolvedValueOnce([{ id: 1, name: "Structure" }] as never);
    expect(await getDiagnosticDimensionOptions()).toEqual([{ id: 1, name: "Structure" }]);
  });
});

describe("updateDiagnosticQuestion", () => {
  it("throws for an unknown question id", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(null);
    await expect(
      updateDiagnosticQuestion(999, {
        promptText: "x",
        active: true,
        isPlaceholder: false,
        choiceOptions: null,
      }),
    ).rejects.toThrow(DiagnosticConfigValidationError);
  });

  it("rejects blank prompt text", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    await expect(
      updateDiagnosticQuestion(1, {
        promptText: "   ",
        active: true,
        isPlaceholder: false,
        choiceOptions: [{ label: "Yes", value: "1" }],
      }),
    ).rejects.toThrow(DiagnosticConfigValidationError);
  });

  it("rejects a choice question saved with zero options", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    await expect(
      updateDiagnosticQuestion(1, {
        promptText: "Prompt",
        active: true,
        isPlaceholder: false,
        choiceOptions: [],
      }),
    ).rejects.toThrow(/at least one option/);
  });

  it("rejects a choice option value outside 0-1", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    await expect(
      updateDiagnosticQuestion(1, {
        promptText: "Prompt",
        active: true,
        isPlaceholder: false,
        choiceOptions: [{ label: "Yes", value: "2" }],
      }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it("blocks deactivating the last active question in a dimension", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    questionCountMock.mockResolvedValueOnce(0);
    await expect(
      updateDiagnosticQuestion(1, {
        promptText: "Prompt",
        active: false,
        isPlaceholder: false,
        choiceOptions: [{ label: "Yes", value: "1" }],
      }),
    ).rejects.toThrow(/last active question in "Structure"/);
    expect(questionUpdateMock).not.toHaveBeenCalled();
  });

  it("allows deactivating when another active question remains in the dimension", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    questionCountMock.mockResolvedValueOnce(1);
    questionUpdateMock.mockResolvedValueOnce({} as never);
    await updateDiagnosticQuestion(1, {
      promptText: "Prompt",
      active: false,
      isPlaceholder: false,
      choiceOptions: [{ label: "Yes", value: "1" }],
    });
    expect(questionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: false }) }),
    );
  });

  it("saves a non-choice question's choiceOptions as null (Prisma.JsonNull)", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(
      questionRow({ responseType: "scale", choiceOptions: null }) as never,
    );
    questionUpdateMock.mockResolvedValueOnce({} as never);
    await updateDiagnosticQuestion(1, {
      promptText: "Prompt",
      active: true,
      isPlaceholder: false,
      choiceOptions: [{ label: "Should be ignored", value: "1" }],
    });
    const savedData = questionUpdateMock.mock.calls[0][0].data as Record<string, unknown>;
    expect(savedData.choiceOptions).toBe(Prisma.JsonNull);
  });
});

describe("setDiagnosticQuestionActive", () => {
  it("throws for an unknown question id", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(null);
    await expect(setDiagnosticQuestionActive(999, false)).rejects.toThrow(
      DiagnosticConfigValidationError,
    );
  });

  it("blocks deactivating the last active question in a dimension", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow() as never);
    questionCountMock.mockResolvedValueOnce(0);
    await expect(setDiagnosticQuestionActive(1, false)).rejects.toThrow(/last active question/);
  });

  it("allows reactivating without checking the sibling count", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow({ active: false }) as never);
    questionUpdateMock.mockResolvedValueOnce({} as never);
    await setDiagnosticQuestionActive(1, true);
    expect(questionCountMock).not.toHaveBeenCalled();
    expect(questionUpdateMock).toHaveBeenCalledWith({ where: { id: 1 }, data: { active: true } });
  });
});

describe("createDiagnosticQuestion", () => {
  it("throws for an unknown dimension", async () => {
    dimensionFindUniqueMock.mockResolvedValueOnce(null);
    await expect(
      createDiagnosticQuestion({
        dimensionId: 999,
        promptText: "Prompt",
        responseType: "scale",
        choiceOptions: null,
        isPlaceholder: false,
      }),
    ).rejects.toThrow(DiagnosticConfigValidationError);
  });

  it("computes order as one past the dimension's current last question", async () => {
    dimensionFindUniqueMock.mockResolvedValueOnce({ id: 1, name: "Structure" } as never);
    questionFindFirstMock.mockResolvedValueOnce({ order: 3 } as never);
    questionCreateMock.mockResolvedValueOnce({ id: 42 } as never);

    const result = await createDiagnosticQuestion({
      dimensionId: 1,
      promptText: "Prompt",
      responseType: "scale",
      choiceOptions: null,
      isPlaceholder: false,
    });

    expect(result).toEqual({ id: 42 });
    expect(questionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 4, active: true }) }),
    );
  });

  it("defaults order to 1 when the dimension has no questions yet", async () => {
    dimensionFindUniqueMock.mockResolvedValueOnce({ id: 1, name: "Structure" } as never);
    questionFindFirstMock.mockResolvedValueOnce(null);
    questionCreateMock.mockResolvedValueOnce({ id: 1 } as never);

    await createDiagnosticQuestion({
      dimensionId: 1,
      promptText: "Prompt",
      responseType: "scale",
      choiceOptions: null,
      isPlaceholder: false,
    });

    expect(questionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 1 }) }),
    );
  });
});

describe("moveDiagnosticQuestion", () => {
  it("throws for an unknown question id", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(null);
    await expect(moveDiagnosticQuestion(999, "up")).rejects.toThrow(
      DiagnosticConfigValidationError,
    );
  });

  it("no-ops when already first/last in its dimension", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow({ order: 1 }) as never);
    questionFindFirstMock.mockResolvedValueOnce(null);
    await moveDiagnosticQuestion(1, "up");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("swaps order with the adjacent sibling via a 3-step transaction", async () => {
    questionFindUniqueMock.mockResolvedValueOnce(questionRow({ id: 1, order: 2 }) as never);
    questionFindFirstMock.mockResolvedValueOnce({ id: 2, order: 1 } as never);
    transactionMock.mockResolvedValueOnce([] as never);

    await moveDiagnosticQuestion(1, "up");

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(questionUpdateMock).toHaveBeenCalledWith({ where: { id: 1 }, data: { order: -1 } });
    expect(questionUpdateMock).toHaveBeenCalledWith({ where: { id: 2 }, data: { order: 2 } });
    expect(questionUpdateMock).toHaveBeenCalledWith({ where: { id: 1 }, data: { order: 1 } });
  });
});

function validConfigInput(
  overrides: Partial<DiagnosticConfigurationSaveInput> = {},
): DiagnosticConfigurationSaveInput {
  return {
    dimensionWeights: [
      { id: 1, weight: 20 },
      { id: 2, weight: 20 },
      { id: 3, weight: 20 },
      { id: 4, weight: 20 },
      { id: 5, weight: 20 },
    ],
    overallThresholds: [
      { id: 1, thresholdValue: 40, triagePriorityLevel: "High" },
      { id: 2, thresholdValue: 70, triagePriorityLevel: "Medium" },
    ],
    perDimensionThresholds: [{ id: 3, thresholdValue: 50 }],
    ...overrides,
  };
}

describe("getDiagnosticConfiguration", () => {
  it("splits thresholds into overall (dimensionId null) vs per-dimension", async () => {
    dimensionFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Structure", weight: 20 },
    ] as never);
    thresholdFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        dimensionId: null,
        thresholdValue: 40,
        triagePriorityLevel: "High",
        dimension: null,
      },
      {
        id: 3,
        dimensionId: 1,
        thresholdValue: 50,
        triagePriorityLevel: "High",
        dimension: { name: "Structure" },
      },
    ] as never);

    const result = await getDiagnosticConfiguration();

    expect(result.overallThresholds).toHaveLength(1);
    expect(result.perDimensionThresholds).toHaveLength(1);
    expect(result.perDimensionThresholds[0].dimensionName).toBe("Structure");
  });
});

describe("updateDiagnosticConfiguration", () => {
  it("rejects weights that don't total 100", async () => {
    await expect(
      updateDiagnosticConfiguration(
        validConfigInput({ dimensionWeights: [{ id: 1, weight: 50 }] }),
      ),
    ).rejects.toThrow(/must total 100/);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects a negative weight even if the total happens to be 100", async () => {
    await expect(
      updateDiagnosticConfiguration(
        validConfigInput({
          dimensionWeights: [
            { id: 1, weight: 120 },
            { id: 2, weight: -20 },
          ],
        }),
      ),
    ).rejects.toThrow(/0 or higher/);
  });

  it("rejects an overall threshold value outside 0-100", async () => {
    await expect(
      updateDiagnosticConfiguration(
        validConfigInput({
          overallThresholds: [{ id: 1, thresholdValue: 150, triagePriorityLevel: "High" }],
        }),
      ),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it("rejects a blank triage priority level", async () => {
    await expect(
      updateDiagnosticConfiguration(
        validConfigInput({
          overallThresholds: [{ id: 1, thresholdValue: 40, triagePriorityLevel: "  " }],
        }),
      ),
    ).rejects.toThrow(/priority level/);
  });

  it("always forces per-dimension thresholds to High priority", async () => {
    transactionMock.mockResolvedValueOnce([] as never);
    await updateDiagnosticConfiguration(validConfigInput());
    const thresholdCall = vi
      .mocked(prisma.diagnosticThreshold.update)
      .mock.calls.find((call) => call[0].where.id === 3);
    expect(thresholdCall?.[0].data).toMatchObject({ triagePriorityLevel: "High" });
  });
});

function validScoreBand(
  overrides: Partial<DiagnosticScoreBandSaveInput> = {},
): DiagnosticScoreBandSaveInput {
  return {
    id: 1,
    minScore: 80,
    label: "Strong Foundation",
    statement: "On-screen statement.",
    emailDetail: "Fuller email narrative.",
    isPlaceholder: false,
    ...overrides,
  };
}

describe("getDiagnosticScoreBands", () => {
  it("maps rows through", async () => {
    scoreBandFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        minScore: 80,
        label: "Strong Foundation",
        statement: "s",
        emailDetail: "e",
        isPlaceholder: true,
      },
    ] as never);
    const result = await getDiagnosticScoreBands();
    expect(result[0]).toMatchObject({ id: 1, minScore: 80, isPlaceholder: true });
  });
});

describe("updateDiagnosticScoreBands", () => {
  it("rejects a non-integer minScore", async () => {
    await expect(updateDiagnosticScoreBands([validScoreBand({ minScore: 50.5 })])).rejects.toThrow(
      /whole number/,
    );
  });

  it("rejects a minScore outside 0-100", async () => {
    await expect(updateDiagnosticScoreBands([validScoreBand({ minScore: 150 })])).rejects.toThrow(
      /whole number between 0 and 100/,
    );
  });

  it("rejects a blank label", async () => {
    await expect(updateDiagnosticScoreBands([validScoreBand({ label: "  " })])).rejects.toThrow(
      /label/,
    );
  });

  it("rejects a blank on-screen statement", async () => {
    await expect(updateDiagnosticScoreBands([validScoreBand({ statement: "  " })])).rejects.toThrow(
      /on-screen statement/,
    );
  });

  it("rejects a blank email detail", async () => {
    await expect(
      updateDiagnosticScoreBands([validScoreBand({ emailDetail: "  " })]),
    ).rejects.toThrow(/email detail/);
  });

  it("saves trimmed fields via a transaction", async () => {
    transactionMock.mockResolvedValueOnce([] as never);
    await updateDiagnosticScoreBands([
      validScoreBand({ label: "  Strong Foundation  ", statement: "  s  ", emailDetail: "  e  " }),
    ]);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(vi.mocked(prisma.diagnosticScoreBand.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          label: "Strong Foundation",
          statement: "s",
          emailDetail: "e",
        }),
      }),
    );
  });
});
