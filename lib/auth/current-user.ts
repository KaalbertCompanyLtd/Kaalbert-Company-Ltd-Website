import { cookies } from "next/headers";

import { AdminRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { SESSION_COOKIE_NAME, verifySession } from "./session";

export interface CurrentAdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  /** Null for an account with no linked public profile (e.g. the developer/vendor account). */
  author: { id: number; name: string; photoUrl: string | null; title: string } | null;
}

/**
 * The one canonical "who is this" resolver — session 60, added to close a real gap: every
 * Server Component and route handler that needed the signed-in identity was independently
 * re-deriving it from the raw cookie (`app/admin/(shell)/team/page.tsx` being the one
 * pre-existing example), and nothing anywhere read `AdminUser.role` at all. Every permission
 * check and the sidebar's real identity display both call this instead.
 *
 * Returns `null` for no session, an invalid/expired one, or a deactivated account — the same
 * cases `verifySession` itself already collapses into one outcome; a caller under `/admin`
 * never needs to distinguish which, since `proxy.ts` has already redirected an unauthenticated
 * request away before any Server Component here would run. Still typed nullable rather than
 * asserted non-null, since a route handler outside that guarantee (or a future caller) should
 * never be tempted to assume a session exists just because this function exists.
 */
export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return null;

  const user = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      author: { select: { id: true, name: true, photoUrl: true, title: true } },
    },
  });
  if (!user) return null;

  return user;
}

/** True for an Owner — the tier that can manage any login/profile, not just their own. */
export function isOwner(user: CurrentAdminUser | null): boolean {
  return user?.role === AdminRole.OWNER;
}

/**
 * True when `user` is allowed to edit the `author` row identified by `authorId` — either
 * because they're an Owner (who can edit anyone's public profile) or because it's their own
 * linked profile. The concrete fix for a real, reported gap: before this, any signed-in
 * partner could edit any other partner's entry, with nothing checking who was asking.
 */
export function canEditAuthorProfile(user: CurrentAdminUser | null, authorId: number): boolean {
  if (!user) return false;
  return isOwner(user) || user.author?.id === authorId;
}
