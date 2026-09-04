# Research: Diagnostic Engine Architecture

## The decision to be made

How the Business Health Check — the single largest build item, per `SRS/2026-09` — is
implemented within the custom Next.js application decided in `runtime-framework-and-admin.md`.

## Options evaluated

**A. A custom module within the main application**: a data-driven question/scoring model
(questions, dimensions, weights, thresholds stored in the database designed in
`hosting-and-infrastructure.md`), a set of API routes handling step submission and scoring,
and a client-rendered step-by-step interface with no full page reloads between questions.

**B. A third-party quiz/survey service or embeddable widget** (form-building services with
conditional logic and scoring exist as hosted products) embedded into the site via script or
iframe.

**C. A fully separate, decoupled application** hosted independently of the main site,
communicating only via API for branding/content consistency.

## Criteria

- Configurability: FR-2.2 requires questions, dimensions, weights and thresholds "held as
  data, not hard-coded," and `scope.md`'s P2-7 requires the same engine to later support more
  dimensions and questions without a rebuild
- Under-six-minute completion UX, which requires no full-page reloads between questions
  (FR-2.1)
- Distinct, measurable completion states matching the state diagram in `SM/2026-09`, Section 4
- Tight integration with the enquiry record and source-attribution data model (FR-2.5–FR-2.7)
- Consistency with the "custom build everything" principle established in
  `runtime-framework-and-admin.md`
- Build cost against the GHS 2,000 diagnostic-instrument line item

## Recommendation

**Option A — a custom module within the main application**, matching the state diagram
already specified in `SM/2026-09`.

### Why

- It is the only option that genuinely satisfies "held as data, not hard-coded" while also
  integrating directly with the enquiry record without a second, separately-secured system —
  the scoring engine and the enquiry record share the same database and application, so
  writing a completed diagnostic's responses and attribution data into an enquiry record
  (FR-2.5, FR-2.7) is a normal database write, not a cross-system integration.
- A fully custom, in-application build is the only option consistent with the project's
  stated approach of not depending on third-party products for core functionality — a hosted
  quiz/survey service (Option B) is exactly the kind of pre-packaged product the "custom
  build everything" decision was made to avoid, and would still require custom integration
  work to wire its results into the enquiry record and the measurement stack, meaning the
  "off-the-shelf" option doesn't actually save the integration cost it appears to.
- A separate decoupled application (Option C) reintroduces a second system to host, secure,
  and maintain — directly against the reasoning that drove the single-application decision in
  `runtime-framework-and-admin.md` — for a feature the main application can serve natively.

### Trade-offs

- Custom development costs more up front than an off-the-shelf quiz tool's sticker price —
  already reflected as its own priced line (GHS 2,000) in `QT/2026-09`, consistent with
  Document 13.03 treating this as the site's single most important conversion asset, not a
  commodity form.

### Future scaling considerations

Building the scoring engine's data model to support more than four or five dimensions and
more than twenty questions from day one — at effectively no extra cost, since it is a data
schema decision rather than a feature — is what lets `scope.md`'s P2-7 (the full diagnostic
suite as a paid product) become a configuration change and a payment/gating layer on top of
the same engine when triggered, rather than a rebuild.

## What this decision constrains or enables

The diagnostic's API routes are where the server-side Conversions API call (FR-7.4) and the
"distinct completion states" requirement (`SM/2026-09`, Section 4) are implemented — see
`measurement-stack-implementation.md` for how those routes fire measurement events.
