"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Catches a runtime error thrown anywhere below the root layout — previously fell through to
 * Next's generic framework error screen (a dev-only stack trace overlay in development, a
 * bare unstyled message in production), visible on the live, deployed site. Next.js requires
 * an error boundary to be a Client Component, so unlike app/not-found.tsx this can't fetch
 * live offer data for SiteHeader's nav — it renders with `offerNavLinks` omitted, which falls
 * back to that component's own hard-coded `FALLBACK_CORE_OFFERS` (see components/
 * site-header.tsx and memory/decision-log.md, T2.2).
 *
 * Only catches errors below this segment of the tree — a root-layout-level crash is
 * app/global-error.tsx's job instead (Next.js's error-boundary scoping rule).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader hasHero />
      <main>
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 text-center sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[760px]">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              Error
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              Something went wrong on our end.
            </h1>
            <p className="text-lead font-light text-[#C9D3CD]">
              That&apos;s on us, not you. Try again, or head back to the homepage — if this keeps
              happening, let us know.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="bg-accent text-body text-accent-foreground hover:bg-brass-500 inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 font-semibold transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="text-body text-primary-foreground border-primary-foreground/40 hover:border-primary-foreground hover:bg-primary-foreground/10 inline-flex items-center justify-center gap-2 rounded-sm border bg-transparent px-6 py-3 font-semibold transition-colors"
              >
                Go to homepage
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
