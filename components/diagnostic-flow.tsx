"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DIAGNOSTIC_BOOLEAN_OPTIONS,
  DIAGNOSTIC_SCALE_OPTIONS,
  getChoiceOptions,
  type DiagnosticChoiceOption,
  type DiagnosticFlowQuestion,
} from "@/lib/diagnostic-flow-options";
import { pushDataLayerEvent } from "@/lib/data-layer";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-6 py-3 text-body font-semibold text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

export interface DiagnosticFlowProps {
  questions: DiagnosticFlowQuestion[];
}

interface DiagnosticSubmitResponse {
  enquiry_id: number;
}

function optionsFor(question: DiagnosticFlowQuestion): DiagnosticChoiceOption[] {
  switch (question.responseType) {
    case "boolean":
      return DIAGNOSTIC_BOOLEAN_OPTIONS;
    case "scale":
      return DIAGNOSTIC_SCALE_OPTIONS;
    case "choice":
      return getChoiceOptions(question.dimensionId, question.order);
  }
}

/**
 * `/diagnostic`'s multi-step client flow (T3.4, `ui/mockups/c-diagnostic/diagnostic-flow.html`)
 * — collects answers in client state only, one step per question, no full page reload, and
 * POSTs the complete response set on the final step. Deliberately does NOT compute a score
 * client-side (the mockup's own `scoreAndFinish()` is a UI preview only, not this project's
 * real scoring path) — the real score is always computed server-side by
 * `lib/diagnostic-scoring.ts`, called from `POST /api/diagnostic/submit` (T3.5), never
 * duplicated here (CLAUDE.md: business logic lives in `lib/`, not client components).
 *
 * Every answer submitted is a numeric string pre-normalized to 0–1, uniformly across
 * `scale`/`boolean`/`choice` — decided at T3.2, mirrored here via
 * `lib/diagnostic-flow-options.ts`'s option value tables (which carry the same values
 * `prisma/seed.ts`'s comments document for each `choice` question). That file is
 * deliberately separate from `lib/diagnostic-flow.ts` (the DB-querying half) — importing
 * Prisma-touching code into this client component broke Turbopack's dev compile outright,
 * silently, the first time this task combined them in one file (memory/known-bugs.md).
 */
export function DiagnosticFlow({ questions }: DiagnosticFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"answering" | "submitting" | "error">("answering");
  const hasFiredStartedEvent = useRef(false);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[question.id];
  const options = optionsFor(question);

  function handleAnswer(value: string) {
    // Fires on the visitor's first interaction, not on page load — abandoning before
    // answering anything creates no event and no `enquiry_record` (the documented edge case).
    if (!hasFiredStartedEvent.current) {
      hasFiredStartedEvent.current = true;
      pushDataLayerEvent("diagnostic_started");
    }
    setStatus("answering");
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
  }

  function handleBack() {
    setStatus("answering");
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  async function handleNext() {
    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questions.map((q) => ({ question_id: q.id, answer: answers[q.id] }))),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data: DiagnosticSubmitResponse = await response.json();
      router.push(`/diagnostic/results?enquiry_id=${data.enquiry_id}`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <div className="mx-auto mb-10 max-w-[640px]">
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-300 ease-in-out"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-caption text-muted-foreground mt-2 text-center font-semibold">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      <div className="border-border bg-card mx-auto max-w-[640px] rounded-md border p-6 sm:p-10">
        <span className="text-caption text-accent mb-2.5 block font-semibold tracking-[0.06em] uppercase">
          {question.dimensionName}
        </span>
        <h2 className="font-display text-primary text-h4 mb-7 font-bold">{question.promptText}</h2>

        <RadioGroup
          value={currentAnswer ?? ""}
          onValueChange={handleAnswer}
          className={
            question.responseType === "choice"
              ? "flex w-full flex-col gap-2"
              : `grid w-full gap-2 ${question.responseType === "scale" ? "grid-cols-5" : "grid-cols-2"}`
          }
        >
          {options.map((option) => (
            <FieldLabel
              key={option.value}
              className={
                question.responseType === "choice"
                  ? "border-border bg-card has-data-checked:border-accent has-data-checked:bg-muted w-full min-w-0 cursor-pointer justify-start gap-2 rounded-sm border px-3 py-3 text-left sm:px-4 sm:py-3.5"
                  : "border-border bg-card has-data-checked:border-accent has-data-checked:bg-muted w-full min-w-0 cursor-pointer justify-center gap-1.5 rounded-sm border px-1 py-3 text-center sm:px-3 sm:py-3.5"
              }
            >
              <RadioGroupItem value={option.value} />
              <span className="text-body min-w-0 truncate font-semibold">{option.label}</span>
            </FieldLabel>
          ))}
        </RadioGroup>

        {question.responseType === "scale" && (
          <div className="text-caption text-muted-foreground mt-2 flex justify-between">
            <span>Not at all</span>
            <span>Completely</span>
          </div>
        )}
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="text-destructive text-body mx-auto mt-4 max-w-[640px] text-center"
        >
          Something went wrong sending your answers — please try again.
        </p>
      )}

      <div className="mx-auto mt-8 flex max-w-[640px] items-center justify-between">
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          Back
        </button>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={handleNext}
          disabled={currentAnswer === undefined || status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : isLastQuestion ? "See your result" : "Next"}
        </button>
      </div>
    </div>
  );
}
