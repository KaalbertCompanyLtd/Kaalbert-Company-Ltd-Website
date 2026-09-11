import Link from "next/link";

import { getArticleList } from "@/lib/articles";
import { listCategoriesWithCounts } from "@/lib/categories";
import { ArticlesListClient } from "./articles-list-client";

/**
 * Reads live `article`/`category` counts on every request — same reasoning as
 * app/admin/(shell)/page.tsx (T7.1): Prisma calls aren't tracked by Next's fetch-cache
 * heuristics, so this page can look static to Next.js even though it isn't.
 */
export const dynamic = "force-dynamic";

export default async function ArticlesListPage() {
  const [articles, categories] = await Promise.all([getArticleList(), listCategoriesWithCounts()]);
  const publishedCount = articles.filter((article) => article.status === "published").length;
  const draftCount = articles.length - publishedCount;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">Articles</h1>
          <p className="text-body text-muted-foreground mt-1">
            {publishedCount} published, {draftCount} draft ·{" "}
            <Link href="/admin/articles/categories" className="text-primary font-semibold">
              Manage categories →
            </Link>
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-primary text-primary-foreground hover:bg-pine-700 inline-flex w-fit items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          New Article
        </Link>
      </div>

      <ArticlesListClient
        articles={articles.map((article) => ({
          id: article.id,
          title: article.title,
          authorName: article.authorName,
          categoryName: article.categoryName,
          status: article.status,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
        }))}
        categories={categories.map((category) => category.name)}
      />
    </div>
  );
}
