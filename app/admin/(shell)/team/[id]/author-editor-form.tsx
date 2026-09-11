"use client";

import { useState } from "react";

import type { AuthorEditData } from "@/lib/admin-authors";
import { AdminImageUploadButton } from "@/components/admin-image-upload-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** First-and-second-word initials, matching `lib/about.ts`'s `getInitials` exactly — not
 * imported from there since that file also imports `@/lib/prisma` (CLAUDE.md's rule against
 * a `"use client"` component importing a value from a `@/lib/prisma`-importing `lib/` file). */
function getInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * `published` is never a directly-editable field here — it's a computed, read-only badge
 * (`lib/admin-authors.ts`'s `updateAuthor` computes it from name/practiceArea/
 * personalStatement) — reflects what the *next save* would produce given the fields as
 * currently typed, so a partner sees the consequence of leaving something blank before they
 * save, not only after. Reuses `AdminImageUploadButton` (T7.2) as-is for the photo field —
 * confirmed still the right mechanism at T7.5 (that task needed a genuinely separate
 * non-image pipeline for a PDF download, but a partner photo is a real image).
 */
export function AuthorEditorForm({ initial }: { initial: AuthorEditData }) {
  const [name, setName] = useState(initial.name);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [title, setTitle] = useState(initial.title);
  const [practiceArea, setPracticeArea] = useState(initial.practiceArea);
  const [credentials, setCredentials] = useState(initial.credentials ?? "");
  const [personalStatement, setPersonalStatement] = useState(initial.personalStatement);
  const [bio, setBio] = useState(initial.bio);
  const [order, setOrder] = useState(initial.order);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [published, setPublished] = useState(initial.published);

  const wouldPublish = Boolean(name.trim() && practiceArea.trim() && personalStatement.trim());

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/authors/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          photoUrl,
          title,
          practiceArea,
          credentials: credentials.trim() ? credentials : null,
          personalStatement,
          bio,
          order,
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("idle");
      setPublished(wouldPublish);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-md border p-6">
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        {published ? (
          <Badge className="bg-pine-500 text-primary-foreground">Published</Badge>
        ) : (
          <Badge variant="outline">Not published</Badge>
        )}
        {wouldPublish !== published && (
          <span className="text-muted-foreground text-xs">
            Saving now would {wouldPublish ? "publish" : "unpublish"} this profile.
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-20 rounded-md">
          {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
          <AvatarFallback className="bg-primary text-brass-300 font-display rounded-md text-2xl font-bold">
            {getInitials(name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <AdminImageUploadButton
            onUploaded={setPhotoUrl}
            label={photoUrl ? "Replace photo" : "Upload a photo"}
          />
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="text-muted-foreground w-fit text-xs hover:underline"
            >
              Remove photo
            </button>
          )}
          <p className="text-muted-foreground text-xs">
            No photo yet? An initials avatar shows in its place — never a placeholder image.
          </p>
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor="authorName">Name</FieldLabel>
        <Input id="authorName" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="authorTitle">
            Title <span className="text-muted-foreground font-normal">e.g. Lead Partner</span>
          </FieldLabel>
          <Input id="authorTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="authorPracticeArea">Practice area</FieldLabel>
          <Input
            id="authorPracticeArea"
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="authorCredentials">
          Credentials{" "}
          <span className="text-muted-foreground font-normal">
            stored exactly as supplied — never abbreviated or invented; leave blank if none
          </span>
        </FieldLabel>
        <Input
          id="authorCredentials"
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="authorPersonalStatement">
          Personal statement{" "}
          <span className="text-muted-foreground font-normal">shown on /about</span>
        </FieldLabel>
        <Textarea
          id="authorPersonalStatement"
          rows={4}
          value={personalStatement}
          onChange={(e) => setPersonalStatement(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="authorBio">Bio</FieldLabel>
        <Textarea id="authorBio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="authorOrder">
          Display order{" "}
          <span className="text-muted-foreground font-normal">lowest = featured on /about</span>
        </FieldLabel>
        <Input
          id="authorOrder"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="max-w-[160px]"
        />
      </Field>

      <Button type="button" disabled={status === "saving"} onClick={handleSave} className="w-fit">
        Save
      </Button>
    </div>
  );
}
