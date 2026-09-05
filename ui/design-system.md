# Design System — kaalbert.com

Implemented as Tailwind CSS v4 CSS-first tokens in the application's global stylesheet — no
`tailwind.config.ts` file, per `docs/adr/0010-styling-and-component-stack.md`. Structured in
two layers, matching shadcn/ui's actual v4 convention (verified against shadcn's own docs):
raw semantic variables under `:root`, then an `@theme inline` block exposing them to
Tailwind as utilities (`bg-primary`, `text-foreground`, etc.) — the exact set of variable
names shadcn's generated components reference in their class strings, not an arbitrary token
set of our own naming.

## Full brand color palette (reference)

| Name          | Hex       | Role                                                |
| ------------- | --------- | --------------------------------------------------- |
| Pine Green    | `#0E2A22` | Primary brand — dark grounds, footers, identity     |
| Pine 700      | `#1C4234` | Secondary pine — panels, hover states               |
| Pine 500      | `#356B55` | Mid pine — charts, supporting fills                 |
| Antique Brass | `#8C6E33` | Accent — rules, emphasis, icons (flat, no gradient) |
| Brass 500     | `#A9853F` | Core accent tone                                    |
| Brass 300     | `#CBB074` | Light brass — on dark grounds                       |
| Ink           | `#121317` | Primary text, wordmark black                        |
| Ink 600       | `#3C414A` | Secondary text, captions                            |
| Ivory         | `#FCFAF5` | Page surface — warm paper                           |
| Paper         | `#FFFFFF` | Cards, raised surfaces                              |
| Rule          | `#C9C1AE` | Hairlines and borders (09.01)                       |

Source: 09.02 Brand Colour Story (authoritative for colour, per `design-direction.md`'s note
on source authority), plus Rule from 09.01 for hairlines/borders specifically, since 09.02
doesn't define one. No colour outside this table is introduced without firm approval,
default answer no (Document 13.03, Section 12) — including the one necessary exception noted
below (`--destructive`).

## Mapping the brand palette onto shadcn's semantic variables

shadcn/ui components don't reference "Pine Green" or "Antique Brass" directly — they
reference a fixed semantic set (`--primary`, `--background`, `--card`, `--border`, `--ring`,
etc., each usually paired with a `-foreground` variant for text/icons on that surface). Every
brand colour above is mapped onto that set below, so components render in Kaalbert's actual
palette out of the box rather than a generic default.

**Hex, not OKLCH, deliberately.** shadcn's own current guidance recommends OKLCH for new,
generated themes because it produces more perceptually uniform scales. That reasoning
doesn't apply here: Document 13.03 and 09.02 specify _exact_ hex values as the brand's fixed
identity, and a manual hex-to-OKLCH conversion risks a small, hard-to-verify drift from those
exact values. Tailwind v4 and shadcn's `@theme inline` mapping work identically with hex —
OKLCH is a recommendation for perceptual uniformity when generating a palette from scratch,
not a requirement, and exact fidelity to an already-fixed brand palette matters more here
than perceptual-uniformity gains.

| Semantic variable              | Value     | Brand source / reasoning                                                                                                                                                                                                                                                                                                |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--background`                 | `#FCFAF5` | Ivory — the page surface                                                                                                                                                                                                                                                                                                |
| `--foreground`                 | `#121317` | Ink — primary text                                                                                                                                                                                                                                                                                                      |
| `--card`                       | `#FFFFFF` | Paper — "cards, raised surfaces" per 09.02                                                                                                                                                                                                                                                                              |
| `--card-foreground`            | `#121317` | Ink                                                                                                                                                                                                                                                                                                                     |
| `--popover`                    | `#FFFFFF` | Paper                                                                                                                                                                                                                                                                                                                   |
| `--popover-foreground`         | `#121317` | Ink                                                                                                                                                                                                                                                                                                                     |
| `--primary`                    | `#0E2A22` | Pine Green — the identity colour, primary buttons/CTAs                                                                                                                                                                                                                                                                  |
| `--primary-foreground`         | `#FCFAF5` | Ivory — light text on pine, matches 09.01's wordmark rule ("cream or white on green")                                                                                                                                                                                                                                   |
| `--secondary`                  | `#EEF2F0` | A pale pine-tinted neutral — the one constructed tone not literally listed in either brand document, built at very low saturation/high lightness within the pine hue family for a quiet secondary-button surface, never used as a competing brand colour                                                                |
| `--secondary-foreground`       | `#121317` | Ink                                                                                                                                                                                                                                                                                                                     |
| `--muted`                      | `#F4F1E8` | A light warm neutral (already used as row-shading in this project's other documents) for muted/quiet sections                                                                                                                                                                                                           |
| `--muted-foreground`           | `#3C414A` | Ink 600 — "secondary text, captions" per 09.02, an exact existing role                                                                                                                                                                                                                                                  |
| `--accent`                     | `#8C6E33` | Antique Brass — an exact semantic match, the brand's own "accent" colour                                                                                                                                                                                                                                                |
| `--accent-foreground`          | `#FCFAF5` | Ivory — better contrast on mid-tone brass than dark ink                                                                                                                                                                                                                                                                 |
| `--destructive`                | `#B3261E` | **The one colour outside the brand palette.** Needed for genuine error/destructive-action states (form validation, delete confirmations) that neither brand document addresses. Used minimally and only functionally, never decoratively — consistent with the restraint principle governing every other colour choice. |
| `--border`                     | `#C9C1AE` | Rule (09.01) — the brand's own designated hairline/border colour                                                                                                                                                                                                                                                        |
| `--input`                      | `#C9C1AE` | Rule, same as border                                                                                                                                                                                                                                                                                                    |
| `--ring`                       | `#A9853F` | Brass 500 — a visible focus-ring colour, reinforcing "brass = emphasis" including keyboard-focus emphasis, directly serving WCAG 2.1 AA focus visibility                                                                                                                                                                |
| `--chart-1`                    | `#0E2A22` | Pine Green                                                                                                                                                                                                                                                                                                              |
| `--chart-2`                    | `#356B55` | Pine 500                                                                                                                                                                                                                                                                                                                |
| `--chart-3`                    | `#8C6E33` | Antique Brass                                                                                                                                                                                                                                                                                                           |
| `--chart-4`                    | `#A9853F` | Brass 500                                                                                                                                                                                                                                                                                                               |
| `--chart-5`                    | `#CBB074` | Brass 300                                                                                                                                                                                                                                                                                                               |
| `--sidebar`                    | `#0E2A22` | Pine Green — dark ground for the admin/portal navigation                                                                                                                                                                                                                                                                |
| `--sidebar-foreground`         | `#FCFAF5` | Ivory                                                                                                                                                                                                                                                                                                                   |
| `--sidebar-primary`            | `#8C6E33` | Antique Brass — active nav item indicator                                                                                                                                                                                                                                                                               |
| `--sidebar-primary-foreground` | `#FCFAF5` | Ivory                                                                                                                                                                                                                                                                                                                   |
| `--sidebar-accent`             | `#1C4234` | Pine 700 — nav item hover state                                                                                                                                                                                                                                                                                         |
| `--sidebar-accent-foreground`  | `#FCFAF5` | Ivory                                                                                                                                                                                                                                                                                                                   |
| `--sidebar-border`             | `#1C4234` | Pine 700 — a subtle border within the dark sidebar                                                                                                                                                                                                                                                                      |
| `--sidebar-ring`               | `#A9853F` | Brass 500, matching `--ring`                                                                                                                                                                                                                                                                                            |

**Four additional brand tones, outside shadcn's semantic set.** `--pine-700`, `--pine-500`,
`--brass-500`, and `--brass-300` (all already in the full brand palette table above) don't
map onto any shadcn semantic slot — shadcn's convention has no token for "a button's hover
background" or "a decorative border tone distinct from `--border`". The mockups use exactly
these four for that purpose (`.btn-primary:hover { background: var(--pine-700); }`,
`.btn-accent:hover { background: var(--brass-500); }`, the admin sidebar's active/hover
states, hairlines on dark sections, etc.), so they're declared as raw `:root` variables and
also exposed as Tailwind utilities (`bg-pine-700`, `text-brass-300`, `border-pine-500`, …)
alongside the semantic set below — not introducing a new colour, just carrying four rows
already in the authoritative palette table through into code, matching the mockups exactly
rather than approximating hover/accent states with the semantic palette alone.

No `.dark` variant is defined. Kaalbert's brand is one fixed identity, not a dual-mode
system — Document 13.03 does not ask for a dark-mode toggle, and introducing one would be
exactly the kind of unrequested decorative/mode addition Section 12 requires approval for.

## Radius

shadcn derives its full radius scale from one base `--radius` value using fixed multipliers
(`radius-sm` = 0.6×, `radius-md` = 0.8×, `radius-lg` = 1×, up through `radius-4xl` at 2.6×) —
not an enumerated list. Base is set to `0.75rem` (12px), landing `radius-sm`≈7px, `radius-md`
≈10px, `radius-lg`=12px.

**Revised after reviewing the first built mockup**: an earlier `0.5rem` base (landing at
4–8px) read as "too squareish" in practice — restraint in this brand system means no
decorative excess (no pill shapes, no exaggerated rounding), not zero softness. `0.75rem` is
the corrected base.

**Usage discipline, not a token restriction**: only `radius-sm`/`radius-md`/`radius-lg` are
used in practice across this project. The larger derived values (`radius-xl` through
`radius-4xl`) exist because shadcn's convention generates them automatically, but are
deliberately not reached for — a large, heavily-rounded corner reads as casual/startup-like
against this brand's "serious, disciplined" personality (09.01), the same restraint already
applied to colour and motion.

## Shadow scale

Minimal, used only for genuine elevation cues (a card lifted off the page, a dropdown menu),
never for decorative depth.

| Token       | Value                               | Use                                             |
| ----------- | ----------------------------------- | ----------------------------------------------- |
| `shadow-sm` | `0 1px 2px 0 rgb(18 19 23 / 0.06)`  | Cards on the Ivory surface                      |
| `shadow-md` | `0 4px 12px 0 rgb(18 19 23 / 0.10)` | Dialogs, dropdowns, the admin's floating panels |

## Type scale

Typefaces fixed by 09.01: Georgia (display), Calibri (body). Both system fonts — no web
font file is loaded. Not part of shadcn's semantic set — these are original tokens specific
to this brand, added alongside the shadcn mapping.

| Role                                                    | Family                                                   | Size                                       | Weight      | Line height |
| ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ | ----------- | ----------- |
| Display                                                 | Georgia, "Times New Roman", serif                        | 3rem (48px)                                | 700         | 1.15        |
| H1                                                      | Georgia, "Times New Roman", serif                        | 2.25rem (36px)                             | 700         | 1.2         |
| H2                                                      | Georgia, "Times New Roman", serif                        | 1.75rem (28px)                             | 700         | 1.25        |
| H3                                                      | Georgia, "Times New Roman", serif                        | 1.375rem (22px)                            | 700         | 1.3         |
| Lead paragraph                                          | Calibri, Arial, sans-serif                               | 1.1875rem (19px)                           | 300         | 1.5         |
| Body                                                    | Calibri, Arial, sans-serif                               | 1rem (16px)                                | 400         | 1.6         |
| Caption / note                                          | Calibri, Arial, sans-serif                               | 0.8125rem (13px)                           | 400, italic | 1.4         |
| Kicker / label                                          | Calibri, Arial, sans-serif                               | 0.75rem (12px), uppercase, 0.08em tracking | 600         | 1.3         |
| Code (minimal use — e.g. a precise fee figure or score) | ui-monospace, SFMono-Regular, Menlo, Consolas, monospace | 0.875rem (14px)                            | 400         | 1.5         |

Per 09.01: headings render in `--primary` (Pine Green); kicker/label renders in `--accent`
(Antique Brass); lead paragraph and body render in `--foreground` (Ink); caption/note renders
in `--muted-foreground` (Ink 600).

## Spacing

**No custom spacing tokens are defined.** Tailwind v4 generates its entire numeric spacing
scale (`p-1`, `p-4`, `p-8`, `p-24`, `p-32`, ...) dynamically from one base `--spacing` value
(default `0.25rem`/4px) multiplied by the class number — not from an enumerated list the way
earlier Tailwind versions worked. The default base already produces exactly the scale this
project needs (`p-1`=4px, `p-4`=16px, `p-8`=32px, `p-12`=48px, `p-24`=96px, `p-32`=128px,
etc.), matching 09.01/Document 13.03's "generous spacing" direction without any override.

## Complete CSS-first configuration

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --radius: 0.75rem;

  --background: #fcfaf5;
  --foreground: #121317;

  --card: #ffffff;
  --card-foreground: #121317;

  --popover: #ffffff;
  --popover-foreground: #121317;

  --primary: #0e2a22;
  --primary-foreground: #fcfaf5;

  --secondary: #eef2f0;
  --secondary-foreground: #121317;

  --muted: #f4f1e8;
  --muted-foreground: #3c414a;

  --accent: #8c6e33;
  --accent-foreground: #fcfaf5;

  --destructive: #b3261e;

  --border: #c9c1ae;
  --input: #c9c1ae;
  --ring: #a9853f;

  --chart-1: #0e2a22;
  --chart-2: #356b55;
  --chart-3: #8c6e33;
  --chart-4: #a9853f;
  --chart-5: #cbb074;

  --sidebar: #0e2a22;
  --sidebar-foreground: #fcfaf5;
  --sidebar-primary: #8c6e33;
  --sidebar-primary-foreground: #fcfaf5;
  --sidebar-accent: #1c4234;
  --sidebar-accent-foreground: #fcfaf5;
  --sidebar-border: #1c4234;
  --sidebar-ring: #a9853f;

  /* Brand tones outside shadcn's semantic set — hover states and decorative accents that
     match the mockups exactly (see the note above the colour-mapping table). */
  --pine-700: #1c4234;
  --pine-500: #356b55;
  --brass-500: #a9853f;
  --brass-300: #cbb074;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Brand tones outside shadcn's semantic set — see the note above the colour-mapping table */
  --color-pine-700: var(--pine-700);
  --color-pine-500: var(--pine-500);
  --color-brass-500: var(--brass-500);
  --color-brass-300: var(--brass-300);

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

  /* Brand-specific tokens, not part of shadcn's semantic set */
  --font-display: Georgia, "Times New Roman", serif;
  --font-body: Calibri, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --text-display: 3rem;
  --text-display--line-height: 1.15;
  --text-h1: 2.25rem;
  --text-h1--line-height: 1.2;
  --text-h2: 1.75rem;
  --text-h2--line-height: 1.25;
  --text-h3: 1.375rem;
  --text-h3--line-height: 1.3;
  --text-lead: 1.1875rem;
  --text-lead--line-height: 1.5;
  --text-body: 1rem;
  --text-body--line-height: 1.6;
  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.4;
  --text-kicker: 0.75rem;
  --text-kicker--line-height: 1.3;
  --text-code: 0.875rem;
  --text-code--line-height: 1.5;

  --shadow-sm: 0 1px 2px 0 rgb(18 19 23 / 0.06);
  --shadow-md: 0 4px 12px 0 rgb(18 19 23 / 0.1);
}
```

## Logo assets

Real firm-supplied logo files, not a text wordmark: `Company Docs/Brand assets/`
`Logo_Primary.png` (Pine Green wordmark, Brass "& Company Ltd" line — for light/Ivory
backgrounds) and `Logo_For_Dark_BG.png` (Ivory wordmark, Brass line — for dark/Pine Green
backgrounds), matching 09.01's rule exactly ("the wordmark appears in Kaalbert green on
light backgrounds, or in cream or white on green"). Copied into the app's asset location at
`public/brand/logo-primary.png` and `public/brand/logo-dark-bg.png`. Used at `height: 34px`
in the site header/nav, `48px` in hero or landing-page contexts, width always `auto` to
preserve the original ~3:1 aspect ratio. Never redrawn as text, never recoloured outside
these two supplied variants.

## shadcn/ui and Base UI usage

Components are generated via the shadcn/ui CLI on Base UI (`docs/adr/0010`), which reads
this exact variable structure automatically — no per-component recolouring is needed, since
`bg-primary`, `text-muted-foreground`, `border-border` etc. already resolve to Kaalbert's
palette. Base UI supplies the accessible behaviour (focus management, keyboard navigation,
ARIA roles) that satisfies NFR-2 (WCAG 2.1 AA) without hand-building it; the token layer
above supplies the visual language that makes a shadcn button or dialog look like Kaalbert's,
not like a generic component library's default theme.
