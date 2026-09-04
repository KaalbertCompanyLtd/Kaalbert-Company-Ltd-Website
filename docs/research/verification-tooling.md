# Research: Verification Tooling

## The decision to be made

How a real, running change to kaalbert.com gets visually and interactively verified during
build — required for a web app per the planning framework's "Choosing a Verification Tool by
Project Type" guidance, and directly exercised for AC-1 through AC-8 in `AC/2026-09`.

## Recommendation

**Playwright MCP** (`@playwright/mcp`), configured in this project's `.mcp.json` in Phase 7
of this pipeline, pointed at a browser already installed on the build host rather than
assuming a fresh Chromium download will succeed in every environment.

This is not a multi-option evaluation. The framework's own guidance names Playwright MCP as
the standard choice for a server-rendered or SPA web app, over the deprecated Puppeteer MCP
server, and there is no serious competing option worth evaluating against it for this
project type.

## What it verifies directly

Every AC/2026-09 criterion that requires an actual rendered page or interaction — the
diagnostic's multi-step flow (AC-1's LCP measurement context, AC-3's keyboard-navigation
walkthrough), the CMS usability test (AC-6), and cross-browser functional walkthroughs
(AC-8) — is exercised through this tool during build, not inferred from unit tests alone,
consistent with the framework's Task Completion Checklist requirement that a real interface
be exercised for real before a change is called done.

## What this decision constrains or enables

Set up once in Phase 7 (Project Setup & Context Files) and used throughout Phase 6+
implementation. No further decision needed here.
