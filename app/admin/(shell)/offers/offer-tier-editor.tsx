"use client";

import type { OfferTierEditRow } from "@/lib/admin-offers";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StringListEditor } from "./string-list-editor";

/**
 * Only Business Health Check has `OfferTier` rows (`core-offer-pages.md`'s doc-comment) — up
 * to now always Express/Full. Tiers themselves aren't added, removed, or reordered here
 * (`sortOrder` stays whatever the seed set); this editor covers each tier's own editable
 * fields, plus a single `RadioGroup` across all tiers so exactly one stays `isFeatured` — the
 * tier the offer page's fee panel presents as "the published fee band"
 * (`app/offers/[slug]/page.tsx`'s `featuredTier`).
 */
export function OfferTierListEditor({
  tiers,
  onChange,
}: {
  tiers: OfferTierEditRow[];
  onChange: (tiers: OfferTierEditRow[]) => void;
}) {
  function update(id: number, patch: Partial<OfferTierEditRow>) {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function setFeatured(id: number) {
    onChange(tiers.map((t) => ({ ...t, isFeatured: t.id === id })));
  }

  return (
    <RadioGroup
      value={String(tiers.find((t) => t.isFeatured)?.id ?? "")}
      onValueChange={(value) => value && setFeatured(Number(value))}
      className="flex flex-col gap-4"
    >
      {tiers.map((tier) => (
        <div key={tier.id} className="border-border rounded-md border p-4">
          <div className="mb-3 flex items-center gap-2">
            <RadioGroupItem id={`tier-featured-${tier.id}`} value={String(tier.id)} />
            <FieldLabel htmlFor={`tier-featured-${tier.id}`} className="text-sm font-normal">
              Featured / published tier
            </FieldLabel>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`tier-name-${tier.id}`}>Tier name</FieldLabel>
              <Input
                id={`tier-name-${tier.id}`}
                value={tier.name}
                onChange={(e) => update(tier.id, { name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`tier-duration-${tier.id}`}>Duration label</FieldLabel>
              <Input
                id={`tier-duration-${tier.id}`}
                value={tier.durationLabel}
                onChange={(e) => update(tier.id, { durationLabel: e.target.value })}
                placeholder="e.g. 5 working days"
              />
            </Field>
          </div>

          <Field className="mt-3">
            <FieldLabel htmlFor={`tier-scope-label-${tier.id}`}>
              Scope label{" "}
              <span className="text-muted-foreground font-normal">short tier-meta form</span>
            </FieldLabel>
            <Input
              id={`tier-scope-label-${tier.id}`}
              value={tier.scopeLabel}
              onChange={(e) => update(tier.id, { scopeLabel: e.target.value })}
            />
          </Field>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field>
              <FieldLabel htmlFor={`tier-fee-min-${tier.id}`}>Amount from</FieldLabel>
              <Input
                id={`tier-fee-min-${tier.id}`}
                type="number"
                value={tier.feeAmountMin}
                onChange={(e) => update(tier.id, { feeAmountMin: Number(e.target.value) })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`tier-fee-max-${tier.id}`}>Amount to</FieldLabel>
              <Input
                id={`tier-fee-max-${tier.id}`}
                type="number"
                value={tier.feeAmountMax}
                onChange={(e) => update(tier.id, { feeAmountMax: Number(e.target.value) })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`tier-currency-${tier.id}`}>Currency</FieldLabel>
              <Input
                id={`tier-currency-${tier.id}`}
                value={tier.feeCurrency}
                onChange={(e) => update(tier.id, { feeCurrency: e.target.value })}
              />
            </Field>
            <Field className="col-span-2 sm:col-span-1">
              <FieldLabel htmlFor={`tier-scope-cap-${tier.id}`}>
                Scope cap <span className="text-muted-foreground font-normal">required</span>
              </FieldLabel>
              <Input
                id={`tier-scope-cap-${tier.id}`}
                value={tier.scopeCap}
                onChange={(e) => update(tier.id, { scopeCap: e.target.value })}
              />
            </Field>
          </div>
          <p className="text-accent mt-2 text-xs">
            This fee band cannot be saved without a scope cap — the two fields are linked and save
            together (Document 13.03, Section 13).
          </p>

          <div className="mt-4">
            <FieldLabel className="mb-2 block">Deliverables</FieldLabel>
            <StringListEditor
              values={tier.deliverables}
              onChange={(deliverables) => update(tier.id, { deliverables })}
              placeholder="Deliverable"
              addLabel="Add deliverable"
            />
          </div>

          <Field className="mt-4">
            <FieldLabel htmlFor={`tier-client-inputs-${tier.id}`}>Required from you</FieldLabel>
            <Input
              id={`tier-client-inputs-${tier.id}`}
              value={tier.clientInputs[0] ?? ""}
              onChange={(e) => update(tier.id, { clientInputs: [e.target.value] })}
            />
          </Field>
        </div>
      ))}
    </RadioGroup>
  );
}
