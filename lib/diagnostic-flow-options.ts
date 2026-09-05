/**
 * Client-safe types/data for `/diagnostic`'s flow (T3.4) — deliberately its own file, with no
 * import of `@/lib/prisma`, so `components/diagnostic-flow.tsx` ("use client") can import
 * these values without dragging server-only Prisma/driver-adapter code into the client
 * bundle. `lib/diagnostic-flow.ts` (the DB-querying half, imported only by the Server
 * Component `app/diagnostic/page.tsx`) re-exports `DiagnosticFlowQuestion` from here rather
 * than redeclaring it, so there's exactly one definition.
 */
export interface DiagnosticFlowQuestion {
  id: number;
  dimensionId: number;
  dimensionName: string;
  order: number;
  promptText: string;
  responseType: "scale" | "boolean" | "choice";
}

export interface DiagnosticChoiceOption {
  label: string;
  /** Already normalized to 0–1 as a string — the same convention every answer submits in. */
  value: string;
}

/**
 * Each `choice`-type question's option labels, mapped to the same 0–1 normalized value
 * `lib/diagnostic-scoring.ts` expects every answer to already carry (decided at T3.2) —
 * carried over verbatim from `prisma/seed.ts`'s own per-question comments, since
 * `diagnostic_question` has no column to store this mapping (see
 * `memory/technical-debt.md`'s "`diagnostic_question` has no queryable `is_placeholder`
 * column" entry for the related, already-logged gap — this is the same underlying limitation).
 * Keyed by `${dimensionId}-${order}`, the same natural key `prisma/seed.ts` upserts questions
 * on, rather than a raw database `id` (autoincrement-assigned, not a value this file should
 * assume a fixed number for).
 */
const DIAGNOSTIC_CHOICE_OPTIONS: Record<string, DiagnosticChoiceOption[]> = {
  // Structure, order 1 — "Is the business formally registered...?"
  "1-1": [
    { label: "Yes", value: "1" },
    { label: "In progress", value: "0.5" },
    { label: "Not yet", value: "0" },
  ],
  // Records, order 1 — "Do you keep a record of sales...?"
  "2-1": [
    { label: "Regular record-keeping", value: "1" },
    { label: "Rough notes", value: "0.5" },
    { label: "No record", value: "0" },
  ],
  // Records, order 3 — "How many months back could you produce...?"
  "2-3": [
    { label: "12 months or more", value: "1" },
    { label: "3–12 months", value: "0.66" },
    { label: "1–3 months", value: "0.33" },
    { label: "Less than 1 month", value: "0" },
  ],
  // Funding Readiness, order 1 — "Has the business applied for a loan...?"
  "4-1": [
    { label: "Applied, successful", value: "1" },
    { label: "Applied, not successful", value: "0.5" },
    { label: "Never applied", value: "0" },
  ],
};

/** Every 1–5 scale question renders these same 5 buttons (mockup: `v / 5`, T3.2's convention). */
export const DIAGNOSTIC_SCALE_OPTIONS: DiagnosticChoiceOption[] = [
  { label: "1", value: "0.2" },
  { label: "2", value: "0.4" },
  { label: "3", value: "0.6" },
  { label: "4", value: "0.8" },
  { label: "5", value: "1" },
];

/** Every boolean question renders these same 2 buttons (mockup/T3.2's convention: Yes=1, No=0). */
export const DIAGNOSTIC_BOOLEAN_OPTIONS: DiagnosticChoiceOption[] = [
  { label: "Yes", value: "1" },
  { label: "No", value: "0" },
];

/** Throws if a `choice` question has no configured options — a seed/config bug (T3.3/T7.7's job to fix), not a visitor-facing state. */
export function getChoiceOptions(dimensionId: number, order: number): DiagnosticChoiceOption[] {
  const options = DIAGNOSTIC_CHOICE_OPTIONS[`${dimensionId}-${order}`];
  if (!options) {
    throw new Error(
      `No choice options configured for dimensionId=${dimensionId} order=${order} — see lib/diagnostic-flow-options.ts's DIAGNOSTIC_CHOICE_OPTIONS.`,
    );
  }
  return options;
}
