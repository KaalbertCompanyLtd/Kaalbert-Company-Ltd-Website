"use client";

import { useState } from "react";

import type { AdvisoryRetainerEditData } from "@/lib/admin-offers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * `capabilities-page.md`'s `advisory_retainer` singleton — "edited via the Offers content
 * area, alongside the three core offer fee bands" — a smaller, structurally distinct form:
 * one recurring fee (amount + currency + billing period), not a min/max band with a scope
 * cap, since a retainer is priced per period rather than scoped per engagement.
 */
export function AdvisoryRetainerEditor({ initial }: { initial: AdvisoryRetainerEditData }) {
  const [feeAmount, setFeeAmount] = useState(initial.feeAmount);
  const [feeCurrency, setFeeCurrency] = useState(initial.feeCurrency);
  const [billingPeriod, setBillingPeriod] = useState(initial.billingPeriod);
  const [description, setDescription] = useState(initial.description);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/advisory-retainer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeAmount,
          feeCurrency,
          billingPeriod,
          description,
          complianceChecked,
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
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card rounded-md border p-6">
      <h2 className="mb-1 text-sm font-semibold">Advisory Retainer</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        A continuing arrangement, summarised on /capabilities — not one of the three core offer
        pages.
      </p>

      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="retainerFeeAmount">Fee amount</FieldLabel>
          <Input
            id="retainerFeeAmount"
            type="number"
            value={feeAmount}
            onChange={(e) => setFeeAmount(Number(e.target.value))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="retainerCurrency">Currency</FieldLabel>
          <Input
            id="retainerCurrency"
            value={feeCurrency}
            onChange={(e) => setFeeCurrency(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="retainerBillingPeriod">
            Billing period <span className="text-muted-foreground font-normal">e.g. month</span>
          </FieldLabel>
          <Input
            id="retainerBillingPeriod"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
          />
        </Field>
      </div>

      <Field className="mt-4">
        <FieldLabel htmlFor="retainerDescription">Description</FieldLabel>
        <Textarea
          id="retainerDescription"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="retainerCompliance"
          checked={complianceChecked}
          onCheckedChange={(checked) => setComplianceChecked(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="retainerCompliance" className="text-sm leading-snug font-normal">
          This complies with 10.05 Positioning and Claims Guidance Note
        </FieldLabel>
      </div>

      <Button
        type="button"
        disabled={!complianceChecked || status === "saving"}
        title={!complianceChecked ? "Confirm 10.05 compliance first" : undefined}
        onClick={handleSave}
        className="mt-4 w-fit"
      >
        Save
      </Button>
    </div>
  );
}
