"use client";

import { useState, type FormEvent } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { pushDataLayerEvent } from "@/lib/data-layer";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500 disabled:cursor-not-allowed disabled:opacity-60";

export interface ContactFormProps {
  /** `service_line` slug to submit alongside the form, from `/contact`'s `?service=` param. */
  serviceSlug: string | null;
}

/**
 * `/contact`'s form (contact-and-enquiry.md's `POST /api/contact/submit`). Contact consent is
 * a required checkbox, separate from marketing consent (FR-6.2) — the form never bundles the
 * two, and a submission with contact consent unchecked is rejected before any request is even
 * sent (this task's own explicit acceptance criterion), not only by the API's own check.
 */
export function ContactForm({ serviceSlug }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactConsent) {
      setStatus("error");
      setErrorMessage("Please agree to be contacted about this enquiry before sending.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          service: serviceSlug ?? undefined,
          contact_consent: contactConsent,
          marketing_consent: marketingConsent,
        }),
      });
      const data: { status: string; enquiry_id?: number; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      pushDataLayerEvent("enquiry_submitted", {
        enquiry_id: data.enquiry_id,
        service_line: serviceSlug,
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="border-border bg-card rounded-md border p-6">
        <h3 className="font-display text-primary text-h3 mb-2 font-bold">Message sent</h3>
        <p className="text-body text-foreground mb-0">
          Thank you — we&apos;ve received your enquiry and will be in touch within our stated
          response time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field className="mb-4">
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field className="mb-4">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field className="mb-4">
        <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>
      <Field className="mb-4">
        <FieldLabel htmlFor="message">What&apos;s going on with the business?</FieldLabel>
        <Textarea
          id="message"
          name="message"
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </Field>

      <Field orientation="horizontal" className="mb-3 items-start gap-2">
        <Checkbox
          id="contactConsent"
          name="contact_consent"
          required
          aria-required
          checked={contactConsent}
          onCheckedChange={(checked) => setContactConsent(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="contactConsent" className="text-caption font-normal">
          I agree to be contacted about this enquiry.{" "}
          <span className="text-muted-foreground">(required)</span>
        </FieldLabel>
      </Field>
      <Field orientation="horizontal" className="mb-4 items-start gap-2">
        <Checkbox
          id="marketingConsent"
          name="marketing_consent"
          checked={marketingConsent}
          onCheckedChange={(checked) => setMarketingConsent(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="marketingConsent" className="text-caption font-normal">
          I&apos;d also like occasional Insights articles and updates from Kaalbert &amp; Company —
          separate from the above, and unticked by default.
        </FieldLabel>
      </Field>

      {status === "error" && errorMessage && (
        <FieldError className="mb-3" role="alert">
          {errorMessage}
        </FieldError>
      )}

      <button type="submit" className={BTN_PRIMARY} disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
