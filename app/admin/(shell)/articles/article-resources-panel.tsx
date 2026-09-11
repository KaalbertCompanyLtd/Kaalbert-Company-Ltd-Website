"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import type { ArticleResourceRow } from "@/lib/admin-article-resources";
import { AdminDownloadUploadButton } from "@/components/admin-download-upload-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * The article editor's downloadable-resource panel (T7.10) — only rendered for an existing
 * article (`ArticleResource.articleId` is a required FK, so a row can't exist before the
 * article itself does; `article-editor-form.tsx` gates this on `articleId` being set). Each
 * action (add/reorder/remove) hits its own API route immediately, independent of the rest of
 * the editor's "Save draft"/"Publish" flow — same self-contained-widget pattern as
 * `app/admin/(shell)/articles/categories/categories-client.tsx`'s add/rename/retire, not the
 * in-memory-array-saved-together pattern `block-editor.tsx` uses for `Article.body` (that
 * column is one JSON blob; `article_resource` is a real child table with its own rows).
 */
export function ArticleResourcesPanel({
  articleId,
  initial,
}: {
  articleId: number;
  initial: ArticleResourceRow[];
}) {
  const [resources, setResources] = useState(initial);
  const [newLabel, setNewLabel] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleUploaded(fileUrl: string) {
    setAddError(null);
    const response = await fetch(`/api/admin/articles/${articleId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, fileUrl }),
    });
    const data: { status: string; resource?: ArticleResourceRow; message?: string } =
      await response.json();

    if (!response.ok || !data.resource) {
      setAddError(data.message ?? "Something went wrong — please try again.");
      return;
    }
    setResources([...resources, data.resource]);
    setNewLabel("");
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= resources.length) return;

    const resource = resources[index];
    setBusyId(resource.id);
    try {
      await fetch(`/api/admin/articles/resources/${resource.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: direction === -1 ? "up" : "down" }),
      });
      const next = [...resources];
      [next[index], next[target]] = [next[target], next[index]];
      setResources(next);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: number) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/articles/resources/${id}`, { method: "DELETE" });
      setResources(resources.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="border-border bg-card rounded-md border p-5">
      <h3 className="mb-3 text-sm font-semibold">Downloadable resources</h3>

      {resources.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              className="border-border flex items-center justify-between gap-2 rounded-sm border p-2.5"
            >
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener"
                className="text-primary min-w-0 flex-1 truncate text-sm font-semibold hover:underline"
              >
                {resource.label}
              </a>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move resource up"
                  disabled={index === 0 || busyId === resource.id}
                  onClick={() => handleMove(index, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move resource down"
                  disabled={index === resources.length - 1 || busyId === resource.id}
                  onClick={() => handleMove(index, 1)}
                >
                  <ChevronDown />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove resource"
                        disabled={busyId === resource.id}
                      />
                    }
                  >
                    <Trash2 />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove &quot;{resource.label}&quot;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes its download link from the public article page immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemove(resource.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Field className="mb-2">
        <FieldLabel htmlFor="newResourceLabel">Label</FieldLabel>
        <Input
          id="newResourceLabel"
          value={newLabel}
          onChange={(e) => {
            setNewLabel(e.target.value);
            setAddError(null);
          }}
          placeholder="e.g. Funding-Readiness Checklist"
        />
      </Field>
      {newLabel.trim() ? (
        <AdminDownloadUploadButton label="Upload a PDF" onUploaded={handleUploaded} />
      ) : (
        <p className="text-muted-foreground text-xs">Enter a label first, then upload the file.</p>
      )}
      {addError && <p className="text-destructive mt-1 text-xs">{addError}</p>}
    </div>
  );
}
