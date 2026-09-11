import type { Metadata } from "next";

import { AuthShell } from "@/app/admin/auth-shell";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password — Kaalbert & Company Ltd",
  robots: { index: false, follow: false },
};

/**
 * `/admin/forgot-password` (T6.7) — reached via `/admin/login`'s own "Forgot password?" link
 * (present in the mockup, `ui/mockups/f-admin-auth/admin-login.html`, since T1.5 but never
 * wired to anything until this task — see `app/admin/login/page.tsx`'s login-form.tsx for the
 * link itself). No dedicated mockup exists for this screen (a genuinely new gap — see
 * `docs/tasks/06-admin-auth.md` T6.7); inferred from `admin-login.html`'s own `.auth-card`
 * layout, the same pattern `/admin/setup-2fa` and `/admin/login` both already use via
 * `AuthShell`. Reads no live database content of its own — the actual request happens via
 * `POST /api/admin/auth/request-password-reset` — so, like `/admin/login`, this page needs no
 * `force-dynamic` export.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
