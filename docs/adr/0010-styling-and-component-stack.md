# ADR 0010: Tailwind CSS v4 + shadcn/ui on Base UI + Lucide Icons

Status: Accepted

Context: The application (Next.js/TypeScript, ADR 0002) needs a styling and component
layer consistent with ADR 0001's rule — packages as building blocks inside hand-built UI,
never a product that owns the interface. Confirmed via live research (September 2026):
Base UI became shadcn/ui's default primitive library in July 2026 (Radix still supported,
not deprecated); Tailwind CSS v4 replaced `tailwind.config.js` with CSS-first configuration
via the `@theme` directive.

Decision: Tailwind CSS v4 for utility styling, configured CSS-first (no config file — design
tokens declared under `@theme` in the global stylesheet, per `design-system.md`). shadcn/ui
as the component layer, generated on Base UI rather than Radix. Lucide (`lucide-react`) for
icons — shadcn/ui's own default icon set.

Consequences: shadcn/ui's CLI copies component source directly into the codebase — the team
owns and can edit every component file, consistent with the project's custom-build principle
rather than depending on an opaque installed component library. Base UI supplies unstyled
behavioural primitives (focus management, ARIA, keyboard navigation) as a library, not a
product — directly serving the WCAG 2.1 AA requirement (NFR-2) without hand-building
accessibility behaviour from scratch. Design tokens (`design-system.md`'s colour palette,
type scale, spacing, radius, shadows) are declared once under `@theme` and become both CSS
custom properties and Tailwind utilities automatically, keeping the design system enforced
in one place rather than duplicated between a config file and hand-written CSS.
