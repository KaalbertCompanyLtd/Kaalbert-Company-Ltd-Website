/**
 * Client-safe attribution capture (T5.4, `measurement-and-attribution.md`) — deliberately its
 * own file, with no import of `@/lib/prisma`, so `components/attribution-capture.tsx`,
 * `components/contact-form.tsx`, and `components/diagnostic-flow.tsx` (all `"use client"`)
 * can import this without dragging server-only Prisma/driver-adapter code into the client
 * bundle — same split `lib/diagnostic-flow-options.ts`'s own doc-comment established (a real
 * bug, once, when combined; see `memory/known-bugs.md`). `lib/attribution.ts` (the
 * DB-touching half, server-only) shares this file's `AttributionCapture` type rather than
 * redeclaring it.
 */
export interface AttributionCapture {
  sessionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string;
  /** ISO 8601 string — the moment this visitor's session was first captured. */
  firstSeen: string;
}

const STORAGE_KEY = "kaalbert-attribution";

function readStoredAttribution(): AttributionCapture | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.sessionId !== "string" || typeof parsed?.landingPage !== "string") {
      return null;
    }
    return parsed as AttributionCapture;
  } catch {
    // localStorage disabled/unavailable (private browsing, storage quota, etc.) — attribution
    // capture is best-effort and must never block the visitor-facing flow (this task's own
    // edge case), so this degrades to "no attribution" rather than throwing.
    return null;
  }
}

/**
 * Idempotent first-touch capture: returns the session's existing attribution if one was
 * already captured, otherwise reads the current URL's UTM parameters (present or not — a
 * direct/organic visit still gets a real row with null utm fields, per this task's own edge
 * case) and the current path, generates a new session id, persists it, and returns it. Only
 * ever captures once per browser/`localStorage` lifetime — a later page view (even with
 * different UTM parameters) never overwrites the original first-touch row, matching
 * `measurement-and-attribution.md`'s "first_seen" framing.
 */
export function captureAttributionOnce(): AttributionCapture | null {
  const existing = readStoredAttribution();
  if (existing) {
    return existing;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const captured: AttributionCapture = {
      sessionId: crypto.randomUUID(),
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      landingPage: window.location.pathname,
      firstSeen: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    return captured;
  } catch {
    return null;
  }
}

/**
 * Read-only lookup for a form about to submit (`ContactForm`/`DiagnosticFlow`) — returns
 * whatever `captureAttributionOnce` already stored (the site-wide `AttributionCapture`
 * component in `app/layout.tsx` runs it on every page), or `null` if capture never happened
 * or failed. Never captures itself — a form calling this after the visitor has already been
 * on the site for a while should see the *original* first-touch row, not a fresh one.
 */
export function getStoredAttribution(): AttributionCapture | null {
  return readStoredAttribution();
}
