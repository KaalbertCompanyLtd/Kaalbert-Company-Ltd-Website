# Feature: SEO & Search Foundation

Phase 1. Document 13.03, Section 10; NFR-5. Named only as a one-line non-functional
requirement elsewhere in this project's docs — this feature operationalizes it, closing a gap
found in a full requirements-coverage audit before Phase 6 task planning.

## Goal

Give the site the mechanical search foundation every other page-level feature in this project
assumes exists — a sitemap search engines can crawl, structured data identifying the firm
itself (not just its articles), and a real per-page title/description instead of one
inherited default — so that `vision.md`'s stated route to being found ("own specific,
problem-shaped questions," per Document 13.03 Section 7) has the infrastructure under it, not
just the content.

## What this is not

Article-level structured data, OG/Twitter metadata, and the "every article and every other
page" site-wide metadata rule are already specified in `insights-engine.md` (FR-3.5) — this
feature does not repeat that, it supplies the two things that rule assumed but nothing
defined: a per-page place to _put_ a title/description, and the sitewide (not per-article)
structured data identifying Kaalbert & Company itself.

## User flow

There is no visitor-facing screen — this is infrastructure every page-rendering route reads
from, the same way every page already reads `site_settings` for contact details.

1. A page is requested. The rendering layer reads that page's own `meta_title` and
   `meta_description` field (added to every page-type entity as part of this fix —
   `home_page_content`, `offer`, the new `page` entity shared by Capabilities/Our Method,
   `landing_page`; `article` and `legal_page` already had these fields) and renders them as
   the page's `<title>` and meta description tag, alongside the Organization structured data
   below.
2. A search engine or crawler requests `/sitemap.xml` and receives every published, public
   URL — Home, the three offer pages, Capabilities, Our Method, About, Contact, every
   published Insights article, every legal page, every landing page instance — regenerated
   whenever content is published or unpublished, not hand-maintained.
3. Google Search Console and Google Business Profile are connected under firm-owned
   credentials (Document 13.03, Section 11.3's account-ownership rule, applied here) as a
   launch-handover step, not a recurring content task.

## Business rules

- Every page-type entity carries its own `meta_title` and `meta_description` — a partner
  editing a page's copy in admin edits these in the same screen, not a separate SEO panel,
  so they can never silently drift out of sync with the page's actual content.
- A page missing its meta description does not block publish (unlike a preview image on an
  article, or a fee band without its scope cap) — it falls back to a truncated excerpt of the
  page's own body content, since a missing description is a quality issue, not a compliance
  one, and should never be the reason a partner can't publish real content.
- The sitemap includes only published, public pages — a draft article, an unpublished legal
  page revision, or a 404 slug never appears in it.
- Organization structured data (JSON-LD, `schema.org/Organization`) renders on every page
  from one shared source: name, logo, address and phone from `site_settings`
  (`content-management-admin.md`), plus the firm's social profile URLs (`sameAs`) — a new
  `social_profile_urls` field added to `site_settings` as part of this fix, since it didn't
  exist to hold them.
- Google Search Console and Google Business Profile connection follow the same
  account-ownership rule already governing every other external account in this project
  (Document 13.03, Section 11.3; `measurement-and-attribution.md`'s Account Ownership
  Register) — firm-owned credentials, the build team added as a removable user, not the
  reverse.

## Data requirements

- `social_profile_urls` — added to the existing `site_settings` singleton
  (`content-management-admin.md`): a list of the firm's real social profile URLs (LinkedIn
  company page at minimum, per Document 13.03's own repeated references to LinkedIn as a
  principal distribution channel), feeding the Organization schema's `sameAs` field.
- `meta_title`, `meta_description` — added to `home_page_content` (`home-page.md`), `offer`
  (`core-offer-pages.md`), the new `page` entity (`capabilities-page.md`, `our-method-page.md`),
  and `landing_page` (`landing-page-template.md`). `article` and `legal_page` already carry
  equivalent fields and are unchanged by this fix.

## Interfaces

- `GET /sitemap.xml` — generated from the current set of published pages/articles/legal
  pages/landing pages, not maintained as a static file.
- Organization JSON-LD rendered in the `<head>` of every page, sourced from `site_settings`.
- Meta title/description editing: no new interface — it rides the existing per-page editors
  in `content-management-admin.md`'s Pages, Offers, and Landing Pages content areas.

## Edge cases

- A page is unpublished after being indexed: it drops out of the next sitemap generation:
  search engines discover its removal on their own next crawl, same as any standard site.
- A partner leaves meta_description blank: falls back to a truncated body excerpt (see
  business rule above), never an empty tag.
- `site_settings.social_profile_urls` is empty at launch (a social profile not yet created):
  the Organization schema's `sameAs` field is simply omitted, not rendered with a placeholder
  or broken URL.
