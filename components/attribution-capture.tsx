"use client";

import { useEffect } from "react";

import { captureAttributionOnce } from "@/lib/attribution-client";

/**
 * Site-wide first-touch attribution capture (T5.4, `measurement-and-attribution.md`) —
 * mounted once in the root layout, same pattern as `ConsentBanner`, so it runs on whichever
 * page a visitor actually lands on first (any page, not only `/lp/[slug]` — a shared
 * article or a direct campaign URL are both named examples in the feature doc's own user
 * flow). Renders nothing; the only job here is to make sure `captureAttributionOnce` runs as
 * early as possible on the visitor's first page, before any form later reads it back via
 * `getStoredAttribution`.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttributionOnce();
  }, []);

  return null;
}
