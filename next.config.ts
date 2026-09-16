import type { NextConfig } from "next";

/**
 * Baseline HTTP security headers (`docs/vendor-operations-guide.md`, "Security" section).
 * HSTS is inert until served over HTTPS, which Railway's own domain already does today.
 * Content-Security-Policy is deliberately NOT here — it needs a fresh nonce per request
 * (for the one genuinely inline script this project ships, GTM's bootstrap), which a static
 * `next.config.ts` header can't generate; it's set in `proxy.ts` instead (session 62), on
 * every route, not just `/admin`.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
