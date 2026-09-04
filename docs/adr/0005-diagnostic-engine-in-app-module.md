# ADR 0005: Diagnostic Engine as an In-App, Data-Driven Module

Status: Accepted

Context: The Business Health Check (FR-2) is the single largest build item and the site's
primary conversion instrument. It must hold questions, dimensions, weights and thresholds as
data rather than hard-coded logic (FR-2.2), integrate tightly with the enquiry record and
attribution data (FR-2.5–FR-2.7), and later scale to more dimensions/questions for the
Phase-2 paid diagnostic suite (`scope.md`, P2-7) without a rebuild. Options considered: a
custom in-app module; a third-party quiz/survey plugin; a fully separate, decoupled
application.

Decision: The diagnostic is a custom module inside the main Next.js application — a
data-driven schema in the same PostgreSQL database, API routes for step handling and
scoring, and a client-rendered step-by-step interface with no full page reloads.

Consequences: Writing a completed diagnostic's responses and attribution into an enquiry
record is an ordinary database write, not a cross-system integration. A third-party quiz
plugin was rejected because it would still need the same custom integration work to reach
the enquiry record and measurement stack, meaning it wouldn't actually save the cost that
made it look attractive. A separate decoupled application was rejected as reintroducing a
second system to host and secure, against ADR 0001's reasoning. The scoring engine's data
model is built to support more dimensions/questions than the free version ships with, at no
extra cost now, specifically so P2-7 is a configuration change later, not a rebuild. See
`docs/research/diagnostic-engine-architecture.md`.
