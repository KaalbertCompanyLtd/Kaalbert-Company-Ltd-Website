"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OurMethodPageData } from "@/lib/admin-pages";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STAGE_NAMES = ["Discover", "Diagnose", "Design", "Deliver"];

/**
 * `our-method-page.md`'s "all four stages" business rule means this form edits four fixed
 * rows in a fixed, meaningful sequence — no add/remove/reorder control (unlike
 * Capabilities' own order field), since Discover → Diagnose → Design → Deliver is the firm's
 * actual method, not an arbitrary display order. `name`/`order` render read-only for the
 * same reason. Same compliance-gates-the-save-itself design as the Capabilities editor.
 */
export function OurMethodEditorForm({ initial }: { initial: OurMethodPageData }) {
  const router = useRouter();
  const [heroKicker, setHeroKicker] = useState(initial.heroKicker);
  const [heroHeading, setHeroHeading] = useState(initial.heroHeading);
  const [heroLead, setHeroLead] = useState(initial.heroLead);
  const [introCopy, setIntroCopy] = useState(initial.introCopy);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [stages, setStages] = useState(initial.stages);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateStage(
    id: number,
    field:
      "description" | "whatHappens" | "clientSees" | "decisionPoint" | "capabilityTransferNote",
    value: string,
  ) {
    setStages(stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/pages/our-method", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroKicker,
          heroHeading,
          heroLead,
          introCopy,
          metaTitle,
          metaDescription,
          complianceChecked,
          stages: stages.map((s) => ({
            id: s.id,
            description: s.description,
            whatHappens: s.whatHappens,
            clientSees: s.clientSees,
            decisionPoint: s.decisionPoint,
            capabilityTransferNote: s.capabilityTransferNote,
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
        <h2 className="text-sm font-semibold">Hero &amp; intro</h2>
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
        <Field>
          <FieldLabel htmlFor="introCopy">
            Intro copy{" "}
            <span className="text-muted-foreground font-normal">
              the three core-offer names are auto-linked wherever they appear
            </span>
          </FieldLabel>
          <Textarea
            id="introCopy"
            rows={3}
            value={introCopy}
            onChange={(e) => setIntroCopy(e.target.value)}
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
        <h2 className="text-sm font-semibold">The four stages</h2>
        {stages.map((stage) => (
          <div key={stage.id} className="border-border rounded-sm border p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {String(stage.order).padStart(2, "0")}
              </span>
              <span className="font-semibold">{STAGE_NAMES[stage.order - 1] ?? stage.name}</span>
            </div>
            <div className="flex flex-col gap-3">
              <Field>
                <FieldLabel htmlFor={`stage-desc-${stage.id}`}>Description</FieldLabel>
                <Textarea
                  id={`stage-desc-${stage.id}`}
                  rows={2}
                  value={stage.description}
                  onChange={(e) => updateStage(stage.id, "description", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={`stage-what-${stage.id}`}>What happens</FieldLabel>
                  <Textarea
                    id={`stage-what-${stage.id}`}
                    rows={2}
                    value={stage.whatHappens}
                    onChange={(e) => updateStage(stage.id, "whatHappens", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`stage-sees-${stage.id}`}>What the client sees</FieldLabel>
                  <Textarea
                    id={`stage-sees-${stage.id}`}
                    rows={2}
                    value={stage.clientSees}
                    onChange={(e) => updateStage(stage.id, "clientSees", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`stage-decision-${stage.id}`}>Decision point</FieldLabel>
                  <Textarea
                    id={`stage-decision-${stage.id}`}
                    rows={2}
                    value={stage.decisionPoint}
                    onChange={(e) => updateStage(stage.id, "decisionPoint", e.target.value)}
                  />
                </Field>
              </div>
              {stage.capabilityTransferNote !== null && (
                <Field>
                  <FieldLabel htmlFor={`stage-transfer-${stage.id}`}>
                    Capability transfer note{" "}
                    <span className="text-muted-foreground font-normal">Deliver stage only</span>
                  </FieldLabel>
                  <Textarea
                    id={`stage-transfer-${stage.id}`}
                    rows={2}
                    value={stage.capabilityTransferNote}
                    onChange={(e) =>
                      updateStage(stage.id, "capabilityTransferNote", e.target.value)
                    }
                  />
                </Field>
              )}
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
