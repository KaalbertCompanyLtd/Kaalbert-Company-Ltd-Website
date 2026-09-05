"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Route slugs inferred from the sidebar labels in
 * ui/mockups/g-admin-content/admin-dashboard.html (screen-inventory.md #25) — no feature doc
 * fixes these paths yet, since each section's own admin task (Milestones 7/8) owns its real
 * screen. Only "/admin" (Dashboard) resolves to a real page in this task.
 */
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ name: "Dashboard", href: "/admin" }],
  },
  {
    label: "Content",
    items: [
      { name: "Articles", href: "/admin/articles" },
      { name: "Pages", href: "/admin/pages" },
      { name: "Offers", href: "/admin/offers" },
      { name: "Landing Pages", href: "/admin/landing-pages" },
      { name: "Team", href: "/admin/team" },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Enquiries", href: "/admin/enquiries" },
      { name: "Diagnostic Configuration", href: "/admin/diagnostic-configuration" },
      { name: "Site Settings", href: "/admin/site-settings" },
    ],
  },
  {
    label: "Bonus",
    items: [{ name: "Performance", href: "/admin/performance" }],
  },
] as const;

export interface AdminSidebarNavProps {
  /**
   * Called when a nav link is clicked — wired to close the mobile off-canvas drawer
   * (app/admin/layout.tsx) since this same component renders both the persistent desktop
   * sidebar (no dialog to close) and the drawer's content. Omitted on desktop.
   */
  onNavigate?: () => void;
}

export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps = {}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.label ?? `section-${index}`}>
          {section.label && (
            <span className="text-pine-500 block px-6 pt-4.5 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase">
              {section.label}
            </span>
          )}
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "text-primary-foreground/80 hover:text-primary-foreground block border-l-[3px] border-transparent px-6 py-2.5 text-[0.9375rem] font-semibold",
                  active && "border-accent bg-pine-700 text-primary-foreground",
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
