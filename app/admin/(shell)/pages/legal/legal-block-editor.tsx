"use client";

import { Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

import type { LegalPageBlock } from "@/lib/legal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BLOCK_LABELS: Record<LegalPageBlock["kind"], string> = {
  statement: "Statement box",
  prose: "Prose paragraph",
  pending: "Pending note",
  table: "Table",
};

function emptyBlock(kind: LegalPageBlock["kind"]): LegalPageBlock {
  switch (kind) {
    case "statement":
      return { kind: "statement", text: "" };
    case "prose":
      return { kind: "prose", heading: "", text: "" };
    case "pending":
      return { kind: "pending", heading: "", text: "" };
    case "table":
      return { kind: "table", headers: ["", ""], rows: [["", ""]] };
  }
}

/**
 * A structured block editor for `legal_page.body` — `LegalPageBlock`'s own `kind`-
 * discriminated union (statement/prose/pending/table, `lib/legal.ts`), a different, smaller
 * kind set from T7.2's `ArticleBodyBlock`. Built as its own small component rather than
 * generalizing T7.2's `block-editor.tsx` to a shared block-kind set — kept this task
 * self-contained rather than risking a refactor of already-verified article-editor code for
 * a one-time reuse; same add/move/remove mechanics, deliberately duplicated in miniature.
 */
export function LegalBlockEditor({
  blocks,
  onChange,
}: {
  blocks: LegalPageBlock[];
  onChange: (blocks: LegalPageBlock[]) => void;
}) {
  function updateBlock(index: number, block: LegalPageBlock) {
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
  function addBlock(kind: LegalPageBlock["kind"]) {
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
          <LegalBlockFields block={block} onChange={(next) => updateBlock(index, next)} />
        </div>
      ))}

      <Select
        value=""
        onValueChange={(value) => addBlock(value as LegalPageBlock["kind"])}
        items={Object.fromEntries(
          (Object.keys(BLOCK_LABELS) as LegalPageBlock["kind"][]).map((kind) => [
            kind,
            `Add ${BLOCK_LABELS[kind]}`,
          ]),
        )}
      >
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Add a block…" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(BLOCK_LABELS) as LegalPageBlock["kind"][]).map((kind) => (
            <SelectItem key={kind} value={kind}>
              Add {BLOCK_LABELS[kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LegalBlockFields({
  block,
  onChange,
}: {
  block: LegalPageBlock;
  onChange: (block: LegalPageBlock) => void;
}) {
  switch (block.kind) {
    case "statement":
      return (
        <Textarea
          rows={2}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Statement text"
        />
      );

    case "prose":
      return (
        <div className="flex flex-col gap-3">
          <Input
            value={block.heading ?? ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value || undefined })}
            placeholder="Heading (optional)"
          />
          <Textarea
            rows={3}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Paragraph text"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`muted-${block.text.slice(0, 8)}`}
              checked={block.variant === "muted"}
              onCheckedChange={(checked) =>
                onChange({ ...block, variant: checked === true ? "muted" : undefined })
              }
            />
            <FieldLabel htmlFor={`muted-${block.text.slice(0, 8)}`} className="text-sm font-normal">
              Muted/smaller styling
            </FieldLabel>
          </div>
        </div>
      );

    case "pending":
      return (
        <div className="flex flex-col gap-3">
          <Input
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Heading"
          />
          <Textarea
            rows={2}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Pending note text"
          />
        </div>
      );

    case "table":
      return (
        <LegalTableFields
          heading={block.heading}
          headers={block.headers}
          rows={block.rows}
          onChange={(heading, headers, rows) => onChange({ ...block, heading, headers, rows })}
        />
      );
  }
}

function LegalTableFields({
  heading,
  headers,
  rows,
  onChange,
}: {
  heading?: string;
  headers: string[];
  rows: string[][];
  onChange: (heading: string | undefined, headers: string[], rows: string[][]) => void;
}) {
  function setHeader(index: number, value: string) {
    onChange(
      heading,
      headers.map((h, i) => (i === index ? value : h)),
      rows,
    );
  }
  function addColumn() {
    onChange(
      heading,
      [...headers, ""],
      rows.map((row) => [...row, ""]),
    );
  }
  function removeColumn(index: number) {
    onChange(
      heading,
      headers.filter((_, i) => i !== index),
      rows.map((row) => row.filter((_, i) => i !== index)),
    );
  }
  function setCell(rowIndex: number, colIndex: number, value: string) {
    onChange(
      heading,
      headers,
      rows.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
      ),
    );
  }
  function addRow() {
    onChange(heading, headers, [...rows, headers.map(() => "")]);
  }
  function removeRow(index: number) {
    onChange(
      heading,
      headers,
      rows.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <Input
        value={heading ?? ""}
        onChange={(e) => onChange(e.target.value || undefined, headers, rows)}
        placeholder="Heading (optional)"
      />
      <div className="flex gap-2">
        {headers.map((header, index) => (
          <div key={index} className="flex w-40 shrink-0 gap-1">
            <Input
              value={header}
              onChange={(e) => setHeader(index, e.target.value)}
              placeholder={`Column ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove column"
              disabled={headers.length === 1}
              onClick={() => removeColumn(index)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <Plus /> Column
        </Button>
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((cell, colIndex) => (
            <Input
              key={colIndex}
              value={cell}
              onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
              className="w-40 shrink-0"
              placeholder={`Row ${rowIndex + 1}`}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove row"
            disabled={rows.length === 1}
            onClick={() => removeRow(rowIndex)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
        <Plus /> Row
      </Button>
    </div>
  );
}
