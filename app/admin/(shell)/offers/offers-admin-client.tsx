"use client";

import { useState } from "react";

import type { AdvisoryRetainerEditData, OfferEditData } from "@/lib/admin-offers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvisoryRetainerEditor } from "./advisory-retainer-editor";
import { OfferEditorForm } from "./offer-editor-form";

/**
 * The "combined screen, two panels" shape T7.3's Legal-page-plus-footer screen already
 * established (CLAUDE.md's architecture constraint for this task): a picker over the three
 * core offers plus, always visible below it, the Advisory Retainer singleton panel — its own
 * screen would be one nav item for a single small form,
 * `content-management-admin.md`'s own precedent against that ("not a separate top-level
 * sidebar item" pattern, `capabilities-page.md`'s explicit "edited via the Offers content
 * area, alongside the three core offer fee bands").
 */
export function OffersAdminClient({
  initialOffers,
  initialRetainer,
}: {
  initialOffers: OfferEditData[];
  initialRetainer: AdvisoryRetainerEditData;
}) {
  const [offers, setOffers] = useState(initialOffers);
  const [selectedSlug, setSelectedSlug] = useState(initialOffers[0]?.slug ?? "");
  const selectedOffer = offers.find((o) => o.slug === selectedSlug) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border bg-card rounded-md border p-6">
        <h2 className="mb-4 text-sm font-semibold">Core offers</h2>
        <Select
          value={selectedSlug}
          onValueChange={(value) => value && setSelectedSlug(value)}
          items={Object.fromEntries(offers.map((o) => [o.slug, o.name]))}
        >
          <SelectTrigger className="mb-5 w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {offers.map((o) => (
              <SelectItem key={o.slug} value={o.slug}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedOffer && (
          <OfferEditorForm
            key={selectedOffer.slug}
            offer={selectedOffer}
            onSaved={(updated) =>
              setOffers(offers.map((o) => (o.slug === updated.slug ? updated : o)))
            }
          />
        )}
      </div>

      <AdvisoryRetainerEditor initial={initialRetainer} />
    </div>
  );
}
