# Component Inventory — kaalbert.com

Two layers, per `docs/adr/0010-styling-and-component-stack.md`: a **foundation layer** of
shadcn/ui primitives (generated on Base UI, restyled to `design-system.md`'s tokens), and a
**composite layer** of hand-built components specific to this project, each composing one or
more foundation primitives. The composite layer is what the planning framework's "component
inventory" format below describes; the foundation layer is listed first for reference since
almost every composite component depends on it.

## Foundation layer — shadcn/ui primitives (on Base UI)

Generated via the shadcn CLI, never left in generic default styling: Button, Input, Textarea,
Select, Checkbox, RadioGroup, Switch, Card, Dialog, AlertDialog, Accordion, Tabs, Badge,
Table, Avatar, Tooltip, DropdownMenu, Popover, Progress, Separator, Sonner (toast), Form
(field wrapper + validation display). Each is restyled at generation time to the tokens in
`design-system.md` — no component ships in shadcn's default appearance.

## Composite components — Phase 1 (shared / global)

| Component             | Variants                                                             | Props / states                                                                                                                                                                                         | Used by                                                                                                                        |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `SiteHeader`          | full-nav (default), no-nav (landing)                                 | current path (for active-link state); Core Offers dropdown reads each offer's live `fee_amount_min` for its "From GHS..." fee-hint text (`content-management-admin.md`) — not a separately-edited copy | Every Phase 1 page feature except `landing-page-template.md`                                                                   |
| `SiteFooter`          | full (legal links + scope statement), landing (scope statement only) | reads `site_settings` for phone/email/address (`content-management-admin.md`)                                                                                                                          | Every page; `landing-page-template.md`; `legal-and-compliance-pages.md`                                                        |
| `ScopeOfPracticeNote` | —                                                                    | sourced from one shared content field (FR-5.1)                                                                                                                                                         | Embedded in `SiteFooter`; `legal-and-compliance-pages.md`                                                                      |
| `PrimaryCta`          | button, link                                                         | label, href                                                                                                                                                                                            | `home-page.md`; `core-offer-pages.md`; `landing-page-template.md`                                                              |
| `OfferCard`           | —                                                                    | offer name, problem snippet, href                                                                                                                                                                      | `home-page.md`                                                                                                                 |
| `CapabilityCard`      | —                                                                    | name, short_description, service slug                                                                                                                                                                  | `capabilities-page.md`                                                                                                         |
| `MethodGraphic`       | compact (Home), full (Our Method)                                    | 4 stages                                                                                                                                                                                               | `home-page.md`; `our-method-page.md`                                                                                           |
| `ArticleCard`         | index grid, featured (Home)                                          | title, excerpt, author, category, preview_image                                                                                                                                                        | `insights-engine.md`; `home-page.md`                                                                                           |
| `RichTextRenderer`    | —                                                                    | CMS rich content (tables, pull-quotes, figures, resource links)                                                                                                                                        | `insights-engine.md`; `our-method-page.md`; `legal-and-compliance-pages.md`; `case-studies-and-testimonials.md`                |
| `FeeBandDisplay`      | —                                                                    | amount, currency, scope_cap (always paired, FR-4.1)                                                                                                                                                    | `core-offer-pages.md`                                                                                                          |
| `FaqAccordion`        | built on shadcn `Accordion`                                          | list of Q&A                                                                                                                                                                                            | `core-offer-pages.md`                                                                                                          |
| `PartnerBioCard`      | full (About), compact (article byline)                               | photo, name, practice_area, credentials, statement                                                                                                                                                     | `about-and-partners-page.md`; `insights-engine.md`                                                                             |
| `WhatsAppLinkButton`  | —                                                                    | pre-filled message, originating-page context; fires tracked click event                                                                                                                                | `contact-and-enquiry.md`; `core-offer-pages.md`; `landing-page-template.md`; instrumented per `measurement-and-attribution.md` |
| `CookieConsentBanner` | pending, accepted, declined                                          | consent-mode signal passthrough                                                                                                                                                                        | Site-wide; `measurement-and-attribution.md`                                                                                    |
| `ConsentFieldPair`    | —                                                                    | two distinct checkboxes: contact consent, marketing consent — never merged (FR-6.2)                                                                                                                    | `business-health-check-diagnostic.md`; `contact-and-enquiry.md`                                                                |

## Composite components — the diagnostic

| Component                     | Variants                                            | Props / states                                       | Used by                                                                                  |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DiagnosticStepRenderer`      | scale input, boolean input, choice input            | current question, current answer, onNext             | `business-health-check-diagnostic.md`                                                    |
| `DiagnosticProgressIndicator` | —                                                   | current step, total steps                            | `business-health-check-diagnostic.md`                                                    |
| `ScoreDisplay`                | free (4–5 dimensions), full (paid, more dimensions) | overall score, dimension scores, weakest dimensions  | `business-health-check-diagnostic.md`; reused by `paid-diagnostic-suite.md` per ADR 0005 |
| `SummaryRequestForm`          | —                                                   | enquiry_id; composes `ConsentFieldPair`              | `business-health-check-diagnostic.md`                                                    |
| `DisclaimerNotice`            | —                                                   | fixed Section 8.2 content, not editable per-instance | `business-health-check-diagnostic.md`                                                    |

## Composite components — admin

| Component                  | Variants                                       | Props / states                                                                                         | Used by                                                                                         |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `AdminSidebarNav`          | content-admin, enquiries, performance (bonus)  | active section                                                                                         | `content-management-admin.md`; `enquiry-management.md`; `platform-performance-dashboards.md`    |
| `AdminDataTable`           | built on shadcn `Table`                        | columns, rows, filters, sort                                                                           | `content-management-admin.md`; `enquiry-management.md`; `crm-integration.md` (sync-status view) |
| `RichTextEditor`           | —                                              | TipTap wrapper; initial content, onChange                                                              | `content-management-admin.md`                                                                   |
| `PreviewImagePicker`       | required-before-publish (enforced)             | current image, onChange                                                                                | `content-management-admin.md`; `insights-engine.md`                                             |
| `StructuredFeeFieldEditor` | —                                              | fee_amount_min + fee_amount_max + currency + scope_cap as one linked control, never savable separately | `content-management-admin.md`; `core-offer-pages.md`                                            |
| `TotpSetupPanel`           | —                                              | QR code, confirmation input, backup codes (shown once)                                                 | `admin-authentication.md`                                                                       |
| `TotpVerifyInput`          | login, recovery (backup code)                  | 6-digit code / backup code entry                                                                       | `admin-authentication.md`; reused by client portal auth per ADR 0009                            |
| `EnquiryDetailPanel`       | diagnostic-originated, contact-form-originated | full response set (if any), score (if any), triage flag, attribution, status, notes                    | `enquiry-management.md`                                                                         |
| `TriageBadge`              | high, medium, low                              | —                                                                                                      | `enquiry-management.md`                                                                         |

## Composite components — bonus (platform performance dashboards)

| Component                | Variants                                          | Props / states                                 | Used by                              |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `PlatformConnectionCard` | not-connected, connected-healthy, connected-error | platform name, last_synced_at, headline metric | `platform-performance-dashboards.md` |

## Composite components — Phase 2 (gated, planned now)

| Component                         | Variants               | Props / states                                                             | Used by                                  |
| --------------------------------- | ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| `BookingSlotPicker`               | —                      | available slots, selected slot                                             | `booking-and-scheduling.md`              |
| `CaseStudyCard`                   | —                      | variant of `ArticleCard`'s pattern; client name/logo shown only if consent | `case-studies-and-testimonials.md`       |
| `ClientPortalSidebar`             | —                      | variant of `AdminSidebarNav`'s pattern, client-facing                      | `client-portal-and-document-exchange.md` |
| `InformationRequestChecklistItem` | outstanding, fulfilled | item name, due_date, linked document                                       | `client-portal-and-document-exchange.md` |
| `DeliverableStatusItem`           | pending, delivered     | deliverable name, linked document                                          | `client-portal-and-document-exchange.md` |
| `MessageThread` / `MessageBubble` | sent, received         | body, sender, sent_at                                                      | `client-portal-and-document-exchange.md` |
| `TeamMemberRow`                   | primary, member        | invite/remove actions (primary-only)                                       | `client-portal-and-document-exchange.md` |
| `PaymentMethodSelector`           | Mobile Money, card     | selected method                                                            | `online-payment.md`                      |
| `TrainingSessionCard`             | —                      | date, time, capacity, fee                                                  | `training-registration.md`               |
| `WaitlistStatusBadge`             | confirmed, waitlisted  | —                                                                          | `training-registration.md`               |

## A note on reuse

Several components appear in more than one feature by design, not by accident: `ScoreDisplay`
is built once and reconfigured for the paid tier (ADR 0005); `TotpVerifyInput` is built once
for admin auth and extended to the client portal (ADR 0009); `ArticleCard`'s pattern seeds
`CaseStudyCard`; `AdminSidebarNav`'s pattern seeds `ClientPortalSidebar`. This mirrors the
same principle already applied at the architecture level throughout this project: build the
generic version once, reuse it when a gated Phase 2 capability is triggered, rather than
building a parallel one-off.
