/**
 * The single swap-in point for Cloudflare R2 (ADR 0004 — "object storage... added once media
 * volume justifies it", not provisioned yet as of T7.2; confirmed via `CLAUDE.local.md`'s
 * Credentials section, `CLOUDFLARE_R2_*` still unfilled). This is the first task to actually
 * need image storage (an article's required preview image, and the new `figure` body block),
 * so it establishes the interim mechanism T7.5/T7.6 are already documented to reuse
 * (`memory/technical-debt.md`).
 *
 * Deliberately NOT writing to local disk as the interim store, even though
 * `memory/technical-debt.md`'s T7.5 entry floated "a stubbed/local path" as the general
 * pattern (mirroring T1.6's placeholder GTM container ID): Railway's container filesystem is
 * not durable across deploys (no Railway Volume is provisioned or documented anywhere in this
 * project), so a file written to disk today would silently vanish on the next deploy — a real
 * data-loss bug, not a faithful stub. Encoding the upload as a base64 `data:` URI and storing
 * it directly in the same Postgres column a real object-storage URL would occupy (`Article.
 * previewImage`, an `ArticleBodyBlock`'s `imageUrl`) is durable today with zero new
 * infrastructure, and every call site already treats this column as "just a string URL" — see
 * `components/insights-article-card.tsx`'s `previewImage` and this task's own `figure` block
 * rendering, both already using a plain `<img src>`, which renders a `data:` URI identically
 * to a real one. Swapping to real R2 later only ever means changing `encodeImageUpload`'s
 * body to a real upload call — no caller, no schema field, and no rendering code changes.
 *
 * The `MAX_UPLOAD_BYTES` cap exists specifically because base64 inflates payload size ~33%
 * and this interim storage lives inside Postgres rows/JSON columns, not blob storage — a
 * limit real R2 storage won't need this tightly, but is a correct, cheap guard today.
 */

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB, pre-encoding
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class MediaValidationError extends Error {}

export interface ImageUploadInput {
  buffer: Buffer;
  contentType: string;
}

/**
 * Validates and encodes an uploaded image, returning a URL usable directly in an `<img src>`
 * — a `data:` URI today (see this file's own doc-comment), a real object-storage URL once R2
 * replaces this function's body. Called from `POST /api/admin/media`, never directly from a
 * `"use client"` component (this file has no `@/lib/prisma` import, so it would be safe to,
 * but file/Buffer handling belongs server-side regardless).
 */
export function encodeImageUpload({ buffer, contentType }: ImageUploadInput): string {
  if (!ACCEPTED_IMAGE_TYPES.has(contentType)) {
    throw new MediaValidationError("Only JPEG, PNG, or WebP images are accepted.");
  }
  if (buffer.byteLength === 0) {
    throw new MediaValidationError("The uploaded file is empty.");
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new MediaValidationError("Images must be 2MB or smaller.");
  }

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
