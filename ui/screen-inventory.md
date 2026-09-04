# Screen Inventory — kaalbert.com

Every distinct screen implied by `SM/2026-09` (Sitemap), the 22 feature specs in
`docs/features/`, and `ui/components.md`. Grouped by area, in the rough order a build would
reach them. Used to decide mockup priority in Phase 5.

## A. Public marketing site — Phase 1

1. Home (`/`)
2. Core Offer Page — Business Health Check (`/offers/business-health-check`)
3. Core Offer Page — Financial Clarity Pack (`/offers/financial-clarity-pack`)
4. Core Offer Page — Funding-Readiness Pack (`/offers/funding-readiness-pack`)
5. Capabilities (`/capabilities`)
6. Our Method (`/our-method`)
7. About and the Partners (`/about`)
8. Contact (`/contact`)

(2–4 share one template — `core-offer-pages.md` — so this is one screen design, three
content instances.)

## B. Insights — Phase 1

9. Insights Index (`/insights`)
10. Insights Article template (`/insights/[slug]`)

## C. Business Health Check diagnostic — Phase 1

11. Diagnostic — question flow (`/diagnostic`)
12. Diagnostic — results (`/diagnostic/results`)
13. Diagnostic — summary-request step (a state within the results screen, not a separate
    page — see `SM/2026-09`, Section 4)

## D. Landing pages — Phase 1

14. Landing page template, instance: Business Health Check (`/lp/business-health-check`)
15. Landing page template, instance: Funding-Readiness Checklist
    (`/lp/funding-readiness-checklist`)
16. Landing page template, instance: Financial Clarity Pack
    (`/lp/financial-clarity-pack`)

(One template — `landing-page-template.md` — three content instances.)

## E. Legal and compliance — Phase 1

17. Privacy Notice (`/legal/privacy-notice`)
18. Cookie Notice (`/legal/cookie-notice`)
19. Terms of Use (`/legal/terms-of-use`)
20. Scope of Practice (`/legal/scope-of-practice`)

(One template — `legal-and-compliance-pages.md` — four content instances.)

## F. Admin — authentication — Phase 1

21. Admin login
22. Admin TOTP verification (2FA challenge)
23. Admin 2FA setup (QR code + confirmation + backup codes)
24. Admin account recovery (backup code entry)

## G. Admin — content management — Phase 1

25. Admin dashboard / home (landing screen after login)
26. Articles list
27. Article editor (create/edit, rich-text)
28. Pages list
29. Page editor
30. Offers list
31. Offer editor (structured fee band field)
32. Landing pages list
33. Landing page editor / create-from-template
    33a. Team list
    33b. Partner profile editor (photo, practice area, credentials, personal statement)
    33c. Diagnostic questions list (order, active flag, dimension)
    33d. Diagnostic configuration editor (dimension weights, triage thresholds)
    33e. Site Settings (singleton form: phone, WhatsApp, email, address, response-time commitment)
    33f. Categories list (inline create/rename/retire — name + slug only, no separate editor screen)

## H. Admin — enquiry management — Phase 1

34. Enquiries list
35. Enquiry detail panel
    35a. Subscribers list (Insights subscription capture route — Document 13.03, Section 6's
    second secondary capture route, previously undocumented anywhere; insights-engine.md)

## I. Admin — bonus: platform performance dashboards (built after launch, never blocking)

36. Performance overview (four platform cards)
37. Performance — GA4
38. Performance — Meta
39. Performance — Google Ads
40. Performance — LinkedIn

## J. Client Portal — Phase 2, gated (P2-3)

41. Portal login
42. Portal TOTP verification
43. Portal forgot-password
44. Engagement overview (method-stage tracker)
45. Information requests checklist
46. Document exchange (upload/download)
47. Deliverables tracker
48. Messages (thread view)
49. Account settings (profile, notification preferences, password change)
50. Team management (invite/remove portal users)
    50a. Admin — Engagement editor (create the engagement, assign partner(s), seed the
    deliverables tracker from the sold offer — client-portal-and-document-exchange.md's
    admin-side fix; nothing else in this section has an engagement to attach to without it)
    50b. Admin — Information requests editor (per engagement)
    50c. Admin — Portal users management (the firm's own path to inviting/removing portal users,
    alongside the primary contact's own #50)

## K. Booking and scheduling — Phase 2, gated (P2-1)

51. Slot picker / availability
52. Booking confirmation
    52a. Admin — Partner availability editor (each partner manages their own `booking_slot` rows
    directly — booking-and-scheduling.md's admin-side fix)
    52b. Admin — Bookings list

## L. Case studies — Phase 2, gated (P2-2)

53. Case Studies index
54. Case study template
    54a. Admin — Case study editor (case-studies-and-testimonials.md's admin-side fix — the
    Articles editor pattern plus the consent-on-file field that gates publication)

## M. Online payment — Phase 2, gated (P2-4)

55. Checkout (Mobile Money / card selector)
56. Payment confirmation / receipt
    56a. Admin — Payments list (read-only against the gateway-verified status —
    online-payment.md's admin-side fix)

## N. Training registration — Phase 2, gated (P2-5)

57. Training session page (a landing-page-template variant with a registration form)
58. Registration confirmation / waitlist status
    58a. Admin — Training session editor (create/edit a `training_session` from the Landing
    Pages content area — training-registration.md's admin-side fix; no new content type)

## O. CRM integration — Phase 2, gated (P2-6)

59. Admin — CRM sync status view

## P. Paid diagnostic suite — Phase 2, gated (P2-7)

60. Purchase / offer screen
61. Full question flow (`/diagnostic/full`)
62. Full report

---

**77 screens total** (counting template+instance groups as one design each): 20 Phase 1
public-facing/legal screens, 22 Phase 1 admin screens, 5 bonus dashboard screens, 30 Phase 2
gated screens across seven capabilities. (33a–33f — Team list, Partner profile editor,
Diagnostic questions list, Diagnostic configuration editor, Site Settings, Categories list —
were added after the initial count, as the admin-side fix for a full audit of hardcoded
content that should be admin-editable: the `author` entity, the diagnostic's
questions/weights/thresholds, site-wide contact details, and Insights categories. See
`content-management-admin.md`. 35a and 50a–58a were added by a second audit, run before
Phase 6 task planning, that checked every screen has a consuming backend and every backend
has a consuming screen — 35a closes the Insights-subscription gap; 50a–58a close a systemic
gap where every Phase 2 client-facing feature had data with no admin screen able to create
it. See each capability's own feature doc for the specific fix.)

---

# Mockup Priority: Needs a Mockup vs. Can Be Inferred

The same 77 screens, split by whether the layout is genuinely new or is a content/data
variant of a pattern another screen already establishes. "Can be inferred" always names the
screen it infers from — none are guesswork, each is a specific reuse.

## Needs a real mockup (25)

| #   | Screen                                    | Why it's genuinely new                                                                                                                   |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Home                                      | Unique layout: hero, 3-card grid, method graphic, Insights teaser, diagnostic CTA — no other screen combines these blocks                |
| 2   | Core Offer Page (template)                | The ten-section structure (FR-4.1) is unlike any other template                                                                          |
| 5   | Capabilities                              | Eight-card grid routing to a parameterised enquiry — distinct from the offer-card grid on Home                                           |
| 6   | Our Method                                | Four-stage in-depth layout with a capability-transfer callout — the firm's own "strongest differentiator" page                           |
| 7   | About and Partners                        | Partner bio card grid with credentials/photo layout, unlike an article or offer card                                                     |
| 8   | Contact                                   | First form-plus-multi-channel-contact layout in the site                                                                                 |
| 9   | Insights Index                            | Grid + category filter + search — a distinct browsing pattern                                                                            |
| 10  | Insights Article                          | Rich content template: tables, pull quotes, figures, author byline                                                                       |
| 11  | Diagnostic — question flow                | The most complex screen in the project; no-reload multi-step interaction                                                                 |
| 12  | Diagnostic — results                      | Score display with dimension breakdown — a unique data-visualisation layout                                                              |
| 14  | Landing Page (template)                   | No-nav, single-message-single-CTA shape, structurally distinct from every other page                                                     |
| 21  | Admin login                               | First admin screen; establishes the authenticated-area visual language                                                                   |
| 23  | Admin 2FA setup                           | QR code + backup codes — a genuinely distinct element, not reusable from login                                                           |
| 25  | Admin dashboard / shell                   | Establishes the sidebar-plus-content-area shell every other admin screen inherits                                                        |
| 26  | Articles list                             | Establishes the `AdminDataTable` pattern with filters/sort                                                                               |
| 27  | Article editor                            | Rich-text editor + required preview image — the most complex admin form                                                                  |
| 31  | Offer editor                              | The `StructuredFeeFieldEditor` compound control appears nowhere else                                                                     |
| 33d | Diagnostic configuration editor           | Per-dimension weight and threshold editing across a variable question set — a compound control with no equivalent elsewhere in the admin |
| 35  | Enquiry detail panel                      | Dense, unique layout: full responses, score, triage flag, attribution, notes together                                                    |
| 36  | Performance overview (bonus)              | Four-card connection-state grid, a new pattern                                                                                           |
| 37  | Performance — GA4 (bonus, representative) | Establishes the per-platform detail layout; Meta/Ads/LinkedIn reuse it                                                                   |
| 44  | Engagement overview (Phase 2)             | Method-stage tracker visual — new to the project                                                                                         |
| 45  | Information requests checklist (Phase 2)  | Checklist-with-per-item-upload is a new interaction shape                                                                                |
| 48  | Messages / thread view (Phase 2)          | Chat-thread UI, structurally unlike anything else in the project                                                                         |
| 51  | Booking slot picker (Phase 2)             | Calendar/availability selection is a new pattern                                                                                         |
| 55  | Payment checkout (Phase 2)                | Mobile Money / card selector — high-stakes, first-of-its-kind flow                                                                       |

## Can be inferred (52)

| #          | Screen                                                         | Inferred from                                                                                                               |
| ---------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 35a        | Subscribers list                                               | #26 (`AdminDataTable` pattern)                                                                                              |
| 50a        | Admin — Engagement editor (Phase 2)                            | #31's form pattern (Offer editor) — client reference, offer selection, partner assignment                                   |
| 50b        | Admin — Information requests editor (Phase 2)                  | #31's list-editor sub-pattern (the same one used for Offer editor's deliverables list)                                      |
| 50c        | Admin — Portal users management (Phase 2)                      | #26 (`AdminDataTable`) plus a simple invite form, same shape as #50's own client-facing team management                     |
| 52a        | Admin — Partner availability editor (Phase 2)                  | #26 (`AdminDataTable`) plus an add-row pattern, same shape as #33c's diagnostic questions list                              |
| 52b        | Admin — Bookings list (Phase 2)                                | #26 (`AdminDataTable`)                                                                                                      |
| 54a        | Admin — Case study editor (Phase 2)                            | #27 (Article editor) — case-studies-and-testimonials.md is explicit this reuses it directly, plus the consent-on-file field |
| 56a        | Admin — Payments list (Phase 2)                                | #26 (`AdminDataTable`), read-only                                                                                           |
| 58a        | Admin — Training session editor (Phase 2)                      | #33 (Landing page editor) — a training session is structurally a landing page instance                                      |
| 33a        | Team list                                                      | #26 (`AdminDataTable` pattern)                                                                                              |
| 33b        | Partner profile editor                                         | #29's simple-field form pattern + #27's required-image-upload control — no new visual pattern, just that combination        |
| 33c        | Diagnostic questions list                                      | #26 (`AdminDataTable` pattern, with reorder)                                                                                |
| 33e        | Site Settings                                                  | #29's simple-field form pattern, singleton (no list view needed)                                                            |
| 33f        | Categories list                                                | #26 (`AdminDataTable` pattern), two fields inline-editable per row — no separate editor screen needed                       |
| 3, 4       | Core Offer — Financial Clarity Pack, Funding-Readiness Pack    | #2 (same template, different content)                                                                                       |
| 13         | Diagnostic — summary-request step                              | #12 (an inline state on the results screen, not a separate layout)                                                          |
| 15, 16     | Landing Page — Checklist, Financial Clarity Pack instances     | #14 (same template, different content)                                                                                      |
| 17–20      | Privacy Notice, Cookie Notice, Terms of Use, Scope of Practice | #10's `RichTextRenderer`, simplified — header + body text only, no author/category                                          |
| 22         | Admin TOTP verification                                        | #21 (same centred-card shape, different input)                                                                              |
| 24         | Admin account recovery                                         | #22 (same shape, backup-code input instead of TOTP)                                                                         |
| 28, 30, 32 | Pages list, Offers list, Landing pages list                    | #26 (`AdminDataTable` pattern)                                                                                              |
| 29         | Page editor                                                    | #27, simplified (no category/author fields)                                                                                 |
| 33         | Landing page editor                                            | #29's form pattern, with the headline/opening-paragraph fields from `landing-page-template.md`                              |
| 34         | Enquiries list                                                 | #26 (`AdminDataTable`), with the `TriageBadge` variant                                                                      |
| 38, 39, 40 | Performance — Meta, Google Ads, LinkedIn (bonus)               | #37                                                                                                                         |
| 41, 42     | Portal login, Portal TOTP                                      | #21, #22 (same auth shell, client-facing copy)                                                                              |
| 43         | Portal forgot-password                                         | Standard form pattern already established by #8/#21                                                                         |
| 46         | Document exchange (Phase 2)                                    | #26's list pattern, file-row variant                                                                                        |
| 47         | Deliverables tracker (Phase 2)                                 | #45's checklist pattern, status badges instead of uploads                                                                   |
| 49         | Account settings (Phase 2)                                     | Standard form pattern (#8/#21 shape)                                                                                        |
| 50         | Team management (Phase 2)                                      | #26's list pattern plus a simple invite form                                                                                |
| 52         | Booking confirmation (Phase 2)                                 | Standard confirmation-screen shape (reused at #56, #58)                                                                     |
| 53         | Case Studies index (Phase 2)                                   | #9 (same index/grid pattern)                                                                                                |
| 54         | Case study template (Phase 2)                                  | #10, with the consent-gated name/logo variant already specified in `case-studies-and-testimonials.md`                       |
| 56         | Payment confirmation (Phase 2)                                 | Standard confirmation-screen shape                                                                                          |
| 57         | Training session page (Phase 2)                                | #14 (landing page template), registration form swapped in                                                                   |
| 58         | Registration confirmation / waitlist (Phase 2)                 | Standard confirmation shape, with a waitlisted-state variant                                                                |
| 59         | CRM sync status view (Phase 2)                                 | #26 (`AdminDataTable`), status-list variant                                                                                 |
| 60         | Paid diagnostic — purchase screen (Phase 2)                    | #2 (offer page) + #55 (checkout), combined                                                                                  |
| 61         | Paid diagnostic — full question flow (Phase 2)                 | #11 — literally the same component, reconfigured (ADR 0005)                                                                 |
| 62         | Paid diagnostic — full report (Phase 2)                        | #12's `ScoreDisplay`, extended (ADR 0005)                                                                                   |
