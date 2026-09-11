# Decision Log

Newest entry at the top — see CLAUDE.md's "Memory file format and ordering" section.

## 2026-09-11 (T8.1, session 56) — `EnquiryRecord.status` is a real Prisma enum; `triagePriorityLevel` stays a plain string

**Status:** Standing

**Summary:** Two schema-shape calls made while extending `enquiry_record`
(`enquiry-management.md`'s Data requirements), both precedent-driven rather than arbitrary,
since T8.2/T8.3 (and any future write path) must follow the same shape:

`status` is a real Prisma enum (`EnquiryStatus`: `new`/`contacted`/`closed`/`converted`/
`not_a_fit`), not a plain `String` like `AdminUser.role`. Reasoning: `enquiry-management.md`
itself names a fixed, closed 5-value vocabulary — the same category of thing that already
makes `DiagnosticResponseType`/`AdminLoginAttemptKind` real enums in this schema, as opposed
to `AdminUser.role`, which is deliberately open-ended (the firm can add roles later). One
naming wrinkle: an enum member can't be a bare hyphenated identifier, so "not-a-fit" is
modelled as `not_a_fit` — this is purely a Prisma-identifier constraint (confirmed the
generated client emits enums as plain string-keyed const objects, not TS `enum`, so `new` as
a member name — normally a reserved word — was also confirmed to compile and generate
cleanly); nothing depends on the literal hyphenated spelling anywhere outside the schema
file. Any future UI must map `not_a_fit` → "Not a fit" for display, same as this task's own
`app/admin/(shell)/page.tsx` `STATUS_LABELS` does.

`triagePriorityLevel` stays a plain `String?`, deliberately *not* an enum — mirrors the
existing precedent and stated reasoning on `DiagnosticThreshold.triagePriorityLevel` (its own
schema doc-comment): the firm's triage vocabulary is admin-tunable data (Milestone 7's
Diagnostic Configuration screen), not a fixed set the schema should lock in, even though only
"High"/"Medium"/"Low" exist today.

**Related Documents:** `docs/features/enquiry-management.md`, `docs/tasks/08-enquiry-
management.md` (T8.1), `prisma/schema.prisma` (`EnquiryStatus` enum and `EnquiryRecord`
model doc-comments), `memory/technical-debt.md` (both entries this task resolved).

---

## 2026-09-11 (T7.11, session 55) — Firm's byline policy: an unpublished author's existing articles credit "Kaalbert & Company Ltd," not a blank byline

**Status:** Standing

**Summary:** T7.11 required a real firm-policy answer before any code — asked directly via
`AskUserQuestion` rather than picked unilaterally (per the task's own explicit instruction
and `docs/tasks/07-content-admin.md`'s framing of this as a product decision, not a
mechanical fix). Two options were on the table: (a) an unpublished author's existing article
bylines fall back to a neutral attribution (either omitted entirely, or crediting "Kaalbert &
Company Ltd"), or (b) a byline is a historical record that never changes regardless of the
author's current profile state.

**The firm chose (a), specifically the "credit 'Kaalbert & Company Ltd'" variant** — not
omission, and not (b)'s "byline never changes" position. Implemented in `lib/insights.ts`:
`shapeArticleCard` and `getArticleBySlug` both now check `author.published` and substitute
`FIRM_NAME` (newly exported from `lib/seo.ts`, previously a private constant) for the
author's name, blanking `authorPracticeArea`/`title`/`bio`/`photoUrl` rather than fabricating
firm-specific versions of them — there is no practice area, bio, or photo for the firm itself
to invent, so those fields become empty/`null` and every rendering site (`app/insights/
[slug]/page.tsx`, `components/insights-article-card.tsx`) treats an empty practice area as
"omit the separator," same pattern as an article with no assigned category. The article
page's fuller, bio-bearing byline block is hidden entirely once unpublished, rather than
rendering a bio-less card.

A related, task-text-adjacent decision made while implementing, not explicitly asked for:
`lib/seo.ts`'s `getArticleJsonLd` previously hardcoded the JSON-LD `author` as
`@type: "Person"` unconditionally — crediting "Kaalbert & Company Ltd" (an organization) as a
`Person` with a blank `jobTitle` would have been invalid structured data. Added an
`authorPublished` flag so the JSON-LD author switches to `@type: "Organization"` (no
`jobTitle`) in the fallback case — a correctness fix within the task's own scope (the byline
this task governs), not a new decision requiring its own firm sign-off.

Deliberately left `lib/articles.ts`'s admin Articles list (`content-management-admin.md`'s
internal partner-facing management table) showing the real author name regardless of
`published` state — a partner managing content needs to know who actually wrote a piece to
make editorial decisions; this is a different concern from the public reader-facing byline
T7.11's own text is about, so it was not brought into scope.

Verified live against the real dev database (not mocked): flipped a real author's
`published` flag directly via a throwaway script (bypassing the admin's own protective
`updateAuthor` validation from T7.6 — exactly the scenario `memory/known-bugs.md`'s entry
describes), confirmed the article detail page, the Insights index card, and the JSON-LD all
showed the firm-attribution fallback correctly at both mobile (390px) and desktop widths,
then flipped the flag back and confirmed the real byline returned with no regression. The
throwaway verification scripts were deleted afterward, and the author's `published` value
was restored to its original `true`.

**This completes Milestone 7.** Every task in `docs/tasks/07-content-admin.md` (T7.1–T7.11)
is now done — the "Website Build Status" Artifact was republished as Version 7 (milestone
ledger row 7 flipped to Complete, progress track to 7/9, the headline stat recalculated from
the same task-count-weighted method the ~64% figure at Milestone 6 used — 51 of the 62 tasks
across all 9 milestones are now done, 51/62 ≈ 82% — and the "Your Team" usability panel
flipped from "Login only" to "Live" now that content editing is real). `docs/user-guide.md`
was not touched this session — T7.11 fixed a rendering-layer gap, not a new admin capability,
and the guide's own content-editing sections were already written and versioned as each of
T7.1–T7.10 shipped across sessions 44–53.

**Follow-up, same session (user-flagged):** the user caught that Version 7's Milestone 5
table row referenced "see note below" for its deferred ad-tracking piece, but no such note
existed anywhere on the page — a genuine gap carried forward unedited from Version 6, not
something this session introduced. Audited every currently-`Open` `memory/technical-debt.md`/
`known-bugs.md` entry for anything else genuinely "waiting on the firm" that the Artifact was
missing. Found two more real gaps and one stale entry:

- The Milestone 5 row's blocker (T5.5, `docs/tasks/05-landing-and-measurement.md`) needs
  `kaalbert.com` registered (`memory/technical-debt.md`'s "kaalbert.com not registered" entry
  — Open since session 01, User-triggered) and real Meta/Google/LinkedIn ad accounts, neither
  of which the Artifact mentioned anywhere. Both added to a rewritten, retitled "Waiting on
  You" section (was "Two things we're waiting on from you," now 6 items).
- Real partner photography (`memory/technical-debt.md`'s two "no real photography yet"
  entries, About + Home) is now genuinely actionable by the firm alone — T7.6's Team editor
  (session 49) added photo upload, so this stopped needing a developer at all partway through
  Milestone 7 and the Artifact never caught up. Added.
- Found, while auditing, that "Diagnostic summary email had no admin edit screen yet for its
  new `emailDetail` content" was still marked `Open` with `Sequenced into: T7.7`, but T7.7
  shipped at session 50 — confirmed directly in `app/admin/(shell)/diagnostic-configuration/
configuration-client.tsx` that the Score bands section already has Label/On-screen
  statement/Email detail fields exactly as that entry's `Possible Fix` described. Flipped to
  `Resolved`; this was a pure memory-hygiene miss (the entry was simply never flipped when
  T7.7 completed), not a discovery about the site itself.

Republished as Version 8: the Milestone 5 ledger cell now names the real blockers instead of
promising a note that didn't exist, and "Waiting on You" grew from 2 to 6 items, each marked
whether it blocks launch. The final favicon confirmation and the response-time promise's
"now a two-minute Site Settings edit, no developer" framing were both added for the same
reason — accuracy the firm should actually have, not because anything code-level changed.

**Related Documents:** `docs/tasks/07-content-admin.md` (T7.11), `memory/known-bugs.md`
(the byline entry this resolves, now `Fixed`), `docs/features/insights-engine.md`, the
"Website Build Status" Artifact (Version 7).

## 2026-09-11 (session 54) — Cloudflare R2 provisioned: one bucket (not two), same credentials across dev/prod (not rotated), HeadObjectCommand replaces the live HTTP HEAD check

**Status:** Standing

**Summary:** User provisioned a real Cloudflare R2 bucket (`kaalbert-media`) and an
S3-compatible API token directly in the Cloudflare dashboard, per ADR 0004's "added once media
volume justifies it" precondition. Three real decisions made while wiring this up:

1. **One bucket, not two.** The bucket has both an S3-compatible API token (Object Read &
   Write, scoped to just this bucket — used server-side only, in `lib/r2-client.ts`, never
   exposed to the browser) _and_ public read access enabled (the bucket's own R2.dev
   subdomain, `CLOUDFLARE_R2_PUBLIC_URL`). These are independent settings on the same bucket,
   not a private/public split needing two buckets — every asset this project stores (article
   preview images/figures, author photos, landing-page PDFs, article resources) is meant to
   be publicly visible on the site anyway, so authenticated writes + anonymous reads on one
   bucket is exactly the right shape; nothing in current scope needs a genuinely private
   object.
2. **Same R2 credentials in `.env.local`, `.env.production`, and the live `kaalbert-web`
   Railway service — deliberately not rotated per environment.** Explicit user instruction
   ("I don't want to be rotating for production"). Treated as a legitimate exception to this
   project's usual per-environment-secret rule (which the two admin-auth secrets below still
   follow) because an R2 API token is a storage-bucket credential, not a live-session-forging
   secret — the blast radius of dev/prod sharing it is low at this project's scale (five
   partners, pre-launch).
3. **`ADMIN_CHALLENGE_TOKEN_SECRET`/`ADMIN_TOTP_ENCRYPTION_KEY` still get a separate,
   freshly-generated value per environment** — explicitly _not_ extended the same "don't
   rotate" treatment as R2, since these gate real admin login sessions and TOTP secret
   encryption; reusing a dev value in production would materially weaken production auth.
   Discovered while setting these up that the live Railway service had **neither variable set
   at all**, meaning every real admin login attempt had been hard-erroring in production since
   Milestone 6 shipped — logged as its own known-bug (`memory/known-bugs.md`), fixed by
   generating two new production-only values, not by reusing either local file's.

Also decided, while replacing `lib/insights.ts`'s `isResourceReachable`: keep a live
existence check at all (rather than dropping it now that uploads are confirmed-real at
upload time) — `insights-engine.md`'s "must fail gracefully... not a broken link" edge case
is a real, still-standing business requirement, not conditional on which storage backend is
in use. Implemented via R2's own `HeadObjectCommand` (an authenticated call against our own
bucket) instead of the old plain HTTP `HEAD` against an arbitrary external host — same
UX guarantee, meaningfully faster/more reliable than before.

**Related Documents:** `memory/technical-debt.md` (both now-Resolved R2 entries),
`memory/known-bugs.md` (missing production auth secrets), `lib/r2-client.ts`,
`lib/media-storage.ts`, `lib/insights.ts`, ADR 0004.

---

## 2026-09-11 (T7.10, session 53) — Two R2-blocked technical-debt entries reclassified from Task-sequenced to User-triggered after their `Sequenced into` pointers went stale twice

**Status:** Standing

**Summary:** While resolving T7.10's own technical-debt entry, found that its
`Sequenced into: T7.10` pointer — and a sibling entry's `Sequenced into: T7.6` — both now
pointed at already-shipped tasks, the exact "never point at an already-shipped task"
violation CLAUDE.md's sequencing rule (session 49, T7.6) exists to prevent. Both entries'
real fix (swapping the interim base64 media storage / live HEAD-check for real Cloudflare
R2) has never actually been blocked on "reaching" a task — it's blocked on the firm/
developer provisioning real R2 credentials, an external precondition each of the two tasks
that "reached" this mechanism (T7.6, then T7.10) could only check and re-defer, never
resolve. Re-sequencing to a third not-yet-reached task would just repeat the same pattern,
since no further upcoming Milestone 7 task touches media uploads at all. Reclassified both
entries to `Trigger type: User-triggered`, `Sequenced into: No task` — naming the real
precondition (R2 provisioning) instead of a task ID, per the User-triggered exemption
CLAUDE.md's own sequencing rule already carves out for exactly this shape of dependency.

**Going forward:** a debt entry whose fix depends on an external precondition (a credential
being provisioned, a firm decision, a domain being registered) should be marked
`User-triggered` from the moment that's true — even if a specific near-term task happens to
be a convenient place to _check_ whether the precondition is now met. `Task-sequenced` +
"check and possibly re-defer" is only sound for a bounded number of hops; once it's been
re-checked at two separate tasks with no change and no further task left to check at, that's
the signal it was never really task-sequenced at all, and the entry should say what it's
actually waiting for.

**Related Documents:** `memory/technical-debt.md` ("Article/author image uploads use an
interim base64 data-URI store", "Article download-resource availability is checked via a
live per-request HEAD fetch"), CLAUDE.md's sequencing rule (the T7.6/session 49 precedent).

---

## 2026-09-11 (T7.7, session 50) — `docs/user-guide.md`/its Artifact mirror rewritten as

step-by-step walkthroughs, not feature summaries — standing rule going forward

**Status:** Standing

**Summary:** User feedback, reviewing the guide mid-session: the existing format told the
firm _what_ exists ("a partner can now create a landing page — `/admin/landing-pages` → 'New
Landing Page'") but never _how_ — no field names, no order to fill them in, no explanation of
what a field means. Rewrote every admin-facing section (marketing pages, legal pages/footer,
offers, articles/categories, landing pages, team, diagnostic configuration, plus a new
"Logging in" section) as a numbered walkthrough naming the exact screen, exact button/link
text, and what each field does — sourced from actually reading each editor form's real code
(`app/admin/(shell)/**`), not inferred from memory of building it. Applies to both the
markdown file and its Artifact mirror (the Artifact's existing "You can do today" bullet-list
callout was replaced with a "How to..." numbered-list callout using the same card layout).

**Going forward:** every future task that adds or changes a partner-facing admin capability
must write its `docs/user-guide.md`/Artifact update in this same numbered-walkthrough style —
naming the actual fields and the order to fill them in, not just stating the capability
exists — read the real admin screen/form code first if the session didn't just build it
itself. This is now the standing bar for this file, not a one-time rewrite.

**Related Documents:** `docs/user-guide.md`, CLAUDE.md's "Firm-Facing Documentation" section.

---

## 2026-09-11 (T7.7, session 50) — Added `DiagnosticQuestion.choiceOptions` as a real schema

column, expanding T7.7's own scope beyond its literal `/task` prompt

**Status:** Standing

**Summary:** While building the Diagnostic Questions admin editor, found that a `choice`-type
question's option labels/values were resolved from a hard-coded
`DIAGNOSTIC_CHOICE_OPTIONS[`${dimensionId}-${order}`]` map in `lib/diagnostic-flow-
options.ts` — keyed by position, not by the question's own identity. The moment this task's
own admin let a partner reorder a `choice` question (shifting its `order`) or add a new one,
that map would go stale silently and `components/diagnostic-flow.tsx`'s `optionsFor` would
throw for a real visitor mid-diagnostic — the exact "uncaught error reaching a live visitor"
failure class this epic's own zero-active-questions acceptance criterion already exists to
prevent. Treated this as in-scope rather than a follow-up: added a real `choiceOptions Json?`
column to `DiagnosticQuestion` (migration
`20260911123727_add_diagnostic_question_choice_options_and_placeholder`), moved choice-option
resolution server-side into `lib/diagnostic-flow.ts` (the one file allowed to import
`@/lib/prisma`), and rewrote `lib/diagnostic-flow-options.ts` to hold only the Prisma-free
scale/boolean constants + shared types — preserving CLAUDE.md's "no client component imports
a value from a `lib/` file that also imports `@/lib/prisma`" rule.

Justification for expanding scope rather than filing a technical-debt entry: ADR 0005 already
mandates the diagnostic engine be data-driven, and this map was the one remaining
hard-coded piece of it; fixing it required touching the same files (`lib/diagnostic-flow.ts`,
`components/diagnostic-flow.tsx`) this task's own admin work already had open, so deferring
it would have meant re-opening the same files in a later session for no real savings.

**Related Documents:** ADR 0005, `docs/features/business-health-check-diagnostic.md`,
`docs/features/content-management-admin.md`.

---

## 2026-09-11 (T7.7, session 50) — Reseeded dimension weights from 1-each to 20-each so the

new Diagnostic Configuration screen's own Save gate isn't permanently disabled

**Status:** Standing

**Summary:** `prisma/seed.ts`'s `DIAGNOSTIC_DIMENSIONS` seeded each of the 5 dimensions with
`weight: 1` — scores correctly, since `lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses`
normalizes by total weight regardless of what the individual values are (weightedSum /
totalWeight), so `1` each and `20` each produce an identical score. But the Diagnostic
Configuration admin screen built this same session enforces `ui/mockups/g-admin-content/
admin-diagnostic-configuration.html`'s own explicit UX rule — weights must literally sum to
100 before Save is enabled, "so a weight reads as this % of the score" — and `1+1+1+1+1=5`
never satisfies that gate. Left as-is, a partner opening this brand-new screen for the first
time would find Save permanently disabled until they happened to know to retype all five
values. Fixed by reseeding to `20` each (same equal weighting, expressed the way the admin
screen — and a partner reading it — expects) and updating the 5 live dev rows to match.

**Related Documents:** `memory/completed-work.md` (T7.7 entry), ADR 0005.

---

## 2026-09-11 (process, session 49 follow-up) — Corrected a new task appended to an already-shipped epic; tightened the sequencing rule to prevent it recurring

**Status:** Standing

**Summary:** User caught a real process bug immediately after T7.6 shipped: the "Article
byline rendering has no `author.published` check" known-bug entry (this same session, see
above) had been sequenced into a brand-new `T4.6`, appended to `docs/tasks/04-insights.md`
— but Milestone 4 (Insights) had already fully shipped, so no future session would ever
naturally reopen that epic file to find and execute a task appended to it. CLAUDE.md's
existing "Debt/bug fixes must be sequenced into a task, never left orphaned" rule already
handled the narrower case of an addendum on an already-_completed task_ being inert; it
never explicitly covered a _new task appended to an already-shipped epic_, which is the same
failure by one level up.

**Fix, this project:**

- Moved the task from `docs/tasks/04-insights.md`'s `T4.6` to `docs/tasks/07-content-
admin.md`'s new `T7.11` — Milestone 7 is the epic currently being executed session by
  session, so a task appended there will actually be reached. Updated `memory/known-
bugs.md`'s "Sequenced into" pointer, and this entry's own cross-references, to match.
- Audited every other `Sequenced into` pointer across `memory/technical-debt.md` and
  `memory/known-bugs.md` for the same failure mode. Found two genuine pre-existing instances
  — "ESLint pinned to the EOL 9.x line" and "4 high-severity npm audit vulnerabilities in
  Prisma CLI's dev-tooling tree" — both `Task-sequenced` and both still pointing at `T3.7`
  (Milestone 3, shipped long ago) as an "opportunistic recheck whenever `package.json` is
  next touched" pointer that had already gone stale without anyone noticing. Reassigned both
  to `T7.7` (Diagnostic Configuration), the concrete next task about to be executed, so they
  have a real chance of being picked up. Every other `Sequenced into` pointer into an
  already-shipped epic checked out fine: either the target task was reached and the fix
  genuinely executed there (the normal, working case — T7.6's own several addenda are a good
  example), fixed in the same session it was raised, or explicitly `User-triggered` (domain
  registration, final favicon, partner photography) — which never relied on task-sequencing
  to fire in the first place, since resolution depends on the user raising it, not a session
  "reaching" a task.
- Tightened CLAUDE.md's own "Debt/bug fixes must be sequenced into a task, never left
  orphaned" section with an explicit rule: before writing `Sequenced into`, confirm the
  target epic/milestone is not already fully shipped (check `docs/roadmap.md`/`memory/
completed-work.md`); if the natural epic has already shipped, place a new task in the epic
  _currently being executed_ instead, never in the shipped one — and the same check applies
  when reusing an _existing_ task number as an opportunistic-recheck target, not only when
  creating a brand-new task.

**Fix, the reusable planning framework:** Applied the equivalent tightening to `/home/
cosbydeveloper/SharedSpace/Dev_Workspace/01 - Hasty Notes/PROJECT_PLANNING_FRAMEWORK.md`'s
own "Sequencing a fix for a logged debt or bug (never leave it orphaned)" section (Phase 7),
so every future project generated from this framework inherits the same protection from day
one, rather than each one independently rediscovering this gap the way this project just
did. Also added a matching finding to the generated `/review` command's checklist.

**Related Documents:** `docs/tasks/04-insights.md`, `docs/tasks/07-content-admin.md`
(T7.11), `memory/known-bugs.md`, `memory/technical-debt.md`, CLAUDE.md ("Debt/bug fixes must
be sequenced into a task, never left orphaned"), `/home/cosbydeveloper/SharedSpace/
Dev_Workspace/01 - Hasty Notes/PROJECT_PLANNING_FRAMEWORK.md`.

## 2026-09-11 (T7.6, session 49) — Team editor: no role gate on editing another partner's entry, `bio` corrected as non-publish-gating, the article-byline gap sequenced into a new task rather than fixed unscoped, `Author.adminUserId` finally a real relation

**Status:** Standing

**Summary:** T7.6 (Team / author profile editor) built `/admin/team` (list) and `/admin/
team/[id]` (editor), plus the three admin-facing account actions (deactivate/reactivate,
reset 2FA, reset password) this task's own session-42 addendum named. Concrete decisions:

- **No role-based check gates opening or editing another partner's entry.** The task's own
  "Build" line says "self-service (and right-role-gated other-partner) editor," but no role
  tiers, values, or checks exist anywhere in this codebase — `admin_user.role` is a plain
  string defaulting to `"partner"`, never read by any authorization decision today. Building
  real RBAC to satisfy this literally would mean inventing a policy (which roles exist, who
  has the authority) nobody has specified. Extended `content-management-admin.md`'s own
  existing, explicit "Decision, not a gap" precedent instead — the same document already
  declines to build a technical approval-routing layer for copy sign-off, reasoning "with
  five partners and one shared admin system, a technical approval-routing layer... is more
  process than a firm this size needs... who personally exercises that judgment is the
  firm's own internal discipline." Applied identically here: any signed-in partner can open
  and edit any author's entry from the Team list; the list marks which one is "(you)" for
  the normal self-service path, but nothing technically prevents the other case the task
  line anticipates.
- **`Author.adminUserId` is now a real, `@unique` Prisma relation against `AdminUser`**
  (migration `20260911103608_add_author_admin_user_relation`, applied via `prisma migrate
diff --script` + `prisma migrate deploy` rather than the normal interactive `prisma
migrate dev`, which refused to run non-interactively in this session's shell — see the
  Prisma CLI skill's own migrate-diff workflow for forward-generating a migration this way).
  `lib/admin-authors.ts`'s new `getAuthorIdForAdminUser` resolves the authenticated session
  to the partner's own row. None of the 5 seeded partners has a real `admin_user` login
  account yet (only this project's own dev/test-only account exists) — backfilling
  `adminUserId` for a specific partner is a one-off, User-triggered action once the firm
  says that partner is ready to be onboarded with real credentials, not attempted here.
- **Fixed a stale schema doc-comment**: `Author`'s own doc-comment said `published` gated on
  four fields (name, practiceArea, personalStatement, **and bio**), but both
  `content-management-admin.md` and `about-and-partners-page.md` — and this task's own
  Input→Output line — name exactly three, never `bio`. No functional impact (nothing had
  implemented the gating logic before this task), but left uncorrected the doc-comment would
  have actively misled whoever wrote `updateAuthor` next. `bio` has no live public reader at
  all yet (`insights-engine.md`'s future byline use, not built), so gating publish on it
  would have blocked every real profile from ever registering as complete.
- **`updateAuthor` refuses to leave an author unpublished if they already have articles**,
  rather than allowing it and letting the byline render however it renders. While building
  this validation, discovered `lib/insights.ts`'s several `article.author`-including queries
  (index cards, related articles, `lib/home.ts`'s featured section) and the article detail
  page's byline have **no `author.published` check anywhere** — a real, separately-logged
  gap (`memory/known-bugs.md`) that this task's own acceptance criterion ("never appears...
  as an article byline") would otherwise fail against, if this validation weren't here.
  Rather than fixing the rendering layer unscoped inside this task (a real product decision
  is needed first — does an unpublished author's existing bylines go blank, or stay as a
  historical record regardless of current profile state?), logged it as a new task
  (originally appended as T4.6 to `docs/tasks/04-insights.md` — corrected later this same
  session to `docs/tasks/07-content-admin.md`'s T7.11 instead, since Milestone 4 had already
  fully shipped and a new task there would never be reached; see the correction entry below)
  and left the rendering layer as-is, protected in practice by this validation being the one
  write path that currently exists.
- **`title` falls back to the schema's own `"Partner"` default if saved blank**, rather than
  persisting an empty string — a lightweight, minimal safeguard (title isn't publish-gating,
  so a blank value could otherwise slip through and render an empty badge on `/about`).
- **The publish badge is computed client-side too, live, from the fields as currently
  typed** — not just re-read from the server response after save — so a partner sees "saving
  now would unpublish this profile" before they commit to it, not only after.

Verified for real via Playwright MCP against the live dev database: temporarily linked the
dev/test admin account to a real seeded author (`Author` id 2, Ama Wiafe) to exercise
self-service and the account-actions panel, since no real partner has a login account yet;
confirmed the "(you)" marker, the live unpublish hint, and that saving a blank personal
statement was rejected inline naming the real article count ("2 articles already credit this
partner as author"); saved a real credentials edit and confirmed it appeared on `/about` in
the same request cycle; exercised all three account actions for real, including confirming
via a follow-up navigation that deactivating genuinely invalidated the session (redirected
to `/admin/login` on the very next request, not merely a flipped DB flag) — then reactivated
and logged back in to finish verification. Every test change reverted afterward (`author`
unlinked, credentials cleared, account reactivated) via direct Prisma queries — no delete/
unlink UI exists for this, matching this task's own scope. Checked at mobile (390px)/tablet
(768px)/desktop (1280px), fixing one label-wrap cosmetic issue found at desktop width along
the way.

**Related Documents:** `docs/tasks/07-content-admin.md` (T7.6, T7.11), `docs/features/about-
and-partners-page.md`, `docs/features/content-management-admin.md`, `docs/features/admin-
authentication.md`, `lib/admin-authors.ts`, `lib/admin-authors.test.ts`, `prisma/
schema.prisma`.

## 2026-09-11 (T7.5, session 48) — Landing Pages admin built create-only; the URL slug is partner-typed, not auto-derived; a separate non-image upload mechanism built instead of reusing T7.2's image-only one

**Status:** Standing

**Summary:** T7.5 (Landing Pages admin) built `/admin/landing-pages` (list) and `/admin/
landing-pages/new` (create). Concrete decisions:

- **Create-only, no edit/delete.** `landing-page-template.md`'s own Interfaces line names
  `POST /api/admin/landing-pages` alone; `content-management-admin.md`'s User flow step 6
  describes only "select the template, set headline/opening paragraph, save — a new live
  page exists." Editing or retiring an already-live campaign page was never in this task's
  scope, so no `PATCH`/`DELETE` route or UI was built. The list screen is read-only.
- **The URL slug is a real, partner-typed field, not auto-derived from the headline.**
  `Article.slug` (T7.2) is auto-derived from the title with a silent numeric-suffix
  collision fallback, because an article's URL is an incidental side effect of its title.
  A landing page's `/lp/[slug]` URL is different: it's the actual destination printed on an
  ad, a QR code, or campaign copy — a partner has a real reason to want a specific, readable
  slug. Modeled instead on `Category.slug`'s precedent ("partner-authored, partner-visible,
  worth surfacing a collision inline") — the form has an explicit "URL slug" field with a
  live `kaalbert.com/lp/…` preview, normalized server-side via the same `lib/categories.ts`
  `slugify()` every other partner-typed slug in this admin already uses, and a duplicate is
  rejected inline rather than silently disambiguated.
- **`downloadFileUrl`'s upload does NOT reuse `AdminImageUploadButton`/`encodeImageUpload`
  (T7.2), despite `memory/technical-debt.md`'s own note saying T7.5 would.** That mechanism
  is hard-coded image-only (client `accept` attribute and server `ACCEPTED_IMAGE_TYPES`) —
  a landing-page checklist is realistically a PDF, and reusing the image path as-is would
  have either rejected every real upload or let a PDF end up somewhere only `<img src>`
  expects a decodable image. Built a deliberately small sibling instead:
  `lib/media-storage.ts`'s `encodeDownloadFileUpload` (PDF only, 5MB cap vs. images' 2MB —
  PDFs run larger), `POST /api/admin/media/downloads`, and
  `components/admin-download-upload-button.tsx` — same interim base64 `data:`-URI storage
  and same real-R2 swap-in shape as `encodeImageUpload`, just a second function to swap
  later instead of one. `ctaHref`/`ctaLabel` stay required regardless of whether a download
  file is attached — `components/landing-page-cta.tsx`'s own fallback contract needs a real
  destination either way.
- **`bodyContent` blocks are validated per-kind server-side** (non-blank text, non-empty
  item arrays, every list/stats/steps item's required subfields present) — same rigor
  `updateOffer`'s FAQ/method-stage validation already applies to a structurally different
  ordered-block shape, via a new `LandingPageBlockEditor` (5 kinds: heading, paragraph,
  list, stats, steps) deliberately duplicating `LegalBlockEditor`'s add/move/remove
  mechanics in miniature rather than generalizing either existing block editor — same
  "small, deliberate duplication over a one-time-reuse refactor" precedent T7.3 already set.
- **A brand-new landing page is always created with `isPlaceholder: false`, never exposed
  as a field.** Unlike the three seeded, mockup-derived instances (flagged placeholder
  pending firm review), a page a partner builds through this form is real content they
  wrote and explicitly signed off via the required 10.05-compliance checkbox — the same
  "save is the publish moment" pattern T7.3 already established for content types with no
  separate draft/live column.
- **Fixed a real gap from the previous session (T7.4):** `memory/decision-log.md`,
  `docs/user-guide.md`, and the T7.4 session summary had each been hand-edited (via the
  Edit tool) after that session's last `npm run format` run, and committed without a final
  format pass — `npm run format:check` on the already-committed files failed at the start of
  this session. Fixed as its own `chore(T07-04)` commit before starting T7.5's own work.
  Lesson for future sessions: run `format`/`format:check` as the literal last step before
  every commit, after all file edits including memory/docs/session-summary files, not only
  after the code implementation.

Verified for real via Playwright MCP against the live dev database: created a real test
landing page (all five `bodyContent` block kinds, a real PDF file uploaded and attached),
confirmed `/lp/[slug]` rendered it correctly including a real `checklist_downloaded`-firing
download link (`href` starting `data:application/pdf;base64,...`) when a download file was
attached, and the ordinary `ctaHref` link when it wasn't; confirmed the duplicate-slug
rejection (tried `business-health-check`, got the inline 400) and the missing-compliance
rejection both work; confirmed a non-PDF upload to the new download endpoint is rejected.
The native OS file-chooser dialog didn't cooperate with headless Playwright automation for
the upload button's own click interaction, so the upload endpoint was verified via a direct
authenticated `fetch`/`FormData` call from the same browser session instead — the same code
path the button component calls, just not through a simulated file-picker click. Checked at
mobile (390px)/tablet (768px)/desktop (1280px); the list table stays inside its own
`overflow-x-auto` wrapper with no page-level horizontal scroll at 390px. Both test rows
deleted afterward via a direct Prisma query (no delete UI exists in this create-only scope).

**Related Documents:** `docs/tasks/07-content-admin.md` (T7.5), `docs/features/landing-page-
template.md`, `docs/features/content-management-admin.md`, `lib/admin-landing-pages.ts`,
`lib/admin-landing-pages.test.ts`, `lib/media-storage.ts`.

## 2026-09-11 (T7.4, session 47) — Offer editor: four more mockup gaps fixed beyond the five already named, FAQs/method stages given real structured fields, slug-keyed route, tiered-vs-single-tier form split, 10.05 gate extended to the Advisory Retainer

**Status:** Standing

**Summary:** T7.4 (Offer editor) built `/admin/offers` as one combined screen — a picker over
the three core offers (each rendering the full FR-4.1 field set) plus, always visible below
it, the Advisory Retainer singleton panel, mirroring T7.3's Legal-page-plus-footer "combined
screen, two panels" shape. New `lib/admin-offers.ts` holds all business logic (`getOfferList`,
`getOfferForEdit`, `updateOffer`, `getAdvisoryRetainerForEdit`, `updateAdvisoryRetainer`);
`PATCH /api/admin/offers/[slug]` and `PATCH /api/admin/advisory-retainer` parse/shape only.
Concrete decisions:

- **Four more required `offer` fields were missing from the mockup, beyond the five this
  task's own "Build" line already named as fixed.** `ui/mockups/g-admin-content/admin-offer-
editor.html` still had no `teaser`, `ctaHref`, `metaTitle`, or `metaDescription` fields —
  all four are required, non-nullable `Offer` columns with no other admin surface to edit
  them. Added all four to the built editor (never to the mockup file itself), same treatment
  T7.2/T7.3 already gave their own mockup gaps.
- **`methodStages`/`faqs` are edited as real structured fields, not the mockup's flat
  alternating text-input rows.** The mockup's `.list-editor` shows each method stage and each
  FAQ question/answer as a single flat text input — a wireframing-tool simplification. The
  actual schema stores `{title, description}[]` and `{question, answer}[]` respectively
  (`core-offer-pages.md`'s own Data requirements), so `MethodStageListEditor`/`FaqListEditor`
  expose both fields per entry, with add/move/remove — the "repeating add/remove/reorder list
  of small forms" this task's own architecture constraints called for, not a `kind`-
  discriminated union like T7.2's `ArticleBodyBlock`.
- **A tiered offer (Business Health Check) hides the parent row's own deliverables/required-
  inputs/indicative-timeline/fee-band fields entirely and shows `OfferTierListEditor`
  instead** — `core-offer-pages.md`'s own doc-comment says those top-level fields "go unused"
  for a tiered offer, so `updateOffer` never writes them for a tiered save (verified live: the
  transaction's `offer.update` call for Business Health Check carries no `feeAmountMin`/
  `deliverables` keys at all). A single `RadioGroup` across all tiers enforces exactly one
  `isFeatured` tier — `updateOffer` rejects a save with zero or more than one.
- **`PATCH /api/admin/offers/[slug]`, keyed by slug not id** — `content-management-admin.md`'s
  own Interfaces line names `[id]`, but every other consumer of an offer in this codebase
  (`getOfferBySlug`, the public `/offers/[slug]` route, T7.3's own `PATCH /api/admin/legal/
[slug]` precedent) is slug-keyed; matching that avoids an extra id-vs-slug lookup on the
  client, which already has the slug from `getOfferList`'s picker. A route path parameter
  isn't an entity field CLAUDE.md's "match the feature doc's field names" rule governs.
- **The Advisory Retainer gets the same 10.05-compliance checkbox as the three core offers**,
  gating its own `PATCH /api/admin/advisory-retainer` save — not named explicitly by this
  task, but `advisory_retainer.description` is real published copy shown on `/capabilities`,
  so FR-5.4's sign-off gate applies the same way it does to every other promotional page this
  admin edits (T7.3's own precedent for Capabilities/Our Method: the gate applies to the one
  save action that exists, since there's no separate Publish step for this content type).
- **`clientInputs` (both `Offer`'s own and each `OfferTier`'s) is edited as a single textarea,
  not a list editor** — matches the mockup exactly and the schema's own "seeded as a one-
  element array" convention (`core-offer-pages.md`'s `Offer.clientInputs` doc-comment); the
  form submits `[text]` or `[]`, never a real multi-item list, unlike `deliverables`.

Verified for real via Playwright MCP against the live dev database: loaded all three offers
(tiered Business Health Check and both single-tier offers) with their full real seeded
content; raised Funding-Readiness Pack's fee floor from GHS 9,000 to 9,500 and confirmed both
`/offers/funding-readiness-pack`'s fee panel and `SiteHeader`'s nav dropdown fee-hint ("From
GHS 9,500") updated in the same request cycle — this task's own acceptance criterion; raised
the Advisory Retainer's fee and confirmed `/capabilities` updated; submitted Financial Clarity
Pack with a blank scope cap and confirmed the API rejected it with the scope-cap error message
surfaced inline, never silently saved; confirmed an unauthenticated `PATCH` to the new route
returns 401 (`proxy.ts`'s existing `/api/admin/:path*` matcher covers it with no route-level
auth code needed). Checked at mobile (390px)/tablet (768px)/desktop (1280px) — the tier fee-
band grid and radio-group collapse to one column on mobile, no page-level horizontal scroll.
Every test edit reverted afterward via the same admin UI so the dev DB is exactly as it was
before this session (the rejected scope-cap save never persisted, so nothing to revert there).

**Related Documents:** `docs/tasks/07-content-admin.md` (T7.4), `docs/features/content-
management-admin.md`, `docs/features/core-offer-pages.md`, `docs/features/capabilities-
page.md`, `lib/admin-offers.ts`, `lib/admin-offers.test.ts`.

## 2026-09-11 (T7.3, session 46) — Pages editor built as three purpose-built screens (Capabilities, Our Method, Legal+Footer) with no add/remove on the two fixed repeating sections; the 10.05 compliance gate reinterpreted for content with no draft/live distinction; no such gate for legal text

**Status:** Standing

**Summary:** T7.3 (Pages editor) required reconciling several real gaps between the task's
own "Build" line (a general "linked repeating section" pattern borrowed from the Offer
editor) and what `capabilities-page.md`/`our-method-page.md`'s own business rules actually
allow, plus a genuine schema fact this task's own architecture-constraints section had
already flagged as needing resolution before assuming T7.2's exact publish-gate mechanics
transfer. Concrete decisions:

- **No add/remove control on `capability` or `method_stage` rows** — `capabilities-page.md`'s
  own business rule ("exactly eight service line summaries") and `our-method-page.md`'s ("all
  four stages") both fix the count; this task edits eight/four rows' _content_ in place, never
  the count. This is a materially simpler shape than T7.2's article body editor, which does
  support open-ended add/remove — the two tasks only superficially look alike ("a repeating
  section on a page editor").
- **`Capability.slug` and `MethodStage.name`/`order` render read-only.** `slug` is the live
  lookup key `lib/contact.ts`'s `resolveServiceContext` matches `/contact?service=[slug]`
  against — editing it would silently break any already-shared enquiry link, the same
  "identity fields stay frozen after creation" precedent T7.2 applied to `Article.slug`.
  `method_stage`'s name/order represent the firm's actual fixed method (Discover → Diagnose →
  Design → Deliver per `our-method-page.md`'s own goal), not an arbitrary display order —
  reordering or renaming them here would misrepresent the method itself, not just edit copy.
- **The compliance checkbox gates the Save action itself, not a separate Publish action, for
  Capabilities/Our Method.** `Page`/`Capability`/`MethodStage` have no `publishedAt`-style
  draft/live column at all — every row is live the instant it's saved — so there is no
  intermediate "Publish" step the way T7.2's article editor has one. FR-5.4's sign-off gate
  ("no page... marked publishable without a recorded firm sign-off") is honored by requiring
  the checkbox before the one save action that exists, since for this content type that save
  _is_ the publish moment.
- **No 10.05-compliance checkbox on Legal pages or `footer_content`.** That gate is
  specifically FR-5.4's Positioning-and-Claims review for promotional/marketing copy; legal
  text goes through a different real review process the existing `isPlaceholder`/"Draft —
  pending legal review" marker (T2.7) already gates. Surfaced that marker here as an editable
  checkbox instead of a read-only badge — this is the first task able to actually clear it.
- **`LegalPage.lastRevisedAt` is set only on a save that leaves `isPlaceholder: false`** —
  matching `lib/legal.ts`'s own `formatRevisedDate` doc-comment ("once the firm has actually
  revised the page"), the field means "genuinely legally reviewed," not "last edited." A save
  that keeps the page a draft never touches it; verified live (toggled Cookie Notice from
  draft to reviewed, confirmed `lastRevisedAt` was set and the public page's "Draft" marker
  disappeared, then reverted both for real via the dev DB).
- **`AdvisoryRetainer` is explicitly out of scope**, despite appearing on `/capabilities`
  alongside the eight `capability` cards this task does edit — `capabilities-page.md`'s own
  Data requirements section names it as edited via the Offers content area (T7.4), which its
  own "Build" line confirms ("Same structured-fee discipline applies to Advisory Retainer").
- **A new, small `LegalBlockEditor` was built rather than generalizing T7.2's
  `block-editor.tsx`** to a shared configurable block-kind set. `LegalPageBlock`'s kinds
  (statement/prose/pending/table) are a different, smaller set from `ArticleBodyBlock`'s
  (paragraph/heading/quote/list/table/figure) — duplicating the same small add/move/remove
  mechanics in miniature was judged lower-risk than refactoring T7.2's already-verified,
  shipped article-editor code for what would be a one-time reuse.
- **Two purpose-built routes (`PATCH /api/admin/pages/capabilities`, `PATCH /api/admin/pages/
our-method`) instead of `content-management-admin.md`'s originally-sketched generic `PATCH
/api/admin/pages/[id]`** — each compound-updates a `page` row together with its own linked
  repeating section in one request; a single generic-by-id route would need polymorphic body
  handling for two structurally different payloads. Feature doc updated to match what was
  actually built, same "interfaces get refined once actually built" precedent as earlier
  tasks' field additions.
- **`footer_content` gets a real, working editor here, but `SiteFooter`/`ScopeOfPracticeNote`
  still don't read it live** — that wiring gap is pre-existing, already tracked
  (`memory/technical-debt.md` → "SiteFooter callers still pass hardcoded address/phone props"),
  already sequenced into T7.8, and explicitly not this task's concern (`prisma/schema.prisma`'s
  own `FooterContent` doc-comment already says so). Not re-logged as new debt; this task just
  gives T7.8 a real admin screen to point the wiring at when it gets there.

Verified for real via Playwright MCP against the live dev database: edited a real Capability's
name, saved with the compliance checkbox, and confirmed `/capabilities` reflected it
immediately (T7.3's own acceptance criterion), then reverted via direct query. Loaded the Our
Method editor against all four real seeded stages (capability-transfer note correctly shown
only for Deliver). Loaded the Legal/Footer screen against all four real legal pages including
Scope of Practice's real, non-placeholder content (statement/prose/table blocks all rendering
and editing correctly), toggled Cookie Notice's draft status live, and saved real
`footer_content` — all reverted afterward. Checked all four new screens (Pages list,
Capabilities, Our Method, Legal+Footer) at mobile/tablet/desktop with no page-level horizontal
scroll (the Legal screen's table block editor scrolls within its own container instead).

**Related Documents:** `docs/features/content-management-admin.md`,
`docs/features/capabilities-page.md`, `docs/features/our-method-page.md`,
`docs/features/legal-and-compliance-pages.md`, `docs/tasks/07-content-admin.md` (T7.3),
`prisma/schema.prisma` (`Page`/`Capability`/`MethodStage`/`LegalPage`/`FooterContent` model
doc-comments), `lib/admin-pages.ts`, `lib/admin-legal.ts`.

---

## 2026-09-11 (T7.2, session 45) — Article editor built as a structured block editor against the real schema, not the mockup's literal contenteditable/field set; real image uploads via an interim base64 store; downloadable-resource attachment split into a new task

**Status:** Standing

**Summary:** T7.2 (Articles editor + Categories) surfaced more real gaps between
`ui/mockups/g-admin-content/admin-article-editor.html` (drawn before T4.2/T4.3 evolved the
`Article` schema) and what the schema actually requires — the same class of gap the
pre-Phase-6 audit already found and fixed once for the Offer editor (`docs/dashboard.md`).
Concrete decisions:

- **Added three fields the mockup omits but the schema requires**: `excerpt` (a short teaser
  distinct from meta description, required per `Article.excerpt`'s own doc-comment),
  `metaTitle` (required, distinct from `metaDescription`, the mockup only ever showed the
  latter), and the full `nextStepCta` panel (`heading`/`body`/`label`/`href` — FR-3.4's "never
  a generic contact us" rule has no teeth without real per-article content here). All three
  are validated server-side (`lib/articles.ts`'s `validateCommonFields`), not just present as
  optional UI.
- **Built a structured, add-a-block-of-type-X editor, not a freeform contenteditable/WYSIWYG**,
  despite the mockup showing a toolbar (B/I/H2/quote/link/table/image/attach) over a
  `contenteditable` div. `Article.body` is a strict `kind`-discriminated union with no
  freeform HTML/markdown block kind (`lib/insights.ts`'s `ArticleBodyBlock`) — the same
  "no admin editor yet to justify full relational modelling" shape already used for
  `LegalPage.body`/`Offer.methodStages`. A real WYSIWYG library would need to map onto that
  union somehow regardless, so a block-add UI (paragraph/heading/quote/list/table/figure,
  each with its own small typed form) produces the real shape directly, needs no new
  dependency (staying inside ADR 0001's minimal-dependency philosophy), and is what the
  schema's own design already implies was intended. Added a `figure` block kind
  (`{imageUrl, caption}`) that didn't exist before this task — the mockup's own toolbar names
  "figures" as supported, but no accepted article had used one yet at T4.3 so the type never
  existed; updated the public renderer (`app/insights/[slug]/page.tsx`'s `ArticleBlock`) in
  the same change.
- **Real image uploads (required preview image, `figure` blocks) via an interim base64
  data-URI store, not local disk.** Cloudflare R2 (ADR 0004) isn't provisioned yet. Local-fs
  storage — the general pattern the T7.5 debt entry had floated — was considered and
  rejected: Railway's container filesystem isn't durable across deploys (no Volume
  provisioned anywhere in this project), so a locally-written upload would silently vanish on
  the next deploy, a real data-loss bug rather than a faithful stub. `lib/media-storage.ts`
  instead base64-encodes into the same string column a real R2 URL would occupy, durable
  today with zero new infrastructure and no call-site changes needed when R2 arrives later.
  Capped at 2MB pre-encoding, tracked as debt (`memory/technical-debt.md`), sequenced into
  T7.6 (the next task to touch this same mechanism, for author photos).
- **The mockup's Status dropdown (Draft/Published, next to Publish/Save-draft) has no
  scripted behaviour in that mockup** (unlike `admin-categories-list.html`, which does) —
  treated as illustrative rather than a literal spec. Built as a plain read-only status
  badge instead; this task builds no "unpublish" action (setting a published article back to
  draft), since no acceptance criterion or business rule names one. "Save draft" on an
  already-published article now only ever saves field edits, never touches `publishedAt` —
  deliberately impossible to accidentally unpublish a live article via this screen.
- **Article slugs are derived from the title once, at creation, and frozen thereafter** — a
  later retitle never moves the URL, protecting published OG/search links. A slug collision
  appends a numeric suffix automatically rather than rejecting the save (contrast
  `Category.slug`, partner-authored and partner-visible, where a collision is surfaced
  inline instead) — an article's slug is an incidental side effect of its title, not content
  a partner is directly naming.
- **`Article.revisedAt` is set on every save of an already-published article where `publish:
true` is requested**, matching the schema doc-comment's own definition ("content
  substantively revised after first publish... populated by the admin publish flow
  (Milestone 7)") — this is that flow. `publishedAt` itself is only ever set once, on first
  publish, never overwritten by a later save.
- **Downloadable article-resource attachment (`article_resource`, the mockup's 📎 "Attach
  file" toolbar button) was deliberately left out of this task** — T7.2's own "Build" line
  names only "tables/pull-quotes/figures" as in-scope content types. Split into a new task,
  T7.10, added to the epic file (dependency-ordered after T7.2, appended at the epic's end
  rather than renumbering T7.3–T7.9) rather than silently expanding this already-large (Size
  L) task's scope.
- **Last-write-wins accepted as-is for this task's `PATCH` handler, no optimistic-locking/
  staleness check added** — the conscious call this task's own session-04 addendum required
  making (`memory/technical-debt.md`'s "Two-partner simultaneous page edits use
  last-write-wins" entry, `content-management-admin.md`'s own edge case explicitly accepts
  this for Phase 1 at five partners/low edit frequency). No new debt entry needed; the
  existing one already covers this.

**Related Documents:** `docs/features/content-management-admin.md`,
`docs/features/insights-engine.md`, `docs/tasks/07-content-admin.md` (T7.2, T7.6, T7.10),
`prisma/schema.prisma` (`Article`/`Category` model doc-comments), `lib/articles.ts`,
`lib/categories.ts`, `lib/media-storage.ts`, `lib/insights.ts` (`ArticleBodyBlock`).

---

## 2026-09-11 (T7.1, session 44) — Admin dashboard built against `enquiry_record` fields Milestone 8 hasn't added yet; gaps worked around honestly and sequenced forward rather than built early or fudged

**Status:** Standing

**Summary:** `content-management-admin.md`'s dashboard spec and its accepted mockup
(`ui/mockups/g-admin-content/admin-dashboard.html`) both assume two pieces of data that don't
exist on `enquiry_record` yet: a `status` field (`enquiry-management.md`'s own extension,
explicitly flagged in the schema's model doc-comment as Milestone 8/T8.1 scope, never
anticipated at T2.6) and a persisted per-enquiry triage priority level (the mockup's
High/Medium/Low Triage badge — `lib/diagnostic-scoring.ts` computes this value per submission
but only ever discards it after embedding it in prose, never persisting it structurally).
Roadmap order is Milestone 7 before Milestone 8, and T7.1's own dependency list is T6.3/T3.5/
T2.6/T4.1 — Milestone 8 is genuinely not built yet at this task's normal point of execution,
so this wasn't a build-order mistake to fix, but a real sequencing gap between how
`content-management-admin.md` was written and how the epics were actually ordered.

Chose not to add either field early, even though both are small schema changes T7.1 could
technically have made: the `EnquiryRecord` model doc-comment explicitly says the `status`
extension is "not anticipated here... no precedent in this task's own architecture
constraints for adding it early," and T7.1's own task doc caps its scope at "no new entity"
(read-only aggregate queries). Instead:

- **"New enquiries"** is computed as an unfiltered `COUNT(enquiry_record)` — honestly correct
  today (every row genuinely is "new," since no status-transition capability exists for a row
  to be anything else yet), not a fabricated approximation.
- **The Status badge** always renders "New" for the same reason.
- **The Triage column** renders a real, persisted boolean (`triageFlag`: Flagged/Not flagged)
  rather than fabricating a High/Medium/Low value that isn't stored anywhere per-row. Reusing
  currently-configured `diagnostic_threshold` values to reconstruct a priority at read time
  was considered and rejected — thresholds are admin-editable (ADR 0005), so a value
  recomputed today could misrepresent what actually triggered a specific historical
  submission.
- **Source** is simplified to a two-way "Business Health Check"/"Contact form" label
  (derived from `triageFlag` being non-null vs. null, the same diagnostic-vs-contact-form
  signal the model doc-comment already establishes) rather than also resolving the visitor's
  specific landing page by name — the mockup's per-row landing-page-name variety read as
  illustrative sample data, not a stated data-requirement, and that finer detail already has
  a real home at T8.3's enquiry detail screen (attribution block).

Both real gaps are logged in `memory/technical-debt.md` ("Admin dashboard's New Enquiries stat
and Status badge assume every enquiry is 'new'..." and "Enquiry-level triage priority... is
computed... but never persisted...") and sequenced into T8.1 via an addendum in
`docs/tasks/08-enquiry-management.md`, not left floating — T8.1 already extends this same
table's schema, so both fields land in the same migration as a natural fit.

**Related Documents:** `docs/features/content-management-admin.md`,
`docs/features/enquiry-management.md`, `docs/tasks/07-content-admin.md` (T7.1),
`docs/tasks/08-enquiry-management.md` (T8.1), `prisma/schema.prisma` (`EnquiryRecord` model
doc-comment), `lib/admin-dashboard.ts`.

---

## 2026-09-11 (T6.7, session 43) — Password reset is self-service by design (TOTP is untouched); a new task was added directly to the epic and built in the same session, at the user's explicit request

**Status:** Standing

**Summary:** The user asked how password reset works; the honest answer was that it doesn't
exist anywhere in this codebase for an existing account — not self-service, not even an
admin-triggered one, a genuine gap no prior session had caught. The user then explicitly
asked for a new task to be added to this epic and built immediately, with anything needing
Milestone 7 addended there instead of expanding this task's own scope. Several real design
decisions made building T6.7:

- **Self-service is safe here in a way it isn't for lost 2FA, and that asymmetry is the
  reason this flow could be built without a Milestone 7 dependency at all.**
  `admin-authentication.md`'s existing edge case ("lost device and lost backup codes...
  requires another administrator") has no self-service path by design, because a password
  alone was never sufficient to log in — TOTP is the actual gate. A password reset is the
  mirror case: it only ever touches `password_hash`, never `totpEnabled`/`totpSecret`, so
  even a fully self-service reset can't complete a login on its own. This is _why_ the whole
  feature could ship as `/admin/forgot-password` + email, not a Milestone 7 "Team" screen
  action — confirmed live (the new password correctly re-entered the TOTP step, never
  skipped it).
- **Two separate token columns, not a shared one with `setupToken`.** `passwordResetToken`/
  `passwordResetTokenExpiresAt` are new, distinct `admin_user` columns rather than reusing
  T6.2's `setupToken` — the two links serve genuinely unrelated purposes and can legitimately
  both be pending on the same account at once; collapsing them would make requesting one
  silently invalidate the other.
- **A new rate-limit shape, `assertNotFlooded`, alongside the existing `assertNotRateLimited`.**
  Every other rate-limited step in this epic (password, TOTP, backup code, setup confirm) is a
  credential/code-_guessing_ surface, where only a wrong guess should count against the
  caller's budget. `password_reset_request` has no such concept — `requestPasswordReset` does
  the same amount of work and returns the same generic response whether or not the email is
  real, so nothing about a single request is ever "wrong." `lib/auth/rate-limit.ts` gained a
  second helper that counts _every_ attempt in a window (a flood limit — 3/hour), not just
  failures, rather than force-fitting this onto the existing failure-counting one.
- **A 1-hour token lifetime, not T6.2's 7 days.** `setupToken` is handed over through a slow,
  out-of-band channel (a developer relaying it to a new partner) so it needs a long window; a
  password-reset link is requested on demand by the partner who needs it right now, so a much
  shorter window is both safer and sufficient.
- **A 12-character minimum password length, decided here because nothing set one before.**
  Every account's password until this task was either script-generated or operator-supplied —
  this is the first flow where a partner ever types their own. Length over complexity rules
  (NIST 800-63B), no forced digit/symbol/case mix.
- **Real bug caught live, not by any static check**: `proxy.ts`'s unauthenticated-page
  allowlist didn't include either new screen, so both were silently unreachable until fixed
  in this same session — see `memory/known-bugs.md` and `proxy.ts`'s own doc-comment.
- **Scope split with T7.6, decided explicitly rather than left ambiguous.** Self-service
  covers "forgot password, still have email access." The mirror gap — email access is _also_
  gone — needs another administrator to act on the account, the same shape as the
  already-addended deactivate/reset-2FA actions. `docs/tasks/07-content-admin.md`'s T7.6
  addendum was extended (not duplicated) to cover this third action, and
  `memory/technical-debt.md`'s existing entry was broadened in place for the same reason.

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.7), `docs/tasks/07-content-admin.md`
(T7.6 addendum), `docs/features/admin-authentication.md`, `lib/auth/password-reset.ts`,
`lib/auth/rate-limit.ts`, `proxy.ts`, `memory/technical-debt.md`, `memory/known-bugs.md`.

---

## 2026-09-10 (T6.6, session 42) — Account provisioning is a CLI script, not an invite-flow UI; discovered a related, distinct gap (no UI for deactivate/reactivate or 2FA reset) while documenting, sequenced rather than built

**Status:** Standing

**Summary:** T6.6 closed the gap `memory/technical-debt.md` logged at T6.2: nothing yet
created a real `admin_user` row for a partner's very first login. Resolved as
`scripts/create-admin-user.ts`, a developer-run CLI script, not a self-service "invite a
partner" button anywhere in `/admin` — a deliberate scope call, not a deferred one: with five
partners and new accounts created rarely (per `docs/features/admin-authentication.md`), a
script the developer runs on request is simpler to build and maintain than an invite-flow UI
(email delivery, role assignment, revocation of a stale invite) for something that happens a
handful of times ever. The script mirrors `scripts/cleanup-attribution.ts`'s established
env-loading/dynamic-import shape and `Subscriber.unsubscribeToken`'s precedent for an opaque,
single-use link (reusing T6.2's own `issueSetupToken`, not a new mechanism).

- **Password generation**: `crypto.randomBytes(24).toString("base64url")` when `--password`
  isn't supplied — a real random secret, printed once, never a placeholder the operator is
  expected to remember or reuse.
- **Duplicate-email handling**: `error instanceof Prisma.PrismaClientKnownRequestError &&
error.code === "P2002"` — the same pattern already standard elsewhere in this codebase for
  a unique-constraint violation, not a raw Prisma stack surfaced to the operator.
- **A related but distinct gap surfaced while writing `docs/user-guide.md`, not from any task
  spec.** Drafting the guide's "lost device and lost backup codes" scenario, I initially wrote
  that recovery used "the same mechanism as creating a partner's first account" — caught this
  was actually false (the new script only ever creates a _new_ `admin_user` row; T6.5's
  `deactivateAdminUser` and 2FA-reset both already exist as real, tested `lib/` functions but
  have no UI or command exposing either for an _existing_ account) before publishing, and
  corrected the wording to state plainly that both remain manual developer actions today.
  Logged as a new `memory/technical-debt.md` entry rather than expanded into this task's own
  scope (T6.6's Input→Output line was provisioning only) — sequenced into T7.6 (Team / author
  profile editor, `docs/tasks/07-content-admin.md`) via an addendum, since that's the natural
  screen for both a deactivate/reactivate toggle and a "reset 2FA" button once it's built.
- **This completes Milestone 6.** Both firm-facing Artifacts were updated in this session:
  `docs/user-guide.md` + its mirror republished as Version 2, and the "Website Build Status"
  Artifact republished as Version 6 (milestone ledger row 6 flipped to Complete, progress
  track to 6/9, the ~64% headline stat, and the "Your Team" usability panel updated to
  reflect that staff can now log in even though there's nothing to edit yet).

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.6), `docs/tasks/07-content-admin.md`
(T7.6 addendum), `docs/features/admin-authentication.md`, `scripts/create-admin-user.ts`,
`memory/technical-debt.md`.

---

## 2026-09-10 (T6.5, session 41) — Account deactivation: two independent enforcement layers, no UI/route this task — verified via a real script instead, same as T6.1

**Status:** Standing

**Summary:** T6.5 built `admin_user.active` and its enforcement, resolving the one real
design question this task's own Input→Output line left open: no UI or API route exists for
deactivation yet (Milestone 7's Team area owns that), so how does a schema-only-in-practice
task ship something _real_, not just an inert column?

- **Two independent enforcement layers, both real work, not one covering for the other.**
  (1) `lib/auth/session.ts`'s new `deactivateAdminUser(adminUserId)` — the primary
  mechanism — flips `active: false` and deletes every `admin_session` row for that account
  in one transaction. On its own this already satisfies the acceptance criterion (a deleted
  session simply fails `verifySession`'s own lookup). (2) `verifySession` _also_ joins and
  checks `admin_user.active` directly, rejecting and lazily deleting any session found on an
  inactive account — defense in depth for the narrow case of a session that exists without
  having gone through `deactivateAdminUser`'s own transaction (e.g. one created in the same
  instant a deactivation commits elsewhere). Confirmed for real: created a session directly
  on an already-`active: false` account (bypassing `deactivateAdminUser` on purpose, to
  exercise layer 2 in isolation) and confirmed `verifySession` rejected it and cleaned up the
  row, exactly as designed.
- **`loginWithPassword` also refuses to authenticate a deactivated account** — checked once,
  in the single most upstream place (right after password verification succeeds, same
  placement as the existing `totpEnabled` check), rather than duplicated across
  `verifyTotpLogin`/`verifyBackupCodeLogin` too — an inactive partner can't start a _new_
  session, not just have old ones survive. Message is distinct ("This account has been
  deactivated") and shown only after the password is confirmed correct — the realistic
  person hitting this (per `admin-authentication.md`: "e.g. leaves the firm") already knows
  their own password, so this leaks nothing new to them.
- **No UI/API route this task, verified via a real database-backed script instead** — same
  precedent T6.1 set for schema-only work with nothing yet calling it: rather than inventing
  a premature endpoint Milestone 7's own Team task should own, confirmed the full mechanism
  live against the real dev database (create session → deactivate → confirm session dead,
  fresh login refused, and the defense-in-depth path independently).

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.5), `docs/features/admin-
authentication.md`, `lib/auth/session.ts` (`deactivateAdminUser`, `verifySession`),
`lib/auth/login.ts` (`loginWithPassword`).

---

## 2026-09-10 (T6.4, session 40) — Backup-code recovery grants a real session immediately, forced re-enrolment is a client-side redirect not a server-side gate; matching a code needs a bcrypt loop, not a lookup

**Status:** Standing

**Summary:** T6.4 built `verify-backup-code` recovery and, in doing so, resolved one real
design question the task's own literal acceptance criteria didn't spell out, plus fixed a
real gap the new re-enrolment path exposed in already-shipped T6.2 code.

- **A valid backup code creates a real session immediately** (`lib/auth/session.ts`'s
  `createSession`, same as a normal TOTP login), at the same time as issuing the forced
  `/admin/setup-2fa` re-enrolment link — not one or the other. A backup code is a complete,
  legitimate second factor; there's no reason to withhold a session pending re-enrolment.
  **Consequence, deliberately accepted**: `proxy.ts` only ever checks session validity, not
  `admin_user.totp_enabled` — so nothing server-side actually _forces_ a partner who just
  recovered via backup code to finish re-enrolment before visiting `/admin` directly; the
  redirect is a `login-form.tsx` `router.push`, a UX nudge, not a hard gate. Accepted because
  the account's own `totpEnabled: false` state already makes the _next_ login impossible
  without finishing setup (`loginWithPassword` blocks it) — so re-enrolment becomes
  unavoidable the moment the current session ends, just not instantly enforced mid-session.
  Revisit if that gap ever matters in practice; not worth a real server-side check for a
  five-partner internal tool today.
- **Matching a submitted code against `admin_backup_code.code_hash` is a loop over every
  unused row, not a query** — bcrypt hashes aren't matchable by a WHERE clause, so
  `verifyBackupCodeLogin` fetches every `usedAt: null` row for the account (at most 8) and
  tries `verifyPassword` against each. Cheap at this scale; not treated as a timing concern
  worth engineering around, same proportionality call T6.3 already made for
  `loginWithPassword`'s own account-existence timing.
- **Real bug found and fixed, sequenced as a T6.2 follow-up, not new T6.4 debt**:
  `confirmTotpSetup` (T6.2) never retired a previous batch of unused backup codes — it only
  ever added new ones. T6.2 never needed to worry about this (called once per account,
  ever); T6.4 is the first thing that calls it a second time (after recovery), which exposed
  an unbounded, never-pruned accumulation of "current" codes. Fixed in the same transaction
  that creates a new batch: delete every unused row for that account first. Confirmed for
  real across two full recovery-then-re-enrolment cycles. Full writeup in
  `memory/known-bugs.md`.

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.4), `docs/features/admin-
authentication.md`, `lib/auth/login.ts` (`verifyBackupCodeLogin`), `lib/auth/totp-setup.ts`
(`confirmTotpSetup`), `memory/known-bugs.md`.

---

## 2026-09-10 (T6.3, session 39) — `proxy.ts` moved to the project root (real bug, not a style choice); session/rate-limit/replay/challenge-token design decisions

**Status:** Standing

**Summary:** T6.3 built real login enforcement — session cookies, rate limiting, TOTP replay
protection — and corrected a real bug found live-testing it.

- **`proxy.ts` belongs at the project root, sibling to `app/`, never `app/proxy.ts`.**
  CLAUDE.md's own Next.js 16 note said `app/proxy.ts`; written there first, it compiled,
  type-checked, and lint-passed cleanly while never actually running — `/admin` stayed fully
  reachable with no session check at all, silently, no error anywhere. Caught only by the
  Task Completion Checklist's own "exercise it for real via Playwright MCP" step (a static
  read would never have caught this). Confirmed against this project's own bundled Next.js
  docs and fixed by moving the file; full writeup in `memory/known-bugs.md`. CLAUDE.md's own
  text corrected in the same session so this doesn't recur.
- **Sessions are DB-backed (`admin_session`, already existed from T6.1), not a stateless
  signed cookie.** `AdminSession` gained `token` (the actual cookie value — a fresh random
  value, never this row's own sequential `id`, same `AdminUser.setupToken` precedent) and
  `lastActivityAt` (the 30-minute sliding inactivity clock; `expiresAt` alone only covers the
  12-hour absolute half of the epic's session policy). DB-backed specifically because T6.5's
  "invalidate all of a deactivated user's live sessions immediately" needs a real server-side
  revocation guarantee a stateless token can never give. `lib/auth/session.ts`'s expiry check
  is lazy, not swept — see that file's own doc-comment (confirmed for real this session:
  backdating one session left a _different_ session's now-stale row untouched, exactly as
  designed) — no cleanup job exists yet, proportionate at this project's real scale (five
  partners), same class of call as `AdminLoginAttempt`'s own no-retention decision below.
- **The password→TOTP challenge token is a stateless, HMAC-signed value (`lib/auth/
challenge-token.ts`), not a database row.** Node's own `crypto.createHmac`/
  `timingSafeEqual` directly — a standard signed-token pattern, not a hand-rolled cipher (ADR
  0007's "never hand-rolled crypto" governs primitives, not this class of usage — same
  reasoning already established for T6.1's AES-256-GCM TOTP encryption). Stateless because
  its whole lifetime is under 5 minutes and it carries nothing worth auditing. Reuses the env
  var originally reserved as `NEXTAUTH_SECRET` (T1.1) — **renamed to
  `ADMIN_CHALLENGE_TOKEN_SECRET`** at this task, its first real consumer, because this
  project never adopted the `next-auth` package (ADR 0001) and the old name risked implying
  otherwise to a future reader. Updated everywhere it was referenced: `.env.example`,
  `CLAUDE.local.md`, `README.md`, a fresh dev value generated into `.env.local`.
- **Rate limiting is a real table (`admin_login_attempt`, new), not an in-memory counter** —
  Railway can redeploy/restart the process at any time, which an in-process counter wouldn't
  survive. Keyed by the target account's **email**, not the ephemeral `challenge_token`/
  `setup_token` a given attempt happens to carry — closes a real bypass a token-keyed design
  would have left open (re-submitting an already-known-correct password mints a fresh
  `challenge_token` with, otherwise, a fresh rate-limit budget each time). Five failures per
  15-minute window, per `(identifier, kind)` pair; covers all three code-guessing endpoints
  this epic ends up with, including T6.2's `setup-2fa` confirm (that task's own addendum
  required this — `lib/auth/totp-setup.ts`'s `confirmTotpSetup` now calls the same
  `lib/auth/rate-limit.ts` this task adds). No retention/cleanup job for this table either,
  same proportionality call as `AdminSession` above.
- **TOTP replay protection is `otplib`'s own built-in `afterTimeStep` option, not a
  hand-rolled comparison** — `AdminUser.lastVerifiedTotpStep` (new field) stores the real,
  library-returned `result.timeStep` after every successful login verification;
  `verify`'s return type is a union across otplib's TOTP/HOTP strategies (only HOTP's result
  lacks `timeStep`), narrowed via a documented, safe cast in `lib/auth/login.ts` since this
  call never passes `strategy: "hotp"`. Confirmed for real this session: generating one valid
  code, using it to log in, then immediately reusing that exact same code for a second login
  attempt was rejected with the standard "code didn't match" message, even though the code
  was still well inside its normal clock-drift tolerance window.
- **`app/admin/auth-shell.tsx`** — the centered-card shell T6.2 first wrote privately inside
  `setup-2fa/page.tsx`, extracted to a shared location and reused by `/admin/login` (this
  task) rather than duplicated a second time.

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.3), `docs/features/admin-
authentication.md`, `proxy.ts`, `lib/auth/session.ts`, `lib/auth/challenge-token.ts`,
`lib/auth/rate-limit.ts`, `lib/auth/login.ts`, `memory/known-bugs.md` (the `proxy.ts` bug),
CLAUDE.md's Auth Pattern section (corrected this session).

---

## 2026-09-10 (T6.2, session 38) — `admin_user.setup_token`/`setup_token_expires_at` resolve "which account" for an unauthenticated `/admin/setup-2fa` visit; `app/admin/` split into a `(shell)` route group; `qrcode` chosen for QR rendering

**Status:** Standing

**Summary:** T6.2's own Input→Output assumes a "New `admin_user`" already exists, but no task
anywhere creates one, and `/admin/setup-2fa` is reached with no login session (none can exist
pre-enrolment) — so the screen needs its own way to know which account it's setting up,
without a guessable sequential id in the URL (a real, unauthenticated, third-party-clickable
link — same class of problem `Subscriber.unsubscribeToken` already solved for a different
reason). Added two fields to `AdminUser` beyond `admin-authentication.md`'s original list
(same "gap found building the actual screen" precedent as T2.2/T2.4/etc.): `setupToken`
(opaque, single-use, nulled on completion) and `setupTokenExpiresAt` (7-day default
lifetime, `lib/auth/totp-setup.ts`'s `SETUP_TOKEN_LIFETIME_MS`). `lib/auth/totp-setup.ts`
also exports `issueSetupToken(adminUserId)` — a small, general "generate me a fresh setup
link for this account" function, deliberately not scoped to "first-time only": T6.4's forced
re-enrolment redirect and the new T6.6 (account provisioning) both reuse it rather than each
inventing their own, per addenda added to both tasks this session
(`docs/tasks/06-admin-auth.md`).

Migrated via `prisma migrate dev --create-only` failing (non-interactive environment doesn't
support the confirmation prompt an added unique-constraint warning triggers) — worked around
with `prisma migrate diff --from-config-datasource --to-schema` to get the exact SQL, then a
hand-written migration directory applied via `prisma migrate deploy` (itself fully
non-interactive). Record this workaround for the next time a schema change trips the same
interactive-prompt wall in a non-interactive session.

`app/admin/layout.tsx`/`page.tsx` (T1.5's placeholder dashboard shell) moved into a new
`app/admin/(shell)/` route group — a plain `app/admin/layout.tsx` would otherwise wrap every
route under `/admin/*`, including this task's own `/admin/setup-2fa` (and T6.3's future
`/admin/login`), which must render their own standalone centered auth card, not the
authenticated sidebar shell. The route group changes nothing about the URL.

`qrcode` (pure-JS, no native compile step — same Railway-build-safety reasoning as T6.1's
`bcryptjs` choice) generates the QR code server-side, in the page's own Server Component,
from the `otpauth://` URI `lib/auth/totp-setup.ts` builds. Not a crypto library itself (ADR
0007 doesn't govern it) — it only renders an image from already-computed data.

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.2, and its new T6.4/T6.6 addenda),
`docs/features/admin-authentication.md`, `prisma/schema.prisma` (`AdminUser`),
`lib/auth/totp-setup.ts`, `memory/technical-debt.md` → "No task provisions a real
`admin_user` row yet."

---

## 2026-09-10 (T6.1, session 37) — `bcryptjs` over native `bcrypt`/`argon2`; AES-256-GCM via Node's own `crypto` module for TOTP-secret-at-rest encryption

**Status:** Standing

**Summary:** T6.1 needed to settle two real crypto-library decisions the task explicitly
left open (`docs/tasks/06-admin-auth.md`'s own architecture constraints).

- **Password/backup-code hashing: `bcryptjs`, not `bcrypt` or `argon2`.** All three are
  vetted (ADR 0007's bar). `bcrypt` and `argon2`'s npm packages both compile native bindings
  at install time (node-gyp) — a real risk on this project specifically, since Railway's
  Railpack build runs in an isolated container that has already broken the production build
  twice for unrelated native/environment-assumption reasons (`memory/known-bugs.md`'s
  `prepare`-script incident; CLAUDE.md's own "Never let a `package.json` lifecycle script
  assume `.git` exists" rule was written from that same incident). `bcryptjs` is a pure-JS,
  drop-in-compatible, actively maintained bcrypt implementation with no native-compile step
  at all — chosen specifically to remove that entire risk class rather than hope Railpack
  handles node-gyp cleanly. Slower per-hash than the native alternatives, an accepted
  trade-off at this project's real login volume (a handful of partners, not a
  high-throughput auth service).
- **TOTP secret encryption: AES-256-GCM via Node's built-in `crypto` module, keyed by a new
  server-held env var (`ADMIN_TOTP_ENCRYPTION_KEY`), not a KMS/vault product.** `totp_secret`
  must be recoverable in plaintext at verification time (unlike a password/backup-code hash),
  so it needs reversible encryption. This does not conflict with ADR 0007's "never
  hand-rolled crypto" — the cipher itself is Node's own audited `crypto` module (OpenSSL/
  BoringSSL underneath), the same category of "vetted primitive, not hand-rolled" `otplib`
  itself relies on for its own HMAC work; `lib/auth/totp-encryption.ts` only manages the key
  and the encrypt/decrypt call shape. A dedicated KMS/vault (e.g. a cloud provider's managed
  key service) was considered and rejected as more infrastructure than this project's real
  scale justifies (one shared admin system, five partners) — revisit if that scale changes.
  A fresh random IV per encryption call (not a fixed/derived one) so the same secret never
  produces the same ciphertext twice. Losing/rotating the key makes every already-stored
  `totp_secret` undecryptable — documented in `.env.example`/`CLAUDE.local.md` as a real
  operational consequence, not just a config note.

**Related Documents:** `docs/tasks/06-admin-auth.md` (T6.1), `docs/features/admin-
authentication.md`, ADR 0007, `lib/auth/password.ts`, `lib/auth/totp-encryption.ts`,
`memory/known-bugs.md` (the `prepare`-script Railway-build incident cited above).

---

## 2026-09-10 (session 36+) — Two firm-facing documentation artifacts established, updated incrementally instead of audited at the end

**Status:** Standing

**Summary:** The user asked to start a full user guide/manual for the firm now, covering
everything the platform can do, what to monitor, and what actions are available — and
explicitly to make it a durable rule to keep updating it as tasks complete, rather than
waiting until everything is built and then running one big audit to reconstruct it. Two
artifacts now exist, each with a distinct cadence so the firm's own progress report doesn't
get noisy while the operational manual still stays current:

- **`docs/user-guide.md`** (new file) — the operational manual: what's live, what to
  monitor, what a partner can/can't do yet, organized by capability, plus a change log.
  Mirrored as an Artifact — <https://claude.ai/code/artifact/ef11ad80-3285-4243-bd32-ab4124b1f8dc>
  — kept in exact content sync with the file on every update. **Update rule: every task**
  that changes what a partner can do, see, or must monitor.
- **"Website Build Status"** Artifact (pre-existing, owned by the user, URL supplied by the
  user this session: <https://claude.ai/code/artifact/a26811bf-998b-4899-b3ad-0d03ce7c828f>)
  — a short, plain-language milestone progress report. Read before this session's update
  (per the Artifact tool's own rule), then republished in place to reflect Milestone 5's
  completion (T5.1–T5.4 live, T5.5 deferred before Milestone 9, next up Milestone 6) — the
  first real use of the new rule: **update only at milestone/epic completion or a major
  change**, not every task.

Both rules are now codified in CLAUDE.md's new "Firm-Facing Documentation" section (added
this same session) and in `docs/user-guide.md`'s own "How this guide is maintained" section,
so a future session doesn't need this decision-log entry to know the rule — it's load-bearing
process now, not a one-off request.

**Related Documents:** `docs/user-guide.md`, CLAUDE.md ("Firm-Facing Documentation" section,
Knowledge Management Responsibilities, Task Completion Checklist), the two Artifact URLs
above.

---

## 2026-09-10 (session 36+) — T5.5 resequenced to run immediately before Milestone 9 instead of right after T5.4; Milestone 5 marked complete on that basis

**Status:** Standing

**Summary:** After confirming T5.5 needs multiple real external accounts that don't exist
yet (Meta Business Manager + Pixel + CAPI token, a Google Ads account, LinkedIn Campaign
Manager access) plus `kaalbert.com`'s still-open domain registration (blocking its own
domain-verification acceptance criterion specifically), the user asked whether leaving T5.5
unbuilt blocks anything else. Checked the real dependency graph rather than assuming: only
`docs/tasks/09-performance-dashboards.md`'s T9.4 (Meta), T9.5 (Google Ads), and T9.6
(LinkedIn) depend on T5.5 — nothing in Milestones 6, 7, or 8 does, and Milestone 9 is
explicitly labeled "(Bonus)" in `docs/roadmap.md`, with its own goal text stating it's "never
built until Phase 1 launch and acceptance are complete." So T5.5 does not block Phase 1
delivery at all.

Given that, the user asked to resequence T5.5 to execute immediately before Milestone 9
starts (rather than immediately after T5.4, where it currently sits in the epic file) and to
mark Milestone 5 complete on that basis. Implemented as a **build-order resequencing, not a
task renumbering** — T5.5 keeps its identity (CLAUDE.md's own rule: task IDs only ever move
forward, never renumber), only its execution position moved. Added explicit, mirrored notes
in both epic files (`docs/tasks/05-landing-and-measurement.md`'s T5.5 entry and epic header;
`docs/tasks/09-performance-dashboards.md`'s epic header, before T9.1) plus `docs/roadmap.md`'s
Milestone 5 and Milestone 9 entries, so a future session reading either epic in isolation
still gets the full picture and doesn't attempt T5.5 at the wrong point or skip it entirely.
Milestone 5's epic file now carries an explicit `Status: Complete (T5.1–T5.4)` line — the
first such per-epic status marker in this project; worth using the same convention for other
epics going forward if a similar situation arises (a task that's real, owned, and
un-blocking, but not yet buildable).

**Related Documents:** `docs/tasks/05-landing-and-measurement.md`, `docs/tasks/
09-performance-dashboards.md`, `docs/roadmap.md`, `docs/dashboard.md` (Current Phase line
updated to match), `memory/completed-work.md`.

## 2026-09-10 (T5.4 follow-up, session 36) — Scheduling the attribution retention job is CLI/IaC-scriptable, not a dashboard-only action; one Railway Cron Job service per scheduled task is the standing pattern, not a shared worker

**Status:** Standing

**Summary:** Immediately after this session's own T5.4 completed-work entry described the
90-day retention job's schedule as "a Railway dashboard action... only the user can take,"
the user pushed back and asked whether it could be done via CLI/script instead. It could,
and should have been from the start — this project's own `.railway/railway.ts` (Railway's
config-as-code file, tracked since T1.1) already exists specifically for this. Verified the
real schema by installing the actual `railway` npm package into an isolated scratch
directory and reading its shipped `.d.ts` files directly, rather than guessing field names
from trial and error (an earlier probe using a bogus field name proved the CLI does not
validate/error on unknown properties, so "no error" alone would have been worthless
evidence). Declared a new `attribution-cleanup` service with `deploy.cronSchedule`, applied
via `railway config plan` (dry-run, reviewed) then `railway config apply --yes` with the
user's explicit go-ahead for that one production-infrastructure action.

**The dry-run caught a real, unrelated landmine before anything was touched**: the existing
`kaalbert-web` service's declaration in that same file had never been updated to declare
`BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`/`GTM_CONTAINER_ID` as `preserve()` —
`railway config plan` showed it would delete all four live variables on apply, since an IaC
file treats any undeclared variable as "should not exist" (the same rule the file's own
existing comment already documented for `source`). Fixed in the same edit, before applying
anything.

**The first real deployment attempt then failed for real, twice, each time diagnosed from
actual logs rather than guessed**: (1) `DATABASE_URL: preserve()` on a service that never
had a prior value resolves to simply unset — `preserve()` protects an existing value, it
does not create one — so the container failed immediately, exactly reproducing the
"DATABASE_URL is not set" failure this session's own `scripts/cleanup-attribution.ts`
comment already warns about, just at the infrastructure layer instead of the module-loading
layer. Fixed with a real cross-service reference (`ref(postgres_db, "DATABASE_URL")`,
requiring `postgres("Postgres")` to be declared and added to the graph's `resources` list so
the reference target exists). (2) Railway's Railpack builder auto-detected the repo as a
Next.js app and ran the full `npm run build` before every deploy of a job that only ever
calls `tsx` directly — fixed with `build: "true"` to skip it. Both fixes were verified for
real: `railway config plan` showed each as a single safe change before applying, and the
corrected deployment's own `status: SUCCESS` (via `railway service list`) confirmed the
container actually ran and exited cleanly.

**Standing pattern decided, not just this one fix**: the user asked directly whether more
scheduled jobs are coming and whether a shared "worker" abstraction would be better than one
Cron Job service per task. Checked the roadmap rather than guessing: `platform-performance-
dashboards.md` (Milestone 9) explicitly requires one scheduled sync job per ad platform (GA4,
Meta, Google Ads, LinkedIn — four more), each "implemented independently... so one
platform's sync failure cannot affect another's." Decided: keep one small Railway service
per scheduled task (declared in `.railway/railway.ts`, each running one `npm run <script>`
command on its own `cronSchedule`), never a shared worker/dispatcher process — Railway's
per-service isolation already gives Milestone 9's own explicit requirement for free, and a
hand-rolled shared worker would have to reimplement that isolation manually, which is exactly
the kind of custom infrastructure ADR 0001's "packages/infrastructure as building blocks,
never reinvent what a platform already does" ethos argues against. Recorded in `CLAUDE.md`'s
Recurring Patterns section so Milestone 9's tasks inherit this without re-deciding it.

**Related Documents:** `docs/tasks/05-landing-and-measurement.md` (T5.4), `docs/features/
platform-performance-dashboards.md` (the future case this pattern was checked against),
`docs/adr/0001-custom-build-no-cms-platform.md`, `memory/technical-debt.md` (the "Attribution's
90-day retention job" entry, now Resolved), `memory/completed-work.md` (T5.4 follow-up entry),
`CLAUDE.md` (Recurring Patterns section), `.railway/railway.ts`.

## 2026-09-10 (T5.4, session 36) — Attribution capture is entirely client-driven (`localStorage`, first-touch); `POST /api/diagnostic/submit`'s wire shape changed to carry it; retention job ages off `firstSeen`, checked against real seeded rows, not just unit-mocked

**Status:** Standing

**Summary:** No server-side visitor-session mechanism exists anywhere in this codebase —
confirmed by searching for `proxy.ts`/`middleware.ts` (neither exists) and any cookie-based
session (none), and `DiagnosticResponse.sessionId`'s own doc-comment explicitly says it "has
no real visitor-session concept to draw on." `measurement-and-attribution.md`'s own user flow
requires attribution to survive from a first landing (any page, not only `/lp/[slug]`)
through the entire diagnostic flow and into whichever enquiry eventually gets created —
across multiple full page navigations. Decided: capture happens entirely client-side via
`localStorage` (first-touch, `crypto.randomUUID()` session id), never a server session,
mounted site-wide via a new `AttributionCapture` component in `app/layout.tsx` (same "render
nothing, just run a side effect on mount" pattern as `ConsentBanner`). Every write path that
creates an `EnquiryRecord` (`createContactEnquiry`, `submitDiagnosticResponses`) accepts the
untrusted client payload and resolves it server-side (`lib/attribution.ts`'s
`resolveAttributionId`, upsert-by-`sessionId`, defensively returns `null` for anything
malformed rather than throwing) — this is the entire mechanism that makes "never blocking the
flow" (the task's own edge case) actually true: a missing/broken attribution payload simply
means `attributionId: null` on the enquiry, not a failed submission.

**A real, deliberate interface change**: `POST /api/diagnostic/submit`'s request body changed
from T3.4/T3.5's original bare JSON array to `{answers: [...], attribution?}`, since a bare
array has no room for a second field. Updated `components/diagnostic-flow.tsx`'s POST call,
the route handler, and `business-health-check-diagnostic.md`'s own Interfaces section
together, in the same change — never left the doc and the code to drift.

**Verification note**: rather than trust the retention job's unit test alone, ran it against
three real seeded rows in the live database (expired+unreferenced, expired+referenced,
recent) and confirmed exactly the one that should be deleted was deleted, and — critically —
that the expired-but-referenced row survived regardless of its own age, which is the task's
own explicit acceptance criterion and the one case a unit test with a mocked Prisma client
can assert but not truly prove against Prisma's actual relation-filter semantics
(`enquiries: { none: {} }`). Also caught and fixed a real bug in `scripts/
cleanup-attribution.ts` during this same verification: a static `import` of `lib/prisma`
executed (per ES module hoisting rules) before the script's own `dotenv` `config()` calls,
regardless of their textual order, throwing "DATABASE_URL is not set" every time — fixed
with `await import(...)` inside `main()` instead.

**Related Documents:** `docs/tasks/05-landing-and-measurement.md` (T5.4), `docs/features/
measurement-and-attribution.md`, `docs/features/business-health-check-diagnostic.md`,
`docs/features/contact-and-enquiry.md`, `memory/completed-work.md` (2026-09-10 (T5.4) entry),
`memory/technical-debt.md` (new Railway Cron Job scheduling entry), `lib/attribution.ts`,
`lib/attribution-client.ts`, `lib/attribution-cleanup.ts`, `components/
attribution-capture.tsx`.

## 2026-09-10 (T5.3, session 35) — GTM container populated: GA4 config + six event tags via one shared `{{GA4 Measurement ID}}` constant, Consent Default via Custom HTML on the Consent Initialization trigger, container-level Consent Overview (BETA) enabled

**Status:** Standing

**Summary:** With the real GTM container (`GTM-PDGKRKRN`) and GA4 property (`G-9VX9GS5L0X`)
now provisioned by the user (resolving `memory/technical-debt.md` → "GTM container not yet
provisioned"), populated the container directly via GTM's own web UI (driven through the
user's real Chrome, `kaalbert.company@gmail.com` — not the personal account this session's
Claude subscription happened to default to; had to explicitly switch accounts mid-session).
Built: a `Google Tag` type tag ("GA4 Configuration," Tag ID `G-9VX9GS5L0X`, fired on
`Initialization - All Pages`) that every `Google Analytics: GA4 Event` tag auto-detects and
reuses ("Google tag found in this container") rather than re-entering the Measurement ID six
times; a single `Constant` variable (`{{GA4 Measurement ID}}`) referenced by every event tag
instead, for the same reason; six `GA4 Event` tags + six matching `Custom Event` triggers
(`diagnostic_started`/`diagnostic_completed`/`summary_requested`/`checklist_downloaded`/
`enquiry_submitted`/`whatsapp_opened`, exact string match against `lib/data-layer.ts`'s
`DataLayerEvent` union); a `Consent Default` Custom HTML tag (`dataLayer.push(['consent',
'default', {...denied...}])`) on the built-in `Consent Initialization - All Pages` trigger —
no native "Consent Mode" tag type exists in this GTM account even with the container's
"Enable consent overview" (BETA) setting turned on, so Custom HTML is the correct, officially
documented mechanism, not a workaround. Confirmed every `Google Analytics: GA4 Event` tag
carries **built-in** (not manually configured) consent requirements — `ad_storage`,
`ad_user_data`, `ad_personalization`, `analytics_storage` — automatically, satisfying FR-7.2
without any additional per-tag consent settings. Published as Version 2 ("Live").

Also built the site's own consent banner (`components/consent-banner.tsx`) and a new
`pushConsentUpdate` helper (`lib/data-layer.ts`) — a plain fixed bottom bar with native
`<button>`s (no Base UI primitive needed; native buttons are already fully accessible),
Accept/Decline pushing `dataLayer.push(['consent', 'update', {...}])`, preference persisted
in `localStorage` so it only shows once. The banner's "must render hidden during SSR, decide
real visibility only after mount" pattern genuinely requires `setState` inside `useEffect`;
suppressed `react-hooks/set-state-in-effect` there with a reasoning comment (same precedent
style as `insights-article-card.tsx`'s one existing lint suppression) rather than contorting
the component to avoid a rule that doesn't fit this specific case.

**A real verification pitfall, worth recording**: mid-verification, every real-browser test
(both the Playwright verification browser and the user's own Chrome) showed zero tags firing
on a normal page load, even though GTM Preview mode showed everything firing correctly. Spent
real effort chasing this as a suspected implementation bug before finding the actual cause:
`gtm.js` is served with `Cache-Control: private, max-age=900`, and every test browser had
already cached the _empty_ pre-T5.3 container from earlier in this same session (when
`GTM_CONTAINER_ID` was first set but before any tags existed) — every subsequent "fresh"
page load for the next 15 minutes kept silently reusing that stale cached script, regardless
of new page navigations or even a hard reload (`Ctrl+Shift+R`) targeting the top document
only. Confirmed via direct `fetch(url, {cache: 'no-store'})` (returned the real, current
content) and finally via simply waiting out the 900s window on a genuinely fresh tab, which
showed the consent-default push and a real `google-analytics.com/g/collect` request (`gcd`
consent-diagnostics parameter present, `en=diagnostic_started`) exactly as expected. Recorded
here so a future session testing GTM changes doesn't lose time to the same artifact — after
any GTM publish, either wait out the cache window or test in a context that has never loaded
`gtm.js` for this container ID before, not just "a new tab" (HTTP cache is profile-wide, not
per-tab).

**Related Documents:** `docs/tasks/05-landing-and-measurement.md` (T5.3), `docs/features/
measurement-and-attribution.md`, `memory/technical-debt.md` ("GTM container not yet
provisioned," now Resolved), `memory/completed-work.md` (2026-09-10 (T5.3) entry),
`lib/data-layer.ts`, `components/consent-banner.tsx`, `app/layout.tsx`.

## 2026-09-10 (T5.2, session 34) — `downloadFileUrl` added to `LandingPage`: admin-uploadable, not developer-supplied; absence is a handled state, not debt

**Status:** Standing
**Supersedes:** The 2026-09-10 (T5.2) entry immediately below ("Funding-Readiness
Checklist's CTA routes through `/contact` ... until the firm supplies the real asset")

**Summary:** User feedback, same day: the original framing — "wait for the user/firm to
supply the real checklist document directly" — was wrong. A landing page's downloadable
asset should be something a partner uploads through `/admin`, like any other content this
project already treats that way (`site_settings`, `footer_content`, author photos), not
something handed to whoever's implementing the code. Corrected by adding
`LandingPage.downloadFileUrl` (nullable `String`) to the schema, and a new
`LandingPageCta` client component (`components/landing-page-cta.tsx`, mirroring
`WhatsAppLinkButton`'s click-tracked-link pattern) that renders a real file-download link
firing `checklist_downloaded` when it's set, and falls back to the existing `ctaHref`/
`ctaLabel` link when it's null. This makes "no file uploaded yet" a normal, permanently
correct state the page already handles by design — not a temporary gap waiting on an
external supply — so it is explicitly **not** technical debt on its own. What _is_ real
debt: T7.5 (Landing Pages admin, not yet built) needs to expose this field once it exists,
using the same R2 upload pipeline T7.6 plans for author photos (ADR 0004) — tracked as its
own, correctly-scoped `memory/technical-debt.md` entry and addendum on T7.5
(`docs/tasks/07-content-admin.md`), superseding the original entry's `Sequenced into: T5.3`
(T5.3 was never the right home for an admin-capability gap).

**Related Documents:** `docs/tasks/07-content-admin.md` (T7.5 addendum), `memory/
technical-debt.md` (new entry + the original entry marked Resolved), `prisma/schema.prisma`
(`LandingPage.downloadFileUrl`), `components/landing-page-cta.tsx`, `app/lp/[slug]/page.tsx`.

## 2026-09-10 (T5.2) — Funding-Readiness Checklist's CTA routes through `/contact`, not a fabricated download, until the firm supplies the real asset

**Status:** Superseded

**Summary:** Seeding the three real landing page instances surfaced a genuine gap:
`landing-funding-readiness-checklist.html`'s own mockup gates an actual PDF checklist behind
an inline name/email capture form, but no such real, firm-authored checklist document exists,
and `landing_page` (`landing-page-template.md`) has no capture-form fields to model one with
— building a new capture entity/endpoint was also well beyond this task's Size:S scope.
Fabricating a placeholder checklist PDF was rejected outright: CLAUDE.md's "do not fabricate
... any firm-supplied content" rule treats a real advisory document the same way it treats
legal text or diagnostic wording — something only the firm can author or approve, not
something to invent to make an acceptance criterion pass. Decided instead: seed this
instance's headline/body copy faithfully from the accepted mockup (real, not placeholder —
same `isPlaceholder: false` precedent `seedOffers`/`seedHomePageContent` already established
for mockup-sourced copy), but point its `ctaHref` at the real, already-working
`/contact?service=funding-readiness-pack` enquiry route — the same underlying offer, reached
through a real destination rather than a fake or missing one. Logged as an Open,
User-triggered technical-debt entry (`memory/technical-debt.md` → "Funding-Readiness
Checklist landing page has no real downloadable asset yet") sequenced into T5.3, since that
task's own contract assumes a real "checklist_downloaded" event source already exists, which
currently doesn't for this one event.

**Related Documents:** `docs/tasks/05-landing-and-measurement.md` (T5.2), `memory/
technical-debt.md`, `memory/completed-work.md` (2026-09-10 (T5.2) entry), `prisma/seed.ts`
(`seedLandingPages`).

## 2026-09-10 (T5.1) — Landing page's "no navigation" rule scoped to the header only; `SiteFooter` reused unmodified, nav columns included

**Status:** Standing

**Summary:** `landing-page-template.md`'s business rule and T5.1's own acceptance criteria
both say "no site navigation renders under any circumstance," while the same task's
architecture constraints separately require reusing the real, unmodified `SiteFooter`
component for the Section 8.2 statement — and `SiteFooter` itself renders three columns of
site-wide nav links (Core Offers/Firm/Insights) plus the address block. These two requirements
only coexist if "no navigation" is read as scoped to the page's _header_ (the primary way a
distracted paid-ad visitor could leave the campaign message) rather than the footer's
existing link columns. Resolved in favour of that reading: built a dedicated `LandingPageHeader`
component (`components/landing-page-header.tsx`) with zero `<nav>` markup at all — no menu, no
Core Offers dropdown, no mobile drawer — reusing only `SiteHeader`'s fixed-position/
transparent-over-hero/logo-swap-on-scroll visual language, and kept `SiteFooter` exactly as
every other page renders it, nav columns included. Verified via Playwright's accessibility
tree: the rendered page has zero `<nav>` landmarks anywhere, header included — the acceptance
criterion holds literally, just not by stripping the footer down to a per-instance copy (which
the architecture constraint explicitly forbids: "never a per-instance copy that could drift").
Also decided: `LandingPage.bodyContent` is an ordered `kind`-discriminated block list
(`heading`/`paragraph`/`list`/`stats`/`steps`), same convention as `LegalPage.body`/
`Article.body`, sized to exactly the shapes the three accepted mockups use — not a
general-purpose page builder, and not per-slug hardcoded copy in the route (which would have
broken `content-management-admin.md`'s "no code change required to create a new landing page"
rule, unlike the offer page's closed-set `FINAL_CTA_COPY` precedent, since landing pages are
NOT a fixed set of three the way core offers are).

**Related Documents:** `docs/tasks/05-landing-and-measurement.md` (T5.1), `docs/features/
landing-page-template.md`, `memory/completed-work.md` (2026-09-10 (T5.1) entry),
`app/lp/[slug]/page.tsx`, `components/landing-page-header.tsx`, `lib/landing-pages.ts`.

## 2026-09-10 — Pre-push hook implemented via `core.hooksPath` + `npm run prepare`, not Husky

**Status:** Standing

**Summary:** CLAUDE.md had described a pre-push hook as already existing since at least
session 30 (Quality Gates section, and the Next.js 16 typed-routes note), but it was never
actually built — `.git/hooks/pre-push` didn't exist and no hook-manager dependency was
installed. Surfaced when the user reported repeated GitHub CI failures and asked for a
pre-push hook so failures surface locally first. Chose git's native `core.hooksPath` pointing
at a tracked `.githooks/pre-push` script over adding Husky (or similar): the project's ADR
0001 "packages are building blocks, not owners" ethos plus the general "don't add a
dependency for what a few lines of native tooling already does" preference made a
dependency-free hook the better fit here — `core.hooksPath` is a one-line `git config` call.
`npm run prepare` (a script npm already auto-runs on `install`/`ci`) sets it, so every fresh
clone gets the hook with no manual step. The hook runs lint → format:check → typecheck →
test, aborting on first failure, matching the exact order CLAUDE.md's Quality Gates section
already described.

**Related Documents:** `memory/completed-work.md` (2026-09-10 entry, "T1.1 follow-up"),
`.githooks/pre-push`, `package.json` (`prepare` script), `.github/workflows/ci.yml`.

## 2026-09-06 (session 30) — Project aligned with the updated PROJECT_PLANNING_FRAMEWORK.md; commit-message hook added; Status field backfilled onto decision-log.md/architecture-decisions.md

**Status:** Standing

**Summary:** The user pointed at an updated version of `PROJECT_PLANNING_FRAMEWORK.md`
(external to this repo, under `Planning framework and trigger/`) and asked what had changed
since this project's own planning was completed, and how it could improve this project.
Read the full 1,563-line updated framework and diffed it against this project's actual
state (file sizes, `.claude/` contents, memory-file contents) rather than assuming. Reported
findings before changing anything, per the user's explicit request, then implemented the
four changes the user approved.

**Findings:** The framework's memory-file sequencing discipline (`Trigger type`/`Sequenced
into` on technical-debt/known-bugs, evidence-gated Phase 2 roadmap) was already correctly
implemented in this project — no gap there. The genuine gaps were: (1) root `CLAUDE.md` had
grown to 42,606 characters, past the framework's new ~40,000-character "Phase 7 closing
check" threshold, because the framework's newer "keep CLAUDE.md lean" doctrine (move
single-trigger-point detail into `.claude/skills/`) hadn't been applied — MCP Server Setup,
Session Management, and Git Commit Protocol were still fully inline; (2) the framework's now-
required commit-message-format hook didn't exist — enforcement of `<type>(id): description`
and no-`Co-Authored-By` was prose-only; (3) `memory/decision-log.md` (55 entries) and
`memory/architecture-decisions.md` (11 entries) had no `Status` field on any entry, so the
existing Rollback/Revision Protocol had no field to actually flip when a decision is
reversed; (4) `/review` didn't check for orphaned technical-debt/known-bugs fixes or
un-flipped Status fields.

**Conflict surfaced and resolved:** The framework's required hook blocks any commit
containing a `Co-Authored-By` trailer — the same rule this project's own CLAUDE.md already
stated. But the session's own harness-level instructions (session-specific, not a durable
project rule) called for adding a `Co-Authored-By: Claude Sonnet 5` trailer to every commit.
Surfaced this directly to the user rather than silently picking a side; the user chose to
keep this project's existing no-trailer rule and override the session default for this repo.

**Decisions made:**

- Extracted `.claude/skills/mcp-server-setup/SKILL.md`, `.claude/skills/session-management/
SKILL.md`, and `.claude/skills/git-commit-protocol/SKILL.md` from CLAUDE.md's inline
  sections, leaving short pointer versions in CLAUDE.md (now 35,133 characters). AGENTS.md
  is untouched — it has no skill-loading mechanism and must stay fully self-contained for
  non-Claude-Code tools.
- Backfilled `**Status:** Standing` onto all 55 `memory/decision-log.md` entries and
  `**Status:** Active` onto all 11 `memory/architecture-decisions.md` entries. While doing
  this, found one entry that had genuinely already been reversed (T1.3's "globals.css kept
  to design-system.md's token set exactly" decision, reversed by the very next entry above
  it in the file) and marked it `Superseded` rather than defaulting it to `Standing` — the
  first real use of this field, applied retroactively and correctly rather than rubber-
  stamped. Documented the field in CLAUDE.md's "Memory file format and ordering" section and
  the Rollback/Revision Protocol.
- Added a "Debt/bug and decision-log entry hygiene" section to `.claude/commands/review.md`
  checking for orphaned fixes and un-flipped Status fields.
- Built `.claude/hooks/validate-commit-message.py` (a `PreToolUse` hook on `Bash`, wired into
  `.claude/settings.json`), enforcing the commit message format and the no-`Co-Authored-By`
  rule mechanically. Pipe-tested against synthesized payloads (valid message, wrong-format
  header, `Co-Authored-By` trailer, non-commit command, `--amend`) before trusting it; did
  **not** test it via a real `git commit` in the same session that just wired it into
  `.claude/settings.json`, since a hook change (like an MCP server change) only takes effect
  after a session restart — running a real commit against the _old_, not-yet-reloaded
  settings could have created an unwanted commit if the hook silently wasn't active yet.
- **New commit-ID convention, discovered as a side effect of writing this very entry's own
  commit**: the hook as first built only accepted the `T##-##` task-ID form, but this
  project's own git history already used a `P#-#` form for pre-task Phase-2-capability
  scoping work (e.g. `docs(P2-8): ...`, session 29) — a legitimate, pre-existing exception
  the strict hook would have newly blocked. This session's own commit (framework/tooling
  alignment, no task or capability attachment) had no valid ID under either form. Rather
  than invent a fake task ID, added a third, explicit form: the literal `process` token, for
  sessions that change project process/tooling/scaffolding itself. Documented all three
  forms (`T##-##`, `P#-#`, `process`) in the `git-commit-protocol` skill and the hook's own
  error message, so the three-way convention is discoverable, not just inferred from one
  commit.

**Related Documents:** CLAUDE.md, `.claude/skills/mcp-server-setup/SKILL.md`,
`.claude/skills/session-management/SKILL.md`, `.claude/skills/git-commit-protocol/SKILL.md`,
`.claude/hooks/validate-commit-message.py`, `.claude/settings.json`,
`.claude/commands/review.md`, `memory/architecture-decisions.md`,
`Planning framework and trigger/PROJECT_PLANNING_FRAMEWORK.md` (external reference, not part
of this repo).

## 2026-09-06 (session 29) — New Phase 2 capability scoped and sequenced: Subscriber Outreach via Brevo Campaigns (P2-8)

**Status:** Standing

**Summary:** After T4.5 shipped, the user asked directly whether the system had any plan to
actually use the subscriber emails it now collects (from the Insights form, and from the
Contact/diagnostic-summary forms' `marketing_consent` checkboxes this same session wired
into the same table) — beyond the one-time confirmation email. Researched every planning
document, including Document 13.03 itself, directly: confirmed there is **no plan anywhere**
for the firm to actually email this list. This is a genuine, previously-unnoticed gap, not
an intentional omission — nothing in the source material ever said "don't build this," it
simply never came up until real subscriber rows existed to surface the question.

The user asked for this to be scoped as a proper feature and sequenced into Phase 2,
following this project's existing evidence-gated pattern (P2-1 through P2-7), and separately
raised that Brevo (already the firm's transactional-email provider since T3.7) has its own
full campaign-composition/sending dashboard as part of its platform — asking how that could
be used alongside whatever gets built on the site itself.

**Decision:** P2-8, "Subscriber Outreach via Brevo Campaigns" — the site keeps `subscriber`
as the sole system of record for consent and pushes a one-way sync to a dedicated Brevo
contact list on every subscribe/re-confirm/unsubscribe (from all three consent-collection
points, not just the dedicated Insights form), with one inbound webhook path back for a
Brevo-side unsubscribe/bounce/complaint. The actual campaign — composing, sending, and
reading open/click/unsubscribe performance — happens entirely inside Brevo's own separate
dashboard, by a partner, never rebuilt inside kaalbert.com's own admin. Recorded as ADR 0012,
reasoning by direct analogy to ADR 0001's own infrastructure exception (a managed platform
running one well-scoped job is not the same as a product owning the admin/data model/routes)
and to ADR 0006's GTM decision (a mature external tool for a narrow job the firm's own scale
doesn't justify reproducing).

**Where this lives:** `docs/requirements.md` FR-16, `docs/user-stories.md` Story 23,
`docs/scope.md` P2-8 (explicitly marked "not from Document 13.03" — every other Phase 2 item
traces to Document 13.03 §14; this one doesn't, and says so), `docs/roadmap.md` Milestone 17,
`docs/features/subscriber-outreach.md`, `docs/tasks/17-subscriber-outreach.md` (T17.1–T17.3),
`docs/adr/0012-brevo-campaigns-for-subscriber-outreach.md`. Also closed a small pre-existing
gap found while here: `docs/architecture.md`'s External Dependencies table never listed
Brevo at all, even for its already-live transactional role (T3.7) — added, covering both the
live use and the Phase 2 extension. Cross-referenced from `docs/tasks/07-content-admin.md`
(T7.9 addendum) and `docs/features/insights-engine.md` (subscriber entity note). `CLAUDE.md`'s
Phase 2 capability list updated to include this eighth item.
**Related Documents:** All files listed above; memory/completed-work.md (session 28, T4.5)
for the subscriber-capture work that surfaced this gap.

## 2026-09-06 (session 28) — Subscription capture (T4.5): schema/interface decisions, a real redirect bug caught by Playwright, and closing a pre-existing promise gap in two other forms

**Status:** Standing

**Summary:** Several judgment calls and one real bug this task's own verification caught:

1. **`Subscriber.unsubscribeToken`, not the row's own `id`, identifies a one-click
   unsubscribe.** A sequential integer `id` would let anyone enumerate/unsubscribe another
   visitor by guessing a small number — this is a real, unauthenticated, third-party-clickable
   link, unlike most of this project's other internal-use identifiers. Used Prisma's native
   `@default(cuid())`, no new dependency.
2. **Both `GET` and `POST` implemented on `/api/insights/unsubscribe`.**
   `insights-engine.md` names the interface as `POST`, but describes its use as "a one-click
   link in every sent email" — a plain `<a href>` a mail client renders can only ever issue a
   `GET`. Built both, sharing the same `unsubscribeFromInsights` call: `GET` is what the real
   emailed link points to (redirecting to a visible `/insights` confirmation), `POST` exists
   for the literal documented interface (e.g. a future "manage your subscription" page).
3. **A confirmation email is sent on every subscribe/re-confirm**, via `lib/email.ts`'s
   `sendTransactionalEmail` (T3.7) — this is what "reusing T3.7's email utility" in the task's
   own dependency line actually means in practice, since no bulk-newsletter-sending feature
   exists yet to otherwise carry the required unsubscribe link.
4. **Real bug caught by this session's own Playwright verification**: the `GET` unsubscribe
   handler's redirect originally used `getSiteUrl()` (falls back to the hardcoded production
   domain, `kaalbert.com` — not registered yet, per CLAUDE.local.md) as the redirect base.
   Clicking the link in a real browser produced `net::ERR_NAME_NOT_RESOLVED`, since the
   browser tried to follow the redirect to a domain with no DNS record. Fixed by building the
   redirect from the _request's own_ origin (`new URL(path, request.url)`) instead — a
   redirect after following a link must land back on whichever host actually served the
   request (dev, a Railway preview, or production), never an unconditional hardcoded domain.
   `getSiteUrl()` remains correct for the _emailed_ unsubscribe link itself (an email must
   point at the real public domain regardless of which environment generated it) — the bug was
   specifically in reusing that same helper for an in-browser redirect, a different context
   with a different correct answer.
5. **Closed a real, pre-existing promise gap in two already-shipped forms** (T2.6's
   `ContactForm`, T3.7's `DiagnosticSummaryRequestForm`): both forms' own `marketingConsent`
   checkbox copy has always said, specifically, "I'd also like occasional Insights articles
   and updates from Kaalbert & Company" — but no `subscriber` row existed to honour that until
   this task built one, so a checked box silently did nothing toward Insights. Wired both
   (`lib/enquiries.ts`'s `createContactEnquiry`, `lib/diagnostic-request-summary.ts`'s
   `requestDiagnosticSummary`) to call the same `subscribeToInsights` this task's own
   `/api/insights/subscribe` uses, fire-and-forget (a failure here must never undo the
   enquiry/summary-request that already succeeded). This is not scope creep into unrelated
   forms — it is the concrete, previously-unfulfillable half of a promise those forms already
   made, now fulfillable because this task built the missing piece; same "fix now, same
   session, when a gap is small and this task is exactly what unblocks it" pattern already
   established at T2.1/T3.7 (sessions 23, 25) — not deferred as technical debt, since nothing
   would ever "reach" T2.6/T3.7 again to pick it up (the same lesson from session 25's own
   corrected mistake).
   **Related Documents:** docs/features/insights-engine.md, components/contact-form.tsx,
   components/diagnostic-summary-request-form.tsx, lib/enquiries.ts,
   lib/diagnostic-request-summary.ts, lib/insights-subscription.ts,
   app/api/insights/unsubscribe/route.ts, memory/completed-work.md (session 28)

## 2026-09-06 (session 27) — Article content seed (T4.4): the real 8 articles, found and seeded; plus a real Home card bug found once real content existed

**Status:** Standing

**Summary:** T4.4 initially looked headed for an "empty state" resolution: Document 13.03
§13 names 8 real Insights articles as "already written" but cites no locatable file, and a
search of every sibling planning folder at the time found none — only the ownership/tracking
table. The user then located and supplied the real source: `Company Docs/11 Thought
Leadership/11.01`–`11.10`, two editorial volumes (Volume One: 4 foundational essays; Volume
Two: 4 shorter pieces on cash/pricing/evidence/people), exactly matching §7's own "eight
completed articles under two editorial volumes" line.

Extracted all 8 articles' real text (Word paragraph styles parsed programmatically —
`Heading2` → subheading blocks — to avoid manual transcription errors) and seeded them
verbatim as real, non-placeholder `Article` rows (`isPlaceholder: false`). Two things Document
13.03 §13 itself flagged as still outstanding were resolved as this task's own editorial
judgement calls, not fabrication:

1. **Author attribution** — the source text is attributed generically to "Kaalbert & Company
   Ltd," not a named partner (§13: "Requires web formatting, author attribution..."). Assigned
   each of the 8 articles to one of the firm's 5 real partners by subject-matter fit against
   their real practice areas (e.g. "Structure Is the Real Capital" → Evans Agyemang, Financial
   Control & Compliance; "Speaking the Language of Capital" → Albert Kwakye Amponsah, whose
   Lead Consultant role already owns the Funding-Readiness Pack per 13.03 §13's own content-
   ownership table), spread roughly evenly (2/2/2/1/1) rather than clustered.
2. **Categories** — consolidated the 8 articles' own stated "Theme" metadata into 6 real
   category rows (e.g. "Structure & Formalisation," "Growth & Strategy") rather than 8
   one-article categories or the mockup's fictional two-category split, grouping by genuine
   thematic overlap (e.g. Pricing joined Growth & Strategy; two "leadership" pieces from
   different volumes joined Leadership & Team).

`previewImage` stays null on every row — §13 lists "preview images" as still outstanding (a
photography/design deliverable this task can't produce) — falling back to the site's default
OG image until real ones exist. `nextStepCta` per article was adapted (condensed, not
invented) from that same article's own real "How Kaalbert can help" closing section in the
source document, mapped to a real core offer where one directly fits (Funding-Readiness Pack,
Financial Clarity Pack) and to the free Business Health Check otherwise — the same "soft
re-engagement" default the three core offer pages themselves already use.
`publishedAt` dates are spread biweekly (2026-06-01 to 2026-09-01), matching §7's stated
"two articles per month" cadence, even though all 8 were seeded in one batch.

**A real bug found once real content existed, fixed in the same session:** viewing the real
seeded content surfaced two problems the earlier synthetic/throwaway test data (T4.2/T4.3
sessions) never exercised enough to reveal. (1) `lib/about.ts`'s `getInitials` (built and
verified for person names) produced "L&" for a category thumbnail fallback on a name like
"Leadership & Team," since its naive first-and-second-word split treats a bare "&" as a word
— fixed with a small local `categoryInitials` helper that skips symbol-only words. (2) The
user then flagged, correctly, that Home's own featured-Insights cards (`app/(public)/
page.tsx`) had drifted into a visually different, unlinked `<div>` with no path to the article
_or_ to `/insights` itself — a real regression nobody had reason to notice while
`getFeaturedArticles` returned `[]` (T2.1's original stub) or synthetic test rows. Root cause:
`getFeaturedArticles` returned its own ad hoc shape (`category` as a plain string) instead of
`lib/insights.ts`'s shared `InsightsArticleCard` shape, so Home's card markup necessarily
diverged from the real Insights index's own card. Fixed by extracting the index's card into a
shared `components/insights-article-card.tsx` (`ArticleCard`, plus the `categoryInitials`
helper), exporting `lib/insights.ts`'s internal `shapeArticleCard` row-shaping function so
`getFeaturedArticles` produces the identical shape, and adding a "See all Insights →" link
next to the section heading. Home and the Insights index now render literally the same
component for an article card, so this class of drift can't recur.
**Related Documents:** Document 13.03 §7/§13, `Company Docs/11 Thought Leadership/11.01`–
`11.10`, docs/features/insights-engine.md, prisma/seed.ts, lib/insights.ts, lib/home.ts,
components/insights-article-card.tsx, memory/completed-work.md (session 27)

## 2026-09-06 (session 26) — Article template (T4.3): schema/design decisions made building against the mockup

**Status:** Standing

**Summary:** Several real design gaps surfaced building `/insights/[slug]` against
`ui/mockups/b-insights/insight-owner-drawings.html`, flagged in advance by session 25's own
handoff note:

1. **`Article.nextStepCta` widened from `{label, href}` to `{heading, body, label, href}`** —
   the mockup's next-step panel has its own heading and lead paragraph above the CTA button,
   not just a link (FR-3.4's "contextual next step specific to its subject" needs real prose,
   not just a button). No migration was needed — `nextStepCta` is a `Json` column with no
   fixed database-layer shape, so this was a pure type/documentation change (see
   `prisma/schema.prisma`'s `Article` doc-comment and `npx prisma migrate dev`'s own "already
   in sync" confirmation after the doc-comment-only edit).
2. **`Article.body`'s block shape defined for the first time** (T4.1 deferred this on
   purpose) — `lib/insights.ts`'s `ArticleBodyBlock`, a `kind`-discriminated union mirroring
   `lib/legal.ts`'s `LegalPageBlock` convention exactly: `paragraph`, `heading`, `quote`,
   `list`, `table` — covering exactly what the mockup's article body actually uses.
3. **The mockup's `.resource-callout` (generic Health Check CTA) and `.share-row` treated as
   fixed template chrome**, not per-article data — no field for either exists in
   `insights-engine.md`'s Data requirements, and the share row specifically must NOT reuse
   `components/whatsapp-link-button.tsx` (that component fires the fixed `whatsapp_opened`
   conversion event for contacting the firm; sharing an article link is a different action
   with no target number and no event of its own).
4. **A removed `article_resource` file's "fail gracefully" requirement implemented as a live
   per-request `HEAD` check** (`lib/insights.ts`'s `isResourceReachable`) since no object
   storage (R2, ADR 0004) exists yet to answer this more cheaply — logged as technical debt
   (`memory/technical-debt.md`, sequenced into T7.2) to replace once R2 is provisioned, not a
   permanent design.
5. **Share buttons use `rounded-full` despite T4.2's own "no pill shapes" correction** — a
   deliberate, narrow exception: T4.2 corrected _wide, text-label_ filter chips from a true
   pill (`border-radius: 999px`) to `rounded-sm`, per `ui/design-system.md`'s rule against
   "decorative excess." A perfect circle sized for exactly one glyph (these share buttons) is
   a different, common, restrained shape — not the wide-pill excess that rule targets — so it
   was kept as `rounded-full`, documented inline in `app/insights/[slug]/page.tsx` so a future
   reader doesn't read this as an inconsistency with T4.2's fix.
6. **`buildPageMetadata` (`lib/seo.ts`) extended with optional `imageUrl`/`type` params**
   rather than a separate article-specific metadata function — every other caller keeps
   working unchanged (both default to the existing logo/`"website"` behaviour), and the
   article page is the only caller that needs `previewImage`/`"article"` — avoids duplicating
   the whole OG/Twitter shape for one varying case.
7. **A new `getArticleJsonLd` (`lib/seo.ts`) + `ArticleJsonLd` component**, rendered alongside
   (never instead of) the existing `OrganizationJsonLd` every page already carries — per
   `seo-and-search-foundation.md`'s own "What this is not" section, which explicitly left
   per-article structured data to this feature/task.
8. **No "X min read" byline text** — confirmed at T4.2 already (not re-litigated): not a real
   field, not safely derivable without a much heavier body-parsing pass than this task's scope
   warrants.

**Related Documents:** docs/features/insights-engine.md, ui/mockups/b-insights/
insight-owner-drawings.html, docs/tasks/04-insights.md (T4.3), prisma/schema.prisma,
lib/insights.ts, lib/seo.ts, memory/technical-debt.md

## 2026-09-06 (session 25) — Corrected a misapplied debt-sequencing addendum: fixed Home's featured-Insights stub immediately instead of leaving a note on the already-shipped T2.1

**Status:** Standing

**Summary:** While building T4.2, noticed `lib/home.ts`'s `getFeaturedArticles()` stub could
now be replaced with a real query (its own comment said so, once Milestone 4 landed
`article`). First pass handled this per CLAUDE.md's debt-sequencing rule at face value: wrote
a `memory/technical-debt.md` entry and attached an "Addendum" block to T2.1's entry in
`docs/tasks/02-public-presentation.md`, with `Sequenced into: T2.1`. The user asked why a gap
was deferred onto an already-shipped task rather than just fixed — a fair challenge. On
reflection, the addendum was inert: the debt-sequencing rule exists so "whichever session
reaches this task in the normal course of work" does the fix, but task IDs in this project's
`/task` workflow only ever move forward — nothing ever "reaches" T2.1 again, so a note left
there would never resurface. The rule's "if an existing task is the natural home" branch
means a task a future session will actually execute, not merely the module that historically
owns the code.

This project already has the right pattern for exactly this situation: session 23's "T3.7
follow-up" revisited an already-shipped task in the same session the gap was found, fixed it
immediately, and committed under that original task's identity (see
`memory/completed-work.md`, session 23, and `memory/technical-debt.md`'s diagnostic-summary-
email entry). Corrected course to match: reverted the T2.1 addendum, marked the technical-
debt entry `Resolved` (rather than deleting it — keeping an honest record of both the gap and
the process correction), and fixed `getFeaturedArticles` for real in the same session, logged
as "T2.1 follow-up" in `memory/completed-work.md`.

**Takeaway for future sessions:** when a debt/bug fix is small enough to do immediately and
the "owning" task has already shipped, do it now as a same-session task follow-up (T3.7's
pattern) — don't reach for the technical-debt.md + epic-addendum mechanism, which is for
fixes that must wait for a _future_ task to actually be reached. Reserve that mechanism for
fixes that genuinely can't happen now (need a task not yet reached, a decision not yet made,
or a user action not yet taken).
**Related Documents:** CLAUDE.md ("Debt/bug fixes must be sequenced into a task, never left
orphaned"), memory/technical-debt.md, memory/completed-work.md (sessions 23 and 25),
docs/tasks/02-public-presentation.md

## 2026-09-06 (session 25) — Insights index (T4.2): `Article.excerpt` added, and the mockup's pill-shaped filters corrected to the design system's own radius rule

**Status:** Standing

**Summary:** Two real gaps surfaced building `/insights` against `ui/mockups/b-insights/
insights-index.html`. (1) The mockup's article cards show a short, purpose-authored teaser
distinct from the title and from the rich `body` content — `insights-engine.md`'s Data
requirements section never named this field. Added `Article.excerpt` (required `String`) via
its own migration (`20260906043727_add_article_excerpt`), same "discovered once actually
building the real page" precedent as `Offer.ctaLabel`/`tiers` (T2.2) and `MethodStage.
whatHappens` (T2.4) — logged in `prisma/schema.prisma`'s own `Article` doc-comment. (2) The
mockup's `.filter-pill` category chips use `border-radius: 999px` (a true pill shape), but
`ui/design-system.md`'s Radius section explicitly rules pill shapes out ("restraint in this
brand system means no decorative excess (no pill shapes, no exaggerated rounding)") — a
corrective note the design system itself added after reviewing an earlier built mockup.
Built the filter chips at `rounded-sm` instead, same structure (a row of clickable category
filters, active state highlighted) with the token-compliant radius substituted in — the
accepted design-system document overrides the static wireframe tool's own default shape here,
per CLAUDE.md's "do not introduce a … radius outside that token set" rule.

Also deliberately did **not** carry over the mockup's "X min read" byline text (no such field
exists or is derivable without first defining `body`'s exact rich-content-block shape, which
is T4.3's job, not T4.1/T4.2's) — same "mockup chrome that isn't part of the real data
contract" precedent as `HomePageContent`'s fixed hero-facts sidebar (T2.1). Category filter
"pills" also render a single fixed brand-gradient thumbnail (not the mockup's two
hardcoded per-category gradient colours) since `Category` is a real admin-manageable,
open-ended list (`content-management-admin.md`), not the mockup's fixed two-category set —
hardcoding colours per category slug wouldn't generalize.

Separately, closed a small, directly-related gap while here: `lib/seo.ts`'s
`getSitemapEntries()` had an explicit code comment saying `article` wasn't queried because
"the table doesn't exist yet" (Milestone 4) — now that it does and `/insights` reads it live,
added published articles into the sitemap, per `seo-and-search-foundation.md`'s own
Interfaces section ("every published Insights article"). Left `lib/home.ts`'s
`getFeaturedArticles()` stub untouched — that's Home's own content block (a separate route,
needing an excerpt-length teaser this task already added but no more work than that), out of
this task's own Input → Output contract — see `memory/technical-debt.md`'s new entry, sequenced
into an addendum on T2.1.
**Related Documents:** docs/features/insights-engine.md, ui/design-system.md,
ui/mockups/b-insights/insights-index.html, docs/features/seo-and-search-foundation.md,
docs/tasks/04-insights.md (T4.2), prisma/schema.prisma, lib/insights.ts, lib/seo.ts

## 2026-09-06 (session 24) — Insights data model (T4.1): field shapes not spelled out literally by insights-engine.md

**Status:** Standing

**Summary:** `insights-engine.md`'s Data requirements section names `article` fields close to
literally (`author_id`, `published_at`, `preview_image`, `next_step_cta`), unlike some other
feature docs' descriptive-English lists — so most fields mapped straight across. A few needed
a judgment call: (1) `next_step_cta` is modelled as one `Json` `{label, href}` column, not two
scalar fields like `Offer.ctaHref`/`ctaLabel`, since the doc names it as a single field this
time and there's no admin editor yet to need per-field editing. (2) `preview_image` is
nullable at the schema layer even though the feature doc's edge case requires the admin
publish flow to demand one before publication — enforcement belongs at the app layer (same
precedent as `EnquiryRecord`'s progressively-filled contact fields), not a `NOT NULL`
constraint that would make an in-progress draft impossible to save. (3) `category` (singular,
in the doc's field list) is modelled as the nullable FK `categoryId`/`Category?`, with
`onDelete: SetNull` — implementing `content-management-admin.md`'s explicit rule that
retiring a category never deletes or orphans its articles, they just fall back to "no
category." (4) `Category` itself gained an `isPlaceholder` column beyond the feature doc's
literal id/name/slug list, same precedent as `Capability`/`MethodStage`/`Page` — needed
because T4.4 seeds both real and illustrative categories. `Article.isPlaceholder` was added
at schema-creation time per T4.1's own explicit instruction (not deferred as a retrofit).
**Related Documents:** docs/features/insights-engine.md, docs/features/content-management-
admin.md, docs/tasks/04-insights.md (T4.1), prisma/schema.prisma

## 2026-09-06 (session 23) — Split the score band's emailed content from its on-screen statement into two separate, independently admin-editable fields

**Status:** Standing

**Summary:** The user asked whether the summary email's content was admin-editable, since it
felt thin. Digging in: the subject/intro/closing wording is fine as plain copy (no feature doc
ever claimed it was database-driven), and the disclaimer/footer legal text is _deliberately_
hardcoded verbatim (FR-2.8 and the site-wide scope-of-practice statement, both matched
exactly elsewhere in the codebase — not a gap). The real problem was narrower and more
specific: the user clarified they meant the email is supposed to be the "full detail" version
but `buildSummaryEmailHtml` was rendering `DiagnosticScoreBand.statement` — the identical
short sentence `/diagnostic/results` already shows on screen. So the email wasn't actually
fuller than the screen at all, despite being introduced to the visitor as "the full written
summary."

Considered reusing `statement` and just writing it longer, but that would make the on-screen
result longer too (both read the same field) — directly against FR-2.3's design intent that
the on-screen result stays a teaser and the email is the real payoff for handing over contact
details. Instead added a fourth column to `DiagnosticScoreBand`: `emailDetail`, a separate,
longer, multi-paragraph narrative (paragraphs split on a blank line) read only by
`buildSummaryEmailHtml`, never by `/diagnostic/results`. Seeded real (placeholder-flagged, per
CLAUDE.md's fabrication rule) detailed copy for all four bands — genuinely more substantive
than the one-liner `statement`, written to read like what a partner would actually want a
prospect to receive by email. Falls back to `statement` if a row's `emailDetail` is ever
blank, so a freshly-added band never renders an empty section.

Verified for real, not just via unit tests: submitted a live diagnostic response through the
running dev server's own `/api/diagnostic/submit`, fetched the resulting real `enquiry_record`
and its DB-backed `DiagnosticScoreBand` row, and rendered the actual production
`buildSummaryEmailHtml` function against that real data — confirmed two genuine paragraphs of
new content in the output, correct HTML-escaping, and a real Playwright screenshot of
`/diagnostic/results` confirming the results screen itself is untouched (still shows only the
short `statement`, no regression). Test rows deleted afterward via the same cleanup pattern
used in prior sessions.

No `/admin` screen exists yet to edit this (or the `label`/`statement` fields either) —
Milestone 7 hasn't been built. Logged as technical debt sequenced into T7.7, same as the
original score-band gap; this session only extends the data model, seed, and email-read path,
consistent with how the original `DiagnosticScoreBand` model itself was introduced ahead of
its own admin screen.

**Related Documents:** `docs/features/business-health-check-diagnostic.md`,
`docs/features/content-management-admin.md`, `docs/tasks/03-diagnostic.md` (T3.7 addendum),
`docs/tasks/07-content-admin.md` (T7.7 addendum), `memory/technical-debt.md`.

## 2026-09-06 (session 22) — Rebuilt the summary email's HTML on the real brand tokens (Pine Green/Antique Brass, Georgia/Calibri), table-layout for email-client compatibility

**Status:** Standing

**Summary:** The user asked whether the summary email was actually styled/branded — it
wasn't; `buildSummaryEmailHtml` (T3.7) was a plain unbranded `<div>` with arbitrary colors.
Rebuilt it using `ui/design-system.md`'s own fixed tokens verbatim (Pine Green `#0E2A22`,
Antique Brass `#8C6E33`, Ink/Ink 600, Ivory/Paper/Muted/Rule) and its fixed typeface pairing
(Georgia display / Calibri body, both system fonts — no web-font loading needed, which email
can't do reliably anyway). Switched to a `<table>`-based layout with inline styles throughout
(the pattern that survives Outlook's Word rendering engine as well as modern webmail, unlike
flex/grid) — a dark Pine header band with the wordmark, a white body card with the score/
band/dimension breakdown/disclaimer, and a muted footer band carrying the same scope-of-
practice line the real site's own footer uses. `buildSummaryEmailHtml` was also exported
(previously module-private) specifically so a preview script can render the exact same HTML
a real send uses, with zero risk of the preview drifting from production. Rendered two real
profiles (a 60%/"Developing, With Real Gaps" case exercising weakest-dimension highlighting,
and a 92%/"Strong Foundation" case) via that exported function and published them as a
Claude Artifact (an iframe-isolated, theme-aware preview page) for the user to review visually
without needing another real send. All 13 existing unit tests still pass unchanged (the
tests assert on text content, not markup, so the redesign didn't break them).
**Related Documents:** `ui/design-system.md`, `lib/diagnostic-request-summary.ts`,
`memory/completed-work.md` (T3.7 entry).

## 2026-09-05/06 (T3.7, session 22) — Brevo chosen for transactional email (user decision); a second request-summary call updates in place and re-sends rather than rejecting; a failed email send never rolls back or blocks the enquiry update

**Status:** Standing

**Summary:** Built the gated summary-request step: the "Get the full written summary by
email" panel on `/diagnostic/results` (`components/diagnostic-summary-request-form.tsx`),
`POST /api/diagnostic/request-summary` (`app/api/diagnostic/request-summary/route.ts`), its
own business logic (`lib/diagnostic-request-summary.ts`), and the shared transactional email
utility this task's own note calls for building once, here, as its first consumer
(`lib/email.ts`, reused later by Milestone 4/8 rather than each re-implementing a send
mechanism). Several decisions:

1. **Brevo (`@getbrevo/brevo`, npm's current `6.0.3`) chosen for transactional email — the
   user's own decision, made specifically because Brevo supports single-sender verification
   (a 6-digit code to the sender's own inbox) as an alternative to full domain authentication
   — `kaalbert.com` isn't registered yet (`memory/technical-debt.md`), so a provider requiring
   DNS-based domain verification would have blocked sending entirely. Verified this claim via
   live research (Brevo's own developer docs and community forum) before building against it,
   matching this project's established research convention for infrastructure choices.
   Real credentials (`BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`) didn't exist at
   first — added to `.env.example`/`CLAUDE.local.md`, and the user was asked to provision them.
   **Update, same session (2026-09-06):** the user provisioned real credentials in
   `.env.local`; delivery confirmed for real — a direct `sendTransactionalEmail` call
   succeeded with no exception, and the full integrated `/api/diagnostic/submit` →
   `/api/diagnostic/request-summary` route also completed with no error logged (unlike the
   earlier missing-credentials test, which correctly logged and swallowed the failure).
   Credential values were checked only for presence/length (via `process.env.KEY.length`,
   never the value itself) and never printed to any command output, per the user's explicit
   instruction not to let them leak into the conversation. All test data deleted afterward.
2. **A second request-summary call for the same `enquiry_id` updates the row in place and
   re-sends the email — it is never rejected as a duplicate.** This task's own acceptance
   criteria don't call for rejecting a resend (e.g. the visitor corrects a typo'd email
   address, or asks again), and silently failing a second, well-intentioned attempt would be
   worse than sending twice. `enquiry_id` identifies the exact row T3.5 already created;
   `prisma.enquiryRecord.update` is used throughout, never `create` — the acceptance
   criterion this does satisfy ("the `enquiry_record` created in T3.5 is updated in place,
   not duplicated") is met by construction.
3. **A failed email send is logged, never thrown back to the visitor or rolled back.** The
   real, durable outcome — the firm now has this visitor's contact details on the enquiry
   record — already succeeded regardless of email deliverability, the same fire-and-forget
   treatment this project already gives the Meta Conversions API call
   (`docs/architecture.md`'s External dependencies table: "a failed call is logged, not
   retried inline"). Verified for real: submitted the real form against the running dev
   server with no Brevo credentials configured yet — the server logged
   `BREVO_SENDER_EMAIL is not set` and still returned `200`, the client showed "Summary on
   its way," and the `enquiry_record` was confirmed updated in place with the real name/
   email/`contactConsent: true` matching the on-screen result exactly.
4. **The summary email is plain server-rendered HTML, not a shared React component with the
   results page** — an email client renders neither React nor most CSS, and this task's own
   acceptance criterion ("the resulting email ... matches the on-screen result data") is
   about the _data_ matching (both read the identical stored `scoreSummary`), not the
   markup matching. Every user-supplied value (the visitor's own `name`) is HTML-escaped
   before being embedded in the email body.

Also verified for real: client-side consent gating (submitting with the checkbox unticked is
blocked before any request is sent, matching `components/contact-form.tsx`'s established
precedent), and no horizontal overflow at 390px/1280px. Test data deleted afterward.
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.7), `docs/features/business-health-
check-diagnostic.md` (Interfaces, FR-6.2), `docs/architecture.md` (External dependencies —
the Meta CAPI fire-and-forget precedent this follows), `.env.example`, `CLAUDE.local.md`,
`lib/email.ts`, `lib/diagnostic-request-summary.ts`,
`components/diagnostic-summary-request-form.tsx`,
`app/api/diagnostic/request-summary/route.ts`.

## 2026-09-05 (session 22) — Retrofitted `/diagnostic/results` with real score-band labels: a new `DiagnosticScoreBand` model, not an extension of `DiagnosticThreshold`

**Status:** Standing

**Summary:** User asked whether the mockup's score-band labels/statements ("Strong
Foundation," "Running on Memory," etc.) were already built or planned as admin-editable —
neither was true (see `memory/technical-debt.md`) — and asked to fix it now rather than defer
to T7.7. Added `DiagnosticScoreBand` (id, `minScore`, `label`, `statement`, `isPlaceholder`)
as its own model rather than extending `DiagnosticThreshold`: a real structural mismatch, not
a style preference — bands must cover the full 0–100 range with no gaps (every score matches
exactly one band), while thresholds are sparse, internal/partner-facing triage cutoffs that
may not be breached at all (a high score sets off no threshold and gets no
`triagePriorityLevel`). Migration `20260905235239_add_diagnostic_score_band`. Seeded the
mockup's own illustrative 4-band content (`ui/mockups/c-diagnostic/diagnostic-results.html`'s
`BANDS` array) verbatim, `isPlaceholder: true` from a real column (unlike
`DiagnosticQuestion`'s own gap, logged separately). Added `lib/diagnostic-flow.ts`'s
`getScoreBand(score)` (highest `minScore` not exceeding `score`, mirroring the mockup's own
`BANDS.find` logic) and wired it into `app/diagnostic/results/page.tsx`: the band label
(accent, bold) and statement now render where the mockup places them; the real, already-
computed `indicativeCostStatement` (T3.2's own output) moved to lead the dimension breakdown
panel instead of being dropped, so no real content was lost in fixing this. Verified for real:
submitted a genuine score-60 response through the running `/api/diagnostic/submit` endpoint,
loaded the results page, confirmed "Developing, With Real Gaps" and its real statement render
correctly at desktop and mobile widths with no horizontal overflow. Test row deleted
afterward. T7.7's own remaining job (admin-editing this content) is unchanged and still
pending — this fix only builds the data model, seed, and display side.
**Related Documents:** `memory/technical-debt.md`, `docs/tasks/07-content-admin.md` (T7.7
addendum), `ui/mockups/c-diagnostic/diagnostic-results.html`, `prisma/schema.prisma`,
`prisma/seed.ts`, `lib/diagnostic-flow.ts`, `app/diagnostic/results/page.tsx`.

## 2026-09-05 (T3.6, session 21) — `/diagnostic/results` reads T3.5's stored result via `searchParams`, never recomputes; FR-2.8's requirements-doc text used over the mockup's own paraphrase; the mockup's score-band labels not carried over

**Status:** Standing

**Summary:** Built `app/diagnostic/results/page.tsx` to `ui/mockups/c-diagnostic/diagnostic-
results.html`, reading `?enquiry_id=` (T3.4's own chosen URL contract) via `searchParams` —
not a `[id]` dynamic segment. A few decisions:

1. **Never recompute a score.** Added `getDiagnosticResultByEnquiryId` to
   `lib/diagnostic-submit.ts` — it reads `EnquiryRecord.scoreSummary` back as
   `DiagnosticScoringResult` (the exact shape T3.5 wrote it in) and returns it as-is. This
   page never calls `scoreDiagnosticResponses` itself; recomputing would duplicate business
   logic outside `lib/` and could disagree with what a partner sees for the same enquiry
   later (Milestone 8's enquiry management screen reads the same stored value).
2. **The disclaimer is FR-2.8's exact requirements-doc wording, not the mockup's own
   paraphrase.** The mockup's `.disclaimer-box` text ("This is an indicative self-assessment
   based on information supplied by the user. It is not a professional opinion, and should
   not be relied upon by any third party.") differs from `docs/requirements.md`'s FR-2.8
   ("an indicative self-assessment based on user-supplied information, not a professional
   opinion, not to be relied upon by any third party.") — this task's own acceptance
   criterion says "matches FR-2.8 verbatim," so FR-2.8's sentence is what's rendered,
   character for character (capitalized as a standalone sentence: "An indicative...").
3. **The mockup's score-band labels/statements ("Strong Foundation," "Developing, With Real
   Gaps," etc.) are not built** — that file's own comment already flags them as illustrative
   placeholder content reserved to firm authorship, same as the question set. The real,
   already-computed `scoreSummary.indicativeCostStatement` (T3.2's own output) is shown in
   that screen position instead — real, threshold-driven, never fabricated.
4. **This task does not build the "Get the full written summary by email" panel** — the
   mockup's `.summary-panel` (name/email/phone/consent fields) is T3.7's own scope entirely
   (T3.7's own task line: "Build: the ... offer on the results screen, and POST .../request-
   summary" — the offer itself, not only its endpoint). Building any part of it here would
   violate this task's own "zero contact-detail fields on this screen" acceptance criterion.
5. **`diagnostic_completed` fires from a small new client component**
   (`components/diagnostic-completed-event.tsx`, a `useEffect`-once wrapper) — the first
   "fire once on page load" `dataLayer` pattern in this codebase (every existing usage before
   this fired on a user interaction, e.g. form submit). T3.4 deliberately did not fire this
   event on submit; the feature doc's own flow step 5 fires it specifically on reaching this
   screen.
6. **Missing/invalid/non-diagnostic `enquiry_id` is a real `notFound()`**, matching
   `core-offer-pages.md`'s established precedent — never a silently-generated thin page.
   `getDiagnosticResultByEnquiryId` returns `null` for a contact-form-originated enquiry too
   (no `scoreSummary` stored), correctly 404ing rather than rendering a broken result.
7. **`robots: {index: false, follow: false}`** — a personalized, non-shareable per-visitor
   result page should never be indexed.

Verified for real against the running dev server: submitted a full-marks and a zero-marks
response set via the real `/api/diagnostic/submit` endpoint (T3.5), then loaded
`/diagnostic/results?enquiry_id=<id>` for each via Playwright MCP — both rendered correctly
and visibly differently (100%/no-breach vs. 0%/"High priority", correct weakest-dimension
highlighting in each), confirmed `diagnostic_completed` fired with the real `enquiry_id` via
`window.dataLayer`, confirmed a missing/invalid/absent `enquiry_id` all 404 correctly, and
confirmed no horizontal overflow at 390px/768px/1280px. All test rows deleted afterward.
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.6), `docs/features/business-health-
check-diagnostic.md`, `docs/requirements.md` (FR-2.8), `ui/mockups/c-diagnostic/diagnostic-
results.html`, `lib/diagnostic-submit.ts`, `app/diagnostic/results/page.tsx`,
`components/diagnostic-completed-event.tsx`.

## 2026-09-05 (T3.5, session 20) — `EnquiryRecord.name`/`email`/`message`/`contactConsent` relaxed to nullable (migration); one-shot session id per diagnostic submission

**Status:** Standing

**Summary:** Building `POST /api/diagnostic/submit` hit a real, confirmed blocker: T2.6
(`docs/tasks/02-public-presentation.md`) modelled `EnquiryRecord.name`/`email`/`message`/
`contactConsent` as required (non-nullable) — correct for `/contact`'s own form, which always
has them, but `business-health-check-diagnostic.md`'s own Data requirements list explicitly
says "contact details (nullable until step 5)": a diagnostic submission (step 4) must create
an `enquiry_record` before any of these exist at all — T3.7 (step 5, gated summary request)
is a separate, later event. The schema and the feature doc's own stated business rule
(FR-2.3: the result screen must never require contact details) were in direct conflict; no
placeholder/fabricated value would resolve this correctly (an admin enquiry list later
showing fake blank strings instead of real NULLs is worse, not better). Migrated
(`20260905231926_relax_enquiry_record_diagnostic_fields`) all four columns to nullable.
`lib/enquiries.ts`'s `createContactEnquiry` (T2.6) still enforces all four as required for a
contact-form submission — at the application layer now, not the schema — confirmed
unchanged via a real `/api/contact/submit` smoke test (both the success and the
missing-consent-rejection paths) after the migration. `EnquiryRecord`'s own doc-comment in
`prisma/schema.prisma` corrected to explain this.

Also: `DiagnosticResponse.sessionId` (`NOT NULL`, no real visitor-session concept in this
app's scope, ADR 0005/0007) is satisfied with one freshly generated `crypto.randomUUID()`
per submission in `lib/diagnostic-submit.ts` — every row in a submission shares it, and each
is linked directly to a real `enquiryId` at creation (not left null and connected later, per
T3.4's own decision-log correction to `DiagnosticResponse`'s doc-comment). This is a
synthetic-but-honest identifier (exactly what "session id" is meant to represent — one
attempt), not fabricated content.

Verified for real against the running dev server: a full 15-question submission via curl
(using the real seeded question ids) returned a real `201` with the documented response
shape and a real `enquiry_id`; submitting the same set again created a second, independent
`enquiry_record` (no dedup, per the documented edge case); an incomplete set correctly
returned `400` (not `500`); a non-array body correctly returned `400`; the full T3.4 client
flow, driven through the real browser via Playwright MCP, now completes end to end and
navigates to `/diagnostic/results?enquiry_id=<real id>` (404 only because T3.6 doesn't exist
yet). All test rows created during verification were deleted afterward.
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.5), `docs/features/business-health-
check-diagnostic.md`, `docs/features/contact-and-enquiry.md`, `prisma/schema.prisma`,
`prisma/migrations/20260905231926_relax_enquiry_record_diagnostic_fields/`,
`lib/diagnostic-submit.ts`, `lib/enquiries.ts`, `app/api/diagnostic/submit/route.ts`.

## 2026-09-05 (T3.4, session 19) — `/diagnostic` client flow: no client-side scoring, `lib/diagnostic-flow.ts` split into a server-only and a client-safe file, mobile-safe option grid, `/diagnostic/results?enquiry_id=` as the T3.6 URL contract

**Status:** Standing

**Summary:** Built `app/diagnostic/page.tsx` + `components/diagnostic-flow.tsx` to
`ui/mockups/c-diagnostic/diagnostic-flow.html`, reading T3.3's real seeded question set via a
new `lib/diagnostic-flow.ts`. Several decisions:

1. **No client-side scoring.** The mockup's own `scoreAndFinish()` computes a preview score
   in the browser and writes it to `sessionStorage` — that's a UI prototype shortcut, not
   this project's real scoring path. This flow only collects answers in client state and
   POSTs the complete set to `POST /api/diagnostic/submit` on the final step; the real score
   is computed server-side by `lib/diagnostic-scoring.ts` (T3.2, called from T3.5's route,
   not yet built). No `DiagnosticResponse` rows are written per-step either — the whole set
   goes in one request, which `prisma/schema.prisma`'s `DiagnosticResponse` doc-comment (from
   T3.1) had assumed would happen incrementally; corrected that comment to describe the
   simpler, actually-implemented design (T3.5 creates every response row together with the
   `EnquiryRecord` in one write).
2. **Found and fixed a real Turbopack bug**: a "use client" component importing a value
   (not just a type) from a `lib/` file that also imports `@/lib/prisma` silently breaks the
   dev compile with a misleading `ENOENT: ...build-manifest.json` error, never naming the
   real cause. Fixed by splitting `lib/diagnostic-flow.ts` (server-only `getActiveDiagnosticFlow`)
   from a new `lib/diagnostic-flow-options.ts` (client-safe types/constants, zero Prisma
   import). Full bisection and reasoning in `memory/known-bugs.md`; the rule itself is now in
   CLAUDE.md's Code Conventions so it isn't rediscovered the same way on a later task.
3. **`choice`-type questions' option label→value mapping lives in
   `lib/diagnostic-flow-options.ts`**, keyed by `${dimensionId}-${order}` (the same natural
   key `prisma/seed.ts` upserts on) — carried over verbatim from that seed script's own
   per-question comments (the only place this mapping is documented today; see
   `memory/technical-debt.md`'s `diagnostic_question` `is_placeholder` gap for the same
   underlying schema limitation this shares).
4. **Mobile-safe option layout**: the mockup's own `.diag-options.row`/`.diag-scale` flex
   layouts overflow horizontally at narrow widths (flex items don't shrink below their
   content's intrinsic width by default) — switched to CSS Grid (`grid-cols-5` for scale,
   `grid-cols-2` for boolean), which always divides the container's actual width evenly
   regardless of content, plus responsive padding (`p-6 sm:p-10` on the question card).
   Verified no horizontal scroll at 390px/768px/1280px via Playwright
   (`document.documentElement.scrollWidth === clientWidth` at all three).
5. **Left-aligned text for `choice` options, centered for `scale`/`boolean`** — matches the
   mockup's own CSS exactly (`.diag-options .opt-label` has no text-align override, i.e.
   left by default; `.diag-options.row`/`.diag-scale .opt-label` both set
   `text-align: center`). Radio indicator sits beside the label text for all three response
   types (a row layout), not stacked above it — an earlier pass stacked it for
   `scale`/`boolean` while chasing the mobile-overflow fix above, which visibly enlarged
   each option's height versus the mockup; reverted to a row layout once the real overflow
   cause (flex vs. grid) was identified, since stacking was never the actual fix.
6. **`/diagnostic/results?enquiry_id=<id>` is this flow's chosen URL contract for T3.6** —
   neither the feature doc nor any task names an exact URL shape for how the results screen
   receives its `enquiry_id`; a query param is the simplest, most conservative choice, and
   T3.6 should read it via `searchParams` rather than inventing a different shape.
7. **No `page` row for `/diagnostic`** — `docs/features/business-health-check-
diagnostic.md` never names a hero/marketing-copy entity for this route (unlike
   capabilities/our-method), and its on-screen copy is fixed template text tightly coupled
   to the flow's own mechanics; `generateMetadata` uses plain hardcoded strings instead,
   same treatment as `HomePageContent`'s non-editable template chrome (T2.1).
   **Related Documents:** `docs/tasks/03-diagnostic.md` (T3.4), `docs/features/business-health-
check-diagnostic.md`, `ui/mockups/c-diagnostic/diagnostic-flow.html`, `CLAUDE.md`,
   `memory/known-bugs.md`, `prisma/schema.prisma`, `lib/diagnostic-flow.ts`,
   `lib/diagnostic-flow-options.ts`, `components/diagnostic-flow.tsx`.

## 2026-09-05 (T3.3, session 18) — Fixed-id upsert convention for `DiagnosticDimension`/`DiagnosticThreshold`; real default weights/thresholds seeded; question wording carried verbatim from the mockup

**Status:** Standing

**Summary:** Seeded `DiagnosticDimension`/`DiagnosticQuestion`/`DiagnosticThreshold` in
`prisma/seed.ts` (`seedDiagnosticDimensions`/`seedDiagnosticQuestions`/
`seedDiagnosticThresholds`, called from `main()`). Three decisions:

1. **Fixed-literal-`id` upsert for `DiagnosticDimension` and `DiagnosticThreshold`.** Neither
   model has a unique natural key beyond `id` (`DiagnosticDimension.name` isn't `@unique`;
   `DiagnosticThreshold` has no natural key at all) — but this file's own established
   convention requires every seed write to be an idempotent `upsert` keyed on a stable key.
   Rather than a schema change (adding `@unique` constraints, out of this seed-only task's
   scope), used the same fixed-literal-`id` pattern this file already uses for its singleton
   rows (`HomePageContent`, `SiteSettings`, ...), generalized to a small known set of rows
   (5 dimensions, ids 1–5; 7 thresholds, ids 1–7) instead of one. `DiagnosticQuestion` does
   have a real natural key (`@@unique([dimensionId, order])`), so its own upserts use that
   instead, no schema change needed anywhere.
2. **Dimension weights seeded equal (1 each)**, and thresholds seeded as two overall bands
   (40 → "High", 70 → "Medium") plus one per-dimension band each (50 → "High") — a real,
   considered illustrative default per `docs/features/business-health-check-diagnostic.md`'s
   "weights/thresholds are configuration data" rule, not placeholder zeros. The per-dimension
   value (50) is deliberately tighter than the overall bands, generalizing the accepted
   mockup's own hard-coded weak-dimension cutoff (`d.score < 75`,
   `ui/mockups/c-diagnostic/diagnostic-flow.html`) into real per-dimension data, kept tighter
   since `lib/diagnostic-scoring.ts`'s `weakestDimensions` already guarantees 2–3 names
   regardless of whether a threshold trips.
3. **Question wording/count/dimension grouping carried over verbatim** from the mockup's own
   15-question `QUESTIONS` array (5 dimensions: Structure, Records, Cash Control, Funding
   Readiness, Owner Dependence) — not fabricated fresh, matching that file's own comment
   ("Illustrative question set — real wording ... reserved to firm authorship"). Flagged
   `is_placeholder: true` only in this seed script's own comment, since `diagnostic_question`
   has no real `is_placeholder` column (see `memory/technical-debt.md`'s new entry for that
   gap and its `T7.7` follow-up).

Verified end to end with a throwaway script (T3.1's own established practice): queried the
real seeded rows, ran `lib/diagnostic-scoring.ts`'s `scoreDiagnosticResponses` against them
for real (not mocked) with a full-marks and a zero-marks answer set, confirmed 100/0 scores
and correct triage flags/weakest-dimension output, then deleted the script. Also drove the
actual mockup HTML through all 15 real clicks via Playwright MCP (served locally, since
`file://` navigation is blocked) to confirm the exact seeded question set completes with no
dead ends and reaches the results screen — structural confirmation of "15 questions... under
six minutes," not an empirical human-paced timing (bot clicks don't validate reading speed;
that's for T3.4's real route, once built, to confirm with actual users/analytics).
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.3), `docs/features/business-health-
check-diagnostic.md`, `ui/mockups/c-diagnostic/diagnostic-flow.html`, `prisma/seed.ts`,
`lib/diagnostic-scoring.ts`, `memory/technical-debt.md`, `memory/completed-work.md`.

## 2026-09-05 (T3.2, session 17) — Scoring algorithm decisions: uniform 0–1 answer convention, threshold-band resolution, no-fabricated-numbers cost statement; `@types/node` bumped to unblock Vitest

**Status:** Standing

**Summary:** Four real algorithmic decisions made building `lib/diagnostic-scoring.ts`
(docs/tasks/03-diagnostic.md's own architecture constraint: "the algorithm ... is this task's
own code and is a developer decision, not something to leave ambiguous"):

1. **Every `answerValue`/submitted answer is a numeric string pre-normalized to 0–1, uniformly
   across `scale`/`boolean`/`choice`.** `prisma/schema.prisma`'s `DiagnosticResponse` doc-comment
   (written at T3.1) claimed the scoring function would interpret "a scale number, a boolean, or
   a choice label" differently per `responseType` — but `diagnostic_question` has no column
   storing a choice option's label-to-value mapping (the feature doc's own Data requirements list
   doesn't name one), so a literal "choice label" string would have nothing to score against.
   Resolved by following the accepted mockup exactly (`ui/mockups/c-diagnostic/diagnostic-
flow.html`'s `scoreAndFinish`/`option()`, which stores `parseFloat(inp.value)` uniformly
   regardless of `q.type`): every answer arrives already resolved to 0–1 by the client (T3.4),
   so `responseType` only drives which input widget renders, never how T3.2 interprets the
   result. Corrected the `DiagnosticResponse.answerValue` doc-comment in the same commit to
   describe this instead of the stale, never-implemented per-type interpretation — no schema
   field or migration changed, comment only.
2. **Threshold-band resolution:** a threshold "trips" when a score falls strictly below its
   `thresholdValue` (generalizes the mockup's own hard-coded `d.score < 75` weak-dimension check
   into a real, data-driven value). When several thresholds could apply to one score, the one
   with the smallest `thresholdValue` still above the score wins, as the tightest/most specific
   band.
3. **`weakestDimensions` (2–3 names, per the feature doc's "User flow" step 4):** every
   triage-flagged dimension, capped at 3; if fewer than 2 are flagged, falls back to the
   lowest-scoring 2 regardless of flag state, so the result always shows at least 2. Mirrors the
   mockup's own fallback shape without copying its hard-coded `< 75`.
4. **`indicativeCostStatement` makes no fabricated numeric cost claim.** `user-stories.md` calls
   this a "cost-of-inaction statement," but nothing in this schema holds a real firm-supplied
   cost figure — inventing one would violate CLAUDE.md's "do not fabricate content" rule. Instead
   it states the real computed score, the breached threshold's own `triagePriorityLevel` text
   (admin-tunable data) when one was breached, and the real weakest-dimension names — never
   branching code logic on a specific dimension name, per this task's own explicit constraint,
   only ever interpolating dimension names as data.

Separately: installing Vitest (`memory/technical-debt.md`'s "Vitest never scaffolded," this
task's own addendum) hit a real peer-dependency conflict — `vitest@5`/`@testing-library/
jest-dom@7` require `@types/node@^22 || >=24`, but `package.json` still pinned `@types/node@^20`
even though `engines.node` has required `>=22` since T1.1 and the actual dev runtime is v22.15.0.
Bumped `@types/node` to `^22` to resolve the conflict and correct that pre-existing mismatch
(verified `npm run typecheck` and `npm run build`-equivalent typegen still pass clean) rather
than pin an older Vitest to avoid touching it.
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.2), `docs/features/business-health-
check-diagnostic.md`, `ui/mockups/c-diagnostic/diagnostic-flow.html`, `prisma/schema.prisma`,
`lib/diagnostic-scoring.ts`, `memory/technical-debt.md`, `memory/completed-work.md`.

## 2026-09-05 (T3.1, session 16) — Diagnostic scoring tables built; `diagnostic_response.timestamp` mapped to `createdAt`; nullable FK used for "dimension or overall"

**Status:** Standing

**Summary:** Built `DiagnosticDimension`/`DiagnosticQuestion`/`DiagnosticThreshold`/
`DiagnosticResponse` in `prisma/schema.prisma` per `business-health-check-diagnostic.md`'s Data
requirements, plus the `EnquiryRecord.diagnosticResponses` relation that model's own doc-comment
already flagged as deferred from T2.6. Two naming/shape decisions worth recording: (1) the
feature doc's `diagnostic_response` field list is descriptive English ("session id", "answer
value", "timestamp"), not literal snake_case identifiers the way `home-page.md`'s list is — so
"timestamp" is modelled as `createdAt`/`created_at` to match every other model's timestamp field
in this schema (including `EnquiryRecord.createdAt`) rather than introducing a one-off `timestamp`
column; (2) `diagnostic_threshold`'s "dimension or overall" is modelled as a single nullable
`dimensionId` FK (null = overall) rather than a separate scope discriminator column, mirroring
this schema's existing nullable-FK precedents. `DiagnosticQuestion.dimensionId` is a real FK (not
an inline string) specifically so ADR 0005's "more dimensions/questions than launch config ships
with, no code change" requirement is satisfied structurally — proven for real with a throwaway
script (inserted a new dimension+question+threshold via Prisma Client only, read them back
through a query shaped like T3.2's future scoring lookup, passed, then deleted both the test rows
and the script). `DiagnosticQuestion.active` lets a question retire without breaking historical
`DiagnosticResponse` rows; `DiagnosticResponse.enquiryId` is nullable because responses are
written per-step during the flow, before `POST /api/diagnostic/submit` (T3.5) creates the owning
`EnquiryRecord`. No values seeded — that's T3.3's job, kept out of this migration per the task's
own architecture constraint.
**Related Documents:** `docs/tasks/03-diagnostic.md` (T3.1), `docs/features/business-health-
check-diagnostic.md`, `docs/adr/0005-diagnostic-engine-in-app-module.md`,
`prisma/schema.prisma`, `memory/completed-work.md`.

---

## 2026-09-05 (T2.9, session 15) — Audit confirmed no new seed work needed; T2.10 already complete; dashboard drift fixed

**Status:** Standing

**Summary:** T2.9's addendum correctly predicted that every entity's `seed*` function was
already written incrementally by T2.1–T2.7; this session's audit against all three
acceptance criteria (fresh-DB run, citation completeness, `isPlaceholder`/dashboard sync)
found nothing missing and wrote no new seed code. Two real drift issues were found and fixed
along the way: `docs/dashboard.md`'s top-level Technical Debt/Known Bugs summary and Current
Phase line were stale from before implementation began (still said "None recorded yet
(pre-implementation)" despite 13 real technical-debt entries existing); and
`memory/technical-debt.md` had a duplicate "Business Health Check's two-tier pricing" entry
(one correctly `Resolved`, one a stale `Open` leftover with pre-resolution text) — removed
the stale duplicate rather than leave two contradictory entries for the same item. Per this
session's own investigation, `app/not-found.tsx`/`app/error.tsx`/`app/global-error.tsx`
(T2.10) already exist and were already exercised by T2.8's own Playwright verification with
zero console errors — marked complete in `docs/dashboard.md` instead of re-building. The
next task is Milestone 3's first task (`docs/tasks/03-diagnostic.md`), not T2.10.
**Related Documents:** `docs/tasks/02-public-presentation.md` (T2.9/T2.10),
`docs/dashboard.md`, `memory/technical-debt.md`, `memory/completed-work.md`,
`docs/tasks/03-diagnostic.md`.

---

## 2026-09-05 (T2.8, session 14) — Organization JSON-LD placed per-page, not in root layout; `NEXT_PUBLIC_SITE_URL` fallback; `social_profile_urls` confirmed still empty; address flattened to one `streetAddress`

**Status:** Standing

**Summary:** T2.8 (SEO foundation, `docs/tasks/02-public-presentation.md`) made four choices
worth recording:

1. **`<OrganizationJsonLd />` is rendered by each of the seven T2.1–T2.7 page components
   individually, not once in `app/layout.tsx`.** The root layout also wraps `/admin` and
   `/dev` (neither is public content this schema describes), and `app/not-found.tsx`
   deliberately has zero DB dependency by design (its own comment, T2.10) — giving the root
   layout a `site_settings` read would force it dynamic for every route it wraps, including
   the one page whose whole job is to render even when the database is down. Per-page
   placement costs one extra import + one extra line per page, in exchange for not touching
   that guarantee.
2. **`lib/seo.ts`'s `getSiteUrl()` falls back to a hardcoded `https://www.kaalbert.com`**
   (docs/vision.md's own stated production domain) when `NEXT_PUBLIC_SITE_URL` is unset —
   documented in `.env.example` but deliberately left blank there, since sitemap/canonical/OG
   URLs are supposed to describe the live site regardless of which host actually served the
   request (a local dev or Railway preview request should still produce production URLs, not
   `localhost:3000` links in a sitemap). Confirmed via `curl localhost:3000/sitemap.xml` that
   every listed URL is the production domain even when served from dev.
3. **`site_settings.social_profile_urls` stays empty** — checked every `Company Docs/*.docx`
   for an actual LinkedIn/Facebook/Instagram URL before assuming none exist (this task's own
   architecture constraint) and found only platform _names_ with no account URLs (10.19 Paid
   Advertising Readiness and Launch Plan's LinkedIn/Meta account-ownership mentions,
   10.05 Positioning and Claims Guidance Note's general "social" references) — no seed change
   made. The Organization JSON-LD's `sameAs` is simply omitted while the array is empty, per
   the feature doc's own documented edge case.
4. **The Organization schema's `address` is one flattened `streetAddress` string**
   (`site_settings.address`'s newline-separated lines joined with ", ") plus a fixed
   `addressCountry: "GH"`, not a locality/region breakdown. `schema.org/PostalAddress` doesn't
   require that finer split, and the two-line address format (`lib/site-settings.ts`'s
   `splitAddressLines`) doesn't cleanly separate street from locality/region on its own — a
   flattened string avoids guessing a parse that would need redoing once a partner can edit
   this field via /admin (Milestone 7).

**Related Documents:** `docs/features/seo-and-search-foundation.md`,
`docs/tasks/02-public-presentation.md` (T2.8), `docs/adr/0006-gtm-measurement-container.md`
(the Organization JSON-LD / GTM boundary, restated in T2.8's own architecture constraints).

---

## 2026-09-05 (T2.7, session 13) — Epic-file mockup path discrepancy; `legal_page.body` modelled as ordered content blocks; `isPlaceholder` defaults `true`; `footer_content` materialized but left unwired

**Status:** Standing

**Summary:** T2.7 (Legal & compliance pages, `docs/tasks/02-public-presentation.md`) surfaced
several things worth recording:

1. **Mockup path discrepancy.** The epic file's own T2.7 entry cites
   `ui/mockups/a-public-site/legal-*.html`, which does not exist. The task's own architecture
   constraints section had already caught this and named the real path
   (`ui/mockups/e-legal/{privacy-notice,cookie-notice,terms-of-use,scope-of-practice}.html`) —
   confirmed those four files are what actually exist, built to them, and flag the discrepancy
   here per the task's own explicit instruction rather than silently treating it as resolved.
   `docs/tasks/02-public-presentation.md` itself was left unedited (the task said to flag it in
   the decision log, not to rewrite the epic file).
2. **`LegalPage.body` modelled as an ordered array of typed content blocks** (`lib/legal.ts`'s
   `LegalPageBlock`: `statement`/`prose`/`pending`/`table` kinds), not one opaque rich-text
   string. The four real mockups don't share one uniform shape — a highlighted statement box,
   plain prose, a "pending — real text not yet supplied" note, and a data table all appear
   across the four pages in different combinations and orders — so a single string field
   couldn't reproduce them without embedding markup. Same "no admin editor yet to justify full
   relational modelling" reasoning already used for `Offer.methodStages`/`faqs`. Added
   `metaDescription` beyond the feature doc's original field list (same T2.2/T2.4 precedent),
   both models' schema doc-comments and `legal-and-compliance-pages.md` updated to name it.
3. **`LegalPage.isPlaceholder` defaults `true`**, the only model in this schema where the
   placeholder flag defaults `true` rather than `false` — deliberate, since three of the four
   real seeded rows (Privacy Notice, Cookie Notice, Terms of Use) are genuine structural
   placeholders per their own mockups' text ("This page is a structural placeholder... drafted
   by the firm with counsel"), and `false` would misrepresent the norm for this entity.
   Scope of Practice is the one real, non-placeholder row — its mockup already carries a real
   revision date ("Last revised 26 August 2026") rather than "Pending first publication", and
   its content is the same `../Company Docs/07.10 Scope of Practice and Regulatory Boundary
Policy.docx` text already verified and seeded into `FirmStatement.scopeBody`/
   `ScopeOfPracticeNote` at T2.5 (session 11 follow-up) — not fresh build-team text.
4. **The acceptance criterion's "draft — pending legal review" marker is a computed UI banner**
   (`app/legal/[slug]/page.tsx`, rendered whenever `legalPage.isPlaceholder` is true), not
   seeded content — keeps the marker consistent across all three placeholder pages and makes
   it disappear automatically the moment a page's `isPlaceholder` flips to `false` via a future
   admin edit, with no code change needed.
5. **`footer_content` materialized (seeded) but deliberately not wired into `SiteFooter`/
   `ScopeOfPracticeNote`** — both still render T1.5's hardcoded scope-of-practice text, and
   `ScopeOfPracticeNote` has no prop for `companyRegistrationDetails` at all. The task's own
   architecture constraint allowed resolving or logging this gap; logged it instead
   (`memory/technical-debt.md`), same precedent and same fix shape as the identical
   `SiteSettings`/`SiteFooter` gap T2.6 logged rather than fixing inline — both would require
   threading a fetched prop through the same seven `SiteFooter` call sites, more than this
   Small-sized task's own scope. Sequenced into T7.8 alongside that existing entry.
   **Related Documents:** `prisma/schema.prisma` (`LegalPage`, `FooterContent`),
   `docs/features/legal-and-compliance-pages.md`, `lib/legal.ts`, `prisma/seed.ts`
   (`seedLegalPages`, `seedFooterContent`), `app/legal/[slug]/page.tsx`,
   `memory/technical-debt.md`, `docs/tasks/07-content-admin.md` (T7.8).

## 2026-09-05 (T2.6, session 12) — `enquiry_record`/`site_settings` schema scoping, `message` field addition, Page model reuse

**Status:** Standing

**Summary:** T2.6 (Contact page) is the first task to materialize both `site_settings` and
`enquiry_record`, both shared entities documented across multiple feature docs
(`contact-and-enquiry.md`, `business-health-check-diagnostic.md`, `enquiry-management.md`,
`content-management-admin.md`). Several scoping decisions were made, each following the
task's own explicit architecture constraints rather than modelling every documented field
immediately:

1. **`message` added to `enquiry_record`.** Neither feature doc's original Data requirements
   list names a free-text form body, but the task's own Input → Output contract requires one.
   Added the same way T2.2 added `Offer.ctaLabel`/`tiers` beyond their feature doc's original
   list — both `contact-and-enquiry.md` and `business-health-check-diagnostic.md` updated to
   name it.
2. **Diagnostic-specific fields (`scoreSummary`, `weakestDimensions`, `triageFlag`) modelled
   now, nullable, unpopulated.** The task's own architecture constraint explicitly allows
   this ("can stay nullable/unpopulated from this task"). The `diagnostic_response` set
   relation that same list names is deliberately NOT modelled yet — unlike a scalar array
   (`HomePageContent.featuredArticleIds`'s precedent), a real Prisma relation field needs its
   related model to already exist, and `diagnostic_response` doesn't (Milestone 3).
3. **`traffic_source`/`campaign`/`landing_page` deliberately NOT modelled.** These are named
   in `business-health-check-diagnostic.md`'s `enquiry_record` Data requirements, but reading
   `measurement-and-attribution.md`'s own Data requirements section turned up a real
   inconsistency between the two docs: that doc describes per-enquiry attribution as a
   separate `attribution` entity (session id, utm_source/medium/campaign, landing_page,
   first_seen) with a foreign key from `enquiry_record`, not inline columns on this table.
   T2.6 owns neither the diagnostic nor measurement features, so rather than guess a column
   shape that would likely need replacing, this is left for Milestone 5
   (`docs/tasks/05-landing-and-measurement.md`) to resolve when attribution is actually built.
4. **`enquiry-management.md`'s own extension** (`status`, `assigned_partner_id`,
   `internal_notes`, `status_updated_at`) is not anticipated here at all — no precedent in
   this task's constraints for adding it early, unlike the diagnostic fields above.
5. **`/contact` reuses the shared `Page` model** (slug `"contact"`) for its hero/meta fields,
   same pattern as capabilities/our-method/about — `contact.html`'s hero section matches that
   shape exactly (kicker/heading/lead), no `intro_copy` needed.
6. **`site_settings.response_time_commitment` seeded `null`**, not carrying over the mockup's
   own "Response-time commitment: pending." text — that's a mockup-authoring annotation, not
   real visitor copy, same treatment as the photo-pending caption removed from `/about` at
   T2.5 (session 11). `/contact` omits the response-time panel entirely while null, per
   `content-management-admin.md`'s blank-required-field edge case. Tracked as technical debt,
   `Trigger type: User-triggered`, sequenced into T7.8.
7. **First real `dataLayer.push` pattern established** (`lib/data-layer.ts`'s
   `pushDataLayerEvent`) — fires `enquiry_submitted` (the contact form) and `whatsapp_opened`
   (the new shared `WhatsAppLinkButton` component, FR-7.8) — the mechanism later tasks (the
   diagnostic's own events at Milestone 3, landing pages' `checklist_downloaded`) reuse rather
   than inventing a second one.
8. **`SiteFooter` callers not updated to read live `site_settings`** — logged as technical
   debt (`memory/technical-debt.md`), sequenced into T7.8, per the task's own explicit
   allowance ("not required as part of this task's own acceptance criteria, but the gap must
   be logged").

**Related Documents:** `prisma/schema.prisma` (`SiteSettings`, `EnquiryRecord`),
`docs/features/contact-and-enquiry.md`, `docs/features/business-health-check-diagnostic.md`,
`docs/features/measurement-and-attribution.md`, `docs/features/enquiry-management.md`,
`docs/tasks/02-public-presentation.md` (T2.6), `docs/tasks/07-content-admin.md` (T7.8),
`memory/technical-debt.md`.

## 2026-09-05 (T2.5, session 11 follow-up) — "What we are not" scope statement verified against real Company Docs, no change needed

**Status:** Standing

**Summary:** User challenged whether `FirmStatement.scopeBody` (seeded from
`ui/mockups/a-public-site/about.html`'s "What we are not" panel) was actually sourced from
real Company Docs, given it reads as odd next to two partners' seeded "Chartered Accountant"
credentials ("connect you to certified accountants... we do not replace them" — while the
firm apparently already has two in-house). Located the real source document at
`../Company Docs/07.10 Scope of Practice and Regulatory Boundary Policy.docx` (a sibling
folder to this repo, not previously read directly in any session — prior seed.ts comments
cite Company Docs files but this is the first time one was actually opened and converted for
verification; see the new reference note in personal assistant memory on how to read `.docx`
files here, since the Read tool can't parse them directly). Section 2 of that policy settles
the question explicitly: "The firm holds no practising licence of any kind. Two partners are
Chartered Accountants, and that does not change the firm's position: an individual's
membership is not a firm's practising certificate." Section 9 goes further: "The firm's own
two Chartered Accountant partners do not satisfy this requirement [the external referral
panel]. A partner cannot provide an independent opinion on the firm's own client work." So the
seeded copy is accurate, deliberate firm policy, not a mockup-authoring error or fabrication —
no change made. General lesson: when firm-supplied content looks internally inconsistent,
check the actual Company Docs folder (a real sibling directory, not something to assume
doesn't exist) before editing or flagging it as a placeholder/error.
**Related Documents:** `prisma/seed.ts` (`seedFirmStatement`),
`docs/features/about-and-partners-page.md`,
`../Company Docs/07.10 Scope of Practice and Regulatory Boundary Policy.docx`.

## 2026-09-05 (T2.5, session 11 follow-up) — `Author.title` split from `practiceArea`; visitor-facing photo-pending note removed from the live page

**Status:** Standing

**Summary:** After T2.5 shipped, the user flagged two real gaps: (1) only the featured Lead
Partner card showed any rank/title text at all ("Lead Partner · Lead Consultant" as one
plain string), and the four grid partners showed only their responsibility with no title —
a gap already present in the original mockup, not something to preserve; (2) even where a
title showed, it had no visual distinction from the responsibility text next to it. Fixed by
adding a new `title` field to `Author` (default `"Partner"`, migration
`20260905144109_t2_5_author_title`) separate from `practiceArea`, seeded per partner (Albert:
"Lead Partner", the other four: "Partner"), and rendering it as a solid `Badge` chip next to
`practiceArea`'s existing accent-colored kicker text for every partner uniformly
(`app/about/page.tsx`'s new `PartnerRoleLine`). The mockup was updated to match (a
`.title-badge` pill added to every partner entry, not just the featured one).

While debugging this, chased what first looked like a Base UI `Badge` component rendering
bug (`<Badge>{title}</Badge>` rendered with zero children in the DOM, reproduced even on the
pre-existing `app/dev/component-scaffold/page.tsx` scratch page). Root cause turned out to be
unrelated to Base UI entirely: the running dev server process still had the pre-migration
Prisma client cached in memory from before `title` was added to the schema, so
`author.title` was genuinely `undefined` at render time — confirmed by instrumenting Badge
directly (`props={}`) and by testing a plain non-Base-UI component with the same children
(also `undefined`). A dev-server restart after `prisma generate` resolved it immediately;
`components/ui/badge.tsx` was restored to its original state, unmodified, since it was never
actually broken. **Lesson for future sessions:** any schema change made while `npm run dev`
is already running requires a server restart before testing, not just `prisma generate` — the
generated client is a module the running Node process already has in memory. This is the
second time this exact class of issue has come up in this session (see the `FirmStatement`/
`Author` model addition earlier); worth remembering going forward rather than re-diagnosing
via a library-bug detour each time.

Separately, the user pointed out the "Partner photographs are from a single coordinated
session, currently in progress..." caption — appropriate as planning-stage annotation in the
mockup — has no business being visible to real site visitors on the deployed page. Removed
the rendered paragraph and its `anyPhotoPending` check from `app/about/page.tsx` entirely; the
mockup's own equivalent note is left as-is (it's wireframe/planning commentary, not live copy).
**Related Documents:** `app/about/page.tsx`, `prisma/schema.prisma` (`Author` doc-comment),
`ui/mockups/a-public-site/about.html`, `docs/features/about-and-partners-page.md`,
`docs/features/content-management-admin.md`, `docs/tasks/07-content-admin.md` (T7.6).

## 2026-09-05 (T2.5, session 11) — Partner photo readiness no longer gates `published`; initials avatar instead

**Status:** Standing

**Summary:** `about-and-partners-page.md`'s original edge case said a partner's `author` row
stays `published: false`, entry hidden entirely, until a real photo exists. Before building
T2.5, I confirmed no partner photography exists anywhere in the repo (`public/`, `ui/mockups/
assets/`) and proposed shipping per that documented edge case — all 5 partners unpublished,
empty partner section. The user rejected this outright: withholding a partner's entire real,
complete profile (name, credentials, bio) just because a photo shoot hasn't happened yet was
the wrong tradeoff, and asked for an initials-avatar fallback instead — the real photo simply
swaps in later, no publish-state change. This is a deliberate reversal of a documented feature
doc edge case (CLAUDE.md's Rollback/Revision Protocol), not an engineering judgment call, so
both `about-and-partners-page.md` and `content-management-admin.md` were updated to match
(their edge-case/publish-gating text, not just the code). Concretely: `Author.photoUrl` and
`Author.credentials` are both nullable and neither blocks `published`; `published` gates only
on name/practiceArea/personalStatement being complete. `app/about/page.tsx`'s `PartnerAvatar`
renders `AvatarImage` when `photoUrl` is set, else an `AvatarFallback` showing the same
first-two-word initials the original mockup used ("AK" for Albert Kwakye Amponsah), sized
larger (7rem featured / 5rem grid) than the design system's default `Avatar` presets per the
user's own follow-up request that the avatars "show a bit more/better" given they're currently
the only visual identity a visitor sees for each partner. All 5 seeded partners publish now
(`prisma/seed.ts`'s `seedAuthors`).
**Related Documents:** `prisma/schema.prisma` (`Author` doc-comment), `app/about/page.tsx`,
`docs/features/about-and-partners-page.md`, `docs/features/content-management-admin.md`.

## 2026-09-05 (T2.5, session 11) — `firm_statement` decomposed into named fields; `Page` model reused for the hero

**Status:** Standing

**Summary:** `about-and-partners-page.md` names `firm_statement` as one entity holding
"founding statement, values, standard (rich content)" with no sub-field breakdown. The
mockup's actual content needs four numbered value cards and two distinct panels (forward
statement, scope disclaimer) rendered separately, so — same precedent as T2.2's `Offer`
fields and T2.4's `MethodStage.whatHappens` — this was decomposed into a new `FirmStatement`
singleton model (`standingIntro`, `values` as a plain `String[]`, `forwardHeading`/
`forwardBody`, `scopeBody`) rather than one opaque rich-text blob. The page's own hero
(kicker/heading/lead/meta) reuses the shared `Page` model at slug `"about"` instead — same
hero shape as `capabilities`/`our-method`'s rows, per CLAUDE.md's "shared generic page entity"
recurring pattern. `docs/features/about-and-partners-page.md`'s Data requirements section was
updated to name both.
**Related Documents:** `prisma/schema.prisma` (`FirmStatement` doc-comment),
`prisma/seed.ts` (`seedAboutPage`, `seedFirmStatement`), `docs/features/about-and-partners-page.md`.

## 2026-09-05 (T2.5, session 11) — `personalStatement`/`bio` seeded identically; `credentials` left null where not literally sourced

**Status:** Standing

**Summary:** `about-and-partners-page.md` names both `personal_statement` (this page's own
"in their own voice" field) and `bio` (shared with the not-yet-built `insights-engine.md`'s
article bylines) as distinct fields, but the only real source material (the mockup / Company
Docs) supplies exactly one third-person paragraph per partner — not two. Rather than leave
`bio` empty pending Insights (Milestone 4), it's seeded with the same paragraph as
`personalStatement`; `/about` itself renders only `personalStatement`, per the feature doc's
own user flow. Separately, `credentials` (professional designations, "exactly as the awarding
body permits") has no distinct source string for any partner beyond prose already in their
bio — only John Dogbey's and Evans Agyemang's bios literally state "a chartered accountant",
so only those two got `credentials: "Chartered Accountant"`, copied verbatim; the other three
partners' bios name no formal designation, so `credentials` stays `null` for them rather than
inventing one (CLAUDE.md's fabrication rule).
**Related Documents:** `prisma/seed.ts` (`seedAuthors`), `docs/features/about-and-partners-page.md`.

## 2026-09-05 (T1.5, follow-up) — Nav active-state added even though no mockup shows one

**Status:** Standing

**Summary:** User pointed out `SiteHeader`'s nav has no current-page indicator on either
desktop or mobile. Checked every public-site mockup's `<nav>` markup first — confirmed the
gap genuinely stems from the mockups themselves (all of them render byte-for-byte identical
nav markup regardless of which page they represent, so there was never a per-page "active"
class to copy from in the first place). Built it anyway rather than treating "the mockup
doesn't show it" as license to skip it: WCAG 2.1 AA expects the current location in a nav to
be programmatically and visually indicated, and CLAUDE.md's accessibility rule is a hard
requirement, not contingent on the mockup happening to demonstrate it. Implementation: reuse
each link's own hover color as its permanent color when active (plus an underline, plus
`aria-current="page"`), rather than inventing a new color not in the token set — keeps this
consistent with the existing hover treatment instead of adding a fourth nav-link visual state.
**Related Documents:** `components/site-header.tsx`, `ui/design-system.md`.

## 2026-09-05 (T2.4, correction) — Intro-copy paragraph's offer-name links restored; dropping them was wrong

**Status:** Standing

**Summary:** The entry directly below this one decided to seed `Page.introCopy` as fully
plain text, un-linking the mockup's two `<a>` tags around offer names, reasoning that a
one-off token-substitution scheme wasn't worth it since the same offers were reachable from
nav/footer anyway. The user flagged this directly: the mockup specifies those names as links,
and dropping them wasn't this project's call to make unilaterally — "the mockups are
authoritative... don't invent layout" cuts against removing specified interactive behaviour,
not just against adding un-specified behaviour. Corrected by keeping `introCopy` itself as
plain text (still no markup in the database field — that part of the original reasoning
holds) but adding `app/our-method/page.tsx`'s `renderIntroCopyWithOfferLinks()`: it matches
each of `getOfferNavLinks()`'s live offer names against the plain string at render time and
re-inserts a real `Link` to that offer's actual route. This gets the mockup's exact behaviour
back (verified by clicking through to `/offers/financial-clarity-pack`) while keeping the
content itself plain and admin-editable, and without hand-coding stale `.html`-style hrefs
the way the mockup itself does. General lesson: "the mockup specifies X" is a requirement to
satisfy, not a starting point to simplify away for engineering convenience — if a
mockup-specified behaviour seems like more trouble than it's worth, that's a question to
raise, not a decision to make silently.
**Related Documents:** `app/our-method/page.tsx`, `prisma/seed.ts` (`seedOurMethodPage`).

## 2026-09-05 (T2.4) — `MethodStage.whatHappens` added beyond the feature doc's original field list; intro-copy paragraph seeded as plain text without its mockup's inline offer links

**Status:** Standing

**Summary:** `our-method-page.md`'s original Data requirements named only
description/client_sees/decision_point as `method_stage`'s content fields, but
`ui/mockups/a-public-site/our-method.html`'s `.stage-detail-grid` has three cells ("What
happens", "What the client sees", "Decision point") distinct from each stage's own longer
paragraph — three real, separately-editable pieces of content, not two. Added
`MethodStage.whatHappens` and updated the feature doc to name it, rather than either dropping
real mockup content or cramming two ideas into one field — same precedent as T2.2 adding
`Offer.ctaLabel`/`tiers` beyond their feature doc's original list.
Separately, the mockup's "One journey, not three separate products" intro paragraph links two
offer names inline (`<a href="offer-*.html">`). No plain-text content field anywhere else in
this project embeds markup (`heroLead`, `Offer.problemStatement`, `Capability.shortDescription`
all render as plain strings) — introducing a one-off token-substitution scheme for a single
paragraph was judged not worth the complexity, especially since the same three offers are
already one click away via the primary nav and footer on this same page. Seeded `Page.introCopy`
as the paragraph's plain text, offer names un-linked. If a future task needs rich/linked text
in a `page`/`method_stage` field, that's a real schema decision to make then (e.g. a
`{text, links}[]` shape or markdown), not one to retrofit silently here.
**Related Documents:** `prisma/schema.prisma` (`MethodStage`), `docs/features/our-method-page.md`,
`prisma/seed.ts` (`seedOurMethodPage`, `seedMethodStages`), `app/our-method/page.tsx`.

## 2026-09-05 (T2.3) — Shared `Page` model designed with T2.4's `intro_copy` field from the start; Advisory Retainer modelled as a true singleton, not a third fee shape bolted onto `Offer`

**Status:** Standing

**Summary:** `capabilities-page.md` and `our-method-page.md` both point at the same generic
`page` entity (CLAUDE.md's Recurring Patterns: "the home for a marketing page's own copy when
it has no other entity to attach to"). Rather than create a capabilities-specific model and
migrate it again at T2.4, added `Page.introCopy` as a nullable field now (per T2.3's own
architecture constraint), left null on the capabilities row, to be populated when T2.4 builds
`/our-method`. Considered giving `AdvisoryRetainer` the same multi-tier shape as `OfferTier`
(Essential/Standard/Full, all three real per `Company Docs/05.04 Rate Card.docx`) but rejected
it: `capabilities-page.md`'s Data requirements section explicitly models the retainer as a
singleton with one `fee_amount`, and the mockup itself only ever publishes the Essential
tier's floor ("From GHS 1,500 / month") — building tier support for data the page never
displays would be scope beyond the documented contract. If a future task needs to publish the
Standard/Full tiers too, that's a schema change to make then, not one to anticipate now.
**Related Documents:** `prisma/schema.prisma` (`Page`, `Capability`, `AdvisoryRetainer`),
`docs/features/capabilities-page.md`, `docs/features/our-method-page.md`,
`Company Docs/05.04 Rate Card.docx`.

## 2026-09-05 (T2.10) — Custom error pages must not depend on a live database read, discovered by hitting a real transient DNS failure in-session

**Status:** Standing

**Summary:** Built `app/not-found.tsx` reading live `getOfferNavLinks()` for `SiteHeader`'s
nav fee hints, same pattern as every other real page. While verifying it via Playwright MCP,
a genuine transient DNS failure against Railway's public Postgres proxy
(`metro.proxy.rlwy.net`, `getaddrinfo EAI_AGAIN`) made the page hang for well over a minute
before failing — the exact opposite of what a 404 page is for. Removed the live data fetch
entirely: `app/not-found.tsx` now renders `<SiteHeader hasHero />` with no `offerNavLinks`
prop, which falls back to that component's own hard-coded `FALLBACK_CORE_OFFERS` (T2.2). The
same reasoning applies more strongly to `app/error.tsx` (a required Client Component, so it
couldn't have fetched live data anyway) and `app/global-error.tsx` (deliberately has zero
dependencies on the app shell it stands in for). General principle worth remembering for any
future fallback/error surface on this project: it must have fewer runtime dependencies than
the thing it's a fallback for, not the same ones.
**Related Documents:** `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`,
`components/site-header.tsx`.

## 2026-09-05 (T2.2) — Business Health Check's two-tier pricing modelled as a new `OfferTier` relation, not a schema change to `Offer` itself

**Status:** Standing

**Summary:** Resolved the "Business Health Check's two-tier pricing has no real data model
yet" gap (`memory/technical-debt.md`, flagged at T2.1) with a new `OfferTier` model
(`offer_id`, `name`, `is_featured`, `duration_label`, `scope_label`, `scope_cap`,
`fee_amount_min/max`, `fee_currency`, `deliverables`, `client_inputs`, `sort_order`) rather
than adding tier-shaped columns directly to `Offer`. Only Business Health Check has rows
there; Financial Clarity Pack and Funding-Readiness Pack's `tiers` relation stays empty and
they keep using `Offer`'s own flat `deliverables`/`client_inputs`/`indicative_timeline`
fields. `app/offers/[slug]/page.tsx` branches on `offer.tiers.length > 0` to decide which
section shapes to render (tier grid + per-tier "required from you" vs. a flat deliverables
grid + paragraph). `is_featured` (true on Full) marks which tier the fee-panel's "published
fee band" section uses; the other tier surfaces as the panel's alt-note by fee floor and
duration, matching the mockup's own "Not ready for the full engagement? Express starts at…"
line. `Offer.feeAmountMin/Max` (Express's floor to Full's ceiling) was deliberately left
unchanged — it's a genuinely different summary (the home-card/nav-dropdown "From GHS 1,000"
hint) than the detail page's own tier-specific fee panel, not a value to reconcile away.
Added `OfferTier.scopeCap` as a second, fuller field alongside the shorter `scopeLabel` after
first trying to derive the fee-panel's "Scope cap: up to 3 locations or business lines, 12
months of available records" text from `scopeLabel` + `durationLabel` and finding it produced
wrong, hacky output — a tier's fee-panel scope description and its tier-meta summary line are
genuinely different strings, not one derivable from the other.
**Related Documents:** `prisma/schema.prisma` (`Offer`, `OfferTier`), `prisma/seed.ts`
(`seedOfferTiers`), `app/offers/[slug]/page.tsx`, `docs/features/core-offer-pages.md`.

## 2026-09-05 (T2.2) — `Offer.indicativeTimeline` for the two single-tier offers sourced from `Company Docs/05.04 Rate Card.docx`, not the mockups

**Status:** Standing

**Summary:** FR-4.1 requires an "indicative timeline" section on every core offer page, but
`ui/mockups/a-public-site/offer-financial-clarity-pack.html` and
`offer-funding-readiness-pack.html` don't surface one visually (Business Health Check's own
mockup does, via each tier's duration). Rather than fabricate a placeholder figure or omit
the FR-4.1-mandated section, checked `Company Docs/05.04 Rate Card.docx` (extracted via
`python3`'s `zipfile`/`re` against `word/document.xml`, since no docx-to-text tool was
available in-session) — its own "Offer / Duration / Fee / Scope" table gives the real figures
(Financial Clarity Pack: "3 to 5 weeks"; Funding-Readiness Pack: "3 to 6 weeks"), and its fee
bands/scope descriptions for all three offers match the mockups exactly, confirming it as the
same underlying source. Added a small new section to `app/offers/[slug]/page.tsx` between
"Required from you" and the fee panel to render this for a single-tier offer only.
**Related Documents:** `prisma/seed.ts`, `docs/features/core-offer-pages.md`,
`Company Docs/05.04 Rate Card.docx`.

## 2026-09-05 (T2.2) — `components/site-header.tsx`'s Core Offers fee hints now take an optional live `offerNavLinks` prop instead of a hard-coded constant

**Status:** Standing

**Summary:** Per T1.5/T2.1's own deferred note, wired the nav dropdown/mobile-menu fee hints
to read `Offer.feeAmountMin` live once the field existed. Made the new `offerNavLinks` prop
**optional** (falling back to the old hard-coded array, renamed `FALLBACK_CORE_OFFERS`) rather
than required, specifically so T1.5's dev scratch pages under `app/dev/layout-shell/*` (which
render `SiteHeader` with no data-fetching of their own) keep working unchanged. Every real
public page (`/`, `/offers/[slug]`) now fetches `lib/offers.ts`'s new `getOfferNavLinks()` and
passes it down explicitly.
**Related Documents:** `components/site-header.tsx`, `lib/offers.ts`,
`app/(public)/page.tsx`, `app/offers/[slug]/page.tsx`.

## 2026-09-05 (T1.5) — Nav dropdowns need Base UI's `MenuTrigger` `openOnHover`, not the default click-to-open

**Status:** Standing

**Summary:** User caught that `SiteHeader`'s Core Offers dropdown (built T1.5) didn't open on
hover like `ui/mockups/_shared.css`'s `.nav-dropdown:hover .nav-dropdown-menu` rule — Base
UI's `Menu` (`components/ui/dropdown-menu.tsx`) opens on click/Enter by default, the correct
behavior for an action menu but not a horizontal nav's dropdown. Fixed by passing
`openOnHover delay={0}` directly on the `DropdownMenuTrigger` instance in
`components/site-header.tsx`, not by changing the shared `dropdown-menu.tsx` primitive's
defaults — other/future usages (e.g. an admin action menu) should stay click-based. Click
still works alongside hover (Base UI's default `MenuTrigger` behavior), so keyboard/touch
users aren't affected. Any later nav-style dropdown (e.g. Capabilities, if it ever gets one)
should use the same two props.
**Related Documents:** `components/site-header.tsx`, `components/ui/dropdown-menu.tsx`.

## 2026-09-05 (T2.1) — Railway production build failed: `next build` can't reach `postgres.railway.internal`; fixed by marking `/` dynamic

**Status:** Standing

**Summary:** The first real Railway deploy of `/` failed at `npm run build` with a Prisma
`P1001`/`DatabaseNotReachable` error against `postgres.railway.internal` — Railway's private
network hostname, which only resolves for running services, not the isolated container
`next build` runs in. Next.js had no signal that `/` depends on per-request state (no
cookies/headers/searchParams, and Prisma calls aren't tracked by Next's fetch-cache
heuristics), so it defaulted to statically prerendering the page at build time, which
executed `getHomePageContent()` before the app was ever running where the private network is
reachable. Fixed by adding `export const dynamic = "force-dynamic"` to
`app/(public)/page.tsx` — not just a build workaround: this content is meant to be read live
(and become admin-editable later), so it shouldn't have been eligible for static prerendering
in the first place. Verified with a real local `npm run build` (previously untested locally
since the local `DATABASE_URL` is Railway's _public_ proxy, which is reachable during a local
build, masking this Railway-build-specific failure). Any future page that reads live
DB-backed content (offers, capabilities, etc.) needs the same treatment unless a deliberate
ISR/ on-demand-revalidation strategy is designed instead.
**Related Documents:** `app/(public)/page.tsx`, `lib/home.ts`.

## 2026-09-05 (T2.1) — Railway's public Postgres proxy needs `ssl.rejectUnauthorized: false`, and `sslmode=require` in the URL overrides it

**Status:** Standing

**Summary:** `prisma/seed.ts` failed with `P1011`/`self-signed certificate in certificate
chain` on its very first real query — the first time any code path actually exercised
`lib/prisma.ts`'s driver adapter against a real query (T1.2's own seed run had nothing to
seed, so it never really opened a connection). Root cause: Railway's public TCP proxy
(`DATABASE_URL` for local/dev, per CLAUDE.local.md) terminates TLS with a self-signed
certificate, and `pg`'s current connection-string parsing treats a bare `sslmode=require` as
an alias for `verify-full` (full chain verification) — confirmed via a raw `pg.Pool` test
that an explicit `ssl: { rejectUnauthorized: false }` passed alongside a connection string
still carrying `sslmode=require` does **not** override it; the fix only works once
`sslmode` is stripped from the URL and `rejectUnauthorized: false` is set explicitly.
Extracted the fix into a new shared `lib/db-adapter.ts` (`createDatabaseAdapter`), used by
both `lib/prisma.ts` and `prisma/seed.ts`, so the workaround exists in exactly one place.
Not a portability compromise (ADR 0003/0008 — Railway is the sole hosting target).
**Related Documents:** `lib/db-adapter.ts`, `lib/prisma.ts`, `prisma/seed.ts`.

## 2026-09-05 (T2.1) — Only `home-page.md`'s named Data-requirements fields are database-backed; the rest of the mockup's copy is fixed template chrome

**Status:** Standing

**Summary:** `docs/features/home-page.md`'s Data requirements section names exactly 7 fields
(`hero_statement`, `primary_cta_label/href`, `senior_attention_copy`, `featured_article_ids`,
`meta_title/description`) — far less than everything the home page mockup actually shows
(hero kicker, hero facts sidebar, the four-stage method strip's copy, the trust band). Rather
than inventing undocumented fields to make "every visible string" database-backed, treated
the feature doc's explicit field list as authoritative (CLAUDE.md: feature docs are the
data/interface contract) and rendered everything else as fixed JSX copy in
`app/(public)/page.tsx` — mirroring how the four-stage method names are already treated as
fixed, repeated brand copy elsewhere in this project. Also decided `primary_cta_label/href`
governs the diagnostic band's CTA specifically (the doc's own wording: "the diagnostic
presented as the primary call to action"), not the hero's two buttons, which are fixed hero
copy with their own dedicated `hero_statement` field already covering the hero's editable
line. If a future session decides more of this copy should be partner-editable, that's a
`home-page.md` doc update plus a schema migration, not a silent field addition.
**Related Documents:** `docs/features/home-page.md`, `prisma/schema.prisma`'s
`HomePageContent` doc-comment, `app/(public)/page.tsx`.

## 2026-09-05 (T2.1) — Added `Offer.teaser`; scoped `Offer`/`HomePageContent` schemas to only what T2.1 needs

**Status:** Standing

**Summary:** `core-offer-pages.md`'s documented `offer` entity has no field for the short
card blurb the home page (and later Capabilities) mockups show — only the fuller
`problem_statement` meant for the offer's own detail page. Added `teaser` to both the
Prisma model and the feature doc (a real documentation gap, same category as the
`fee_amount_min/max` split already fixed during planning). Deliberately did not add the rest
of `core-offer-pages.md`'s fields (problem_statement, who_for/who_not_for, method_stages,
deliverables, client_inputs, indicative_timeline, out_of_scope_note, faqs, cta_href, offer's
own meta_title/description) — T2.2 adds those, following T1.5's own precedent of not adding
placeholder schema for a field with no current consumer. Also found the Business Health
Check offer has a real two-tier (Express/Full) pricing structure the current single fee-band
shape can't represent — flagged as technical debt for T2.2, not solved here.
**Related Documents:** `docs/features/core-offer-pages.md`, `prisma/schema.prisma`,
`memory/technical-debt.md` → "Business Health Check's two-tier pricing has no real data
model yet", `docs/tasks/02-public-presentation.md` (T2.2 addendum).

## 2026-09-05 (T1.6) — GTM container built against a placeholder, not a real container ID

**Status:** Standing

**Summary:** Asked the user whether a real GTM container already existed for kaalbert.com
before implementing, since T1.6's acceptance criterion depends on GTM Preview mode against a
real container. User confirmed no account exists yet and chose the placeholder-plus-deferred-
verification path (same pattern as T1.1's domain-registration debt) over pausing to create
one now. Implemented the snippet to render nothing at all when `GTM_CONTAINER_ID` is unset
(rather than emitting a script tag with an empty/undefined ID), so an un-provisioned
container never ships a broken tag; verified the snippet's actual behavior against a
throwaway `GTM-TEST123` ID via Playwright instead of a real container. Full acceptance-
criterion closure logged as user-triggered debt sequenced into T5.3 — see
`memory/technical-debt.md` → "GTM container not yet provisioned."
**Related Documents:** `docs/tasks/01-foundation.md` T1.6, `docs/tasks/05-landing-and-
measurement.md` T5.3, ADR 0006.

## 2026-09-05 (T1.5) — Responsive design made a standing rule mid-task; public/admin nav rebuilt as side-sliding drawers

**Status:** Standing

**Summary:** User interrupted mid-task to require that every UI surface be responsive from
its first implementation, not deferred to a later pass — even though `ui/mockups/` is
desktop-only wireframes with no mobile breakpoints shown anywhere. Codified as a new rule in
CLAUDE.md's Code Conventions section (and a matching Task Completion Checklist line) rather
than treated as a one-off request, since it changes how every future UI task must be built.
User also specified the public-site mobile nav must be a side-sliding drawer, not a
top-dropping panel. Implemented: `SiteHeader` now hides the inline nav/dropdown/CTA below
`lg` (1024px — an engineering judgement call, no mockup addresses this) behind a hamburger
that opens a right-sliding drawer (Core Offers flattened to a list with fee hints, then the
five nav links, then the CTA, each closing the drawer on click). Applied the same drawer
pattern to the admin shell for consistency: `AdminMobileSidebar` replaces the persistent
sidebar below `lg` with a topbar + left-sliding drawer (left, since that's the sidebar's own
docked edge), reusing `AdminSidebarNav` via a new optional `onNavigate` prop so the shared nav
component can close the mobile drawer without affecting its desktop rendering. `SiteFooter`
was already `grid-cols-2 md:grid-cols-4` from the original build, needing no change.
**Related Documents:** CLAUDE.md (Code Conventions + Task Completion Checklist),
`components/site-header.tsx`, `components/admin-mobile-sidebar.tsx`,
`components/admin-sidebar-nav.tsx`, `memory/known-bugs.md` (the `nativeButton` fix found
while building this).

## 2026-09-05 (T1.5) — Fixed a route-naming inconsistency: T2.2 said `/services/[slug]`, everything else says `/offers/[slug]`

**Status:** Standing

**Summary:** While hard-coding `SiteHeader`/`SiteFooter`'s Core Offers links, checked every
doc that names the core-offer-page route to make sure the hrefs would match what T2.2
actually builds. `docs/features/core-offer-pages.md` (the data/interface contract — its own
`GET /offers/[slug]` line), `docs/scope.md`, `docs/user-stories.md`, and
`ui/screen-inventory.md` all agree on `/offers/[slug]`; only
`docs/tasks/02-public-presentation.md`'s T2.2 build line said `/services/[slug]` — a lone
inconsistency, not a considered alternative. Corrected T2.2 to `/offers/[slug]` rather than
leaving it to surface as a real 404 mismatch once T2.2 ships and this task's hardcoded nav
links (built to the feature doc's route) point somewhere T2.2 didn't build.
**Related Documents:** `docs/tasks/02-public-presentation.md` (T2.2), `docs/features/
core-offer-pages.md`, `ui/screen-inventory.md`, `components/site-header.tsx`,
`components/site-footer.tsx`.

## 2026-09-05 (T1.5) — Base UI's `nativeButton={false}` required when a Trigger/Close renders as a non-button element

**Status:** Standing

**Summary:** Building `SiteHeader`'s mobile drawer, every `DialogClose` rendered as
`render={<Link href={...} />}` (so clicking a nav item both navigates and closes the drawer)
threw a real console error surfaced by Next's dev overlay: "Base UI: A component that acts as
a button expected a native `<button>` because the `nativeButton` prop is true... Use a real
`<button>` in the `render` prop, or set `nativeButton` to `false`." Root cause: `DialogClose`
(and any Base UI part typed with `NativeButtonProps`, default `true`) assumes its `render`
target is a native `<button>` unless told otherwise — swapping to an `<a>` without setting
`nativeButton={false}` leaves Base UI applying native-button assumptions (keyboard/role
handling) to an anchor. `Menu.Item` (the `DropdownMenuItem` used for the desktop Core Offers
dropdown, T1.4) never hit this because it's typed with `NonNativeButtonProps` instead
(default `false`) — the two prop names look identical but default oppositely, so this isn't
generalizable by "components with a `render` prop" alone; check which one a given Base UI
part uses before assuming. Fixed by adding `nativeButton={false}` to every `DialogClose`
rendered as a `Link` (three call sites in `site-header.tsx`); the plain icon-button
`DialogClose` instances (no `render` override) were unaffected. Recorded here — alongside
T1.4's `render` vs `asChild` and `MenuGroupContext` gotchas — as a Base UI composition
pitfall future tasks should check for whenever swapping a Trigger/Close/Action-type
component's rendered element.
**Related Documents:** `components/site-header.tsx`, `node_modules/@base-ui/react/internals/
types.d.ts` (`NativeButtonProps` vs `NonNativeButtonProps`), the T1.4 decision-log entries
below on Base UI's `render` composition pattern.

## 2026-09-05 (T1.4) — shadcn CLI run with the `nova` preset, then its colour/font choices discarded in favour of T1.3's tokens

**Status:** Standing

**Summary:** The shadcn CLI's `init` command has no non-interactive way to skip its
preset-selection prompt (`-p custom` doesn't exist despite "Custom" appearing in the
interactive list) — every preset (Nova, Vega, Maia, …) ships its own starter colour palette
and a Google Font (Nova = Lucide/Geist). Ran `init` with `-b base -t next -p nova -y` (Nova,
since it's the CLI's own default) purely to get `components.json` + `lib/utils.ts` +
`button.tsx` scaffolded, then immediately reverted every part of its output that touched
design decisions already made in T1.3: restored `app/globals.css`'s exact hex token values
(the CLI had overwritten them with Nova's neutral-grey oklch palette and a `.dark` block —
the latter explicitly rejected by `ui/design-system.md` line 96, "no dark-mode variant is
defined for this brand"), and reverted `app/layout.tsx` entirely (the CLI wired in Geist via
`next/font/google`, contradicting T1.3's "system fonts only, no web font file" decision).
Kept only the CLI's structural (non-colour, non-font) additions to `globals.css`: `@import
"tw-animate-css"` and `@import "shadcn/tailwind.css"` — the latter defines the
`data-open`/`data-closed`/etc. custom variants Base UI's generated components actually
require to animate correctly, confirmed by reading the package's source rather than assuming.
**Related Documents:** `ui/design-system.md`, `app/globals.css`, `app/layout.tsx`,
`components.json`.

## 2026-09-05 (T1.4) — used shadcn's `field` component in place of `ui/components.md`'s "Form"

**Status:** Standing

**Summary:** `ui/components.md`'s foundation-layer list names "Form (field wrapper +
validation display)" as one of the 21 primitives to scaffold. The current shadcn registry's
`form` component returns as an empty placeholder (`{"name": "form", "type": "registry:ui"}`,
no files, no dependencies) — react-hook-form's old `Form`/`FormField`/`FormMessage` wrapper
has been retired from the Base UI (`base-nova`) style. Its documented replacement is `field`
(`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`,
`FieldSeparator`, `FieldSet`) — same role (field wrapper + validation display), Base UI's own
naming rather than a React Hook Form binding. Installed `field` (+ its `label` dependency)
instead of chasing the dead `form` entry, and used `Field`/`FieldLabel`/`FieldError`/
`FieldDescription` throughout the T1.4 scratch page's form section. No feature doc or ADR
names "Form" specifically enough to require reconciling — `ui/components.md` is descriptive
of shadcn's foundation layer, not a contract pinned to react-hook-form.
**Related Documents:** `ui/components.md`, ADR 0010, `components/ui/field.tsx`.

## 2026-09-05 (T1.4) — Base UI's `render` prop used instead of Radix's `asChild` for composed triggers

**Status:** Standing

**Summary:** Base UI (the primitive library ADR 0010 mandates over Radix) does not support
the `asChild` composition pattern at all — `tsc` rejects it outright (`Property 'asChild'
does not exist`) on every Trigger component (`DialogTrigger`, `AlertDialogTrigger`,
`PopoverTrigger`, `TooltipTrigger`, `DropdownMenuTrigger`). Base UI's equivalent is a `render`
prop accepting a `ReactElement` (`<DialogTrigger render={<Button variant="outline">Open
dialog</Button>} />`) rather than a child + `asChild` boolean. This is a Base UI API
difference feature epics need to know going in, not a scaffold defect — recorded here so a
future task doesn't waste time trying the Radix pattern first. Every generated component file
that renders a `<Trigger>`-shaped part already used this `render` convention internally
(e.g. `select.tsx`'s `<SelectPrimitive.Icon render={<ChevronDownIcon .../>} />`), confirming
it's the library's real pattern, not a one-off.
**Related Documents:** ADR 0010, `components/ui/dialog.tsx` and siblings.

## 2026-09-05 (T1.3 follow-up) — reversed: added the four extra brand tones to both design-system.md and globals.css

**Status:** Standing

**Summary:** User reviewed the judgment call below (keep `globals.css` to
`design-system.md`'s published token block, omitting `--pine-700`/`--pine-500`/
`--brass-500`/`--brass-300`) and explicitly overrode it: since the mockups use these four
tones and the project intends to match the mockups closely, add them in both places, not
just the app. Added all four as raw `:root` variables plus `@theme inline` mappings (so
`bg-pine-700`, `hover:bg-brass-500`, etc. are real Tailwind utilities) in **both**
`ui/design-system.md`'s "Complete CSS-first configuration" code block and `app/globals.css`
— keeping the two in sync was exactly the caveat the original entry below flagged if this
was ever revisited. Also updated `app/dev/design-tokens/page.tsx`'s primary/accent button
hover states to use `hover:bg-pine-700`/`hover:bg-brass-500` (matching
`ui/mockups/_shared.css`'s `.btn-primary:hover`/`.btn-accent:hover` exactly, rather than the
earlier generic `hover:opacity-90` approximation) and added the four tones to the swatch
grid. Verified via the compiled CSS output (`.bg-pine-700`, `.hover\:bg-brass-500:hover`,
etc. all present and resolving to the correct hex values) since the Chrome extension
disconnected mid-session and a screenshot re-check wasn't reliably available.
**Related Documents:** `ui/design-system.md`, `app/globals.css`, the original entry
immediately below.

## 2026-09-05 (T1.3) — globals.css kept to design-system.md's token set exactly (no extra brand tokens added for mockup hover-state fidelity)

**Status:** Superseded

**Summary:**

- `ui/mockups/_shared.css` defines four extra brand colours (`--pine-700`, `--pine-500`,
  `--brass-500`, `--brass-300`) beyond shadcn's semantic set, used only for hover states and
  decorative accents (e.g. `.btn-primary:hover { background: var(--pine-700); }`). They're
  listed in `ui/design-system.md`'s "Full brand color palette" table but deliberately absent
  from that same doc's own "Complete CSS-first configuration" code block — i.e. the doc
  itself already decided not to thread them into the Tailwind theme.
- Chose to treat that code block as complete/authoritative and copy it into `app/globals.css`
  verbatim, rather than independently adding the four extra tokens back in for closer
  hover-state pixel-fidelity. Reasoning: the task's acceptance criteria is a static
  side-by-side visual match (buttons/cards/inputs at rest), not hover-interaction parity;
  the design-system doc's own "Complete configuration" framing is a stronger signal of intent
  than re-deriving from the mockup CSS a second time; and CLAUDE.md's colour-restraint rule
  ("no colour outside that table without firm approval") cuts toward not inventing new theme
  keys speculatively. If a later task needs exact hover-colour parity, add those four tokens
  to `design-system.md`'s config block first (not just to `globals.css`), so the two stay in
  sync.
- Also removed the create-next-app Geist Google Fonts wiring from `app/layout.tsx` (not
  requested by the task directly, but design-system.md states plainly that both brand
  typefaces are system fonts with no web font file loaded — leaving Geist loaded app-wide
  would have silently contradicted that the first time anyone reached for a default
  `font-sans`).
- Left `app/page.tsx`/`page.module.css` (the create-next-app placeholder homepage) untouched —
  out of scope for a tokens-only task, and it's slated for full replacement once the
  public-presentation epic builds the real home page from `ui/mockups/a-public-site/home.html`.
- Playwright MCP (`.mcp.json`'s `verification` server) wasn't connected this session (no
  `mcp__verification__*` tools resolved via ToolSearch) — consistent with CLAUDE.md's note
  that a new/changed MCP server needs a session restart _and_ human approval first. Used the
  `claude-in-chrome` browser-automation tools instead for real-browser visual verification
  (per CLAUDE.md's own explicit fallback instruction), including serving
  `ui/mockups/a-public-site/home.html` via a temporary local `python3 -m http.server` since
  the extension can't load `file://` URLs directly.

**Related Documents:** `docs/adr/0010-styling-and-component-stack.md`,
`ui/design-system.md`, `docs/tasks/01-foundation.md` (T1.3)

## 2026-09-05 (T1.2 follow-up) — railway.json never applied; migrated to Infrastructure as Code

**Status:** Standing

**Summary:**

- **Root cause found for "push doesn't deploy" (user-reported)**: `railway.json`'s
  `deploy.startCommand` had never actually applied to the `kaalbert-web` service — its
  `serviceManifest.deploy.startCommand` was `null` on every deployment, including ones
  Railway's own docs implied Config as Code should have configured. Separately (and this is
  what the user actually hit): GitHub's own webhook/Actions delivery was confirmed working
  (`GET /repos/.../actions/runs` showed CI succeeding on the latest push within a minute),
  which rules out GitHub/this repo as the cause — the break is specifically in Railway's
  side of the GitHub-App-triggered auto-deploy, which isn't inspectable via the CLI or a
  repo-scoped PAT (would need GitHub App installation state or Railway's own dashboard/
  support). Not fully root-caused; worked around instead (see below), which also happens to
  fix the unrelated `railway.json`-never-applied issue in the process.
- **Immediate unblock**: `railway up --service kaalbert-web` deployed current `main` directly
  from local files (same fallback used for T1.1's very first deploy), confirmed live (200).
  This deployment also proved `railway.json` wasn't being read — logs showed plain
  `next start`, not the configured `prisma migrate deploy && npm start`.
- **Migrated `railway.json` → `.railway/railway.ts`** (Railway's newer Infrastructure-as-Code
  format; the CLI's own deprecation warning pointed here) via `railway config migrate
--service kaalbert-web --apply --delete-files`, run by the user after auto mode's
  classifier blocked the agent from running it directly (a production-config write).
  **The auto-generated file was dangerous as generated**: it declared only `start`, and
  since IaC treats undeclared fields as "should not exist," `railway config plan` showed it
  would have deleted the `kaalbert-web.DATABASE_URL` variable and disconnected the GitHub
  source (`source.repo`/`source.type` → `null`) — silently making the original problem
  permanent instead of fixing it. Fixed before applying: added `source: github(...)`
  (explicit repo+branch) and `variables: { DATABASE_URL: preserve() }` (the `railway/iac`
  SDK's "leave this variable's current value alone" primitive) to `.railway/railway.ts`,
  re-ran `railway config plan`, confirmed it now shows only the intended
  `deploy.startCommand` change with 0 destructive changes, then had the user apply it
  (`railway config apply --yes` — also classifier-blocked for the agent to run directly).
  Applying it triggered a fresh deployment automatically, which finally showed the correct
  `npx prisma migrate deploy && npm start` in its service manifest.
- **`railway` npm package added** (`railway@3.11.0`, devDependency) — required by
  `.railway/railway.ts`'s `import ... from "railway/iac"`; `railway config plan`/`apply`
  refuse to run without it installed at the repo root.
- **Auto mode classifier blocked every live-production-config-mutating command** the agent
  attempted in this whole investigation (`ALTER USER ... PASSWORD`, `railway variable set
DATABASE_URL`, `railway config migrate --apply`, `railway config apply`, even a bare
  `railway config plan` dry-run once) — correctly, per CLAUDE.md's own risk-tolerance
  guidance; the user ran each one after the agent verified/explained what it would do.

## 2026-09-05 (T1.2 follow-up) — Postgres password exposure and rotation

**Status:** Standing

**Summary:**

- **Env file convention changed**: `.env` renamed to `.env.local` (Next.js's own precedence
  loads this ahead of everything else, and it's the file `next dev` actually reads);
  `.env.production` added for local production-build testing (`npm run build && npm start`)
  — never read by the deployed app, which gets its vars set directly on the Railway service.
  Both gitignored. `prisma7.config.ts` no longer uses bare `dotenv/config` (which only reads
  `.env`) — now explicitly loads `.env.local`, then `.env.production`, then `.env`, in that
  priority order (matching Next.js's own precedence), since dotenv's `config()` never
  overrides an already-set var.
- **Credential exposure incident**: while populating `.env.production` with the real
  `DATABASE_URL` (at the user's explicit instruction — "the .production should hold real
  secrets"), the harness's own "file changed on disk" diff-preview mechanism echoed the full
  connection string, including the Postgres password, into the conversation. Different root
  cause from session 01's exposure (that was an unredacted `git remote -v`; this was an
  automatic tool-output preview triggered by editing a file that hadn't been freshly `Read`
  in-session) — same category of incident, same response: treat the credential as
  compromised immediately, don't wait to assess actual risk.
- **Rotated immediately.** Auto mode's classifier blocked both `ALTER USER ... PASSWORD` and
  a Railway `variable set DATABASE_URL` run directly by the agent (flagged as sensitive
  production-credential actions) — correctly, this needed a human decision, not the agent
  pushing past a safety block. User ran the rotation themselves via a `!`-prefixed command
  (generates a random alnum-only password locally, `ALTER USER postgres WITH PASSWORD`,
  rewrites `DATABASE_URL` in both `.env.local` and `.env.production`) — the raw password
  only ever existed in that command's own shell-variable scope, never printed anywhere.
  Agent then synced Railway's own tracked `PGPASSWORD`/`POSTGRES_PASSWORD` variables on the
  `Postgres` service to match (that pair of `variable set` calls was NOT blocked by the
  classifier). A further attempt to explicitly re-set the `Postgres` service's `DATABASE_URL`
  variable (to a `${{PGUSER}}:${{PGPASSWORD}}@...}}`-templated form) WAS blocked; left as-is
  since Railway's official Postgres template already defines `DATABASE_URL` via that same
  internal templating by default, so the `PGPASSWORD` update very likely already propagated
  automatically — noted as unverified rather than assumed silently. New password confirmed
  working via a live `psql`/`prisma migrate dev` connection immediately after rotation.
- **Lesson for future sessions**: a file holding a live secret that gets written via `mv`/
  `sed`/`awk` redirection (not a fresh `Read` immediately beforehand) can trigger the
  harness's automatic "changed on disk" diff preview, which is NOT covered by the
  never-print-secrets discipline used for command output — the preview is generated outside
  any command the agent runs. Where practical, `Read` a secret-bearing file immediately
  before any operation that might write to it, so the preview (if one fires) at least
  reflects content already known to be in context rather than a first exposure.

## 2026-09-04 (T1.2)

**Status:** Standing

**Summary:**

- **Postgres provisioned via Railway's own bundled plugin** (`railway add --database
postgres`), attached to the existing `kaalbert-web` project — per ADR 0003, confirmed with
  the user first since this is a real, billed resource (Railway Hobby plan $5/mo base +
  usage; small Postgres instances typically run $5–15/mo on top). User explicitly said "go
  ahead, provision it" before this ran.
- **Network topology: public TCP proxy for local dev, private network for production.**
  Railway's Postgres template only generates a private-network `DATABASE_URL`
  (`RAILWAY_PRIVATE_DOMAIN`-based, unreachable outside Railway). Created a public TCP proxy
  (`railway tcp-proxy create --port 5432 --service Postgres`) and built a public
  `DATABASE_URL` from `PGUSER`/`PGPASSWORD`/`PGDATABASE` + the proxy host:port for local
  `.env`. Separately set `DATABASE_URL=${{Postgres.DATABASE_URL}}` on the `kaalbert-web`
  service itself, so the deployed app connects over Railway's private network (no public
  exposure needed for production traffic). Real credentials were never printed into the
  conversation — fetched via `railway variables --json` into scratch files, read with `jq`,
  written straight to `.env`, then the scratch files were deleted immediately.
- **Prisma pinned to 7.10.0, not npm's `latest` tag** — `prisma`'s `latest` dist-tag
  currently points to a pre-release (`8.0.0-rc.13`) while `@prisma/client`'s `latest` is the
  stable `7.10.0`; installed both pinned to `7.10.0` (prisma's own `prev` tag) to avoid
  shipping an RC and to keep the CLI and client in lockstep.
- **Prisma 7 requires an explicit driver adapter** (`@prisma/adapter-pg` + `pg`) — the
  generated `PrismaClient` constructor no longer reads `DATABASE_URL` itself. Wired in both
  `lib/prisma.ts` (the app's singleton) and `prisma/seed.ts`.
- **Prisma's per-project AI-agent skill scaffold** (`.claude/skills/prisma-*`,
  `skills-lock.json`, `prisma7.config.ts`) is installed automatically by `prisma init` in
  Prisma 7 — this is official Prisma tooling, not something this session added deliberately.
  Also auto-installed near-duplicate copies under `.windsurf/skills/` and `.agents/skills/`;
  deleted both since this project only uses Claude Code (`AGENTS.md` already covers "any
  other agent" as a single doc, not a skills directory) and keeping three copies of the same
  content was pure repo bloat.
- **Baseline schema has zero models, deliberately** — per the task's explicit scope note
  ("not every epic's entities yet"). To still prove "a migration applies cleanly on a fresh
  database" without inventing a fake permanent entity or a fake permanent migration, ran a
  fully isolated smoke test (its own scratch `schema.prisma`/`prisma7.config.ts`/migrations
  folder, one throwaway model, against the same real Postgres instance): migration created
  and applied successfully, table confirmed via `psql`, then dropped and the scratch files
  deleted. The committed `prisma/schema.prisma` and `prisma/migrations/` are unaffected —
  zero models, zero migrations, exactly matching the task's stated scope.
- **Generated Prisma client output moved from Prisma's own default** (`app/generated/prisma`,
  inside the Next.js App Router tree) **to repo-root `generated/prisma`** — keeps generated
  code out of `app/` entirely; `lib/prisma.ts` (CLAUDE.md's designated home for the client
  singleton) imports from it instead.
- **`npm audit` flags 4 high-severity vulnerabilities, left unfixed** — both are transitive
  dependencies inside Prisma CLI's own dev-tooling tree (`mysql2`, `deepmerge-ts`), not
  reachable from this project's runtime code (we don't use MySQL). `npm audit fix --force`
  would downgrade `prisma` to `6.19.3`, the opposite of the RC-avoidance decision above. See
  `memory/technical-debt.md`.

## 2026-09-04

**Status:** Standing

Multi-account git credential workflow established; GitHub-connected Railway auto-deploy
wired and verified. Closes out T1.1 (except the still-open Cloudflare/domain item — see
`memory/technical-debt.md`).

**Summary:**

- **Token exposure incident and fix**: a company GitHub PAT was briefly embedded in a
  remote URL and then exposed via an unredacted `git remote -v`. The token was revoked and
  regenerated. Root-caused and fixed properly rather than just rotated-and-moved-on: built a
  non-interactive, per-account git credential helper (`~/.git-credential-helpers/*.sh`,
  reading a token from `~/.secrets` fresh on every invocation, never caching or embedding it
  in a URL) wired via `~/.gitconfig`'s `[credential "https://github.com/<account>"]` blocks —
  the same pattern the user's existing personal accounts already used with
  `git-credential-libsecret`, adapted because libsecret needs one interactive prompt to seed
  the OS keyring, which isn't available from a Claude Code `!`-prefixed command (runs
  non-interactively; confirmed `~/.bashrc` skips sourcing `~/.secrets` for non-interactive
  shells, which was the root cause of an earlier "Invalid username or token" failure too).
  Generalized into a durable, account-agnostic workflow doc outside the repo at
  `~/Dev_Workspace/git-multi-account-workflow.md` (covers both the script-helper approach
  for automation and the libsecret approach for normal interactive terminal use), specifically
  so the user can apply the same pattern to future foreign-account repos without
  re-deriving it. Both `origin` and `personal` remotes on this repo now use clean URLs with
  no embedded credentials.
- **GitHub-connected Railway auto-deploy wired and verified end-to-end** — not just that
  `railway service source connect` returned success, but that connecting the source
  triggered a real GitHub-sourced build, which reached `SUCCESS`, and the live URL was
  confirmed 200 afterward. T1.1's "main deploys automatically on push" acceptance criterion
  is now genuinely satisfied.
- **Memory-file format and debt/bug-sequencing rules established** — at the user's explicit
  request, to keep future sessions from letting debt/bugs sit orphaned in memory with no
  path back into the task sequence. Written into CLAUDE.md's Knowledge Management
  Responsibilities section (new "Memory file format and ordering" and "Debt/bug fixes must
  be sequenced into a task" subsections) so it applies durably, not just this session. All
  four `memory/*.md` files retrofitted to the new newest-first, bolded-field format; the two
  open technical-debt items (Cloudflare/domain, ESLint EOL pin) each got a `Sequenced into:`
  task addendum (T1.1 and T1.4 respectively, in `docs/tasks/01-foundation.md`).

**Related Documents:**

- memory/technical-debt.md
- ~/Dev_Workspace/git-multi-account-workflow.md (outside the repo)
- ~/.gitconfig, ~/.git-credential-helpers/kaalbert-company.sh (outside the repo)
- docs/tasks/01-foundation.md (T1.1, T1.4 addenda)
- CLAUDE.md (Knowledge Management Responsibilities section)

## 2026-09-04

**Status:** Standing

T1.1 implementation decisions, made while scaffolding the repo/app/deploy pipeline.

**Summary:**

- **Repo root confirmed as `Kaalbert Website/`**, not its parent folder — the sibling
  `Company Docs`/`Planning framework and trigger`/`Vendor Response` folders are business/
  admin material with no reason to ever reach GitHub, even privately.
- **Next.js 16.3.4** (latest stable at the time, not an older pinned major) — chosen since
  this is a greenfield scaffold with no prior version commitment. Two Next.js 16 behaviour
  changes recorded directly in CLAUDE.md's Auth Pattern section since they'll bite future
  tasks otherwise: `middleware.ts` is deprecated in favour of `app/proxy.ts` (Node runtime,
  not Edge — relevant to Milestone 6 admin-session enforcement), and plain `tsc --noEmit`
  fails on a fresh checkout because typed-route ambient types (e.g. `LayoutProps<'/'>`)
  don't exist until `next typegen` runs — so `npm run typecheck` is
  `next typegen && tsc --noEmit`, never bare `tsc`.
- **ESLint pinned to `^9`, not the newly-released `^10`** — bumping produced
  `ERESOLVE overriding peer dependency` warnings against `eslint-config-next@16.3.4`'s
  plugin chain; `create-next-app`'s own generated `package.json` (same Next.js version)
  independently chose `^9`, so matched that rather than force an unproven combo. `eslint@9`
  is flagged EOL/"no longer supported" by npm — see `memory/technical-debt.md`, revisit once
  `eslint-config-next` bumps its tested peer range.
- **Prettier run across the entire pre-existing docs/ui/memory tree**, not just new files —
  T1.1 is explicitly where "ESLint + Prettier must both be configured and passing from this
  task's first commit onward" (CLAUDE.md Coding Standards) becomes real; every file had to
  reach compliance, not just this task's own diff. Verified the diff was cosmetic only
  (emphasis-marker style, blank-line-after-heading) on a sample file before running
  tree-wide.
- **Cloudflare/domain step deferred** — `kaalbert.com` is not registered (WHOIS: no match),
  so Cloudflare has no zone to front. User chose to finish everything else and log this as a
  known blocker rather than register a placeholder domain. See `memory/technical-debt.md`.
- **Railway provisioned under a new company account** (kaalbert.company@gmail.com), not the
  personal account the CLI was originally logged into — user deliberately created a separate
  company Railway account first. Initial deploy done via `railway up` (CLI upload) to prove
  the pipeline works; GitHub-connected auto-deploy was wired in a later decision entry above.
- **Two GitHub remotes**: `origin` → `KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website`
  (authoritative — Railway auto-deploy and all CI point here) and `personal` →
  `cosbyDeveloper/Kaalbert-Company-Ltd-Website` (push-only, for the user's own contribution
  graph — not a second source of truth). `github` MCP server added to `.mcp.json`,
  referencing `${KAALBERT_GITHUB_TOKEN}` (the user's own env var name, sourced from
  `~/.secrets` via `~/.bashrc`) rather than CLAUDE.md's example `GITHUB_PERSONAL_ACCESS_TOKEN`
  name — same pattern, actual variable name kept as the user set it up.

**Related Documents:**

- docs/tasks/01-foundation.md (T1.1)
- docs/adr/0002-nextjs-typescript.md
- docs/adr/0003-railway-hosting-and-postgres.md
- docs/adr/0004-cloudflare-cdn-proxy.md
- CLAUDE.md (Auth Pattern section, MCP Server Setup section)

## 2026-09-04

**Status:** Standing

Two engineering-authority decisions made during Phase 6 task planning, closing items each
feature doc had explicitly deferred to "Phase 6 task planning" rather than left silently
unresolved:

**Summary:**

- Attribution retention window set to 90 days (`docs/tasks/05-landing-and-measurement.md`,
  T5.4), matching GA4/Meta's own standard attribution lookback.
- Admin session policy set to 30 minutes inactivity / 12 hours absolute
  (`docs/tasks/06-admin-auth.md`, T6.3), matching Document 13.03 §10's confidentiality bar.

**Related Documents:**

- docs/features/measurement-and-attribution.md
- docs/features/admin-authentication.md
- docs/tasks/05-landing-and-measurement.md
- docs/tasks/06-admin-auth.md

## 2026-09-04

**Status:** Standing

Project initialized.

**Summary:** Initial project structure created. Full planning pipeline (Phases 1–7 of
`PROJECT_PLANNING_FRAMEWORK.md`) completed before any implementation began, including a
dedicated pre-Phase-6 audit pass that found and closed 7 requirements/consistency gaps (see
`docs/dashboard.md`) before task planning was written.

**Related Documents:**

- docs/vision.md
- docs/requirements.md
- docs/architecture.md
- docs/roadmap.md
- docs/dashboard.md
