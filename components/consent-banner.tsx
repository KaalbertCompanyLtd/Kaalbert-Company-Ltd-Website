"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { pushConsentUpdate } from "@/lib/data-layer";

const CONSENT_STORAGE_KEY = "kaalbert-consent";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary px-5 py-2.5 text-body font-semibold text-secondary-foreground transition-colors hover:bg-muted";

/**
 * Site-wide cookie consent banner (T5.3, `measurement-and-attribution.md`'s FR-7.2) — mounted
 * once in the root layout, so it covers every route including `/lp/[slug]` landing pages.
 * GTM's own "Consent Default" tag already sets every signal to `denied` before this banner
 * ever renders (Consent Initialization trigger, fires before any other tag); this component
 * only records the visitor's explicit choice and pushes the corresponding `consent update`
 * command — declining never blocks the site from working, it only reduces what's sent
 * (Google's own "modelled" measurement covers the gap, per FR-7.2's own wording).
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      // A genuinely one-time read from an external, client-only store (localStorage) on
      // mount, not derived from props/state; the banner must start hidden during SSR (no
      // localStorage server-side) and can only decide its real visibility once mounted, same
      // reasoning as any "first visit" check that has to run after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    if (stored === "granted") {
      pushConsentUpdate("granted");
    }
  }, []);

  function respond(state: "granted" | "denied") {
    localStorage.setItem(CONSENT_STORAGE_KEY, state);
    pushConsentUpdate(state);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="border-border bg-card fixed inset-x-0 bottom-0 z-[60] border-t px-4 py-4 shadow-md sm:px-6"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
        <p className="text-body text-foreground min-w-[240px] flex-1">
          We use cookies to understand how visitors use this site and to measure the effectiveness
          of our marketing. You can decline and the site still works fully. See our{" "}
          <Link href="/legal/cookie-notice" className="text-accent underline hover:no-underline">
            Cookie Notice
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => respond("denied")} className={BTN_SECONDARY}>
            Decline
          </button>
          <button type="button" onClick={() => respond("granted")} className={BTN_ACCENT}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
