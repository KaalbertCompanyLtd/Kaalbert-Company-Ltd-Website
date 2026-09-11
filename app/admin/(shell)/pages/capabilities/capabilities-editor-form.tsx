"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CapabilitiesPageData } from "@/lib/admin-pages";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * `capabilities-page.md`'s own business rule ("exactly eight service line summaries") means
 * this form edits eight fixed rows in place — no add/remove control, unlike T7.2's article
 * body blocks. `slug` renders read-only (the live `/contact?service=[slug]` lookup key,
 * `lib/contact.ts`'s `resolveServiceContext`) — same "identity fields stay frozen" precedent
 * as `Article.slug`. The compliance checkbox gates the Save button itself, not a separate
 * publish action: `Page`/`Capability` have no draft/live distinction, so a save here *is*
 * the publish moment FR-5.4's sign-off gate is meant to catch.
 */
export function CapabilitiesEditorForm({ initial }: { initial: CapabilitiesPageData }) {
  const router = useRouter();
  const [heroKicker, setHeroKicker] = useState(initial.heroKicker);
  const [heroHeading, setHeroHeading] = useState(initial.heroHeading);
  const [heroLead, setHeroLead] = useState(initial.heroLead);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [capabilities, setCapabilities] = useState(initial.capabilities);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateCapability(id: number, field: "name" | "shortDescription", value: string) {
    setCapabilities(capabilities.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/pages/capabilities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroKicker,
          heroHeading,
          heroLead,
          metaTitle,
          metaDescription,
          complianceChecked,
          capabilities: capabilities.map((c) => ({
            id: c.id,
            name: c.name,
            shortDescription: c.shortDescription,
            order: c.order,
          })),
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      router.refresh();
      setStatus("idle");
      setComplianceChecked(false);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div>
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-5 rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="border-border bg-card mb-6 flex flex-col gap-5 rounded-md border p-6">
        <h2 className="text-sm font-semibold">Hero</h2>
        <Field>
          <FieldLabel htmlFor="heroKicker">Kicker</FieldLabel>
          <Input
            id="heroKicker"
            value={heroKicker}
            onChange={(e) => setHeroKicker(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="heroHeading">Heading</FieldLabel>
          <Input
            id="heroHeading"
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="heroLead">Lead</FieldLabel>
          <Textarea
            id="heroLead"
            rows={2}
            value={heroLead}
            onChange={(e) => setHeroLead(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="metaTitle">Meta title</FieldLabel>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="metaDescription">Meta description</FieldLabel>
            <Input
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="border-border bg-card mb-6 flex flex-col gap-5 rounded-md border p-6">
        <h2 className="text-sm font-semibold">The eight service lines</h2>
        {capabilities.map((capability) => (
          <div key={capability.id} className="border-border rounded-sm border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted-foreground font-mono text-xs">{capability.slug}</span>
            </div>
            <div className="flex flex-col gap-3">
              <Field>
                <FieldLabel htmlFor={`cap-name-${capability.id}`}>Name</FieldLabel>
                <Input
                  id={`cap-name-${capability.id}`}
                  value={capability.name}
                  onChange={(e) => updateCapability(capability.id, "name", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`cap-desc-${capability.id}`}>Short description</FieldLabel>
                <Textarea
                  id={`cap-desc-${capability.id}`}
                  rows={2}
                  value={capability.shortDescription}
                  onChange={(e) =>
                    updateCapability(capability.id, "shortDescription", e.target.value)
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="border-border bg-card mb-6 flex items-start gap-2 rounded-md border p-5">
        <Checkbox
          id="complianceCheck"
          checked={complianceChecked}
          onCheckedChange={(checked) => setComplianceChecked(checked === true)}
          className="mt-0.5"
        />
        <FieldLabel htmlFor="complianceCheck" className="text-sm leading-snug font-normal">
          This complies with 10.05 Positioning and Claims Guidance Note
        </FieldLabel>
      </div>

      <Button
        type="button"
        disabled={!complianceChecked || status === "saving"}
        title={!complianceChecked ? "Confirm 10.05 compliance first" : undefined}
        onClick={handleSave}
      >
        Save
      </Button>
    </div>
  );
}
