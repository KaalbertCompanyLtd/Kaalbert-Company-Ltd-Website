import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGES = [
  {
    href: "/admin/pages/capabilities",
    title: "Capabilities",
    description: "Hero copy and the eight service-line summaries shown on /capabilities.",
  },
  {
    href: "/admin/pages/our-method",
    title: "Our Method",
    description: "Hero copy, intro, and the four method stages shown on /our-method.",
  },
] as const;

export default function PagesListPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Pages</h1>
        <p className="text-body text-muted-foreground mt-1">
          Marketing page copy and legal/compliance content.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="border-border bg-card hover:bg-muted flex flex-col gap-1 rounded-md border p-5 transition-colors"
          >
            <span className="text-primary font-display text-lg font-bold">{page.title}</span>
            <span className="text-muted-foreground text-sm">{page.description}</span>
          </Link>
        ))}

        <Link
          href="/admin/pages/legal"
          className="border-border text-primary hover:bg-muted rounded-md border border-dashed p-5 text-sm font-semibold transition-colors"
        >
          Manage legal pages &amp; footer →
        </Link>
      </div>
    </div>
  );
}
