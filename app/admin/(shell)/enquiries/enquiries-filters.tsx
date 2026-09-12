"use client";

import { useRouter } from "next/navigation";

import {
  SOURCE_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TRIAGE_FILTER_OPTIONS,
} from "@/lib/enquiry-list-options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EnquiriesFiltersValue {
  status: string;
  triage: string;
  source: string;
  sort: string;
  dateFrom: string;
  dateTo: string;
}

/**
 * Every filter/sort control here drives a real, shareable URL query string — never
 * client-only state — mirroring `app/insights/page.tsx`'s established precedent (T4.2) for
 * exactly this problem, adapted from plain `<Link>` filter pills to Base UI `Select`s since
 * this screen has five independent filter dimensions at once (`enquiry-management.md`'s
 * User flow step 3: status/triage/date range/source, plus sort), not one or two. Purely
 * operates on plain string props/`@/lib/enquiry-list-options` (never a `lib/` import that
 * touches `@/lib/prisma`) — safe for a `"use client"` component per CLAUDE.md's rule.
 */
export function EnquiriesFilters({ value }: { value: EnquiriesFiltersValue }) {
  const router = useRouter();

  function navigate(next: Partial<EnquiriesFiltersValue>) {
    const merged = { ...value, ...next };
    const params = new URLSearchParams();
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.triage !== "all") params.set("triage", merged.triage);
    if (merged.source !== "all") params.set("source", merged.source);
    if (merged.sort !== "triage") params.set("sort", merged.sort);
    if (merged.dateFrom) params.set("from", merged.dateFrom);
    if (merged.dateTo) params.set("to", merged.dateTo);
    const query = params.toString();
    router.push(query ? `/admin/enquiries?${query}` : "/admin/enquiries");
  }

  const statusItems = Object.fromEntries(STATUS_FILTER_OPTIONS.map((o) => [o.value, o.label]));
  const triageItems = Object.fromEntries(TRIAGE_FILTER_OPTIONS.map((o) => [o.value, o.label]));
  const sourceItems = Object.fromEntries(SOURCE_FILTER_OPTIONS.map((o) => [o.value, o.label]));
  const sortItems = Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.label]));

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-status">Status</Label>
        <Select
          value={value.status}
          onValueChange={(v) => navigate({ status: v ?? "all" })}
          items={statusItems}
        >
          <SelectTrigger id="enquiries-filter-status" className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-triage">Triage</Label>
        <Select
          value={value.triage}
          onValueChange={(v) => navigate({ triage: v ?? "all" })}
          items={triageItems}
        >
          <SelectTrigger id="enquiries-filter-triage" className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIAGE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-source">Source</Label>
        <Select
          value={value.source}
          onValueChange={(v) => navigate({ source: v ?? "all" })}
          items={sourceItems}
        >
          <SelectTrigger id="enquiries-filter-source" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-from">From</Label>
        <Input
          id="enquiries-filter-from"
          type="date"
          value={value.dateFrom}
          onChange={(event) => navigate({ dateFrom: event.target.value })}
          className="w-full sm:w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-to">To</Label>
        <Input
          id="enquiries-filter-to"
          type="date"
          value={value.dateTo}
          onChange={(event) => navigate({ dateTo: event.target.value })}
          className="w-full sm:w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiries-filter-sort">Sort by</Label>
        <Select
          value={value.sort}
          onValueChange={(v) => navigate({ sort: v ?? "triage" })}
          items={sortItems}
        >
          <SelectTrigger id="enquiries-filter-sort" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
