import Link from "next/link";

import { getAuthorIdForAdminUser, getAuthorList } from "@/lib/admin-authors";
import { getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminRole } from "@/generated/prisma/client";
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
 * self-service" — but every row links to the same editor regardless: opening someone else's
 * entry is always allowed, `[id]/page.tsx` itself decides read-only vs. editable (session 60
 * — see `memory/decision-log.md`, superseding T7.6's "no role gate at all").
 */
export default async function TeamListPage() {
  const currentUser = await getCurrentAdminUser();
  const [authors, ownAuthorId] = await Promise.all([
    getAuthorList(),
    currentUser ? getAuthorIdForAdminUser(currentUser.id) : Promise.resolve(null),
  ]);
  const viewerIsOwner = isOwner(currentUser);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">Team</h1>
          <p className="text-body text-muted-foreground mt-1">
            {authors.length} partner{authors.length === 1 ? "" : "s"}. Open your own entry to edit
            it yourself, or another partner&apos;s to view it.
          </p>
        </div>
        {viewerIsOwner && (
          <Link
            href="/admin/team/new"
            className="bg-primary text-primary-foreground hover:bg-pine-700 inline-flex w-fit shrink-0 items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Add partner
          </Link>
        )}
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
              <TableHead>Role</TableHead>
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
                <TableCell>
                  {author.adminUserRole === null ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : author.adminUserRole === AdminRole.OWNER ? (
                    <Badge className="bg-brass-500 text-primary">Owner</Badge>
                  ) : (
                    <Badge variant="outline">Partner</Badge>
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
