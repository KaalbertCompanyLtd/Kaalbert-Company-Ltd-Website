import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getR2Bucket, getR2Client, getR2PublicUrl } from "@/lib/r2-client";

/**
 * Cloudflare R2 (ADR 0004) — provisioned 2026-09-11, replacing the interim base64 `data:` URI
 * mechanism this file used from T7.2 through T7.10 (see `memory/technical-debt.md`'s now-
 * resolved "Article/author image uploads use an interim base64 data-URI store" entry for the
 * full history of why that interim approach existed and what it cost). No caller, no schema
 * field, and no public-rendering code changed for this swap — every existing consumer
 * (`components/insights-article-card.tsx`'s `previewImage`, the `figure` block renderer,
 * `components/landing-page-cta.tsx`'s `downloadFileUrl`, `ResourceLink`'s `fileUrl`) already
 * treated this column as an opaque URL string; it's simply a real `https://` URL now instead
 * of a `data:` one.
 *
 * No existing rows held base64 data to backfill at the time R2 was provisioned — confirmed by
 * querying every table this file's output ever lands in (`Article.previewImage`, a `figure`
 * block's `imageUrl`, `Author.photoUrl`, `LandingPage.downloadFileUrl`, `ArticleResource.
 * fileUrl`) before writing this file; every one was still `null`/empty or already real. No
 * backfill migration was needed.
 */

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB — an app-level limit now, not a base64-storage constraint
const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class MediaValidationError extends Error {}

export interface ImageUploadInput {
  buffer: Buffer;
  contentType: string;
}

async function putObject(input: {
  buffer: Buffer;
  contentType: string;
  keyPrefix: string;
  extension: string;
}): Promise<string> {
  const key = `${input.keyPrefix}/${randomUUID()}.${input.extension}`;
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
    }),
  );
  return getR2PublicUrl(key);
}

/**
 * Validates and uploads an image to R2, returning its real public URL, usable directly in an
 * `<img src>`. Called from `POST /api/admin/media`, never directly from a `"use client"`
 * component (this file, and `@/lib/r2-client`, import no `@/lib/prisma`, so it would be safe
 * to either way, but file/Buffer/network handling belongs server-side regardless).
 */
export async function encodeImageUpload({
  buffer,
  contentType,
}: ImageUploadInput): Promise<string> {
  const extension = ACCEPTED_IMAGE_TYPES[contentType];
  if (!extension) {
    throw new MediaValidationError("Only JPEG, PNG, or WebP images are accepted.");
  }
  if (buffer.byteLength === 0) {
    throw new MediaValidationError("The uploaded file is empty.");
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new MediaValidationError("Images must be 2MB or smaller.");
  }

  return putObject({ buffer, contentType, keyPrefix: "images", extension });
}

const MAX_DOWNLOAD_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — PDFs run larger than a JPEG/PNG/WebP preview image
const ACCEPTED_DOWNLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
};

export interface DownloadFileUploadInput {
  buffer: Buffer;
  contentType: string;
}

/**
 * Sibling to `encodeImageUpload` for a real, non-image download — `LandingPage.
 * downloadFileUrl` (T7.5), `ArticleResource.fileUrl` (T7.10). A separate, smaller function
 * rather than widening `encodeImageUpload`'s own accepted-type set: every existing caller of
 * that function (article preview images, figure blocks) genuinely renders its result in an
 * `<img src>` — conflating the two would let a PDF silently end up there.
 */
export async function encodeDownloadFileUpload({
  buffer,
  contentType,
}: DownloadFileUploadInput): Promise<string> {
  const extension = ACCEPTED_DOWNLOAD_TYPES[contentType];
  if (!extension) {
    throw new MediaValidationError("Only PDF files are accepted for a download.");
  }
  if (buffer.byteLength === 0) {
    throw new MediaValidationError("The uploaded file is empty.");
  }
  if (buffer.byteLength > MAX_DOWNLOAD_UPLOAD_BYTES) {
    throw new MediaValidationError("Downloadable files must be 5MB or smaller.");
  }

  return putObject({ buffer, contentType, keyPrefix: "downloads", extension });
}
