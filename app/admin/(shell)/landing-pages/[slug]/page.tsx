import Link from "next/link";
import { notFound } from "next/navigation";

import { getLandingPageForEdit } from "@/lib/admin-landing-pages";
import { EditLandingPageForm } from "./edit-landing-page-form";

export const dynamic = "force-dynamic";

export default async function LandingPageEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landingPage = await getLandingPageForEdit(slug);

  if (!landingPage) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">{landingPage.headline}</h1>
        <Link href="/admin/landing-pages" className="text-muted-foreground text-sm">
          ← Back to Landing Pages
        </Link>
      </div>

      <EditLandingPageForm initial={landingPage} />
    </div>
  );
}
