import { NextResponse } from "next/server";

import {
  DiagnosticConfigValidationError,
  updateDiagnosticConfiguration,
} from "@/lib/admin-diagnostic";
import type { DiagnosticConfigurationSaveInput } from "@/lib/admin-diagnostic";

function parseWeights(value: unknown): DiagnosticConfigurationSaveInput["dimensionWeights"] | null {
  if (!Array.isArray(value)) return null;
  const rows: DiagnosticConfigurationSaveInput["dimensionWeights"] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "number" || typeof r.weight !== "number") return null;
    rows.push({ id: r.id, weight: r.weight });
  }
  return rows;
}

function parseOverallThresholds(
  value: unknown,
): DiagnosticConfigurationSaveInput["overallThresholds"] | null {
  if (!Array.isArray(value)) return null;
  const rows: DiagnosticConfigurationSaveInput["overallThresholds"] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (
      typeof r.id !== "number" ||
      typeof r.thresholdValue !== "number" ||
      typeof r.triagePriorityLevel !== "string"
    ) {
      return null;
    }
    rows.push({
      id: r.id,
      thresholdValue: r.thresholdValue,
      triagePriorityLevel: r.triagePriorityLevel,
    });
  }
  return rows;
}

function parsePerDimensionThresholds(
  value: unknown,
): DiagnosticConfigurationSaveInput["perDimensionThresholds"] | null {
  if (!Array.isArray(value)) return null;
  const rows: DiagnosticConfigurationSaveInput["perDimensionThresholds"] = [];
  for (const row of value) {
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "number" || typeof r.thresholdValue !== "number") return null;
    rows.push({ id: r.id, thresholdValue: r.thresholdValue });
  }
  return rows;
}

function parseInput(body: unknown): DiagnosticConfigurationSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const c = body as Record<string, unknown>;

  const dimensionWeights = parseWeights(c.dimensionWeights);
  const overallThresholds = parseOverallThresholds(c.overallThresholds);
  const perDimensionThresholds = parsePerDimensionThresholds(c.perDimensionThresholds);
  if (!dimensionWeights || !overallThresholds || !perDimensionThresholds) {
    return null;
  }

  return { dimensionWeights, overallThresholds, perDimensionThresholds };
}

/**
 * `PATCH /api/admin/diagnostic-configuration` — request: `DiagnosticConfigurationSaveInput`;
 * response: `{status}`. One purpose-built route for the whole screen's single "Save
 * configuration" action (`ui/mockups/g-admin-content/admin-diagnostic-configuration.html`)
 * rather than the feature doc's originally-sketched separate `PATCH /api/admin/diagnostic-
 * dimensions/[id]` / `PATCH /api/admin/diagnostic-thresholds/[id]` routes — same deviation
 * precedent T7.3/T7.4 already established for a screen whose real save action is inherently
 * one combined operation over several rows, not N separate per-row requests. Parses the
 * request and shapes the response only — every validation/gating rule (including the
 * weights-must-total-100% check) lives in `lib/admin-diagnostic.ts`'s
 * `updateDiagnosticConfiguration`.
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    await updateDiagnosticConfiguration(input);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    if (error instanceof DiagnosticConfigValidationError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
