import type { Metadata } from "next";
import Link from "next/link";

import { getAdvisoryRetainer, formatRetainerFee, getCapabilities } from "@/lib/capabilities";
import { getOfferNavLinks } from "@/lib/offers";
import { getPageBySlug } from "@/lib/pages";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Reads live `page`/`capability`/`advisory_retainer` rows on every request — same reasoning
// as app/(public)/page.tsx and app/offers/[slug]/page.tsx: this content is meant to become
// admin-editable (Milestone 7), and Railway's build container can't reach the
// private-network DB host production reads use, so a static-prerender attempt at build time
// fails outright (memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

const KICKER = "text-kicker text-accent mb-3 block font-semibold tracking-[0.08em] uppercase";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary px-6 py-3 text-body font-semibold text-secondary-foreground transition-colors hover:bg-muted";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("capabilities");
  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

export default async function CapabilitiesPage() {
  const [page, capabilities, retainer, offerNavLinks] = await Promise.all([
    getPageBySlug("capabilities"),
    getCapabilities(),
    getAdvisoryRetainer(),
    getOfferNavLinks(),
  ]);

  return (
    <>
      <SiteHeader hasHero offerNavLinks={offerNavLinks} />
      <main>
        {/* Hero — the shared `page` entity's own copy. */}
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[760px] px-2">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              {page.heroKicker}
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              {page.heroHeading}
            </h1>
            <p className="text-lead font-light text-[#C9D3CD]">{page.heroLead}</p>
          </div>
        </section>

        {/* The 8 service-line summaries, in the mockup's defined order. */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div
                key={capability.slug}
                className="border-border bg-card flex flex-col gap-2.5 rounded-md border p-6 shadow-sm"
              >
                <h3 className="font-display text-primary mb-0.5 text-[1.125rem] font-bold">
                  {capability.name}
                </h3>
                <p className="text-body text-muted-foreground mb-0">
                  {capability.shortDescription}
                </p>
                <Link
                  href={`/contact?service=${capability.slug}`}
                  className="text-primary mt-auto font-bold hover:underline"
                >
                  Enquire →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* The Advisory Retainer — a continuing arrangement, not a ninth card in the grid
            above (capabilities-page.md's business rule: distinct in tone from the eight
            transactional service lines). */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-[900px]">
            <div className="bg-muted border-border flex flex-wrap items-center justify-between gap-6 rounded-md border p-8">
              <div>
                <span className={`${KICKER} mb-1.5`}>Continuing arrangement</span>
                <h3 className="font-display text-primary text-h3 mb-1.5 font-bold">
                  The Advisory Retainer
                </h3>
                <p className="text-body text-foreground mb-0 max-w-[480px]">
                  {retainer.description}
                </p>
                <span className="text-body text-accent mt-2 block font-mono font-bold">
                  From{" "}
                  {formatRetainerFee(
                    retainer.feeAmount,
                    retainer.feeCurrency,
                    retainer.billingPeriod,
                  )}
                </span>
              </div>
              <Link href="/contact?service=advisory-retainer" className={BTN_SECONDARY}>
                Ask about the retainer
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter
        addressLine1="House No. 13 Gbenjin Gbe Avenue"
        addressLine2="East Legon-ARS, Accra"
        phonePrimary="0558 480 001"
      />
    </>
  );
}
