# Feature: About and Partners Page

Phase 1. Document 13.03, Section 5.

## Goal

Show why the firm exists, its values and standard, and each partner as a real, credentialed
person — a forward-looking statement of what the firm is being built to become, deliberately
without a milestones/history timeline the firm hasn't earned yet (Document 13.03, Section 4;
`user-stories.md`, Story 9).

## User flow

1. Visitor reaches `/about` from Home or navigation.
2. Reads the firm's founding statement, values, and standard.
3. Sees each partner with a photograph (or, until one is ready, an initials avatar — see
   Edge cases), named practice area, accurately stated credentials where the partner has one
   to state (professional designations exactly as the awarding body permits), and a short
   statement in their own voice.

## Business rules

- No milestones or history timeline appears on this page — replaced by a forward-looking
  statement, per Document 13.03, Section 4's explicit exclusion.
- Every partner entry that does carry a photograph uses a professional one from the single
  coordinated session (Document 13.03, Section 13) — mixed-quality personal photographs are
  not accepted content, and no placeholder image is ever substituted as if it were a real
  photo (see Edge cases for what renders in a photo's absence instead).
- Professional designations are rendered exactly as the awarding body permits — this is a
  content-accuracy rule enforced at publishing time (the admin does not alter or abbreviate
  a credential string a partner supplies), and the field is left blank rather than filled with
  an invented designation where a partner has none to state.

## Data requirements

- `firm_statement` — founding statement, values, standard (rich content). Modelled as its own
  singleton entity (`prisma/schema.prisma`'s `FirmStatement`) with named sub-fields
  (`standing_intro`, `values`, `forward_heading`, `forward_body`, `scope_body`) rather than one
  opaque blob, added at T2.5 — see `memory/decision-log.md`.
- `author` (shared with `insights-engine.md`; managed via `content-management-admin.md`'s
  Team area, not static) — id, admin_user_id, name, photo_url, practice_area, credentials,
  personal_statement, bio, published, plus `order` (added at T2.5, not originally named here —
  a stable display order; the lowest `order` value renders as this page's single featured
  "Lead Partner" card, the rest in a grid). `photo_url` and `credentials` are both nullable
  (see Edge cases).

## Interfaces

- `GET /about` — the page screen, rendering every `author` record where `published` is true.

## Edge cases

- A partner's photograph is not yet available: this no longer holds `published` false the way
  this section originally specified — revised at T2.5 per explicit firm direction (session 11,
  2026-09-05; see `memory/decision-log.md`). A partner with every other required field
  complete (name, practice area, personal statement) publishes immediately, rendered with an
  initials avatar in the photo's place (never a placeholder image standing in for a real one).
  The moment a real photograph is uploaded via the Team admin area, it replaces the initials —
  no separate publish step and no developer or code change required. `published` still stays
  false if a partner's other required content is genuinely incomplete, consistent with the
  "smaller and complete beats larger and unfinished" principle (Document 13.03, Section 4).
- A partner has no formal professional designation to state: `credentials` stays null and no
  credentials line renders for that partner, rather than a fabricated or inferred designation.
