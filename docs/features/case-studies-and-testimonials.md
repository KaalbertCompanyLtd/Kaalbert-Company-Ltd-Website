# Feature: Case Studies and Testimonials (P2-2)

**Phase 2 — gated.** Trigger: written client consent held on file, and at least three
completed engagements with measurable outcomes (`scope.md`, P2-2). Not built until then.

## Goal

Let a founder read real, named evidence of the firm's track record, replacing (alongside,
not instead of, for engagements without consent) the anonymised engagement summaries shipped
at launch (`scope.md`; `user-stories.md`, Story 17).

## User flow

1. Visitor reaches a Case Studies index, filters/browses, and opens one.
2. Sees the client's name and logo (only where consent is on file), the problem, the
   engagement, a measurable outcome, the partner who led it, and a link back to the relevant
   core offer page.
3. Testimonials appear as pull-quotes within case studies, not on a standalone page.

## Business rules

- A case study is published only where a consent flag is recorded true against that specific
  engagement, with a recorded date and scope of what may be published (FR-10.2).
- Reuses the Insights content engine (index, template, OG/Twitter metadata, structured data)
  rather than a second content system (FR-10.1).
- Anonymised engagement summaries remain live for any engagement without recorded consent —
  this feature does not remove them (FR-10.4).

## Data requirements

- `case_study` — id, engagement_id (references the firm's engagement register, 12.04),
  client_name (nullable until consent), client_logo (nullable), problem, engagement_summary,
  outcome, partner_id, consent_on_file (boolean), consent_date, consent_scope.

## Interfaces

- `GET /case-studies` — index, same pattern as `/insights`.
- `GET /case-studies/[slug]` — case study template.
- Admin-side: authoring reuses the Articles editor pattern (rich text, required preview
  image) exactly, since `case_study` is structurally an `article` variant — the only addition
  is the consent-tracking field (consent on file: yes/no, date, scope of what may be
  published) gating whether a given engagement's case study can be published at all. Without
  a screen for that consent field, nothing enforces the business rule above in practice.

## Edge cases

- Consent is later withdrawn for a published case study: the page is unpublished immediately,
  not left live pending a content-review cycle.
- An engagement has consent for some details (the outcome) but not others (the client name):
  the template must support partial anonymisation, not an all-or-nothing consent flag.
