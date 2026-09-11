# Session 53 — Article resources admin

# Date: 2026-09-11

# Tasks completed: T7.10

## What Was Built

Built a "Downloadable resources" panel on the article editor's right column
(`article-resources-panel.tsx`), rendered only for an existing article since
`ArticleResource.articleId` is a required FK — a brand-new, unsaved article has nothing to
attach a file to yet. Corrected a stale instruction found while assembling this task's own
prompt: the epic file's "Build" line called for a new non-image upload mechanism, but T7.5
(built after that epic entry was written) already built exactly that
(`AdminDownloadUploadButton` / `POST /api/admin/media/downloads` / `encodeDownloadFileUpload`)
— reused directly rather than building a second upload path. Add: type a Label first (gates
the upload button, since `ArticleResource.fileUrl` is non-nullable — no "draft with no file
yet" state), upload a PDF, the row is created immediately via its own API route, independent
of the editor's "Save draft"/"Publish" flow. Reorder: ▲/▼ buttons, persisted via a 3-step
`sortOrder`-swap transaction (same shape as `lib/admin-diagnostic.ts`'s
`moveDiagnosticQuestion`, required for the same `@@unique` constraint reason). Remove: an
`AlertDialog`-confirmed real delete (unlike `Subscriber`'s soft unsubscribe, `ArticleResource`
has no "never hard-delete" rule).

## Files Changed

- `lib/admin-article-resources.ts` (new) — `getArticleResources`/`addArticleResource`/
  `removeArticleResource`/`moveArticleResource`.
- `lib/admin-article-resources.test.ts` (new) — 9 tests.
- `app/admin/(shell)/articles/article-resources-panel.tsx` (new).
- `app/admin/(shell)/articles/article-editor-form.tsx` — added the `resources` prop and
  panel render, gated on `articleId` being set.
- `app/admin/(shell)/articles/[id]/page.tsx` — fetches and passes `resources`.
- `app/api/admin/articles/[id]/resources/route.ts` (new, `POST` — create).
- `app/api/admin/articles/resources/[resourceId]/route.ts` (new, `DELETE`).
- `app/api/admin/articles/resources/[resourceId]/move/route.ts` (new, `POST` — reorder).
- `memory/technical-debt.md` — flipped "Article downloadable-resource attachment... is not
  built" to Resolved; reclassified two R2-blocked entries ("Article/author image uploads use
  an interim base64 data-URI store" and "Article download-resource availability is checked
  via a live per-request HEAD fetch") from `Task-sequenced` to `User-triggered` after finding
  both `Sequenced into` pointers had gone stale (one pointing at this very task, the other at
  an already-shipped T7.6) — see the new decision-log entry.
- `memory/decision-log.md` — new entry explaining the trigger-type reclassification.
- `memory/completed-work.md` — new T7.10 entry.
- `docs/user-guide.md` — added a "How to attach a downloadable resource" walkthrough to the
  Articles section, removed the now-stale "isn't built yet" note, updated the "As of"
  summary, "What's coming next", and the change log.
- Artifact mirror (`https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc`)
  republished to Version 13 with the same changes.

## Decisions Made

- Each resource action (add/reorder/remove) hits its own API route immediately, independent
  of the editor's "Save draft"/"Publish" flow — matching the Categories list's self-contained
  add/rename/retire widget pattern (T7.2), not `block-editor.tsx`'s in-memory-array-saved-
  together pattern, because `article_resource` is a real child table with its own rows, not
  one JSON column like `Article.body`.
- Reused `components/admin-download-upload-button.tsx` directly instead of building a
  "generalized" upload mechanism the epic file's own (now-outdated) text called for — T7.5
  already built the exact non-image upload path this task needed.
- Found, while resolving this task's own technical-debt entry, that its `Sequenced into`
  pointer (and a sibling entry's, from T7.6) both now pointed at already-shipped tasks — the
  real fix for both depends on Cloudflare R2 being provisioned, an external precondition, not
  on "reaching" any task in this project's own sequence. Reclassified both to
  `User-triggered` rather than re-pointing at a third task that would just go stale again.
- Did not attempt to touch `lib/insights.ts`'s `isResourceReachable` (the live HEAD-fetch
  check) even though this task's own upload flow is what "unblocked" that debt entry per its
  prior wording — confirmed via `CLAUDE.local.md` that Cloudflare R2 is still unprovisioned,
  so per this task's own architecture constraint, the HEAD-check correctly stays in place.

## Current State

Milestone 7 (Content Management Admin) now has every task shipped except T7.11, which is a
genuine blocker: it requires a firm decision (not an engineering call) on how an unpublished
author's existing article bylines should behave. That decision has not been made in any prior
session. Once T7.11 ships, Milestone 7 formally closes.

## Blockers

T7.11 cannot proceed without the firm answering: should an unpublished author's existing
article bylines fall back to a neutral attribution, or stay exactly as they were (bylines
exempt from `author.published` entirely)? Not answerable by an engineering default — see the
"Paste This to Continue" block below, which instructs the next session to ask directly via
`AskUserQuestion` rather than picking an option unilaterally.

## Next Task

T7.11 — Article byline resolves against a real `author.published` check
File: docs/tasks/07-content-admin.md

## Paste This to Continue

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/07-content-admin.md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace. This is the last task in Milestone 7 —
completing it formally closes the milestone (update `docs/roadmap.md`'s status if it tracks
that, and the "Website Build Status" Artifact per CLAUDE.md's Firm-Facing Documentation
section, since a milestone completion is exactly the trigger that Artifact's own update rule
names).

# Task T7.11 — Article byline resolves against a real `author.published` check

## STOP — this task requires a real firm decision before any code is written

This is not an engineering call to make unilaterally. `docs/tasks/07-content-admin.md`'s own
text is explicit: "Requires a real product decision first, not just a mechanical fix." As of
this prompt being generated, no answer has been recorded anywhere in `memory/decision-log.md`
or `memory/technical-debt.md` — check both again at the start of this session in case the
firm answered between sessions, but if not, **ask the user directly, in the same category as
CLAUDE.md's own "Things NOT to Do" list treats the PII-deletion and paid-diagnostic-refund
questions** (a firm-policy answer required first, not an engineering default) — use the
AskUserQuestion tool. Do not pick option (a) or (b) yourself and proceed as if it were
obviously correct; do not default to "least effort" (option b, no code change) just because
it requires no build work — that would be deciding the firm's own editorial/compliance
question on their behalf.

The two options, verbatim from the epic file:

- **(a)** An unpublished author's existing article bylines fall back to a neutral attribution
  (omit the byline entirely, or credit "Kaalbert & Company Ltd") once their profile goes
  dark.
- **(b)** A byline is a historical record of who wrote the piece and stays exactly as it was
  regardless of the author's current profile state — `author.published` was never meant to
  reach bylines at all.

## What to build
`lib/insights.ts`'s several `article.author`-including queries (index cards, related
articles, `lib/home.ts`'s featured-Insights section) and `app/insights/[slug]/page.tsx`'s
byline currently read `author.name`/`author.practiceArea` directly with no `published` check
at all — discovered at T7.6 (session 49) while building the Team admin editor, which can
leave an `author` row unpublished (required fields cleared) while it still has existing
articles crediting it, once that editor's own protective validation is ever relaxed or
bypassed directly via the database.

**Provenance note:** this task was originally logged against `docs/tasks/04-insights.md`
(the Insights epic) but moved to this epic at T7.6's own session (49) — Milestone 4 had
already fully shipped by the time this gap was found, so a new task appended there would
never be reached by a future session; Milestone 7 (this epic) was still actively in progress
at the time, so this was the correct home per CLAUDE.md's own "never sequence a new task
into an already-shipped epic" rule.

## Input → Output contract
An `author` row with `published: false` → (a) every existing article byline crediting them
falls back to the neutral attribution, or (b) bylines are confirmed exempt and no code
changes — whichever the firm confirms.

## Acceptance criteria
Once the firm's answer is confirmed: if (a), an author's articles' bylines change the moment
that author is unpublished, with no code change needed per article (same "one edit, every
reader" principle as every other admin-editable content in this project); if (b), this task
closes by updating `insights-engine.md`'s own documented byline behaviour to state the
exemption explicitly, so it's a recorded decision, not a silent gap.

## Size / Dependencies
S, depends on: T7.6 (`lib/admin-authors.ts`'s `updateAuthor` is the one write path this
currently depends on staying protective in the meantime — it already blocks unpublishing an
author with existing published articles crediting them, per that task's own validation, so
the real-world exposure this task closes is currently only reachable by a direct database
edit bypassing the admin, not through the admin UI itself).

## Architecture constraints
- If the firm answers (a): business logic lives in `lib/` — the byline-resolution fallback
  belongs in `lib/insights.ts` (and `lib/home.ts` for the featured-Insights section), not
  duplicated inline in `app/insights/[slug]/page.tsx` or any list-rendering component.
- If the firm answers (a): every one of the affected queries needs the same fix — `lib/
insights.ts`'s index-card query, related-articles query, and `getArticleBySlug`'s own byline
  read, plus `lib/home.ts`'s featured-Insights section. Audit for any other `article.author`
  read this prompt hasn't named before considering the task done — grep the codebase rather
  than trusting this list is exhaustive, since it was compiled at T7.6, not fresh for this
  session.
- If the firm answers (b): the fix is documentation-only — update
  `docs/features/insights-engine.md`'s existing byline-behaviour text (its "Data
  requirements"/business-rules section, e.g. the `published_at` paragraph already covering
  article-level publish state) to state explicitly that `author.published` does not gate
  bylines, so a future session doesn't rediscover this same ambiguity as a fresh bug.
- Either way: do not touch `lib/admin-authors.ts`'s existing protective validation (blocking
  unpublish while an author has published articles) — that stays as the first line of
  defense regardless of which option is chosen; this task is about what happens in the
  fallback/bypass case, not about relaxing that protection.

## Relevant ADRs
No ADR applies directly — this is a data-correctness/product-decision task, not an
infrastructure or tooling choice.

## Relevant feature specification
- `docs/features/insights-engine.md` — read in full; the `published_at`-is-the-single-source-
of-truth paragraph (under its business rules) is the existing precedent for how *article*
  publish state gates the byline and every other reader — this task extends the same
  reasoning to *author* publish state, or (per option b) formally states why it doesn't.
- `docs/features/about-and-partners-page.md` — read in full; `author.published`'s own
  documented meaning and the `GET /about` "every author record where published is true" rule
  are the field's existing, narrower documented scope (governing `/about` itself) — this
  task's whole question is whether that scope should also reach bylines elsewhere.

## Mockup / UI reference
Not applicable — this task has no new UI surface. If the firm answers (a), the byline's
existing rendered text/markup doesn't change shape, only which name/attribution populates it
in the fallback case.

## Coding standards
- The mockups are authoritative — not applicable, no UI surface (not applicable).
- Responsive from first implementation — not applicable, no UI surface (not applicable).
- Feature docs are the data/interface contract — applies either way: option (a) implements
  what `insights-engine.md`'s existing byline rule implies once extended to author state;
  option (b) is itself a feature-doc update (applies).
- Business logic lives in `lib/`, never in the route handler or component — applies if (a)
  (applies).
- Every entity field named in the feature doc maps to a same-named Prisma field — not
  applicable, no schema change either way (not applicable).
- Fee amounts as structured min/max — not applicable (not applicable).
- Content the firm can change lives in the database, edited via `/admin` — not applicable,
  this task changes read-path logic or documentation, not a new editable field (not
  applicable).
- Diagnostic scoring configuration is data, not logic — not applicable (not applicable).
- Accessibility (WCAG 2.1 AA) — not applicable, no new UI surface (not applicable).
- `export const dynamic = "force-dynamic"` — not applicable, no new route (not applicable).
- Never a `"use client"` component importing a value from a `@/lib/prisma`-importing `lib/`
  file — not applicable, no new client component (not applicable).
- Never a `package.json` lifecycle script assuming `.git` exists — not applicable (not
  applicable).

## Task Completion Checklist
```

[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
files (npm run lint && npm run format:check) — this is a hard gate; a pre-push hook / CI
runs it, so a skipped lint fails the push. Fix pre-existing lint failures too, so the
branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed
[ ] If this change touches a real, runnable interface (a page, an API route, an admin
screen), it was exercised for real using Playwright MCP — not confirmed only by static
analysis or mocked tests. If the tool isn't usable this session, say so explicitly
rather than silently skipping this step or claiming it was done.
[ ] Any UI surface was checked at mobile (~375–430px), tablet (~768px), and desktop
(~1200px+) — not desktop-only, even where the cited mockup only shows one width.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable) — record the firm's actual answer here
regardless of which option they chose, so it's never re-litigated
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Any technical-debt.md/known-bugs.md entry logged this session with a possible/planned
fix has Trigger type and Sequenced into filled in — never left blank
[ ] Every Task-sequenced Sequenced into target named or reused this session points at a task
in an epic that has NOT already fully shipped (check docs/roadmap.md/memory/completed-
work.md) — never a new task appended to an already-shipped epic file
[ ] Any technical-debt.md/known-bugs.md entry resolved this session has its Status flipped
in place (Open → Resolved/Fixed), not left Open and not duplicated as a new entry
[ ] docs/user-guide.md updated, and its Artifact mirror republished, if this task changed
what the firm can do/see/must monitor (see "Firm-Facing Documentation" below) — if option
(b) was chosen, likely nothing firm-visible changed; note that explicitly rather than
skipping silently
[ ] If this task completed a milestone/epic, or made a major architectural/process change,
the "Website Build Status" Artifact was updated too (see "Firm-Facing Documentation") — this
task is expected to complete Milestone 7, so this almost certainly applies; read the
Artifact's own current live version first per the tool's own requirement
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] "Paste This to Continue" block in session summary contains full /task [NEXT_TASK_ID] output
[ ] git commit made with format: <type>(T##-##): <short description>

```

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section). This is the last task in
`docs/tasks/07-content-admin.md` — there is no next T7.x task, so the "Paste This to
Continue" block should point at Milestone 8's own first task instead (`docs/tasks/
08-enquiry-management.md`, read that epic file to confirm its first task's ID before
generating the block — do not guess it). Then stop. Do not begin the next milestone's work
in this same session.
```
