"use client";

import { useState, type FormEvent } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * The Insights subscribe form (T4.5, `POST /api/insights/subscribe`) — rendered at the foot of
 * the index (`app/insights/page.tsx`) and every article (`app/insights/[slug]/page.tsx`), one
 * shared component so the two placements can't drift (this epic's own lesson from session 27's
 * Home-card fix). No dedicated mockup exists for this form anywhere in `ui/mockups/` (checked
 * directly, session 27) — this layout is inferred from `components/contact-form.tsx`'s
 * established interaction shape (Field/FieldLabel/FieldError, controlled inputs, an idle/
 * submitting/success/error status machine), reduced to Insights' single field plus one
 * consent checkbox.
 *
 * Deliberately never calls `pushDataLayerEvent` — insights-engine.md's own explicit business
 * rule is that subscribing is not one of Document 13.03's six fixed measurement events, and
 * this task's acceptance criterion is that it must not invent a seventh.
 */
export function InsightsSubscribeForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!consent) {
      setStatus("error");
      setErrorMessage("Please agree to receive Insights emails before subscribing.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/insights/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const data: { status: string; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="border-border bg-card rounded-md border p-6 text-center">
        <h3 className="font-display text-primary text-h3 mb-2 font-bold">You&apos;re subscribed</h3>
        <p className="text-body text-foreground mb-0">
          Check your inbox for a confirmation — and an unsubscribe link, if you ever change your
          mind.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-border bg-card rounded-md border p-6 sm:p-7"
    >
      <h3 className="font-display text-primary text-h3 mb-1.5 font-bold">Subscribe to Insights</h3>
      <p className="text-body text-muted-foreground mb-5">
        Two articles a month from the partners themselves — nothing more.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field className="flex-1">
          <FieldLabel htmlFor="subscribe-email" className="sr-only">
            Email
          </FieldLabel>
          <Input
            id="subscribe-email"
            name="email"
            type="email"
            required
            placeholder="you@business.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <button type="submit" className={BTN_ACCENT} disabled={status === "submitting"}>
          {status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <Field orientation="horizontal" className="mt-3 items-start gap-2">
        <Checkbox
          id="subscribe-consent"
          name="consent"
          required
          aria-required
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="subscribe-consent" className="text-caption font-normal">
          I&apos;d like to receive Insights articles by email.{" "}
          <span className="text-muted-foreground">(required)</span>
        </FieldLabel>
      </Field>
      {status === "error" && errorMessage && (
        <FieldError className="mt-3" role="alert">
          {errorMessage}
        </FieldError>
      )}
    </form>
  );
}
