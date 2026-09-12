/**
 * Client-safe status/triage labels and filter/sort option lists shared by the admin
 * dashboard (T7.1/T8.1) and the enquiries list (T8.2) — deliberately its own file, zero
 * import of `@/lib/prisma` or `@/generated/prisma/client` (which pulls in the same
 * server-only engine code), so a "use client" filter component can import these values
 * directly. Mirrors `lib/diagnostic-flow-options.ts`'s precedent for this exact problem.
 */

export type EnquiryStatusValue = "new" | "contacted" | "closed" | "converted" | "not_a_fit";

export const STATUS_LABELS: Record<EnquiryStatusValue, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
  converted: "Converted",
  not_a_fit: "Not a fit",
};

export const STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: EnquiryStatusValue | "all";
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "converted", label: "Converted" },
  { value: "not_a_fit", label: "Not a fit" },
];

export type EnquiryTriageFilterValue = "all" | "flagged" | "not_flagged";

export const TRIAGE_FILTER_OPTIONS: ReadonlyArray<{
  value: EnquiryTriageFilterValue;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "flagged", label: "Flagged" },
  { value: "not_flagged", label: "Not flagged" },
];

export type EnquirySourceFilterValue = "all" | "diagnostic" | "contact";

export const SOURCE_FILTER_OPTIONS: ReadonlyArray<{
  value: EnquirySourceFilterValue;
  label: string;
}> = [
  { value: "all", label: "All sources" },
  { value: "diagnostic", label: "Business Health Check" },
  { value: "contact", label: "Contact form" },
];

/**
 * `"all"` (no filter) or `"unassigned"` are the two fixed values; anything else is a real
 * `admin_user.id` as a string (the partner list itself is dynamic, fetched from the DB via
 * `lib/admin-enquiries.ts`'s `listAssignablePartners`, so it can't be a static union the way
 * every other filter type on this page is) — added session 61 after the user pointed out
 * `assignedPartnerId` was write-only: settable on the detail screen, but with no way for a
 * partner to ever find "my assigned enquiries" again afterward (no list column, no filter, no
 * dashboard surface).
 */
export type EnquiryAssignmentFilterValue = "all" | "unassigned" | string;

export const ASSIGNMENT_FILTER_ALL = "all";
export const ASSIGNMENT_FILTER_UNASSIGNED = "unassigned";

export type EnquirySortValue = "triage" | "newest" | "oldest";

export const SORT_OPTIONS: ReadonlyArray<{ value: EnquirySortValue; label: string }> = [
  { value: "triage", label: "Triage priority (default)" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/**
 * Mirrors `ui/mockups/_shared.css`'s `badge-triage-high/medium/low` classes via this
 * project's Tailwind design tokens (ADR 0010) rather than that raw CSS — first built for
 * the dashboard's Triage column (T8.1), reused as-is by the enquiries list (T8.2).
 */
export const TRIAGE_BADGE_CLASSES: Record<string, string> = {
  High: "bg-accent text-accent-foreground",
  Medium: "border-brass-300 bg-brass-500/15 text-brass-500 border",
  Low: "border-border text-muted-foreground border bg-transparent",
};

export interface TriageBadgeInfo {
  label: string;
  /** `undefined` means the caller should render its own neutral/outline variant. */
  className: string | undefined;
}

/**
 * Three real states, not two — found and fixed while building T8.2's own Triage filter
 * (which correctly filters on the authoritative `triageFlag` boolean, per
 * `enquiry-management.md`'s "Triage-flagged enquiries... sorted first by default" business
 * rule): a pre-T8.1 enquiry can have `triageFlag: true` with `triagePriorityLevel: null` (no
 * backfill, per T8.1's own Input → Output contract) — rendering that as "Not flagged" (T8.1's
 * original dashboard badge logic) is actively misleading, not just imprecise, once a partner
 * can filter specifically on "Flagged" and see rows labelled "Not flagged" in the result.
 * This resolves to a real "Flagged" (no priority word available) badge for exactly that case,
 * instead.
 */
export function resolveTriageBadge(
  triageFlag: boolean,
  triagePriorityLevel: string | null,
): TriageBadgeInfo {
  if (triagePriorityLevel && triagePriorityLevel in TRIAGE_BADGE_CLASSES) {
    return { label: triagePriorityLevel, className: TRIAGE_BADGE_CLASSES[triagePriorityLevel] };
  }
  if (triageFlag) {
    return { label: "Flagged", className: TRIAGE_BADGE_CLASSES.High };
  }
  return { label: "Not flagged", className: undefined };
}
