import { prisma } from "@/lib/prisma";

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
