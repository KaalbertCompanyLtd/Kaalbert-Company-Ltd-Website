import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthorForEdit } from "@/lib/admin-authors";
import { canEditAuthorProfile, getCurrentAdminUser, isOwner } from "@/lib/auth/current-user";
import { AdminUserActionsPanel } from "./admin-user-actions-panel";
import { AuthorEditorForm } from "./author-editor-form";

export const dynamic = "force-dynamic";

export default async function TeamMemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [author, currentUser] = await Promise.all([
    Number.isInteger(id) ? getAuthorForEdit(id) : Promise.resolve(null),
    getCurrentAdminUser(),
  ]);

  if (!author) {
    notFound();
  }

  const canEdit = canEditAuthorProfile(currentUser, author.id);
  const viewerIsOwner = isOwner(currentUser);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">{author.name}</h1>
        <Link href="/admin/team" className="text-muted-foreground text-sm">
          ← Back to Team
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <AuthorEditorForm initial={author} readOnly={!canEdit} />
        {viewerIsOwner && author.adminUser && (
          <AdminUserActionsPanel adminUser={author.adminUser} />
        )}
      </div>
    </div>
  );
}
