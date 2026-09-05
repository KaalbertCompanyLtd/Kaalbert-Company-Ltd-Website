"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Last-resort boundary: only fires if the root layout itself (app/layout.tsx) throws, which
 * app/error.tsx can't catch (it's rendered inside the layout, so a layout-level crash takes
 * it down too — Next.js's error-boundary scoping rule). Replaces the entire document
 * including <html>/<head>, so it must be fully self-contained: no SiteHeader/SiteFooter (both
 * assume the app shell that just crashed), no live data fetch, inline styles only via this
 * file's own Tailwind classes plus a direct `globals.css` import for the design tokens.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong — Kaalbert & Company Ltd</title>
      </head>
      <body>
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-[500px]">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              Error
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              Something went wrong.
            </h1>
            <p className="text-lead mb-7 font-light text-[#C9D3CD]">
              Please try again, or come back a little later.
            </p>
            <button
              type="button"
              onClick={reset}
              className="bg-accent text-body text-accent-foreground hover:bg-brass-500 inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
