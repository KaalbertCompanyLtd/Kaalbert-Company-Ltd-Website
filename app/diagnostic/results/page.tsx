import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NOT_FOUND_METADATA } from "@/app/not-found";
import { DiagnosticCompletedEvent } from "@/components/diagnostic-completed-event";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getScoreBand } from "@/lib/diagnostic-flow";
import { getDiagnosticResultByEnquiryId } from "@/lib/diagnostic-submit";
import { getOfferNavLinks } from "@/lib/offers";
import { buildPageMetadata } from "@/lib/seo";

// Reads a live `enquiry_record` row on every request — same reasoning as every other page
// built against seeded/submitted content (memory/decision-log.md, T2.1): Railway's build
// container can't reach the private-network DB host to statically prerender this route.
export const dynamic = "force-dynamic";

// FR-2.8's own exact wording (docs/requirements.md) — not the mockup's own paraphrase, per
// this task's explicit acceptance criterion ("Disclaimer text matches FR-2.8 verbatim").
const DISCLAIMER_TEXT =
  "An indicative self-assessment based on user-supplied information, not a professional opinion, not to be relied upon by any third party.";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-6 py-3 text-body font-semibold text-primary transition-colors hover:bg-muted";

interface DiagnosticResultsPageProps {
  searchParams: Promise<{ enquiry_id?: string | string[] }>;
}

function parseEnquiryId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) ? id : null;
}

export async function generateMetadata({
  searchParams,
}: DiagnosticResultsPageProps): Promise<Metadata> {
  const { enquiry_id } = await searchParams;
  const enquiryId = parseEnquiryId(enquiry_id);
  const result = enquiryId ? await getDiagnosticResultByEnquiryId(enquiryId) : null;
  if (!result) return NOT_FOUND_METADATA;

  return {
    ...buildPageMetadata({
      title: "Your Business Health Check Result — Kaalbert & Company Ltd",
      description:
        "An honest, scored read on the business — structure, records, cash control, funding readiness and owner dependence.",
      path: "/diagnostic/results",
    }),
    // Personalized, non-shareable per-visitor content — never indexed.
    robots: { index: false, follow: false },
  };
}

export default async function DiagnosticResultsPage({ searchParams }: DiagnosticResultsPageProps) {
  const { enquiry_id } = await searchParams;
  const enquiryId = parseEnquiryId(enquiry_id);
  const result = enquiryId ? await getDiagnosticResultByEnquiryId(enquiryId) : null;

  if (!result || !enquiryId) {
    notFound();
  }

  const [offerNavLinks, band] = await Promise.all([getOfferNavLinks(), getScoreBand(result.score)]);
  const weakestSet = new Set(result.weakestDimensions);

  return (
    <>
      <DiagnosticCompletedEvent enquiryId={enquiryId} />
      <SiteHeader hasHero={false} offerNavLinks={offerNavLinks} />
      <main id="main" className="px-4 pt-[132px] pb-16 sm:px-6 sm:pt-[156px]">
        <div className="mx-auto mb-9 max-w-[720px] text-center">
          <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
            Your result
          </span>
          <div className="font-display text-primary text-[4rem] leading-none font-bold">
            {result.score}%
          </div>
          {band && <div className="text-accent text-lead mb-3.5 font-bold">{band.label}</div>}
          <p className="text-body text-muted-foreground mx-auto max-w-[560px]">
            {band ? band.statement : result.indicativeCostStatement}
          </p>
        </div>

        <div className="border-border bg-card mx-auto mb-8 max-w-[720px] rounded-md border p-6 sm:p-8">
          {band && (
            <p className="text-caption text-muted-foreground mb-5">
              {result.indicativeCostStatement}
            </p>
          )}
          {result.dimensionScores.map((dimension) => {
            const isWeak = weakestSet.has(dimension.name);
            return (
              <div key={dimension.dimensionId} className="mb-4.5 last:mb-0">
                <div className="text-body mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-foreground font-bold">
                    {dimension.name}
                    {isWeak && (
                      <span className="text-accent text-caption ml-1.5 font-normal">— weakest</span>
                    )}
                  </span>
                  <span className="text-muted-foreground shrink-0">{dimension.score}%</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${isWeak ? "bg-accent" : "bg-primary"}`}
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-muted border-accent mx-auto mb-10 max-w-[720px] rounded-sm border-l-[3px] p-5">
          <p className="text-caption text-muted-foreground">{DISCLAIMER_TEXT}</p>
        </div>

        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-caption text-muted-foreground mb-3.5">
            Not ready for that yet? Both routes stay open.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link href="/contact" className={BTN_SECONDARY}>
              Talk to a partner directly
            </Link>
            <Link href="/our-method" className={BTN_SECONDARY}>
              See how the firm works
            </Link>
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
