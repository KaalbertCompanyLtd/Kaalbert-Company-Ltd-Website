# Epic: Named Case Studies & Testimonials (P2-2)

Roadmap milestone 11. **Gated — not scheduled.** Trigger: written client consent on file, and
at least three completed engagements with measurable outcomes (`scope.md`).

---

### T11.1 — Data model

**Build:** `case_study` (engagement_id, client_name/logo nullable until consent, problem,
engagement_summary, outcome, partner_id, consent_on_file, consent_date, consent_scope) —
structurally an `article` variant, reusing the Insights content engine (FR-10.1) rather than
a second system.
**Input → Output:** Schema → migrated table.
**Acceptance criteria:** Reuses `article`'s index/template/OG/structured-data machinery
directly (verified by rendering a seeded `case_study` through the same template component
Insights uses, with no duplicated rendering logic).
**Size:** M **Dependencies:** T4.3 (article template), T4.1

### T11.2 — Case Studies index + template

**Build:** `GET /case-studies`, `GET /case-studies/[slug]` — same pattern as `/insights`,
linked back to the relevant core offer page.
**Input → Output:** `case_study` rows with `consent_on_file: true` → rendered index/template.
**Acceptance criteria:** A case study renders with partial anonymisation correctly (e.g.
outcome shown, client name withheld) when consent_scope permits some details but not others
(documented edge case) — never all-or-nothing.
**Size:** M **Dependencies:** T11.1

### T11.3 — Consent-gated admin authoring

**Build:** Authoring screen reusing the Articles editor pattern exactly (rich text, required
preview image), plus the one addition: a consent-tracking field block (on file: yes/no, date,
scope of what may be published) gating whether the case study can be published at all —
without this field, nothing enforces the consent business rule in practice.
**Input → Output:** Editor form submission → `case_study` row; Publish blocked unless
`consent_on_file: true`.
**Acceptance criteria:** Publish is unreachable with `consent_on_file: false`, enforced
server-side not just hidden client-side; withdrawing consent on a published case study
unpublishes it immediately, not on a review cycle.
**Size:** M **Dependencies:** T11.1, T7.2 (Articles editor pattern)

### T11.4 — Coexistence with anonymised summaries

**Build:** Verification/wiring task — confirm anonymised engagement summaries (already live
from Phase 1) remain unaffected and continue displaying for any engagement without recorded
consent (FR-10.4) — this feature adds to, never replaces, them.
**Input → Output:** N/A (no new build; a regression check against existing Phase 1 content).
**Acceptance criteria:** An engagement with a published `case_study` and one without both
render correctly side by side with no conflict.
**Size:** S **Dependencies:** T11.2
