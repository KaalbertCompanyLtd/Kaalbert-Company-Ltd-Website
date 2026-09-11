"use client";

import { useState } from "react";

import type { OfferEditData } from "@/lib/admin-offers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FaqListEditor } from "./faq-list-editor";
import { MethodStageListEditor } from "./method-stage-list-editor";
import { OfferTierListEditor } from "./offer-tier-editor";
import { StringListEditor } from "./string-list-editor";

/**
 * The full FR-4.1 field set for one core offer, in the fixed reading order
 * `core-offer-pages.md` names. `teaser`/`ctaHref`/`metaTitle`/`metaDescription` are added
 * here beyond `ui/mockups/g-admin-content/admin-offer-editor.html`'s own fields — all four
 * are required `offer` columns with no admin surface anywhere else to edit them, a further
 * mockup gap beyond the five this task's own "Build" line already names as fixed (see
 * `memory/decision-log.md`, T7.4).
 *
 * A tiered offer (Business Health Check — `offer.tiers.length > 0`) hides the parent row's
 * own deliverables/required-inputs/indicative-timeline/fee-band fields entirely and shows
 * `OfferTierListEditor` instead (`core-offer-pages.md`'s doc-comment: those top-level fields
 * "go unused" for a tiered offer) — never both at once, so a partner can't edit a field that
 * has no effect on the public page.
 */
export function OfferEditorForm({
  offer,
  onSaved,
}: {
  offer: OfferEditData;
  onSaved: (offer: OfferEditData) => void;
}) {
  const isTiered = offer.tiers.length > 0;

  const [name, setName] = useState(offer.name);
  const [teaser, setTeaser] = useState(offer.teaser);
  const [problemStatement, setProblemStatement] = useState(offer.problemStatement);
  const [whoFor, setWhoFor] = useState(offer.whoFor);
  const [whoNotFor, setWhoNotFor] = useState(offer.whoNotFor);
  const [methodStages, setMethodStages] = useState(offer.methodStages);
  const [deliverables, setDeliverables] = useState(offer.deliverables);
  const [clientInputsText, setClientInputsText] = useState(offer.clientInputs[0] ?? "");
  const [indicativeTimeline, setIndicativeTimeline] = useState(offer.indicativeTimeline ?? "");
  const [feeAmountMin, setFeeAmountMin] = useState(offer.feeAmountMin);
  const [feeAmountMax, setFeeAmountMax] = useState(offer.feeAmountMax);
  const [feeCurrency, setFeeCurrency] = useState(offer.feeCurrency);
  const [scopeCap, setScopeCap] = useState(offer.scopeCap);
  const [tiers, setTiers] = useState(offer.tiers);
  const [outOfScopeNote, setOutOfScopeNote] = useState(offer.outOfScopeNote);
  const [faqs, setFaqs] = useState(offer.faqs);
  const [ctaHref, setCtaHref] = useState(offer.ctaHref);
  const [ctaLabel, setCtaLabel] = useState(offer.ctaLabel);
  const [metaTitle, setMetaTitle] = useState(offer.metaTitle);
  const [metaDescription, setMetaDescription] = useState(offer.metaDescription);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/offers/${offer.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          teaser,
          problemStatement,
          whoFor,
          whoNotFor,
          methodStages,
          deliverables,
          clientInputs: clientInputsText.trim() ? [clientInputsText] : [],
          indicativeTimeline: indicativeTimeline || null,
          feeAmountMin,
          feeAmountMax,
          feeCurrency,
          scopeCap,
          outOfScopeNote,
          faqs,
          ctaHref,
          ctaLabel,
          metaTitle,
          metaDescription,
          complianceChecked,
          tiers,
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("idle");
      setComplianceChecked(false);
      onSaved({
        ...offer,
        name,
        teaser,
        problemStatement,
        whoFor,
        whoNotFor,
        methodStages,
        deliverables,
        clientInputs: clientInputsText.trim() ? [clientInputsText] : [],
        indicativeTimeline: indicativeTimeline || null,
        feeAmountMin,
        feeAmountMax,
        feeCurrency,
        scopeCap,
        outOfScopeNote,
        faqs,
        ctaHref,
        ctaLabel,
        metaTitle,
        metaDescription,
        tiers,
      });
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="offerName">Offer name</FieldLabel>
        <Input id="offerName" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="offerTeaser">
          Teaser{" "}
          <span className="text-muted-foreground font-normal">
            short summary shown on Home and Capabilities offer cards
          </span>
        </FieldLabel>
        <Textarea
          id="offerTeaser"
          rows={2}
          value={teaser}
          onChange={(e) => setTeaser(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="offerProblem">
          Problem statement{" "}
          <span className="text-muted-foreground font-normal">the client&apos;s own language</span>
        </FieldLabel>
        <Textarea
          id="offerProblem"
          rows={3}
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="offerWhoFor">Who it&apos;s for</FieldLabel>
          <Textarea
            id="offerWhoFor"
            rows={3}
            value={whoFor}
            onChange={(e) => setWhoFor(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="offerWhoNotFor">Who it&apos;s not for</FieldLabel>
          <Textarea
            id="offerWhoNotFor"
            rows={3}
            value={whoNotFor}
            onChange={(e) => setWhoNotFor(e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>
          Method stages <span className="text-muted-foreground font-normal">ordered</span>
        </FieldLabel>
        <MethodStageListEditor stages={methodStages} onChange={setMethodStages} />
      </Field>

      {isTiered ? (
        <Field>
          <FieldLabel>
            Pricing tiers{" "}
            <span className="text-muted-foreground font-normal">
              Business Health Check has two tiers instead of a single fee band
            </span>
          </FieldLabel>
          <OfferTierListEditor tiers={tiers} onChange={setTiers} />
        </Field>
      ) : (
        <>
          <Field>
            <FieldLabel>Deliverables</FieldLabel>
            <StringListEditor
              values={deliverables}
              onChange={setDeliverables}
              placeholder="Deliverable"
              addLabel="Add deliverable"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="offerClientInputs">
              Required from you{" "}
              <span className="text-muted-foreground font-normal">client_inputs</span>
            </FieldLabel>
            <Textarea
              id="offerClientInputs"
              rows={3}
              value={clientInputsText}
              onChange={(e) => setClientInputsText(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="offerTimeline">Indicative timeline</FieldLabel>
            <Input
              id="offerTimeline"
              value={indicativeTimeline}
              onChange={(e) => setIndicativeTimeline(e.target.value)}
              placeholder="e.g. 3–6 weeks"
            />
          </Field>

          <Field>
            <FieldLabel>
              Published fee band{" "}
              <span className="text-muted-foreground font-normal">
                structured fields, never free text — a fee cannot be saved without its scope cap
              </span>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="offerFeeMin">Amount from</FieldLabel>
                <Input
                  id="offerFeeMin"
                  type="number"
                  value={feeAmountMin}
                  onChange={(e) => setFeeAmountMin(Number(e.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="offerFeeMax">Amount to</FieldLabel>
                <Input
                  id="offerFeeMax"
                  type="number"
                  value={feeAmountMax}
                  onChange={(e) => setFeeAmountMax(Number(e.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="offerCurrency">Currency</FieldLabel>
                <Input
                  id="offerCurrency"
                  value={feeCurrency}
                  onChange={(e) => setFeeCurrency(e.target.value)}
                />
              </Field>
              <Field className="col-span-2 sm:col-span-1">
                <FieldLabel htmlFor="offerScopeCap">
                  Scope cap <span className="text-muted-foreground font-normal">required</span>
                </FieldLabel>
                <Input
                  id="offerScopeCap"
                  value={scopeCap}
                  onChange={(e) => setScopeCap(e.target.value)}
                />
              </Field>
            </div>
            <p className="text-accent mt-1 text-xs">
              This fee band cannot be saved without a scope cap — the two fields are linked and save
              together (Document 13.03, Section 13).
            </p>
          </Field>
        </>
      )}

      <Field>
        <FieldLabel htmlFor="offerOutOfScope">Out of scope</FieldLabel>
        <Textarea
          id="offerOutOfScope"
          rows={2}
          value={outOfScopeNote}
          onChange={(e) => setOutOfScopeNote(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>
          Real questions{" "}
          <span className="text-muted-foreground font-normal">
            faqs — three to five real Q&amp;As
          </span>
        </FieldLabel>
        <FaqListEditor faqs={faqs} onChange={setFaqs} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="offerCtaLabel">Call-to-action label</FieldLabel>
          <Input
            id="offerCtaLabel"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="offerCtaHref">Call-to-action link</FieldLabel>
          <Input id="offerCtaHref" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="offerMetaTitle">Meta title</FieldLabel>
          <Input
            id="offerMetaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="offerMetaDescription">Meta description</FieldLabel>
          <Input
            id="offerMetaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </Field>
      </div>

      <div className="border-border bg-card flex items-start gap-2 rounded-md border p-4">
        <Checkbox
          id={`offerCompliance-${offer.slug}`}
          checked={complianceChecked}
          onCheckedChange={(checked) => setComplianceChecked(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel
          htmlFor={`offerCompliance-${offer.slug}`}
          className="text-sm leading-snug font-normal"
        >
          This complies with 10.05 Positioning and Claims Guidance Note
        </FieldLabel>
      </div>

      <Button
        type="button"
        disabled={!complianceChecked || status === "saving"}
        title={!complianceChecked ? "Confirm 10.05 compliance first" : undefined}
        onClick={handleSave}
        className="w-fit"
      >
        Save
      </Button>
    </div>
  );
}
