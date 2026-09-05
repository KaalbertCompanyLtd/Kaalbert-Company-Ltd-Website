import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppLinkButton } from "@/components/whatsapp-link-button";
import { buildWhatsAppMessage, resolveServiceContext } from "@/lib/contact";
import { getOfferNavLinks } from "@/lib/offers";
import { getPageBySlug } from "@/lib/pages";
import { getSiteSettings, splitAddressLines, toTelHref } from "@/lib/site-settings";

// Reads live `page`/`site_settings` rows on every request — same reasoning as
// app/about/page.tsx and every other public page built against seeded content
// (memory/decision-log.md, T2.1): this content is meant to become admin-editable
// (Milestone 7), and Railway's build container can't reach the private-network DB host to
// statically prerender this route at build time.
export const dynamic = "force-dynamic";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";

interface ContactPageProps {
  searchParams: Promise<{ service?: string | string[] }>;
}

export async function generateMetadata({ searchParams }: ContactPageProps): Promise<Metadata> {
  const page = await getPageBySlug("contact");
  const { service } = await searchParams;
  const serviceContext = await resolveServiceContext(service);
  return {
    title: serviceContext ? `${page.metaTitle} — ${serviceContext.label}` : page.metaTitle,
    description: page.metaDescription,
  };
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service } = await searchParams;
  const [page, siteSettings, offerNavLinks, serviceContext] = await Promise.all([
    getPageBySlug("contact"),
    getSiteSettings(),
    getOfferNavLinks(),
    resolveServiceContext(service),
  ]);

  const addressLines = splitAddressLines(siteSettings.address);
  const whatsappMessage = buildWhatsAppMessage(serviceContext?.label ?? null);

  return (
    <>
      <SiteHeader hasHero offerNavLinks={offerNavLinks} />
      <main>
        {/* Hero — the shared `page` entity's own copy, same pattern as capabilities/our-method/about. */}
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

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              {serviceContext && (
                <span className="border-border bg-muted text-primary text-caption mb-5 inline-block rounded-sm border px-3.5 py-2 font-semibold">
                  You&apos;re asking about: {serviceContext.label}
                </span>
              )}
              <h2 className="font-display text-primary text-h3 mb-4 font-bold">Send a message</h2>
              <ContactForm serviceSlug={serviceContext?.slug ?? null} />

              <div className="bg-primary mt-6 rounded-md p-6">
                <span className="text-kicker text-brass-300 mb-1.5 block font-semibold uppercase">
                  Not ready for a conversation yet?
                </span>
                <p className="text-body mb-3 text-[#C9D3CD]">
                  The free Business Health Check gives you an honest first read in under six minutes
                  — no contact details needed to see your result.
                </p>
                <Link href="/diagnostic" className={BTN_ACCENT}>
                  Take the free Business Health Check
                </Link>
              </div>
            </div>

            <div>
              <div className="border-border bg-card mb-3.5 rounded-md border p-5">
                <span className="text-caption text-accent mb-1 block font-semibold tracking-[0.06em] uppercase">
                  WhatsApp
                </span>
                <WhatsAppLinkButton
                  whatsappNumber={siteSettings.whatsappNumber}
                  message={whatsappMessage}
                  className="text-primary text-[1.0625rem] font-bold hover:underline"
                >
                  Message us directly →
                </WhatsAppLinkButton>
              </div>

              <div className="border-border bg-card mb-3.5 rounded-md border p-5">
                <span className="text-caption text-accent mb-1 block font-semibold tracking-[0.06em] uppercase">
                  Phone
                </span>
                <a
                  href={toTelHref(siteSettings.phonePrimary)}
                  className="text-primary block text-[1.0625rem] font-bold hover:underline"
                >
                  {siteSettings.phonePrimary}
                </a>
                {siteSettings.phoneSecondary && (
                  <a
                    href={toTelHref(siteSettings.phoneSecondary)}
                    className="text-primary block font-semibold hover:underline"
                  >
                    {siteSettings.phoneSecondary}
                  </a>
                )}
              </div>

              <div className="border-border bg-card mb-3.5 rounded-md border p-5">
                <span className="text-caption text-accent mb-1 block font-semibold tracking-[0.06em] uppercase">
                  Email
                </span>
                <a
                  href={`mailto:${siteSettings.email}`}
                  className="text-primary text-[1.0625rem] font-bold hover:underline"
                >
                  {siteSettings.email}
                </a>
              </div>

              <div className="border-border bg-card mb-3.5 rounded-md border p-5">
                <span className="text-caption text-accent mb-1 block font-semibold tracking-[0.06em] uppercase">
                  Office
                </span>
                {addressLines.map((line, index) => (
                  <span
                    key={line}
                    className={
                      index === 0
                        ? "text-primary block text-[0.9375rem]"
                        : "text-muted-foreground block text-[0.9375rem]"
                    }
                  >
                    {line}
                  </span>
                ))}
              </div>

              {/* Only shown once the firm has confirmed a real, keepable response-time
                  commitment (site_settings.response_time_commitment) — omitted entirely
                  while null, per content-management-admin.md's edge case, rather than
                  rendering a "pending" placeholder as if it were real copy. */}
              {siteSettings.responseTimeCommitment && (
                <div className="bg-muted border-border text-caption text-muted-foreground rounded-sm border border-dashed p-4 italic">
                  {siteSettings.responseTimeCommitment}
                </div>
              )}
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
