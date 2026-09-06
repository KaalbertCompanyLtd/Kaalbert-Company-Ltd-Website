import type { Metadata } from "next";
import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getSiteSettings, toTelHref } from "@/lib/site-settings";
import type { LegalPageBlock } from "@/lib/legal";

/**
 * docs/features/seo-and-search-foundation.md's own name for the firm — hardcoded the same
 * way `app/legal/[slug]/page.tsx`'s `generateMetadata` already hardcodes
 * `" — Kaalbert & Company Ltd"` in its title suffix; the firm's legal name isn't a
 * `site_settings` field (nothing in `content-management-admin.md`'s Data requirements names
 * one), so this isn't new technical debt, just the same existing precedent centralized for
 * this file's own use.
 */
const FIRM_NAME = "Kaalbert & Company Ltd";

const META_DESCRIPTION_MAX_LENGTH = 160;

/**
 * `NEXT_PUBLIC_SITE_URL` isn't provisioned yet (see `.env.example`) — falls back to the
 * production domain named throughout `docs/vision.md`/ADR 0004. Sitemap/canonical/OG URLs
 * are meant to describe the live site regardless of which host actually served the request
 * (a request from a Railway preview or local dev should still produce production URLs), so a
 * fixed fallback here is correct, not a placeholder to fix later.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kaalbert.com";
}

/**
 * seo-and-search-foundation.md's business rule: a blank `meta_description` never renders an
 * empty tag — it falls back to a truncated excerpt of the page's own body content. Every
 * page-type entity's `metaDescription` is a required (non-null) schema field today, so this
 * only fires once /admin (Milestone 7) allows a partner to actually save one blank — building
 * it now rather than waiting for that screen to exist, per this task's own acceptance
 * criterion.
 */
export function resolveMetaDescription(description: string, excerptSource: string): string {
  const trimmed = description.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  const excerpt = excerptSource.trim();
  if (excerpt.length <= META_DESCRIPTION_MAX_LENGTH) {
    return excerpt;
  }
  return `${excerpt.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}

/**
 * `legal_page.body`'s ordered block list has no single "excerpt" field of its own (see
 * `prisma/schema.prisma`'s `LegalPage` doc-comment) — this concatenates each block's own text
 * in order until it has enough for `resolveMetaDescription`'s excerpt fallback. `legal_page.
 * metaDescription` is a required field seeded for all four rows today, so this is a defensive
 * path, same as `resolveMetaDescription` itself.
 */
export function legalPageBodyExcerpt(blocks: LegalPageBlock[]): string {
  return blocks
    .map((block) => (block.kind === "table" ? "" : block.text))
    .filter((text) => text.length > 0)
    .join(" ");
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/", "/offers/business-health-check". */
  path: string;
}

/**
 * The shared per-page `<title>`/description/OG/Twitter shape every T2.1–T2.7 route builds
 * against (CLAUDE.md's "every public page type carries meta_title/meta_description ... OG/
 * Twitter tags" rule) — one function rather than seven near-identical literals, since every
 * caller needs the exact same shape with only title/description/path varying.
 */
export function buildPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const baseUrl = getSiteUrl();
  const url = new URL(path, baseUrl).toString();
  const imageUrl = new URL("/brand/logo-primary.png", baseUrl).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: FIRM_NAME,
      images: [{ url: imageUrl }],
      locale: "en_GH",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export interface OrganizationJsonLdData {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

/**
 * seo-and-search-foundation.md's business rule: Organization JSON-LD renders on every page
 * from one shared source — `site_settings` — never a per-page copy. Deliberately outside
 * GTM (ADR 0006's boundary, restated in this task's own architecture constraints): this is
 * search-engine structured data, not a measurement/advertising tag.
 */
export async function getOrganizationJsonLd(): Promise<OrganizationJsonLdData> {
  const settings = await getSiteSettings();
  const baseUrl = getSiteUrl();

  const data: OrganizationJsonLdData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: FIRM_NAME,
    url: baseUrl,
    logo: new URL("/brand/logo-primary.png", baseUrl).toString(),
    telephone: toTelHref(settings.phonePrimary).replace("tel:", ""),
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.split("\n").join(", "),
      addressCountry: "GH",
    },
  };

  // seo-and-search-foundation.md's edge case: an empty `social_profile_urls` at launch omits
  // `sameAs` entirely rather than rendering a placeholder or broken URL.
  if (settings.socialProfileUrls.length > 0) {
    data.sameAs = settings.socialProfileUrls;
  }

  return data;
}

/**
 * `GET /sitemap.xml`'s content, gathered from every published-content table T2.1–T2.7
 * introduced, plus `article` as of T4.2 (insights-engine.md is Milestone 4 — `article` didn't
 * exist before then). `landing_page` still isn't queried here — that table doesn't exist yet
 * (landing-page-template.md is Milestone 5) — this degrades gracefully to "not yet queryable"
 * for it, per this task's own architecture constraint, rather than erroring; whichever
 * milestone adds that table also adds its own query here, same as this task just did for
 * `article`.
 */
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const [home, offers, pages, legalPages, articles] = await Promise.all([
    prisma.homePageContent.findFirst({ orderBy: { id: "asc" }, select: { updatedAt: true } }),
    prisma.offer.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.legalPage.findMany({ select: { slug: true, updatedAt: true } }),
    // seo-and-search-foundation.md's own edge case: "the sitemap includes only published,
    // public pages — a draft article ... never appears in it" — `publishedAt: { not: null }`
    // is the same, only visibility check `lib/insights.ts` uses (T4.1's sole-source-of-truth
    // rule).
    prisma.article.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  if (home) {
    entries.push({ url: baseUrl, lastModified: home.updatedAt });
  }
  for (const offer of offers) {
    entries.push({ url: `${baseUrl}/offers/${offer.slug}`, lastModified: offer.updatedAt });
  }
  // T2.3–T2.6's shared `page` entity rows (capabilities/our-method/about/contact) — each
  // slug is already identical to its route (`prisma/seed.ts`'s own upserts), so no per-slug
  // mapping is needed beyond this.
  for (const page of pages) {
    entries.push({ url: `${baseUrl}/${page.slug}`, lastModified: page.updatedAt });
  }
  for (const legalPage of legalPages) {
    entries.push({
      url: `${baseUrl}/legal/${legalPage.slug}`,
      lastModified: legalPage.updatedAt,
    });
  }
  for (const article of articles) {
    entries.push({
      url: `${baseUrl}/insights/${article.slug}`,
      lastModified: article.updatedAt,
    });
  }

  return entries;
}
