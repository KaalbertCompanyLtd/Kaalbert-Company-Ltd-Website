# Feature: Our Method Page

Phase 1. Document 13.03, Section 5: "the firm's strongest differentiator."

## Goal

Show the four-stage method (Discover, Diagnose, Design, Deliver) in enough depth to
differentiate the firm from competitors who reduce it to a slogan, so a founder, a bank
reviewer, or a prospective partner can see a firm built deliberately, with a method worth
trusting or joining (`user-stories.md`, Story 9).

## User flow

1. Visitor reaches `/our-method` from Home or navigation.
2. For each of the four stages, sees: what happens, what the client sees, what decision
   closes the stage, and — specifically for the final stage — how capability is transferred
   so the client isn't left dependent on the firm.
3. Reaches a call to action (typically the diagnostic or an offer page).

## Business rules

- All four stages are shown with equal structural depth — the page's entire purpose is
  undermined if one stage is thin.
- The capability-transfer explanation at the Deliver stage is mandatory content, not
  optional — it is the specific detail Document 13.03 calls out as differentiating.
- This content is drawn from the firm's engagement delivery playbook and is explicitly not
  delegated to the vendor to paraphrase (Document 13.03, Section 13) — the template renders
  firm-authored content; it does not generate or infer method copy.

## Data requirements

- `method_stage` — id, name, order, description, what_happens, client_sees, decision_point,
  capability_transfer_note (only populated for the final stage). `what_happens` was added
  during T2.4's implementation, beyond this doc's original three-field list — the accepted
  mockup's `.stage-detail-grid` has a dedicated "What happens" cell per stage distinct from
  the longer `description` paragraph, so both are real, separately-editable content (see
  `memory/decision-log.md`, T2.4).
- `page` (shared with `capabilities-page.md`) — id, slug, hero_kicker, hero_heading,
  hero_lead, intro_copy, meta_title, meta_description. Holds this page's own hero and intro
  text — the content that isn't one of the repeating `method_stage` rows. Edited via
  `content-management-admin.md`'s Pages content area, the `method_stage` list edited on the
  same screen as a linked repeating section (the same one-screen-multiple-entities pattern
  `core-offer-pages.md`'s editor already uses for method stages and deliverables together).

## Interfaces

- `GET /our-method` — the method page screen.

## Edge cases

- A stage's content is incomplete during content migration: the page is not published until
  all four stages are complete — this page does not degrade gracefully to a partial state,
  consistent with its role as the firm's strongest differentiator.
