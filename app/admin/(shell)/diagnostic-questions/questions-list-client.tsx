"use client";

import { useState } from "react";
import Link from "next/link";

import type { DiagnosticQuestionListRow } from "@/lib/admin-diagnostic";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * `ui/mockups/g-admin-content/admin-diagnostic-questions-list.html`'s own real reorder-
 * button/toggle behaviour, rebuilt against the real API — including that mockup's own
 * inline validation UX (a toast naming the dimension when a deactivate attempt would leave
 * it with zero active questions), now enforced server-side too
 * (`lib/admin-diagnostic.ts`'s `setDiagnosticQuestionActive`) so this client-side guard is
 * a UX nicety, not the only thing standing between a partner and a broken scoring config.
 */
export function QuestionsListClient({
  initialQuestions,
}: {
  initialQuestions: DiagnosticQuestionListRow[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function activeCountFor(dimensionId: number, excludeId?: number) {
    return questions.filter((q) => q.dimensionId === dimensionId && q.active && q.id !== excludeId)
      .length;
  }

  async function toggleActive(question: DiagnosticQuestionListRow) {
    const nextActive = !question.active;
    if (!nextActive && activeCountFor(question.dimensionId, question.id) === 0) {
      setError(
        `Can't deactivate the last active question in "${question.dimensionName}" — every ` +
          "active dimension needs at least one active question.",
      );
      return;
    }

    setError(null);
    setBusyId(question.id);
    try {
      const response = await fetch(`/api/admin/diagnostic-questions/${question.id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setQuestions(questions.map((q) => (q.id === question.id ? { ...q, active: nextActive } : q)));
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(question: DiagnosticQuestionListRow, direction: "up" | "down") {
    setError(null);
    setBusyId(question.id);
    try {
      const response = await fetch(`/api/admin/diagnostic-questions/${question.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      // Swap the two adjacent rows' order values locally rather than a full refetch.
      const siblingIndex = questions.findIndex((q, i) => {
        if (q.dimensionId !== question.dimensionId) return false;
        const thisIndex = questions.findIndex((qq) => qq.id === question.id);
        return direction === "up" ? i === thisIndex - 1 : i === thisIndex + 1;
      });
      if (siblingIndex === -1) return;
      const thisIndex = questions.findIndex((q) => q.id === question.id);
      const next = [...questions];
      const thisOrder = next[thisIndex].order;
      next[thisIndex] = { ...next[thisIndex], order: next[siblingIndex].order };
      next[siblingIndex] = { ...next[siblingIndex], order: thisOrder };
      [next[thisIndex], next[siblingIndex]] = [next[siblingIndex], next[thisIndex]];
      setQuestions(next);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-sm border p-3 text-sm"
        >
          {error}
        </p>
      )}

      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Order</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Dimension</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question, index) => {
              const prevSameDim =
                index > 0 && questions[index - 1].dimensionId === question.dimensionId;
              const nextSameDim =
                index < questions.length - 1 &&
                questions[index + 1].dimensionId === question.dimensionId;
              return (
                <TableRow key={question.id} className={question.active ? "" : "opacity-50"}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={!prevSameDim || busyId === question.id}
                        onClick={() => move(question, "up")}
                        aria-label="Move up"
                        className="border-border bg-card text-muted-foreground h-[18px] w-[22px] rounded-[3px] border text-[0.625rem] leading-none disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={!nextSameDim || busyId === question.id}
                        onClick={() => move(question, "down")}
                        aria-label="Move down"
                        className="border-border bg-card text-muted-foreground h-[18px] w-[22px] rounded-[3px] border text-[0.625rem] leading-none disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[360px] whitespace-normal">
                    {question.promptText}
                    {question.isPlaceholder && (
                      <Badge variant="outline" className="ml-2">
                        Placeholder
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {question.dimensionName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase">
                    {question.responseType}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={question.active}
                      disabled={busyId === question.id}
                      onCheckedChange={() => toggleActive(question)}
                      aria-label={`${question.active ? "Deactivate" : "Activate"} question`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/diagnostic-questions/${question.id}`}
                      className="text-primary text-sm font-semibold hover:underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
