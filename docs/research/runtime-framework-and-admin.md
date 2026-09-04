# Research: Runtime, Framework & Admin Architecture

## The decision to be made

What the entire application is built from — language, runtime, framework, and how the
content-editing admin layer (FR-8) is implemented. This project builds everything custom:
no WordPress, no Webflow, no pre-packaged headless CMS product (Payload, Strapi, Directus)
owning the admin UI, data model, or routes. Well-tested libraries are used as components
inside code the team writes and owns — a rich-text-editor library inside a hand-built admin
screen, an auth library behind a hand-built login flow, an ORM behind a hand-designed
database schema — never a product that supplies the whole admin experience.

This single decision has to satisfy: non-technical publishing (FR-8) built entirely by hand;
tight performance budgets on cheap Android/3G connections (NFR-1); a server-side capability
for Meta's Conversions API (FR-7.4); an interactive, no-full-reload diagnostic flow (FR-2.1);
and Accra maintainability (NFR-7, Document 13.03 Section 18 Item 5) for a fully bespoke
codebase rather than a widely-templated CMS.

## Options evaluated

**A. TypeScript + Next.js** (App Router), one full-stack codebase serving the public site,
the diagnostic, and a hand-built `/admin` area behind auth, all in one deployable
application.

**B. PHP + Laravel**, a custom-built backend and server-rendered views, with a hand-built
admin area using Laravel's own routing/auth/ORM primitives (not Nova or Filament, which are
themselves pre-built admin-UI products and would reintroduce the thing being avoided).

**C. A minimal hand-rolled stack** — a bare Node/Express backend plus a plain React
single-page app, with routing, server rendering, image optimisation, and build tooling all
assembled by hand rather than provided by a framework.

## Criteria

- Genuinely custom: no product owns the admin UI, data model, or routes (this is a
  precondition, not a scored criterion — it rules nothing in or out among A/B/C, since all
  three satisfy it)
- Achievable performance ceiling within the GHS 9,000 build budget, specifically LCP ≤ 2.5s
  on 3G/mid-range Android and ≤ 1.5MB pages (NFR-1)
- Support for an interactive, multi-step diagnostic without full page reloads (FR-2.1)
- Native server-side capability for the Conversions API (FR-7.4)
- Maturity and quality of building-block libraries available (rich text, auth, file upload,
  ORM) for the hand-built admin
- Maintainability and hiring pool depth in Accra, for a genuinely custom (not templated)
  codebase (NFR-7)
- Engineering effort required to reach a working, secure admin layer within the Phase 1
  timeline and budget

## Recommendation

**Option A — TypeScript + Next.js**, one codebase, deployed as a single application.

### Why

- **Single language across the whole system.** The public site, the diagnostic engine's
  server-side scoring logic, the API layer, and the hand-built admin UI are all TypeScript.
  A future maintainer needs to know one language and one framework to touch any part of the
  system — this matters directly for NFR-7, because it halves the skill surface compared to
  a stack that splits front end and back end across two languages.
- **Performance tooling is built in, not hand-assembled.** Next.js provides server-side
  rendering, static generation for content pages, automatic code-splitting, and image
  optimisation out of the box — the exact levers needed to hit LCP ≤ 2.5s and ≤ 1.5MB on a
  3G/mid-range-Android budget (NFR-1) without the team having to build a bundler pipeline
  and rendering strategy from scratch, which Option C would require.
- **Server-side capability is native**, same reasoning as any full-stack Node framework:
  API routes/server actions run on a real server, so the Conversions API call (FR-7.4) is an
  ordinary server-side integration.
- **Interactive, no-reload multi-step flows are React's default mode** — the diagnostic
  (FR-2.1) is built as a client-rendered step sequence talking to a server API for scoring,
  with no extra framework needed on top, unlike Option B, which would need to pair Laravel
  with a JS layer (Livewire, Alpine, or a separate SPA) to get the same feel.
- **Hiring/maintenance pool.** React and Next.js are, at the time of this decision, the most
  widely known meta-framework in the JavaScript ecosystem globally, and JS/TypeScript is the
  most commonly taught modern stack in Accra's growing bootcamp and tech-hub pipeline. This
  is a genuine trade-off against Option B, addressed directly below.

### Comparison against the alternatives

**Option B (Laravel/PHP)** is a legitimate custom-build choice and is rejected only on
balance, not on a disqualifying flaw. PHP hosting is historically cheaper and more
commoditised in Ghana specifically, which slightly favours it on raw hosting cost — but
Node-capable hosting at this project's scale is not meaningfully more expensive (see
`hosting-and-infrastructure.md`), and Laravel would need a second front-end technology
layered on top to match the diagnostic's required interactivity, adding complexity Option A
avoids by construction.

**Option C (hand-rolled Node/Express + plain React)** is rejected because it asks the team
to hand-build solved infrastructure — a bundler, a rendering strategy, image optimisation,
routing conventions — that Next.js already provides well, for no corresponding gain in how
custom the _application logic and admin UI_ end up being. The "custom build everything"
instruction this decision is answering is about not depending on a CMS _product_; it is not
about avoiding a well-established application framework, in the same way choosing Next.js
does not mean hand-writing a JavaScript engine.

### The admin layer, specifically

The `/admin` area (article publishing, page-copy editing, fee-range updates, landing-page
creation from a template) is a set of authenticated Next.js routes and screens, built by
hand, using library-level building blocks rather than a CMS product:

- **Rich text editing** — TipTap (a ProseMirror-based library), embedded inside a hand-built
  editor screen, satisfying FR-3.2's requirement for tables, pull quotes and figures.
- **Authentication** — a session-based auth flow using well-vetted, narrowly-scoped
  libraries for the parts that must not be hand-rolled (password hashing via a library such
  as `bcrypt`/`argon2`, session/JWT handling via a library such as `jose`), with the login
  screen, permission checks, and 2FA flow (NFR-3) built by hand.
- **File/media handling** — an upload library behind a hand-built media library screen,
  storing files in object storage (see `hosting-and-infrastructure.md`).
- **Database access** — a type-safe query/ORM library (e.g. Prisma) used against a schema
  the team designs entirely from scratch (see `hosting-and-infrastructure.md` for the
  database itself) — the schema is ours, not inherited from a CMS product's tables.

Each of these is a library used as a component inside code the team writes and controls,
consistent with the project's stated approach: packages as building blocks, never a product
that owns the admin experience.

### Trade-offs

- This is materially more build effort than adopting any pre-built CMS, admin-kit, or
  no-code product would have been — accepted deliberately, and reflected in how the
  diagnostic and build line items are priced in `QT/2026-09`.
- The team owns security patching responsibility for every library in the stack directly
  (no CMS vendor's security team doing this on the project's behalf) — mitigated by keeping
  the dependency list deliberately small and by the automated-update and backup requirements
  already in NFR-3.

### Future scaling considerations

Because the admin layer is entirely hand-built on top of the same database and API the
public site uses, extending it for Phase 2 (a client-portal role and per-engagement document
access, P2-3; a booking-management screen, P2-1) is additive work in the same codebase and
the same auth system — not a second admin system to build or secure.

## What this decision constrains or enables

Every other research note in this folder assumes this stack: the database is designed by
the team (`hosting-and-infrastructure.md`), the diagnostic is a custom module in this same
application (`diagnostic-engine-architecture.md`), the measurement stack is wired in by hand
at the code level (`measurement-stack-implementation.md`), and Phase 2 capabilities extend
the same hand-built admin and API layer rather than introducing a second system
(`auth-strategy.md`, `phase-2-integrations.md`).
