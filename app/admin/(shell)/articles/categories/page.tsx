import Link from "next/link";

import { listCategoriesWithCounts } from "@/lib/categories";
import { CategoriesClient } from "./categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Categories</h1>
        <Link href="/admin/articles" className="text-muted-foreground text-sm">
          ← Back to Articles
        </Link>
      </div>

      <CategoriesClient initialCategories={categories} />

      <p className="text-muted-foreground mt-4 max-w-xl text-sm">
        Retiring a category doesn&apos;t delete its articles — they fall back to &quot;no
        category,&quot; still listed on the index, just excluded from category-filtered views.
      </p>
    </div>
  );
}
