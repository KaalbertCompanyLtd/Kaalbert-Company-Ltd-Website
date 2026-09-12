import type { ReactNode } from "react";
import Link from "next/link";

import { EnquiryStatus } from "@/generated/prisma/client";
import { listAssignablePartners, listEnquiries } from "@/lib/admin-enquiries";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import {
  ASSIGNMENT_FILTER_ALL,
  ASSIGNMENT_FILTER_UNASSIGNED,
  resolveTriageBadge,
  STATUS_LABELS,
  type EnquirySortValue,
  type EnquirySourceFilterValue,
  type EnquiryTriageFilterValue,
} from "@/lib/enquiry-list-options";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnquiriesFilters } from "./enquiries-filters";

/**
 * Reads live `enquiry_record` rows on every request — same reasoning as every other admin
 * list in this epic (T7.1's own comment): Prisma calls aren't tracked by Next's fetch-cache
 * heuristics, so this page can look static to Next.js even though it isn't.
 */
export const dynamic = "force-dynamic";

interface EnquiriesPageProps {
  searchParams: Promise<{
    status?: string | string[];
    triage?: string | string[];
    source?: string | string[];
    assignedTo?: string | string[];
    search?: string | string[];
    sort?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isEnquiryStatus(value: string | undefined): value is EnquiryStatus {
  return !!value && value in EnquiryStatus;
}

/** `"all"` (default) unless the value is `"unassigned"` or parses as a positive whole id. */
function normalizeAssignedTo(value: string | undefined): string {
  if (value === ASSIGNMENT_FILTER_UNASSIGNED) return ASSIGNMENT_FILTER_UNASSIGNED;
  if (value && Number.isInteger(Number(value)) && Number(value) > 0) return value;
  return ASSIGNMENT_FILTER_ALL;
}

/** Builds a shareable `/admin/enquiries` URL — same reasoning as `app/insights/page.tsx`'s `buildInsightsHref`. */
function buildEnquiriesHref(params: {
  status: string;
  triage: string;
  source: string;
  assignedTo: string;
  search: string;
  sort: string;
  from: string;
  to: string;
  page: number;
}): string {
  const qs = new URLSearchParams();
  if (params.status !== "all") qs.set("status", params.status);
  if (params.triage !== "all") qs.set("triage", params.triage);
  if (params.source !== "all") qs.set("source", params.source);
  if (params.assignedTo !== ASSIGNMENT_FILTER_ALL) qs.set("assignedTo", params.assignedTo);
  if (params.search) qs.set("search", params.search);
  if (params.sort !== "triage") qs.set("sort", params.sort);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  return query ? `/admin/enquiries?${query}` : "/admin/enquiries";
}

export default async function EnquiriesListPage({ searchParams }: EnquiriesPageProps) {
  const params = await searchParams;
  const statusParam = firstValue(params.status);
  const triageParam = firstValue(params.triage) as EnquiryTriageFilterValue | undefined;
  const sourceParam = firstValue(params.source) as EnquirySourceFilterValue | undefined;
  const sortParam = firstValue(params.sort) as EnquirySortValue | undefined;
  const from = firstValue(params.from) ?? "";
  const to = firstValue(params.to) ?? "";
  const search = (firstValue(params.search) ?? "").trim();
  const requestedPage = Number.parseInt(firstValue(params.page) ?? "1", 10);

  const status = isEnquiryStatus(statusParam) ? statusParam : "all";
  const triage = triageParam === "flagged" || triageParam === "not_flagged" ? triageParam : "all";
  const source = sourceParam === "diagnostic" || sourceParam === "contact" ? sourceParam : "all";
  const assignedTo = normalizeAssignedTo(firstValue(params.assignedTo));
  const sort = sortParam === "newest" || sortParam === "oldest" ? sortParam : "triage";

  const [result, partners, currentUser] = await Promise.all([
    listEnquiries({
      status,
      triage,
      source,
      assignedTo,
      search: search || undefined,
      sort,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    }),
    listAssignablePartners(),
    getCurrentAdminUser(),
  ]);

  const hasActiveFilters =
    status !== "all" ||
    triage !== "all" ||
    source !== "all" ||
    assignedTo !== "all" ||
    !!search ||
    from ||
    to;
  const hrefFor = (page: number) =>
    buildEnquiriesHref({ status, triage, source, assignedTo, search, sort, from, to, page });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Enquiries</h1>
        <p className="text-body text-muted-foreground mt-1">
          {result.totalCount} {result.totalCount === 1 ? "enquiry" : "enquiries"}
          {hasActiveFilters ? " matching the current filters" : " total"} · triage-flagged rows are
          surfaced first by default.
        </p>
      </div>

      <EnquiriesFilters
        value={{ status, triage, source, assignedTo, search, sort, dateFrom: from, dateTo: to }}
        partners={partners}
        currentUserId={currentUser?.id ?? null}
      />

      {result.items.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No enquiries match.{" "}
          {hasActiveFilters && (
            <Link href="/admin/enquiries" className="text-primary font-semibold hover:underline">
              Clear filters
            </Link>
          )}
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Triage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((enquiry) => {
                const triageBadge = resolveTriageBadge(
                  enquiry.triageFlag,
                  enquiry.triagePriorityLevel,
                );
                return (
                  <TableRow key={enquiry.id}>
                    <TableCell>
                      {enquiry.personalDataDeletedAt
                        ? "Personal data deleted"
                        : (enquiry.name ?? "Not yet provided")}
                    </TableCell>
                    <TableCell>{enquiry.source}</TableCell>
                    <TableCell>{enquiry.score !== null ? `${enquiry.score}/100` : "—"}</TableCell>
                    <TableCell>
                      {triageBadge.className ? (
                        <Badge className={triageBadge.className}>{triageBadge.label}</Badge>
                      ) : (
                        <Badge variant="outline">{triageBadge.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABELS[enquiry.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {enquiry.assignedPartnerName ? (
                        enquiry.assignedPartnerId === currentUser?.id ? (
                          <span className="font-semibold">You</span>
                        ) : (
                          enquiry.assignedPartnerName
                        )
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {enquiry.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="text-primary text-sm font-semibold hover:underline"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {result.totalPages > 1 && (
        <nav aria-label="Enquiries pagination" className="mt-4 flex flex-wrap items-center gap-2">
          <PaginationLink href={hrefFor(result.page - 1)} disabled={result.page === 1}>
            Prev
          </PaginationLink>
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <PaginationLink
              key={pageNumber}
              href={hrefFor(pageNumber)}
              active={pageNumber === result.page}
            >
              {pageNumber}
            </PaginationLink>
          ))}
          <PaginationLink
            href={hrefFor(result.page + 1)}
            disabled={result.page === result.totalPages}
          >
            Next
          </PaginationLink>
        </nav>
      )}
    </div>
  );
}

/** Same disabled-as-span/active-as-aria-current pattern as `app/insights/page.tsx`'s own `PaginationLink`. */
function PaginationLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const base =
    "inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-sm border px-3 text-sm font-semibold";
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} border-border text-muted-foreground/40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground hover:border-accent"
      }`}
    >
      {children}
    </Link>
  );
}
