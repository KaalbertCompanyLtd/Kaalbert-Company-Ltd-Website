/**
 * Client-safe `AdminRole` values/labels — deliberately its own file, zero import of
 * `@/lib/prisma` or `@/generated/prisma/client` (which pulls in the same server-only engine
 * code, including Node built-ins Turbopack's client chunking can't bundle), so a "use client"
 * component can import a *value*, not just a type, for this enum. Mirrors
 * `lib/enquiry-list-options.ts`'s precedent for this exact problem — hit for real at session
 * 60 (`git blame`/`memory/known-bugs.md`): every client component that imported `AdminRole`
 * directly from `@/generated/prisma/client` (the Role select on the Team editor, the invite
 * form, the account menu) broke `/admin`'s entire compile with Turbopack's own generic
 * "the chunking context (unknown) does not support external modules (request: node:module)"
 * panic — no error naming `AdminRole` or any of these files, the same misleading-failure shape
 * CLAUDE.md already documents for the `@/lib/prisma`-chain version of this bug.
 */

export type AdminRoleValue = "OWNER" | "PARTNER";

export const ADMIN_ROLE_LABELS: Record<AdminRoleValue, string> = {
  OWNER: "Owner",
  PARTNER: "Partner",
};

export const ADMIN_ROLE_OPTIONS: ReadonlyArray<{ value: AdminRoleValue; label: string }> = [
  { value: "OWNER", label: "Owner" },
  { value: "PARTNER", label: "Partner" },
];
