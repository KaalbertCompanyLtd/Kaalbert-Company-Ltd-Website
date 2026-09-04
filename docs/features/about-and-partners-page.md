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
3. Sees each partner with a real photograph, named practice area, accurately stated
   credentials (professional designations exactly as the awarding body permits), and a short
   statement in their own voice.

## Business rules

- No milestones or history timeline appears on this page — replaced by a forward-looking
  statement, per Document 13.03, Section 4's explicit exclusion.
- Every partner entry uses a professional photograph from the single coordinated session
  (Document 13.03, Section 13) — mixed-quality personal photographs are not accepted content.
- Professional designations are rendered exactly as the awarding body permits — this is a
  content-accuracy rule enforced at publishing time (the admin does not alter or abbreviate
  a credential string a partner supplies).

## Data requirements

- `firm_statement` — founding statement, values, standard (rich content).
- `author` (shared with `insights-engine.md`; managed via `content-management-admin.md`'s
  Team area, not static) — id, admin_user_id, name, photo_url, practice_area, credentials,
  personal_statement, bio, published.

## Interfaces

- `GET /about` — the page screen, rendering every `author` record where `published` is true.

## Edge cases

- A partner's photograph is not yet available at launch: `published` stays false on that
  `author` record and the entry is not shown, until the partner (or another partner with the
  right role) completes it themselves via the Team admin area — no developer or code change
  required. Consistent with the "smaller and complete beats larger and unfinished" principle
  (Document 13.03, Section 4).
