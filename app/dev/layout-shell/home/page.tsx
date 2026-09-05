/**
 * Scratch verification page for T1.5 (shared layout shell) — not a real public page type,
 * no SEO metadata. Reproduces enough of ui/mockups/a-public-site/home.html's shape (a
 * full-bleed dark hero directly under the header) to check SiteHeader/SiteFooter against
 * that mockup: structure, spacing, nav items, and the transparent-over-hero → solid-on-scroll
 * behaviour (hasHero=true).
 */
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LayoutShellHomeScratchPage() {
  return (
    <>
      <SiteHeader hasHero />
      <main>
        <section className="bg-primary px-6 py-32 text-center">
          <span className="text-kicker text-brass-300">Ghana-rooted · Globally benchmarked</span>
          <h1 className="font-display text-h1 mt-4 text-[#fcfaf5]">
            Get your numbers, systems and plans into the shape banks, investors and boards expect.
          </h1>
        </section>
        <section className="mx-auto max-w-[1200px] px-6 py-16">
          <p className="text-body text-foreground">
            Scroll past 64px to see the header switch from transparent-over-hero to solid.
          </p>
          <div className="h-[1400px]" />
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
