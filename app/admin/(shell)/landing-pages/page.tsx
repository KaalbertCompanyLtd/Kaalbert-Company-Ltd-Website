import Link from "next/link";

import { getLandingPageList } from "@/lib/admin-landing-pages";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

/**
 * `ui/screen-inventory.md` #32 ("Landing pages list"), inferred from #26's `AdminDataTable`
 * pattern — only three-or-so rows will ever realistically exist here
 * (`landing-page-template.md`'s own "three instances exist at launch" business rule), so no
 * pagination.
 */
export default async function LandingPagesListPage() {
  const landingPages = await getLandingPageList();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">Landing Pages</h1>
          <p className="text-body text-muted-foreground mt-1">
            {landingPages.length} live campaign page{landingPages.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/admin/landing-pages/new"
          className="bg-primary text-primary-foreground hover:bg-pine-700 inline-flex w-fit items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          New Landing Page
        </Link>
      </div>

      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Headline</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Campaign reference</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {landingPages.map((landingPage) => (
              <TableRow key={landingPage.slug}>
                <TableCell className="font-semibold">{landingPage.headline}</TableCell>
                <TableCell>
                  <a
                    href={`/lp/${landingPage.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-mono text-xs hover:underline"
                  >
                    /lp/{landingPage.slug}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {landingPage.campaignReference}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {landingPage.updatedAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/landing-pages/${landingPage.slug}`}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
