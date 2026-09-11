import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

/**
 * Enforces `admin-authentication.md`'s NFR-3 ("no admin route reachable without a valid
 * TOTP-verified session") for real — T6.1's `admin_user`/`admin_session` tables and T6.2's
 * `/admin/setup-2fa` existed before this, but nothing actually checked a session until now.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (CLAUDE.md's Auth Pattern section) — a
 * stray `middleware.ts` here would be silently ignored at build time with no error, which
 * would make this whole file a no-op with nothing surfacing that fact. Runs on the Node.js
 * runtime by default (not Edge), so it can call `verifySession` — a real Prisma query —
 * directly, the same way any server-side code in this project does.
 *
 * Two path groups are deliberately excluded from the session check below, both because they
 * are how a session gets created in the first place: the auth-flow pages themselves
 * (`/admin/login`, `/admin/setup-2fa`, and — added at T6.7 — `/admin/forgot-password`/
 * `/admin/reset-password`; each protected by its own mechanism, a password/TOTP form or a
 * single-use token, not a session) and every `/api/admin/auth/*` route (`login`,
 * `verify-totp`, T6.2's `setup-2fa` confirm, T6.4's `verify-backup-code`, and T6.7's
 * `request-password-reset`/`reset-password`) — a prefix check so a future auth endpoint
 * under that path doesn't need a second edit here to stay reachable.
 *
 * **Real bug hit and fixed at T6.7 (session 43)**: `/admin/forgot-password` and
 * `/admin/reset-password` were built without adding them to `PUBLIC_ADMIN_PAGE_PATHS` below
 * — both pages compiled, typechecked, and linted cleanly, but every unauthenticated visitor
 * (the only kind either page is ever reached by) was silently redirected straight back to
 * `/admin/login` before rendering. Caught only via live Playwright verification against the
 * real dev server, not by any static check — the same class of "compiles fine, never
 * actually reachable" failure `app/proxy.ts` vs. `proxy.ts` itself was at T6.3 (see
 * `memory/known-bugs.md`). Whenever a new unauthenticated `/admin/*` page is added, it must
 * be added to this set in the same change, not discovered missing later.
 */
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

const PUBLIC_ADMIN_PAGE_PATHS = new Set([
  "/admin/login",
  "/admin/setup-2fa",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin/auth/") || PUBLIC_ADMIN_PAGE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json(
      { status: "error", message: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
