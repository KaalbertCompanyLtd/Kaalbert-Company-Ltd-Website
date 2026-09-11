/**
 * Client-safe types/data for `/diagnostic`'s flow (T3.4) — deliberately its own file, with no
 * import of `@/lib/prisma`, so `components/diagnostic-flow.tsx` ("use client") can import
 * these values without dragging server-only Prisma/driver-adapter code into the client
 * bundle. `lib/diagnostic-flow.ts` (the DB-querying half, imported only by the Server
 * Component `app/diagnostic/page.tsx`) re-exports `DiagnosticFlowQuestion` from here rather
 * than redeclaring it, so there's exactly one definition.
 */
export interface DiagnosticChoiceOption {
  label: string;
  /** Already normalized to 0–1 as a string — the same convention every answer submits in. */
  value: string;
}

export interface DiagnosticFlowQuestion {
  id: number;
  dimensionId: number;
  dimensionName: string;
  order: number;
  promptText: string;
  responseType: "scale" | "boolean" | "choice";
  /**
   * Only present when `responseType` is `choice` — resolved server-side from
   * `DiagnosticQuestion.choiceOptions` (T7.7, session 50) and carried on each question object
   * rather than looked up client-side, since this data now lives behind `@/lib/prisma`. Null
   * for `scale`/`boolean` questions, whose option sets are the fixed constants below.
   */
  choiceOptions: DiagnosticChoiceOption[] | null;
}

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
