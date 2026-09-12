import Image from "next/image";

import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { AdminAccountMenu } from "@/components/admin-account-menu";
import { AdminMobileSidebar } from "@/components/admin-mobile-sidebar";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";

/**
 * The sidebar-plus-content-area shell every *authenticated* admin screen inherits
 * (ui/screen-inventory.md #25, inferred from ui/mockups/g-admin-content/admin-dashboard.html
 * — there is no dedicated shell mockup). Every route this layout wraps is genuinely
 * session-gated by `proxy.ts` (T6.3, project root, not `app/proxy.ts` — see CLAUDE.md's
 * Next.js 16 note for why that distinction is a real, previously-hit bug, not a style
 * preference).
 *
 * Now `async` (session 60) to resolve the real signed-in identity once via
 * `getCurrentAdminUser()` and pass it to `AdminAccountMenu`, replacing this file's own former
 * hardcoded "Signed-in partner / Role" placeholder — that placeholder outlived the auth
 * system it was waiting on by several milestones, never revisited until the user pointed out
 * directly that nothing in the account/profile area actually worked yet.
 *
 * Moved into this `(shell)` route group at T6.2 — a plain `app/admin/layout.tsx` would wrap
 * *every* route under `/admin/*`, including auth-flow screens like `/admin/setup-2fa` (this
 * task) and `/admin/login` (T6.3) that must render their own standalone centered card
 * (`ui/mockups/f-admin-auth/*.html`'s `.admin-auth-shell`), not this sidebar — a partner
 * setting up 2FA or logging in has no session yet, so a "Signed-in partner" sidebar makes no
 * sense around them. The route group changes nothing about the URL (`(shell)/page.tsx` still
 * resolves to `/admin`), only which layout wraps which routes.
 *
 * Responsive from this first implementation (CLAUDE.md's "Responsive is built in from the
 * first implementation" rule, added at T1.5): the persistent sidebar is desktop-only
 * (`lg:flex`); below that it's replaced by AdminMobileSidebar's topbar + left-sliding
 * off-canvas drawer, since the mockup itself never addresses a narrower viewport.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const currentUser = await getCurrentAdminUser();

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <AdminMobileSidebar currentUser={currentUser} />

      <aside className="bg-primary text-primary-foreground hidden h-full w-60 shrink-0 flex-col py-6 lg:flex">
        <div className="border-pine-500 shrink-0 border-b px-6 pb-1.5">
          <Image
            src="/brand/logo-dark-bg.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            className="h-[31px] w-auto"
          />
        </div>
        <AdminSidebarNav />
        {currentUser && <AdminAccountMenu currentUser={currentUser} />}
      </aside>

      <div className="bg-background min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </div>
    </div>
  );
}
