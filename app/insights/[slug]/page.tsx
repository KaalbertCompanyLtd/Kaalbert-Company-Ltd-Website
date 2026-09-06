import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { NOT_FOUND_METADATA } from "@/app/not-found";
import { getInitials } from "@/lib/about";
import {
  buildArticleShareLinks,
  getArticleBySlug,
  getRelatedArticles,
  isResourceReachable,
} from "@/lib/insights";
import type { ArticleBodyBlock, ArticleResourceItem } from "@/lib/insights";
import { getOfferNavLinks } from "@/lib/offers";
import { buildPageMetadata, getSiteUrl, resolveMetaDescription } from "@/lib/seo";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { InsightsSubscribeForm } from "@/components/insights-subscribe-form";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Reads live `article`/`article_resource`/`author`/`category` rows on every request — same
// reasoning as every other DB-backed public page (memory/decision-log.md, T2.1): this content
// is meant to become admin-editable (Milestone 7), and Railway's build container can't reach
// the private-network DB host to statically prerender this route at build time.
export const dynamic = "force-dynamic";

const BTN_ACCENT =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-body font-semibold text-accent-foreground transition-colors hover:bg-brass-500";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary px-5 py-2.5 text-body font-semibold text-secondary-foreground transition-colors hover:bg-muted";

/**
 * A perfect circle sized for exactly one glyph/icon — not the same "pill shape" `ui/design-
 * system.md`'s Radius section rules out (T4.2, session 25, corrected the mockup's *wide,
 * text-label* filter chips from `rounded-full` to `rounded-sm` for that reason). A single-
 * character icon button reads as a restrained, common control shape, not the "decorative
 * excess" the design system's rule is actually aimed at — used narrowly here, only for these
 * icon-sized share buttons.
 */
const SHARE_BTN =
  "border-border bg-card text-primary hover:bg-muted flex size-9 items-center justify-center rounded-full border text-caption font-bold no-underline";

interface ArticlePageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageParams): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return NOT_FOUND_METADATA;

  return buildPageMetadata({
    title: article.metaTitle,
    description: resolveMetaDescription(article.metaDescription, article.excerpt),
    path: `/insights/${article.slug}`,
    imageUrl: article.previewImage ?? undefined,
    type: "article",
  });
}

function formatPublishedDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function BylineAvatar({
  name,
  photoUrl,
  size,
}: {
  name: string;
  photoUrl: string | null;
  size: "sm" | "lg";
}) {
  const sizeClasses = size === "lg" ? "size-16" : "size-11";
  const textClasses = size === "lg" ? "text-xl" : "text-base";
  return (
    <Avatar className={`${sizeClasses} shrink-0 rounded-sm`}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback
        className={`bg-primary text-brass-300 font-display rounded-sm font-bold ${textClasses}`}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * One `Article.body` block, per its kind — see `lib/insights.ts`'s `ArticleBodyBlock`
 * doc-comment for why this union's shape matches the accepted mockup exactly (paragraph,
 * `<h2>`, pull-quote, list, table).
 */
function ArticleBlock({ block }: { block: ArticleBodyBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-body text-foreground mb-5 leading-[1.75]">{block.text}</p>;

    case "heading":
      return (
        <h2 className="font-display text-primary mt-10 mb-4 text-[1.375rem] font-bold">
          {block.text}
        </h2>
      );

    case "quote":
      return (
        <blockquote className="border-accent text-primary font-display mb-8 border-l-[3px] py-1 pl-6 text-[1.375rem] leading-[1.4]">
          {block.text}
        </blockquote>
      );

    case "list":
      return (
        <ul className="text-body text-foreground mb-5 list-disc space-y-2 pl-[22px] leading-[1.7]">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );

    case "table":
      return (
        <Table className="mb-8">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {block.headers.map((header) => (
                <TableHead
                  key={header}
                  scope="col"
                  className="text-accent text-kicker h-auto px-3.5 py-2.5 font-semibold tracking-[0.04em] whitespace-normal uppercase"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="border-border hover:bg-transparent">
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className="text-foreground px-3.5 py-3 align-top whitespace-normal"
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
  }
}

/**
 * `insights-engine.md`'s edge case: a removed resource file must fail gracefully with a clear
 * message, not a dead link — `available` (already resolved server-side via
 * `isResourceReachable`) decides which of the two renders.
 */
function ResourceLink({
  resource,
  available,
}: {
  resource: ArticleResourceItem;
  available: boolean;
}) {
  if (available) {
    return (
      <a
        href={resource.fileUrl}
        target="_blank"
        rel="noopener"
        className="text-primary inline-flex items-center gap-2 font-semibold hover:underline"
      >
        <Download aria-hidden="true" className="size-4" />
        {resource.label}
      </a>
    );
  }
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2">
      <Download aria-hidden="true" className="size-4" />
      {resource.label} — currently unavailable.{" "}
      <Link href="/contact" className="text-primary underline">
        Contact us
      </Link>{" "}
      for a copy.
    </span>
  );
}

export default async function ArticlePage({ params }: ArticlePageParams) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const [offerNavLinks, relatedArticles, resourceAvailability] = await Promise.all([
    getOfferNavLinks(),
    getRelatedArticles({ id: article.id, categoryId: article.categoryId }),
    Promise.all(article.resources.map((resource) => isResourceReachable(resource.fileUrl))),
  ]);

  const articleUrl = new URL(`/insights/${article.slug}`, getSiteUrl()).toString();
  const shareLinks = buildArticleShareLinks({ title: article.title, url: articleUrl });

  return (
    <>
      <OrganizationJsonLd />
      <ArticleJsonLd
        title={article.title}
        authorName={article.author.name}
        authorPracticeArea={article.author.practiceArea}
        publishedAt={article.publishedAt}
        revisedAt={article.revisedAt}
        previewImage={article.previewImage}
      />
      <SiteHeader hasHero={false} offerNavLinks={offerNavLinks} />
      <main className="pt-19">
        {/* Article header — no dark hero (matches app/legal/[slug]/page.tsx's plain-header
            precedent, not the marketing-page dark hero), per the mockup's own plain <body>. */}
        <div className="border-border border-b px-4 pt-12 pb-8 sm:px-6">
          <div className="mx-auto max-w-[780px]">
            {article.category && (
              <span className="text-caption text-accent mb-3 block font-semibold tracking-[0.06em] uppercase">
                {article.category.name}
              </span>
            )}
            <h1 className="font-display text-primary mb-6 text-[clamp(1.75rem,4vw,2.25rem)] leading-[1.2] font-bold">
              {article.title}
            </h1>
            <div className="flex items-center gap-3.5">
              <BylineAvatar
                name={article.author.name}
                photoUrl={article.author.photoUrl}
                size="sm"
              />
              <div className="text-caption text-muted-foreground">
                <strong className="text-foreground text-body block">{article.author.name}</strong>
                {article.author.practiceArea} · Published {formatPublishedDate(article.publishedAt)}
              </div>
            </div>
          </div>
        </div>

        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-[680px]">
            {article.body.map((block, index) => (
              <ArticleBlock key={index} block={block} />
            ))}

            {/* Fixed template chrome, not per-article data (no field for this in
                insights-engine.md's Data requirements) — same generic diagnostic CTA on
                every article, matching the accepted mockup's `.resource-callout`. */}
            <div className="bg-muted border-border my-10 flex flex-wrap items-center justify-between gap-5 rounded-md border p-6">
              <div>
                <strong className="text-foreground mb-1 block">
                  Not sure where your own business stands?
                </strong>
                <span className="text-body text-muted-foreground">
                  The free Business Health Check scores this specifically, in under six minutes.
                </span>
              </div>
              <Link href="/diagnostic" className={BTN_SECONDARY}>
                Take the Health Check
              </Link>
            </div>

            {article.resources.length > 0 && (
              <div className="border-border bg-card mb-8 rounded-md border p-6">
                <h3 className="font-display text-primary mb-3 text-[1.0625rem] font-bold">
                  Downloads
                </h3>
                <ul className="space-y-2.5">
                  {article.resources.map((resource, index) => (
                    <li key={resource.id}>
                      <ResourceLink resource={resource} available={resourceAvailability[index]} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="my-8 flex items-center gap-2.5">
              <span className="text-caption text-muted-foreground mr-1 font-semibold">Share</span>
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener"
                aria-label="Share on WhatsApp"
                className={SHARE_BTN}
              >
                W
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener"
                aria-label="Share on LinkedIn"
                className={SHARE_BTN}
              >
                in
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener"
                aria-label="Share on Facebook"
                className={SHARE_BTN}
              >
                f
              </a>
            </div>

            {/* Named author byline with photo/practice area (FR-3.3) — the fuller, bio-bearing
                version; the header above is the shorter identification. */}
            <div className="border-border bg-card my-10 flex flex-col gap-5 rounded-md border p-7 sm:flex-row">
              <BylineAvatar
                name={article.author.name}
                photoUrl={article.author.photoUrl}
                size="lg"
              />
              <div>
                <h3 className="font-display text-primary text-[1.0625rem] font-bold">
                  {article.author.name}
                </h3>
                <span className="text-caption text-accent mb-2 block font-semibold tracking-[0.05em] uppercase">
                  {article.author.title} · {article.author.practiceArea}
                </span>
                <p className="text-body text-foreground mb-0">{article.author.bio}</p>
              </div>
            </div>

            {/* Contextual next-step CTA (FR-3.4) — never a generic "contact us"; heading/body
                copy is authored per article via `Article.nextStepCta`. */}
            <div className="bg-primary text-primary-foreground my-10 rounded-md p-8">
              <span className="text-kicker text-brass-300 mb-1.5 block font-semibold tracking-[0.08em] uppercase">
                Where this usually goes next
              </span>
              <h3 className="font-display text-h3 mb-2 font-bold">{article.nextStepCta.heading}</h3>
              <p className="mb-5 text-[#C9D3CD]">{article.nextStepCta.body}</p>
              <Link href={article.nextStepCta.href} className={BTN_ACCENT}>
                {article.nextStepCta.label}
              </Link>
            </div>
          </div>
        </section>

        {/* Subscribe form at the foot of every article (insights-engine.md's own placement,
            same shared component the index renders — see components/insights-subscribe-
            form.tsx's doc-comment for why this is one component, not two). */}
        <section className="border-border border-t px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-[560px]">
            <InsightsSubscribeForm />
          </div>
        </section>

        {relatedArticles.length > 0 && (
          <section className="border-border bg-muted border-t px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-[900px]">
              <h2 className="font-display text-primary text-h3 mb-5 font-bold">Related</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/insights/${related.slug}`}
                    className="border-border bg-card text-primary rounded-md border p-5 font-semibold no-underline hover:underline"
                  >
                    {related.category && (
                      <span className="text-caption text-accent mb-2 block font-semibold tracking-[0.05em] uppercase">
                        {related.category.name}
                      </span>
                    )}
                    {related.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter
        addressLine1="House No. 13 Gbenjin Gbe Avenue"
        addressLine2="East Legon-ARS, Accra"
        phonePrimary="0558 480 001"
      />
    </>
  );
}
