"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import type { MethodStage } from "@/lib/offers";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * `offer.method_stages` — an ordered `{title, description}[]` per offer (distinct from
 * `our-method-page.md`'s own fixed four `method_stage` rows), so unlike that page's editor
 * this one is a real add/remove/reorder list (CLAUDE.md's architecture constraint for this
 * task) — same add/move/remove mechanics as `legal-block-editor.tsx`, deliberately
 * duplicated in miniature rather than generalized for a two-field, non-`kind`-discriminated
 * shape.
 */
export function MethodStageListEditor({
  stages,
  onChange,
}: {
  stages: MethodStage[];
  onChange: (stages: MethodStage[]) => void;
}) {
  function update(index: number, field: keyof MethodStage, value: string) {
    onChange(stages.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }
  function remove(index: number) {
    onChange(stages.filter((_, i) => i !== index));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function add() {
    onChange([...stages, { title: "", description: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, index) => (
        <div key={index} className="border-border rounded-sm border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-[0.05em] uppercase">
              Stage {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move stage up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move stage down"
                disabled={index === stages.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove stage"
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              value={stage.title}
              onChange={(e) => update(index, "title", e.target.value)}
              placeholder="Stage title, e.g. Discover"
              aria-label={`Stage ${index + 1} title`}
            />
            <Textarea
              rows={2}
              value={stage.description}
              onChange={(e) => update(index, "description", e.target.value)}
              placeholder="What happens in this stage"
              aria-label={`Stage ${index + 1} description`}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus /> Add method stage
      </Button>
      {stages.length === 0 && (
        <FieldLabel className="text-muted-foreground text-xs font-normal">
          At least one method stage is required.
        </FieldLabel>
      )}
    </div>
  );
}
