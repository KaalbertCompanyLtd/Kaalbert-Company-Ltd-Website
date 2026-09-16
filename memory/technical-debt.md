# Technical Debt

Newest entry at the top. Entries below follow this format, one per debt item — see
CLAUDE.md's "Memory file format and ordering" section for the exact field rules and the
sequencing requirement:

## Title

**Status:** Open | Resolved
**Date raised:** YYYY-MM-DD
**Date resolved:** YYYY-MM-DD (omit if still Open)
**Reason:**
**Impact:**
**Priority:** High | Medium | Low
**Possible Fix/Fixes:**
**Trigger type:** Task-sequenced | User-triggered
**Sequenced into:** T##-## (task name)

---

## Brevo sender still single-sender-verified against a Gmail address, not domain-authenticated

**Status:** Resolved
**Date raised:** 2026-09-16 (session 62)
**Date resolved:** 2026-09-16 (same session) — user created the `info@kaalbert.com` alias at
Zoho (aliased to `albert@kaalbert.com`'s existing mailbox, not a separate mailbox — "Set as
Mailbox" left unchecked), authenticated `kaalbert.com` as a domain in Brevo (Brevo-code TXT,
2 DKIM CNAMEs, DMARC TXT, plus the optional branded-link/image CNAMEs, all added manually at
Namecheap — the one close call: Namecheap's "automatic" DNS tool tried to also touch/
"replace" the unrelated apex `kaalbert.com` CNAME pointing at Railway; caught before
confirming and worked around via manual record entry instead, see the session's own chat log
for the full sequence), added `info@kaalbert.com` as a Brevo sender (auto-verified), and set
`BREVO_SENDER_EMAIL=info@kaalbert.com` live (`.env.local`, `.env.production`, and
`railway variable set` — already `preserve()`d in `.railway/railway.ts`, no IaC change
needed). The old `kaalbert.company@gmail.com` sender deliberately left in place in Brevo (not
deleted) as a fallback until a real send from the new sender is confirmed working end-to-end.
**One small separate step still pending, not itself technical debt:** `site_settings.email`
still shows the old placeholder — update it via `/admin/site-settings` to `info@kaalbert.com`
(a 30-second admin UI action, not done by this session since it needs a live TOTP code this
session doesn't have for the production admin account, and burning a backup code to save the
user 30 seconds isn't a good trade).
**Reason:** `BREVO_SENDER_EMAIL` (`kaalbert.company@gmail.com`) was chosen at T3.7 specifically
because Brevo's single-sender verification (a 6-digit code to that inbox) needs no registered
domain — true at the time, since `kaalbert.com` wasn't registered. Confirmed live this
session via Brevo's own API (`GET /v3/senders`, `GET /v3/senders/domains`): exactly one
verified sender exists (`kaalbert.company@gmail.com`), zero authenticated domains. Now that
`kaalbert.com` is registered and the firm has real `@kaalbert.com` mailboxes at Zoho
(`albert@kaalbert.com` already exists), domain authentication is both possible and a real
deliverability upgrade — DKIM/SPF-aligned mail from a `@kaalbert.com` address scores
meaningfully better with recipient spam filters than an unrelated Gmail sender, and it
authorizes every address at the domain at once rather than one at a time.
**Impact:** No functional break — the current Gmail sender works and passes Brevo's own
verification. Purely a deliverability/trust quality gap, and a branding mismatch (system
emails visibly come from a `@gmail.com` address, not the firm's own domain).
**Priority:** Medium — real user-facing polish (diagnostic summary emails, admin invite/
password-reset emails all carry this sender), not a launch blocker.
**Possible Fix/Fixes:** Revised recommendation (same session, after the user pushed back on
the first pass's `no-reply@` suggestion — correctly: `sendTransactionalEmail` in
`lib/email.ts` is one shared utility with one sender used for _both_ internal admin mail
(password resets, team invites) _and_ the diagnostic's "email me the full summary" send,
which is a lead-nurturing touchpoint for a business-development site, not pure system
plumbing. A `no-reply@` sender on the exact email meant to keep a qualified lead engaged
actively works against `docs/vision.md`'s own conversion goal — it signals "don't talk to
us" at the moment a prospect might want to reply with a question). **Single alias,
recommended: `info@kaalbert.com`**, used as both `BREVO_SENDER_EMAIL` and
`site_settings.email` — one mailbox to create at Zoho, replies from either a diagnostic
recipient or (in the unlikely event of a reply to a password-reset/invite email) an admin
land in the same inbox the firm already watches for general enquiries, no second alias or
extra monitoring burden. `albert@kaalbert.com` stays as-is, not displayed site-wide (no
`author.email` field exists to display it — confirmed via `prisma/schema.prisma`). Domain
authentication doesn't care about the local part chosen (`info` vs `no-reply` scores
identically for deliverability — SPF/DKIM alignment is what matters, not the address name),
so this is a pure business-fit call, not a technical constraint. Once `info@kaalbert.com`
exists at Zoho: in Brevo, Senders, Domains & Dedicated IPs → Domains → Authenticate a domain
→ `kaalbert.com`, add the DNS records Brevo generates (typically an SPF `include:` addition
merged into the existing SPF TXT record — never a second standalone SPF TXT record, DNS only
allows one — plus 2–3 DKIM CNAME/TXT records) via whichever DNS provider is authoritative at
the time (today: the registrar — Cloudflare-fronting is deferred by user choice, see the
entry below), then add `info@kaalbert.com` as a sender in Brevo (auto-verified once the
domain shows Authenticated), set it as `BREVO_SENDER_EMAIL` (`.env.local`, `.env.production`,
and `railway variable set` on the live service — already `preserve()`d in
`.railway/railway.ts`), and update `site_settings.email` via `/admin/site-settings` (never by
hand-editing the database — `docs/user-guide.md`'s documented path). If the firm later wants
a stricter split (a genuine `no-reply@` for admin-only mail, a warmer address for
lead-facing mail), that needs a real code change first — `sendTransactionalEmail` would need
a per-call-site sender override, not just an env-var swap — bigger scope than this entry
covers; note it here if it comes up again rather than doing it speculatively.
**Trigger type:** N/A — resolved.
**Sequenced into:** N/A — resolved. The one remaining `site_settings.email` UI update is a
firm/admin action, not a code fix, so it isn't sequenced into any task.

---

## Article/author image uploads use an interim base64 data-URI store, not real Cloudflare R2

**Status:** Resolved
**Date raised:** 2026-09-11 (T7.2, session 45)
**Date resolved:** 2026-09-11 (session 54)
**Reason:** T7.2 (article editor) is the first task to need real image upload (a required
preview image, and the new `figure` body block) — but Cloudflare R2 (ADR 0004) is "added once
media volume justifies it," not provisioned yet, confirmed via `CLAUDE.local.md`'s
Credentials section (`CLOUDFLARE_R2_*` still unfilled). Writing uploads to local disk instead
(the general "stubbed/local path" pattern floated by the T7.5 debt entry below) was
considered and rejected: Railway's container filesystem is not durable across deploys (no
Railway Volume is provisioned or documented anywhere in this project), so a locally-written
file would silently vanish on the next deploy — a real data-loss bug, not a faithful stub.
`lib/media-storage.ts`'s `encodeImageUpload` instead base64-encodes the upload as a `data:`
URI and stores it directly in the same Postgres column a real object-storage URL would
occupy (`Article.previewImage`, an `ArticleBodyBlock`'s `imageUrl`) — durable today with zero
new infrastructure. Every call site already treats the column as "just a string URL"
(`components/insights-article-card.tsx`'s `previewImage`, the new `figure` block renderer),
so nothing about how images are _displayed_ needs to change when R2 replaces this.
**Impact:** Low today (uploads work correctly, are durable, and render correctly). Real
costs: (1) base64 inflates payload size ~33%, capped at 2MB pre-encoding
(`MAX_UPLOAD_BYTES`) specifically because this data lives inside Postgres rows/JSON columns,
not blob storage — a real ceiling a genuine object store wouldn't need; (2) every article
page's response payload includes its own preview image's full base64 bytes inline, rather
than a lightweight URL a CDN would cache and serve separately — a real, if currently
low-traffic, performance cost.
**Priority:** Medium — no functional defect, but a real, compounding performance/storage
cost that grows with every image uploaded from here on; the earlier this is swapped to real
R2, the fewer existing rows need backfilling later.
**Possible Fix/Fixes:** Once Cloudflare R2 is provisioned, replace `lib/media-storage.ts`'s
`encodeImageUpload` body with a real R2 upload call returning a real object URL — no other
file changes, since `POST /api/admin/media` and every caller (the article editor's preview
image/figure blocks, and T7.6 once it reuses the same `AdminImageUploadButton` component for
author photos) only ever treat its return value as an opaque URL string. Existing rows
already holding a base64 `data:` URI would need a one-off backfill migration to re-upload
them to R2 at that point — not attempted here, since R2 doesn't exist yet to backfill into.
Update (T7.5, session 48): T7.5 did **not** reuse `AdminImageUploadButton`/`encodeImageUpload`
as originally planned here — that mechanism is image-only, and a landing-page checklist is
realistically a PDF, so T7.5 built a separate sibling instead (`encodeDownloadFileUpload`,
`POST /api/admin/media/downloads`, `AdminDownloadUploadButton` — see the now-Resolved
"Landing Pages admin (T7.5) needs to expose `downloadFileUrl`" entry above for the full
reasoning). Same interim base64 mechanism, same real-R2 swap-in shape, but it's now **two**
function bodies to swap when R2 arrives, not one — `encodeImageUpload` and
`encodeDownloadFileUpload`, both in `lib/media-storage.ts`.
**Trigger type:** User-triggered — do not treat reaching any future task as a cue to build
against R2 speculatively; the underlying blocker is the firm/developer actually provisioning
real Cloudflare R2 credentials (`CLOUDFLARE_R2_*`, `CLAUDE.local.md`'s Credentials section),
not this project's own task sequence.
**Sequenced into:** No task — re-checked twice already at tasks that reuse this same
mechanism (T7.6, author photos; T7.10, article resources, session 53) and R2 was still
unprovisioned both times, with no further upcoming Milestone 7 task left that touches media
uploads at all (per CLAUDE.md's rule against pointing at an already-shipped task, this entry
no longer names one). Once R2 is actually provisioned, swap `lib/media-storage.ts`'s
`encodeImageUpload`/`encodeDownloadFileUpload` bodies for a real upload call — the correct
next action is a direct, user-initiated fix at that point, not waiting for another task to
"reach" this mechanism a third time.
**Resolution (session 54):** R2 provisioned (user provisioned the bucket + API token directly
in the Cloudflare dashboard; see `memory/decision-log.md` for the one-bucket/public-access
reasoning). `lib/media-storage.ts`'s `encodeImageUpload`/`encodeDownloadFileUpload` now both
upload to R2 via a new `lib/r2-client.ts` (an `@aws-sdk/client-s3` `S3Client` pointed at R2's
S3-compatible endpoint) and return the object's real `CLOUDFLARE_R2_PUBLIC_URL`-based URL —
both functions are now `async`, the only call-site change needed (`app/api/admin/media/
route.ts`, `app/api/admin/media/downloads/route.ts` now `await` them). No caller, schema
field, or public-rendering code changed, exactly as this entry's own "Possible Fix" predicted.
No backfill migration was needed — queried every table this file's output lands in
(`Article.previewImage`, a `figure` block's `imageUrl`, `Author.photoUrl`, `LandingPage.
downloadFileUrl`, `ArticleResource.fileUrl`) before writing the new code, and every one was
still `null`/empty already (no real upload had ever gone through the interim mechanism).
Verified live via Playwright: uploaded a real image and a real PDF through the admin,
confirmed both landed at real, publicly-fetchable `https://pub-....r2.dev/...` URLs (`curl`
against the live object, correct content-type/size), then cleaned up both test objects
directly from the bucket.

---

## Article downloadable-resource attachment (upload/attach a file to `article_resource`) is not built — T7.2 built preview-image/figure uploads only

**Status:** Resolved
**Date raised:** 2026-09-11 (T7.2, session 45)
**Date resolved:** 2026-09-11 (T7.10, session 53)
**Reason:** `ui/mockups/g-admin-content/admin-article-editor.html`'s toolbar shows an "Attach
file" (📎) button alongside the image button, and `article_resource` (T4.1) already exists as
a real entity with nothing in `/admin` that creates a row for it — every resource currently
in the database was seeded directly (`prisma/seed.ts`), never uploaded through an admin
screen. T7.2's own "Build" line names only "tables/pull-quotes/figures" as this task's
in-scope content types, not downloadable attachments, so this was deliberately left out
rather than silently dropped — a real, correctly-scoped gap, not an oversight.
**Impact:** Low today (existing seeded resources still work; the public article page's
`isResourceReachable` check and download link are unaffected). Real gap: a partner cannot
attach a new downloadable resource to an article, or replace/remove an existing one, without
a developer directly editing the database.
**Priority:** Low — no acceptance criterion anywhere currently requires this, and it affects
a minority of articles (most have zero resources per `insights-engine.md`'s own "typically
0–1 resources per article" framing).
**Possible Fix/Fixes:** Add a small resource-management panel to the article editor (list
existing `article_resource` rows with label/file, add new via the same `AdminImageUploadButton`-
style upload pattern generalized to non-image files, reorder via `sortOrder`, remove) — a
real, separate S-sized task rather than folding into an already-large T7.2, per this file's
own session-04 precedent for keeping tasks appropriately scoped. New task added:
`docs/tasks/07-content-admin.md` T7.10.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.10 (Article downloadable-resource management,
`docs/tasks/07-content-admin.md`) — new task added this session.
**Resolution (T7.10, session 53):** Built a "Downloadable resources" panel on the article
editor's right column (`app/admin/(shell)/articles/article-resources-panel.tsx`), only
rendered for an existing article (`ArticleResource.articleId` is a required FK). Add: a
Label field + `components/admin-download-upload-button.tsx`'s `AdminDownloadUploadButton`
(already built at T7.5 for the exact same interim base64 upload mechanism — reused directly,
no second upload path built). Reorder: ▲/▼ buttons per row, persisted via a 3-step
sortOrder-swap transaction (`lib/admin-article-resources.ts`'s `moveArticleResource`, same
shape as `lib/admin-diagnostic.ts`'s `moveDiagnosticQuestion`). Remove: an `AlertDialog`-
confirmed real delete (`ArticleResource` has no "never hard-delete" rule, unlike
`Subscriber`). Verified live via Playwright: uploaded two real PDFs, confirmed both appeared
on the real public article page in the same order set in admin, reordered and confirmed the
new order persisted after a reload and matched on the public page, removed one and confirmed
it disappeared from the public page on the same request cycle, and checked at mobile/tablet/
desktop widths.

---

## Enquiry-level triage priority (High/Medium/Low) is computed at diagnostic-scoring time but never persisted, so no admin screen can show it

**Status:** Resolved
**Date raised:** 2026-09-11 (T7.1, session 44)
**Date resolved:** 2026-09-11 (T8.1, session 56)
**Reason:** Discovered building the admin dashboard's recent-enquiries panel to
`ui/mockups/g-admin-content/admin-dashboard.html`, whose Triage column shows a High/Medium/
Low priority badge (`badge-triage-high/medium/low`, `ui/mockups/_shared.css`).
`lib/diagnostic-scoring.ts`'s `resolveTriageBand` computes exactly this value per submission
(`overallPriorityLevel`, sourced from `diagnostic_threshold.triagePriorityLevel` — confirmed
by `memory/technical-debt.md`'s own earlier, resolved entry on score bands: "an internal
partner-facing priority word like 'High'"), but `DiagnosticScoringResult` never returns it and
`lib/diagnostic-submit.ts` never persists it — only the boolean `overallTriageFlag` is written
to `enquiry_record.triage_flag`. The priority word is used once, inline, inside
`buildIndicativeCostStatement`'s prose, then discarded.
**Impact:** Low today — the boolean `triageFlag` still drives correct sort/flag behaviour
everywhere it's used. But every future triage-priority UI (this task's own dashboard, T8.2's
list, T8.3's detail screen) can only show a flagged/not-flagged boolean, never the real
High/Medium/Low the visitor's own diagnostic actually resolved to, unless this is fixed.
Recomputing it later from currently-configured thresholds would be wrong (thresholds are
admin-editable and may have changed since the enquiry was scored — CLAUDE.md's diagnostic
values-are-data rule means this is expected to happen), so only capturing it at
scoring/submit time is correct.
**Priority:** Medium — not urgent (boolean triage still works everywhere today), but every
enquiry row written before this is fixed permanently loses its real priority level; the gap
widens the longer it's left.
**Possible Fix/Fixes:** Add `triagePriorityLevel` to `DiagnosticScoringResult` (returning
`overallPriorityLevel` from `scoreDiagnosticResponses` instead of only consuming it locally),
add an `enquiry_record.triage_priority_level` (`String?`, null for contact-form rows, same
nullability precedent as `triage_flag`) column, and persist it in `lib/diagnostic-submit.ts`
alongside the existing `triageFlag: result.overallTriageFlag` line.
**Trigger type:** Task-sequenced
**Sequenced into:** T8.1 (`docs/tasks/08-enquiry-management.md`) — resolved. `EnquiryRecord`
now has `triagePriorityLevel` (`String?`), `lib/diagnostic-scoring.ts`'s
`DiagnosticScoringResult` returns `overallPriorityLevel`, `lib/diagnostic-submit.ts` persists
it, and `app/admin/(shell)/page.tsx`'s Triage column renders the real High/Medium/Low badge
(`TRIAGE_BADGE_CLASSES`) instead of the boolean Flagged/Not-flagged approximation. Verified
live via Playwright MCP: a real diagnostic submission (enquiry #27, score 35/100) produced a
"High" badge on the dashboard. Note: pre-existing rows (created before this migration) have
`triagePriorityLevel: null` by design (no backfill — see this task's own Input → Output
contract), so a historically triage-flagged row now displays "Not flagged" on this specific
column even though `triageFlag`/the "Triage-flagged" stat card still correctly count it — an
accepted, documented consequence of the migration, not a bug.

---

## Admin dashboard's New Enquiries stat and Status badge assume every enquiry is "new" because `enquiry_record` has no `status` column yet

**Status:** Resolved
**Date raised:** 2026-09-11 (T7.1, session 44)
**Date resolved:** 2026-09-11 (T8.1, session 56)
**Reason:** `content-management-admin.md`'s dashboard spec defines "New enquiries" as
`COUNT(enquiry_record)` filtered by `status = new`, and the accepted mockup
(`ui/mockups/g-admin-content/admin-dashboard.html`) shows a per-row Status badge
(New/Contacted). But `status` — along with `assigned_partner_id`/`internal_notes`/
`status_updated_at` — is `enquiry-management.md`'s own extension to `enquiry_record`, and is
explicitly Milestone 8 (T8.1) scope, not modelled yet (see the `EnquiryRecord` model
doc-comment in `prisma/schema.prisma`, and `docs/roadmap.md`'s Milestone 7-before-8 ordering
— T7.1 depends on T6.3/T3.5/T2.6/T4.1, never T8.1). T7.1 (`lib/admin-dashboard.ts`) worked
around this rather than adding the column early (out of this task's own stated scope, "no new
entity," and the schema's own explicit "not anticipated here" comment): "New enquiries" is
computed as an unfiltered `COUNT(enquiry_record)`, and the Status badge always renders "New"
— both are honestly correct today, since no status-transition capability exists yet for a row
to be anything else, but both are placeholders load-bearing on T8.1 shipping.
**Impact:** Low today (the numbers/badge shown are accurate, just not yet meaningfully
filterable). Becomes actively wrong the moment T8.1 ships and a partner starts marking
enquiries contacted/closed/converted/not-a-fit — until this task's own functions are updated
in lockstep, "New Enquiries" would keep counting every row ever created, not just the
genuinely-new ones, and every row would keep showing "New" regardless of its real status.
**Priority:** Medium — not urgent pre-T8.1 (no way for the value to be wrong yet), but a
real, silent staleness risk the moment T8.1 ships if not updated together.
**Possible Fix/Fixes:** Once T8.1 adds `status`, update `lib/admin-dashboard.ts`'s
`getAdminDashboardStats` to filter `where: { status: "new" }` and `getRecentEnquiries` to
select/return the real `status` value instead of the hardcoded `"new"` literal, updating both
functions' tests (`lib/admin-dashboard.test.ts`) alongside.
**Trigger type:** Task-sequenced
**Sequenced into:** T8.1 (`docs/tasks/08-enquiry-management.md`) — resolved. `status` is now a
real `EnquiryStatus` enum column (`new/contacted/closed/converted/not_a_fit`, `@default(new)`,
every pre-existing row backfilled to `new`). `getAdminDashboardStats` now filters
`where: { status: EnquiryStatus.new }`; `getRecentEnquiries` selects/returns the real `status`
column; both functions' tests updated. `app/admin/(shell)/page.tsx`'s Status badge now renders
the real per-row label (`STATUS_LABELS`) instead of a hardcoded "New" string. Verified live via
Playwright MCP (dashboard rendered "New Enquiries: 7", every visible row correctly labelled
"New").

---

## No admin-facing way to deactivate/reactivate an account, reset an existing partner's 2FA enrolment, or reset an existing partner's password

**Status:** Resolved
**Date raised:** 2026-09-10 (T6.6, session 42); broadened 2026-09-11 (T6.7, session 43)
**Date resolved:** 2026-09-11 (T7.6, session 49)
**Reason:** Discovered writing `docs/user-guide.md`'s new Admin Login section, while
double-checking a claim before publishing it. Three real gaps, same root cause: T6.5
(deactivation), T6.6 (account creation), and T6.7 (self-service password reset) each built a
real, working, fully tested `lib/`-layer mechanism, but none of their own scope included the
admin-facing UI to trigger the equivalent action for an _already-existing_ account — T6.5's
own Input→Output line explicitly named Milestone 7's Team area as that UI's intended home,
`admin-authentication.md`'s edge case ("lost device and lost backup codes... requires another
administrator to reset 2FA enrolment") implies the same kind of action, and T6.7's own
self-service password reset only covers a partner who still has their own email access — not
the case where email access is also lost, which needs the same "another administrator acts on
this account" shape as the other two. No task anywhere actually builds any of the three.
Today, all three require a developer running an ad hoc script directly (e.g. a one-off `tsx`
invocation calling `deactivateAdminUser`/`issueSetupToken`/`issuePasswordResetToken` — no
packaged, repeatable command exists for any of them the way `npm run admin:create-user` now
exists for brand-new accounts).
**Impact:** Low-to-medium and not urgent: a five-partner firm rarely needs to deactivate
someone or hits either "lost device and lost backup codes" or "lost password and lost email
access" simultaneously, and a developer can already do all three manually today (the
underlying functions are real, tested, and working — this is a UI/packaging gap, not a
missing capability). Becomes genuinely load-bearing the first time any of the three scenarios
actually happens for real and a developer isn't immediately available.
**Priority:** Low.
**Possible Fix/Fixes:** ~~Extend T7.6... with three actions per `admin_user`...~~ Done: a
`components/ui/alert-dialog.tsx`-confirmed "Deactivate account" / plain "Reactivate account"
toggle, a "Reset 2FA enrolment" button, and a "Reset password" button, all on
`/admin/team/[id]`'s new `AdminUserActionsPanel` — only rendered when that author has a
linked `admin_user` at all (`lib/admin-authors.ts`'s `setAdminUserActive`/
`resetAdminUserTotp`/`resetAdminUserPassword`, thin wrappers over the exact `lib/auth/*`
functions this entry already named). The latter two display the fresh link on-screen for the
admin to relay out of band, exactly as planned. `lib/auth/session.ts` gained a new
`reactivateAdminUser` — `deactivateAdminUser` only ever built the one direction.
**Trigger type:** N/A — resolved
**Sequenced into:** T07-06 (Team / author profile editor) — closed out per that task's own
build; verified live via Playwright MCP (see `memory/decision-log.md`, T7.6 entry) including
a real deactivate → confirmed the session was actually invalidated on the very next request,
not just the DB flag flipping.

---

## No task provisions a real `admin_user` row yet

**Status:** Resolved
**Date raised:** 2026-09-10 (T6.2, session 38)
**Date resolved:** 2026-09-10 (T6.6, session 42)
**Reason:** Discovered building T6.2's `/admin/setup-2fa` — every task in the admin-auth epic
(T6.1 onward) assumes an `admin_user` row already exists, but no task anywhere creates one.
Milestone 7's Team area (`docs/tasks/07-content-admin.md` T7.6) edits `author` (public
profile) records, a related but distinct entity from the login credential — it was never the
right home for this either. Right now the only way an `admin_user` row (and therefore a
working `/admin/setup-2fa` link) comes to exist at all is a throwaway verification script run
manually during this session, deleted before commit.
**Impact:** Real, but not yet blocking: nothing in Milestones 6-8 fails without this, since no
task before T6.6 needs a real admin account to exist. It becomes load-bearing the moment the
firm actually needs to start using `/admin` for real — without it, not even the developer has
a sanctioned way to create the very first partner account.
**Priority:** Medium — doesn't block any in-progress build work, but is a real gap in the path
to Milestone 6 actually being usable, not a someday-nice-to-have.
**Possible Fix/Fixes:** A new task, T6.6 (added this session, see
`docs/tasks/06-admin-auth.md`) — a developer-run CLI script that creates one `admin_user` row
and calls `lib/auth/totp-setup.ts`'s `issueSetupToken` (also new this session) to produce a
real setup link, deliberately not a self-service invite UI (disproportionate for a fixed
five-partner firm). The same `issueSetupToken` mechanism is also what T6.4's forced
re-enrolment redirect reuses (see that task's own addendum) — not a second, parallel gap.
**Trigger type:** Task-sequenced.
**Sequenced into:** T06-06 (Initial admin account provisioning)

---

## `Author.adminUserId` is still a schema-only placeholder FK, not a real Prisma relation

**Status:** Resolved
**Date raised:** 2026-09-10 (T6.1, session 37)
**Date resolved:** 2026-09-11 (T7.6, session 49)
**Reason:** `Author.adminUserId` (added at T2.5) was always a plain nullable `Int?`, deliberately
not a real Prisma relation, because no `admin_user` table existed yet (see that model's own
doc-comment in `prisma/schema.prisma`). T6.1 (this task) adds `AdminUser`, so the FK target
now exists — but wiring the actual relation (and having anything populate it) is real work
that belongs to whichever task builds the self-service author-profile editor, not this
schema-only task.
**Impact:** None today (no code reads or writes `adminUserId` yet). Once T7.6's self-service
editor exists, "a partner opens their own entry under Team" (content-management-admin.md's
user flow) needs this relation to resolve the logged-in `admin_user` to their own `author`
row — without it, T7.6 would have no way to implement "self-service" at all beyond an admin
picking themselves from a list.
**Priority:** Low — no current functionality depends on this; it only becomes load-bearing
when T7.6 is built.
**Possible Fix/Fixes:** ~~In T7.6, add `adminUser AdminUser? @relation(...)` to `Author`
(a new migration)...~~ Done: `adminUserId` is now `@unique` with a real `AdminUser?`
relation (migration `20260911103608_add_author_admin_user_relation`), and
`lib/admin-authors.ts`'s `getAuthorIdForAdminUser` resolves the authenticated session's
`admin_user.id` to their own `author` row for the Team list's "this is you" marker. **Not
done, and separately still-blocked**: backfilling `adminUserId` for the 5 seeded partners —
none of them has a real `admin_user` login account yet (only this project's own dev/test-only
account exists, `CLAUDE.local.md`'s Credentials section, deliberately not tied to any real
partner). Backfilling is a one-row `UPDATE`/`npm run admin:create-user` action once a real
account exists for a given partner — not attempted here since no such accounts exist to link
to yet.
**Trigger type:** User-triggered — the backfill step specifically (not this entry's own
schema/relation work, which is done). Do not create real `admin_user` accounts for the 5
seeded partners or attempt to backfill `adminUserId` on their own initiative; wait for the
firm to say a specific partner is ready to be onboarded with real login credentials.
**Sequenced into:** T07-06 (Team / author profile editor) — closed out per this task's own
build; the remaining backfill step has no task to sequence into since it's a one-off
operator action, not engineering work, whenever the firm is ready for it.

**Update (session 60, 2026-09-12):** A real in-app path for this backfill now exists —
`/admin/team/new`'s "Link an existing profile" mode (Owner-only), which sets `adminUserId` on
one of the 5 real seeded `Author` rows the moment an Owner invites that partner with their
real email address. Actually sending an invite to each of the 5 real partners is still the
firm's own call (needs their real email addresses, an action only the user can take, same as
this entry's own standing `Trigger type`) — not attempted in this session either.

---

## Attribution's 90-day retention job has no real schedule triggering it

**Status:** Resolved
**Date raised:** 2026-09-10 (T5.4, session 36)
**Date resolved:** 2026-09-10 (same session, follow-up)
**Reason:** Originally framed as a dashboard-only action ("configuring a Railway Cron Job
schedule is an external action only the user can take"). **Corrected same-day, per user
pushback**: Railway's own config-as-code CLI (`railway config plan`/`apply` against this
repo's already-tracked `.railway/railway.ts`, first written at T1.1) makes this fully
scriptable — a new `attribution-cleanup` service was declared in that file (source-connected
to this same repo, `deploy.cronSchedule: "0 3 * * *"`, `restartPolicyType: "NEVER"`) and
applied for real via `railway config apply`, with the user's explicit go-ahead for that one
production-infrastructure action. The "only a human can click this in a dashboard" framing
was simply wrong; the CLI/IaC path is the better, more legible mechanism anyway (the schedule
now lives in a reviewable, git-tracked file, not tribal knowledge in a web UI).
**Two real bugs were caught and fixed during this same follow-up**, both confirmed by
watching the actual deployment fail and re-diagnosing from real logs, not guessed: (1) the
new service's `DATABASE_URL` was declared with `preserve()`, which only protects an
_existing_ value — a brand-new service has nothing to preserve, so it deployed with no
`DATABASE_URL` at all and failed immediately on the same "DATABASE_URL is not set" error the
script's own code comment already warned about; fixed by declaring a real cross-service
reference (`ref(postgres_db, "DATABASE_URL")`, requiring `postgres("Postgres")` to also be
declared and added to the project's `resources` list so the reference target actually exists
in the graph). (2) Railway's Railpack builder auto-detected the repo as a Next.js app and
ran the full `npm run build` (a real `next build`) before every deploy — wasted build time
for a job that only ever calls `tsx` directly; fixed with `build: "true"` (a no-op shell
command) to skip it while still running `npm install` for the job's own dependencies. Also
fixed, in the same file edit: the existing `kaalbert-web` service's IaC declaration was stale
— it never declared `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`/
`GTM_CONTAINER_ID` as `preserve()`, so `railway config apply` would have silently deleted
all four live environment variables the moment anyone ran it (confirmed via `railway config
plan`'s dry-run diff _before_ touching anything) — a real, unrelated landmine this
investigation happened to catch.
**Impact:** None remaining — the service now exists, deploys successfully (confirmed via
`railway service list`'s own `status: SUCCESS` on a real deployment after both fixes), and
is scheduled. The stale-variable landmine above is also closed.
**Priority:** N/A — resolved.
**Possible Fix/Fixes:** Done — see Reason above. The pattern this establishes (one small
Railway service per scheduled task, declared in `.railway/railway.ts`, never a shared
worker/dispatcher process) is now recorded in `CLAUDE.md`'s Recurring Patterns section for
future scheduled-job needs (Milestone 9's per-platform performance-dashboard syncs are the
next known case).
**Trigger type:** Task-sequenced (fully resolved this session; nothing left to defer).
**Sequenced into:** T5.4 (this same task) — closed, not deferred.

---

## Landing Pages admin (T7.5) needs to expose `downloadFileUrl`, wired to the R2 media pipeline

**Status:** Resolved
**Date raised:** 2026-09-10
**Date resolved:** 2026-09-11 (T7.5, session 48)
**Reason:** `LandingPage.downloadFileUrl` (added this session, see below) is a real,
partner-uploadable file — the same category of asset as `Author.photoUrl`
(`docs/tasks/07-content-admin.md` T7.6, "via the same R2 media pipeline ... ADR 0004") — but
T7.5's own "Build" line (`docs/tasks/07-content-admin.md`) only lists "headline, opening
paragraph, body, CTA" for the Landing Pages admin editor, written before this field existed.
No object storage (Cloudflare R2) is provisioned yet either way (ADR 0004: "added once media
volume justifies it"), so this field is null on every real row today — the normal,
pre-upload state, not a defect (`app/lp/[slug]/page.tsx`'s `LandingPageCta` already handles
it correctly, falling back to `ctaHref`/`ctaLabel`).
**Impact:** Low today (every current instance's CTA works correctly via the fallback). Will
become Medium once T7.5 is actually built, if that task's editor is shipped without exposing
this field — a partner would have no way to upload a real checklist file even once the admin
exists.
**Priority:** Low
**Possible Fix/Fixes:** ~~When T7.5 is built, add `downloadFileUrl`... using whatever R2
upload mechanism T7.6 establishes...~~ Update (session 45, T7.2): the mechanism now exists —
`components/admin-image-upload-button.tsx` (`AdminImageUploadButton`) + `POST /api/admin/
media` + `lib/media-storage.ts`, built for the article editor's preview image/figure blocks.
~~When T7.5 is built, reuse that component/route directly for `downloadFileUrl`~~ Done, with
one real correction discovered at T7.5 itself: that mechanism is image-only (client-side
`accept="image/*"` and server-side `ACCEPTED_IMAGE_TYPES`), and a landing-page checklist is
realistically a PDF, not an image — reusing it as-is would have silently let a PDF fail
upload or, worse, tried to render one in an `<img>` tag. Built a genuinely separate, smaller
sibling instead: `lib/media-storage.ts`'s `encodeDownloadFileUpload` (PDF-only, 5MB cap vs.
images' 2MB, since PDFs run larger), `POST /api/admin/media/downloads`, and
`components/admin-download-upload-button.tsx` (`AdminDownloadUploadButton`) — same interim
base64 `data:` URI storage as `encodeImageUpload`, same real-R2 swap-in plan (only
`lib/media-storage.ts`'s function bodies change; every caller, including
`components/landing-page-cta.tsx`, already treats the result as an opaque URL). Still
interim, not real R2 — provisioning real R2 credentials remains a separate, User-triggered
precondition (same category as every other external-account setup this project defers to the
user). See `memory/technical-debt.md` → "Article/author image uploads use an interim base64
data-URI store, not real Cloudflare R2" for the swap-over-to-real-R2 tracking, which now also
covers this second function.
**Trigger type:** N/A — resolved
**Sequenced into:** T7.5 (Landing Pages admin, `docs/tasks/07-content-admin.md`) — closed out
per that task's own build.

---

## Funding-Readiness Checklist landing page has no real downloadable asset yet

**Status:** Resolved
**Date raised:** 2026-09-10
**Date resolved:** 2026-09-10
**Reason:** Originally framed as "wait for the user to hand the developer the real checklist
file directly." Corrected same-day, per user feedback: the right design is an
admin-uploadable field on `LandingPage` (`downloadFileUrl`, nullable) with a graceful
fallback to `ctaHref`/`ctaLabel` when absent — see the entry above and
`memory/decision-log.md`'s superseding T5.2 entry (session 34). The missing _file_ is no
longer debt, since the page now handles its absence correctly by design; the missing _admin
upload mechanism_ is the real, correctly-scoped gap, tracked in the new entry above instead.
**Impact:** N/A — superseded before this framing was ever acted on.
**Priority:** N/A
**Possible Fix/Fixes:** Superseded — see the entry above.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.5 (superseding entry above) — no longer T5.3, which was never the
right home for an admin-upload capability gap.

---

## Article download-resource availability is checked via a live per-request HEAD fetch, not a real object-storage capability

**Status:** Resolved
**Date raised:** 2026-09-06 (T4.3, session 26)
**Date resolved:** 2026-09-11 (session 54)
**Reason:** `insights-engine.md`'s edge case requires a removed `article_resource` file to
"fail gracefully with a clear message, not a dead link." No object storage (Cloudflare R2,
ADR 0004) is provisioned yet — "added once media volume justifies it," not day one — so
there's no cheaper way to answer "does this file still exist" than asking the file's own host
directly. `lib/insights.ts`'s `isResourceReachable` does a live `HEAD` request (3s timeout)
against each resource's `fileUrl` on every article page render.
**Impact:** Adds real latency to every article-page render that has resources (up to ~3s per
resource if the host is slow/unreachable, though resources run in parallel via `Promise.all`
with the rest of the page's data fetching) — acceptable for a low-traffic content site with
typically 0–1 resources per article, but a real cost that scales badly if an article ever has
many resources, and a real dependency on every linked host staying responsive.
**Priority:** Low
**Possible Fix/Fixes:** Once Cloudflare R2 is provisioned (ADR 0004), replace the live HEAD
check with R2's own existence signal — e.g. generate resource URLs only for objects confirmed
to exist at upload time, or query R2's API directly, either of which is cheaper and more
reliable than a live network round-trip per resource per visitor.
**Trigger type:** User-triggered — do not treat reaching a future task as a cue to build
against R2 speculatively; the underlying blocker is the firm/developer actually provisioning
real Cloudflare R2 credentials (`CLAUDE.local.md`'s Credentials section), not this project's
own task sequence. Same reclassification, same reasoning, as the sibling "Article/author
image uploads use an interim base64 data-URI store" entry above.
**Sequenced into:** No task — T7.10 (session 53) is exactly the task this entry was
precondition on ("this HEAD-check replacement can only happen once _something_ actually
uploads resources through the admin"), and it has now shipped: real `article_resource` rows
can be uploaded through `/admin`, but R2 is still unprovisioned, so the HEAD-check itself was
correctly left in place per T7.10's own architecture constraint. No further upcoming
Milestone 7 task touches this mechanism (per CLAUDE.md's rule against pointing at an
already-shipped task, this entry no longer names one). Once R2 is actually provisioned,
replace `lib/insights.ts`'s `isResourceReachable` with R2's own existence signal, alongside
the sibling entry's `encodeImageUpload`/`encodeDownloadFileUpload` swap — the correct next
action then is a direct, user-initiated fix, not waiting for another task to "reach" this
mechanism again.
**Resolution (session 54):** R2 provisioned. `lib/insights.ts`'s `isResourceReachable` now
derives the R2 object key from the `fileUrl` (`lib/r2-client.ts`'s `getR2ObjectKeyFromUrl`,
stripping the `CLOUDFLARE_R2_PUBLIC_URL` prefix) and issues a `HeadObjectCommand` against our
own bucket via the S3 SDK, instead of a plain HTTP `HEAD` against an arbitrary external host —
faster and more reliable, since it's now an authenticated call against our own storage rather
than trusting whatever host a `fileUrl` happened to point at. Falls back to the original plain
HTTP `HEAD` check for any URL that isn't under our own R2 base (defensive; should never occur
for a `fileUrl` this project itself writes going forward). Verified live via Playwright: a
real, just-uploaded R2-backed PDF resource correctly rendered as an available download link on
the real public article page (not the "currently unavailable" fallback), confirming the new
`HeadObjectCommand` path resolves correctly end-to-end.

---

## Home's featured-Insights section still returns a hardcoded empty list, even though `article` now exists

**Status:** Resolved
**Date raised:** 2026-09-06 (T4.2, session 25 — `lib/home.ts`'s `getFeaturedArticles()` stub
was written at T2.1 with an explicit comment: "Replace this stub with a real query … once
Milestone 4 adds the `article` model." T4.1/T4.2 (Milestone 4) had just done exactly that.)
**Date resolved:** 2026-09-06 (same session — user asked why this was deferred onto an
already-shipped task instead of just being fixed, which was the right question: see
Reason below)
**Reason:** T4.2's own task scope is `/insights` only, so wiring Home's featured section
wasn't done as part of that task. First attempt at handling the gap added an "Addendum" block
to T2.1's entry in `docs/tasks/02-public-presentation.md` and left this entry `Sequenced
into: T2.1` — mishandled: CLAUDE.md's debt-sequencing rule exists so "whichever session
reaches this task in the normal course of work" does the fix, but no session ever "reaches"
an already-completed task again — task IDs only move forward, so a note left on T2.1 would
never surface in any future `/task` invocation. The correct model already exists in this
project's own history: session 23's "T3.7 follow-up" (see the diagnostic-summary-email entry
below) revisited an already-shipped task in the same session it was discovered and fixed it
immediately, committed under that same task ID. Followed that model here instead: reverted
the inert T2.1 addendum and fixed `getFeaturedArticles` directly, same session, same
conversation, as a "T2.1 follow-up."
**Impact:** None remaining — Home's featured-Insights section now reads real published
`article` rows (see Possible Fix/Fixes below for what shipped).
**Priority:** Medium (before the fix)
**Possible Fix/Fixes:** ~~Replace `getFeaturedArticles`'s body with a real query...~~ Done:
resolves `featuredArticleIds` first (published only, in the admin's own pinned order), falls
back to the 3-most-recent-published query for any remaining slots (`home-page.md`'s own edge
case: "pinned but later unpublished falls back to most-recent automatically") — see
`memory/completed-work.md`'s "T2.1 follow-up" entry, session 25.
**Trigger type:** Task-sequenced
**Sequenced into:** T2.1 (closed out same-session as a follow-up, not deferred — see Reason)

---

## Diagnostic summary email had no admin edit screen yet for its new `emailDetail` content

**Status:** Resolved
**Date raised:** 2026-09-06 (T3.7 follow-up, session 23 — user asked whether the emailed
summary's content was admin-editable and, on inspection, whether it was genuinely fuller
than the on-screen result; it was neither)
**Reason:** The user's real complaint wasn't the email's subject/intro/closing chrome (those
are fine as plain copy) — it was that `buildSummaryEmailHtml` (`lib/diagnostic-request-
summary.ts`) reused `DiagnosticScoreBand.statement`, the exact same short sentence
`/diagnostic/results` already shows on screen. A "full written summary" that repeats the
screen verbatim isn't actually fuller. Fixed by adding a new `DiagnosticScoreBand.emailDetail`
column (migration `20260906023106_add_diagnostic_score_band_email_detail`) — a separate,
longer, multi-paragraph narrative used only by the email, never by the results screen —
seeded with real (placeholder-flagged) detailed copy per band, verified end-to-end via a real
`/api/diagnostic/submit` call against the running dev server (confirmed `getScoreBand`
returns the new field, the email HTML renders it as real paragraphs, and `/diagnostic/results`
itself is unchanged — still shows only the short `statement`, screenshotted to confirm no
regression). Full reasoning in `memory/decision-log.md`.
**Impact:** Low today (the email now genuinely is fuller, and the content lives in the DB
ready to be edited) but no `/admin` screen exists yet to let a partner actually change it —
same gap `DiagnosticScoreBand.statement`/`.label` already carry, now also true for
`.emailDetail`.
**Priority:** Medium
**Possible Fix/Fixes:** Extend T7.7's Diagnostic Configuration editor to expose all three
score-band content fields (label, statement, emailDetail) — emailDetail needs a multi-line
textarea, not a single-line input, since it supports blank-line-separated paragraphs.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.7 (Diagnostic Configuration, `docs/tasks/07-content-admin.md`) — see
that task's session-23 addendum for the exact field list this editor still needs to add.
**Date resolved:** 2026-09-11 (T7.11, session 55 — caught stale while auditing open debt for
the "Website Build Status" Artifact's Milestone 7 update; T7.7 itself, session 50, had
already shipped exactly this: `/admin/diagnostic-configuration`'s Score bands section has a
`Label` input, an `On-screen statement` textarea, and a separate `Email detail` textarea per
band — confirmed directly in `app/admin/(shell)/diagnostic-configuration/
configuration-client.tsx`. This entry was simply never flipped when T7.7 completed.)

---

## Diagnostic results screen has no score-band label/statement (e.g. "Strong Foundation") — not seeded, not admin-editable, not planned anywhere

**Status:** Resolved
**Date raised:** 2026-09-05 (T3.6/T3.7, session 22 — user asked whether this was already
built or planned as admin-editable; it's neither)
**Date resolved:** 2026-09-05 (same session — user asked to fix it now rather than defer)
**Reason:** `ui/mockups/c-diagnostic/diagnostic-results.html`'s own `BANDS` array pairs each
score threshold with a visitor-facing label ("Strong Foundation", "Developing, With Real
Gaps", "Workable, Not Yet Provable", "Running on Memory") and a matching prose statement —
that file's own comment already flags this content as "illustrative placeholder — reserved
to firm authorship," the same status the question set carried at T3.3. Unlike the question
set, though, T3.3 never seeded illustrative band-label content anywhere (no schema field
exists for it — `DiagnosticThreshold` only has `triagePriorityLevel`, an internal
partner-facing priority word like "High", not the same thing as a visitor-facing band
label), and `docs/features/content-management-admin.md`'s Diagnostic Configuration scope
(bullet #8, restated in Business rules) explicitly lists only "question text, order, active
flag, dimension weights, triage thresholds" as admin-editable — band labels/statements are
named nowhere as planned admin content, at T7.7 or anywhere else. T3.6 (this session) chose
to omit the band label/statement entirely rather than build it, substituting the real,
already-computed `indicativeCostStatement` in that screen position — a reasoned call at the
time, but in hindsight inconsistent with T3.3's own precedent (carry the mockup's real
illustrative content over, flagged placeholder, rather than omit it) — see
`memory/decision-log.md`, T3.6.
**Impact:** Low today (the results screen still shows a real score and real statement, just
not the band-label element specifically) but a real content gap once the firm supplies real
band wording: there's no field to put it in and no admin screen to edit it from.
**Priority:** Medium
**Possible Fix/Fixes:** ~~Add real fields to hold this...~~ Done: added a new
`DiagnosticScoreBand` model (id, `minScore`, `label`, `statement`, `isPlaceholder` — a real
column from the start, unlike `DiagnosticQuestion`'s own gap) rather than extending
`DiagnosticThreshold` (a real structural mismatch — bands cover the full 0–100 range with no
gaps, thresholds are sparse triage cutoffs that may not be breached at all). Migration
`20260905235239_add_diagnostic_score_band`. Seeded the mockup's own illustrative 4-band
content (`prisma/seed.ts`'s `seedDiagnosticScoreBands`) flagged `isPlaceholder: true`, same
treatment as the question set. Added `lib/diagnostic-flow.ts`'s `getScoreBand(score)` and
wired it into `app/diagnostic/results/page.tsx` — the band label/statement now render in the
mockup's own position, with the real `indicativeCostStatement` moved to lead the dimension
breakdown instead of being dropped. Verified for real: submitted a real score-60 response via
the running dev server, confirmed the results page renders "Developing, With Real Gaps" and
its real statement correctly, at both desktop and mobile widths, no horizontal overflow. Test
row deleted afterward. Extending T7.7's admin screen to edit this content is still future
work (not done as part of this fix, which only builds the data model + display side) — left
in the addendum below.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.7 (Diagnostic Configuration, `docs/tasks/07-content-admin.md`) — the
admin-editing side of this content is still that task's own job; the data model, seed, and
display are done.

## `footer_content.scope_of_practice_statement`/`company_registration_details` materialized but not wired into `SiteFooter`/`ScopeOfPracticeNote`

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-11 (T7.8, session 51)
**Reason:** T2.7 (`docs/tasks/02-public-presentation.md`) materialized the `footer_content`
singleton (seeded with the same scope-of-practice wording `components/scope-of-practice-
note.tsx` already hardcodes, plus `companyRegistrationDetails: null`), reading it live on
every new `/legal/[slug]` page's own body content. But `ScopeOfPracticeNote` (rendered inside
`SiteFooter` on every public page) still renders T1.5's original hardcoded text, and has no
prop for `companyRegistrationDetails` at all — the exact same "second hardcoded copy" gap
already flagged for `SiteSettings`/`SiteFooter`'s address/phone props (see the entry directly
below this one), now also true for this entity. Deliberately not fixed as part of T2.7 itself
— that task's own architecture constraint allowed either resolving or logging this gap, and
fixing it would mean threading `getFooterContent()`-fetched props through all seven `SiteFooter`
call sites (home, capabilities, our-method, about, contact, offers/[slug], and the new legal
page) for a Small-sized task, the same cost/precedent T2.6 weighed for the site_settings gap.
**Impact:** Low today (the hardcoded text and the seeded `footer_content` row match exactly,
and `companyRegistrationDetails` was never shown anywhere before this row existed either), but
identical staleness risk to the `SiteSettings` gap below: once T7.8 makes this content
admin-editable, an edit won't propagate to the footer until this is fixed. Also means the
footer never shows company registration details even once the firm supplies them, until fixed.
**Priority:** Medium
**Possible Fix/Fixes:** Same shape as the `SiteSettings`/`SiteFooter` fix directly below —
change `ScopeOfPracticeNote` to accept `scopeOfPracticeStatement`/`companyRegistrationDetails`
as props (rendering the registration-details line only when non-null, per this feature's own
edge case), and update every `SiteFooter` caller to fetch `getFooterContent()` (a resolver not
yet written — add it to `lib/legal.ts` when this is actually wired in) and pass them through.
Natural to do in the same pass as the `SiteSettings` fix, since both are footer singletons
read by the same seven call sites.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.8 (Site Settings singleton, `docs/tasks/07-content-admin.md`) —
addendum added this session pointing back here, alongside the existing `SiteSettings` entry.
**Resolution (T7.8, session 51):** Added `lib/legal.ts`'s `getFooterContent()` (the resolver
this entry's own fix note said didn't exist yet). `ScopeOfPracticeNote`
(`components/scope-of-practice-note.tsx`) now accepts `statement`/`companyRegistrationDetails`
as optional props (defaulting to the original hard-coded copy/`null` only when a prop is
omitted, not when explicitly blank), rendering the registration-details line only when
non-null. `SiteFooter` threads both through. Fixed in the same pass as the `SiteSettings`
entry directly below, across all sixteen real `SiteFooter` call sites (more had accumulated
since this entry's original "seven" count) — see that entry's own resolution note for the
full list and the two deliberate exceptions (`app/error.tsx`, `app/not-found.tsx`).

---

## `site_settings.response_time_commitment` has no real value yet — firm hasn't confirmed a number

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.6 (`docs/tasks/02-public-presentation.md`) materialized the `site_settings`
singleton and built `/contact` to read it live, but the firm has not yet supplied a
response-time commitment it can actually keep (`contact-and-enquiry.md`'s business rule:
"content the firm supplies and must actually be able to keep"). Seeded `null` rather than
carrying over the mockup's own "Response-time commitment: pending." text, which is a
mockup-authoring annotation, not real visitor copy (same treatment as the photo-pending
caption removed from `/about` at T2.5).
**Impact:** Low — `/contact` correctly omits the response-time panel entirely while null
(`content-management-admin.md`'s edge case: a blank required field is omitted from the public
display, not shown broken), so nothing renders incorrectly. The gap is simply that a real
visitor sees no stated response-time commitment at all until the firm confirms one.
**Priority:** Medium
**Possible Fix/Fixes:** Once the firm states a real, keepable response-time commitment, set
`site_settings.response_time_commitment` via the now-built Site Settings screen
(`/admin/site-settings`, T7.8, session 51 — "Response-time commitment" field) — no code
change required, this is a content edit, not a build task.
**Trigger type:** User-triggered — do not fabricate a response-time commitment or treat T7.8
having shipped as a cue to invent one; wait for the firm to state a real number first.
**Sequenced into:** `/admin/site-settings` (built at T7.8, `docs/tasks/07-content-admin.md`,
session 51) — recording where the mechanism now lives, per CLAUDE.md's User-triggered
exemption from the "don't point at an already-shipped task" rule.

---

## `SiteFooter` callers still pass hardcoded address/phone props instead of reading `site_settings`

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-11 (T7.8, session 51)
**Reason:** T2.6 is the first task to materialize a real `site_settings` row, and wires it
into `/contact`'s own channel cards and `WhatsAppLinkButton` — but every public page's
`SiteFooter` call (T1.5's own precedent, `app/(public)/page.tsx`, `app/capabilities/page.tsx`,
`app/our-method/page.tsx`, `app/about/page.tsx`, and this task's own `app/contact/page.tsx`)
still passes `addressLine1`/`addressLine2`/`phonePrimary` as literal hardcoded strings, since
no `site_settings` table existed when those callers were written. CLAUDE.md's Recurring
Patterns rule ("SiteFooter, /contact, and every WhatsAppLinkButton all read the same record —
never a second hard-coded copy anywhere") is now violated the moment this real row exists
alongside those still-hardcoded props — flagged per this task's own architecture constraint
rather than silently left unnoticed.
**Impact:** Low today (the hardcoded values and the seeded `site_settings` row match exactly),
but a future Site Settings edit (e.g. an office move, a phone number change) would update
`/contact` and `WhatsAppLinkButton` everywhere while every page's footer silently kept
showing the old value — a real staleness risk once T7.8 ships and a partner starts editing.
**Priority:** Medium
**Possible Fix/Fixes:** Change `SiteFooter`'s callers to fetch `getSiteSettings()` (or accept
it as a prop threaded from each page's own already-fetched data) instead of passing literal
strings — a mechanical change across five call sites, natural to do alongside T7.8's own
Site Settings admin build, when the record becomes editable and staleness actually starts to
matter.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.8 (Site Settings singleton, `docs/tasks/07-content-admin.md`) —
addendum added this session pointing back here.
**Resolution (T7.8, session 51):** `SiteFooter`'s props are now all optional
(`addressLine1`/`addressLine2`/`phonePrimary`/`scopeOfPracticeStatement`/
`companyRegistrationDetails`), defaulting to the original T1.5 mockup literals only when a
prop is omitted (`undefined`) — same `FALLBACK_CORE_OFFERS`-style precedent already used by
`SiteHeader`'s `offerNavLinks`. Added `lib/site-settings.ts`'s `getSiteFooterContent()`
(combines `getSiteSettings()` + `getFooterContent()` into `SiteFooter`'s exact prop shape) so
most callers need only one added fetch. Fixed at all sixteen real `<SiteFooter>` call sites —
more had accumulated since this entry's original "five" count (`app/(public)/page.tsx`,
`app/capabilities/page.tsx`, `app/our-method/page.tsx`, `app/about/page.tsx`,
`app/contact/page.tsx`, `app/diagnostic/page.tsx`, `app/diagnostic/results/page.tsx`,
`app/offers/[slug]/page.tsx`, `app/insights/page.tsx`, `app/insights/[slug]/page.tsx`,
`app/legal/[slug]/page.tsx`, `app/lp/[slug]/page.tsx`, and the two `app/dev/layout-shell/*`
scratch pages, which now render with every prop omitted rather than stale hardcoded literals).
Two call sites deliberately keep the fallback instead of fetching: `app/error.tsx` (a required
Client Component per Next.js's error-boundary rule, can't call server-only Prisma code) and
`app/not-found.tsx` (deliberately zero-DB-dependency for reliability — see that file's own
comment about a real DNS-hang incident). Also fixed a related bug found live-verifying this
task: `app/contact/page.tsx`'s phone/WhatsApp/email/office cards rendered an empty, broken
`tel:`/`wa.me`/`mailto:` link when the underlying field was blank instead of omitting the
card — each is now conditionally rendered.

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-10
**Reason:** `ui/mockups/a-public-site/offer-funding-readiness-pack.html` has a
`.checklist-panel` section between the fee panel and the out-of-scope note, promoting a free
"Funding-Readiness Checklist" download and linking to
`ui/mockups/d-landing-pages/landing-funding-readiness-checklist.html`. That landing page is
Milestone 5 scope (T5.1/T5.2, `docs/tasks/05-landing-and-measurement.md`) and doesn't exist
as a real route yet at T2.2. This section isn't one of FR-4.1's 10 fixed fields (it's a lead-
magnet cross-promo, not part of `core-offer-pages.md`'s documented `offer` entity), so T2.2
omitted it entirely from `app/offers/[slug]/page.tsx` rather than link to a route that would
404, or fabricate a substitute destination.
**Impact:** Low — the Funding-Readiness Pack page is otherwise complete per FR-4.1. This is a
missed cross-sell opportunity to the checklist lead magnet until Milestone 5 ships it, not a
correctness or compliance issue.
**Priority:** Low
**Possible Fix/Fixes:** Once T5.2 seeds the `/lp/funding-readiness-checklist` landing page
instance, add the `.checklist-panel` section back to the Funding-Readiness Pack offer page
(`app/offers/[slug]/page.tsx`), linking to that real route.
**Trigger type:** Task-sequenced
**Sequenced into:** T5.2 (Three landing page instances, seeded,
`docs/tasks/05-landing-and-measurement.md`) — addendum added this session pointing back here.

---

## Business Health Check's two-tier pricing has no real data model yet

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-05 (T2.2, same day — this project's sessions have run in rapid
succession)
**Reason:** T2.1 needed real `Offer` rows to seed the home page's offer cards. Two of the
three offers (Financial Clarity Pack, Funding-Readiness Pack) have a single published fee
band each, matching `core-offer-pages.md`'s documented `fee_amount_min`/`fee_amount_max`/
`scope_cap` shape exactly. Business Health Check does not — its own mockup
(`ui/mockups/a-public-site/offer-business-health-check.html`) shows two real tiers (Express:
GHS 1,000–2,000, 5 working days, single location; Full: GHS 3,000–6,500, 2 weeks, up to 3
locations), each with its own deliverables, and the mockup itself labels the Full tier's
band as "the published fee band" while the nav/home-card fee hint shows Express's floor
("From GHS 1,000"). Nothing in `core-offer-pages.md` accounted for a multi-tier offer.
**Impact:** T2.1 seeded a provisional `feeAmountMin: 1000, feeAmountMax: 6500` (Express's
floor to Full's ceiling) and a prose `scopeCap` describing both tiers, so the home card's
"From GHS 1,000" rendered correctly — but that was a stopgap, not a real representation of
the two tiers.
**Priority:** N/A — resolved
**Possible Fix/Fixes:** ~~Most likely a dedicated `OfferTier` model~~ Done: added a real
`OfferTier` model (`offer_id`, `name`, `is_featured`, `duration_label`, `scope_label`,
`scope_cap`, `fee_amount_min/max`, `fee_currency`, `deliverables`, `client_inputs`,
`sort_order`), seeded with Business Health Check's real Express/Full rows
(`prisma/seed.ts`'s `seedOfferTiers()`). `app/offers/[slug]/page.tsx` renders a tier grid
(deliverables + fee) and a per-tier "required from you" section when `offer.tiers.length >
0`, and resolves the fee-panel's "published fee band" to whichever tier has `is_featured:
true` (Full), with the other tier(s) surfaced as the panel's alt-note. `Offer`'s own
`feeAmountMin/Max` (Express's floor to Full's ceiling) is kept unchanged for the home-card/
nav-dropdown "From GHS 1,000" hint — that's a genuinely different summary than the detail
page's own fee panel, not a duplicate to be removed.
**Trigger type:** N/A — resolved
**Sequenced into:** T2.2 (Core Offer pages, `docs/tasks/02-public-presentation.md`) — closed
out per that task's own addendum.

---

## Temporary favicon in use — pending the firm's confirmed final icon

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** User asked to use the "KB" monogram favicon from `Company Docs/Brand
assets/` (the site's `app/favicon.ico` was still Next.js's default) explicitly as a
temporary stand-in, until the firm confirms a real, final icon. Used the pre-generated
iconifier.net set already present there rather than regenerating one:
`Company Docs/Brand assets/favicon.ico` → `app/favicon.ico` (multi-res .ico, matches
`Brand assets/iconified/favicon.ico` byte-for-byte) and
`Brand assets/iconified/apple-touch-icon-180x180.png` → `app/apple-icon.png` (Next.js's
file-based icon convention only wires one apple-touch size automatically; 180×180 is the
modern-device-covering size, per the other pre-generated sizes in that folder being for
older/smaller devices this project doesn't need to support separately).
**Impact:** None functionally — the site now has a real (if provisional) favicon/apple
touch icon instead of Next's default. Purely a "don't treat this as the final brand
decision" flag.
**Priority:** Low
**Possible Fix/Fixes:** Once the firm confirms a final icon, replace `app/favicon.ico` and
`app/apple-icon.png` directly with the confirmed assets (re-run them through an
iconifier-style tool first if only a source logo is supplied, not a ready `.ico`).
**Trigger type:** User-triggered — do not treat reaching T2.8 (or any other task) as a cue
to swap this on its own; only replace it when the user says the firm has confirmed a final
icon.
**Sequenced into:** T2.8 (SEO foundation, `docs/tasks/02-public-presentation.md`) — a
checkpoint to confirm whether a final icon exists yet by the time that task is reached, not
an instruction to act unprompted.

---

## About page partners have no real photography yet

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** T2.5 sourced real names, roles, credentials and bios for all 5 partners from
`ui/mockups/a-public-site/about.html`/Company Docs, but no partner photograph exists anywhere
in the repo (checked `public/` and `ui/mockups/assets/` before building — neither has one).
Per revised policy (session 11, `memory/decision-log.md`), this does not block publishing:
all 5 `author` rows are seeded `published: true` with `photoUrl: null`, rendered on `/about`
with an initials avatar (`app/about/page.tsx`'s `PartnerAvatar`) in place of a photo.
**Impact:** Low — cosmetic only; every partner's real profile is fully visible and correct,
just without a photograph. `/about` is not "half-finished" by this project's own revised
standard, but a photo does read more credibly than initials long-term.
**Priority:** Low
**Possible Fix/Fixes:** Once the firm delivers real partner photography (single coordinated
session, per Document 13.03 Section 13), upload each photo and set that `author` row's
`photoUrl` — via T7.6's Team editor once built, or a direct seed/DB update if that's not yet
available. No other code change needed; the avatar swaps automatically the moment `photoUrl`
is set.
**Trigger type:** User-triggered
**Sequenced into:** T7.6 (Team / author profile editor, `docs/tasks/07-content-admin.md`) —
see that task's session-11 addendum. Do not source or generate partner photos proactively;
wait for the firm to say photography is ready.

---

## Home page senior-attention panel has no real partner photography yet

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** `ui/mockups/a-public-site/home.html`'s Senior Attention section pairs its copy
with a photo/credentials panel; the mockup itself only shows an italic wireframe note
("Real partner photography and credentials appear here at build time..."), since no partner
photo assets exist in `public/brand/` yet (only the two logo files). T2.1 kept an equivalent
honest placeholder note rather than inventing or stock-sourcing imagery (CLAUDE.md's
placeholder-content rule, applied to an image asset gap rather than text copy).
**Impact:** Low — cosmetic only, doesn't block T2.1's own acceptance criteria. The home page
currently ships an admittedly-provisional panel in a section that's meant to build trust.
**Priority:** Low
**Possible Fix/Fixes:** T2.5 (now complete) sourced real partner names/bios/credentials for
`/about`, but not real photography (see "About page partners have no real photography yet"
above — same underlying asset gap). Once that gap closes, swap this panel for a real photo
(or small multi-partner strip) instead of the italic note; until then, this panel and
`/about`'s own initials-avatar treatment are consistent with each other, not a contradiction.
**Trigger type:** User-triggered
**Sequenced into:** T7.6 (Team / author profile editor, `docs/tasks/07-content-admin.md`) —
tied to the same photography delivery as the entry above; revisit both together once photos
exist.

---

## GTM container not yet provisioned

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-10 (T5.3, session 35) — the user created the real container
(`GTM-PDGKRKRN`, account "Kaalbert & Company Ltd," under `kaalbert.company@gmail.com`) and a
real GA4 property (`G-9VX9GS5L0X`), same as this project's own account-ownership precedent
(`memory/decision-log.md`, T1.1). Set as `GTM_CONTAINER_ID` in `.env.local` and directly on
the Railway `kaalbert-web` service (`railway variables --set`), and verified end-to-end
against the real dev server: `gtm.js` loads with the real ID, the six event tags/triggers +
consent default all fire correctly in GTM Preview mode, and — after publishing — a real
`google-analytics.com/g/collect` request was observed carrying the `gcd` consent-diagnostics
parameter for both `diagnostic_started` and the automatic `page_view` hit. T1.6's own
acceptance criterion ("GTM Preview mode confirms the container fires... with zero tags
active") is retroactively closed by this same verification.
**Reason:** T1.6 installed the empty GTM bootstrap snippet (head script + `<body>` noscript
iframe, ADR 0006) in the root `app/layout.tsx`, reading `GTM_CONTAINER_ID` from the
environment. No real Google Tag Manager account/container exists for kaalbert.com yet —
creating one is an external action only the user can take (same category as the
`kaalbert.com` domain registration in T1.1's addendum), so it was not created this session.
The snippet was verified working end-to-end against a throwaway test ID (`GTM-TEST123`) via
Playwright: `window.dataLayer` initializes correctly, the `gtm.js` script tag requests the
right URL with the container ID interpolated, and the noscript iframe renders immediately
after `<body>` — the only thing missing is a real container ID. When `GTM_CONTAINER_ID` is
unset (current state), the snippet renders nothing at all, verified via `curl` against the
dev server — no broken/placeholder script tag ships.
**Impact:** T1.6's acceptance criterion ("GTM Preview mode confirms the container fires on
page load with zero tags active") cannot be fully closed out — GTM Preview mode requires a
real container to preview against. No functional impact on the site: with no container ID
set, the site renders with zero GTM-related markup, so nothing is broken or half-shipped in
the meantime.
**Priority:** Medium — blocks full sign-off of T1.6's acceptance criterion and is a hard
prerequisite for T5.3 (which populates the container with the six conversion events).
**Possible Fix/Fixes:** Once the user creates a GTM account/container for kaalbert.com, set
the real `GTM-XXXXXXX` ID as `GTM_CONTAINER_ID` in `.env.local` and on the Railway
`kaalbert-web` service, then run GTM's own Preview mode against the deployed/dev site to
confirm it fires with zero tags active — closing T1.6's acceptance criterion retroactively.
**Trigger type:** User-triggered — do not create a Google/GTM account or treat reaching
T5.3 as a cue to sign up for one; wait for the user to say the GTM container exists and
provide the real container ID.
**Sequenced into:** T5.3 (GTM container: six conversion events + consent mode,
`docs/tasks/05-landing-and-measurement.md`) — addendum added this session pointing back
here; T5.3 cannot start until this is resolved, since it populates the same container.

---

## Two-partner simultaneous page edits use last-write-wins (no optimistic locking)

**Status:** Open
**Date raised:** 2026-09-05
**Reason:** `docs/features/content-management-admin.md`'s "Edge cases" section documents:
"Two partners edit the same page simultaneously: last write wins at launch — optimistic
locking/conflict detection is not required for Phase 1 given five partners and low edit
frequency, but is noted here as a known simplification (recorded in
`memory/technical-debt.md` once implementation begins)." Logged now, proactively, at the
user's explicit request this session, rather than waiting for T7.2/T7.3 to actually be
implemented as the feature doc's own text originally planned — the user flagged that leaving
it as an undated "Anticipated" placeholder (with no `Sequenced into:` target, no `Status`,
no `Priority`) wasn't real due diligence and asked for it to become a proper entry now.
**Impact:** If two partners save overlapping edits to the same `article`/`page`/other
admin-editable entity within the same window, the second `PATCH` silently overwrites the
first partner's changes with no warning to either partner — no error, no merge, no "someone
else edited this" notice. Explicitly accepted as tolerable for Phase 1 launch given the
firm's actual partner count (five) and edit frequency (low) — this is a documented,
deliberate simplification, not an oversight, and does not need to be fixed before T7.2/T7.3
ship.
**Priority:** Low — accepted for Phase 1 by the feature doc itself; revisit only if the
partner count grows or edit frequency increases enough that real collisions start
happening in practice.
**Possible Fix/Fixes:** Lightest option: an `updated_at` (or a dedicated `version` column)
check on each `PATCH` that rejects a stale write with a "someone else has edited this since
you opened it — reload to see their changes" error, rather than silently overwriting.
Heavier option: a "currently being edited by [name]" banner shown to the second partner
before they even start editing. Full real-time collaborative editing (Google-Docs-style) is
explicitly out of scope for this project's size. No fix is required to ship T7.2/T7.3 —
this entry exists so the limitation is a conscious, documented choice at that point, not a
silently-shipped gap.
**Trigger type:** Task-sequenced — whichever session builds T7.2/T7.3 should read this entry
and consciously decide "ship as documented last-write-wins" vs. "add the lightweight
staleness check while already building the PATCH handler" — not treated as a mandatory fix,
just a required conscious decision point.
**Sequenced into:** T7.2 (Articles editor + Categories) and T7.3 (Pages editor), both in
`docs/tasks/07-content-admin.md` — addenda added this session to both task entries pointing
back here.

---

## ESLint pinned to the EOL 9.x line

**Status:** Open
**Date raised:** 2026-09-04
**Reason:** `eslint@^10` is current, but bumping produced `ERESOLVE overriding peer
dependency` warnings against `eslint-config-next@16.3.4`'s plugin chain (something in that
chain still peer-depends on ESLint 9). `create-next-app`'s own generated `package.json` for
this exact Next.js version independently chose `eslint@^9`, so matched that rather than force
an unproven combo on day one. npm flags `eslint@9.39.5` as "no longer supported."
**Impact:** No functional impact today — lint passes clean. Risk is losing ESLint 10-only
rules/fixes and eventually losing security patches on the 9.x line.
**Priority:** Low — revisit opportunistically, not urgent.
**Possible Fix/Fixes:** Re-attempt the `eslint@^10` bump once `eslint-config-next` publishes
a release with a peer range that includes ESLint 10 cleanly (check `npm info
eslint-config-next peerDependencies` before retrying).
**Trigger type:** Task-sequenced — re-check opportunistically whenever `package.json` is next
touched for an unrelated reason; no separate user go-ahead needed.
**Sequenced into:** ~~T3.7 (Gated summary request, `docs/tasks/03-diagnostic.md`)~~ —
corrected (session 49, T7.6 follow-up): T3.7 shipped long ago without anyone re-checking
this, since a `Task-sequenced` pointer into an already-shipped epic is never naturally
revisited (see CLAUDE.md's tightened "never sequence into an already-shipped epic" rule and
`memory/decision-log.md`, 2026-09-11 process entry, for the full correction). Reassigned to
**T7.7** (Diagnostic Configuration, `docs/tasks/07-content-admin.md`) — the concrete next
task about to be executed, so this has a real chance of actually being re-checked.

**Re-checked (session 04, 2026-09-05, T1.4):** `npm info eslint-config-next@16.3.4
peerDependencies` now reports `eslint: >=9.0.0` — technically includes 10 — and a dry-run
install shows no ERESOLVE errors at all (the warning above no longer reproduces; a
transitive dependency must have relaxed its range since T1.1). Actually installed
`eslint@^10.10.0` and ran `npm run lint` for real: it crashes outright —
`TypeError: contextOrFilename.getFilename is not a function` thrown inside
`eslint-plugin-react`'s `react/display-name` rule (`node_modules/eslint-config-next/
node_modules/eslint-plugin-react/lib/util/version.js`), because that rule calls an ESLint 9
context API removed in ESLint 10. This is a harder blocker than the original ERESOLVE
warning — a real runtime crash, not just an unresolved peer range — so `eslint-config-next`
must ship a `eslint-plugin-react` bump before this can move. Reverted to `eslint@^9.39.5`
(confirmed `npm run lint` passes clean again) rather than leave the repo on a broken lint
config.

**Re-checked (session 17, 2026-09-05, T3.2):** `npm info eslint version` still reports
`10.10.0`, `npm info eslint-plugin-react version` still reports `7.37.5` — both unchanged
since the T1.4 crash above, so the same `react/display-name` `TypeError` almost certainly
still reproduces. Did not re-attempt the actual install/lint-run this time (nothing in the
upstream versions changed to justify re-testing a combination already confirmed broken);
re-sequenced to T3.7 above rather than left pointing at this now-completed task.

---

## `diagnostic_question` has no queryable `is_placeholder` column

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-11 (T7.7, session 50)
**Reason:** T3.3 (`docs/tasks/03-diagnostic.md`) seeded the launch question set carried over
verbatim from `ui/mockups/c-diagnostic/diagnostic-flow.html` and — per that task's own
acceptance criterion — flagged every question `is_placeholder: true`, but only in the seed
script's own comment. `diagnostic_question` has no real `is_placeholder` boolean column,
unlike every other content-bearing model in this schema (`Offer`, `Page`, `MethodStage`,
`Author`, `SiteSettings`, `LegalPage`, ...) — `docs/features/business-health-check-
diagnostic.md`'s Data requirements section never named one, matching T3.1's already-migrated
schema exactly, so T3.3 couldn't add one without a schema change outside its own scope.
**Impact:** Low today — the seed comment correctly documents the pending status for a
developer reading the source. But Milestone 7's config admin (T7.7, Diagnostic Configuration)
and `docs/dashboard.md` are both expected (per T3.3's own acceptance criterion and the
`is_placeholder` convention established at T2.9) to surface "what's still pending real
content" — a comment-only flag can't be read or displayed by that admin screen or the
dashboard at runtime, so once T7.7 ships, a partner editing the question set has no way to
see that this launch set is still the mockup's illustrative wording pending firm review.
**Priority:** Medium
**Possible Fix/Fixes:** Add a real `isPlaceholder Boolean @default(false)` column to
`DiagnosticQuestion` (mirroring every other content model's convention) via a migration, then
update T3.3's seed rows to set it `true` via the real column instead of only a comment, and
have T7.7's admin screen surface it the same way it would for any other placeholder-flagged
content.
**Trigger type:** Task-sequenced
**Sequenced into:** T7.7 (Diagnostic Configuration, `docs/tasks/07-content-admin.md`) — the
first task that actually builds a UI surface over this question set; see the addendum added
to that task's entry this session.
**Resolution:** Added a real `isPlaceholder Boolean @default(false)` column to
`DiagnosticQuestion` via migration, updated `prisma/seed.ts` to set it `true` on the real
column (not just a comment), and the Diagnostic Questions admin list/edit screens (T7.7)
surface it as a "Placeholder" badge in the list and an editable "Placeholder content" toggle
in the editor, matching every other content type's convention.

---

## Vitest never scaffolded (no test runner exists yet)

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-05 (T3.2, session 17)
**Reason:** CLAUDE.md names Vitest + React Testing Library as the unit/component-testing
stack, but no task through T1.3 has actually installed or configured it — there's no
`vitest.config.ts`, no `test` script in `package.json`, and no `*.test.*` file anywhere in
the repo. T1.3 (design tokens + a scratch visual-verification page) had nothing worth
unit-testing, so it surfaced the gap without being the right place to close it.
**Impact:** `npm run test` (part of CLAUDE.md's Quality Gates) currently has nothing to run.
No functional risk yet — no `lib/` business logic exists yet either — but the gap must close
before the first task that ships real business logic, or that task's own unit-test
acceptance criteria can't be met.
**Priority:** Medium — not urgent today, but blocking the moment it's needed.
**Possible Fix/Fixes:** Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
(and a DOM environment, e.g. `jsdom` or `happy-dom`); add `vitest.config.ts`; add a `test`
script to `package.json`.
**Trigger type:** Task-sequenced
**Sequenced into:** T3.2 (Server-side scoring function, `docs/tasks/03-diagnostic.md`) — the
first task with real `lib/` logic and explicit unit-test acceptance criteria; see that task's
addendum.

**Resolved (session 17, 2026-09-05, T3.2):** Installed `vitest`, `@testing-library/react`,
`@testing-library/jest-dom`, `jsdom`; added `vitest.config.mts` (`jsdom` default environment,
`@/*` alias matching `tsconfig.json`); added `"test": "vitest run"` to `package.json`. Hit a
real peer-dependency conflict resolving it — `vitest@5`/`@testing-library/jest-dom@7` require
`@types/node@^22 || >=24`, but `@types/node` was still pinned `^20`; bumped to `^22` (see
`memory/decision-log.md` — this also corrects a pre-existing mismatch against
`engines.node: ">=22"`). First real suite: `lib/diagnostic-scoring.test.ts`, 6 tests, all
passing.

---

## railway.json (Config as Code) is deprecated in favour of .railway/railway.ts

**Status:** Resolved
**Date raised:** 2026-09-05
**Date resolved:** 2026-09-05 (same session — turned out to be more urgent than "Low
priority": `railway.json`'s `deploy.startCommand` had never actually applied to the live
service at all, unrelated to the deprecation itself; see `memory/decision-log.md`'s
"railway.json never applied; migrated to Infrastructure as Code" entry for the full
investigation)
**Reason:** `railway status` printed: "Config as Code (railway.json / railway.toml) is
deprecated. Prefer Infrastructure as Code (.railway/railway.ts)." T1.2 added `railway.json`
(for the `deploy.startCommand` that runs `prisma migrate deploy && npm start`) before
noticing this warning on a later `railway status` check.
**Impact:** Turned out to be more than the deprecation warning alone — `railway.json` was
never actually being read by Railway at all (`serviceManifest.deploy.startCommand` stayed
`null` on every deployment), so `prisma migrate deploy` had never run in production.
**Priority:** Low → became urgent once discovered the config wasn't applying at all
**Possible Fix/Fixes:** ~~Run `railway config migrate`~~ Done: migrated to
`.railway/railway.ts` via `railway config migrate --service kaalbert-web --apply
--delete-files`, then hand-fixed the auto-generated file (it omitted `source`/`variables`,
which would have deleted `DATABASE_URL` and disconnected the GitHub source on apply) before
running `railway config apply --yes`. Verified via deployment logs: `prisma migrate deploy`
now runs before `next start` in production.
**Trigger type:** N/A — resolved
**Sequenced into:** T1.2 (this session, follow-up work) — closes out what was originally
sequenced into T1.6; no further action needed there.

---

## 4 high-severity npm audit vulnerabilities in Prisma CLI's dev-tooling tree

**Status:** Open
**Date raised:** 2026-09-04
**Reason:** `npm audit` (after T1.2's `prisma@7.10.0`/`@prisma/client@7.10.0` install)
reports 4 high-severity advisories, all transitive: `mysql2` (auth-plugin credential leak,
decompression-bomb DoS) and `deepmerge-ts` (stack exhaustion), both pulled in by
`@prisma/config` inside the `prisma` CLI package's own dependency tree — not by this
project's runtime code (`mysql2` exists for Prisma's optional MySQL support; this project
only ever uses `postgresql`).
**Impact:** Low in practice — `prisma` is a dev-only CLI tool, never bundled into the
deployed Next.js app, and the vulnerable code paths (MySQL auth, `@prisma/config`'s merge
logic under attacker-controlled input) aren't reachable from anything this project actually
runs. Kept open rather than dismissed because `npm audit`/CI dependency scanners will keep
flagging it.
**Priority:** Low
**Possible Fix/Fixes:** `npm audit fix --force` "fixes" it by downgrading `prisma` to
`6.19.3` — rejected, since 7.10.0 was deliberately chosen over npm's `latest` tag
(`8.0.0-rc.13`, a pre-release — see `memory/decision-log.md`) specifically to be current and
stable, and downgrading to 6.x is a step backward on both counts. Real fix is a future
Prisma 7.x patch release (or a stabilized 8.0) that bumps `mysql2`/`deepmerge-ts` — revisit
next time `package.json` dependencies are touched.
**Trigger type:** Task-sequenced
**Sequenced into:** ~~T3.7 (Gated summary request, `docs/tasks/03-diagnostic.md`)~~ —
corrected (session 49, T7.6 follow-up): T3.7 shipped long ago without anyone re-checking
this, since a `Task-sequenced` pointer into an already-shipped epic is never naturally
revisited (see CLAUDE.md's tightened "never sequence into an already-shipped epic" rule and
`memory/decision-log.md`, 2026-09-11 process entry, for the full correction). Reassigned to
**T7.7** (Diagnostic Configuration, `docs/tasks/07-content-admin.md`) — the concrete next
task about to be executed, so this has a real chance of actually being re-checked. See the
session-17 re-check below for why T3.2 itself didn't move this (kept for historical record).

**Re-checked (session 04, 2026-09-05, T1.4):** `npm info prisma version` /
`@prisma/client version` / `@prisma/adapter-pg version` all still report `7.10.0` as latest
stable; npm's `latest` dist-tag for `prisma` is still `8.0.0-rc.13` (a pre-release, unchanged
from T1.2). `npm audit --json` still reports the same 4 high-severity advisories via the same
`mysql2`/`deepmerge-ts` chain, with the same `npm audit fix --force` "fix" (downgrade to
`6.19.3`) still the only automated option — still rejected for the same reason. No action
taken; nothing has changed since T1.2.

**Re-checked (session 17, 2026-09-05, T3.2):** `npm info prisma dist-tags` still shows
`prev: 7.10.0` / `latest: 8.0.0-rc.13` — no stable patch beyond the currently-pinned version
exists yet. `npm audit` (after this task's own dependency installs) still reports the same 4
high-severity advisories via the same `mysql2`/`deepmerge-ts` chain. No action taken;
re-sequenced to T3.7 above rather than left pointing at this now-completed task.

---

## GitHub-connected Railway auto-deploy

**Status:** Resolved
**Date raised:** 2026-09-04
**Date resolved:** 2026-09-04 (same session, after the human pushed `main` to `origin`)
**Reason:** T1.1's "main deploys automatically on push" acceptance criterion needed
`railway service source connect`, which requires `main` to already exist on GitHub — agents
never push directly (CLAUDE.md Git Commit Protocol), so this waited on the human's push.
**Impact:** T1.1's auto-deploy acceptance criterion was not satisfied until resolved.
`railway up` (manual CLI upload) was the fallback deploy path in the meantime.
**Priority:** N/A — resolved
**Possible Fix/Fixes:** `railway service source connect --repo
KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website --branch main`, run once `main` existed on
GitHub.
**Resolution:** Ran successfully; connecting the source triggered an immediate GitHub-sourced
build (deployment `3e469209...`), which reached `SUCCESS`, and the live URL
(https://kaalbert.up.railway.app) was confirmed 200 afterward — end-to-end proof the
push-triggered path works, not just that the connection command succeeded. Kept here (rather
than deleted) as a record that this was verified, not assumed.
**Trigger type:** N/A — resolved
**Sequenced into:** T1.1 (already complete — this closes its last open acceptance criterion
alongside the Cloudflare item below, which remains open)

## Cloudflare not yet fronting kaalbert.com (ADR 0004) — deferred by user choice

**Status:** Open — deliberately deferred, not an oversight
**Date raised:** 2026-09-16 (session 62) — split out from the now-Resolved "kaalbert.com not
registered" entry below once the domain part of that entry was resolved but the
Cloudflare-fronting part of ADR 0004 still wasn't.
**Deferred:** 2026-09-16 (same session) — presented the user with what Cloudflare actually
buys here (edge caching for `docs/vision.md`'s Ghana/3G/mid-range-Android audience, free
DDoS/WAF, one-click HSTS/Always-Use-HTTPS) versus the real migration risk (DKIM/SPF/MX
records must survive the nameserver cutover exactly, or email breaks) and the fact that the
site works correctly today without it. User chose to skip it for now: "Let's skip it for
now, just mark it as deferred." Revisit only if Ghana-based visitors actually report slow
load times, or the user raises it again — not proactively.
**Reason:** `kaalbert.com` is registered and already added/`ACTIVE` as a Railway custom
domain (`railway domain`), serving real traffic with a valid Railway-issued Let's Encrypt
cert — but its nameservers are still the registrar's default (`dns1/dns2.registrar-
servers.com`, i.e. Namecheap), not Cloudflare's. ADR 0004's actual decision — Cloudflare in
front of Railway as CDN/edge — is not yet in place. Real DNS captured this session (via
`dig @1.1.1.1`, since this sandbox's own default resolver returns bogus answers for
non-allowlisted hosts — don't trust plain `dig`/`curl` DNS lookups run from an agent session
without pinning a real resolver): apex `kaalbert.com` → ALIAS/CNAME-flattened to
`qrulko1j.up.railway.app` (A `69.46.46.50`); MX `10 mx.zoho.com` / `20 mx2.zoho.com` /
`50 mx3.zoho.com`; TXT `v=spf1 include:zohomail.com ~all` and
`zoho-verification=zb33664172.zmverify.zoho.com`; DKIM TXT at
`zmail._domainkey.kaalbert.com`. No `www.kaalbert.com` record and no DMARC record exist yet.
**Impact:** No CDN edge-caching, WAF, or edge-level "Always Use HTTPS"/HSTS toggle — the site
works correctly today (TLS via Railway is real and valid), this is a performance/hardening
gap, not a functional one. `docs/tasks/01-foundation.md` T1.1's Cloudflare acceptance
criterion remains open until this is done.
**Priority:** Medium — the ADR 0004 decision this project already made is simply not
implemented yet; no other task depends on it.
**Possible Fix/Fixes:** User-executed (a Cloudflare account + registrar nameserver change,
neither doable from this session) — see the guide given directly to the user in session 62
for the exact steps and the exact DNS records above to re-create in Cloudflare (apex
CNAME-flattened to Railway, all three Zoho MX records, the SPF/Zoho-verification TXT, and
the DKIM TXT — email breaks the moment nameservers cut over if any of these are missed).
Once the Cloudflare zone is active: confirm `railway domain` still shows the custom domain
`ACTIVE` (it should — Railway doesn't care which DNS provider points at it), turn on "Always
Use HTTPS" and HSTS in Cloudflare's dashboard (Section 3, step 7 of
`docs/vendor-operations-guide.md`), and re-run `dig @1.1.1.1` against every record type above
to confirm nothing silently dropped in the cutover.
**Trigger type:** User-triggered — do not treat reaching T1.1 (or any task) as a cue to sign
up for Cloudflare or change nameservers; wait for the user to say the Cloudflare zone is set
up and DNS has cut over.
**Sequenced into:** T1.1 (docs/tasks/01-foundation.md — addendum updated session 62,
2026-09-16)

---

## kaalbert.com registration — Resolved (Cloudflare-fronting split into its own entry above)

**Status:** Resolved
**Date raised:** 2026-09-04
**Date resolved:** 2026-09-16 (session 62) — user registered `kaalbert.com` and added it as
a Railway custom domain (`railway domain` shows it `ACTIVE`, port 8080, alongside the
original `kaalbert.up.railway.app`). Verified live end-to-end this session: `https://
kaalbert.com/` returns 200 with a valid Railway-issued Let's Encrypt cert
(`notAfter=2026-12-14`), and `NEXT_PUBLIC_SITE_URL=https://kaalbert.com` was set on the live
service and confirmed in the rendered page's own `og:image`/canonical tags after the
resulting redeploy completed.
**Reason:** T1.1's acceptance criterion "the live URL resolves through Cloudflare, not
Railway's raw domain" couldn't be met — WHOIS confirmed `kaalbert.com` wasn't registered.
User chose to finish the rest of T1.1 and defer this rather than register a placeholder
domain.
**Impact:** Was blocking T1.1's Cloudflare criterion and meant every canonical/OG/sitemap URL
(`lib/seo.ts`'s `getSiteUrl()` fallback, then `https://www.kaalbert.com`) described a domain
that resolved nowhere — the direct cause of a real bug: a WhatsApp share of the site showed
no preview image, since WhatsApp's crawler couldn't fetch an `og:image` URL on a domain with
no DNS record. See `memory/known-bugs.md`.
**Priority:** N/A — resolved.
**Possible Fix/Fixes:** Domain registration is done. The fallback URL itself also needed a
fix, done the same session: it hardcoded `https://www.kaalbert.com` (`www`), but only apex
`kaalbert.com` was ever added as a Railway custom domain — `www.kaalbert.com` still has no
DNS record today. `lib/seo.ts`'s fallback (and the 4 test files asserting against it) were
updated to apex `kaalbert.com`, and `NEXT_PUBLIC_SITE_URL=https://kaalbert.com` was set
explicitly everywhere (`.env.local`, `.env.production`, the live Railway service) so
production behavior never depends on the fallback matching reality again. Adding
`www.kaalbert.com` as a secondary domain (redirecting to apex) is optional, low-priority
follow-up — see the Cloudflare entry above, since that's the natural point to add it (a
Cloudflare Redirect Rule, free tier).
**Trigger type:** N/A — resolved.
**Sequenced into:** T1.1 (docs/tasks/01-foundation.md — addendum updated session 62,
2026-09-16, closing the domain-registration half; the Cloudflare-fronting half is tracked
separately above since it's still open)
