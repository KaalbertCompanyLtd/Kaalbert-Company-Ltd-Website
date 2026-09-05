import type { Metadata } from "next";

import { DiagnosticFlow } from "@/components/diagnostic-flow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveDiagnosticFlow } from "@/lib/diagnostic-flow";
import { getOfferNavLinks } from "@/lib/offers";
import { buildPageMetadata } from "@/lib/seo";

// Reads live `diagnostic_dimension`/`diagnostic_question` rows on every request — same
// reasoning as every other page built against seeded content (memory/decision-log.md, T2.1):
// this question set is meant to become admin-editable (Milestone 7, T7.7), and Railway's
// build container can't reach the private-network DB host to statically prerender this route.
export const dynamic = "force-dynamic";

// No `page` row for this route — `docs/features/business-health-check-diagnostic.md` never
// names a hero/marketing-copy entity for `/diagnostic` (unlike capabilities/our-method), and
// its on-screen chrome (the H1, the "no contact details" note) is fixed template text tightly
// coupled to the flow's own mechanics, not independently editable marketing copy — same
// treatment as `HomePageContent`'s non-editable template chrome (T2.1).
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Business Health Check — Kaalbert & Company Ltd",
    description:
      "Free, six-minute Business Health Check — an honest first read on the business, with no contact details needed to see your result.",
    path: "/diagnostic",
  });
}

export default async function DiagnosticPage() {
  const [questions, offerNavLinks] = await Promise.all([
    getActiveDiagnosticFlow(),
    getOfferNavLinks(),
  ]);

  return (
    <>
      <SiteHeader hasHero={false} offerNavLinks={offerNavLinks} />
      <main id="main" className="px-4 pt-[132px] pb-16 sm:px-6 sm:pt-[156px]">
        <div className="mx-auto mb-8 max-w-[640px] text-center">
          <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
            Business Health Check
          </span>
          <h1 className="font-display text-primary mb-4 text-[clamp(1.5rem,3vw,1.75rem)] font-bold">
            {questions.length} questions, plain language, under six minutes
          </h1>
          <p className="text-body text-muted-foreground">
            No contact details needed to see your result — you&apos;ll get an honest read on the
            business first, and can decide afterwards whether to take anything further.
          </p>
        </div>

        <DiagnosticFlow questions={questions} />
      </main>
      <SiteFooter
        addressLine1="House No. 13 Gbenjin Gbe Avenue"
        addressLine2="East Legon-ARS, Accra"
        phonePrimary="0558 480 001"
      />
    </>
  );
}
