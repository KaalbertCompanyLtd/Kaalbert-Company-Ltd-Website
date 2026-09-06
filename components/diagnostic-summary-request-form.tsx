"use client";

import { useState, type FormEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { pushDataLayerEvent } from "@/lib/data-layer";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500 disabled:cursor-not-allowed disabled:opacity-60";

export interface DiagnosticSummaryRequestFormProps {
  enquiryId: number;
}

/**
 * `/diagnostic/results`'s "Get the full written summary by email" panel (T3.7,
 * `ui/mockups/c-diagnostic/diagnostic-results.html`'s `.summary-panel`) — the second, later,
 * separate ask this diagnostic's own business rules require (FR-2.3: the on-screen result
 * itself never requires contact details; this panel is offered only after it). Contact
 * consent and marketing consent are two independently-toggleable checkboxes, both unticked
 * by default (FR-6.2 — never bundled), mirroring `components/contact-form.tsx`'s own
 * established pattern for this exact rule.
 */
export function DiagnosticSummaryRequestForm({ enquiryId }: DiagnosticSummaryRequestFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactConsent) {
      setStatus("error");
      setErrorMessage("Please agree to be contacted about this result before sending.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/diagnostic/request-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiry_id: enquiryId,
          name,
          email,
          phone: phone || undefined,
          contact_consent: contactConsent,
          marketing_consent: marketingConsent,
        }),
      });
      const data: { status: string; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      pushDataLayerEvent("summary_requested", { enquiry_id: enquiryId });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="border-border bg-card mx-auto max-w-[560px] rounded-md border p-6 text-center sm:p-8">
        <h3 className="font-display text-primary text-h3 mb-2 font-bold">Summary on its way</h3>
        <p className="text-body text-foreground mb-0">
          Thank you — check your inbox shortly for the full written summary.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card mx-auto max-w-[560px] rounded-md border p-6 sm:p-8">
      <h2 className="font-display text-primary text-h3 mb-2 font-bold">
        Get the full written summary by email
      </h2>
      <p className="text-caption text-muted-foreground mb-5">
        A partner reads every response personally — you&apos;ll hear from someone who already
        understands your numbers, not a generic reply.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Field className="mb-4">
          <FieldLabel htmlFor="summaryName">Name</FieldLabel>
          <Input
            id="summaryName"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field className="mb-4">
          <FieldLabel htmlFor="summaryEmail">Email</FieldLabel>
          <Input
            id="summaryEmail"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field className="mb-4">
          <FieldLabel htmlFor="summaryPhone">Phone (optional)</FieldLabel>
          <Input
            id="summaryPhone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>

        <Field orientation="horizontal" className="mb-3 items-start gap-2">
          <Checkbox
            id="summaryContactConsent"
            name="contact_consent"
            required
            aria-required
            checked={contactConsent}
            onCheckedChange={(checked) => setContactConsent(checked === true)}
            className="mt-0.5"
          />
          <FieldLabel htmlFor="summaryContactConsent" className="text-caption font-normal">
            I agree to be contacted about this result.{" "}
            <span className="text-muted-foreground">(required)</span>
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" className="mb-4 items-start gap-2">
          <Checkbox
            id="summaryMarketingConsent"
            name="marketing_consent"
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            className="mt-0.5"
          />
          <FieldLabel htmlFor="summaryMarketingConsent" className="text-caption font-normal">
            I&apos;d also like occasional Insights articles and updates from Kaalbert &amp; Company
            — separate from the above, and unticked by default.
          </FieldLabel>
        </Field>

        {status === "error" && errorMessage && (
          <FieldError className="mb-3" role="alert">
            {errorMessage}
          </FieldError>
        )}

        <button type="submit" className={BTN_PRIMARY} disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Email my full summary"}
        </button>
      </form>
    </div>
  );
}
