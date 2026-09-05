# Epic: Public Presentation Layer

Roadmap milestone 2. Every task here builds to its accepted mockup file under
`ui/mockups/a-public-site/` — authoritative, not re-derived. Content is seeded via migration
(real content sourced from Company Docs/mockups; anything without real source content yet is
migrated as clearly flagged placeholder, per standing instruction, never presented as final).
No admin editing screen exists yet for any of this — that's Milestone 7 (`07-content-admin.md`)
— but every page here is fully functional and correct for a visitor from the moment it ships.

---

### T2.1 — Home page

**Build:** `/` route to `ui/mockups/a-public-site/home.html`, reading `home_page_content`
(`docs/features/home-page.md`), including `meta_title`/`meta_description`.
**Input → Output:** Migrated `home_page_content` row → rendered home page matching the
mockup pixel-for-pixel on shared primitives (T1.3/T1.4), with correct meta tags in page
source.
**Acceptance criteria:** Visual diff against the mockup passes; `view-source` shows populated
`<title>` and meta description; all nav links resolve (no 404s to pages built later in this
same epic once the epic completes).
**Size:** M **Dependencies:** T1.5, T2.9 (seed data)

### T2.2 — Core Offer pages (×3)

**Build:** `/offers/[slug]` dynamic route to `ui/mockups/a-public-site/offer-*.html`,
reading the `offer` entity (`docs/features/core-offer-pages.md`) — including the corrected
`fee_amount_min`/`fee_amount_max` band, `who_for`/`who_not_for`, `client_inputs`,
`indicative_timeline`, `deliverables`, `faqs`, `meta_title`/`meta_description` — for all three
real offers.
**Input → Output:** Three migrated `offer` rows → three rendered pages in FR-4.1's fixed
field order, matching their respective mockups.
**Acceptance criteria:** All three offers render with every entity field present and in the
FR-4.1 order; fee band displays as a range, never a single figure; FAQ accordion behaviour
matches the mockup's interaction.
**Size:** L **Dependencies:** T1.5, T2.9

**Addendum (session 07, 2026-09-05):** T2.1 seeded `Offer` with only the fields the home
page's cards need (slug, name, teaser, fee_amount_min/max, scope_cap) — see
`prisma/schema.prisma`'s `Offer` doc-comment. This task adds the rest of
`core-offer-pages.md`'s documented fields (problem_statement, who_for/who_not_for,
method_stages, deliverables, client_inputs, indicative_timeline, out_of_scope_note, faqs,
cta_href, meta_title, meta_description) and must also resolve the Business Health Check
offer's real two-tier (Express/Full) pricing structure, which the current single
fee_amount_min/max/scope_cap shape doesn't represent — see `memory/technical-debt.md` →
"Business Health Check's two-tier pricing has no real data model yet." T2.1 seeded BHC's
fee band as a provisional Express-floor-to-Full-ceiling span (GHS 1,000–6,500); don't treat
that as the real answer.

### T2.3 — Capabilities page

**Build:** `/capabilities` to `ui/mockups/a-public-site/capabilities.html`, reading the
shared `page` entity (hero_kicker/hero_heading/hero_lead/meta_title/meta_description) plus
the 8 `capability` rows (`docs/features/capabilities-page.md`).
**Input → Output:** Migrated `page` row (slug: capabilities) + 8 `capability` rows →
rendered page matching the mockup, 8 service lines in the mockup's defined order.
**Acceptance criteria:** All 8 capabilities render with correct copy sourced from Company
Docs; meta tags populated from the `page` entity.
**Size:** M **Dependencies:** T1.5, T2.9

### T2.4 — Our Method page

**Build:** `/our-method` to `ui/mockups/a-public-site/our-method.html`, reading the shared
`page` entity (including `intro_copy`, unique to this page) plus the `method_stage` rows for
the four-stage method (`docs/features/our-method-page.md`).
**Input → Output:** Migrated `page` row (slug: our-method) + 4 `method_stage` rows → rendered
page matching the mockup.
**Acceptance criteria:** All four stages (Discover, Diagnose, Design, Deliver) render in
order with correct copy; intro copy renders above the stage list per the mockup.
**Size:** M **Dependencies:** T1.5, T2.9

### T2.5 — About / Team page

**Build:** `/about` to its mockup, reading team member records and firm narrative content per
`docs/features` (the relevant team/about feature doc's entity — team bios, roles, photos).
**Input → Output:** Migrated team + about content → rendered page matching the mockup.
**Acceptance criteria:** All partner bios render with photo, name, role, and bio copy sourced
from Company Docs, not placeholder, since this content exists in the source material.
**Size:** M **Dependencies:** T1.5, T2.9

**Addendum (session 07, 2026-09-05):** T2.1's home page has a placeholder card in its
Senior Attention section (no real partner photos/credentials exist yet) — see
`memory/technical-debt.md` → "Home page senior-attention panel has no real partner
photography yet." Once this task sources real partner photos/bios for `/about`, consider
whether the home page's placeholder card should also be updated to show a photo (e.g. a
small partner-headshot strip) instead of the italic note — not required, but worth a look
since the underlying asset gap this task closes is the same one blocking it.

### T2.6 — Contact page

**Build:** `/contact` to its mockup (`docs/features/contact-and-enquiry.md`), reading the
optional `?service=[slug]` param (unrecognised value treated as no parameter, per the
documented edge case) and `site_settings` (phone, WhatsApp, email, address,
`response_time_commitment` — read-only here, edited in Milestone 7); `POST
/api/contact/submit` creates the shared `enquiry_record` (diagnostic-specific fields null,
`service_line` populated from the query param), with contact consent required and separate
from marketing consent (FR-6.2). WhatsApp/phone/email links present alongside the form. This
form's write side has a real consuming counterpart from day one via `enquiry-management.md`'s
shared `enquiry_record` table, even though the admin screen reading it doesn't ship until
Milestone 8.
**Input → Output:** `{name, email, phone?, message, service?, contact_consent}` →
`enquiry_record` row + `{status, enquiry_id}`; fires `enquiry_submitted`.
**Acceptance criteria:** Submission with `contact_consent` unchecked is rejected; an
unrecognised `service` value is stored as no service (general enquiry); the WhatsApp link
carries a pre-filled, context-identifying message; a submitted enquiry is persisted and
visible via direct DB query (admin UI to view it doesn't exist until Milestone 8 — this task
only proves the write side is correct).
**Size:** M **Dependencies:** T1.5, T2.9

### T2.7 — Legal & compliance pages

**Build:** `/legal/[slug]` routes (privacy, terms, cookies, etc.) to
`ui/mockups/a-public-site/legal-*.html`, reading `footer_content`/legal page entities per
`docs/features/legal-and-compliance-pages.md`, all clearly flagged as illustrative pending the
firm's actual legal text, per standing instruction — never presented as final copy.
**Input → Output:** Migrated legal page rows (flagged draft) → rendered pages, linked from
SiteFooter.
**Acceptance criteria:** Every footer legal link resolves; each page carries a visible "draft
— pending legal review" marker until the firm supplies final text (tracked as a known
placeholder in `docs/dashboard.md`, not silently shipped as final).
**Size:** S **Dependencies:** T1.5, T2.9

### T2.8 — SEO foundation

**Build:** `docs/features/seo-and-search-foundation.md` in full: `GET /sitemap.xml`
auto-generated from published content; Organization JSON-LD schema sourced from
`site_settings` (+ new `social_profile_urls`); per-page meta tags wired for every page type
built in this epic.
**Input → Output:** Published content across T2.1–T2.7 → a valid, auto-updating sitemap and
a valid Organization schema block present on every page.
**Acceptance criteria:** Sitemap validates against the sitemap protocol and lists exactly the
pages published so far; Google's Rich Results Test (or equivalent structured-data validator)
accepts the Organization schema with no errors; a missing `meta_description` on any page
falls back to a truncated body excerpt rather than an empty tag.
**Size:** M **Dependencies:** T2.1–T2.7

**Addendum (session 08, 2026-09-05):** `app/favicon.ico`/`app/apple-icon.png` are currently
the firm's "KB" monogram from `Company Docs/Brand assets/`, used as an explicit temporary
stand-in per user instruction — see `memory/technical-debt.md` → "Temporary favicon in use —
pending the firm's confirmed final icon" (`Trigger type: User-triggered`). Do not swap these
files as part of doing this task; only check whether the user has since said the firm
confirmed a final icon, and if not, leave them as-is.

### T2.9 — Content migration/seed scripts

**Build:** Seed scripts (per T1.2's convention) populating every entity introduced in this
epic with real, Company-Docs-sourced content where it exists, and clearly flagged
illustrative placeholder where it doesn't (legal text, any copy not yet supplied by the firm).
**Input → Output:** Company Docs + mockup content → populated database, ready for T2.1–T2.8
to render against.
**Acceptance criteria:** Seed runs cleanly on a fresh database; every non-placeholder field
traces to a specific Company Docs source cited in the seed script's own comments; every
placeholder field is queryable/reportable as such (a `is_placeholder` convention or
equivalent) so Milestone 7's admin UI and `docs/dashboard.md` can both surface what's still
pending real content.
**Size:** L **Dependencies:** T1.2

**Addendum (session 07, 2026-09-05):** T2.1 already did this task's `home_page_content` and
`offer` portions (per T2.1's own dependency note authorizing that), all real content sourced
from `ui/mockups/a-public-site/home.html` and the three `offer-*.html` mockups, `isPlaceholder:
false` throughout — see `prisma/seed.ts`'s `seedHomePageContent`/`seedOffers` and
`memory/completed-work.md`. Only the `offer` fields T2.1 actually needed were seeded (see
T2.2's own addendum above); this task still owes the remaining `offer` fields plus every
other entity this epic introduces (capability, page, method_stage, team/about content,
legal pages, etc.).
