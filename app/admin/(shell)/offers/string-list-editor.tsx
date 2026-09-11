"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A flat list of short strings — `offer.deliverables` / `offer_tier.deliverables`
 * (`core-offer-pages.md`'s "named deliverables," FR-4.1), matching
 * `ui/mockups/g-admin-content/admin-offer-editor.html`'s own `.list-editor` rows exactly (add
 * row / remove row, no reorder control — deliverables read as a set, not a meaningfully
 * ordered sequence the way method stages or FAQs are).
 */
export function StringListEditor({
  values,
  onChange,
  placeholder,
  addLabel,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  addLabel: string;
}) {
  function update(index: number, value: string) {
    onChange(values.map((v, i) => (i === index ? value : v)));
  }
  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...values, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => update(index, e.target.value)}
            placeholder={placeholder}
            aria-label={`${placeholder ?? "Item"} ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove"
            onClick={() => remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}
