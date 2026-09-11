import Link from "next/link";

import { getCapabilitiesPageForEdit } from "@/lib/admin-pages";
import { CapabilitiesEditorForm } from "./capabilities-editor-form";

export const dynamic = "force-dynamic";

export default async function CapabilitiesPagesEditor() {
  const data = await getCapabilitiesPageForEdit();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Capabilities</h1>
        <Link href="/admin/pages" className="text-muted-foreground text-sm">
          ← Back to Pages
        </Link>
      </div>

      <CapabilitiesEditorForm initial={data} />
    </div>
  );
}
