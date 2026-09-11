"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-body font-semibold text-primary-foreground transition-colors hover:bg-pine-700 disabled:cursor-not-allowed disabled:opacity-60";
const LINK_SUBTLE = "text-caption text-primary font-semibold hover:underline";

type Status = "idle" | "submitting" | "error" | "sent";

/**
 * The client half of `/admin/forgot-password` (T6.7). Never imports `lib/auth/` (which
 * touches `@/lib/prisma`) — same rule `login-form.tsx`/`totp-setup-form.tsx` already follow —
 * talks only to `POST /api/admin/auth/request-password-reset`.
 *
 * Swaps to one fixed success message on any non-error response, never revealing whether the
 * submitted email actually matched an account — the same no-enumeration rule
 * `requestPasswordReset` itself already enforces server-side; this form just doesn't
 * introduce a client-side leak on top of it (e.g. a different message for "sent" vs. "no such
 * account").
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { status: string; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
          Check your email
        </h1>
        <p className="text-caption text-muted-foreground mb-5 text-center">
          If an account exists for {email}, we&apos;ve sent a link to reset your password. It
          expires in 1 hour.
        </p>
        <p className="text-center">
          <Link href="/admin/login" className={LINK_SUBTLE}>
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
        Reset your password
      </h1>
      <p className="text-caption text-muted-foreground mb-5 text-center">
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field className="mb-4">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        {status === "error" && errorMessage && (
          <FieldError className="mb-3" role="alert">
            {errorMessage}
          </FieldError>
        )}

        <button type="submit" className={BTN_PRIMARY} disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/admin/login" className={LINK_SUBTLE}>
          Back to login
        </Link>
      </p>
    </div>
  );
}
