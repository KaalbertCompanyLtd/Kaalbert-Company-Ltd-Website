"use client";

import { useState } from "react";

import type { DiagnosticConfigurationData, DiagnosticScoreBandRow } from "@/lib/admin-diagnostic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * `ui/mockups/g-admin-content/admin-diagnostic-configuration.html`'s three panels (weights,
 * overall triage thresholds, per-dimension override) plus a fourth score-bands panel added by
 * the session-22/23 addenda after that mockup was built — no dedicated mockup for it, styled
 * to match the other three `config-panel` cards. Two independent saves (weights+thresholds vs.
 * score bands) rather than one combined submit, since the mockup's own "Save configuration"
 * button only ever covered the first three panels and the two concerns have unrelated
 * validation (weights summing to 100% vs. per-band text requirements).
 */
export function ConfigurationClient({
  initial,
  initialScoreBands,
}: {
  initial: DiagnosticConfigurationData;
  initialScoreBands: DiagnosticScoreBandRow[];
}) {
  const [weights, setWeights] = useState(
    initial.dimensions.map((d) => ({ id: d.id, name: d.name, weight: d.weight })),
  );
  const [overallThresholds, setOverallThresholds] = useState(initial.overallThresholds);
  const [perDimensionThresholds, setPerDimensionThresholds] = useState(
    initial.perDimensionThresholds,
  );
  const [configStatus, setConfigStatus] = useState<"idle" | "saving" | "error">("idle");
  const [configError, setConfigError] = useState<string | null>(null);

  const [scoreBands, setScoreBands] = useState(initialScoreBands);
  const [bandsStatus, setBandsStatus] = useState<"idle" | "saving" | "error">("idle");
  const [bandsError, setBandsError] = useState<string | null>(null);

  const weightTotal = weights.reduce((sum, w) => sum + (w.weight || 0), 0);
  const balanced = weightTotal === 100;

  const highThreshold = overallThresholds.find((t) => t.triagePriorityLevel === "High");
  const mediumThreshold = overallThresholds.find((t) => t.triagePriorityLevel === "Medium");

  async function handleSaveConfiguration() {
    setConfigStatus("saving");
    setConfigError(null);
    try {
      const response = await fetch("/api/admin/diagnostic-configuration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionWeights: weights.map((w) => ({ id: w.id, weight: w.weight })),
          overallThresholds: overallThresholds.map((t) => ({
            id: t.id,
            thresholdValue: t.thresholdValue,
            triagePriorityLevel: t.triagePriorityLevel,
          })),
          perDimensionThresholds: perDimensionThresholds.map((t) => ({
            id: t.id,
            thresholdValue: t.thresholdValue,
          })),
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setConfigStatus("error");
        setConfigError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setConfigStatus("idle");
    } catch {
      setConfigStatus("error");
      setConfigError("Something went wrong — check your connection and try again.");
    }
  }

  async function handleSaveScoreBands() {
    setBandsStatus("saving");
    setBandsError(null);
    try {
      const response = await fetch("/api/admin/diagnostic-score-bands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreBands),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setBandsStatus("error");
        setBandsError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setBandsStatus("idle");
    } catch {
      setBandsStatus("error");
      setBandsError("Something went wrong — check your connection and try again.");
    }
  }

  function updateBand(
    id: number,
    field: keyof DiagnosticScoreBandRow,
    value: string | number | boolean,
  ) {
    setScoreBands(scoreBands.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  return (
    <div className="flex max-w-[780px] flex-col gap-6">
      {configError && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {configError}
        </p>
      )}

      <div className="border-border bg-card rounded-md border p-6">
        <h2 className="text-h4 text-primary font-semibold">Dimension weights</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          How much each dimension counts toward the overall score. Must total 100% before this can
          be saved.
        </p>
        {weights.map((w) => (
          <div
            key={w.id}
            className="border-border grid grid-cols-[1fr_100px] items-center gap-3 border-b py-2 last:border-b-0"
          >
            <span className="text-sm">{w.name}</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={w.weight}
              onChange={(e) =>
                setWeights(
                  weights.map((x) =>
                    x.id === w.id ? { ...x, weight: Number(e.target.value) } : x,
                  ),
                )
              }
              className="text-right font-mono"
            />
          </div>
        ))}
        <div
          className={`mt-2 flex justify-between border-t-2 pt-3.5 font-bold ${
            balanced ? "border-border text-pine-500" : "border-border text-accent"
          }`}
        >
          <span>Total</span>
          <span>
            {weightTotal}%{" "}
            {!balanced && <span className="text-accent text-xs font-normal">must total 100%</span>}
          </span>
        </div>
      </div>

      <div className="border-border bg-card rounded-md border p-6">
        <h2 className="text-h4 text-primary font-semibold">Triage priority — overall score</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          A completed diagnostic is flagged by how much attention it needs — a lower score means
          more urgency, not less.
        </p>
        {highThreshold && (
          <div className="border-border grid grid-cols-[140px_1fr_90px] items-center gap-3.5 border-b py-3">
            <Badge className="bg-destructive text-destructive-foreground w-fit">
              High priority
            </Badge>
            <span className="text-sm">Overall score below</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={highThreshold.thresholdValue}
              onChange={(e) =>
                setOverallThresholds(
                  overallThresholds.map((t) =>
                    t.id === highThreshold.id
                      ? { ...t, thresholdValue: Number(e.target.value) }
                      : t,
                  ),
                )
              }
              className="text-right font-mono"
            />
          </div>
        )}
        {mediumThreshold && (
          <div className="border-border grid grid-cols-[140px_1fr_90px] items-center gap-3.5 border-b py-3">
            <Badge className="bg-accent text-accent-foreground w-fit">Medium priority</Badge>
            <span className="text-sm">Overall score below</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={mediumThreshold.thresholdValue}
              onChange={(e) =>
                setOverallThresholds(
                  overallThresholds.map((t) =>
                    t.id === mediumThreshold.id
                      ? { ...t, thresholdValue: Number(e.target.value) }
                      : t,
                  ),
                )
              }
              className="text-right font-mono"
            />
          </div>
        )}
        <div className="grid grid-cols-[140px_1fr_90px] items-center gap-3.5 py-3">
          <Badge variant="outline" className="w-fit">
            Low priority
          </Badge>
          <span className="text-sm">
            Overall score {mediumThreshold?.thresholdValue ?? "—"} and above
          </span>
          <Input disabled value="—" className="bg-muted text-muted-foreground text-right" />
        </div>
      </div>

      <div className="border-border bg-card rounded-md border p-6">
        <h2 className="text-h4 text-primary font-semibold">Per-dimension override</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Flag High priority regardless of overall score, if any one dimension falls below its own
          threshold — a business can look fine overall and still have one critical gap.
        </p>
        {perDimensionThresholds.map((t) => (
          <div
            key={t.id}
            className="border-border grid grid-cols-[1fr_140px] items-center gap-3 border-b py-2.5 text-sm last:border-b-0"
          >
            <span>{t.dimensionName}</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={t.thresholdValue}
              onChange={(e) =>
                setPerDimensionThresholds(
                  perDimensionThresholds.map((x) =>
                    x.id === t.id ? { ...x, thresholdValue: Number(e.target.value) } : x,
                  ),
                )
              }
              className="text-right font-mono"
            />
          </div>
        ))}
        <p className="text-muted-foreground mt-2 text-xs italic">
          Values are the &quot;flag if below&quot; threshold, in percent — always flagged as High
          priority.
        </p>
      </div>

      <Button
        type="button"
        disabled={!balanced || configStatus === "saving"}
        onClick={handleSaveConfiguration}
        className="w-fit"
      >
        Save configuration
      </Button>

      <hr className="border-border" />

      {bandsError && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {bandsError}
        </p>
      )}

      <div className="border-border bg-card flex flex-col gap-6 rounded-md border p-6">
        <div>
          <h2 className="text-h4 text-primary font-semibold">Score bands</h2>
          <p className="text-muted-foreground text-sm">
            What a visitor sees on the results page (statement) and the fuller narrative sent in the
            summary email (email detail), per minimum overall score.
          </p>
        </div>
        {scoreBands.map((band) => (
          <div
            key={band.id}
            className="border-border flex flex-col gap-3 border-b pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Field className="max-w-[100px]">
                <FieldLabel htmlFor={`band-min-${band.id}`}>Min score</FieldLabel>
                <Input
                  id={`band-min-${band.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={band.minScore}
                  onChange={(e) => updateBand(band.id, "minScore", Number(e.target.value))}
                  className="text-right font-mono"
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor={`band-label-${band.id}`}>Label</FieldLabel>
                <Input
                  id={`band-label-${band.id}`}
                  value={band.label}
                  onChange={(e) => updateBand(band.id, "label", e.target.value)}
                />
              </Field>
              <div className="flex items-center gap-2 self-end pb-2">
                <Switch
                  checked={band.isPlaceholder}
                  onCheckedChange={(checked) => updateBand(band.id, "isPlaceholder", checked)}
                  aria-label="Placeholder content"
                />
                <span className="text-muted-foreground text-xs">Placeholder</span>
              </div>
            </div>
            <Field>
              <FieldLabel htmlFor={`band-statement-${band.id}`}>
                On-screen statement{" "}
                <span className="text-muted-foreground font-normal">/diagnostic/results</span>
              </FieldLabel>
              <Textarea
                id={`band-statement-${band.id}`}
                rows={2}
                value={band.statement}
                onChange={(e) => updateBand(band.id, "statement", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`band-email-${band.id}`}>
                Email detail{" "}
                <span className="text-muted-foreground font-normal">summary email only</span>
              </FieldLabel>
              <Textarea
                id={`band-email-${band.id}`}
                rows={3}
                value={band.emailDetail}
                onChange={(e) => updateBand(band.id, "emailDetail", e.target.value)}
              />
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        disabled={bandsStatus === "saving"}
        onClick={handleSaveScoreBands}
        className="w-fit"
      >
        Save score bands
      </Button>
    </div>
  );
}
