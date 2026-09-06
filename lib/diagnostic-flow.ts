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

export interface DiagnosticScoreBand {
  label: string;
  /** Short, on-screen version — `/diagnostic/results` shows this, never `emailDetail`. */
  statement: string;
  /**
   * Fuller narrative, sent only in the "full written summary" email
   * (`lib/diagnostic-request-summary.ts`) — deliberately never rendered on the results
   * screen, so the on-screen result stays a teaser and the email is the genuinely fuller
   * follow-up it's advertised as.
   */
  emailDetail: string;
}

/**
 * The visitor-facing band a given overall score falls into (`app/diagnostic/results/
 * page.tsx`, T3.6/T7.7) — the band with the highest `minScore` not exceeding `score` (mirrors
 * the accepted mockup's own `BANDS.find(b => score >= b.min)`, `ui/mockups/c-diagnostic/
 * diagnostic-results.html`). Returns `null` only if no bands are configured at all (a
 * config gap, not a visitor-facing crash) — the caller renders without a band label rather
 * than throwing, since a missing band is far less severe than a missing dimension/question
 * (there's always a real score to show regardless).
 */
export async function getScoreBand(score: number): Promise<DiagnosticScoreBand | null> {
  const bands = await prisma.diagnosticScoreBand.findMany({ orderBy: { minScore: "desc" } });
  const band = bands.find((b) => score >= b.minScore);
  return band
    ? { label: band.label, statement: band.statement, emailDetail: band.emailDetail }
    : null;
}
