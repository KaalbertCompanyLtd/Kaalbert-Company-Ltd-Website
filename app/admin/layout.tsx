import Image from "next/image";

import { AdminMobileSidebar } from "@/components/admin-mobile-sidebar";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";

/**
 * The sidebar-plus-content-area shell every admin screen inherits
 * (ui/screen-inventory.md #25, inferred from ui/mockups/g-admin-content/admin-dashboard.html
 * — there is no dedicated shell mockup). Frame only: no auth enforcement (Milestone 6,
 * docs/tasks/06-admin-auth.md) and no real content beyond this task's placeholder page.
 *
 * Responsive from this first implementation (CLAUDE.md's "Responsive is built in from the
 * first implementation" rule, added at T1.5): the persistent sidebar is desktop-only
 * (`lg:flex`); below that it's replaced by AdminMobileSidebar's topbar + left-sliding
 * off-canvas drawer, since the mockup itself never addresses a narrower viewport.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <AdminMobileSidebar />

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
        {/* Account block placeholder — no admin session exists until Milestone 6 wires
            real auth (docs/tasks/06-admin-auth.md); these two lines are structural
            placeholders, not a fabricated signed-in identity. */}
        <div className="border-pine-500 text-caption text-primary-foreground/80 shrink-0 border-t px-6 py-4">
          <strong className="text-primary-foreground block text-[0.875rem]">
            Signed-in partner
          </strong>
          Role
        </div>
      </aside>

      <div className="bg-background min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </div>
    </div>
  );
}
