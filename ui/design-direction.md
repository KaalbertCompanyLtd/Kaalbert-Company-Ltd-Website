# Design Direction — kaalbert.com

## Tech stack this direction is written for

Tailwind CSS v4 (CSS-first, no config file), shadcn/ui on Base UI, Lucide icons — locked in
`docs/adr/0010-styling-and-component-stack.md`. Design tokens below are declared under a
single `@theme` block, not a `tailwind.config.ts` file.

## A note on source authority

The two firm brand documents specify slightly different hex values for a similar-looking
palette (09.01 Brand and Visual Identity Guidelines: "Kaalbert Green #12382A," "Gold
#AF8A4C"; 09.02 Brand Colour Story: "Pine Green #0E2A22," "Antique Brass #8C6E33"). Document
13.03, Section 12, resolves this directly for the website: "The site is built to 09.01 Brand
and Visual Identity Guidelines and the palette at 09.02." So **09.02's exact values govern
colour**, and **09.01 governs everything it uniquely specifies** — typography and voice —
since it is the only document that names typefaces at all. Both are followed in full; they
simply govern different things.

## Visual style

**Premium, editorial, restrained.** Not minimal in the sparse-startup sense, and not
corporate in the generic-navy-blue sense — Document 13.03's own premise rejects both: "Most
professional services websites are brochures... generic navy blue... is also forgettable."
The style is closer to a well-run private bank's or a top-tier law firm's client-facing
materials: dense with real content, typographically confident, built on structure and
whitespace rather than imagery. This follows directly from 09.01's stated brand personality
("serious, disciplined, intelligent and trustworthy — premium in standard, accessible in
manner") and Document 13.03, Section 12's instruction that "typography carries the design"
and that "any proposal to introduce additional colours, gradients or decorative effects
requires approval, and the default answer is no."

## Personality

**Confident, evidence-led, unhurried.** Drawn directly from 09.01: "confident without
arrogance; clear without being simplistic; mature, calm and evidence-led." The site should
never feel like it's trying to close a sale in one screen — it should feel like it has
nothing to hide and no need to rush the reader.

## Typography direction

**Display: Georgia. Body: Calibri.** Fixed by 09.01, Section 5 — "No other typefaces are
used." The pairing itself does real work: Georgia's serif gravity on headlines and the
wordmark gives the firm an editorial, considered weight — the same "leather-bound study"
quality 09.02 describes the colour palette reaching for — while Calibri's clean humanist
sans keeps body copy, forms, and the diagnostic legible and unmistakably modern, so the site
never reads as a printed brochure scanned onto a screen.

**Fallback stack, per 09.01's own explicit allowance** ("fall back to a standard serif such
as Times New Roman, and a standard sans such as Arial"): `Georgia, "Times New Roman", serif`
for display, `Calibri, Arial, sans-serif` for body.

**A deliberate performance synergy, not just a brand rule**: both Georgia and Calibri/Arial
are system fonts already present on essentially every device — no web font file is
downloaded at all. This directly serves NFR-1's page-weight and LCP budget on 3G/mid-range
Android; the brand's own typographic restraint and the site's performance requirement pull
in the same direction rather than trading off against each other, echoing the same point
already made about the palette in Document 13.03, Section 12.

## Color system

Primary: **Pine Green #0E2A22** — identity colour, dark grounds, footers.
Secondary: **Pine 700 #1C4234** — panels, hover states.
Accent: **Antique Brass #8C6E33** — flat, no metallic gradient, used sparingly (a rule, an
underline, an icon, one emphasised word — never a surface).
Neutral surface: **Ivory #FCFAF5** — the page background.
Neutral text: **Ink #121317**.

Full extended palette, roles, and usage rules are in `design-system.md`. The core discipline,
carried directly from 09.02: "pine carries identity and gravity, brass grants emphasis and
warmth, ivory and ink carry everything else. Nothing competes; each colour has one job."

## Component and icon direction

shadcn/ui components (on Base UI) are used as the base for every interactive element —
buttons, form fields, dialogs, accordions, tabs — restyled to the palette and type scale
above rather than left in a generic default look, consistent with the same restraint
principle: components should read as this firm's, not as an unstyled component library with
colours swapped in. Icons are Lucide, used sparingly and functionally (a chevron on an
accordion, a checkmark on a completed diagnostic step) — never decoratively, and never as a
substitute for the real content and evidence Document 13.03 says should carry the page.

## Motion philosophy

**Subtle, functional only — never decorative.** Motion is used to make an interaction
legible (a smooth step transition in the diagnostic, a gentle hover state on a card, a
result score animating in on `/diagnostic/results` so it reads as revealed rather than just
appearing), never as ornament. This follows the same restraint principle governing colour and
imagery: "any proposal to introduce additional... decorative effects requires approval, and
the default answer is no" applies to motion exactly as it applies to gradients. It also
protects the performance budget — animation-heavy interfaces tend to ship more JavaScript and
cost more on a 3G connection than the value they add here justifies.

## References or inspiration direction

Not a moodboard of specific products, but a description of the register: the calm authority
of a private bank's client onboarding materials, or a senior law firm's site — pages that
feel dense with real, specific content rather than marketing copy, that use typographic
hierarchy and generous whitespace to guide the eye instead of icons and illustration, and
that are almost entirely free of stock photography or decorative flourish. Document 13.03,
Section 4, states this directly as a deliberate exclusion: real partner photography, the
firm's own diagrams, and disciplined typographic layout replace "stock photography of generic
office scenes." The reference point is a firm that has nothing to prove with decoration
because the content itself is doing the work.
