"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ArticleBodyBlock, ArticleNextStepCta } from "@/lib/insights";
import { AdminImageUploadButton } from "@/components/admin-image-upload-button";
import { Badge } from "@/components/ui/badge";
import { BlockEditor } from "./block-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ArticleEditorInitial {
  title: string;
  excerpt: string;
  categoryId: number | null;
  authorId: number | null;
  metaTitle: string;
  metaDescription: string;
  previewImage: string | null;
  body: ArticleBodyBlock[];
  nextStepCta: ArticleNextStepCta;
  publishedAt: string | null;
  revisedAt: string | null;
}

export interface ArticleEditorOptions {
  authors: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}

/**
 * `ui/mockups/g-admin-content/admin-article-editor.html` built to its real, current data
 * contract (`prisma/schema.prisma`'s `Article` model) rather than that mockup's literal
 * field set: `excerpt`, `metaTitle`, and `nextStepCta` are all required, non-nullable schema
 * fields with no corresponding input on the mockup (added after it was drawn — T4.2/T4.3, per
 * that model's own doc-comment) — the same "mockup missing real fields" gap already found and
 * fixed once for the Offer editor (`docs/dashboard.md`'s pre-Phase-6 audit). See
 * `memory/decision-log.md` (T7.2) for the full reasoning. The Status dropdown the mockup
 * shows next to Publish/Save-draft has no scripted behaviour in that mockup (unlike
 * `admin-categories-list.html`, which does) — treated as illustrative, replaced here with a
 * plain read-only status badge; an explicit "unpublish" action isn't named in any acceptance
 * criterion for this task, so this form builds none.
 */
export function ArticleEditorForm({
  articleId,
  initial,
  options,
}: {
  articleId?: number;
  initial: ArticleEditorInitial;
  options: ArticleEditorOptions;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
  const [authorId, setAuthorId] = useState<number | null>(initial.authorId);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [previewImage, setPreviewImage] = useState<string | null>(initial.previewImage);
  const [body, setBody] = useState<ArticleBodyBlock[]>(initial.body);
  const [nextStepCta, setNextStepCta] = useState<ArticleNextStepCta>(initial.nextStepCta);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPublished = Boolean(initial.publishedAt);
  const canPublish = Boolean(previewImage) && complianceChecked;

  async function save(publish: boolean) {
    setStatus("saving");
    setErrorMessage(null);

    if (authorId === null) {
      setStatus("error");
      setErrorMessage("An author is required.");
      return;
    }

    const payload = {
      title,
      excerpt,
      categoryId,
      authorId,
      metaTitle,
      metaDescription,
      previewImage,
      body,
      nextStepCta,
      complianceChecked,
      publish,
    };

    try {
      const response = await fetch(
        articleId ? `/api/admin/articles/${articleId}` : "/api/admin/articles",
        {
          method: articleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data: { status: string; id?: number; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      router.push("/admin/articles");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div>
      {!previewImage && (
        <div className="border-brass-300 bg-brass-500/8 text-brass-500 mb-5 flex gap-2 rounded-sm border p-3 text-sm">
          <span aria-hidden>⚠</span>
          <span>A preview image is required before this article can be published.</span>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-5 rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border-border bg-card flex flex-col gap-5 rounded-md border p-6">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Select
                value={categoryId ? String(categoryId) : "none"}
                onValueChange={(value) => setCategoryId(value === "none" ? null : Number(value))}
                items={{
                  none: "No category",
                  ...Object.fromEntries(options.categories.map((c) => [String(c.id), c.name])),
                }}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {options.categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="author">Author</FieldLabel>
              <Select
                value={authorId ? String(authorId) : undefined}
                onValueChange={(value) => setAuthorId(Number(value))}
                items={Object.fromEntries(options.authors.map((a) => [String(a.id), a.name]))}
              >
                <SelectTrigger id="author" className="w-full">
                  <SelectValue placeholder="Select an author" />
                </SelectTrigger>
                <SelectContent>
                  {options.authors.map((author) => (
                    <SelectItem key={author.id} value={String(author.id)}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="excerpt">
              Excerpt{" "}
              <span className="text-muted-foreground font-normal">
                short teaser shown on article cards
              </span>
            </FieldLabel>
            <Textarea
              id="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metaTitle">
              Meta title{" "}
              <span className="text-muted-foreground font-normal">for search results</span>
            </FieldLabel>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metaDesc">
              Meta description{" "}
              <span className="text-muted-foreground font-normal">for search results</span>
            </FieldLabel>
            <Input
              id="metaDesc"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>
              Body{" "}
              <span className="text-muted-foreground font-normal">
                tables, pull-quotes, figures and lists supported
              </span>
            </FieldLabel>
            <BlockEditor blocks={body} onChange={setBody} />
          </Field>

          <div className="border-border border-t pt-5">
            <h3 className="mb-3 text-sm font-semibold">
              Next step{" "}
              <span className="text-muted-foreground font-normal">
                what a reader does after this article (FR-3.4 — never a generic &quot;contact
                us&quot;)
              </span>
            </h3>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="ctaHeading">Heading</FieldLabel>
                <Input
                  id="ctaHeading"
                  value={nextStepCta.heading}
                  onChange={(e) => setNextStepCta({ ...nextStepCta, heading: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ctaBody">Lead paragraph</FieldLabel>
                <Textarea
                  id="ctaBody"
                  rows={2}
                  value={nextStepCta.body}
                  onChange={(e) => setNextStepCta({ ...nextStepCta, body: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ctaLabel">Button label</FieldLabel>
                  <Input
                    id="ctaLabel"
                    value={nextStepCta.label}
                    onChange={(e) => setNextStepCta({ ...nextStepCta, label: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ctaHref">Link</FieldLabel>
                  <Input
                    id="ctaHref"
                    value={nextStepCta.href}
                    onChange={(e) => setNextStepCta({ ...nextStepCta, href: e.target.value })}
                    placeholder="/offers/financial-clarity"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="border-border bg-card rounded-md border p-5">
            <h3 className="mb-3 text-sm font-semibold">
              Preview image {!previewImage && <span className="text-accent">required</span>}
            </h3>
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-supplied preview of an interim base64/future R2 URL, same precedent as the public renderer.
              <img src={previewImage} alt="" className="mb-3 h-32 w-full rounded-sm object-cover" />
            ) : (
              <p className="text-muted-foreground mb-3 text-sm">No image set</p>
            )}
            <AdminImageUploadButton
              label={previewImage ? "Replace image" : "Upload an image"}
              onUploaded={setPreviewImage}
            />
          </div>

          <div className="border-border bg-card rounded-md border p-5">
            <h3 className="mb-3 text-sm font-semibold">Publishing</h3>
            <div className="mb-3">
              {isPublished ? (
                <Badge className="bg-pine-500 text-primary-foreground">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
            {initial.publishedAt && (
              <p className="text-muted-foreground mb-3 text-xs">
                Published{" "}
                {new Date(initial.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {initial.revisedAt &&
                  ` · Last revised ${new Date(initial.revisedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            )}
            <div className="flex items-start gap-2">
              <Checkbox
                id="claimsCheck"
                checked={complianceChecked}
                onCheckedChange={(checked) => setComplianceChecked(checked === true)}
                className="mt-0.5"
              />
              <FieldLabel htmlFor="claimsCheck" className="text-sm leading-snug font-normal">
                This complies with 10.05 Positioning and Claims Guidance Note
              </FieldLabel>
            </div>
          </div>
        </div>
      </div>

      <div className="border-border mt-6 flex flex-wrap gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={status === "saving"}
          onClick={() => save(false)}
        >
          Save draft
        </Button>
        <Button
          type="button"
          disabled={!canPublish || status === "saving"}
          title={
            !canPublish ? "Add a preview image, and confirm 10.05 compliance, first" : undefined
          }
          onClick={() => save(true)}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}
