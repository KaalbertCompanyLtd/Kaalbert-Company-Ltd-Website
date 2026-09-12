import Link from "next/link";

import { getAdminDashboardStats, getRecentEnquiries } from "@/lib/admin-dashboard";
import { resolveTriageBadge, STATUS_LABELS } from "@/lib/enquiry-list-options";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Reads live `enquiry_record`/`article` counts on every request — same reasoning as
 * app/our-method/page.tsx: Railway's build container can't reach the private-network DB
 * host production reads use, so a static-prerender attempt at build time fails outright
 * (memory/decision-log.md, T2.1).
 */
export const dynamic = "force-dynamic";

const STAT_CARDS = [
  { key: "newEnquiriesCount", label: "New Enquiries" },
  { key: "triageFlaggedCount", label: "Triage-flagged" },
  { key: "diagnosticsThisMonthCount", label: "Diagnostics This Month" },
  { key: "publishedArticlesCount", label: "Published Articles" },
] as const;

/** Every href below now resolves to a real, built page (Milestone 7 and T8.2 both shipped). */
const QUICK_ACTIONS = [
  { label: "Publish a new Insights article", href: "/admin/articles" },
  { label: "Update a core offer's fee band", href: "/admin/offers" },
  { label: "Review flagged enquiries", href: "/admin/enquiries" },
  { label: "Manage my account & 2FA", href: "/admin/setup-2fa" },
] as const;

export default async function AdminDashboardPage() {
  const [stats, recentEnquiries] = await Promise.all([
    getAdminDashboardStats(),
    getRecentEnquiries(),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">Dashboard</h1>
          <p className="text-body text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening across the site.
          </p>
        </div>
        <Link
          href="/admin/articles"
          className="bg-primary text-primary-foreground hover:bg-pine-700 inline-flex w-fit items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          New Article
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.key} className="p-5">
            <span className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-[0.05em] uppercase">
              {card.label}
            </span>
            <span className="font-display text-primary text-[1.75rem]">{stats[card.key]}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="mb-4 text-[1.0625rem] font-semibold">Recent enquiries</h2>
          {recentEnquiries.length === 0 ? (
            <p className="text-body text-muted-foreground">No enquiries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Triage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEnquiries.map((enquiry) => {
                  const triageBadge = resolveTriageBadge(
                    enquiry.triageFlag,
                    enquiry.triagePriorityLevel,
                  );
                  return (
                    <TableRow key={enquiry.id}>
                      <TableCell>{enquiry.name ?? "Not yet provided"}</TableCell>
                      <TableCell>{enquiry.source}</TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-[1.0625rem] font-semibold">Quick actions</h2>
          <div className="flex flex-col gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="border-border text-primary hover:bg-muted block rounded-sm border px-3.5 py-3 text-sm font-semibold transition-colors"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
