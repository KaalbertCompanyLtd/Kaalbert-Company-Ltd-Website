import { prisma } from "@/lib/prisma";
import { getFooterContent } from "@/lib/legal";

/**
 * The `site_settings` singleton row (phone/WhatsApp/email/address/response-time — see
 * prisma/schema.prisma's `SiteSettings` doc-comment). Throws rather than falling back to
 * placeholder copy if the row is missing, same reasoning as `lib/pages.ts`'s
 * `getPageBySlug`/`lib/about.ts`'s `getFirmStatement`: a missing singleton row is a
 * seed/migration bug, not a real "no content yet" state a visitor should ever see.
 */
export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    throw new Error(`site_settings has no row — run \`npm run db:seed\` (see prisma/seed.ts).`);
  }
  return settings;
}

/**
 * `site_settings.address` is stored as newline-separated lines (see the seed comment) so it
 * can render as the mockup's two-line channel-card/footer address without a second field —
 * split here rather than in every caller.
 */
export function splitAddressLines(address: string): string[] {
  return address.split("\n").filter((line) => line.length > 0);
}

/**
 * `site_settings.phone_primary`/`phone_secondary` are stored in the firm's own local display
 * format ("0558 480 001", matching every mockup's own phone copy) — this converts that to a
 * `tel:` href, assuming Ghana's local trunk-prefix convention (a leading "0" replaced with the
 * country code "+233"), the only market this firm operates in.
 */
export function toTelHref(localNumber: string): string {
  const digitsOnly = localNumber.replace(/\s+/g, "");
  return `tel:+233${digitsOnly.replace(/^0/, "")}`;
}

export interface SiteFooterContent {
  addressLine1: string;
  addressLine2: string;
  phonePrimary: string;
  scopeOfPracticeStatement: string;
  companyRegistrationDetails: string | null;
}

/**
 * The exact prop shape `components/site-footer.tsx`'s `SiteFooter` needs, combining
 * `site_settings` and `footer_content` (T7.8) in one call so a page that renders `SiteFooter`
 * but doesn't otherwise need `site_settings`/`footer_content` (most public pages) doesn't
 * have to repeat this shaping logic itself. A page that already fetches `getSiteSettings()`
 * for its own display (e.g. `/contact`) should call `getFooterContent()` directly instead of
 * this, to avoid querying `site_settings` twice. Every required `site_settings` field the
 * footer displays (`address`, `phonePrimary`) is left exactly as stored — possibly blank
 * pre-launch — so `SiteFooter` itself, not this function, is what omits a blank field from
 * render (content-management-admin.md's edge case).
 */
export async function getSiteFooterContent(): Promise<SiteFooterContent> {
  const [settings, footer] = await Promise.all([getSiteSettings(), getFooterContent()]);
  const addressLines = splitAddressLines(settings.address);

  return {
    addressLine1: addressLines[0] ?? "",
    addressLine2: addressLines.slice(1).join(", "),
    phonePrimary: settings.phonePrimary,
    scopeOfPracticeStatement: footer.scopeOfPracticeStatement,
    companyRegistrationDetails: footer.companyRegistrationDetails,
  };
}
