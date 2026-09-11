import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 (ADR 0004) — provisioned 2026-09-11. R2 is S3-API-compatible, so the AWS SDK's
 * S3 client works against it directly by pointing `endpoint` at R2's own per-account URL
 * (`https://<account_id>.r2.cloudflarestorage.com`) instead of AWS. `region: "auto"` is R2's
 * own documented value — R2 doesn't have AWS-style regions, but the S3 SDK requires the field
 * to be present.
 *
 * One bucket does both jobs this project needs (see `memory/decision-log.md`): this client,
 * authenticated with a bucket-scoped Object-Read-&-Write API token, handles every write;
 * `CLOUDFLARE_R2_PUBLIC_URL` (the bucket's own R2.dev subdomain, enabled separately in the
 * bucket's own Settings > Public access) is what serves reads back to visitors — unrelated to
 * this client or its credentials.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — Cloudflare R2 is not configured. See CLAUDE.local.md.`);
  }
  return value;
}

let cachedClient: S3Client | undefined;

export function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const accountId = requireEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

export function getR2Bucket(): string {
  return requireEnv("CLOUDFLARE_R2_BUCKET");
}

/** The public URL a visitor's browser fetches an uploaded object from, given its object key. */
export function getR2PublicUrl(objectKey: string): string {
  const base = requireEnv("CLOUDFLARE_R2_PUBLIC_URL").replace(/\/$/, "");
  return `${base}/${objectKey}`;
}

/**
 * The inverse of `getR2PublicUrl` — recovers the object key from a URL this project itself
 * generated, so a caller holding only the stored `fileUrl`/`previewImage`/etc. can still issue
 * a `HeadObjectCommand` or `DeleteObjectCommand` against the right key. Returns `null` for a
 * URL that isn't under this project's own R2 public base (defensive — should never happen for
 * data written after this file existed, but guards against any pre-R2 value some other code
 * path might still hold).
 */
export function getR2ObjectKeyFromUrl(url: string): string | null {
  const base = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/`)) {
    return null;
  }
  return url.slice(base.length + 1);
}
