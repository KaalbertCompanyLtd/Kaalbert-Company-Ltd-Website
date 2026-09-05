import Image from "next/image";
import Link from "next/link";

import { ScopeOfPracticeNote } from "@/components/scope-of-practice-note";

const CORE_OFFER_LINKS = [
  { name: "Business Health Check", href: "/offers/business-health-check" },
  { name: "Financial Clarity Pack", href: "/offers/financial-clarity-pack" },
  { name: "Funding-Readiness Pack", href: "/offers/funding-readiness-pack" },
] as const;

const FIRM_LINKS = [
  { name: "Our Method", href: "/our-method" },
  { name: "About & Partners", href: "/about" },
  { name: "Capabilities", href: "/capabilities" },
] as const;

const INSIGHTS_LINKS = [
  { name: "All articles", href: "/insights" },
  { name: "Contact", href: "/contact" },
] as const;

export interface SiteFooterProps {
  /**
   * site_settings fields (content-management-admin.md). Passed as props rather than
   * hard-coded inline so a later task can wire a live database read without restructuring
   * this component — no `site_settings` table exists yet, so every caller currently passes
   * the mockups' actual literal values (see docs/tasks/01-foundation.md T1.5).
   */
  addressLine1: string;
  addressLine2: string;
  phonePrimary: string;
}

function FooterLinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly { name: string; href: string }[];
}) {
  return (
    <div>
      <strong className="text-primary-foreground mb-2.5 block">{heading}</strong>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-brass-300 mb-1.5 block last:mb-0 hover:underline"
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export function SiteFooter({ addressLine1, addressLine2, phonePrimary }: SiteFooterProps) {
  return (
    <footer className="border-accent bg-primary text-primary-foreground border-t pt-14 pb-6">
      <div className="mx-auto max-w-[1200px] px-6">
        <Image
          src="/brand/logo-dark-bg.png"
          alt="Kaalbert & Company Ltd"
          width={1980}
          height={382}
          className="mb-6 h-12 w-auto"
        />
        <div className="grid grid-cols-2 gap-6 text-[0.9375rem] md:grid-cols-4">
          <FooterLinkColumn heading="Core Offers" links={CORE_OFFER_LINKS} />
          <FooterLinkColumn heading="Firm" links={FIRM_LINKS} />
          <FooterLinkColumn heading="Insights" links={INSIGHTS_LINKS} />
          <div>
            <strong className="text-primary-foreground mb-2.5 block">{addressLine1}</strong>
            <span className="text-primary-foreground/80">{addressLine2}</span>
            <br />
            <span className="text-primary-foreground/80">{phonePrimary}</span>
          </div>
        </div>
        <ScopeOfPracticeNote />
      </div>
    </footer>
  );
}
