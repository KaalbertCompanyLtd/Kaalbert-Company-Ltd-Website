import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthShell } from "@/app/admin/auth-shell";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

import { LoginForm } from "./login-form";

// T6.3 follow-up (session 44, 2026-09-11): this page now checks the session cookie on every
// load (see the redirect below), a real Prisma query via `verifySession` — so, unlike before,
// it can no longer be treated as reading no live content. Same "no static prerender" reasoning
// as every other page built against live state (CLAUDE.md, memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner Login — Kaalbert & Company Ltd",
  robots: { index: false, follow: false },
};

/**
 * `/admin/login` (`ui/mockups/f-admin-auth/admin-login.html`; `admin-authentication.md`'s
 * "Login" user-flow step). The actual credential verification happens via `POST /api/admin/
 * auth/login`/`verify-totp` — this page itself renders the form and, since T6.3 follow-up
 * (session 44), also redirects an already-authenticated visitor straight to `/admin` rather
 * than showing them a login form they don't need. Checked here rather than in `proxy.ts` —
 * this page is the only one of the four unauthenticated `/admin/*` screens where "already has
 * a valid session" is meaningful to check at all (`/admin/setup-2fa`, `/admin/forgot-
 * password`, and `/admin/reset-password` are all reached via their own opaque, single-use
 * token regardless of session state, so a session check there would add a DB query for no
 * behavioural difference); keeping it out of `proxy.ts`'s allowlist logic also means the
 * other three stay exactly as cheap and session-agnostic as they were.
 *
 * The mockup's "Forgot password?" link is wired to `/admin/forgot-password` (T6.7) —
 * previously deliberately omitted here, since no password-reset task existed anywhere in
 * this epic and a link that did nothing when clicked was worse than no link at all.
 */
export default async function LoginPage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (session) {
    redirect("/admin");
  }

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
