"use client";

import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SubscriberListRow {
  id: number;
  email: string;
  consent: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

const PAGE_SIZE = 10;
const ALL = "all";
const SUBSCRIBED = "subscribed";
const UNSUBSCRIBED = "unsubscribed";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A CSV field, quoted only when it needs to be (contains a comma, quote, or newline). */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Client-side CSV generation from the currently filtered `rows` (pre-pagination, so every
 * page of the filtered set is included, not just the page currently on screen) — this
 * task's own acceptance criterion is "export produces a file matching the on-screen filtered
 * set," and every row this screen ever shows is already loaded in the browser (no separate
 * export endpoint exists in `content-management-admin.md`'s Interfaces list), so building the
 * file directly from the same array the table renders is the simplest way to guarantee the
 * two always match — there's no second query that could drift from what's on screen.
 *
 * Columns cover every field `insights-engine.md`'s "Data requirements" names for `subscriber`
 * (id, email, subscribed_at, consent, unsubscribed_at) — `id` in particular is the row's own
 * stable identifier and must be present for the export to be a complete, reconcilable record
 * of who's on the list, not just a display convenience mirroring the on-screen table (which
 * omits `id` since it has no display purpose there).
 */
function downloadCsv(rows: SubscriberListRow[]) {
  const header = ["ID", "Email", "Consent", "Subscribed at", "Status", "Unsubscribed at"];
  const lines = rows.map((row) =>
    [
      String(row.id),
      csvField(row.email),
      row.consent ? "Yes" : "No",
      csvField(row.subscribedAt),
      row.unsubscribedAt ? "Unsubscribed" : "Subscribed",
      csvField(row.unsubscribedAt ?? ""),
    ].join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Search/status filtering and pagination, client-side — same pattern as
 * `app/admin/(shell)/articles/articles-list-client.tsx`'s `ArticlesListClient`. Purely
 * operates on the plain `subscribers` array passed as props (never a `lib/` import) — safe
 * for a `"use client"` component per CLAUDE.md's rule.
 */
export function SubscribersListClient({ subscribers }: { subscribers: SubscriberListRow[] }) {
  const [rows, setRows] = useState(subscribers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === ALL ||
        (statusFilter === SUBSCRIBED && !row.unsubscribedAt) ||
        (statusFilter === UNSUBSCRIBED && row.unsubscribedAt);
      const matchesSearch = !q || row.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, statusFilter]);

  // Computed from `rows` state (kept in sync by `handleRemove`), not a server-rendered
  // count — a Remove action here doesn't navigate, so a static server count would go stale
  // the moment a partner removes someone without reloading the page.
  const activeCount = rows.filter((row) => !row.unsubscribedAt).length;

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void) {
    return (value: string | null) => {
      setter(value ?? ALL);
      setPage(1);
    };
  }

  async function handleRemove(id: number) {
    setRemovingId(id);
    try {
      await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
      setRows(
        rows.map((row) =>
          row.id === id ? { ...row, unsubscribedAt: new Date().toISOString() } : row,
        ),
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <p className="text-body text-muted-foreground mb-4">
        {activeCount} subscribed, {rows.length - activeCount} unsubscribed.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="search"
            placeholder="Search email…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={updateFilter(setStatusFilter)}
            items={{ [ALL]: "All", [SUBSCRIBED]: "Subscribed", [UNSUBSCRIBED]: "Unsubscribed" }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value={SUBSCRIBED}>Subscribed</SelectItem>
              <SelectItem value={UNSUBSCRIBED}>Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={matches.length === 0}
          onClick={() => downloadCsv(matches)}
        >
          Export ({matches.length})
        </Button>
      </div>

      {matches.length === 0 ? (
        <p className="text-body text-muted-foreground">No subscribers match.</p>
      ) : (
        <div className="border-border overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold whitespace-normal">{row.email}</TableCell>
                  <TableCell>{row.consent ? "Yes" : "No"}</TableCell>
                  <TableCell>{formatDate(row.subscribedAt)}</TableCell>
                  <TableCell>
                    {row.unsubscribedAt ? (
                      <Badge variant="outline">Unsubscribed</Badge>
                    ) : (
                      <Badge className="bg-pine-500 text-primary-foreground">Subscribed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!row.unsubscribedAt && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <button
                              type="button"
                              disabled={removingId === row.id}
                              className="text-accent text-sm font-semibold hover:underline"
                            />
                          }
                        >
                          Remove
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove &quot;{row.email}&quot;?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Same effect as this person clicking their own unsubscribe link — their
                              record stays, marked unsubscribed, never deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(row.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
