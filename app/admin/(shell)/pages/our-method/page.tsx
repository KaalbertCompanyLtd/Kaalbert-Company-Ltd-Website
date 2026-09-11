import Link from "next/link";

import { getOurMethodPageForEdit } from "@/lib/admin-pages";
import { OurMethodEditorForm } from "./our-method-editor-form";

export const dynamic = "force-dynamic";

export default async function OurMethodPagesEditor() {
  const data = await getOurMethodPageForEdit();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Our Method</h1>
        <Link href="/admin/pages" className="text-muted-foreground text-sm">
          ← Back to Pages
        </Link>
      </div>

      <OurMethodEditorForm initial={data} />
    </div>
  );
}
