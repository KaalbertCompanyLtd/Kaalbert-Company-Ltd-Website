"use client";

import { useState } from "react";

import type { LegalPageBlock } from "@/lib/legal";
import type { FooterContentData, LegalPageEditData } from "@/lib/admin-legal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalBlockEditor } from "./legal-block-editor";

/**
 * No 10.05-compliance checkbox on the legal-page save (see `lib/admin-legal.ts`'s
 * `updateLegalPage` doc-comment for why) — the existing `isPlaceholder`/"Draft — pending
 * legal review" marker (T2.7) is this content type's own real gate instead, surfaced here as
 * an editable checkbox rather than a read-only badge.
 */
export function LegalAdminClient({
  initialPages,
  initialFooterContent,
}: {
  initialPages: LegalPageEditData[];
  initialFooterContent: FooterContentData;
}) {
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug ?? "");
  const [pages, setPages] = useState(initialPages);
  const selectedPage = pages.find((p) => p.slug === selectedSlug) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border bg-card rounded-md border p-6">
        <h2 className="mb-4 text-sm font-semibold">Legal pages</h2>
        <Select
          value={selectedSlug}
          onValueChange={(value) => value && setSelectedSlug(value)}
          items={Object.fromEntries(pages.map((p) => [p.slug, p.title]))}
        >
          <SelectTrigger className="mb-5 w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p) => (
              <SelectItem key={p.slug} value={p.slug}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPage && (
          <LegalPageEditor
            key={selectedPage.slug}
            page={selectedPage}
            onSaved={(updated) =>
              setPages(pages.map((p) => (p.slug === updated.slug ? updated : p)))
            }
          />
        )}
      </div>

      <FooterContentEditor initial={initialFooterContent} />
    </div>
  );
}

function LegalPageEditor({
  page,
  onSaved,
}: {
  page: LegalPageEditData;
  onSaved: (page: LegalPageEditData) => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [metaDescription, setMetaDescription] = useState(page.metaDescription);
  const [isPlaceholder, setIsPlaceholder] = useState(page.isPlaceholder);
  const [body, setBody] = useState<LegalPageBlock[]>(page.body);
  const [lastRevisedAt, setLastRevisedAt] = useState(page.lastRevisedAt);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/legal/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, metaDescription, isPlaceholder, body }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      const newLastRevisedAt = isPlaceholder ? lastRevisedAt : new Date();
      setLastRevisedAt(newLastRevisedAt);
      setStatus("idle");
      onSaved({
        slug: page.slug,
        title,
        metaDescription,
        isPlaceholder,
        body,
        lastRevisedAt: newLastRevisedAt,
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

      <div className="flex items-center gap-2">
        {isPlaceholder ? (
          <Badge variant="outline">Draft — pending legal review</Badge>
        ) : (
          <Badge className="bg-pine-500 text-primary-foreground">Reviewed</Badge>
        )}
        <span className="text-muted-foreground text-xs">
          {lastRevisedAt
            ? `Last revised ${lastRevisedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
            : "Pending first publication"}
        </span>
      </div>

      <Field>
        <FieldLabel htmlFor="legalTitle">Title</FieldLabel>
        <Input id="legalTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel htmlFor="legalMetaDesc">Meta description</FieldLabel>
        <Input
          id="legalMetaDesc"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>Body</FieldLabel>
        <LegalBlockEditor blocks={body} onChange={setBody} />
      </Field>

      <div className="flex items-start gap-2">
        <Checkbox
          id="isPlaceholder"
          checked={isPlaceholder}
          onCheckedChange={(checked) => setIsPlaceholder(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="isPlaceholder" className="text-sm leading-snug font-normal">
          Still a draft — pending legal review (uncheck once the firm&apos;s counsel has confirmed
          this wording as final)
        </FieldLabel>
      </div>

      <Button type="button" disabled={status === "saving"} onClick={handleSave} className="w-fit">
        Save
      </Button>
    </div>
  );
}

function FooterContentEditor({ initial }: { initial: FooterContentData }) {
  const [scopeOfPracticeStatement, setScopeOfPracticeStatement] = useState(
    initial.scopeOfPracticeStatement,
  );
  const [companyRegistrationDetails, setCompanyRegistrationDetails] = useState(
    initial.companyRegistrationDetails ?? "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/footer-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeOfPracticeStatement,
          companyRegistrationDetails: companyRegistrationDetails || null,
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
    <div className="border-border bg-card rounded-md border p-6">
      <h2 className="mb-1 text-sm font-semibold">Footer content</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        Shown site-wide in the footer, on every page including landing pages (FR-5.1) — a single
        source, not edited per page.
      </p>

      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="scopeStatement">Scope-of-practice statement</FieldLabel>
          <Textarea
            id="scopeStatement"
            rows={3}
            value={scopeOfPracticeStatement}
            onChange={(e) => setScopeOfPracticeStatement(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="regDetails">
            Company registration details{" "}
            <span className="text-muted-foreground font-normal">
              omitted from the footer entirely while blank
            </span>
          </FieldLabel>
          <Input
            id="regDetails"
            value={companyRegistrationDetails}
            onChange={(e) => setCompanyRegistrationDetails(e.target.value)}
          />
        </Field>
      </div>

      <Button
        type="button"
        disabled={status === "saving"}
        onClick={handleSave}
        className="mt-4 w-fit"
      >
        Save
      </Button>
    </div>
  );
}
