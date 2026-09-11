import Link from "next/link";

import { NewLandingPageForm } from "./new-landing-page-form";

export const dynamic = "force-dynamic";

export default function NewLandingPagePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">New Landing Page</h1>
        <Link href="/admin/landing-pages" className="text-muted-foreground text-sm">
          ← Back to Landing Pages
        </Link>
      </div>

      <NewLandingPageForm />
    </div>
  );
}
