"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";

import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Mobile-only topbar + off-canvas drawer for the admin shell, shown below `lg` in place of
 * the persistent sidebar (app/admin/layout.tsx). Slides in from the left, matching the
 * sidebar's own docked edge — the same side-drawer pattern as SiteHeader's public-site mobile
 * nav (CLAUDE.md's "Responsive is built in from the first implementation" rule), mirrored to
 * the opposite edge since this panel is standing in for a left-docked sidebar rather than a
 * top nav bar.
 */
export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-primary text-primary-foreground flex shrink-0 items-center justify-between border-b px-4 py-3 lg:hidden">
      <Image
        src="/brand/logo-dark-bg.png"
        alt="Kaalbert & Company Ltd"
        width={1980}
        height={382}
        className="h-[26px] w-auto"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger
          aria-label="Open admin menu"
          className="text-primary-foreground/80 hover:text-primary-foreground inline-flex items-center justify-center rounded-sm p-2"
        >
          <Menu className="size-6" />
        </DialogPrimitive.Trigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup
            data-slot="admin-mobile-nav-content"
            className="bg-primary text-primary-foreground data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left fixed inset-y-0 left-0 z-50 flex h-full w-[80vw] max-w-[280px] flex-col py-6 shadow-md duration-200 outline-none"
          >
            <div className="border-pine-500 flex shrink-0 items-center justify-between border-b px-6 pb-1.5">
              <DialogTitle className="sr-only">Admin menu</DialogTitle>
              <Image
                src="/brand/logo-dark-bg.png"
                alt="Kaalbert & Company Ltd"
                width={1980}
                height={382}
                className="h-[28px] w-auto"
              />
              <DialogClose
                aria-label="Close menu"
                className="text-primary-foreground/80 hover:text-primary-foreground rounded-sm p-2"
              >
                <X className="size-5" />
              </DialogClose>
            </div>
            <AdminSidebarNav onNavigate={() => setOpen(false)} />
            <div className="border-pine-500 text-caption text-primary-foreground/80 shrink-0 border-t px-6 py-4">
              <strong className="text-primary-foreground block text-[0.875rem]">
                Signed-in partner
              </strong>
              Role
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </header>
  );
}
