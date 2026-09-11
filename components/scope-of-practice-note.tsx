import Link from "next/link";

/**
 * FR-5.1: sourced from `footer_content.scopeOfPracticeStatement`/`companyRegistrationDetails`
 * (`lib/legal.ts`'s `getFooterContent`), live per-request as of T7.8 — previously hard-coded
 * to `ui/mockups/a-public-site/*.html`'s exact text since no content-management admin surface
 * existed yet. `statement`/`companyRegistrationDetails` are optional so the two callers that
 * can't fetch live data (`app/error.tsx`, a required Client Component per Next.js's
 * error-boundary rule, and `app/not-found.tsx`, which deliberately has zero DB dependency for
 * reliability — see that file's own comment) fall back to the original copy rather than
 * omitting the note entirely. `companyRegistrationDetails` renders only once the firm supplies
 * it post-incorporation (legal-and-compliance-pages.md's edge case) — omitted, not a
 * placeholder, while null.
 */
const FALLBACK_STATEMENT =
  "Kaalbert & Company Ltd is a business advisory firm. It is not a licensed audit, tax or legal practice, and connects clients to licensed practitioners where such work is required.";

export interface ScopeOfPracticeNoteProps {
  statement?: string;
  companyRegistrationDetails?: string | null;
}

export function ScopeOfPracticeNote({
  statement = FALLBACK_STATEMENT,
  companyRegistrationDetails = null,
}: ScopeOfPracticeNoteProps) {
  return (
    <div className="border-pine-500 mt-8 border-t pt-6">
      <p className="text-caption text-primary-foreground/80 leading-[1.6]">
        {statement} ·{" "}
        <Link href="/legal/privacy-notice" className="text-brass-300 hover:underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/legal/cookie-notice" className="text-brass-300 hover:underline">
          Cookies
        </Link>{" "}
        ·{" "}
        <Link href="/legal/terms-of-use" className="text-brass-300 hover:underline">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/legal/scope-of-practice" className="text-brass-300 hover:underline">
          Scope of Practice
        </Link>
      </p>
      {companyRegistrationDetails && (
        <p className="text-caption text-primary-foreground/60 mt-1.5 leading-[1.6]">
          {companyRegistrationDetails}
        </p>
      )}
    </div>
  );
}
