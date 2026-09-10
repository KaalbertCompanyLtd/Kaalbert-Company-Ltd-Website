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

/**
 * Google's consent-mode `dataLayer.push(['consent', 'update', {...}])` command shape (T5.3,
 * measurement-and-attribution.md's FR-7.2) — distinct from `pushDataLayerEvent`'s
 * `{event, ...payload}` shape, since GTM/GA4 read consent commands as a 3-element array, not
 * an event object. The container's own "Consent Default" tag (fired on GTM's Consent
 * Initialization trigger) sets every signal to `denied` by default before any other tag can
 * fire; this function is only ever called after a visitor has made an explicit choice on the
 * site's cookie banner. Declining still lets every Google tag fire in Google's own "modelled"
 * state — never blocked outright — satisfying "the firm retains modelled measurement from
 * visitors who decline."
 */
export function pushConsentUpdate(state: "granted" | "denied") {
  if (typeof window === "undefined") {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push([
    "consent",
    "update",
    {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    },
  ]);
}
