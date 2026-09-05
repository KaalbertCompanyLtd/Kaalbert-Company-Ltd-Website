/**
 * Scratch verification page for T1.3 (design tokens + Tailwind v4 setup) — not a real
 * public page type, no SEO metadata. Renders the shared primitives (buttons, cards, form
 * inputs) so they can be compared side by side against ui/mockups/a-public-site/home.html.
 */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-transparent px-6 py-3 text-base font-semibold transition-colors";

const swatches: Array<{ label: string; className: string; textClassName: string }> = [
  { label: "primary", className: "bg-primary", textClassName: "text-primary-foreground" },
  { label: "secondary", className: "bg-secondary", textClassName: "text-secondary-foreground" },
  { label: "accent", className: "bg-accent", textClassName: "text-accent-foreground" },
  { label: "muted", className: "bg-muted", textClassName: "text-muted-foreground" },
  {
    label: "card",
    className: "bg-card border border-border",
    textClassName: "text-card-foreground",
  },
  {
    label: "background",
    className: "bg-background border border-border",
    textClassName: "text-foreground",
  },
  { label: "destructive", className: "bg-destructive", textClassName: "text-primary-foreground" },
  { label: "pine-700", className: "bg-pine-700", textClassName: "text-primary-foreground" },
  { label: "pine-500", className: "bg-pine-500", textClassName: "text-primary-foreground" },
  { label: "brass-500", className: "bg-brass-500", textClassName: "text-accent-foreground" },
  { label: "brass-300", className: "bg-brass-300", textClassName: "text-foreground" },
];

export default function DesignTokensTestPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
        T1.3 — scratch verification
      </span>
      <h1 className="font-display text-h1 text-primary mb-2 font-bold">
        Design tokens — shared primitives
      </h1>
      <p className="text-lead text-muted-foreground mb-12 max-w-2xl font-light">
        Compare this page side by side with ui/mockups/a-public-site/home.html — buttons, cards, and
        form inputs below should render pixel-equivalent to that mockup.
      </p>

      <section className="mb-14">
        <h2 className="font-display text-h2 text-primary mb-4 font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className={`${buttonBase} bg-primary text-primary-foreground hover:bg-pine-700`}
          >
            Take the Health Check
          </button>
          <button
            type="button"
            className={`${buttonBase} border-border bg-secondary text-secondary-foreground hover:bg-muted`}
          >
            Meet the partners
          </button>
          <button
            type="button"
            className={`${buttonBase} bg-accent text-accent-foreground hover:bg-brass-500`}
          >
            Take the free Business Health Check
          </button>
          <button
            type="button"
            className={`${buttonBase} border-border text-primary hover:bg-muted bg-transparent`}
          >
            See how we work
          </button>
          <button
            type="button"
            disabled
            className={`${buttonBase} bg-primary text-primary-foreground opacity-50`}
          >
            Disabled
          </button>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-h2 text-primary mb-4 font-bold">Cards</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="border-border bg-card text-card-foreground flex flex-col gap-3 rounded-md border p-6 shadow-sm">
            <h3 className="font-display text-h3 text-primary font-bold">Business Health Check</h3>
            <p className="text-body text-foreground">
              A structured, partner-led read of where your business really stands before you take it
              to a bank or a board.
            </p>
            <span className="text-code text-accent font-mono font-bold">
              From GHS 1,000 · scope-capped
            </span>
            <a href="#" className="text-primary mt-auto font-bold hover:underline">
              See the full offer →
            </a>
          </div>
          <div className="border-border bg-card text-card-foreground flex flex-col gap-3 rounded-md border p-6 shadow-sm">
            <h3 className="font-display text-h3 text-primary font-bold">Financial Clarity Pack</h3>
            <p className="text-body text-foreground">
              Management accounts that actually reconcile to your bank balance, and that a lender
              will trust on sight.
            </p>
            <span className="text-code text-accent font-mono font-bold">
              From GHS 4,500 · scope-capped
            </span>
            <a href="#" className="text-primary mt-auto font-bold hover:underline">
              See the full offer →
            </a>
          </div>
          <div className="border-border bg-card text-card-foreground flex flex-col gap-3 rounded-md border p-6 shadow-sm">
            <h3 className="font-display text-h3 text-primary font-bold">Funding-Readiness Pack</h3>
            <p className="text-body text-foreground">
              Everything a facility application needs, assembled and reviewed before a lender ever
              sees it.
            </p>
            <span className="text-code text-accent font-mono font-bold">
              From GHS 9,000 · scope-capped
            </span>
            <a href="#" className="text-primary mt-auto font-bold hover:underline">
              See the full offer →
            </a>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-display text-h2 text-primary mb-4 font-bold">Form inputs</h2>
        <form className="max-w-md space-y-5">
          <div>
            <label htmlFor="name" className="text-foreground mb-1.5 block text-sm font-semibold">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ama Owusu"
              className="border-input bg-card text-foreground focus:outline-ring w-full rounded-sm border px-3 py-2.5 text-base focus:outline-2 focus:outline-offset-2"
            />
          </div>
          <div>
            <label
              htmlFor="engagement"
              className="text-foreground mb-1.5 block text-sm font-semibold"
            >
              What do you need help with?
            </label>
            <select
              id="engagement"
              className="border-input bg-card text-foreground focus:outline-ring w-full rounded-sm border px-3 py-2.5 text-base focus:outline-2 focus:outline-offset-2"
            >
              <option>Business Health Check</option>
              <option>Financial Clarity Pack</option>
              <option>Funding-Readiness Pack</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="text-foreground mb-1.5 block text-sm font-semibold">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              placeholder="Anything else we should know?"
              className="border-input bg-card text-foreground focus:outline-ring w-full resize-y rounded-sm border px-3 py-2.5 text-base focus:outline-2 focus:outline-offset-2"
            />
            <p className="text-caption text-muted-foreground mt-1 italic">
              Optional — used only to route your enquiry to the right partner.
            </p>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-h2 text-primary mb-4 font-bold">Colour palette</h2>
        <div className="flex flex-wrap gap-4">
          {swatches.map((swatch) => (
            <div
              key={swatch.label}
              className={`flex h-20 w-32 items-end rounded-md p-2 text-sm font-semibold ${swatch.className} ${swatch.textClassName}`}
            >
              {swatch.label}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
