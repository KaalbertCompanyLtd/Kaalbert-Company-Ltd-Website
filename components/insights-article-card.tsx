import Link from "next/link";

import type { InsightsArticleCard } from "@/lib/insights";

/**
 * First-letter-of-first-two-real-words initials for the card thumbnail fallback (e.g.
 * "Leadership & Team" → "LT", "Cash & Financial Discipline" → "CF"). Deliberately not
 * `lib/about.ts`'s `getInitials` — that helper is documented and verified specifically for
 * person names (`app/about/page.tsx`'s partner avatars); real category names seeded at T4.4
 * (e.g. "Leadership & Team") contain a bare "&" as their second word, which `getInitials`'s
 * naive first-and-second-word split would render as "L&" — skip symbol-only words instead.
 */
function categoryInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /[a-zA-Z]/.test(word));
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

/**
 * One article's card — the single shared presentation used by both the Insights index (T4.2)
 * and Home's featured-Insights section (T2.1/T2.1 follow-up). Extracted here (not duplicated
 * per page) after a real gap was found once real content existed: Home's own card had drifted
 * into a visually different, unlinked `<div>` with no way to reach the article or the index —
 * see memory/decision-log.md (session 27) for the full account.
 */
export function ArticleCard({ article }: { article: InsightsArticleCard }) {
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="border-border bg-card group flex flex-col overflow-hidden rounded-md border shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="from-pine-700 to-pine-500 relative flex h-[140px] w-full items-center justify-center overflow-hidden bg-gradient-to-br">
        {article.previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- previewImage is admin-supplied, arbitrary-origin content, not a static local asset next/image's optimizer is meant for.
          <img src={article.previewImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-2xl text-white/85">
            {categoryInitials(article.category?.name ?? article.title)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {article.category && (
          <span className="text-caption text-accent font-semibold tracking-[0.06em] uppercase">
            {article.category.name}
          </span>
        )}
        <h3 className="font-display text-primary text-[1.0625rem] leading-snug font-bold group-hover:underline">
          {article.title}
        </h3>
        <p className="text-body text-muted-foreground mb-0 flex-1">{article.excerpt}</p>
        <div className="border-border text-caption text-muted-foreground border-t pt-3">
          <strong className="text-foreground">{article.authorName}</strong> ·{" "}
          {article.authorPracticeArea}
        </div>
      </div>
    </Link>
  );
}
