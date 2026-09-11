import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NOT_FOUND_METADATA } from "@/app/not-found";
import { LandingPageCta } from "@/components/landing-page-cta";
import { LandingPageHeader } from "@/components/landing-page-header";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { getLandingPageBySlug } from "@/lib/landing-pages";
import type { LandingPageBodyBlock } from "@/lib/landing-pages";
import { buildPageMetadata, resolveMetaDescription } from "@/lib/seo";
import { getSiteFooterContent } from "@/lib/site-settings";

// Reads live `landing_page` rows on every request — same reasoning as every other page built
// against seeded content this project (memory/decision-log.md, T2.1): this content is meant
// to become admin-editable (Milestone 7), and Railway's build container can't reach the
// private-network DB host to statically prerender this route at build time.
export const dynamic = "force-dynamic";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";

interface LandingPageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LandingPageParams): Promise<Metadata> {
  const { slug } = await params;
  const landingPage = await getLandingPageBySlug(slug);
  if (!landingPage) return NOT_FOUND_METADATA;
  return buildPageMetadata({
    title: landingPage.metaTitle,
    description: resolveMetaDescription(landingPage.metaDescription, landingPage.openingParagraph),
    path: `/lp/${landingPage.slug}`,
  });
}

/**
 * One `bodyContent` block, matching each accepted mockup's own visual treatment per kind —
 * see `lib/landing-pages.ts`'s `LandingPageBodyBlock` doc-comment for which mockup each kind
 * comes from. Same switch-per-`kind` pattern as `app/legal/[slug]/page.tsx`'s `LegalBlock`.
 */
function LandingPageBodyBlockView({ block }: { block: LandingPageBodyBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <h2 className="font-display text-primary text-h2 text-center font-bold">{block.text}</h2>
      );

    case "paragraph":
      return (
        <p className="text-body text-muted-foreground mx-auto max-w-[520px] text-center">
          {block.text}
        </p>
      );

    case "list":
      return (
        <ul className="mx-auto max-w-[640px] list-none p-0">
          {block.items.map((item) => (
            <li
              key={item}
              className="border-border text-body text-foreground flex gap-3 border-b py-3 last:border-b-0"
            >
              <span className="text-pine-500 flex-shrink-0 font-bold" aria-hidden="true">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      );

    case "stats":
      return (
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {block.items.map((item) => (
            <div key={item.label} className="mx-auto max-w-[220px]">
              <span className="font-display text-pine-500 text-h2 mb-1.5 block">{item.value}</span>
              <p className="text-caption text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item, index) => (
            <div key={item.title} className="mx-auto max-w-[200px]">
              <span className="font-display text-brass-500 text-h2 mb-1.5 block leading-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4 className="font-display text-primary mb-1 text-[0.9375rem] font-bold">
                {item.title}
              </h4>
              <p className="text-caption text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      );
  }
}

export default async function LandingPage({ params }: LandingPageParams) {
  const { slug } = await params;
  const [landingPage, footerContent] = await Promise.all([
    getLandingPageBySlug(slug),
    getSiteFooterContent(),
  ]);

  if (!landingPage) {
    notFound();
  }

  const bodyContent = landingPage.bodyContent as unknown as LandingPageBodyBlock[];

  return (
    <>
      <OrganizationJsonLd />
      <LandingPageHeader />
      <main id="main">
        <section className="bg-primary relative overflow-hidden px-4 pt-[132px] pb-12 text-center sm:px-6 sm:pt-[156px] sm:pb-16">
          <div className="mx-auto max-w-[680px] px-2">
            <span className="text-kicker text-brass-300 mb-3 block font-semibold tracking-[0.08em] uppercase">
              {landingPage.kicker}
            </span>
            <h1 className="font-display text-primary-foreground mb-5 text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-bold">
              {landingPage.headline}
            </h1>
            <p className="text-lead mx-auto mb-8 max-w-[560px] font-light text-[#C9D3CD]">
              {landingPage.openingParagraph}
            </p>
            <LandingPageCta
              label={landingPage.ctaLabel}
              href={landingPage.ctaHref}
              downloadFileUrl={landingPage.downloadFileUrl}
              className={BTN_ACCENT}
            />
          </div>
        </section>

        {landingPage.isPlaceholder && (
          <div className="border-border bg-muted text-caption text-muted-foreground mx-auto mt-8 max-w-[680px] rounded-sm border border-dashed px-4 py-3 text-center italic">
            <strong className="text-foreground font-semibold">
              Draft — pending firm sign-off.
            </strong>{" "}
            This campaign page is a structural placeholder, not final marketing copy.
          </div>
        )}

        {bodyContent.length > 0 ? (
          <section className="border-border border-b px-4 py-12 sm:px-6">
            <div className="mx-auto flex max-w-[860px] flex-col gap-10">
              {bodyContent.map((block, index) => (
                <LandingPageBodyBlockView key={index} block={block} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="px-4 py-16 text-center sm:px-6">
          <LandingPageCta
            label={landingPage.ctaLabel}
            href={landingPage.ctaHref}
            downloadFileUrl={landingPage.downloadFileUrl}
            className={BTN_ACCENT}
          />
        </section>
      </main>
      <SiteFooter {...footerContent} />
    </>
  );
}
