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
  /**
   * Always "new" — `enquiry_record` has no `status` column yet (`content-management-
   * admin.md`'s `status = new` filter and the mockup's Status badge both assume the
   * `status`/`assigned_partner_id`/`internal_notes`/`status_updated_at` extension that
   * `enquiry-management.md` defines but `docs/tasks/08-enquiry-management.md` T8.1 — not
   * this task — actually builds; see the model doc-comment on `EnquiryRecord` in
   * prisma/schema.prisma). Every row is honestly "new" today: no status-transition capability
   * exists yet for it to be anything else. See memory/technical-debt.md for the tracked gap.
   */
  status: "new";
}

function currentMonthRange(now: Date): { start: Date; end: Date } {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/**
 * The four stat-card counts (`content-management-admin.md`'s "Admin dashboard" section).
 * "New enquiries" is `COUNT(enquiry_record)` with no filter — see `RecentEnquiry.status`'s
 * doc-comment for why that's the honest equivalent of "status = new" today.
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
      prisma.enquiryRecord.count(),
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
    select: { id: true, name: true, triageFlag: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    source: resolveEnquirySource(row.triageFlag),
    triageFlag: row.triageFlag === true,
    status: "new",
  }));
}
