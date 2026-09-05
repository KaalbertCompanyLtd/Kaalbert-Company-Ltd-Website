import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { getOfferNavLinks } from "@/lib/offers";
import { getPageBySlug } from "@/lib/pages";
import { getMethodStages } from "@/lib/our-method";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Reads live `page`/`method_stage` rows on every request — same reasoning as
// app/capabilities/page.tsx: this content is meant to become admin-editable (Milestone 7),
// and Railway's build container can't reach the private-network DB host production reads
// use, so a static-prerender attempt at build time fails outright (memory/decision-log.md,
// T2.1).
export const dynamic = "force-dynamic";

const KICKER = "text-kicker text-accent mb-3 block font-semibold tracking-[0.08em] uppercase";
const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("our-method");
  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

/**
 * The mockup's intro paragraph links each of the three core-offer names inline
 * (`our-method.html`'s two `<a>` tags). `page.introCopy` stays plain, admin-editable text
 * (no markup embedded, same as every other content field in this project) — this splits it
 * on each live offer's own `name` and re-inserts a real `Link` to that offer's actual route,
 * so the links stay correct even if an offer is renamed or re-ordered, without requiring a
 * templating scheme in the database field itself.
 */
function renderIntroCopyWithOfferLinks(
  introCopy: string,
  offerNavLinks: { name: string; href: string }[],
) {
  const namesPattern = offerNavLinks
    .map((offer) => offer.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!namesPattern) {
    return introCopy;
  }
  const parts = introCopy.split(new RegExp(`(${namesPattern})`, "g"));
  return parts.map((part, index) => {
    const offer = offerNavLinks.find((candidate) => candidate.name === part);
    if (!offer) {
      return <Fragment key={index}>{part}</Fragment>;
    }
    return (
      <Link key={index} href={offer.href} className="text-primary font-bold hover:underline">
        {part}
      </Link>
    );
  });
}

export default async function OurMethodPage() {
  const [page, stages, offerNavLinks] = await Promise.all([
    getPageBySlug("our-method"),
    getMethodStages(),
    getOfferNavLinks(),
  ]);

  // `introCopy` is mandatory content for this page specifically (our-method-page.md's edge
  // case: this page does not degrade gracefully to a partial state) — a null value here is a
  // seed/migration bug, not a real "no content yet" state a visitor should ever see.
  if (!page.introCopy) {
    throw new Error(
      `page "our-method" has no introCopy — run \`npm run db:seed\` (see prisma/seed.ts).`,
    );
  }

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

        {/* Intro copy — the `page` entity's own `introCopy` field, above the stage list per
            the mockup, with the three core-offer names linked to their real routes (the
            mockup's own two `<a>` tags). The kicker text itself is fixed chrome, same
            treatment as capabilities.html's "Continuing arrangement" kicker. */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[820px]">
            <span className={KICKER}>One journey, not three separate products</span>
            <p className="text-body text-foreground mb-0 max-w-[640px]">
              {renderIntroCopyWithOfferLinks(page.introCopy, offerNavLinks)}
            </p>
          </div>
        </section>

        {/* The four stages, in fixed order, each shown with equal structural depth
            (our-method-page.md's business rule). */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto flex max-w-[820px] flex-col">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`grid grid-cols-1 gap-6 py-10 sm:grid-cols-[100px_1fr] sm:gap-8 ${
                  index < stages.length - 1 ? "border-border border-b" : ""
                }`}
              >
                <span className="font-display text-brass-500 text-h1 leading-none">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-primary text-h3 mb-3 font-bold">{stage.name}</h3>
                  <p className="text-body text-foreground mb-4">{stage.description}</p>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <span className={KICKER}>What happens</span>
                      <p className="text-body text-foreground mb-0">{stage.whatHappens}</p>
                    </div>
                    <div>
                      <span className={KICKER}>What the client sees</span>
                      <p className="text-body text-foreground mb-0">{stage.clientSees}</p>
                    </div>
                    <div>
                      <span className={KICKER}>Decision point</span>
                      <p className="text-body text-foreground mb-0">{stage.decisionPoint}</p>
                    </div>
                  </div>

                  {/* Capability transfer — mandatory content, Deliver stage only
                      (our-method-page.md's business rule; capabilityTransferNote is null for
                      the other three stages). */}
                  {stage.capabilityTransferNote && (
                    <div className="bg-muted border-border mt-6 rounded-md border p-7">
                      <h4 className="font-display text-primary mb-2 text-[1.0625rem] font-bold">
                        Capability transfer, not dependency
                      </h4>
                      <p className="text-body text-foreground mb-0">
                        {stage.capabilityTransferNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA — fixed template chrome, same treatment as app/(public)/page.tsx's own
            hardcoded "Take the free Business Health Check" button; not named as a data field
            in our-method-page.md's Data requirements section. */}
        <section className="border-border border-t px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-[640px]">
            <h2 className="font-display text-primary text-h2 mb-3 font-bold">
              See the method applied to your own numbers.
            </h2>
            <p className="text-lead text-muted-foreground mb-6 font-light">
              The free Business Health Check runs the first stage — Discover — in under six minutes.
            </p>
            <Link href="/diagnostic" className={BTN_ACCENT}>
              Take the free Business Health Check
            </Link>
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
