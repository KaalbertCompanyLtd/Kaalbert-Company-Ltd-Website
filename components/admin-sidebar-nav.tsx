"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Route slugs inferred from the sidebar labels in
 * ui/mockups/g-admin-content/admin-dashboard.html (screen-inventory.md #25) — no feature doc
 * fixes these paths yet, since each section's own admin task (Milestones 7/8) owns its real
 * screen. Only "/admin" (Dashboard) resolves to a real page in this task.
 *
 * **Real bug found and fixed at session 60**: the mockup's own "Bonus" section listed
 * "Performance" pointing at `/admin/performance`, a route Milestone 9 hasn't built yet — every
 * signed-in partner saw a permanently dead link the whole time. Removed until Milestone 9
 * actually ships that screen; re-add it as part of that milestone's own first task, not
 * before.
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
      { name: "Diagnostic Configuration", href: "/admin/diagnostic-questions" },
      { name: "Site Settings", href: "/admin/site-settings" },
      { name: "Subscribers", href: "/admin/subscribers" },
    ],
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

/**
 * `/admin/diagnostic-configuration` is a second screen reached by an inline link from
 * `/admin/diagnostic-questions` (CLAUDE.md's "one nav entry, second screen via inline link"
 * pattern), not its own sidebar item — treat a visit there as if it were the parent path for
 * active-state purposes, the same way any other nested route already behaves.
 */
function normalizeForActiveMatch(pathname: string): string {
  if (pathname === "/admin/diagnostic-configuration") return "/admin/diagnostic-questions";
  return pathname;
}

/**
 * A nav item is active on its own exact path or any nested route beneath it (e.g.
 * `/admin/articles/42` or `/admin/articles/new` for the `/admin/articles` item) — an exact-
 * match-only check left every detail/editor screen with no active tab at all. `/admin`
 * (Dashboard) is the one exception: every other href is nested under it, so it only matches
 * its own exact path, never a prefix.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  const normalized = normalizeForActiveMatch(pathname);
  if (href === "/admin") return normalized === "/admin";
  return normalized === href || normalized.startsWith(`${href}/`);
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
            const active = isNavItemActive(pathname, item.href);
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
