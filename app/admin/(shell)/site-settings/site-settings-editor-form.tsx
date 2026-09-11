"use client";

import { useState } from "react";

import type { SiteSettingsEditData } from "@/lib/admin-site-settings";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * No 10.05-compliance checkbox here (see this task's own architecture constraints) — contact
 * details aren't a marketing claim, so Save is enabled unconditionally, same precedent as
 * `app/admin/(shell)/pages/legal/legal-admin-client.tsx`'s Footer content editor. Every
 * required field below (phone/email/WhatsApp/address) is still savable blank —
 * content-management-admin.md's edge case — each carries a hint saying what happens on the
 * public site when it's left that way, rather than the form itself blocking the save.
 */
export function SiteSettingsEditorForm({ initial }: { initial: SiteSettingsEditData }) {
  const [phonePrimary, setPhonePrimary] = useState(initial.phonePrimary);
  const [phoneSecondary, setPhoneSecondary] = useState(initial.phoneSecondary ?? "");
  const [email, setEmail] = useState(initial.email);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [address, setAddress] = useState(initial.address);
  const [responseTimeCommitment, setResponseTimeCommitment] = useState(
    initial.responseTimeCommitment ?? "",
  );
  const [socialProfileUrls, setSocialProfileUrls] = useState(initial.socialProfileUrls.join("\n"));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phonePrimary,
          phoneSecondary: phoneSecondary || null,
          email,
          whatsappNumber,
          address,
          responseTimeCommitment: responseTimeCommitment || null,
          socialProfileUrls: socialProfileUrls.split("\n"),
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-md border p-6">
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="phonePrimary">
            Phone (primary){" "}
            <span className="text-muted-foreground font-normal">
              blank omits the phone link site-wide
            </span>
          </FieldLabel>
          <Input
            id="phonePrimary"
            value={phonePrimary}
            onChange={(e) => setPhonePrimary(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phoneSecondary">
            Phone (secondary) <span className="text-muted-foreground font-normal">optional</span>
          </FieldLabel>
          <Input
            id="phoneSecondary"
            value={phoneSecondary}
            onChange={(e) => setPhoneSecondary(e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="email">
          Email{" "}
          <span className="text-muted-foreground font-normal">
            blank omits the email link site-wide
          </span>
        </FieldLabel>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="whatsappNumber">
          WhatsApp number{" "}
          <span className="text-muted-foreground font-normal">
            digits only, country-code-prefixed (e.g. 233558480001) — blank omits every WhatsApp
            button
          </span>
        </FieldLabel>
        <Input
          id="whatsappNumber"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="address">
          Office address{" "}
          <span className="text-muted-foreground font-normal">
            one line per address line — blank omits the office address site-wide
          </span>
        </FieldLabel>
        <Textarea
          id="address"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="responseTimeCommitment">
          Response-time commitment{" "}
          <span className="text-muted-foreground font-normal">
            optional — omitted from /contact entirely while blank, never a placeholder
          </span>
        </FieldLabel>
        <Textarea
          id="responseTimeCommitment"
          rows={2}
          value={responseTimeCommitment}
          onChange={(e) => setResponseTimeCommitment(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="socialProfileUrls">
          Social profile URLs{" "}
          <span className="text-muted-foreground font-normal">
            one per line — feeds search engines&apos; Organization listing; omitted entirely while
            blank
          </span>
        </FieldLabel>
        <Textarea
          id="socialProfileUrls"
          rows={3}
          value={socialProfileUrls}
          onChange={(e) => setSocialProfileUrls(e.target.value)}
        />
      </Field>

      <Button type="button" disabled={status === "saving"} onClick={handleSave} className="w-fit">
        Save
      </Button>
    </div>
  );
}
