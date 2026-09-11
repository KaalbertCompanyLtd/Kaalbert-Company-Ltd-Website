"use client";

import { useState } from "react";

import type { LinkedAdminUser } from "@/lib/admin-authors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

/**
 * The three admin-facing account actions this task's own session-42 addendum names — all
 * already-built, already-tested `lib/auth/*` mechanics; this panel is only the button/link
 * surface for them (`memory/technical-debt.md` → "No admin-facing way to deactivate/
 * reactivate an account, reset an existing partner's 2FA enrolment, or reset an existing
 * partner's password"). Only rendered when this author has a linked login at all — nothing
 * to act on otherwise (every one of the 5 seeded partners, today).
 */
export function AdminUserActionsPanel({ adminUser }: { adminUser: LinkedAdminUser }) {
  const [active, setActive] = useState(adminUser.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ kind: "2fa" | "password"; url: string } | null>(
    null,
  );

  async function toggleActive() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/admin-users/${adminUser.id}/${active ? "deactivate" : "reactivate"}`,
        { method: "POST" },
      );
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setActive(!active);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestReset(kind: "2fa" | "password") {
    setBusy(true);
    setError(null);
    setResetLink(null);
    try {
      const endpoint = kind === "2fa" ? "reset-2fa" : "reset-password";
      const response = await fetch(`/api/admin/admin-users/${adminUser.id}/${endpoint}`, {
        method: "POST",
      });
      const data: { status: string; url?: string; message?: string } = await response.json();
      if (!response.ok || !data.url) {
        setError(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setResetLink({ kind, url: data.url });
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-md border p-6">
      <div>
        <h2 className="mb-1 text-sm font-semibold">Login account</h2>
        <p className="text-muted-foreground text-xs">
          {adminUser.email} —{" "}
          {active ? (
            <Badge className="bg-pine-500 text-primary-foreground">Active</Badge>
          ) : (
            <Badge variant="outline">Deactivated</Badge>
          )}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {error}
        </p>
      )}

      {resetLink && (
        <div className="border-border bg-muted rounded-sm border p-3 text-sm">
          <p className="mb-1 font-semibold">
            {resetLink.kind === "2fa" ? "2FA re-enrolment link" : "Password reset link"} — relay
            this to the partner directly (not shown again after you leave this page):
          </p>
          <code className="block text-xs break-all">{resetLink.url}</code>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {active ? (
          <AlertDialog>
            <AlertDialogTrigger render={<Button type="button" variant="outline" disabled={busy} />}>
              Deactivate account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate this partner&apos;s account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ends every session they have open, anywhere, on their very next click. Their
                  public profile stays live — this only affects their login.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={toggleActive}>Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button type="button" variant="outline" disabled={busy} onClick={toggleActive}>
            Reactivate account
          </Button>
        )}

        <Button type="button" variant="outline" disabled={busy} onClick={() => requestReset("2fa")}>
          Reset 2FA enrolment
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => requestReset("password")}
        >
          Reset password
        </Button>
      </div>
    </div>
  );
}
