"use client";

import { useRouter } from "next/navigation";

import type { AssignablePartner } from "@/lib/admin-enquiries";
import {
  ASSIGNMENT_FILTER_ALL,
  ASSIGNMENT_FILTER_UNASSIGNED,
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
  assignedTo: string;
  /** Case-insensitive name/email substring match — added session 61, see `lib/admin-enquiries.ts`. */
  search: string;
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
/**
 * `partners`/`currentUserId` added session 61, alongside the new `assignedTo` filter — the
 * "My enquiries" button is just this same filter pre-set to the signed-in partner's own id,
 * not a separate mechanism, so it stays a shareable/bookmarkable URL like every other filter
 * here. `currentUserId` is `null` for the rare account with no session (shouldn't happen
 * behind `proxy.ts`, but the button simply doesn't render rather than assuming).
 *
 * It renders with `aria-pressed`/a solid active state, i.e. it looks like a toggle — so
 * clicking it again while already active must actually un-apply the filter (back to "All
 * partners"), not just re-navigate to the same URL. Without that, it reads as a tab with no
 * way back except rediscovering the "Assigned to" dropdown underneath it (real gap found by
 * the user, session 61 follow-up).
 */
export function EnquiriesFilters({
  value,
  partners,
  currentUserId,
}: {
  value: EnquiriesFiltersValue;
  partners: AssignablePartner[];
  currentUserId: number | null;
}) {
  const router = useRouter();

  function navigate(next: Partial<EnquiriesFiltersValue>) {
    const merged = { ...value, ...next };
    const params = new URLSearchParams();
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.triage !== "all") params.set("triage", merged.triage);
    if (merged.source !== "all") params.set("source", merged.source);
    if (merged.assignedTo !== ASSIGNMENT_FILTER_ALL) params.set("assignedTo", merged.assignedTo);
    if (merged.search) params.set("search", merged.search);
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
  const assignedToItems = Object.fromEntries([
    [ASSIGNMENT_FILTER_ALL, "All partners"],
    [ASSIGNMENT_FILTER_UNASSIGNED, "Unassigned"],
    ...partners.map((partner): [string, string] => [String(partner.id), partner.name]),
  ]);

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const input = event.currentTarget.elements.namedItem(
            "enquiries-filter-search",
          ) as HTMLInputElement;
          navigate({ search: input.value.trim() });
        }}
        className="flex flex-col gap-1.5"
      >
        <Label htmlFor="enquiries-filter-search">Search name or email</Label>
        <Input
          key={value.search}
          id="enquiries-filter-search"
          name="enquiries-filter-search"
          type="search"
          defaultValue={value.search}
          placeholder="Search name or email…"
          className="w-full sm:w-56"
        />
      </form>

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
        <Label htmlFor="enquiries-filter-assigned">Assigned to</Label>
        <Select
          value={value.assignedTo}
          onValueChange={(v) => navigate({ assignedTo: v ?? ASSIGNMENT_FILTER_ALL })}
          items={assignedToItems}
        >
          <SelectTrigger id="enquiries-filter-assigned" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ASSIGNMENT_FILTER_ALL}>All partners</SelectItem>
            <SelectItem value={ASSIGNMENT_FILTER_UNASSIGNED}>Unassigned</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={String(partner.id)}>
                {partner.name}
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

      {currentUserId !== null && (
        <button
          type="button"
          onClick={() =>
            navigate({
              assignedTo:
                value.assignedTo === String(currentUserId)
                  ? ASSIGNMENT_FILTER_ALL
                  : String(currentUserId),
            })
          }
          aria-pressed={value.assignedTo === String(currentUserId)}
          className="border-border text-foreground hover:border-accent aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground h-8 shrink-0 rounded-sm border px-3 text-sm font-semibold transition-colors"
        >
          My enquiries
        </button>
      )}
    </div>
  );
}
