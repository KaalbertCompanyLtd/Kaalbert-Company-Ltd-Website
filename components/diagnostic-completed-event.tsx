"use client";

import { useEffect, useRef } from "react";

import { pushDataLayerEvent } from "@/lib/data-layer";

/**
 * Fires `diagnostic_completed` once, the moment `/diagnostic/results` (T3.6) actually
 * renders — the feature doc's own flow step 5 fires this event on reaching the results
 * screen, deliberately not on submit itself (T3.4 fires `diagnostic_started` only). A tiny
 * client component since the page itself is a Server Component; renders nothing.
 */
export function DiagnosticCompletedEvent({ enquiryId }: { enquiryId: number }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    pushDataLayerEvent("diagnostic_completed", { enquiry_id: enquiryId });
  }, [enquiryId]);

  return null;
}
