/**
 * Scratch verification page for T1.5 — reproduces enough of
 * ui/mockups/a-public-site/about.html's shape (a shorter `.page-hero`, still a full-bleed
 * dark hero directly under the header per that mockup's `has-hero` body class) to check
 * SiteHeader/SiteFooter render identically to home/page.tsx's instance: same structure,
 * spacing, and nav items, on a second page context.
 */
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LayoutShellAboutScratchPage() {
  return (
    <>
      <SiteHeader hasHero />
      <main>
        <section className="bg-primary px-6 pt-[156px] pb-16 text-center">
          <span className="text-kicker text-brass-300">About &amp; Partners</span>
          <h1 className="font-display text-h1 mt-3 text-[#fcfaf5]">
            A firm built to make your business organised, sound and ready to grow
          </h1>
        </section>
        <section className="mx-auto max-w-[1200px] px-6 py-16">
          <p className="text-body text-foreground">Second scratch page for the T1.5 A/B check.</p>
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
