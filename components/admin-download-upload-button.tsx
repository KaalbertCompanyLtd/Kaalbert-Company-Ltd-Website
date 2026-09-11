"use client";

import { useId, useState, type ChangeEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Sibling to `AdminImageUploadButton` for a non-image download — `LandingPage.
 * downloadFileUrl` (T7.5), posted to `POST /api/admin/media/downloads` instead of the
 * image-only `POST /api/admin/media`. Kept as its own small component rather than
 * generalizing `AdminImageUploadButton` with an `accept`/`endpoint` prop — same "small,
 * deliberate duplication over a one-time-reuse refactor" precedent T7.3's
 * `LegalBlockEditor` already set against T7.2's `block-editor.tsx`.
 */
export function AdminDownloadUploadButton({
  onUploaded,
  label = "Upload a PDF",
  className,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media/downloads", {
        method: "POST",
        body: formData,
      });
      const data: { status: string; url?: string; message?: string } = await response.json();

      if (!response.ok || !data.url) {
        setError(data.message ?? "Upload failed — please try again.");
        return;
      }
      onUploaded(data.url);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        type="file"
        id={inputId}
        accept="application/pdf"
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "text-primary cursor-pointer text-sm font-semibold hover:underline",
          uploading && "text-muted-foreground pointer-events-none",
        )}
      >
        {uploading ? "Uploading…" : label}
      </label>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}
