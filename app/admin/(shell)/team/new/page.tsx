import Link from "next/link";
import { redirect } from "next/navigation";

import { getUnlinkedAuthors } from "@/lib/admin-team";
import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AddPartnerForm } from "./add-partner-form";

export const dynamic = "force-dynamic";

/**
 * Owner-only — a Partner landing here directly (e.g. a stale bookmark) is sent back to the
 * Team list rather than shown a dead-end form (`proxy.ts` only verifies a session exists, not
 * a role, so this page-level check is the actual gate; `POST /api/admin/team` enforces the
 * same rule server-side regardless).
 */
export default async function NewPartnerPage() {
  const currentUser = await getCurrentAdminUser();
  if (!isOwner(currentUser)) {
    redirect("/admin/team");
  }

  const unlinkedAuthors = await getUnlinkedAuthors();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Add Partner</h1>
        <Link href="/admin/team" className="text-muted-foreground text-sm">
          ← Back to Team
        </Link>
      </div>

      <AddPartnerForm unlinkedAuthors={unlinkedAuthors} />
    </div>
  );
}
