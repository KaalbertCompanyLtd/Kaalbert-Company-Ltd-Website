import { prisma } from "@/lib/prisma";

/**
 * The `firm_statement` singleton row (founding statement, values, standard — see
 * prisma/schema.prisma's `FirmStatement` doc-comment). Throws rather than falling back to
 * placeholder copy if the row is missing, same reasoning as `lib/pages.ts`'s
 * `getPageBySlug`: a missing singleton row is a seed/migration bug, not a real "no content
 * yet" state a visitor should ever see.
 */
export async function getFirmStatement() {
  const statement = await prisma.firmStatement.findUnique({ where: { id: 1 } });
  if (!statement) {
    throw new Error(`firm_statement has no row — run \`npm run db:seed\` (see prisma/seed.ts).`);
  }
  return statement;
}

/**
 * All published `author` rows, ordered by `order` ascending. The first entry is the page's
 * single featured "Lead Partner" card; the rest render in the grid below it (see
 * prisma/schema.prisma's `Author` doc-comment and app/about/page.tsx).
 */
export async function getAuthors() {
  return prisma.author.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
}

/**
 * First-and-second-word initials for the avatar fallback shown when `photoUrl` is null
 * (e.g. "Albert Kwakye Amponsah" → "AK") — matches ui/mockups/a-public-site/about.html's own
 * avatar-initial convention exactly.
 */
export function getInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}
