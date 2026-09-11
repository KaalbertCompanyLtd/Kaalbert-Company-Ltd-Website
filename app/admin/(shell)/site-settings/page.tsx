import { getSiteSettingsForEdit } from "@/lib/admin-site-settings";
import { SiteSettingsEditorForm } from "./site-settings-editor-form";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const settings = await getSiteSettingsForEdit();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Site Settings</h1>
        <p className="text-muted-foreground text-sm">
          One record for the whole firm — read live by the footer, /contact, every WhatsApp button,
          and search engines&apos; Organization listing.
        </p>
      </div>

      <SiteSettingsEditorForm initial={settings} />
    </div>
  );
}
