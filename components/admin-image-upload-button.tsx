"use client";

import { useId, useState, type ChangeEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Thin client wrapper around `POST /api/admin/media` (T7.2's `lib/media-storage.ts`) —
 * deliberately placed under `components/`, not the Articles editor's own directory, since
 * `memory/technical-debt.md` already documents T7.5 (landing-page download file) and T7.6
 * (author photo) reusing this exact upload mechanism rather than building their own; keeping
 * it here means those tasks import this component directly instead of duplicating it.
 */
export function AdminImageUploadButton({
  onUploaded,
  label = "Upload an image",
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
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
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
        accept="image/jpeg,image/png,image/webp"
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
