import Link from "next/link";

import { LEGAL_PAGE_SLUGS } from "@/lib/legal";
import { getLegalAdminData, getLegalPageForEdit } from "@/lib/admin-legal";
import { LegalAdminClient } from "./legal-admin-client";

export const dynamic = "force-dynamic";

export default async function LegalAdminPage() {
  const [{ footerContent }, legalPages] = await Promise.all([
    getLegalAdminData(),
    Promise.all(LEGAL_PAGE_SLUGS.map((slug) => getLegalPageForEdit(slug))),
  ]);

  const pages = legalPages.filter((page) => page !== null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Legal Pages &amp; Footer</h1>
        <Link href="/admin/pages" className="text-muted-foreground text-sm">
          ← Back to Pages
        </Link>
      </div>

      <LegalAdminClient initialPages={pages} initialFooterContent={footerContent} />
    </div>
  );
}
