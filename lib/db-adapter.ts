import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Builds the Prisma 7 driver adapter for `DATABASE_URL`. Shared by `lib/prisma.ts` (the
 * Next.js app's client singleton) and `prisma/seed.ts` (a standalone script) so the fix below
 * lives in exactly one place.
 *
 * Railway's public TCP proxy (the local/dev `DATABASE_URL`, per CLAUDE.local.md — the
 * deployed app instead uses Railway's private network) terminates TLS with a self-signed
 * certificate. `pg`'s current connection-string parsing treats a bare `sslmode=require` as an
 * alias for `verify-full` (full chain verification) rather than "encrypt, don't verify" —
 * that fails outright against a self-signed cert, and an explicit `ssl: { rejectUnauthorized:
 * false }` alongside it does not override it, since the URL's own `sslmode` wins. Stripping
 * `sslmode` from the URL and setting the desired behaviour only via the explicit `ssl` object
 * is the fix confirmed against the real Railway proxy. Railway is this project's sole,
 * non-portable hosting target (ADR 0003/0008), so this isn't a portability compromise.
 */
export function createDatabaseAdapter(connectionString: string | undefined): PrismaPg {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");

  return new PrismaPg({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  });
}
