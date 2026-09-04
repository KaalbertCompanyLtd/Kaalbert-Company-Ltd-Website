# ADR 0002: Next.js + TypeScript as the Application Framework

Status: Accepted

Context: Given ADR 0001 (custom build, no CMS), the project still needs a real application
framework. Candidates evaluated: TypeScript + Next.js (one full-stack codebase); PHP +
Laravel (custom backend and hand-built admin); a minimal hand-rolled Node/Express + plain
React stack with no meta-framework.

Decision: TypeScript + Next.js (App Router), one codebase serving the public site, the
diagnostic, and the hand-built admin area.

Consequences: One language across the entire system, minimising the skill surface a future
Accra-based maintainer needs (NFR-7). Built-in SSR/SSG, code-splitting, and image
optimisation directly serve the LCP/page-weight targets (NFR-1) without hand-assembling
bundler/rendering infrastructure. React's client-rendering model supports the diagnostic's
no-full-reload requirement (FR-2.1) natively, unlike Laravel, which would need a second
front-end layer for the same effect. The hand-rolled option was rejected as reinventing
solved infrastructure for no gain in how custom the application logic actually is. See
`docs/research/runtime-framework-and-admin.md` for the full comparison.
