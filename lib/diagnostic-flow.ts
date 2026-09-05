import { prisma } from "@/lib/prisma";
import type { DiagnosticFlowQuestion } from "@/lib/diagnostic-flow-options";

export type { DiagnosticFlowQuestion };

/**
 * Every active dimension's active questions, flattened into one ordered sequence (dimension
 * `id` order, then question `order` within it) — matches the accepted mockup's own flat
 * `QUESTIONS` array exactly (`ui/mockups/c-diagnostic/diagnostic-flow.html`). Reads live so a
 * future admin edit (Milestone 7, T7.7) takes effect on the next page load, never a
 * hard-coded question list (ADR 0005).
 *
 * Server-only (imports `@/lib/prisma`) — deliberately kept in its own file from
 * `lib/diagnostic-flow-options.ts`'s client-safe types/constants, so
 * `components/diagnostic-flow.tsx` ("use client") never pulls Prisma's driver-adapter code
 * into the browser bundle (it broke Turbopack's dev compile outright, silently, the first
 * time this task combined them in one file — see memory/known-bugs.md).
 */
export async function getActiveDiagnosticFlow(): Promise<DiagnosticFlowQuestion[]> {
  const dimensions = await prisma.diagnosticDimension.findMany({
    orderBy: { id: "asc" },
    include: {
      questions: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return dimensions.flatMap((dimension) =>
    dimension.questions.map((question) => ({
      id: question.id,
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      order: question.order,
      promptText: question.promptText,
      responseType: question.responseType,
    })),
  );
}

/**
 * The live active-question count alone — for any surface across the site that states how
 * many questions the diagnostic has (e.g. the home page's "N questions" fact) without
 * needing the full question set `getActiveDiagnosticFlow` returns. A plain `count()` rather
 * than fetching every row, since only the number is ever used. Never hard-code this number
 * anywhere on the site — every mention must read it live, the same way `/diagnostic` itself
 * does, so a future admin edit to the question set (Milestone 7, T7.7) is reflected
 * everywhere at once.
 */
export async function getActiveDiagnosticQuestionCount(): Promise<number> {
  return prisma.diagnosticQuestion.count({ where: { active: true } });
}
