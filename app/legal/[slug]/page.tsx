import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NOT_FOUND_METADATA } from "@/app/not-found";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRevisedDate, getLegalPageBySlug } from "@/lib/legal";
import type { LegalPageBlock } from "@/lib/legal";
import { getOfferNavLinks } from "@/lib/offers";
import { buildPageMetadata, legalPageBodyExcerpt, resolveMetaDescription } from "@/lib/seo";

// Reads live `legal_page` rows on every request — same reasoning as every other page built
// against seeded content this epic (memory/decision-log.md, T2.1): this content is meant to
// become admin-editable (Milestone 7), and Railway's build container can't reach the
// private-network DB host to statically prerender this route at build time.
export const dynamic = "force-dynamic";

interface LegalPageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageParams): Promise<Metadata> {
  const { slug } = await params;
  const legalPage = await getLegalPageBySlug(slug);
  if (!legalPage) return NOT_FOUND_METADATA;
  const blocks = legalPage.body as unknown as LegalPageBlock[];
  return buildPageMetadata({
    title: `${legalPage.title} — Kaalbert & Company Ltd`,
    description: resolveMetaDescription(legalPage.metaDescription, legalPageBodyExcerpt(blocks)),
    path: `/legal/${legalPage.slug}`,
  });
}

/**
 * One content block, matching `ui/mockups/e-legal/*.html`'s own visual treatment per kind:
 * `.statement-box` (highlighted), plain prose, `.pending-note` (dashed border, italic), or a
 * data table (`.cookie-table`/`.boundary-table`).
 */
function LegalBlock({ block }: { block: LegalPageBlock }) {
  switch (block.kind) {
    case "statement":
      return (
        <div className="border-accent bg-muted text-body mb-2 rounded-sm border-l-[3px] p-5">
          {block.text}
        </div>
      );

    case "prose":
      return (
        <>
          {block.heading && (
            <h2 className="font-display text-primary mt-9 mb-2.5 text-[1.25rem] font-bold">
              {block.heading}
            </h2>
          )}
          <p
            className={
              block.variant === "muted"
                ? "text-caption text-muted-foreground mb-4.5 leading-[1.75]"
                : "text-body text-foreground mb-4.5 leading-[1.75]"
            }
          >
            {block.text}
          </p>
        </>
      );

    case "pending":
      return (
        <>
          <h2 className="font-display text-primary mt-9 mb-2.5 text-[1.25rem] font-bold">
            {block.heading}
          </h2>
          <div className="border-border bg-muted text-caption text-muted-foreground mb-4.5 rounded-sm border border-dashed px-4 py-3.5 italic">
            {block.text}
          </div>
        </>
      );

    case "table":
      return (
        <>
          {block.heading && (
            <h2 className="font-display text-primary mt-9 mb-2.5 text-[1.25rem] font-bold">
              {block.heading}
            </h2>
          )}
          <Table className="mb-4.5">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {block.headers.map((header) => (
                  <TableHead
                    key={header}
                    className="text-accent text-kicker h-auto px-3.5 py-2.5 font-semibold tracking-[0.04em] whitespace-normal uppercase"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row) => (
                <TableRow key={row[0]} className="border-border hover:bg-transparent">
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className={
                        cellIndex === 0
                          ? "text-primary px-3.5 py-3 align-top whitespace-normal"
                          : "text-muted-foreground px-3.5 py-3 align-top whitespace-normal"
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      );
  }
}

export default async function LegalPage({ params }: LegalPageParams) {
  const { slug } = await params;
  const [legalPage, offerNavLinks] = await Promise.all([
    getLegalPageBySlug(slug),
    getOfferNavLinks(),
  ]);

  if (!legalPage) {
    notFound();
  }

  const blocks = legalPage.body as unknown as LegalPageBlock[];

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader offerNavLinks={offerNavLinks} />
      <main className="pt-19">
        {/* No hero — ui/mockups/e-legal/*.html's plain <body>, per this task's own architecture
            constraint. */}
        <div className="border-border border-b px-4 pt-12 pb-8 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <span className="text-kicker text-accent mb-3 block font-semibold tracking-[0.08em] uppercase">
              Legal
            </span>
            <h1 className="font-display text-primary mb-1 text-[clamp(1.75rem,4vw,2.25rem)] font-bold">
              {legalPage.title}
            </h1>
            <div className="text-caption text-muted-foreground">
              {formatRevisedDate(legalPage.lastRevisedAt)}
            </div>
          </div>
        </div>

        <div className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            {/* T2.7's acceptance criterion: a visible marker until the firm supplies final
                text — never presented as final copy in the meantime. */}
            {legalPage.isPlaceholder && (
              <div className="border-border bg-muted text-caption text-muted-foreground mb-8 rounded-sm border border-dashed px-4 py-3">
                <strong className="text-foreground font-semibold">
                  Draft — pending legal review.
                </strong>{" "}
                This page is a structural placeholder. The firm&apos;s counsel has not yet supplied
                final wording — do not treat this content as final legal text.
              </div>
            )}

            {blocks.map((block, index) => (
              <LegalBlock key={index} block={block} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter
        addressLine1="House No. 13 Gbenjin Gbe Avenue"
        addressLine2="East Legon-ARS, Accra"
        phonePrimary="0558 480 001"
      />
    </>
  );
}
