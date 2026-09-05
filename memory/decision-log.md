# Decision Log

Newest entry at the top — see CLAUDE.md's "Memory file format and ordering" section.

## 2026-09-05 (T2.4) — `MethodStage.whatHappens` added beyond the feature doc's original field list; intro-copy paragraph seeded as plain text without its mockup's inline offer links

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

T1.1 implementation decisions, made while scaffolding the repo/app/deploy pipeline.

**Summary:**

- **Repo root confirmed as `Website Build/`**, not its parent folder — the sibling
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
