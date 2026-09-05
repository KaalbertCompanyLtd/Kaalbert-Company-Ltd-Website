"use client";

import type { ReactNode } from "react";

import { pushDataLayerEvent } from "@/lib/data-layer";

export interface WhatsAppLinkButtonProps {
  /** `site_settings.whatsapp_number` — digits only, country-code-prefixed (e.g. "233558480001"). */
  whatsappNumber: string;
  /** The pre-filled, context-identifying message (contact-and-enquiry.md's business rule). */
  message: string;
  className?: string;
  children: ReactNode;
}

/**
 * The one shared WhatsApp-link component every public page eventually uses
 * (CLAUDE.md's Recurring Patterns: "every `WhatsAppLinkButton` site-wide" reads the same
 * `site_settings` record) — first built here at T2.6. Fires the `whatsapp_opened` measurement
 * event on click (FR-7.8, `measurement-and-attribution.md`'s business rules) before the
 * `wa.me` link opens in a new tab, so the click is tracked even though the current page never
 * unloads.
 */
export function WhatsAppLinkButton({
  whatsappNumber,
  message,
  className,
  children,
}: WhatsAppLinkButtonProps) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => pushDataLayerEvent("whatsapp_opened", { link_context: message })}
    >
      {children}
    </a>
  );
}
