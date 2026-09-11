import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleForEdit, getArticleFormOptions } from "@/lib/articles";
import { ArticleEditorForm } from "../article-editor-form";

export const dynamic = "force-dynamic";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) {
    notFound();
  }

  const [article, options] = await Promise.all([getArticleForEdit(id), getArticleFormOptions()]);
  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Edit Article</h1>
        <Link href="/admin/articles" className="text-muted-foreground text-sm">
          ← Back to Articles
        </Link>
      </div>

      <ArticleEditorForm
        articleId={article.id}
        options={options}
        initial={{
          title: article.title,
          excerpt: article.excerpt,
          categoryId: article.categoryId,
          authorId: article.authorId,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          previewImage: article.previewImage,
          body: article.body,
          nextStepCta: article.nextStepCta,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
          revisedAt: article.revisedAt ? article.revisedAt.toISOString() : null,
        }}
      />
    </div>
  );
}
