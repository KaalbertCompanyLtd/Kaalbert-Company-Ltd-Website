"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  DiagnosticChoiceOptionInput,
  DiagnosticDimensionOption,
  DiagnosticQuestionEditData,
} from "@/lib/admin-diagnostic";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ResponseType = "scale" | "boolean" | "choice";

/**
 * Shared by both the "New Question" and "Edit Question" screens. `dimensionId` and
 * `responseType` are only editable at creation — `lib/admin-diagnostic.ts`'s
 * `updateDiagnosticQuestion` doesn't accept either field, so the edit form renders them
 * read-only rather than silently letting a partner think a change would save (see that
 * file's doc-comment on `assertCanDeactivate` for why: reassigning either after creation
 * would silently corrupt scoring or orphan `choiceOptions`/submitted responses).
 */
export function QuestionEditorForm({
  mode,
  initial,
  dimensions,
}: {
  mode: "create" | "edit";
  initial: DiagnosticQuestionEditData;
  dimensions: DiagnosticDimensionOption[];
}) {
  const router = useRouter();
  const [dimensionId, setDimensionId] = useState(initial.dimensionId);
  const [responseType, setResponseType] = useState<ResponseType>(initial.responseType);
  const [promptText, setPromptText] = useState(initial.promptText);
  const [active, setActive] = useState(initial.active);
  const [isPlaceholder, setIsPlaceholder] = useState(initial.isPlaceholder);
  const [choiceOptions, setChoiceOptions] = useState<DiagnosticChoiceOptionInput[]>(
    initial.choiceOptions && initial.choiceOptions.length > 0
      ? initial.choiceOptions
      : [{ label: "", value: "" }],
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateOption(index: number, field: "label" | "value", value: string) {
    setChoiceOptions(
      choiceOptions.map((option, i) => (i === index ? { ...option, [field]: value } : option)),
    );
  }

  function addOption() {
    setChoiceOptions([...choiceOptions, { label: "", value: "" }]);
  }

  function removeOption(index: number) {
    setChoiceOptions(choiceOptions.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    const body =
      mode === "create"
        ? {
            dimensionId,
            promptText,
            responseType,
            choiceOptions: responseType === "choice" ? choiceOptions : null,
            isPlaceholder,
          }
        : {
            promptText,
            active,
            isPlaceholder,
            choiceOptions: responseType === "choice" ? choiceOptions : null,
          };

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/diagnostic-questions"
          : `/api/admin/diagnostic-questions/${initial.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data: { status: string; message?: string; id?: number } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("idle");
      router.push(
        mode === "create" && data.id
          ? `/admin/diagnostic-questions/${data.id}`
          : "/admin/diagnostic-questions",
      );
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-md border p-6">
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="questionDimension">Dimension</FieldLabel>
          {mode === "create" ? (
            <Select
              value={String(dimensionId)}
              onValueChange={(value) => setDimensionId(Number(value))}
              items={Object.fromEntries(dimensions.map((d) => [String(d.id), d.name]))}
            >
              <SelectTrigger id="questionDimension" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-body text-muted-foreground py-2">
              {initial.dimensionName} <span className="text-xs">— fixed after creation</span>
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="questionResponseType">Response type</FieldLabel>
          {mode === "create" ? (
            <Select
              value={responseType}
              onValueChange={(value) => setResponseType(value as ResponseType)}
              items={{ scale: "Scale (1–5)", boolean: "Yes / No", choice: "Choice" }}
            >
              <SelectTrigger id="questionResponseType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scale">Scale (1–5)</SelectItem>
                <SelectItem value="boolean">Yes / No</SelectItem>
                <SelectItem value="choice">Choice</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-body text-muted-foreground py-2 uppercase">
              {responseType} <span className="text-xs normal-case">— fixed after creation</span>
            </p>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="questionPrompt">Prompt text</FieldLabel>
        <Textarea
          id="questionPrompt"
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
        />
      </Field>

      {responseType === "choice" && (
        <div className="flex flex-col gap-3">
          <span className="text-body-sm text-primary font-semibold">
            Choice options{" "}
            <span className="text-muted-foreground font-normal">
              value is a number between 0 and 1, the same normalized scale every diagnostic answer
              submits in
            </span>
          </span>
          {choiceOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                aria-label={`Option ${index + 1} label`}
                placeholder="Label"
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
              />
              <Input
                aria-label={`Option ${index + 1} value`}
                placeholder="Value (0–1)"
                value={option.value}
                onChange={(e) => updateOption(index, "value", e.target.value)}
                className="max-w-[120px]"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={choiceOptions.length === 1}
                className="text-muted-foreground text-xs hover:underline disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addOption} className="w-fit">
            Add option
          </Button>
        </div>
      )}

      {mode === "edit" && (
        <Field>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Active" />
            <FieldLabel htmlFor="" className="!mb-0">
              Active
            </FieldLabel>
          </div>
        </Field>
      )}

      <Field>
        <div className="flex items-center gap-3">
          <Switch
            checked={isPlaceholder}
            onCheckedChange={setIsPlaceholder}
            aria-label="Placeholder content"
          />
          <FieldLabel htmlFor="" className="!mb-0">
            Placeholder content{" "}
            <span className="text-muted-foreground font-normal">
              flag this as draft/stand-in wording the firm still needs to confirm
            </span>
          </FieldLabel>
        </div>
      </Field>

      <Button type="button" disabled={status === "saving"} onClick={handleSave} className="w-fit">
        Save
      </Button>
    </div>
  );
}
