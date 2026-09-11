"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import type { OfferFaq } from "@/lib/offers";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * `offer.faqs` — an ordered `{question, answer}[]` (`core-offer-pages.md`'s "3–5 real
 * Q&As"). Each entry is a real question/answer pair, not the mockup's flat alternating
 * text-input rows — the mockup is a wireframing-tool simplification of this same data
 * (`core-offer-pages.md`'s Data requirements names the `{question, answer}` shape directly),
 * so this editor exposes both fields per entry to match the actual schema, same treatment
 * T7.2/T7.3 already gave their own mockup gaps.
 */
export function FaqListEditor({
  faqs,
  onChange,
}: {
  faqs: OfferFaq[];
  onChange: (faqs: OfferFaq[]) => void;
}) {
  function update(index: number, field: keyof OfferFaq, value: string) {
    onChange(faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }
  function remove(index: number) {
    onChange(faqs.filter((_, i) => i !== index));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const next = [...faqs];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function add() {
    onChange([...faqs, { question: "", answer: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, index) => (
        <div key={index} className="border-border rounded-sm border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-[0.05em] uppercase">
              Q&amp;A {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move Q&A up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move Q&A down"
                disabled={index === faqs.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove Q&A"
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              value={faq.question}
              onChange={(e) => update(index, "question", e.target.value)}
              placeholder="Question"
              aria-label={`Q&A ${index + 1} question`}
            />
            <Textarea
              rows={2}
              value={faq.answer}
              onChange={(e) => update(index, "answer", e.target.value)}
              placeholder="Answer"
              aria-label={`Q&A ${index + 1} answer`}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus /> Add Q&amp;A
      </Button>
      {faqs.length === 0 && (
        <FieldLabel className="text-muted-foreground text-xs font-normal">
          Empty is allowed (core-offer-pages.md&apos;s edge case) — the section is simply omitted on
          the public page rather than shown with placeholder questions.
        </FieldLabel>
      )}
    </div>
  );
}
