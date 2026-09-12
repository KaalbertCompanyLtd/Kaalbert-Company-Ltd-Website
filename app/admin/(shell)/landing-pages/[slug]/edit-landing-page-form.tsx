"use client";

import { useState } from "react";

import type { LandingPageDetail } from "@/lib/admin-landing-pages";
import type { LandingPageBodyBlock } from "@/lib/landing-pages";
import { AdminDownloadUploadButton } from "@/components/admin-download-upload-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingPageBlockEditor } from "../landing-page-block-editor";

/**
 * Added session 60, correcting T7.5's original create-only scope (`memory/decision-log.md`,
 * session 48 and session 60) — every field is editable here except the URL `slug`, shown as
 * a fixed reference rather than an input: see `lib/admin-landing-pages.ts`'s
 * `updateLandingPage` doc-comment for why the URL stays fixed once a page is live. Deliberately
 * mirrors `NewLandingPageForm`'s field set and layout rather than sharing a component with
 * it — the two forms differ in exactly one field (an editable slug input vs. a fixed slug
 * display) plus their submit verb/endpoint, and this project's own precedent
 * (`LandingPageBlockEditor` vs. `LegalBlockEditor`) already favors small, deliberate
 * duplication over a one-time-reuse abstraction for a difference this narrow.
 */
export function EditLandingPageForm({ initial }: { initial: LandingPageDetail }) {
  const [kicker, setKicker] = useState(initial.kicker);
  const [headline, setHeadline] = useState(initial.headline);
  const [openingParagraph, setOpeningParagraph] = useState(initial.openingParagraph);
  const [bodyContent, setBodyContent] = useState<LandingPageBodyBlock[]>(initial.bodyContent);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaHref, setCtaHref] = useState(initial.ctaHref);
  const [downloadFileUrl, setDownloadFileUrl] = useState<string | null>(initial.downloadFileUrl);
  const [campaignReference, setCampaignReference] = useState(initial.campaignReference);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/landing-pages/${initial.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kicker,
          headline,
          openingParagraph,
          bodyContent,
          ctaLabel,
          ctaHref,
          downloadFileUrl,
          campaignReference,
          metaTitle,
          metaDescription,
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
        <FieldLabel>
          URL{" "}
          <span className="text-muted-foreground font-normal">
            fixed once created — a new URL means a new landing page
          </span>
        </FieldLabel>
        <p className="text-muted-foreground font-mono text-sm">kaalbert.com/lp/{initial.slug}</p>
      </Field>

      <Field>
        <FieldLabel htmlFor="lpKicker">Kicker</FieldLabel>
        <Input id="lpKicker" value={kicker} onChange={(e) => setKicker(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lpHeadline">Headline</FieldLabel>
        <Input id="lpHeadline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lpOpening">Opening paragraph</FieldLabel>
        <Textarea
          id="lpOpening"
          rows={3}
          value={openingParagraph}
          onChange={(e) => setOpeningParagraph(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>Body content</FieldLabel>
        <LandingPageBlockEditor blocks={bodyContent} onChange={setBodyContent} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="lpCtaLabel">Call-to-action label</FieldLabel>
          <Input id="lpCtaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="lpCtaHref">
            Call-to-action link{" "}
            <span className="text-muted-foreground font-normal">
              the real destination, used even when a download file is set below
            </span>
          </FieldLabel>
          <Input id="lpCtaHref" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
        </Field>
      </div>

      <Field>
        <FieldLabel>
          Download file{" "}
          <span className="text-muted-foreground font-normal">
            optional — a PDF checklist, when this campaign&apos;s CTA is a download rather than a
            page link
          </span>
        </FieldLabel>
        {downloadFileUrl ? (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">A file is attached.</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDownloadFileUrl(null)}
            >
              Remove
            </Button>
          </div>
        ) : (
          <AdminDownloadUploadButton onUploaded={setDownloadFileUrl} className="w-fit" />
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="lpCampaignRef">
          Campaign reference{" "}
          <span className="text-muted-foreground font-normal">
            internal tracking only, never shown on the page
          </span>
        </FieldLabel>
        <Input
          id="lpCampaignRef"
          value={campaignReference}
          onChange={(e) => setCampaignReference(e.target.value)}
          placeholder="e.g. SM/2026-09"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="lpMetaTitle">Meta title</FieldLabel>
          <Input
            id="lpMetaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="lpMetaDescription">Meta description</FieldLabel>
          <Input
            id="lpMetaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </Field>
      </div>

      <div className="border-border bg-card flex items-start gap-2 rounded-md border p-4">
        <Checkbox
          id="lpCompliance"
          checked={complianceChecked}
          onCheckedChange={(checked) => setComplianceChecked(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="lpCompliance" className="text-sm leading-snug font-normal">
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
        Save changes
      </Button>
    </div>
  );
}
