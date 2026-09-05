import type { Metadata } from "next";
import Link from "next/link";

import { getAuthors, getFirmStatement, getInitials } from "@/lib/about";
import { getOfferNavLinks } from "@/lib/offers";
import { getPageBySlug } from "@/lib/pages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Reads live `page`/`firm_statement`/`author` rows on every request — same reasoning as
// app/capabilities/page.tsx and app/our-method/page.tsx: this content is meant to become
// admin-editable (Milestone 6/7), and Railway's build container can't reach the
// private-network DB host production reads use, so a static-prerender attempt at build time
// fails outright (memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

const KICKER = "text-kicker text-accent mb-3 block font-semibold tracking-[0.08em] uppercase";
const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";

const VALUE_NUMBERS = ["01", "02", "03", "04"];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about");
  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

/**
 * A partner's photo when `photoUrl` is set, otherwise an initials avatar (never a fake
 * placeholder image standing in for a real one) — see prisma/schema.prisma's `Author`
 * doc-comment and memory/decision-log.md (session 11) for why publish no longer waits on
 * real photography. Sized larger than the design system's default `Avatar` presets since,
 * until real photos arrive, this initials mark is the only visual identity a visitor sees
 * for that partner.
 */
function PartnerAvatar({
  author,
  variant,
}: {
  author: { name: string; photoUrl: string | null };
  variant: "feature" | "card";
}) {
  const sizeClasses = variant === "feature" ? "size-28" : "size-20";
  const textClasses = variant === "feature" ? "text-4xl" : "text-2xl";
  return (
    <Avatar className={`${sizeClasses} rounded-md`}>
      {author.photoUrl && <AvatarImage src={author.photoUrl} alt={author.name} />}
      <AvatarFallback
        className={`bg-primary text-brass-300 font-display rounded-md font-bold ${textClasses}`}
      >
        {getInitials(author.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * A partner's rank (`title` — "Lead Partner", "Partner") as a solid badge, next to their
 * responsibility (`practiceArea` — "Growth, Markets & Clients") as the page's existing
 * accent-colored kicker text. The mockup only showed this pairing for the featured partner,
 * and even then as one plain string with no visual split between rank and responsibility —
 * a real gap, flagged directly by the user, not preserved here. Every partner gets both,
 * visually distinct from each other (a solid primary-color chip vs. small uppercase text).
 */
function PartnerRoleLine({ title, practiceArea }: { title: string; practiceArea: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Badge>{title}</Badge>
      <span className="text-kicker text-accent font-semibold tracking-[0.05em] uppercase">
        {practiceArea}
      </span>
    </div>
  );
}

export default async function AboutPage() {
  const [page, firmStatement, authors, offerNavLinks] = await Promise.all([
    getPageBySlug("about"),
    getFirmStatement(),
    getAuthors(),
    getOfferNavLinks(),
  ]);

  const [leadPartner, ...otherPartners] = authors;

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

        {/* What we stand on — standingIntro + the 4 fixed values, in order. */}
        <section className="border-border border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <span className={KICKER}>What we stand on</span>
            <p className="text-body text-foreground mb-0 max-w-[640px]">
              {firmStatement.standingIntro}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {firmStatement.values.map((value, index) => (
                <div key={value} className="border-border bg-card rounded-sm border p-5">
                  <span className="font-display text-brass-500 text-h3 mb-1.5 block">
                    {VALUE_NUMBERS[index] ?? String(index + 1).padStart(2, "0")}
                  </span>
                  <h4 className="text-body text-foreground m-0 font-bold">{value}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Forward panel — no milestones/history timeline (our-method-page.md-style
            explicit exclusion, documented in about-and-partners-page.md's business rules). */}
        <section className="border-border border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <div className="bg-muted border-border rounded-md border p-8">
              <span className={`${KICKER} mb-1.5`}>What we&apos;re building toward</span>
              <h3 className="font-display text-primary text-h3 mb-2.5 font-bold">
                {firmStatement.forwardHeading}
              </h3>
              <p className="text-body text-foreground mb-0">{firmStatement.forwardBody}</p>
            </div>
          </div>
        </section>

        {/* The partners — one featured Lead Partner card, then the rest in a grid. */}
        <section className="border-border border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[900px]">
            <span className={KICKER}>The partners you&apos;ll work with</span>
            <p className="text-body text-muted-foreground mb-6 max-w-[640px]">
              Five complementary disciplines — finance, reporting, growth, technology and control —
              around one table.
            </p>

            {leadPartner && (
              <div className="border-border bg-card mb-5 flex flex-col items-start gap-7 rounded-md border p-8 sm:flex-row">
                <PartnerAvatar author={leadPartner} variant="feature" />
                <div>
                  <h3 className="font-display text-primary text-h3 mb-1 font-bold">
                    {leadPartner.name}
                  </h3>
                  <PartnerRoleLine
                    title={leadPartner.title}
                    practiceArea={leadPartner.practiceArea}
                  />
                  {leadPartner.credentials && (
                    <span className="text-caption text-muted-foreground mb-3 block">
                      {leadPartner.credentials}
                    </span>
                  )}
                  <p className="text-body text-foreground mb-0 max-w-[620px]">
                    {leadPartner.personalStatement}
                  </p>
                </div>
              </div>
            )}

            {otherPartners.length > 0 && (
              <>
                <span className="text-kicker text-primary mb-2 block font-semibold uppercase">
                  Partners
                </span>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {otherPartners.map((partner) => (
                    <div key={partner.id} className="border-border bg-card rounded-md border p-6">
                      <div className="mb-4 flex items-center gap-4">
                        <PartnerAvatar author={partner} variant="card" />
                        <div>
                          <h3 className="font-display text-primary mb-0.5 text-[1.0625rem] font-bold">
                            {partner.name}
                          </h3>
                        </div>
                      </div>
                      <PartnerRoleLine title={partner.title} practiceArea={partner.practiceArea} />
                      {partner.credentials && (
                        <span className="text-caption text-muted-foreground mb-2 block">
                          {partner.credentials}
                        </span>
                      )}
                      <p className="text-body text-foreground mb-0">{partner.personalStatement}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* What we are not — a fixed compliance-disclaimer heading + firm-editable body. */}
        <section className="border-border border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[760px]">
            <div className="bg-muted border-border rounded-md border p-7">
              <h4 className="font-display text-primary mt-0 mb-2 text-[1.0625rem] font-bold">
                What we are not
              </h4>
              <p className="text-body text-foreground mb-0">{firmStatement.scopeBody}</p>
            </div>
          </div>
        </section>

        {/* Final CTA — fixed template chrome, same treatment as app/our-method/page.tsx's
            own closing section. */}
        <section className="px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-[640px]">
            <h2 className="font-display text-primary text-h2 mb-3 font-bold">
              See how the method applies to your business.
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
