import Link from "next/link";

import { getDiagnosticQuestionList } from "@/lib/admin-diagnostic";
import { QuestionsListClient } from "./questions-list-client";

export const dynamic = "force-dynamic";

export default async function DiagnosticQuestionsPage() {
  const questions = await getDiagnosticQuestionList();
  const dimensionCount = new Set(questions.map((q) => q.dimensionId)).size;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">Diagnostic Questions</h1>
          <p className="text-body text-muted-foreground mt-1">
            {questions.length} question{questions.length === 1 ? "" : "s"} across {dimensionCount}{" "}
            dimension{dimensionCount === 1 ? "" : "s"} ·{" "}
            <Link href="/admin/diagnostic-configuration" className="text-primary font-semibold">
              Edit dimension weights &amp; thresholds →
            </Link>
          </p>
        </div>
        <Link
          href="/admin/diagnostic-questions/new"
          className="bg-primary text-primary-foreground hover:bg-pine-700 inline-flex w-fit items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          New Question
        </Link>
      </div>

      <QuestionsListClient initialQuestions={questions} />
    </div>
  );
}
