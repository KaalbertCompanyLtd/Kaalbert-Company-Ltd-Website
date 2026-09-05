import { prisma } from "@/lib/prisma";

/**
 * Resolves the shared generic `page` entity (`prisma/schema.prisma`'s `Page` model) by slug —
 * used by any marketing page whose own copy has no other entity to attach to (capabilities,
 * our-method — see CLAUDE.md's Recurring Patterns). Throws rather than falling back to
 * placeholder copy if the row is missing, since a missing page row is a seed/migration bug,
 * not a real "no content yet" state a visitor should ever see (same reasoning as
 * `lib/home.ts`'s `getHomePageContent`).
 */
export async function getPageBySlug(slug: string) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    throw new Error(
      `page has no row for slug "${slug}" — run \`npm run db:seed\` (see prisma/seed.ts).`,
    );
  }
  return page;
}
