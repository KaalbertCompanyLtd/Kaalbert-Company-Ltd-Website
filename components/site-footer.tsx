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

// T1.5's original mockup literals — used only as the fallback when a caller omits these
// props entirely (see SiteFooterProps below), never as a display decision by this component.
const FALLBACK_ADDRESS_LINE_1 = "House No. 13 Gbenjin Gbe Avenue";
const FALLBACK_ADDRESS_LINE_2 = "East Legon-ARS, Accra";
const FALLBACK_PHONE_PRIMARY = "0558 480 001";

export interface SiteFooterProps {
  /**
   * `site_settings`/`footer_content` fields (content-management-admin.md), sourced live via
   * `lib/site-settings.ts`'s `getSiteFooterContent()` — every real public page passes these
   * explicitly. All optional, defaulting to the values above, for the two callers that can't
   * fetch live data: `app/error.tsx` (a required Client Component) and `app/not-found.tsx`
   * (deliberately zero-DB-dependency for reliability, see that file's own comment). A field
   * passed as an explicit blank string (a required `site_settings` field left blank
   * pre-launch, content-management-admin.md's edge case) is NOT replaced by the fallback —
   * only an omitted (`undefined`) prop is — so the corresponding line below is omitted from
   * render instead of showing stale mockup copy.
   */
  addressLine1?: string;
  addressLine2?: string;
  phonePrimary?: string;
  scopeOfPracticeStatement?: string;
  companyRegistrationDetails?: string | null;
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

export function SiteFooter({
  addressLine1 = FALLBACK_ADDRESS_LINE_1,
  addressLine2 = FALLBACK_ADDRESS_LINE_2,
  phonePrimary = FALLBACK_PHONE_PRIMARY,
  scopeOfPracticeStatement,
  companyRegistrationDetails,
}: SiteFooterProps) {
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
          {/* A blank `site_settings.address` (allowed pre-launch, content-management-admin.md's
              edge case) omits this whole column rather than rendering an empty heading. */}
          {addressLine1 && (
            <div>
              <strong className="text-primary-foreground mb-2.5 block">{addressLine1}</strong>
              {addressLine2 && <span className="text-primary-foreground/80">{addressLine2}</span>}
              {phonePrimary && (
                <>
                  <br />
                  <span className="text-primary-foreground/80">{phonePrimary}</span>
                </>
              )}
            </div>
          )}
        </div>
        <ScopeOfPracticeNote
          statement={scopeOfPracticeStatement}
          companyRegistrationDetails={companyRegistrationDetails}
        />
      </div>
    </footer>
  );
}
