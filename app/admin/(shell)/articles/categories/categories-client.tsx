"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  articleCount: number;
}

/**
 * Add/rename/retire, real interactivity against `/api/admin/categories*` — the mockup's own
 * inline `<script>` (`ui/mockups/g-admin-content/admin-categories-list.html`) is the one
 * dedicated-mockup screen in this task with real scripted behaviour, so its add-row layout
 * and duplicate-slug inline error are followed closely; rename/retire use a Dialog/
 * AlertDialog rather than the mockup's bare `<a href="#">` links, since a native
 * `window.prompt`/`confirm` would block all further page events (CLAUDE.md's browser-
 * automation note) and a bare link with no confirmation risks an accidental retire.
 */
export function CategoriesClient({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAddError(null);
    if (!newName.trim()) {
      return;
    }
    setAdding(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data: { status: string; category?: CategoryRow; message?: string } =
        await response.json();

      if (!response.ok || !data.category) {
        setAddError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setCategories([...categories, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  async function handleRename(id: number, name: string): Promise<string | null> {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data: { status: string; category?: CategoryRow; message?: string } =
      await response.json();

    if (!response.ok || !data.category) {
      return data.message ?? "Something went wrong — please try again.";
    }
    setCategories(
      categories
        .map((c) => (c.id === id ? data.category! : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    return null;
  }

  async function handleRetire(id: number) {
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories(categories.filter((c) => c.id !== id));
  }

  return (
    <div className="border-border overflow-x-auto rounded-md border">
      <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="newCatName">New category name</FieldLabel>
          <Input
            id="newCatName"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError(null);
            }}
            placeholder="e.g. Regulatory & Compliance"
          />
          {addError && <FieldError>{addError}</FieldError>}
        </Field>
        <Button type="button" disabled={adding} onClick={handleAdd}>
          Add category
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <CategoryRowItem
              key={category.id}
              category={category}
              onRename={handleRename}
              onRetire={handleRetire}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoryRowItem({
  category,
  onRename,
  onRetire,
}: {
  category: CategoryRow;
  onRename: (id: number, name: string) => Promise<string | null>;
  onRetire: (id: number) => Promise<void>;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitRename() {
    setSaving(true);
    setRenameError(null);
    const error = await onRename(category.id, renameValue);
    setSaving(false);
    if (error) {
      setRenameError(error);
      return;
    }
    setRenameOpen(false);
  }

  return (
    <TableRow>
      <TableCell className="font-semibold">{category.name}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs">{category.slug}</TableCell>
      <TableCell className="text-muted-foreground">{category.articleCount}</TableCell>
      <TableCell className="text-right">
        <Dialog
          open={renameOpen}
          onOpenChange={(open) => {
            setRenameOpen(open);
            if (open) {
              setRenameValue(category.name);
              setRenameError(null);
            }
          }}
        >
          <DialogTrigger
            render={
              <button
                type="button"
                className="text-primary mr-3.5 text-sm font-semibold hover:underline"
              />
            }
          >
            Rename
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename category</DialogTitle>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor={`rename-${category.id}`}>Name</FieldLabel>
              <Input
                id={`rename-${category.id}`}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
              {renameError && <FieldError>{renameError}</FieldError>}
            </Field>
            <DialogFooter>
              <Button type="button" disabled={saving} onClick={submitRename}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <button type="button" className="text-accent text-sm font-semibold hover:underline" />
            }
          >
            Retire
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retire &quot;{category.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                Its {category.articleCount} article{category.articleCount === 1 ? "" : "s"}{" "}
                won&apos;t be deleted — they&apos;ll fall back to no category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRetire(category.id)}>Retire</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
