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
  it("counts all enquiry_record rows for New Enquiries — no status column exists yet, so every row is honestly new", async () => {
    enquiryCountMock.mockResolvedValueOnce(7); // New enquiries — no where clause
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
    expect(enquiryCountMock.mock.calls[0][0]).toBeUndefined();
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
      { id: 3, name: "Kwesi Owusu", triageFlag: true },
      { id: 2, name: "Abena Frimpong", triageFlag: false },
      { id: 1, name: null, triageFlag: null },
    ] as never);

    const result = await getRecentEnquiries();

    expect(enquiryFindManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, triageFlag: true },
    });
    expect(result).toHaveLength(3);
  });

  it("labels a diagnostic-originated row (triageFlag not null) as Business Health Check", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Efua Asante", triageFlag: true },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.source).toBe("Business Health Check");
    expect(result.triageFlag).toBe(true);
  });

  it("labels a contact-form-originated row (triageFlag null) as Contact form", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Abena Frimpong", triageFlag: null },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.source).toBe("Contact form");
    expect(result.triageFlag).toBe(false);
  });

  it("always reports status as new — no status column exists yet", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([
      { id: 1, name: "Yaw Mensah", triageFlag: false },
    ] as never);

    const [result] = await getRecentEnquiries();

    expect(result.status).toBe("new");
  });

  it("passes through a null name (no contact details submitted yet)", async () => {
    enquiryFindManyMock.mockResolvedValueOnce([{ id: 1, name: null, triageFlag: true }] as never);

    const [result] = await getRecentEnquiries();

    expect(result.name).toBeNull();
  });
});
