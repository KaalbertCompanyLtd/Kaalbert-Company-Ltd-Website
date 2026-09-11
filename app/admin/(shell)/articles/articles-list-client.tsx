"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ArticlesListItem {
  id: number;
  title: string;
  authorName: string;
  categoryName: string | null;
  status: "published" | "draft";
  publishedAt: string | null;
}

const PAGE_SIZE = 10;
const ALL = "all";

/**
 * Search/status/category filtering and pagination, client-side — matches
 * `ui/mockups/g-admin-content/admin-articles-list.html`'s own inline script behaviour.
 * Purely operates on the plain `articles`/`categories` arrays passed as props (never a
 * `lib/` import) — safe for a `"use client"` component per CLAUDE.md's rule.
 */
export function ArticlesListClient({
  articles,
  categories,
}: {
  articles: ArticlesListItem[];
  categories: string[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesStatus = statusFilter === ALL || article.status === statusFilter;
      const matchesCategory = categoryFilter === ALL || article.categoryName === categoryFilter;
      const matchesSearch = !q || article.title.toLowerCase().includes(q);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void) {
    return (value: string | null) => {
      setter(value ?? ALL);
      setPage(1);
    };
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Search articles…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <div className="flex gap-3">
          <Select
            value={statusFilter}
            onValueChange={updateFilter(setStatusFilter)}
            items={{ [ALL]: "All statuses", published: "Published", draft: "Draft" }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={updateFilter(setCategoryFilter)}
            items={{
              [ALL]: "All categories",
              ...Object.fromEntries(categories.map((c) => [c, c])),
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-body text-muted-foreground">No articles match.</p>
      ) : (
        <div className="border-border overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-semibold whitespace-normal">{article.title}</TableCell>
                  <TableCell>{article.authorName}</TableCell>
                  <TableCell>{article.categoryName ?? "—"}</TableCell>
                  <TableCell>
                    {article.status === "published" ? (
                      <Badge className="bg-pine-500 text-primary-foreground">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-primary text-sm font-semibold hover:underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
