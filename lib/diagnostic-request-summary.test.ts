import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/diagnostic-flow", () => ({
  getScoreBand: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  EmailSendError: class EmailSendError extends Error {},
  sendTransactionalEmail: vi.fn(),
}));

import { getScoreBand } from "@/lib/diagnostic-flow";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  DiagnosticSummaryRequestValidationError,
  requestDiagnosticSummary,
} from "@/lib/diagnostic-request-summary";

const findUniqueMock = vi.mocked(prisma.enquiryRecord.findUnique);
const updateMock = vi.mocked(prisma.enquiryRecord.update);
const getScoreBandMock = vi.mocked(getScoreBand);
const sendEmailMock = vi.mocked(sendTransactionalEmail);

const STUB_SCORE_SUMMARY = {
  score: 62,
  dimensionScores: [{ dimensionId: 1, name: "Structure", score: 62, triageFlag: false }],
  weakestDimensions: ["Structure"],
  indicativeCostStatement: "Overall score 62/100.",
  overallTriageFlag: false,
};

const VALID_INPUT = {
  enquiryId: 5,
  name: "Ama Owusu",
  email: "ama@example.com",
  contactConsent: true,
  marketingConsent: false,
};

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockReset();
  getScoreBandMock.mockReset();
  sendEmailMock.mockReset();
  getScoreBandMock.mockResolvedValue(null);
  updateMock.mockResolvedValue({} as never);
  sendEmailMock.mockResolvedValue(undefined);
});

describe("requestDiagnosticSummary", () => {
  it("rejects a missing contact_consent without touching the database", async () => {
    await expect(
      requestDiagnosticSummary({ ...VALID_INPUT, contactConsent: false }),
    ).rejects.toBeInstanceOf(DiagnosticSummaryRequestValidationError);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a missing name or email", async () => {
    await expect(requestDiagnosticSummary({ ...VALID_INPUT, name: "" })).rejects.toBeInstanceOf(
      DiagnosticSummaryRequestValidationError,
    );
    await expect(requestDiagnosticSummary({ ...VALID_INPUT, email: "" })).rejects.toBeInstanceOf(
      DiagnosticSummaryRequestValidationError,
    );
  });

  it("rejects an enquiry_id with no stored diagnostic result", async () => {
    findUniqueMock.mockResolvedValue({ id: 5, scoreSummary: null } as never);

    await expect(requestDiagnosticSummary(VALID_INPUT)).rejects.toBeInstanceOf(
      DiagnosticSummaryRequestValidationError,
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the existing enquiry_record in place and sends the summary email", async () => {
    findUniqueMock.mockResolvedValue({ id: 5, scoreSummary: STUB_SCORE_SUMMARY } as never);

    await requestDiagnosticSummary(VALID_INPUT);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        name: "Ama Owusu",
        email: "ama@example.com",
        phone: null,
        contactConsent: true,
        marketingConsent: false,
      },
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const call = sendEmailMock.mock.calls[0][0];
    expect(call.to).toEqual([{ email: "ama@example.com", name: "Ama Owusu" }]);
    expect(call.htmlContent).toContain("62%");
    expect(call.htmlContent).toContain("Overall score 62/100.");
  });

  it("does not throw when the email fails to send — the enquiry_record update already succeeded", async () => {
    findUniqueMock.mockResolvedValue({ id: 5, scoreSummary: STUB_SCORE_SUMMARY } as never);
    sendEmailMock.mockRejectedValue(new EmailSendError("BREVO_API_KEY is not set."));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(requestDiagnosticSummary(VALID_INPUT)).resolves.toBeUndefined();
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
