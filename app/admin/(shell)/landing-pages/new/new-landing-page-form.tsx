"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { LandingPageBodyBlock } from "@/lib/landing-pages";
import { AdminDownloadUploadButton } from "@/components/admin-download-upload-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingPageBlockEditor } from "../landing-page-block-editor";

/**
 * Create-only (`landing-page-template.md`'s FR-4.3: "a non-technical partner can create a
 * new landing page instance from the template without vendor involvement" — the literal
 * AC-6 bar, no editing of an already-live campaign page in this task's scope). The URL slug
 * is a real field here, not auto-derived from the headline the way `Article.slug` is — a
 * campaign landing page's URL is deliberately chosen to match the ad/print/QR copy that
 * points at it, closer to `Category.slug`'s "partner-authored, partner-visible, worth
 * surfacing a collision inline" precedent than to an article's incidental permalink.
 */
export function NewLandingPageForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [kicker, setKicker] = useState("");
  const [headline, setHeadline] = useState("");
  const [openingParagraph, setOpeningParagraph] = useState("");
  const [bodyContent, setBodyContent] = useState<LandingPageBodyBlock[]>([]);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [downloadFileUrl, setDownloadFileUrl] = useState<string | null>(null);
  const [campaignReference, setCampaignReference] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
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
      const data: { status: string; slug?: string; message?: string } = await response.json();
      if (!response.ok || !data.slug) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      router.push("/admin/landing-pages");
      router.refresh();
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
        <FieldLabel htmlFor="lpSlug">
          URL slug{" "}
          <span className="text-muted-foreground font-normal">
            kaalbert.com/lp/&#8203;{slugPreview(slug)}
          </span>
        </FieldLabel>
        <Input
          id="lpSlug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. spring-2026-promo"
        />
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
        onClick={handleCreate}
        className="w-fit"
      >
        Create landing page
      </Button>
    </div>
  );
}

/**
 * Duplicates `lib/categories.ts`'s `slugify` logic rather than importing it — that file also
 * imports `@/lib/prisma`, and CLAUDE.md's rule against a `"use client"` component importing
 * a value from a `@/lib/prisma`-importing `lib/` file applies here. This is a preview only;
 * the real, authoritative slugify runs server-side in `lib/admin-landing-pages.ts`.
 */
function slugPreview(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "your-slug"
  );
}
