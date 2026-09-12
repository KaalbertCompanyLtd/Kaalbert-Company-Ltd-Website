"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import type { CurrentAdminUser } from "@/lib/auth/current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * Replaces the sidebar's former hardcoded "Signed-in partner / Role" placeholder (session 60
 * — see `app/admin/(shell)/layout.tsx`'s former doc-comment, which named this gap directly:
 * "no admin session exists until Milestone 6 wires real auth... these two lines are
 * structural placeholders" — Milestone 6 shipped and nobody came back). Shows the linked
 * `Author`'s photo/name when one exists, else the bare `AdminUser.name` (the dev/vendor
 * accounts have no public profile at all) — and is now a real interactive menu, not static
 * text, with the three self-service actions `content-management-admin.md`'s account/
 * profile-control gap named as missing: viewing one's own public profile, managing one's own
 * login security, and signing out.
 */
export function AdminAccountMenu({ currentUser }: { currentUser: CurrentAdminUser }) {
  const router = useRouter();
  const displayName = currentUser.author?.name ?? currentUser.name;
  const caption = currentUser.author?.title ?? (currentUser.role === "OWNER" ? "Owner" : "Partner");

  async function handleSignOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="border-pine-500 hover:bg-pine-700/40 flex w-full shrink-0 items-center gap-2.5 border-t px-6 py-4 text-left outline-none"
        aria-label="Account menu"
      >
        <Avatar className="size-8 shrink-0 rounded-md">
          {currentUser.author?.photoUrl && (
            <AvatarImage src={currentUser.author.photoUrl} alt={displayName} />
          )}
          <AvatarFallback className="bg-pine-700 text-primary-foreground rounded-md text-xs font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <strong className="text-primary-foreground block truncate text-[0.875rem]">
            {displayName}
          </strong>
          <span className="text-caption text-primary-foreground/80 block truncate">{caption}</span>
        </span>
        <ChevronDown className="text-primary-foreground/60 size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {currentUser.author && (
          <DropdownMenuItem onClick={() => router.push(`/admin/team/${currentUser.author?.id}`)}>
            My public profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push("/admin/account")}>
          Account &amp; security
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
