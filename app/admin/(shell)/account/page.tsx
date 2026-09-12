import { redirect } from "next/navigation";

import { AdminRole } from "@/generated/prisma/client";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { AccountSecurityForm } from "./account-security-form";

export const dynamic = "force-dynamic";

/**
 * `/admin/account` (session 60) — the self-service counterpart to what `AdminUserActionsPanel`
 * already lets an Owner do to *someone else's* account: change your own password, set up a
 * new 2FA device voluntarily, regenerate your own backup codes. Before this task, none of
 * that existed for a logged-in partner acting on themselves — confirmed directly: `grep` for
 * any in-session "change my password" capability returned nothing, and `/admin/setup-2fa`
 * only ever worked via a `?token=` someone else generated. Open to any role — everyone
 * manages their own login, this page has no Owner-only content.
 */
export default async function AccountPage() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Account &amp; Security</h1>
        <p className="text-body text-muted-foreground mt-1">
          Manage your own login — nobody else&apos;s.
        </p>
      </div>

      <AccountSecurityForm
        name={currentUser.name}
        email={currentUser.email}
        roleLabel={currentUser.role === AdminRole.OWNER ? "Owner" : "Partner"}
      />
    </div>
  );
}
