import type { Metadata } from "next";
import QRCode from "qrcode";

import { AuthShell } from "@/app/admin/auth-shell";
import { resolvePendingTotpSetup } from "@/lib/auth/totp-setup";

import { TotpSetupForm } from "./totp-setup-form";

// Reads a live `admin_user` row (by setup token) on every request, and may write a freshly
// generated encrypted TOTP secret to it — same "no static prerender" reasoning as every other
// page built against live database content (CLAUDE.md, memory/decision-log.md, T2.1).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set Up Two-Factor Authentication — Kaalbert & Company Ltd",
  // A one-time, unauthenticated setup link — never indexed, same treatment as
  // app/diagnostic/results/page.tsx's personalized-content metadata.
  robots: { index: false, follow: false },
};

interface SetupTwoFactorPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

function parseToken(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.length > 0 ? value : null;
}

/**
 * `/admin/setup-2fa` (docs/features/admin-authentication.md's Interfaces section;
 * ui/mockups/f-admin-auth/admin-2fa-setup.html). Reached via `?token=<admin_user.setup_token>`
 * — see that field's schema doc-comment (prisma/schema.prisma) for why this task resolves
 * "which account" this way rather than via a login session (none exists pre-enrolment).
 *
 * QR code generation (`qrcode`, a presentation-only concern — not a crypto library, ADR
 * 0007 doesn't apply to it) happens here, server-side, from the `otpauth://` URI
 * `resolvePendingTotpSetup` builds; the raw secret itself is never sent to the client except
 * as this QR image and the manual-entry fallback text — both are the intended, one-time
 * disclosure to the account's own owner that RFC 6238 setup requires, not a leak.
 */
export default async function SetupTwoFactorPage({ searchParams }: SetupTwoFactorPageProps) {
  const { token: rawToken } = await searchParams;
  const token = parseToken(rawToken);
  const pending = token ? await resolvePendingTotpSetup(token) : null;

  if (!token || !pending) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-h3 font-display text-primary mb-1.5 font-bold">
            This setup link is no longer valid
          </h1>
          <p className="text-caption text-muted-foreground">
            It may have expired or already been used. Please ask another partner to send you a new
            setup link.
          </p>
        </div>
      </AuthShell>
    );
  }

  const qrCodeDataUrl = await QRCode.toDataURL(pending.otpauthUri, { margin: 1, width: 168 });

  return (
    <AuthShell>
      <TotpSetupForm
        setupToken={token}
        qrCodeDataUrl={qrCodeDataUrl}
        manualKey={pending.manualKey}
      />
    </AuthShell>
  );
}
