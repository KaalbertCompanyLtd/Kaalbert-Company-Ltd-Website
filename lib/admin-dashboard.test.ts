import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { count: vi.fn(), findMany: vi.fn() },
    article: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAdminDashboardStats, getRecentEnquiries } from "@/lib/admin-dashboard";

const enquiryCountMock = vi.mocked(prisma.enquiryRecord.count);
const enquiryFindManyMock = vi.mocked(prisma.enquiryRecord.findMany);
const articleCountMock = vi.mocked(prisma.article.count);

beforeEach(() => {
  enquiryCountMock.mockReset();
  enquiryFindManyMock.mockReset();
  articleCountMock.mockReset();
});

describe("getAdminDashboardStats", () => {
  it("counts New Enquiries filtered to the real status: new column (T8.1)", async () => {
    enquiryCountMock.mockResolvedValueOnce(7); // New enquiries
    enquiryCountMock.mockResolvedValueOnce(2); // Triage-flagged
    enquiryCountMock.mockResolvedValueOnce(34); // Diagnostics this month
    articleCountMock.mockResolvedValueOnce(8); // Published articles

    const stats = await getAdminDashboardStats(new Date("2026-09-15T12:00:00Z"));

    expect(stats).toEqual({
      newEnquiriesCount: 7,
      triageFlaggedCount: 2,
      diagnosticsThisMonthCount: 34,
      publishedArticlesCount: 8,
    });
    expect(enquiryCountMock.mock.calls[0][0]).toEqual({ where: { status: "new" } });
  });

  it("filters Triage-flagged to triageFlag: true", async () => {
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    articleCountMock.mockResolvedValueOnce(0);

    await getAdminDashboardStats(new Date("2026-09-15T12:00:00Z"));

    expect(enquiryCountMock.mock.calls[1][0]).toEqual({ where: { triageFlag: true } });
  });

  it("filters Diagnostics this month to triageFlag not-null (diagnostic-originated) within the calendar month", async () => {
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    articleCountMock.mockResolvedValueOnce(0);

    await getAdminDashboardStats(new Date("2026-09-15T12:00:00Z"));

    expect(enquiryCountMock.mock.calls[2][0]).toEqual({
      where: {
        triageFlag: { not: null },
        createdAt: { gte: new Date(2026, 8, 1), lt: new Date(2026, 9, 1) },
      },
    });
  });

  it("filters Published articles to publishedAt not-null", async () => {
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    enquiryCountMock.mockResolvedValueOnce(0);
    articleCountMock.mockResolvedValueOnce(0);

    await getAdminDashboardStats(new Date("2026-09-15T12:00:00Z"));

    expect(articleCountMock).toHaveBeenCalledWith({ where: { publishedAt: { not: null } } });
  });
});

describe("getRecentEnquiries", () => {
  it("returns the 5 most recent rows unfiltered, ordered newest-first", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 3, name: "Kwesi Owusu", triageFlag: true, triagePriorityLevel: "High", status: "new" },
      {
        id: 2,
        name: "Abena Frimpong",
        triageFlag: false,
        triagePriorityLevel: null,
        status: "contacted",
      },
      { id: 1, name: null, triageFlag: null, triagePriorityLevel: null, status: "new" },
    ] as never);

    const result = await getRecentEnquiries();

    expect(enquiryFindManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, triageFlag: true, triagePriorityLevel: true, status: true },
    });
    expect(result).toHaveLength(3);
  });

  it("labels a diagnostic-originated row (triageFlag not null) as Business Health Check", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Efua Asante", triageFlag: true, triagePriorityLevel: "High", status: "new" },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.source).toBe("Business Health Check");
    expect(result.triageFlag).toBe(true);
    expect(result.triagePriorityLevel).toBe("High");
  });

  it("labels a contact-form-originated row (triageFlag null) as Contact form", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Abena Frimpong", triageFlag: null, triagePriorityLevel: null, status: "new" },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.source).toBe("Contact form");
    expect(result.triageFlag).toBe(false);
    expect(result.triagePriorityLevel).toBeNull();
  });

  it("passes through the real status column instead of a hardcoded placeholder (T8.1)", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        name: "Yaw Mensah",
        triageFlag: false,
        triagePriorityLevel: null,
        status: "converted",
      },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.status).toBe("converted");
  });

  it("passes through a null name (no contact details submitted yet)", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: null, triageFlag: true, triagePriorityLevel: "Medium", status: "new" },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.name).toBeNull();
  });
});
