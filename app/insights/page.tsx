import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { getInsightsIndex } from "@/lib/insights";
import { getOfferNavLinks } from "@/lib/offers";
import { getPageBySlug } from "@/lib/pages";
import { buildPageMetadata, resolveMetaDescription } from "@/lib/seo";
import { ArticleCard } from "@/components/insights-article-card";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Reads live `page`/`article`/`category` rows on every request — same reasoning as every
// other DB-backed public page (memory/decision-log.md, T2.1): this content is meant to
// become admin-editable (Milestone 7), and Railway's build container can't reach the
// private-network DB host to statically prerender this route at build time.
export const dynamic = "force-dynamic";

/**
 * `ui/mockups/b-insights/insights-index.html`'s `.filter-pill` uses `border-radius: 999px` (a
 * true pill shape) — but `ui/design-system.md`'s Radius section explicitly rules this out
 * ("restraint in this brand system means no decorative excess (no pill shapes, no exaggerated
 * rounding)"), a corrective note added after reviewing an earlier built mockup. The design
 * token set overrides the wireframe tool's own default shape here — same structure (a row of
 * clickable category filters, active state highlighted), just `rounded-sm` instead of a true
 * pill, per CLAUDE.md's "do not introduce a … radius outside that token set" rule. See
 * memory/decision-log.md (session 25).
 */
const FILTER_CHIP =
  "inline-flex items-center rounded-sm border px-4 py-2 text-caption font-semibold transition-colors";
const FILTER_CHIP_ACTIVE = "border-primary bg-primary text-primary-foreground";
const FILTER_CHIP_INACTIVE =
  "border-border bg-card text-foreground hover:border-accent hover:text-accent";

interface InsightsPageProps {
  searchParams: Promise<{
    category?: string | string[];
    q?: string | string[];
    page?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Builds a shareable `/insights` URL from the query state a link should carry forward —
 * insights-engine.md's own acceptance criterion (T4.2) that filter/search produce real,
 * shareable URLs rather than client-only state. Omits a param entirely when it's the
 * "default" value (no category, no search, page 1) so the base index URL stays clean.
 */
function buildInsightsHref({
  category,
  q,
  page,
}: {
  category?: string;
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/insights?${query}` : "/insights";
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("insights");
  return buildPageMetadata({
    title: page.metaTitle,
    description: resolveMetaDescription(page.metaDescription, page.heroLead),
    path: "/insights",
  });
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = await searchParams;
  const category = firstValue(params.category);
  const q = firstValue(params.q);
  const requestedPage = Number.parseInt(firstValue(params.page) ?? "1", 10);

  const [page, offerNavLinks, index] = await Promise.all([
    getPageBySlug("insights"),
    getOfferNavLinks(),
    getInsightsIndex({
      category,
      q,
      page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    }),
  ]);

  const hasActiveFilters = Boolean(category || q);
  const activeCategoryName = category
    ? index.categories.find((c) => c.slug === category)?.name
    : undefined;

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader hasHero offerNavLinks={offerNavLinks} />
      <main>
        {/* Hero — the shared `page` entity's own copy, same pattern as capabilities/our-method/
            about/contact. */}
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[760px] px-2">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              {page.heroKicker}
            </span>
            <h1 className="font-display text-primary-foreground mb-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              {page.heroHeading}
            </h1>
            <p className="text-lead font-light text-[#C9D3CD]">{page.heroLead}</p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[1100px]">
            {/* Category filter + search — both real navigations (GET query params), never
                client-only state, so a filtered/searched view has its own shareable URL. */}
            <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2" aria-label="Filter by category">
                <Link
                  href={buildInsightsHref({ q })}
                  className={`${FILTER_CHIP} ${!category ? FILTER_CHIP_ACTIVE : FILTER_CHIP_INACTIVE}`}
                  aria-current={!category ? "true" : undefined}
                >
                  All
                </Link>
                {index.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={buildInsightsHref({ category: cat.slug, q })}
                    className={`${FILTER_CHIP} ${category === cat.slug ? FILTER_CHIP_ACTIVE : FILTER_CHIP_INACTIVE}`}
                    aria-current={category === cat.slug ? "true" : undefined}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <form action="/insights" method="get" className="relative w-full sm:w-auto">
                {category && <input type="hidden" name="category" value={category} />}
                <label htmlFor="insights-search" className="sr-only">
                  Search articles
                </label>
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <input
                  id="insights-search"
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search articles…"
                  className="border-border bg-card text-body text-foreground focus-visible:border-ring w-full min-w-[240px] rounded-sm border py-2.5 pr-4 pl-9 outline-none sm:w-auto"
                />
              </form>
            </div>

            {index.articles.length === 0 ? (
              <div className="text-body text-muted-foreground py-16 text-center">
                {hasActiveFilters ? (
                  <>
                    No articles match{" "}
                    {activeCategoryName ? `"${activeCategoryName}"` : "that search"}
                    {q ? ` and "${q}"` : ""}.{" "}
                    <Link href="/insights" className="text-primary font-semibold hover:underline">
                      Clear filters
                    </Link>
                  </>
                ) : (
                  "No articles published yet. Check back soon."
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {index.articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}

            {index.totalPages > 1 && (
              <nav
                aria-label="Insights pagination"
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
              >
                <PaginationLink
                  href={buildInsightsHref({ category, q, page: index.page - 1 })}
                  disabled={index.page === 1}
                >
                  Prev
                </PaginationLink>
                {Array.from({ length: index.totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <PaginationLink
                    key={pageNumber}
                    href={buildInsightsHref({ category, q, page: pageNumber })}
                    active={pageNumber === index.page}
                  >
                    {pageNumber}
                  </PaginationLink>
                ))}
                <PaginationLink
                  href={buildInsightsHref({ category, q, page: index.page + 1 })}
                  disabled={index.page === index.totalPages}
                >
                  Next
                </PaginationLink>
              </nav>
            )}
          </div>
        </section>
      </main>
      <SiteFooter
        addressLine1="House No. 13 Gbenjin Gbe Avenue"
        addressLine2="East Legon-ARS, Accra"
        phonePrimary="0558 480 001"
      />
    </>
  );
}

function PaginationLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const base =
    "inline-flex min-w-[38px] h-[38px] items-center justify-center rounded-sm border px-3 text-body font-semibold";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} border-border bg-card text-muted-foreground/40`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-accent"
      }`}
    >
      {children}
    </Link>
  );
}
