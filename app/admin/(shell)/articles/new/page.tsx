import Link from "next/link";

import { getArticleFormOptions } from "@/lib/articles";
import { ArticleEditorForm } from "../article-editor-form";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const options = await getArticleFormOptions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">New Article</h1>
        <Link href="/admin/articles" className="text-muted-foreground text-sm">
          ← Back to Articles
        </Link>
      </div>

      <ArticleEditorForm
        options={options}
        initial={{
          title: "",
          excerpt: "",
          categoryId: null,
          authorId: options.authors[0]?.id ?? null,
          metaTitle: "",
          metaDescription: "",
          previewImage: null,
          body: [],
          nextStepCta: { heading: "", body: "", label: "", href: "" },
          publishedAt: null,
          revisedAt: null,
        }}
      />
    </div>
  );
}
