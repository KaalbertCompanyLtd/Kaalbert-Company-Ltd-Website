import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiryRecord: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { ENQUIRIES_PAGE_SIZE, listEnquiries, resolveEnquirySource } from "@/lib/admin-enquiries";

const countMock = vi.mocked(prisma.enquiryRecord.count);
const findManyMock = vi.mocked(prisma.enquiryRecord.findMany);

const ROW = {
  id: 1,
  name: "Ama Owusu",
  triageFlag: true,
  triagePriorityLevel: "High",
  status: "new",
  scoreSummary: { score: 62 },
  createdAt: new Date("2026-09-01T00:00:00Z"),
};

beforeEach(() => {
  countMock.mockReset();
  findManyMock.mockReset();
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
        source: "Business Health Check",
        score: 62,
        triagePriorityLevel: "High",
        triageFlag: true,
        status: "new",
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
});
