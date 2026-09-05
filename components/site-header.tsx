"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronDown, Menu, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Core Offers dropdown fee hints, hard-coded to ui/mockups/a-public-site/home.html's actual
 * copy. T2.2 (docs/tasks/02-public-presentation.md) replaces this with a live read of each
 * Offer's `fee_amount_min` once the Offer entity exists — no placeholder schema is added here.
 */
const CORE_OFFERS = [
  {
    name: "Business Health Check",
    href: "/offers/business-health-check",
    feeHint: "From GHS 1,000",
  },
  {
    name: "Financial Clarity Pack",
    href: "/offers/financial-clarity-pack",
    feeHint: "From GHS 4,500",
  },
  {
    name: "Funding-Readiness Pack",
    href: "/offers/funding-readiness-pack",
    feeHint: "From GHS 9,000",
  },
] as const;

const NAV_LINKS = [
  { name: "Capabilities", href: "/capabilities" },
  { name: "Our Method", href: "/our-method" },
  { name: "Insights", href: "/insights" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
] as const;

/** Matches ui/mockups/_header-scroll.js's own trigger distance exactly. */
const SCROLL_THRESHOLD = 64;

/**
 * Below `lg` the full inline nav + CTA don't fit the header comfortably (six nav items, a
 * dropdown, and a long CTA label) — the mockups never address this since they're fixed-width
 * desktop wireframes, so the breakpoint itself is an engineering judgement call, not a value
 * read off a mockup. Below it, nav + CTA move into the slide-in drawer instead (CLAUDE.md's
 * "Responsive is built in from the first implementation" rule). Kept as a literal `lg:`
 * class throughout this file rather than a template-interpolated variable — Tailwind's
 * build-time scanner only picks up statically-analyzable class strings, not `` `${x}:hidden` ``.
 */

export interface SiteHeaderProps {
  /**
   * Whether this page opens on a full-bleed dark hero directly under the header (Home,
   * About, offer pages, etc. — everything except the not-yet-built legal pages, which have
   * no hero per ui/mockups/e-legal/*.html's plain `<body>`). Mirrors
   * ui/mockups/_shared.css's `body:not(.has-hero) .site-header` rule: without a hero behind
   * it, the header renders solid from the first frame instead of transparent-until-scrolled.
   */
  hasHero?: boolean;
}

export function SiteHeader({ hasHero = true }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = isScrolled || !hasHero;
  const navLinkClass = solid
    ? "text-foreground hover:text-accent"
    : "text-primary-foreground hover:text-brass-300";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-[400ms] ease-in-out ${
        solid
          ? "border-border bg-background/86 shadow-sm backdrop-blur-[14px] backdrop-saturate-[1.4]"
          : "border-transparent bg-transparent shadow-none"
      }`}
    >
      <div className="mx-auto flex h-19 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Kaalbert & Company Ltd — Home" className="inline-grid">
          <Image
            src="/brand/logo-dark-bg.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            priority
            className={`col-start-1 row-start-1 h-[28px] w-auto transition-opacity duration-[400ms] ease-in-out sm:h-[35px] ${
              solid ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/brand/logo-primary.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            className={`col-start-1 row-start-1 h-[28px] w-auto transition-opacity duration-[400ms] ease-in-out sm:h-[35px] ${
              solid ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="m-0 flex list-none items-center gap-7 p-0">
            <li className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger
                  openOnHover
                  delay={0}
                  className={`group inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold transition-colors duration-[400ms] ease-in-out outline-none ${navLinkClass}`}
                >
                  Core Offers
                  <ChevronDown className="size-3.5 transition-transform group-data-[popup-open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-60 p-2">
                  <DropdownMenuGroup>
                    {CORE_OFFERS.map((offer) => (
                      <DropdownMenuItem
                        key={offer.href}
                        render={<Link href={offer.href} />}
                        className="flex-col items-start gap-0.5 py-2.5"
                      >
                        <span className="text-foreground text-[0.9375rem]">{offer.name}</span>
                        <span className="text-caption text-muted-foreground">{offer.feeHint}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[0.9375rem] font-semibold transition-colors duration-[400ms] ease-in-out ${navLinkClass}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/diagnostic"
          className="bg-accent text-body text-accent-foreground hover:bg-brass-500 hidden items-center justify-center gap-2 rounded-sm px-6 py-3 font-semibold transition-colors lg:inline-flex"
        >
          Take the Health Check
        </Link>

        <MobileNavTrigger navLinkClass={navLinkClass} />
      </div>
    </header>
  );
}

/**
 * Mobile nav: a side-sliding drawer built directly on Base UI's Dialog primitive (not the
 * `DialogContent` wrapper — that component's centred-modal positioning classes would have to
 * be fought/overridden for an edge-anchored panel, so this composes the same primitive parts
 * fresh instead). Slides in from the right, matching the hamburger trigger's position in the
 * header. Decided explicitly (not inferred from a mockup — none of the mockups address
 * mobile nav at all): see CLAUDE.md's "Responsive is built in from the first implementation"
 * rule and memory/decision-log.md.
 */
function MobileNavTrigger({ navLinkClass }: { navLinkClass: string }) {
  return (
    <Dialog>
      <DialogPrimitive.Trigger
        aria-label="Open menu"
        className={`inline-flex items-center justify-center rounded-sm p-2 transition-colors duration-[400ms] ease-in-out outline-none lg:hidden ${navLinkClass}`}
      >
        <Menu className="size-6" />
      </DialogPrimitive.Trigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="mobile-nav-content"
          className="bg-card text-card-foreground data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right fixed inset-y-0 right-0 z-50 flex h-full w-[85vw] max-w-[340px] flex-col gap-1 overflow-y-auto p-6 shadow-md duration-200 outline-none"
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="font-display text-h3 text-primary">Menu</DialogTitle>
            <DialogClose
              aria-label="Close menu"
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-sm p-2"
            >
              <X className="size-5" />
            </DialogClose>
          </div>

          <span className="text-kicker text-accent px-2">Core Offers</span>
          {CORE_OFFERS.map((offer) => (
            <DialogClose
              key={offer.href}
              render={<Link href={offer.href} />}
              nativeButton={false}
              className="hover:bg-muted flex flex-col gap-0.5 rounded-sm px-2 py-2.5"
            >
              <span className="text-foreground text-[0.9375rem] font-semibold">{offer.name}</span>
              <span className="text-caption text-muted-foreground">{offer.feeHint}</span>
            </DialogClose>
          ))}

          <div className="border-border my-3 border-t" />

          {NAV_LINKS.map((link) => (
            <DialogClose
              key={link.href}
              render={<Link href={link.href} />}
              nativeButton={false}
              className="hover:bg-muted text-foreground rounded-sm px-2 py-2.5 text-[0.9375rem] font-semibold"
            >
              {link.name}
            </DialogClose>
          ))}

          <DialogClose
            render={<Link href="/diagnostic" />}
            nativeButton={false}
            className="bg-accent text-body text-accent-foreground hover:bg-brass-500 mt-4 inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 font-semibold transition-colors"
          >
            Take the Health Check
          </DialogClose>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
