import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The centered-card shell every unauthenticated admin auth screen renders inside
 * (`ui/mockups/f-admin-auth/*.html`'s shared `.admin-auth-shell`/`.auth-card` styling) —
 * `/admin/setup-2fa` (T6.2) and `/admin/login` (T6.3) both use this, extracted here at T6.3
 * rather than left duplicated in T6.2's own page file. Not the authenticated sidebar shell
 * (`app/admin/(shell)/layout.tsx`) — a partner viewing either of these screens has no session
 * yet, so nothing here assumes one.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-6">
      <div className="bg-card border-border w-full max-w-[440px] rounded-md border p-10">
        <div className="mb-6 text-center">
          <Image
            src="/brand/logo-primary.png"
            alt="Kaalbert & Company Ltd"
            width={1980}
            height={382}
            className="mx-auto h-[34px] w-auto"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
