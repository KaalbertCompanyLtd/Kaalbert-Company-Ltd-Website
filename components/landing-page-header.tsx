"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/** Matches `components/site-header.tsx`'s own scroll trigger distance exactly. */
const SCROLL_THRESHOLD = 64;

/**
 * `/lp/[slug]`'s own header — deliberately not `SiteHeader` with props toggled off:
 * `landing-page-template.md`'s business rule is that no site navigation renders on this
 * template "under any circumstance," structurally, not via a toggle a partner could enable —
 * so this component has no nav menu, no Core Offers dropdown, and no mobile drawer trigger at
 * all, matching every `ui/mockups/d-landing-pages/*.html` mockup's own centered-logo-only
 * `.lp-header`. It reuses `SiteHeader`'s fixed-position, transparent-over-hero,
 * logo-swap-on-scroll visual language (`ui/mockups/_shared.css`'s `.site-header`/`.has-hero`
 * rules) so a landing page still reads as the same site, just without the nav a paid-ad
 * visitor doesn't need.
 */
export function LandingPageHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-[400ms] ease-in-out ${
        isScrolled
          ? "border-border bg-background/86 shadow-sm backdrop-blur-[14px] backdrop-saturate-[1.4]"
          : "border-transparent bg-transparent shadow-none"
      }`}
    >
      <div className="mx-auto flex h-19 max-w-[1200px] items-center justify-center px-4 sm:px-6">
        <Link href="/" aria-label="Kaalbert & Company Ltd — Home" className="inline-grid">
          <Image
            src="/brand/logo-dark-bg.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            priority
            className={`col-start-1 row-start-1 h-[36px] w-auto transition-opacity duration-[400ms] ease-in-out sm:h-[35px] ${
              isScrolled ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/brand/logo-primary.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            className={`col-start-1 row-start-1 h-[36px] w-auto transition-opacity duration-[400ms] ease-in-out sm:h-[35px] ${
              isScrolled ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>
      </div>
    </header>
  );
}
