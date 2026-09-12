import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    adminUser: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  deletePersonalData,
  ENQUIRIES_PAGE_SIZE,
  EnquiryWriteValidationError,
  getEnquiryDetail,
  listAssignablePartners,
  listEnquiries,
  resolveEnquirySource,
  updateEnquiry,
} from "@/lib/admin-enquiries";

const countMock = vi.mocked(prisma.enquiryRecord.count);
const findManyMock = vi.mocked(prisma.enquiryRecord.findMany);
const findUniqueMock = vi.mocked(prisma.enquiryRecord.findUnique);
const updateMock = vi.mocked(prisma.enquiryRecord.update);
const adminUserFindManyMock = vi.mocked(prisma.adminUser.findMany);
const adminUserFindUniqueMock = vi.mocked(prisma.adminUser.findUnique);

const ROW = {
  id: 1,
  name: "Ama Owusu",
  personalDataDeletedAt: null,
  triageFlag: true,
  triagePriorityLevel: "High",
  status: "new",
  scoreSummary: { score: 62 },
  assignedPartnerId: null,
  assignedPartner: null,
  createdAt: new Date("2026-09-01T00:00:00Z"),
};

beforeEach(() => {
  countMock.mockReset();
  findManyMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
  adminUserFindManyMock.mockReset();
  adminUserFindUniqueMock.mockReset();
});

describe("resolveEnquirySource", () => {
  it("is Business Health Check when triageFlag is not null (diagnostic-originated)", () => {
    expect(resolveEnquirySource(true)).toBe("Business Health Check");
    expect(resolveEnquirySource(false)).toBe("Business Health Check");
  });

  it("is Contact form when triageFlag is null", () => {
    expect(resolveEnquirySource(null)).toBe("Contact form");
  });
});

describe("listEnquiries", () => {
  it("defaults to an unfiltered where clause and the triage-first default sort", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([ROW] as never);

    await listEnquiries();

    expect(countMock).toHaveBeenCalledWith({ where: {} });
    const findArgs = findManyMock.mock.calls[0][0] as {
      orderBy: unknown;
      skip: number;
      take: number;
    };
    expect(findArgs.orderBy).toEqual([
      { triageFlag: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ]);
    expect(findArgs.skip).toBe(0);
    expect(findArgs.take).toBe(ENQUIRIES_PAGE_SIZE);
  });

  it("filters by status, exactly as given", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ status: "converted" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ status: "converted" });
  });

  it("ignores status: all — no filter applied", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ status: "all" });

    expect(countMock).toHaveBeenCalledWith({ where: {} });
  });

  it("filters triage: flagged to triageFlag: true (the authoritative flag, not the priority word)", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ triage: "flagged" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ triageFlag: true });
  });

  it("filters triage: not_flagged to false-or-null", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ triage: "not_flagged" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({
      OR: [{ triageFlag: false }, { triageFlag: null }],
    });
  });

  it("filters source: diagnostic to triageFlag not null, source: contact to triageFlag null", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ source: "diagnostic" });
    let countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ triageFlag: { not: null } });

    await listEnquiries({ source: "contact" });
    countArgs = countMock.mock.calls[1][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ triageFlag: null });
  });

  it("filters by an inclusive date range, ignoring an unparsable date rather than throwing", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ dateFrom: "2026-09-01", dateTo: "not-a-date" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toHaveLength(1);
    expect(countArgs.where.AND[0]).toMatchObject({ createdAt: { gte: expect.any(Date) } });
  });

  it("sorts newest/oldest by createdAt alone when requested", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ sort: "newest" });
    expect((findManyMock.mock.calls[0][0] as { orderBy: unknown }).orderBy).toEqual([
      { createdAt: "desc" },
    ]);

    await listEnquiries({ sort: "oldest" });
    expect((findManyMock.mock.calls[1][0] as { orderBy: unknown }).orderBy).toEqual([
      { createdAt: "asc" },
    ]);
  });

  it("clamps an out-of-range page into [1, totalPages] rather than returning an empty page or throwing", async () => {
    countMock.mockResolvedValue(25);
    findManyMock.mockResolvedValue([ROW] as never);

    const result = await listEnquiries({ page: 99 });

    expect(result.totalPages).toBe(Math.ceil(25 / ENQUIRIES_PAGE_SIZE));
    expect(result.page).toBe(result.totalPages);
    expect((findManyMock.mock.calls[0][0] as { skip: number }).skip).toBe(
      (result.totalPages - 1) * ENQUIRIES_PAGE_SIZE,
    );
  });

  it("reports totalPages: 1 (not 0) when there are no matches at all", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    const result = await listEnquiries({ page: 5 });

    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
    expect(result.items).toEqual([]);
  });

  it("shapes each row: source resolved, score extracted from scoreSummary, triageFlag coerced to a real boolean", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([ROW] as never);

    const result = await listEnquiries();

    expect(result.items).toEqual([
      {
        id: 1,
        name: "Ama Owusu",
        personalDataDeletedAt: null,
        source: "Business Health Check",
        score: 62,
        triagePriorityLevel: "High",
        triageFlag: true,
        status: "new",
        assignedPartnerId: null,
        assignedPartnerName: null,
        createdAt: ROW.createdAt,
      },
    ]);
  });

  it("reports score: null and triageFlag: false for a contact-form-originated row", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([
      { ...ROW, triageFlag: null, triagePriorityLevel: null, scoreSummary: null },
    ] as never);

    const [item] = (await listEnquiries()).items;

    expect(item.score).toBeNull();
    expect(item.triageFlag).toBe(false);
    expect(item.source).toBe("Contact form");
  });

  it("resolves assignedPartnerName from the included relation when assigned", async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([
      { ...ROW, assignedPartnerId: 3, assignedPartner: { name: "Ama Wiafe" } },
    ] as never);

    const [item] = (await listEnquiries()).items;

    expect(item.assignedPartnerId).toBe(3);
    expect(item.assignedPartnerName).toBe("Ama Wiafe");
  });

  it("filters assignedTo: unassigned to assignedPartnerId: null", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ assignedTo: "unassigned" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ assignedPartnerId: null });
  });

  it("filters assignedTo: <id> to that exact assignedPartnerId", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ assignedTo: "3" });

    const countArgs = countMock.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(countArgs.where.AND).toContainEqual({ assignedPartnerId: 3 });
  });

  it("ignores assignedTo: all, and a non-numeric value, rather than filtering or throwing", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await listEnquiries({ assignedTo: "all" });
    expect(countMock).toHaveBeenCalledWith({ where: {} });

    await listEnquiries({ assignedTo: "not-a-number" });
    expect(countMock).toHaveBeenCalledWith({ where: {} });
  });
});

const DIAGNOSTIC_DETAIL_ROW = {
  id: 27,
  name: null,
  email: null,
  phone: null,
  message: null,
  personalDataDeletedAt: null,
  serviceLine: null,
  contactConsent: null,
  marketingConsent: false,
  triageFlag: true,
  triagePriorityLevel: "High",
  status: "new",
  internalNotes: null,
  assignedPartnerId: null,
  createdAt: new Date("2026-09-11T10:00:00Z"),
  scoreSummary: {
    score: 35,
    dimensionScores: [
      { dimensionId: 1, name: "Structure", score: 33, triageFlag: true },
      { dimensionId: 2, name: "Records", score: 90, triageFlag: false },
    ],
    weakestDimensions: ["Structure"],
    indicativeCostStatement: "",
    overallTriageFlag: true,
  },
  diagnosticResponses: [
    {
      questionId: 101,
      answerValue: "1",
      question: { promptText: "Is it registered?", responseType: "boolean", choiceOptions: null },
    },
    {
      questionId: 102,
      answerValue: "0.4",
      question: { promptText: "Rate your records", responseType: "scale", choiceOptions: null },
    },
    {
      questionId: 103,
      answerValue: "0.66",
      question: {
        promptText: "Applied for funding?",
        responseType: "choice",
        choiceOptions: [
          { label: "Never applied", value: "0" },
          { label: "3–12 months ago", value: "0.66" },
        ],
      },
    },
    {
      questionId: 104,
      answerValue: "0.99",
      question: {
        promptText: "An edited-away choice",
        responseType: "choice",
        choiceOptions: [{ label: "Only option left", value: "0.1" }],
      },
    },
  ],
  attribution: {
    utmSource: "meta",
    utmMedium: "paid_social",
    utmCampaign: "bhc-launch-accra",
    landingPage: "/lp/business-health-check",
    firstSeen: new Date("2026-09-11T09:55:00Z"),
  },
};

const CONTACT_DETAIL_ROW = {
  id: 5,
  name: "Abena Frimpong",
  email: "abena@example.com",
  phone: "0558000000",
  message: "Need help with cash flow.",
  personalDataDeletedAt: null,
  serviceLine: "financial-clarity",
  contactConsent: true,
  marketingConsent: false,
  triageFlag: null,
  triagePriorityLevel: null,
  status: "contacted",
  internalNotes: "Called back, waiting on documents.",
  assignedPartnerId: 3,
  createdAt: new Date("2026-09-05T14:00:00Z"),
  scoreSummary: null,
  diagnosticResponses: [],
  attribution: null,
};

describe("getEnquiryDetail", () => {
  it("returns null for a missing id", async () => {
    findUniqueMock.mockResolvedValue(null);

    expect(await getEnquiryDetail(999)).toBeNull();
  });

  it("shapes a diagnostic-originated row: dimension scores, weakest flag, and human-readable response labels", async () => {
    findUniqueMock.mockResolvedValue(DIAGNOSTIC_DETAIL_ROW as never);

    const detail = await getEnquiryDetail(27);

    expect(detail?.isDiagnosticOriginated).toBe(true);
    expect(detail?.source).toBe("Business Health Check");
    expect(detail?.dimensionScores).toEqual([
      { dimensionId: 1, name: "Structure", score: 33, weakest: true },
      { dimensionId: 2, name: "Records", score: 90, weakest: false },
    ]);
    expect(detail?.responses).toEqual([
      { questionId: 101, promptText: "Is it registered?", answerLabel: "Yes" },
      { questionId: 102, promptText: "Rate your records", answerLabel: "2 / 5" },
      { questionId: 103, promptText: "Applied for funding?", answerLabel: "3–12 months ago" },
      // No current option matches "0.99" (an edited-away choice) — falls back to the raw value.
      { questionId: 104, promptText: "An edited-away choice", answerLabel: "0.99" },
    ]);
    expect(detail?.attribution).toEqual({
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "bhc-launch-accra",
      landingPage: "/lp/business-health-check",
      firstSeen: DIAGNOSTIC_DETAIL_ROW.attribution.firstSeen,
    });
  });

  it("shapes a contact-form-originated row: not diagnostic-originated, empty responses/dimensions, no attribution", async () => {
    findUniqueMock.mockResolvedValue(CONTACT_DETAIL_ROW as never);

    const detail = await getEnquiryDetail(5);

    expect(detail?.isDiagnosticOriginated).toBe(false);
    expect(detail?.source).toBe("Contact form");
    expect(detail?.dimensionScores).toEqual([]);
    expect(detail?.responses).toEqual([]);
    expect(detail?.attribution).toBeNull();
    expect(detail?.message).toBe("Need help with cash flow.");
    expect(detail?.assignedPartnerId).toBe(3);
  });
});

describe("listAssignablePartners", () => {
  it("lists only active partners, ordered by name", async () => {
    adminUserFindManyMock.mockResolvedValue([{ id: 1, name: "Ama Owusu" }] as never);

    const partners = await listAssignablePartners();

    expect(adminUserFindManyMock).toHaveBeenCalledWith({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    expect(partners).toEqual([{ id: 1, name: "Ama Owusu" }]);
  });
});

describe("updateEnquiry", () => {
  it("rejects an invalid status without touching the database", async () => {
    await expect(
      updateEnquiry(1, { status: "bogus" as never, internalNotes: null, assignedPartnerId: null }),
    ).rejects.toBeInstanceOf(EnquiryWriteValidationError);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects an id that doesn't exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      updateEnquiry(999, { status: "new", internalNotes: null, assignedPartnerId: null } as never),
    ).rejects.toBeInstanceOf(EnquiryWriteValidationError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an assignedPartnerId that doesn't reference a real admin_user", async () => {
    findUniqueMock.mockResolvedValue({ status: "new" } as never);
    adminUserFindUniqueMock.mockResolvedValue(null);

    await expect(
      updateEnquiry(1, { status: "new", internalNotes: null, assignedPartnerId: 999 } as never),
    ).rejects.toBeInstanceOf(EnquiryWriteValidationError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("sets statusUpdatedAt only when status actually changes", async () => {
    findUniqueMock.mockResolvedValue({ status: "new" } as never);

    await updateEnquiry(1, { status: "contacted", internalNotes: "hi", assignedPartnerId: null });

    const updateArgs = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateArgs.data.status).toBe("contacted");
    expect(updateArgs.data.statusUpdatedAt).toBeInstanceOf(Date);
  });

  it("leaves statusUpdatedAt untouched for a notes-only save (status unchanged)", async () => {
    findUniqueMock.mockResolvedValue({ status: "new" } as never);

    await updateEnquiry(1, {
      status: "new",
      internalNotes: "updated notes",
      assignedPartnerId: null,
    });

    const updateArgs = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateArgs.data.internalNotes).toBe("updated notes");
    expect(updateArgs.data.statusUpdatedAt).toBeUndefined();
  });

  it("allows assignedPartnerId: null (unassigning) without a lookup", async () => {
    findUniqueMock.mockResolvedValue({ status: "new" } as never);

    await updateEnquiry(1, { status: "new", internalNotes: null, assignedPartnerId: null });

    expect(adminUserFindUniqueMock).not.toHaveBeenCalled();
    const updateArgs = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateArgs.data.assignedPartnerId).toBeNull();
  });
});

describe("deletePersonalData", () => {
  it("rejects an id that doesn't exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(deletePersonalData(999)).rejects.toBeInstanceOf(EnquiryWriteValidationError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("nulls name/email/phone/message and sets personalDataDeletedAt, applied the same way regardless of status", async () => {
    findUniqueMock.mockResolvedValue({ personalDataDeletedAt: null } as never);

    await deletePersonalData(5);

    const updateArgs = updateMock.mock.calls[0][0] as {
      where: { id: number };
      data: Record<string, unknown>;
    };
    expect(updateArgs.where).toEqual({ id: 5 });
    expect(updateArgs.data).toMatchObject({
      name: null,
      email: null,
      phone: null,
      message: null,
    });
    expect(updateArgs.data.personalDataDeletedAt).toBeInstanceOf(Date);
  });

  it("is idempotent — a second call preserves the original deletion timestamp rather than overwriting it", async () => {
    const originalDeletion = new Date("2026-09-01T00:00:00Z");
    findUniqueMock.mockResolvedValue({ personalDataDeletedAt: originalDeletion } as never);

    await deletePersonalData(5);

    const updateArgs = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateArgs.data.personalDataDeletedAt).toBe(originalDeletion);
  });
});
