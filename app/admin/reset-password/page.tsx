import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/app/admin/auth-shell";
import { resolvePasswordReset } from "@/lib/auth/password-reset";

import { ResetPasswordForm } from "./reset-password-form";

// Reads a live `admin_user` row (by reset token) on every request — same "no static
// prerender" reasoning as `/admin/setup-2fa` (CLAUDE.md, memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a New Password — Kaalbert & Company Ltd",
  // A one-time, unauthenticated reset link — never indexed, same treatment as
  // /admin/setup-2fa's own metadata.
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

function parseToken(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.length > 0 ? value : null;
}

/**
 * `/admin/reset-password` (T6.7). Reached via `?token=<admin_user.password_reset_token>` —
 * the same "resolve which account via an opaque token, since no login session exists yet"
 * shape `/admin/setup-2fa` already uses, for the same reason (see that field's schema
 * doc-comment). No dedicated mockup (a genuinely new screen, see `docs/tasks/06-admin-
 * auth.md` T6.7); inferred from `admin-2fa-setup.html`'s own single-focused-action layout via
 * `AuthShell`.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token: rawToken } = await searchParams;
  const token = parseToken(rawToken);
  const pending = token ? await resolvePasswordReset(token) : null;

  if (!token || !pending) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-h3 font-display text-primary mb-1.5 font-bold">
            This link is no longer valid
          </h1>
          <p className="text-caption text-muted-foreground mb-4">
            It may have expired or already been used. You can request a new one below.
          </p>
          <Link
            href="/admin/forgot-password"
            className="text-caption text-primary font-semibold hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
