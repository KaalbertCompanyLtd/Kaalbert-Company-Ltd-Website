import { EnquiryStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DiagnosticScoringResult } from "@/lib/diagnostic-scoring";
import type {
  EnquirySortValue,
  EnquirySourceFilterValue,
  EnquiryTriageFilterValue,
} from "@/lib/enquiry-list-options";

/**
 * `/admin/enquiries` (T8.2) — mirrors `INSIGHTS_PAGE_SIZE`'s precedent in `lib/insights.ts`:
 * a real server-side page size, not a client-side slice of a fully-fetched list. This is the
 * first *admin* list in this codebase to paginate server-side (Articles/Subscribers/Offers/
 * Landing Pages all load their full set and filter/paginate client-side, fine for their much
 * smaller row counts) — required here because `enquiry-management.md`'s own edge case says
 * this list "must stay performant as records accumulate over years."
 */
export const ENQUIRIES_PAGE_SIZE = 20;

/** `triageFlag` is null only for a contact-form-originated row (see `EnquiryRecord` model doc-comment). */
export function resolveEnquirySource(triageFlag: boolean | null): string {
  return triageFlag !== null ? "Business Health Check" : "Contact form";
}

export interface EnquiryListQuery {
  status?: EnquiryStatus | "all";
  triage?: EnquiryTriageFilterValue;
  source?: EnquirySourceFilterValue;
  /** Inclusive, `YYYY-MM-DD`. Invalid/unparsable values are ignored, never thrown. */
  dateFrom?: string;
  /** Inclusive, `YYYY-MM-DD` — the whole day is included (23:59:59.999 local). */
  dateTo?: string;
  sort?: EnquirySortValue;
  /** 1-based. Out-of-range values are clamped, never thrown — mirrors `getInsightsIndex`. */
  page?: number;
}

export interface EnquiryListItem {
  id: number;
  name: string | null;
  source: string;
  /** The diagnostic's overall 0–100 score, or `null` for a contact-form-originated row. */
  score: number | null;
  triagePriorityLevel: string | null;
  triageFlag: boolean;
  status: EnquiryStatus;
  createdAt: Date;
}

export interface EnquiryListResult {
  items: EnquiryListItem[];
  /** Echoes back the query actually applied, after clamping. */
  page: number;
  totalPages: number;
  totalCount: number;
}

function parseDateBoundary(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function buildWhere(query: EnquiryListQuery): Prisma.EnquiryRecordWhereInput {
  const AND: Prisma.EnquiryRecordWhereInput[] = [];

  if (query.status && query.status !== "all") {
    AND.push({ status: query.status });
  }
  if (query.triage === "flagged") {
    AND.push({ triageFlag: true });
  } else if (query.triage === "not_flagged") {
    AND.push({ OR: [{ triageFlag: false }, { triageFlag: null }] });
  }
  if (query.source === "diagnostic") {
    AND.push({ triageFlag: { not: null } });
  } else if (query.source === "contact") {
    AND.push({ triageFlag: null });
  }
  const from = parseDateBoundary(query.dateFrom, false);
  if (from) {
    AND.push({ createdAt: { gte: from } });
  }
  const to = parseDateBoundary(query.dateTo, true);
  if (to) {
    AND.push({ createdAt: { lte: to } });
  }

  return AND.length > 0 ? { AND } : {};
}

/**
 * Default ("triage"): a triage-flagged row always sorts before a non-flagged one
 * (`enquiry-management.md`'s own business rule), regardless of source — `nulls: "last"` is
 * required here specifically because Postgres's own default for `ORDER BY ... DESC` is
 * `NULLS FIRST`, which would otherwise put every contact-form-originated row (`triageFlag:
 * null`) ahead of every genuinely-flagged diagnostic row.
 */
function buildOrderBy(sort: EnquirySortValue): Prisma.EnquiryRecordOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "triage":
    default:
      return [{ triageFlag: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

function extractScore(scoreSummary: Prisma.JsonValue | null): number | null {
  if (!scoreSummary || typeof scoreSummary !== "object") return null;
  const score = (scoreSummary as unknown as DiagnosticScoringResult).score;
  return typeof score === "number" ? score : null;
}

export async function listEnquiries(query: EnquiryListQuery = {}): Promise<EnquiryListResult> {
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query.sort ?? "triage");

  const totalCount = await prisma.enquiryRecord.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / ENQUIRIES_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages);

  const rows = await prisma.enquiryRecord.findMany({
    where,
    orderBy,
    skip: (page - 1) * ENQUIRIES_PAGE_SIZE,
    take: ENQUIRIES_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      triageFlag: true,
      triagePriorityLevel: true,
      status: true,
      scoreSummary: true,
      createdAt: true,
    },
  });

  const items: EnquiryListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    source: resolveEnquirySource(row.triageFlag),
    score: extractScore(row.scoreSummary),
    triagePriorityLevel: row.triagePriorityLevel,
    triageFlag: row.triageFlag === true,
    status: row.status,
    createdAt: row.createdAt,
  }));

  return { items, page, totalPages, totalCount };
}
