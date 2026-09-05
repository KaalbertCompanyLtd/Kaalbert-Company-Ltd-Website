import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Catches every unmatched route on the site, plus every explicit `notFound()` call (e.g.
// app/offers/[slug]/page.tsx's unknown-slug case) — previously both fell through to Next's
// generic framework 404, visible on the live, deployed site (not just in local dev). No
// dedicated mockup exists for this screen; structure/copy inferred from the interior-page
// hero pattern T2.2's offer pages established (dark hero, kicker, heading, lead, single CTA).
//
// Deliberately doesn't fetch `getOfferNavLinks()` for SiteHeader's live fee hints, even
// though it could (unlike app/error.tsx, this is a Server Component). A 404 page's whole job
// is to render reliably when something else on the site has already gone wrong — verified
// this the hard way in-session, when a transient DNS failure against Railway's Postgres
// proxy (`metro.proxy.rlwy.net`) made a DB-backed version of this page hang for tens of
// seconds before failing. `SiteHeader`'s `offerNavLinks` prop is optional specifically to
// support this: omitting it falls back to `FALLBACK_CORE_OFFERS`, so this page has zero
// runtime dependencies and renders instantly regardless of database health.
/**
 * Exported (not just used locally) so a route that calls `notFound()` itself — e.g. app/
 * offers/[slug]/page.tsx's unknown-slug case — can return this same object from its own
 * `generateMetadata` instead of `{}`. An empty object there left the browser tab showing the
 * root layout's generic homepage title rather than this page's, since Next resolves a
 * segment's metadata before handing rendering off to the nearest `not-found.tsx` boundary.
 */
export const NOT_FOUND_METADATA: Metadata = {
  title: "Page not found — Kaalbert & Company Ltd",
  description: "The page you're looking for doesn't exist, or has moved.",
};

export const metadata: Metadata = NOT_FOUND_METADATA;

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";

const QUICK_LINKS = [
  { name: "Home", href: "/" },
  { name: "Business Health Check", href: "/offers/business-health-check" },
  { name: "Financial Clarity Pack", href: "/offers/financial-clarity-pack" },
  { name: "Funding-Readiness Pack", href: "/offers/funding-readiness-pack" },
  { name: "Capabilities", href: "/capabilities" },
  { name: "Contact", href: "/contact" },
] as const;

export default function NotFound() {
  return (
    <>
      <SiteHeader hasHero />
      <main>
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 text-center sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[760px]">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              Error 404
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              This page has moved, or never existed.
            </h1>
            <p className="text-lead font-light text-[#C9D3CD]">
              Whatever brought you here, it isn&apos;t at this address anymore. Here&apos;s how to
              find what you need instead.
            </p>
            <Link href="/diagnostic" className={`${BTN_ACCENT} mt-7`}>
              Take the free Business Health Check
            </Link>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[760px] text-center">
            <span className="text-kicker text-accent mb-4 block font-semibold tracking-[0.08em] uppercase">
              Or go straight to
            </span>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body text-primary font-semibold hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
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
