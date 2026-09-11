import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getDiagnosticDimensionOptions,
  getDiagnosticQuestionForEdit,
} from "@/lib/admin-diagnostic";
import { QuestionEditorForm } from "../question-editor-form";

export const dynamic = "force-dynamic";

export default async function EditDiagnosticQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const question = Number.isInteger(id) ? await getDiagnosticQuestionForEdit(id) : null;

  if (!question) {
    notFound();
  }

  const dimensions = await getDiagnosticDimensionOptions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Edit Question</h1>
        <Link href="/admin/diagnostic-questions" className="text-muted-foreground text-sm">
          ← Back to Diagnostic Questions
        </Link>
      </div>

      <QuestionEditorForm mode="edit" initial={question} dimensions={dimensions} />
    </div>
  );
}
