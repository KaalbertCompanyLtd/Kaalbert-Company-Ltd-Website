import type { NextConfig } from "next";

/**
 * Baseline HTTP security headers (`docs/vendor-operations-guide.md`, "Security" section) —
 * none of these need a live `kaalbert.com` domain to be safe, unlike a Content-Security-
 * Policy, which has to allowlist GTM/R2/etc. and risks silently breaking a page if drafted
 * without a live domain to test against. HSTS is inert until served over HTTPS, which
 * Railway's own domain already does today.
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
