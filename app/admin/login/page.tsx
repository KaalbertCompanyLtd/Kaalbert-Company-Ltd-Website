import type { Metadata } from "next";

import { AuthShell } from "@/app/admin/auth-shell";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Partner Login — Kaalbert & Company Ltd",
  robots: { index: false, follow: false },
};

/**
 * `/admin/login` (`ui/mockups/f-admin-auth/admin-login.html`; `admin-authentication.md`'s
 * "Login" user-flow step). Reads no live database content of its own — the actual
 * verification happens via `POST /api/admin/auth/login`/`verify-totp` — so unlike
 * `/admin/setup-2fa` this page needs no `force-dynamic` export.
 *
 * The mockup's "Forgot password?" link is deliberately omitted: no password-reset task
 * exists anywhere in this epic (`docs/tasks/06-admin-auth.md`), and a link that does nothing
 * when clicked is worse than no link at all.
 */
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
