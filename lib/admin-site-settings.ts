import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export interface SiteSettingsEditData {
  phonePrimary: string;
  phoneSecondary: string | null;
  email: string;
  whatsappNumber: string;
  address: string;
  responseTimeCommitment: string | null;
  socialProfileUrls: string[];
}

export interface SiteSettingsSaveInput {
  phonePrimary: string;
  phoneSecondary: string | null;
  email: string;
  whatsappNumber: string;
  address: string;
  responseTimeCommitment: string | null;
  socialProfileUrls: string[];
}

/**
 * The one `site_settings` row, shaped for this admin screen's form
 * (content-management-admin.md's Site Settings content area). Reuses `lib/site-settings.ts`'s
 * `getSiteSettings` — same singleton row every public page already reads — rather than a
 * second query, so the admin form always edits exactly what the public site currently shows.
 */
export async function getSiteSettingsForEdit(): Promise<SiteSettingsEditData> {
  const settings = await getSiteSettings();
  return {
    phonePrimary: settings.phonePrimary,
    phoneSecondary: settings.phoneSecondary,
    email: settings.email,
    whatsappNumber: settings.whatsappNumber,
    address: settings.address,
    responseTimeCommitment: settings.responseTimeCommitment,
    socialProfileUrls: settings.socialProfileUrls,
  };
}

/**
 * `phone_primary`/`email`/`whatsapp_number`/`address` are non-nullable columns but are
 * deliberately NOT required here — content-management-admin.md's own edge case says a
 * required `site_settings` field may be left blank before launch content is finalised, and
 * every public reader (`SiteFooter`, `/contact`, `WhatsAppLinkButton`, the SEO Organization
 * schema) is responsible for omitting its own display when the value it reads is blank,
 * not this save path for rejecting the save. `phone_secondary`/`response_time_commitment`
 * are genuinely nullable columns: an empty string here is stored as `null`, same "blank
 * clears the optional field" precedent as `lib/admin-legal.ts`'s `updateFooterContent`.
 * `social_profile_urls` drops blank lines rather than storing an empty string in the array
 * (`getOrganizationJsonLd`'s `sameAs` would otherwise include one).
 */
export async function updateSiteSettings(input: SiteSettingsSaveInput): Promise<void> {
  await prisma.siteSettings.update({
    // Same fixed-id-1 singleton convention as `lib/site-settings.ts`'s `getSiteSettings`.
    where: { id: 1 },
    data: {
      phonePrimary: input.phonePrimary.trim(),
      phoneSecondary: input.phoneSecondary?.trim() || null,
      email: input.email.trim(),
      whatsappNumber: input.whatsappNumber.trim(),
      address: input.address.trim(),
      responseTimeCommitment: input.responseTimeCommitment?.trim() || null,
      socialProfileUrls: input.socialProfileUrls.map((url) => url.trim()).filter(Boolean),
    },
  });
}
