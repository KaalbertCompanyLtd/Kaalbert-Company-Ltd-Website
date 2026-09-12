"use client";

import { useState } from "react";

import type { AuthorEditData } from "@/lib/admin-authors";
import { AdminImageUploadButton } from "@/components/admin-image-upload-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** First-and-second-word initials, matching `lib/about.ts`'s `getInitials` exactly — not
 * imported from there since that file also imports `@/lib/prisma` (CLAUDE.md's rule against
 * a `"use client"` component importing a value from a `@/lib/prisma`-importing `lib/` file). */
function getInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * `published` was a computed, read-only badge until session 60 — now a real `Switch` the
 * viewer controls directly (`lib/admin-authors.ts`'s `updateAuthor` still rejects turning it
 * on while a required field is blank, but no longer forces it off just because a field went
 * blank, and no longer blocks turning it off for a partner who already has articles — see
 * that function's own doc-comment). Reuses `AdminImageUploadButton` (T7.2) as-is for the
 * photo field — confirmed still the right mechanism at T7.5.
 *
 * `readOnly` added at session 60 — true when the viewer is neither this profile's own
 * partner nor an Owner (`lib/auth/current-user.ts`'s `canEditAuthorProfile`); the page itself
 * decides this server-side, this component just renders the disabled state rather than a
 * dead-end form that would only reject on submit.
 */
export function AuthorEditorForm({
  initial,
  readOnly = false,
}: {
  initial: AuthorEditData;
  readOnly?: boolean;
}) {
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

  const canPublish = Boolean(name.trim() && practiceArea.trim() && personalStatement.trim());

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
          published,
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-md border p-6">
      {readOnly && (
        <p className="border-border bg-muted text-muted-foreground rounded-sm border p-3 text-sm">
          You can view this profile, but only an Owner or the partner themselves can edit it.
        </p>
      )}

      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Switch
          checked={published}
          disabled={readOnly || (!published && !canPublish)}
          onCheckedChange={(checked) => setPublished(checked === true)}
          aria-label={published ? "Unpublish this profile" : "Publish this profile"}
        />
        {published ? (
          <Badge className="bg-pine-500 text-primary-foreground">Published</Badge>
        ) : (
          <Badge variant="outline">Not published</Badge>
        )}
        {!canPublish && (
          <span className="text-muted-foreground text-xs">
            Name, practice area, and personal statement are all required to publish.
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
        {!readOnly && (
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
        )}
      </div>

      <Field>
        <FieldLabel htmlFor="authorName">Name</FieldLabel>
        <Input
          id="authorName"
          value={name}
          disabled={readOnly}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="authorTitle">
            Title <span className="text-muted-foreground font-normal">e.g. Lead Partner</span>
          </FieldLabel>
          <Input
            id="authorTitle"
            value={title}
            disabled={readOnly}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="authorPracticeArea">Practice area</FieldLabel>
          <Input
            id="authorPracticeArea"
            value={practiceArea}
            disabled={readOnly}
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
          disabled={readOnly}
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
          disabled={readOnly}
          onChange={(e) => setPersonalStatement(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="authorBio">Bio</FieldLabel>
        <Textarea
          id="authorBio"
          rows={3}
          value={bio}
          disabled={readOnly}
          onChange={(e) => setBio(e.target.value)}
        />
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
          disabled={readOnly}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="max-w-[160px]"
        />
      </Field>

      {!readOnly && (
        <Button type="button" disabled={status === "saving"} onClick={handleSave} className="w-fit">
          Save
        </Button>
      )}
    </div>
  );
}
