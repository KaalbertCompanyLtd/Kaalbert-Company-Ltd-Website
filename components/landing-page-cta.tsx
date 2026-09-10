"use client";

import Link from "next/link";

import { pushDataLayerEvent } from "@/lib/data-layer";

export interface LandingPageCtaProps {
  label: string;
  href: string;
  /** `LandingPage.downloadFileUrl` — see that model's doc-comment for the fallback contract. */
  downloadFileUrl: string | null;
  className: string;
}

/**
 * `/lp/[slug]`'s one call to action, rendered twice per page (hero + repeat). When
 * `downloadFileUrl` is set (a partner has uploaded a real file via T7.5's future admin
 * editor), this is a real download link and fires `checklist_downloaded` on click — the one
 * event of the six fixed conversion events (`lib/data-layer.ts`) with no destination page of
 * its own to fire from otherwise, same reasoning as `WhatsAppLinkButton`'s `whatsapp_opened`
 * push before its `wa.me` link opens. When null (the normal state before a file is uploaded),
 * falls back to the ordinary `href`/`label` — an internal route that fires its own event on
 * arrival, nothing to instrument here.
 */
export function LandingPageCta({ label, href, downloadFileUrl, className }: LandingPageCtaProps) {
  if (downloadFileUrl) {
    return (
      <a
        href={downloadFileUrl}
        className={className}
        onClick={() => pushDataLayerEvent("checklist_downloaded", { file_url: downloadFileUrl })}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
