import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NOT_FOUND_METADATA } from "@/app/not-found";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatFeeBand, getOfferBySlug, getOfferNavLinks } from "@/lib/offers";
import type { MethodStage, OfferFaq } from "@/lib/offers";
import { buildPageMetadata, resolveMetaDescription } from "@/lib/seo";

// Reads live `offer`/`offer_tier` rows on every request — same reasoning as
// app/(public)/page.tsx: this content is meant to become admin-editable (Milestone 7), and
// Railway's build container can't reach the private-network DB host to statically prerender
// this route at build time (memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";
const H3 = "font-display mb-1 text-h3 font-bold text-primary";

const KICKER = "text-kicker text-accent mb-3 block font-semibold tracking-[0.08em] uppercase";

/**
 * Fixed section-heading chrome, identical wording across all three offer mockups — the
 * per-offer variable is the content underneath, not this label (same "template chrome vs.
 * DB field" split home-page.md/T2.1 established).
 */
const SECTION_LABELS = {
  method: "The method, stage by stage",
  deliverablesFlat: "What you receive",
  deliverablesTiered: "Two levels, sized to your business — what you receive",
  clientInputs: "Required from you",
  timeline: "Indicative timeline",
  outOfScope: "What sits outside this offer",
  faq: "Real questions",
} as const;

/**
 * The bottom "soft re-engagement" section's copy differs per offer in the mockups, but isn't
 * part of core-offer-pages.md's documented `offer` entity (FR-4.1's 10 fixed sections end at
 * "one call to action" — the fee-panel CTA below). With exactly three offers ever existing at
 * launch (core-offer-pages.md's own business rule), a small fixed map here is the reasonable
 * choice over adding an undocumented field to the entity for content that isn't part of its
 * contract (see memory/decision-log.md, T2.2).
 */
const FINAL_CTA_COPY: Record<string, { heading: string; lead: string }> = {
  "business-health-check": {
    heading: "Not sure this is the right starting point?",
    lead: "Take the free six-minute Business Health Check first — a lighter, no-cost preview of this same assessment.",
  },
  "financial-clarity-pack": {
    heading: "Not sure this is the right starting point?",
    lead: "If you haven't had an outside read on the business yet, the free Business Health Check is a faster first step.",
  },
  "funding-readiness-pack": {
    heading: "Not sure your records are ready for this yet?",
    lead: "The free Business Health Check will tell you honestly, in under six minutes.",
  },
};

interface OfferPageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OfferPageParams): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return NOT_FOUND_METADATA;
  return buildPageMetadata({
    title: offer.metaTitle,
    description: resolveMetaDescription(offer.metaDescription, offer.problemStatement),
    path: `/offers/${offer.slug}`,
  });
}

export default async function OfferPage({ params }: OfferPageParams) {
  const { slug } = await params;
  const [offer, offerNavLinks] = await Promise.all([getOfferBySlug(slug), getOfferNavLinks()]);

  if (!offer) {
    notFound();
  }

  const methodStages = offer.methodStages as unknown as MethodStage[];
  const faqs = offer.faqs as unknown as OfferFaq[];
  const isTiered = offer.tiers.length > 0;
  const featuredTier = offer.tiers.find((tier) => tier.isFeatured) ?? offer.tiers[0];
  const alternateTiers = offer.tiers.filter((tier) => tier.id !== featuredTier?.id);
  const finalCta = FINAL_CTA_COPY[offer.slug] ?? FINAL_CTA_COPY["business-health-check"];

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader hasHero offerNavLinks={offerNavLinks} />
      <main>
        {/* 1. Problem statement (FR-4.1) */}
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[760px] px-2">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              Core Offer
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              {offer.name}
            </h1>
            <p className="text-lead font-light text-[#C9D3CD]">{offer.problemStatement}</p>
          </div>
        </section>

        {/* 2. Who it's for / who it's not for (FR-4.1) */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-8 md:grid-cols-2">
            <div className="border-pine-500 bg-card rounded-md border border-l-[3px] p-6 shadow-sm">
              <h4 className={H3}>Who it&apos;s for</h4>
              <p className="text-body text-foreground">{offer.whoFor}</p>
            </div>
            <div className="border-brass-300 bg-card rounded-md border border-l-[3px] p-6 shadow-sm">
              <h4 className={H3}>Who it&apos;s not for</h4>
              <p className="text-body text-foreground">{offer.whoNotFor}</p>
            </div>
          </div>
        </section>

        {/* 3. Stage-by-stage method (FR-4.1) */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <span className={KICKER}>{SECTION_LABELS.method}</span>
            <div className="flex flex-col">
              {methodStages.map((stage, index) => (
                <div
                  key={stage.title}
                  className={`grid grid-cols-[48px_1fr] gap-5 py-5 sm:grid-cols-[60px_1fr] ${
                    index < methodStages.length - 1 ? "border-border border-b" : ""
                  }`}
                >
                  <span className="font-display text-brass-500 text-h1 leading-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-display text-primary mb-1 text-[1.0625rem] font-bold">
                      {stage.title}
                    </h4>
                    <p className="text-body text-foreground">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Named deliverables (FR-4.1) — tiered offers show two priced tiers instead of a
            flat list, since each tier's deliverables genuinely differ. */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <span className={KICKER}>
              {isTiered ? SECTION_LABELS.deliverablesTiered : SECTION_LABELS.deliverablesFlat}
            </span>
            {isTiered ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {offer.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`bg-card flex flex-col gap-2.5 rounded-md border p-6 shadow-sm ${
                      tier.isFeatured ? "border-accent border-2" : "border-border"
                    }`}
                  >
                    <h4 className="font-display text-primary text-[1.25rem]">{tier.name}</h4>
                    <span className="text-caption text-muted-foreground">
                      {tier.durationLabel} · {tier.scopeLabel}
                    </span>
                    <div className="text-accent font-mono text-[1.375rem] font-bold">
                      {formatFeeBand(tier.feeAmountMin, tier.feeAmountMax, tier.feeCurrency)}
                    </div>
                    <ul className="text-body list-disc space-y-1.5 pl-[18px]">
                      {tier.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {offer.deliverables.map((item) => (
                  <div
                    key={item}
                    className="bg-card border-border flex items-start gap-3 rounded-sm border p-3.5"
                  >
                    <span className="text-pine-500 font-bold">✓</span>
                    <span className="text-body text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Required client inputs (FR-4.1) */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <span className={KICKER}>{SECTION_LABELS.clientInputs}</span>
            {isTiered ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {offer.tiers.map((tier) => (
                  <div key={tier.id}>
                    <h4 className="font-display text-primary text-body mb-1 font-bold">
                      {tier.name}
                    </h4>
                    {tier.clientInputs.map((note) => (
                      <p key={note} className="text-body text-foreground">
                        {note}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              offer.clientInputs.map((note) => (
                <p key={note} className="text-body text-foreground">
                  {note}
                </p>
              ))
            )}
          </div>
        </section>

        {/* 6. Indicative timeline (FR-4.1) — tiered offers already show duration per tier
            above (tier.durationLabel), so this standalone section only renders for a
            single-tier offer. */}
        {!isTiered && offer.indicativeTimeline ? (
          <section className="border-border border-b px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-[760px]">
              <span className={KICKER}>{SECTION_LABELS.timeline}</span>
              <p className="font-display text-primary text-h3">{offer.indicativeTimeline}</p>
            </div>
          </section>
        ) : null}

        {/* 7. Published fee band + scope cap, and the offer's one call to action (FR-4.1) */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <div className="bg-primary flex flex-wrap items-center justify-between gap-5 rounded-md p-8">
              <div>
                <span className="text-kicker text-brass-300 mb-1 block font-semibold tracking-[0.08em] uppercase">
                  {isTiered && featuredTier
                    ? `${featuredTier.name} — published fee band`
                    : "Published fee band"}
                </span>
                <div className="font-display text-primary-foreground text-h1">
                  {isTiered && featuredTier
                    ? formatFeeBand(
                        featuredTier.feeAmountMin,
                        featuredTier.feeAmountMax,
                        featuredTier.feeCurrency,
                      )
                    : formatFeeBand(offer.feeAmountMin, offer.feeAmountMax, offer.feeCurrency)}
                </div>
                <div className="text-caption text-primary-foreground/80 mt-1">
                  Scope cap: {isTiered && featuredTier ? featuredTier.scopeCap : offer.scopeCap}
                </div>
                {isTiered && alternateTiers.length > 0 ? (
                  <div className="text-caption text-brass-300 mt-2.5">
                    Not ready for the full engagement?{" "}
                    {alternateTiers
                      .map(
                        (tier) =>
                          `${tier.name} starts at ${tier.feeCurrency} ${tier.feeAmountMin.toLocaleString("en-US")}, ${tier.durationLabel}.`,
                      )
                      .join(" ")}
                  </div>
                ) : null}
              </div>
              <Link href={offer.ctaHref} className={BTN_ACCENT}>
                {offer.ctaLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Out-of-scope items and referral path (FR-4.1, FR-5.3) */}
        <section className="border-border border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <div className="bg-muted border-border rounded-md border p-6">
              <h4 className="font-display text-primary text-body mb-2 font-bold">
                {SECTION_LABELS.outOfScope}
              </h4>
              <p className="text-body text-foreground mb-0">{offer.outOfScopeNote}</p>
            </div>
          </div>
        </section>

        {/* 9. Three to five real Q&As (FR-4.1) — omitted entirely if empty, per
            core-offer-pages.md's edge case (never shown with placeholder questions). */}
        {faqs.length > 0 ? (
          <section className="border-border border-b px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-[760px]">
              <span className={KICKER}>{SECTION_LABELS.faq}</span>
              <Accordion multiple defaultValue={[0]}>
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={index}>
                    <AccordionTrigger className="font-display text-primary py-4.5 text-[1.0625rem] font-bold no-underline hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-body text-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ) : null}

        {/* Fixed closing chrome — a soft re-engagement CTA, always pointing back to the free
            diagnostic. Not one of FR-4.1's 10 fields (see FINAL_CTA_COPY's comment above). */}
        <section className="px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <h2 className="font-display text-primary text-h2 mb-2 font-bold">{finalCta.heading}</h2>
            <p className="text-lead text-muted-foreground mx-auto mb-7 font-light">
              {finalCta.lead}
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
