import { DiagnosticResponseType, EnquiryStatus, Prisma } from "@/generated/prisma/client";
import {
  DIAGNOSTIC_BOOLEAN_OPTIONS,
  DIAGNOSTIC_SCALE_OPTIONS,
  type DiagnosticChoiceOption,
} from "@/lib/diagnostic-flow-options";
import type { DiagnosticScoringResult } from "@/lib/diagnostic-scoring";
import { prisma } from "@/lib/prisma";
import type {
  EnquiryAssignmentFilterValue,
  EnquirySortValue,
  EnquirySourceFilterValue,
  EnquiryTriageFilterValue,
} from "@/lib/enquiry-list-options";
import { ASSIGNMENT_FILTER_UNASSIGNED } from "@/lib/enquiry-list-options";

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
  /** `"all"` (default), `"unassigned"`, or a real `admin_user.id` as a string — session 61. */
  assignedTo?: EnquiryAssignmentFilterValue;
  /**
   * Case-insensitive substring match against `name` OR `email` — added session 61 after the
   * user pointed out there was no way to actually find the one enquiry a personal-data-
   * deletion request refers to, short of paging through the list by eye. A row whose personal
   * data has already been deleted never matches (both fields are `null` by then), which is the
   * correct behavior, not a gap — nothing sensitive to find once it's gone.
   */
  search?: string;
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
  /** Set once this row's personal data has been deleted (T8.4/FR-6.4) — distinguishes a real deletion from a `name` that was simply never given. */
  personalDataDeletedAt: Date | null;
  source: string;
  /** The diagnostic's overall 0–100 score, or `null` for a contact-form-originated row. */
  score: number | null;
  triagePriorityLevel: string | null;
  triageFlag: boolean;
  status: EnquiryStatus;
  assignedPartnerId: number | null;
  /** `null` when unassigned — session 61, so the list/dashboard can finally show who an enquiry is assigned to without opening it. */
  assignedPartnerName: string | null;
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
  if (query.assignedTo === ASSIGNMENT_FILTER_UNASSIGNED) {
    AND.push({ assignedPartnerId: null });
  } else if (query.assignedTo && query.assignedTo !== "all") {
    const partnerId = Number.parseInt(query.assignedTo, 10);
    if (Number.isInteger(partnerId)) {
      AND.push({ assignedPartnerId: partnerId });
    }
  }
  const searchTerm = query.search?.trim();
  if (searchTerm) {
    AND.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
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
      personalDataDeletedAt: true,
      triageFlag: true,
      triagePriorityLevel: true,
      status: true,
      scoreSummary: true,
      assignedPartnerId: true,
      assignedPartner: { select: { name: true } },
      createdAt: true,
    },
  });

  const items: EnquiryListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    personalDataDeletedAt: row.personalDataDeletedAt,
    source: resolveEnquirySource(row.triageFlag),
    score: extractScore(row.scoreSummary),
    triagePriorityLevel: row.triagePriorityLevel,
    triageFlag: row.triageFlag === true,
    status: row.status,
    assignedPartnerId: row.assignedPartnerId,
    assignedPartnerName: row.assignedPartner?.name ?? null,
    createdAt: row.createdAt,
  }));

  return { items, page, totalPages, totalCount };
}

// ---------------------------------------------------------------------------
// Detail — T8.3
// ---------------------------------------------------------------------------

export interface EnquiryDetailDimensionScore {
  dimensionId: number;
  name: string;
  score: number;
  weakest: boolean;
}

export interface EnquiryDetailResponse {
  questionId: number;
  promptText: string;
  answerLabel: string;
}

export interface EnquiryAttribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string;
  firstSeen: Date;
}

export interface EnquiryDetail {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  /** Set once this enquiry's personal data has been deleted (T8.4/FR-6.4). */
  personalDataDeletedAt: Date | null;
  serviceLine: string | null;
  contactConsent: boolean | null;
  marketingConsent: boolean;
  source: string;
  /** `false` only for a contact-form-originated row — see `resolveEnquirySource`. */
  isDiagnosticOriginated: boolean;
  score: number | null;
  triagePriorityLevel: string | null;
  triageFlag: boolean;
  dimensionScores: EnquiryDetailDimensionScore[];
  responses: EnquiryDetailResponse[];
  attribution: EnquiryAttribution | null;
  status: EnquiryStatus;
  internalNotes: string | null;
  assignedPartnerId: number | null;
  createdAt: Date;
}

export interface AssignablePartner {
  id: number;
  name: string;
}

/**
 * Finds the option (from a question's fixed scale/boolean set, or its own admin-authored
 * `choiceOptions`) whose normalized `value` matches this response's stored `answerValue`, and
 * returns its human-readable `label` — reconstructing what the mockup shows as a plain answer
 * ("Rough notes", "2 / 5", "No") from what this schema actually stores (only the normalized
 * 0–1 string, per `lib/diagnostic-scoring.ts`'s own convention). Falls back to the raw stored
 * value itself if no option matches (e.g. a choice question's options were edited since this
 * response was submitted) — never fabricates a label that isn't traceable to real data.
 */
function resolveAnswerLabel(
  responseType: DiagnosticResponseType,
  answerValue: string,
  choiceOptions: Prisma.JsonValue | null,
): string {
  if (responseType === DiagnosticResponseType.boolean) {
    const match = DIAGNOSTIC_BOOLEAN_OPTIONS.find((option) => option.value === answerValue);
    return match?.label ?? answerValue;
  }
  if (responseType === DiagnosticResponseType.scale) {
    const match = DIAGNOSTIC_SCALE_OPTIONS.find((option) => option.value === answerValue);
    return match ? `${match.label} / 5` : answerValue;
  }
  const options = Array.isArray(choiceOptions)
    ? (choiceOptions as unknown as DiagnosticChoiceOption[])
    : [];
  const match = options.find((option) => option.value === answerValue);
  return match?.label ?? answerValue;
}

function extractDimensionScores(
  scoreSummary: Prisma.JsonValue | null,
): EnquiryDetailDimensionScore[] {
  if (!scoreSummary || typeof scoreSummary !== "object") return [];
  const result = scoreSummary as unknown as DiagnosticScoringResult;
  const weakest = new Set(result.weakestDimensions ?? []);
  return (result.dimensionScores ?? []).map((dimension) => ({
    dimensionId: dimension.dimensionId,
    name: dimension.name,
    score: dimension.score,
    weakest: weakest.has(dimension.name),
  }));
}

export async function getEnquiryDetail(id: number): Promise<EnquiryDetail | null> {
  const row = await prisma.enquiryRecord.findUnique({
    where: { id },
    include: {
      diagnosticResponses: {
        orderBy: { id: "asc" },
        include: {
          question: { select: { promptText: true, responseType: true, choiceOptions: true } },
        },
      },
      attribution: true,
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    personalDataDeletedAt: row.personalDataDeletedAt,
    serviceLine: row.serviceLine,
    contactConsent: row.contactConsent,
    marketingConsent: row.marketingConsent,
    source: resolveEnquirySource(row.triageFlag),
    isDiagnosticOriginated: row.triageFlag !== null,
    score: extractScore(row.scoreSummary),
    triagePriorityLevel: row.triagePriorityLevel,
    triageFlag: row.triageFlag === true,
    dimensionScores: extractDimensionScores(row.scoreSummary),
    responses: row.diagnosticResponses.map((response) => ({
      questionId: response.questionId,
      promptText: response.question.promptText,
      answerLabel: resolveAnswerLabel(
        response.question.responseType,
        response.answerValue,
        response.question.choiceOptions,
      ),
    })),
    attribution: row.attribution
      ? {
          utmSource: row.attribution.utmSource,
          utmMedium: row.attribution.utmMedium,
          utmCampaign: row.attribution.utmCampaign,
          landingPage: row.attribution.landingPage,
          firstSeen: row.attribution.firstSeen,
        }
      : null,
    status: row.status,
    internalNotes: row.internalNotes,
    assignedPartnerId: row.assignedPartnerId,
    createdAt: row.createdAt,
  };
}

/** Every active partner, for the detail screen's assignment dropdown — no existing precedent for this anywhere else in the admin. */
export async function listAssignablePartners(): Promise<AssignablePartner[]> {
  return prisma.adminUser.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export class EnquiryWriteValidationError extends Error {}

export interface EnquiryUpdateInput {
  status: EnquiryStatus;
  internalNotes: string | null;
  assignedPartnerId: number | null;
}

/**
 * `PATCH /api/admin/enquiries/[id]` (T8.3) — updates only the firm's own fields; a visitor's
 * submitted responses/contact details are never touched here (`enquiry-management.md`'s own
 * business rule — enforced by this function simply never accepting them as input, not by a
 * runtime check). `statusUpdatedAt` is set to `now()` only when `status` actually changes —
 * see its own doc-comment on `EnquiryRecord` in `prisma/schema.prisma`: it tracks one specific
 * field's change, not "last modified in any way," so a notes-only or assignment-only save
 * must leave it untouched.
 */
export async function updateEnquiry(id: number, input: EnquiryUpdateInput): Promise<void> {
  if (!(input.status in EnquiryStatus)) {
    throw new EnquiryWriteValidationError("Invalid status.");
  }

  const existing = await prisma.enquiryRecord.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) {
    throw new EnquiryWriteValidationError("Enquiry not found.");
  }

  if (input.assignedPartnerId !== null) {
    const partner = await prisma.adminUser.findUnique({
      where: { id: input.assignedPartnerId },
      select: { id: true },
    });
    if (!partner) {
      throw new EnquiryWriteValidationError("Invalid assigned partner.");
    }
  }

  await prisma.enquiryRecord.update({
    where: { id },
    data: {
      status: input.status,
      internalNotes: input.internalNotes,
      assignedPartnerId: input.assignedPartnerId,
      ...(existing.status !== input.status ? { statusUpdatedAt: new Date() } : {}),
    },
  });
}

/**
 * `DELETE /api/admin/enquiries/[id]/personal-data` (T8.4, FR-6.4) — nulls contact details/
 * identifying information while retaining every non-personal field (`scoreSummary`,
 * `triageFlag`/`triagePriorityLevel`, `status`, `internalNotes`, `assignedPartnerId`,
 * `createdAt`, the row itself) so aggregate KPIs (e.g. "diagnostics this month") keep counting
 * this row exactly as before. Applied identically regardless of `status` — the firm confirmed
 * at T8.4 (session 59, 2026-09-12) that a `converted` enquiry gets no special treatment (see
 * `memory/decision-log.md`). Idempotent: calling this again on an already-deleted row is a
 * harmless no-op (the fields are already null) and preserves the original
 * `personalDataDeletedAt` timestamp rather than overwriting it with a later one.
 */
export async function deletePersonalData(id: number): Promise<void> {
  const existing = await prisma.enquiryRecord.findUnique({
    where: { id },
    select: { personalDataDeletedAt: true },
  });
  if (!existing) {
    throw new EnquiryWriteValidationError("Enquiry not found.");
  }

  await prisma.enquiryRecord.update({
    where: { id },
    data: {
      name: null,
      email: null,
      phone: null,
      message: null,
      personalDataDeletedAt: existing.personalDataDeletedAt ?? new Date(),
    },
  });
}
