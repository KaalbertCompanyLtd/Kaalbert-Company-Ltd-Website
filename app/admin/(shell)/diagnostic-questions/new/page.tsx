import Link from "next/link";

import { getDiagnosticDimensionOptions } from "@/lib/admin-diagnostic";
import { QuestionEditorForm } from "../question-editor-form";

export const dynamic = "force-dynamic";

export default async function NewDiagnosticQuestionPage() {
  const dimensions = await getDiagnosticDimensionOptions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">New Question</h1>
        <Link href="/admin/diagnostic-questions" className="text-muted-foreground text-sm">
          ← Back to Diagnostic Questions
        </Link>
      </div>

      <QuestionEditorForm
        mode="create"
        dimensions={dimensions}
        initial={{
          id: 0,
          promptText: "",
          dimensionId: dimensions[0]?.id ?? 0,
          dimensionName: dimensions[0]?.name ?? "",
          order: 0,
          responseType: "scale",
          choiceOptions: null,
          active: true,
          isPlaceholder: false,
        }}
      />
    </div>
  );
}
