"use client";

import { useState } from "react";
import Link from "next/link";

import type { UnlinkedAuthor } from "@/lib/admin-team";
import type { AdminRoleValue } from "@/lib/admin-role-options";
import { AdminImageUploadButton } from "@/components/admin-image-upload-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

function getInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

type Mode = "link" | "create";

interface SuccessResult {
  authorId: number;
  emailSent: boolean;
  setupUrl?: string;
  password?: string;
}

/**
 * `add-partner-form.tsx` (session 60, §5 of the plan) — two modes: link a real, already-
 * seeded `Author` profile to a brand-new login, or create both at once. Either way, `POST
 * /api/admin/team` generates the password and sends the invite email
 * (`lib/admin-team.ts`'s `createPartnerAccount`) — this form never sees or sets a password
 * itself, except in the email-delivery-failure fallback rendered below.
 */
export function AddPartnerForm({ unlinkedAuthors }: { unlinkedAuthors: UnlinkedAuthor[] }) {
  const [mode, setMode] = useState<Mode>(unlinkedAuthors.length > 0 ? "link" : "create");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRoleValue>(
    unlinkedAuthors[0]?.title === "Lead Partner" ? "OWNER" : "PARTNER",
  );

  const [authorId, setAuthorId] = useState<string>(
    unlinkedAuthors.length > 0 ? String(unlinkedAuthors[0].id) : "",
  );

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Partner");
  const [practiceArea, setPracticeArea] = useState("");
  const [credentials, setCredentials] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");
  const [bio, setBio] = useState("");

  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  const selectedAuthor = unlinkedAuthors.find((a) => String(a.id) === authorId);

  function handleAuthorChange(value: string | null) {
    if (!value) return;
    setAuthorId(value);
    const author = unlinkedAuthors.find((a) => String(a.id) === value);
    setRole(author?.title === "Lead Partner" ? "OWNER" : "PARTNER");
  }

  async function handleSubmit() {
    setStatus("saving");
    setErrorMessage(null);

    const body =
      mode === "link"
        ? { mode: "link", email, role, authorId: Number(authorId) }
        : {
            mode: "create",
            email,
            role,
            name,
            photoUrl,
            title,
            practiceArea,
            credentials: credentials.trim() ? credentials : null,
            personalStatement,
            bio,
          };

    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: {
        status: string;
        message?: string;
        authorId?: number;
        emailSent?: boolean;
        setupUrl?: string;
        password?: string;
      } = await response.json();

      if (!response.ok || data.authorId === undefined || data.emailSent === undefined) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setStatus("idle");
      setResult({
        authorId: data.authorId,
        emailSent: data.emailSent,
        setupUrl: data.setupUrl,
        password: data.password,
      });
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  if (result) {
    return (
      <div className="border-border bg-card flex flex-col gap-4 rounded-md border p-6">
        <h2 className="font-display text-h4 text-primary font-bold">Account created</h2>
        {result.emailSent ? (
          <p className="text-sm">
            An invite email with a temporary password and a 2FA setup link has been sent to{" "}
            <strong>{email}</strong>.
          </p>
        ) : (
          <div className="border-border bg-muted flex flex-col gap-2 rounded-sm border p-3 text-sm">
            <p className="font-semibold">
              The account was created, but the invite email couldn&apos;t be sent — relay these to
              the partner directly (not shown again after you leave this page):
            </p>
            <p>
              Password: <code className="break-all">{result.password}</code>
            </p>
            <p>
              Setup link: <code className="block text-xs break-all">{result.setupUrl}</code>
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <Link
            href={`/admin/team/${result.authorId}`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            View their profile
          </Link>
          <Link href="/admin/team" className="text-muted-foreground text-sm hover:underline">
            Back to Team
          </Link>
        </div>
      </div>
    );
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

      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <TabsList>
          <TabsTrigger value="link" disabled={unlinkedAuthors.length === 0}>
            Link an existing profile
          </TabsTrigger>
          <TabsTrigger value="create">Create a brand-new partner</TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="mt-4 flex flex-col gap-5">
          {unlinkedAuthors.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Every existing partner profile already has a login. Use &ldquo;Create a brand-new
              partner&rdquo; instead.
            </p>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="linkAuthor">Partner profile</FieldLabel>
                <Select
                  value={authorId}
                  onValueChange={handleAuthorChange}
                  items={unlinkedAuthors.map((a) => ({ value: String(a.id), label: a.name }))}
                >
                  <SelectTrigger id="linkAuthor" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedAuthors.map((author) => (
                      <SelectItem key={author.id} value={String(author.id)}>
                        {author.name} — {author.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedAuthor && (
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-md">
                    {selectedAuthor.photoUrl && (
                      <AvatarImage src={selectedAuthor.photoUrl} alt={selectedAuthor.name} />
                    )}
                    <AvatarFallback className="bg-primary text-brass-300 font-display rounded-md font-bold">
                      {getInitials(selectedAuthor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-semibold">{selectedAuthor.name}</p>
                    <p className="text-muted-foreground">{selectedAuthor.title}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-4 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-md">
              {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
              <AvatarFallback className="bg-primary text-brass-300 font-display rounded-md text-xl font-bold">
                {getInitials(name || "?")}
              </AvatarFallback>
            </Avatar>
            <AdminImageUploadButton
              onUploaded={setPhotoUrl}
              label={photoUrl ? "Replace photo" : "Upload a photo"}
            />
          </div>

          <Field>
            <FieldLabel htmlFor="newAuthorName">Name</FieldLabel>
            <Input id="newAuthorName" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="newAuthorTitle">
                Title <span className="text-muted-foreground font-normal">e.g. Lead Partner</span>
              </FieldLabel>
              <Input id="newAuthorTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="newAuthorPracticeArea">Practice area</FieldLabel>
              <Input
                id="newAuthorPracticeArea"
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="newAuthorCredentials">
              Credentials{" "}
              <span className="text-muted-foreground font-normal">leave blank if none</span>
            </FieldLabel>
            <Input
              id="newAuthorCredentials"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="newAuthorPersonalStatement">
              Personal statement{" "}
              <span className="text-muted-foreground font-normal">shown on /about</span>
            </FieldLabel>
            <Textarea
              id="newAuthorPersonalStatement"
              rows={4}
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="newAuthorBio">Bio</FieldLabel>
            <Textarea
              id="newAuthorBio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
        </TabsContent>
      </Tabs>

      <div className="border-border grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="partnerEmail">Login email</FieldLabel>
          <Input
            id="partnerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="partnerRole">Role</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => value && setRole(value as AdminRoleValue)}
            items={[
              { value: "OWNER", label: "Owner" },
              { value: "PARTNER", label: "Partner" },
            ]}
          >
            <SelectTrigger id="partnerRole" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="PARTNER">Partner</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button
        type="button"
        disabled={
          status === "saving" || !email.trim() || (mode === "link" ? !authorId : !name.trim())
        }
        onClick={handleSubmit}
        className="w-fit"
      >
        Send invite
      </Button>
    </div>
  );
}
