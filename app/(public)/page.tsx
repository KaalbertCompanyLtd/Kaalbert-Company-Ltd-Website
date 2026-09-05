import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedArticles, getHomePageContent, getOfferCards } from "@/lib/home";

// Reads live `home_page_content`/`offer` rows on every request rather than being baked into
// a static build. Two reasons: (1) this content is meant to become admin-editable later
// (CLAUDE.md's "content the firm can edit ... read live by every surface" pattern), so a
// static build would go stale the moment that exists; (2) Railway's build step runs in an
// isolated container with no access to the private network (`postgres.railway.internal`) —
// without this, `next build` tries to statically prerender "/" and fails trying to reach the
// database at build time, since Next.js has no other signal that this page depends on
// per-request state (no cookies/headers/searchParams used).
export const dynamic = "force-dynamic";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";
const BTN_OUTLINE_LIGHT =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-primary-foreground/40 bg-transparent px-6 py-3 text-body font-semibold text-primary-foreground transition-colors hover:border-primary-foreground hover:bg-primary-foreground/10";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary px-6 py-3 text-body font-semibold text-secondary-foreground transition-colors hover:bg-muted";

// Tailwind's preflight resets heading margin/weight/size, unlike ui/mockups/_shared.css's
// bare `h1, h2, h3, .display` base rule — these reproduce that rule per heading level so
// every heading below doesn't have to repeat it.
const H2 = "font-display mb-2 text-h2 font-bold text-primary";
const H2_ON_DARK = "font-display mb-2 text-h2 font-bold text-primary-foreground";
const H3 = "font-display mb-2 text-h3 font-bold text-primary";

/**
 * The four-stage method's names and one-line descriptions are fixed, repeated brand copy
 * (CLAUDE.md's "Discover • Diagnose • Design • Deliver" recurring pattern) — not a
 * home_page_content field (docs/features/home-page.md's Data requirements section doesn't
 * name one; see prisma/schema.prisma's HomePageContent doc-comment). The fuller per-stage
 * copy on /our-method reads from its own `method_stage` rows (T2.4) — this is a shorter,
 * home-page-only restatement.
 */
const METHOD_STEPS = [
  {
    num: "01",
    title: "Discover",
    description: "We map the business as it actually runs, not as the org chart claims.",
  },
  {
    num: "02",
    title: "Diagnose",
    description: "We name the specific constraints holding growth or funding back.",
  },
  {
    num: "03",
    title: "Design",
    description: "We build the structure — accounts, controls, plans — to fix it.",
  },
  {
    num: "04",
    title: "Deliver",
    description: "We implement it with you, and hand over the capability to run it.",
  },
] as const;

const TRUST_ITEMS = [
  {
    text: "A stated professional boundary.",
    rest: "We say plainly what we don't do — audit, tax filing, legal advice — and connect you to a licensed practitioner where you need one.",
  },
  {
    text: "Partner-led, always.",
    rest: "Every engagement is led by one of five partners — never handed to a bench of juniors.",
  },
  {
    text: "Registered data controller.",
    rest: "Kaalbert & Company Ltd is registered with the Data Protection Commission.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomePageContent();
  return {
    title: content.metaTitle,
    description: content.metaDescription,
  };
}

export default async function HomePage() {
  const [content, offers] = await Promise.all([getHomePageContent(), getOfferCards()]);
  const featuredArticles = await getFeaturedArticles(content.featuredArticleIds);

  return (
    <>
      <SiteHeader hasHero />
      <main>
        <section className="bg-primary relative flex min-h-screen items-center overflow-hidden pt-24 pb-14">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_80%_at_88%_-10%,rgba(169,133,63,0.18),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,transparent_60%,rgba(14,42,34,0.55))]" />
          <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-0">
            <div>
              <span className="text-kicker text-brass-300 mb-2 block font-semibold tracking-[0.08em] uppercase">
                Ghana-rooted · Globally benchmarked
              </span>
              <h1 className="font-display text-primary-foreground mt-4 mb-6 text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.08] font-bold tracking-[-0.01em]">
                {content.heroStatement}
              </h1>
              <p className="text-lead text-primary-foreground/80 max-w-[500px] font-light">
                We help founder-led Ghanaian businesses move from ambition to structure — and from
                structure to growth.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href="/diagnostic" className={BTN_ACCENT}>
                  Take the free Business Health Check
                </Link>
                <Link href="/our-method" className={BTN_OUTLINE_LIGHT}>
                  See how we work
                </Link>
              </div>
            </div>
            <div className="border-pine-500 hidden md:mt-8 md:flex md:flex-row md:flex-wrap md:gap-6 md:border-t md:pt-7 lg:mt-1 lg:flex-col lg:flex-nowrap lg:gap-6.5 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-9">
              <div className="flex-1 basis-[45%] lg:basis-auto">
                <span className="text-kicker text-brass-300 mb-1 block font-semibold tracking-[0.08em] uppercase">
                  Method
                </span>
                <strong className="font-display text-h3 text-primary-foreground mb-1 block leading-snug">
                  Discover • Diagnose • Design • Deliver
                </strong>
                <span className="text-caption text-primary-foreground/80">
                  Four stages, each with a defined input, output and decision point.
                </span>
              </div>
              <div className="flex-1 basis-[45%] lg:basis-auto">
                <span className="text-kicker text-brass-300 mb-1 block font-semibold tracking-[0.08em] uppercase">
                  Attention
                </span>
                <strong className="font-display text-h3 text-primary-foreground mb-1 block leading-snug">
                  5 partners
                </strong>
                <span className="text-caption text-primary-foreground/80">
                  Every engagement led personally — never passed to a junior team.
                </span>
              </div>
              <div className="flex-1 basis-[45%] lg:basis-auto">
                <span className="text-kicker text-brass-300 mb-1 block font-semibold tracking-[0.08em] uppercase">
                  Boundary
                </span>
                <strong className="font-display text-h3 text-primary-foreground mb-1 block leading-snug">
                  Stated plainly
                </strong>
                <span className="text-caption text-primary-foreground/80">
                  We say what we don&apos;t do, and refer you to a licensed practitioner where
                  needed.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-10 max-w-[620px] text-center">
              <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
                Where we lead
              </span>
              <h2 className={H2}>Three ways we get you there</h2>
              <p className="text-body text-muted-foreground font-light">
                The remaining service lines are covered on Capabilities — these three are where the
                firm is putting its senior attention this year.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="border-border bg-card flex flex-col gap-3 rounded-md border p-6 shadow-sm"
                >
                  <h3 className={`${H3} mb-1`}>{offer.name}</h3>
                  <p className="text-body text-muted-foreground">{offer.teaser}</p>
                  <span className="text-code text-accent font-mono font-bold">
                    From {offer.feeCurrency} {offer.feeAmountMin.toLocaleString("en-US")} ·
                    scope-capped
                  </span>
                  <Link
                    href={`/offers/${offer.slug}`}
                    className="text-primary mt-auto font-bold hover:underline"
                  >
                    See the full offer →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-10 max-w-[620px] text-center">
              <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
                Our method
              </span>
              <h2 className={H2}>Discover, Diagnose, Design, Deliver</h2>
              <p className="text-body text-muted-foreground font-light">
                Four stages, each with a defined input, output and decision point — not a slogan.
              </p>
            </div>
            <div className="border-border bg-card grid grid-cols-1 overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-4">
              {METHOD_STEPS.map((step, index) => (
                <div
                  key={step.num}
                  className={`border-border p-7 ${
                    index < METHOD_STEPS.length - 1 ? "border-b sm:border-r sm:border-b-0" : ""
                  } ${index === 1 ? "sm:border-r-0 lg:border-r" : ""}`}
                >
                  <span className="font-display text-h1 text-brass-500 mb-2 block">{step.num}</span>
                  <h4 className={`${H3} mb-1.5`}>{step.title}</h4>
                  <p className="text-body text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
                Senior attention
              </span>
              <h2 className={H2}>
                Every engagement is led by a partner, not passed to a junior team.
              </h2>
              <p className="text-body text-foreground">{content.seniorAttentionCopy}</p>
              <Link href="/about" className={`${BTN_SECONDARY} mt-2`}>
                Meet the partners
              </Link>
            </div>
            <div className="border-border bg-card rounded-md border p-6 shadow-sm">
              <p className="text-caption text-muted-foreground italic">
                Real partner photography and credentials appear here once /about (T2.5) is built —
                never stock imagery of generic office scenes, per Document 13.03, Section 4.
              </p>
            </div>
          </div>
        </section>

        {featuredArticles.length > 0 ? (
          <section className="px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-[1200px]">
              <div className="mx-auto mb-10 max-w-[620px] text-center">
                <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
                  Insights
                </span>
                <h2 className={H2}>Recent thinking</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {featuredArticles.map((article) => (
                  <div
                    key={article.slug}
                    className="border-border bg-card rounded-md border p-6 shadow-sm"
                  >
                    <span className="text-kicker text-accent mb-2.5 block font-semibold tracking-[0.08em] uppercase">
                      {article.category}
                    </span>
                    <h4 className={H3}>{article.title}</h4>
                    <p className="text-body text-foreground">{article.excerpt}</p>
                    <div className="text-caption text-muted-foreground mt-3">
                      {article.authorName}, Partner, {article.authorPracticeArea}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-primary relative overflow-hidden px-4 py-18 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_80%_at_88%_-10%,rgba(169,133,63,0.18),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,transparent_60%,rgba(14,42,34,0.55))]" />
          <div className="relative z-10 mx-auto max-w-[1200px]">
            <h2 className={H2_ON_DARK}>Find out where your business really stands.</h2>
            <p className="text-lead text-primary-foreground/80 mx-auto mb-7 max-w-[560px] font-light">
              Free. Under six minutes. No sales call — a real, scored result before we ever ask for
              your details.
            </p>
            <Link href={content.primaryCtaHref} className={BTN_ACCENT}>
              {content.primaryCtaLabel}
            </Link>
            <div className="text-body text-primary-foreground/80 mt-7 flex flex-wrap justify-center gap-8">
              <span>15–20 questions</span>
              <span>Indication, not an assessment</span>
              <span>Your responses stay confidential</span>
            </div>
          </div>
        </section>

        <section className="border-border bg-card border-y px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 md:grid-cols-3">
            {TRUST_ITEMS.map((item) => (
              <div key={item.text} className="flex items-start gap-3.5">
                <span className="font-display text-lead text-accent leading-snug">✓</span>
                <p className="text-body text-muted-foreground">
                  <strong className="text-body text-foreground block">{item.text}</strong>
                  {item.rest}
                </p>
              </div>
            ))}
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
