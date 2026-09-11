"use client";

import { Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

import type { ArticleBodyBlock } from "@/lib/insights";
import { AdminImageUploadButton } from "@/components/admin-image-upload-button";
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

const BLOCK_LABELS: Record<ArticleBodyBlock["kind"], string> = {
  paragraph: "Paragraph",
  heading: "Heading (H2)",
  quote: "Pull-quote",
  list: "Bulleted list",
  table: "Table",
  figure: "Figure",
};

function emptyBlock(kind: ArticleBodyBlock["kind"]): ArticleBodyBlock {
  switch (kind) {
    case "paragraph":
      return { kind: "paragraph", text: "" };
    case "heading":
      return { kind: "heading", text: "" };
    case "quote":
      return { kind: "quote", text: "" };
    case "list":
      return { kind: "list", items: [""] };
    case "table":
      return { kind: "table", headers: ["", ""], rows: [["", ""]] };
    case "figure":
      return { kind: "figure", imageUrl: "", caption: "" };
  }
}

/**
 * A structured, add-a-block-of-type-X editor — not a freeform contenteditable/WYSIWYG —
 * because `Article.body` (`prisma/schema.prisma`) is a strict `kind`-discriminated block
 * union (paragraph/heading/quote/list/table/figure, `lib/insights.ts`'s `ArticleBodyBlock`),
 * the same "no admin editor yet to justify full relational modelling" shape already used for
 * `LegalPage.body`/`Offer.methodStages`. `ui/mockups/g-admin-content/admin-article-editor.html`'s
 * `contenteditable` + toolbar visual has no corresponding data shape to produce (there is no
 * freeform HTML/markdown block kind anywhere in the schema) — this editor matches the
 * mockup's *intent* ("tables/pull-quotes/figures... supported") by producing exactly what the
 * schema stores and the public article page (`app/insights/[slug]/page.tsx`) already renders,
 * rather than its literal contenteditable mechanism. See `memory/decision-log.md` (T7.2).
 */
export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ArticleBodyBlock[];
  onChange: (blocks: ArticleBodyBlock[]) => void;
}) {
  function updateBlock(index: number, block: ArticleBodyBlock) {
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

  function addBlock(kind: ArticleBodyBlock["kind"]) {
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

          <BlockFields block={block} onChange={(next) => updateBlock(index, next)} />
        </div>
      ))}

      <AddBlockControl onAdd={addBlock} />
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: ArticleBodyBlock;
  onChange: (block: ArticleBodyBlock) => void;
}) {
  switch (block.kind) {
    case "paragraph":
    case "quote":
      return (
        <Textarea
          rows={3}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder={block.kind === "quote" ? "Pull-quote text" : "Paragraph text"}
        />
      );

    case "heading":
      return (
        <Input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Subheading text"
        />
      );

    case "list":
      return <ListFields items={block.items} onChange={(items) => onChange({ ...block, items })} />;

    case "table":
      return (
        <TableFields
          headers={block.headers}
          rows={block.rows}
          onChange={(headers, rows) => onChange({ ...block, headers, rows })}
        />
      );

    case "figure":
      return (
        <div className="flex flex-col gap-3">
          {block.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied preview of an interim base64/future R2 URL, same precedent as the public renderer.
            <img src={block.imageUrl} alt="" className="max-h-40 rounded-sm object-cover" />
          ) : (
            <p className="text-muted-foreground text-sm">No image set</p>
          )}
          <AdminImageUploadButton
            label={block.imageUrl ? "Replace image" : "Upload an image"}
            onUploaded={(imageUrl) => onChange({ ...block, imageUrl })}
          />
          <Input
            value={block.caption}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption"
          />
        </div>
      );
  }
}

function ListFields({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) =>
              onChange(items.map((existing, i) => (i === index ? e.target.value : existing)))
            }
            placeholder="List item"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            disabled={items.length === 1}
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

function TableFields({
  headers,
  rows,
  onChange,
}: {
  headers: string[];
  rows: string[][];
  onChange: (headers: string[], rows: string[][]) => void;
}) {
  function setHeader(index: number, value: string) {
    onChange(
      headers.map((h, i) => (i === index ? value : h)),
      rows,
    );
  }

  function addColumn() {
    onChange(
      [...headers, ""],
      rows.map((row) => [...row, ""]),
    );
  }

  function removeColumn(index: number) {
    onChange(
      headers.filter((_, i) => i !== index),
      rows.map((row) => row.filter((_, i) => i !== index)),
    );
  }

  function setCell(rowIndex: number, colIndex: number, value: string) {
    onChange(
      headers,
      rows.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
      ),
    );
  }

  function addRow() {
    onChange(headers, [...rows, headers.map(() => "")]);
  }

  function removeRow(index: number) {
    onChange(
      headers,
      rows.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
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

function AddBlockControl({ onAdd }: { onAdd: (kind: ArticleBodyBlock["kind"]) => void }) {
  const kinds = Object.keys(BLOCK_LABELS) as ArticleBodyBlock["kind"][];

  return (
    <Select
      value=""
      onValueChange={(value) => onAdd(value as ArticleBodyBlock["kind"])}
      items={Object.fromEntries(kinds.map((kind) => [kind, `Add ${BLOCK_LABELS[kind]}`]))}
    >
      <SelectTrigger className="w-fit">
        <SelectValue placeholder="Add a block…" />
      </SelectTrigger>
      <SelectContent>
        {kinds.map((kind) => (
          <SelectItem key={kind} value={kind}>
            Add {BLOCK_LABELS[kind]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
