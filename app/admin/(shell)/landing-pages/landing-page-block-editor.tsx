"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import type { LandingPageBodyBlock } from "@/lib/landing-pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BLOCK_LABELS: Record<LandingPageBodyBlock["kind"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  list: "Checklist",
  stats: "Stat row",
  steps: "Step row",
};

function emptyBlock(kind: LandingPageBodyBlock["kind"]): LandingPageBodyBlock {
  switch (kind) {
    case "heading":
      return { kind: "heading", text: "" };
    case "paragraph":
      return { kind: "paragraph", text: "" };
    case "list":
      return { kind: "list", items: [""] };
    case "stats":
      return { kind: "stats", items: [{ value: "", label: "" }] };
    case "steps":
      return { kind: "steps", items: [{ title: "", description: "" }] };
  }
}

/**
 * A structured block editor for `landing_page.body_content` — `LandingPageBodyBlock`'s own
 * `kind`-discriminated union (heading/paragraph/list/stats/steps, `lib/landing-pages.ts`),
 * covering exactly the block kinds the three accepted mockups use. Same add/move/remove
 * mechanics as `legal-block-editor.tsx` and T7.2's `block-editor.tsx`, deliberately
 * duplicated in miniature for this task's own smaller kind set rather than generalizing
 * either existing editor.
 */
export function LandingPageBlockEditor({
  blocks,
  onChange,
}: {
  blocks: LandingPageBodyBlock[];
  onChange: (blocks: LandingPageBodyBlock[]) => void;
}) {
  function updateBlock(index: number, block: LandingPageBodyBlock) {
    onChange(blocks.map((b, i) => (i === index ? block : b)));
  }
  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }
  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function addBlock(kind: LandingPageBodyBlock["kind"]) {
    onChange([...blocks, emptyBlock(kind)]);
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <div key={index} className="border-border rounded-sm border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-[0.05em] uppercase">
              {BLOCK_LABELS[block.kind]}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move block up"
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move block down"
                disabled={index === blocks.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove block"
                onClick={() => removeBlock(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <LandingPageBlockFields block={block} onChange={(next) => updateBlock(index, next)} />
        </div>
      ))}

      <Select
        value=""
        onValueChange={(value) => addBlock(value as LandingPageBodyBlock["kind"])}
        items={Object.fromEntries(
          (Object.keys(BLOCK_LABELS) as LandingPageBodyBlock["kind"][]).map((kind) => [
            kind,
            `Add ${BLOCK_LABELS[kind]}`,
          ]),
        )}
      >
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Add a block…" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(BLOCK_LABELS) as LandingPageBodyBlock["kind"][]).map((kind) => (
            <SelectItem key={kind} value={kind}>
              Add {BLOCK_LABELS[kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LandingPageBlockFields({
  block,
  onChange,
}: {
  block: LandingPageBodyBlock;
  onChange: (block: LandingPageBodyBlock) => void;
}) {
  switch (block.kind) {
    case "heading":
      return (
        <Input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Heading text"
        />
      );

    case "paragraph":
      return (
        <Textarea
          rows={2}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Paragraph text"
        />
      );

    case "list":
      return (
        <ListItemsFields items={block.items} onChange={(items) => onChange({ ...block, items })} />
      );

    case "stats":
      return (
        <StatsItemsFields items={block.items} onChange={(items) => onChange({ ...block, items })} />
      );

    case "steps":
      return (
        <StepsItemsFields items={block.items} onChange={(items) => onChange({ ...block, items })} />
      );
  }
}

function ListItemsFields({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => onChange(items.map((v, i) => (i === index ? e.target.value : v)))}
            placeholder="Checklist item"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...items, ""])}
      >
        <Plus /> Add item
      </Button>
    </div>
  );
}

function StatsItemsFields({
  items,
  onChange,
}: {
  items: { value: string; label: string }[];
  onChange: (items: { value: string; label: string }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item.value}
            onChange={(e) =>
              onChange(items.map((v, i) => (i === index ? { ...v, value: e.target.value } : v)))
            }
            placeholder="Value, e.g. 6 min"
            className="w-32 shrink-0"
          />
          <Input
            value={item.label}
            onChange={(e) =>
              onChange(items.map((v, i) => (i === index ? { ...v, label: e.target.value } : v)))
            }
            placeholder="Label"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove stat"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...items, { value: "", label: "" }])}
      >
        <Plus /> Add stat
      </Button>
    </div>
  );
}

function StepsItemsFields({
  items,
  onChange,
}: {
  items: { title: string; description: string }[];
  onChange: (items: { title: string; description: string }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="border-border flex flex-col gap-2 rounded-sm border p-3">
          <div className="flex gap-2">
            <Input
              value={item.title}
              onChange={(e) =>
                onChange(items.map((v, i) => (i === index ? { ...v, title: e.target.value } : v)))
              }
              placeholder="Step title"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove step"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
          <Textarea
            rows={2}
            value={item.description}
            onChange={(e) =>
              onChange(
                items.map((v, i) => (i === index ? { ...v, description: e.target.value } : v)),
              )
            }
            placeholder="Step description"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...items, { title: "", description: "" }])}
      >
        <Plus /> Add step
      </Button>
    </div>
  );
}
