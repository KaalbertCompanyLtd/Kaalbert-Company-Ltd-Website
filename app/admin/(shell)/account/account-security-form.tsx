"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Props {
  name: string;
  email: string;
  roleLabel: string;
}

/**
 * Three independent sections, each its own small piece of state — deliberately not one big
 * form, since these are three unrelated actions (change a credential, set up a new device,
 * regenerate a recovery set), each with its own success/error state and nothing to lose by
 * submitting one without touching the others.
 */
export function AccountSecurityForm({ name, email, roleLabel }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <IdentitySection name={name} email={email} roleLabel={roleLabel} />
      <ChangePasswordSection />
      <TwoFactorSection />
    </div>
  );
}

function IdentitySection({ name, email, roleLabel }: Props) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-md border p-6">
      <h2 className="font-display text-h4 text-primary font-bold">Identity</h2>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs">Name</p>
          <p>{name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Email</p>
          <p>{email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Role</p>
          <Badge variant="outline">{roleLabel}</Badge>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("The new password and its confirmation don't match.");
      return;
    }

    setStatus("saving");
    try {
      const response = await fetch("/api/admin/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setStatus("success");
      setMessage("Password changed. You've been signed out everywhere — sign in again below.");
      setTimeout(() => router.push("/admin/login"), 2000);
    } catch {
      setStatus("error");
      setMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-md border p-6">
      <h2 className="font-display text-h4 text-primary font-bold">Change password</h2>

      {message && (
        <p
          role="alert"
          className={
            status === "success"
              ? "border-pine-500/30 bg-pine-500/10 text-pine-700 rounded-sm border p-3 text-sm"
              : "border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
          }
        >
          {message}
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="newPassword">
            New password <span className="text-muted-foreground font-normal">12+ characters</span>
          </FieldLabel>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
      </div>
      <Button
        type="button"
        disabled={status === "saving" || !currentPassword || !newPassword}
        onClick={handleSubmit}
        className="w-fit"
      >
        Change password
      </Button>
    </div>
  );
}

function TwoFactorSection() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  async function handleReissueDevice() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/reissue-2fa-setup", { method: "POST" });
      const data: { status: string; setupUrl?: string; message?: string } = await response.json();
      if (!response.ok || !data.setupUrl) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      window.location.assign(data.setupUrl);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerateCodes() {
    setBusy(true);
    setError(null);
    setNewCodes(null);
    try {
      const response = await fetch("/api/admin/auth/regenerate-backup-codes", { method: "POST" });
      const data: { status: string; codes?: string[]; message?: string } = await response.json();
      if (!response.ok || !data.codes) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setNewCodes(data.codes);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-md border p-6">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-h4 text-primary font-bold">Two-factor authentication</h2>
        <Badge className="bg-pine-500 text-primary-foreground">Enabled</Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Every account requires an authenticator app — there&apos;s no way to turn this off.
      </p>

      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {error}
        </p>
      )}

      {newCodes && (
        <div className="border-border bg-muted rounded-sm border p-3 text-sm">
          <p className="mb-2 font-semibold">
            Your new backup codes — save these somewhere safe, they won&apos;t be shown again:
          </p>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs sm:grid-cols-4">
            {newCodes.map((code) => (
              <code key={code} className="bg-background rounded-sm border px-2 py-1 text-center">
                {code}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={busy} onClick={handleReissueDevice}>
          Set up a new device
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={handleRegenerateCodes}>
          Regenerate backup codes
        </Button>
      </div>
    </div>
  );
}
