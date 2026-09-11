import { EnquiryStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface AdminDashboardStats {
  newEnquiriesCount: number;
  triageFlaggedCount: number;
  diagnosticsThisMonthCount: number;
  publishedArticlesCount: number;
}

export interface RecentEnquiry {
  id: number;
  name: string | null;
  /** "Business Health Check" (diagnostic-originated) or "Contact form" — see resolveEnquirySource. */
  source: string;
  triageFlag: boolean;
  /** "High"/"Medium"/"Low", or null (contact-form-originated, or no threshold breached). */
  triagePriorityLevel: string | null;
  /** The real `enquiry_record.status` column (T8.1) — no longer a hardcoded placeholder. */
  status: EnquiryStatus;
}

function currentMonthRange(now: Date): { start: Date; end: Date } {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/**
 * The four stat-card counts (`content-management-admin.md`'s "Admin dashboard" section).
 * "New enquiries" filters on the real `status: "new"` column (T8.1) — previously an
 * unfiltered `COUNT(enquiry_record)` worked around `status` not existing yet (see
 * memory/technical-debt.md's now-resolved entry on this).
 * "Diagnostics this month" filters on `triageFlag: { not: null }` rather than `scoreSummary`
 * (both are diagnostic-only/null-for-contact-form per the `EnquiryRecord` model doc-comment)
 * because `triageFlag` is a plain nullable `Boolean`, not a nullable `Json` column, so `not:
 * null` filters unambiguously — a nullable Json field's DB-null vs. JSON-null distinction
 * (`Prisma.DbNull`/`Prisma.JsonNull`) has no equivalent ambiguity to get wrong here.
 */
export async function getAdminDashboardStats(now = new Date()): Promise<AdminDashboardStats> {
  const { start, end } = currentMonthRange(now);

  const [newEnquiriesCount, triageFlaggedCount, diagnosticsThisMonthCount, publishedArticlesCount] =
    await Promise.all([
      prisma.enquiryRecord.count({ where: { status: EnquiryStatus.new } }),
      prisma.enquiryRecord.count({ where: { triageFlag: true } }),
      prisma.enquiryRecord.count({
        where: { triageFlag: { not: null }, createdAt: { gte: start, lt: end } },
      }),
      prisma.article.count({ where: { publishedAt: { not: null } } }),
    ]);

  return {
    newEnquiriesCount,
    triageFlaggedCount,
    diagnosticsThisMonthCount,
    publishedArticlesCount,
  };
}

/** `triageFlag` is null only for a contact-form-originated row (see model doc-comment). */
function resolveEnquirySource(triageFlag: boolean | null): string {
  return triageFlag !== null ? "Business Health Check" : "Contact form";
}

/**
 * The five most recent `enquiry_record` rows, unfiltered — `content-management-admin.md`'s
 * "Recent enquiries panel". Columns follow `ui/mockups/g-admin-content/admin-dashboard.html`
 * exactly (Name/Source/Triage/Status), not `enquiry-management.md`'s fuller list-screen field
 * set (that screen, T8.2, also adds Business/Date columns this dashboard's own mockup omits).
 */
export async function getRecentEnquiries(): Promise<RecentEnquiry[]> {
  const rows = await prisma.enquiryRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, triageFlag: true, triagePriorityLevel: true, status: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    source: resolveEnquirySource(row.triageFlag),
    triageFlag: row.triageFlag === true,
    triagePriorityLevel: row.triagePriorityLevel,
    status: row.status,
  }));
}
