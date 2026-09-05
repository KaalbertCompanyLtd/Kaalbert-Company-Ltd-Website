/**
 * The one, shared `window.dataLayer.push(...)` mechanism for every conversion event fired
 * from the client (ADR 0006, CLAUDE.md's Recurring Patterns: "every conversion moment fires
 * through the existing GTM `dataLayer` pattern"). `/contact`'s form (`enquiry_submitted`) and
 * its WhatsApp link (`whatsapp_opened`) are the first real callers — later tasks (the
 * diagnostic's `diagnostic_started`/`diagnostic_completed`/`summary_requested`, landing pages'
 * `checklist_downloaded`) reuse this same function rather than inventing a second push
 * mechanism.
 *
 * `window.dataLayer` may not exist yet (GTM container unset per T1.6/`memory/technical-debt.md`
 * → "GTM container not yet provisioned") — pushing to a lazily-created array here means every
 * event is queued regardless, and GTM (once provisioned) reads the array from the start rather
 * than only events fired after its own script loads.
 */
export type DataLayerEvent =
  | "diagnostic_started"
  | "diagnostic_completed"
  | "summary_requested"
  | "checklist_downloaded"
  | "enquiry_submitted"
  | "whatsapp_opened";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function pushDataLayerEvent(event: DataLayerEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });
}
