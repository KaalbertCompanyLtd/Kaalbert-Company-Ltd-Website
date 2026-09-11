import { cookies } from "next/headers";
import Link from "next/link";

import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getAuthorIdForAdminUser, getAuthorList } from "@/lib/admin-authors";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

/**
 * `ui/screen-inventory.md` #33a ("Team list"), inferred from #26's `AdminDataTable` pattern
 * — 5 rows today, no pagination needed. Resolves the signed-in partner's own `author` row
 * (if any) to mark it "(you)" — `content-management-admin.md`'s "the normal path is
 * self-service" — but every row links to the same editor regardless: no role-based
 * restriction gates opening someone else's entry (a deliberate call, not an oversight — see
 * `memory/decision-log.md`, T7.6).
 */
export default async function TeamListPage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const [authors, ownAuthorId] = await Promise.all([
    getAuthorList(),
    session ? getAuthorIdForAdminUser(session.adminUserId) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Team</h1>
        <p className="text-body text-muted-foreground mt-1">
          {authors.length} partner{authors.length === 1 ? "" : "s"}. Open your own entry to edit it
          yourself, or another partner&apos;s with the firm&apos;s own sign-off.
        </p>
      </div>

      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Practice area</TableHead>
              <TableHead>Public profile</TableHead>
              <TableHead>Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id}>
                <TableCell className="font-semibold">
                  <Link href={`/admin/team/${author.id}`} className="hover:underline">
                    {author.name}
                  </Link>
                  {author.id === ownAuthorId && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">(you)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{author.title}</TableCell>
                <TableCell className="text-muted-foreground">{author.practiceArea}</TableCell>
                <TableCell>
                  {author.published ? (
                    <Badge className="bg-pine-500 text-primary-foreground">Published</Badge>
                  ) : (
                    <Badge variant="outline">Not published</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {author.adminUserId === null ? (
                    <span className="text-muted-foreground text-xs">No login yet</span>
                  ) : author.adminUserActive ? (
                    <Badge className="bg-pine-500 text-primary-foreground">Active</Badge>
                  ) : (
                    <Badge variant="outline">Deactivated</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
