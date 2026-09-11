import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthorForEdit } from "@/lib/admin-authors";
import { AdminUserActionsPanel } from "./admin-user-actions-panel";
import { AuthorEditorForm } from "./author-editor-form";

export const dynamic = "force-dynamic";

export default async function TeamMemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const author = Number.isInteger(id) ? await getAuthorForEdit(id) : null;

  if (!author) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">{author.name}</h1>
        <Link href="/admin/team" className="text-muted-foreground text-sm">
          ← Back to Team
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <AuthorEditorForm initial={author} />
        {author.adminUser && <AdminUserActionsPanel adminUser={author.adminUser} />}
      </div>
    </div>
  );
}
