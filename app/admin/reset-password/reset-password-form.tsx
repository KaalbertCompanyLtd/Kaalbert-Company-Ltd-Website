"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-body font-semibold text-primary-foreground transition-colors hover:bg-pine-700 disabled:cursor-not-allowed disabled:opacity-60";

const MIN_PASSWORD_LENGTH = 12;

export interface ResetPasswordFormProps {
  /** The same `?token=` this page was reached with — not newly disclosed to the client, it's
   * already the URL the partner is looking at (same reasoning as `TotpSetupFormProps.setupToken`). */
  token: string;
}

type Status = "idle" | "submitting" | "error" | "done";

/**
 * The client half of `/admin/reset-password` (T6.7). Never imports `lib/auth/` (which
 * touches `@/lib/prisma`) — same rule every other admin-auth client form in this epic
 * follows — talks only to `POST /api/admin/auth/reset-password`.
 *
 * Checks the two password fields match and meet the minimum length client-side before
 * submitting (a fast, friendly check), but the real enforcement is server-side in
 * `confirmPasswordReset` — this client check is convenience, not the security boundary.
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus("error");
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data: { status: string; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (status === "done") {
    return (
      <div>
        <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
          Password updated
        </h1>
        <p className="text-caption text-muted-foreground mb-5 text-center">
          Your password has been changed, and any other signed-in sessions have been signed out.
          Sign in again with your new password.
        </p>
        <button type="button" className={BTN_PRIMARY} onClick={() => router.push("/admin/login")}>
          Continue to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
        Choose a new password
      </h1>
      <p className="text-caption text-muted-foreground mb-5 text-center">
        Must be at least {MIN_PASSWORD_LENGTH} characters long.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field className="mb-4">
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {tooShort && (
            <p className="text-caption text-muted-foreground mt-1">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </Field>
        <Field className="mb-4">
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {mismatch && (
            <p className="text-destructive text-caption mt-1">Passwords don&apos;t match.</p>
          )}
        </Field>

        {status === "error" && errorMessage && (
          <FieldError className="mb-3" role="alert">
            {errorMessage}
          </FieldError>
        )}

        <button
          type="submit"
          className={BTN_PRIMARY}
          disabled={status === "submitting" || !password || !confirmPassword}
        >
          {status === "submitting" ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
