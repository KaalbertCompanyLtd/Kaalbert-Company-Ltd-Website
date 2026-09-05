import Link from "next/link";

/**
 * FR-5.1: sourced from one shared content field. No content-management admin surface exists
 * yet (that's content-management-admin.md's job), so the copy below is hard-coded to
 * ui/mockups/a-public-site/*.html's exact text rather than read live. Extracted as its own
 * component per ui/components.md since legal-and-compliance-pages.md reuses it separately
 * from SiteFooter.
 */
export function ScopeOfPracticeNote() {
  return (
    <p className="border-pine-500 text-caption text-primary-foreground/80 mt-8 border-t pt-6 leading-[1.6]">
      Kaalbert &amp; Company Ltd is a business advisory firm. It is not a licensed audit, tax or
      legal practice, and connects clients to licensed practitioners where such work is required. ·{" "}
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
  );
}
