"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-body font-semibold text-primary-foreground transition-colors hover:bg-pine-700 disabled:cursor-not-allowed disabled:opacity-60";

type Step = "password" | "totp";
type Status = "idle" | "submitting" | "error";

/**
 * The two-step client half of `/admin/login`: password (`ui/mockups/f-admin-auth/
 * admin-login.html`), then a 6-digit TOTP code (no dedicated mockup for this step — inferred
 * from T6.2's own `totp-setup-form.tsx` Step-1 pattern, per `docs/tasks/06-admin-auth.md`
 * T6.3's own note). Never imports `lib/auth/` (which touches `@/lib/prisma`) — same rule
 * `totp-setup-form.tsx` already follows — everything happens via `fetch` against the two API
 * routes this task adds.
 */
export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: { status: string; challenge_token?: string; message?: string } =
        await response.json();

      if (!response.ok || !data.challenge_token) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setChallengeToken(data.challenge_token);
      setStep("totp");
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  async function handleTotpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeToken) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_token: challengeToken, code }),
      });
      const data: { status: string; message?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      // The verify-totp response above already set the session cookie via Set-Cookie — the
      // browser applies that to its cookie jar immediately, before this next navigation's
      // own request goes out, so proxy.ts sees it and lets the request through.
      router.push("/admin");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (step === "totp") {
    return (
      <div>
        <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
          Enter your authenticator code
        </h1>
        <p className="text-caption text-muted-foreground mb-5 text-center">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>

        <form onSubmit={handleTotpSubmit} noValidate>
          <Field className="mb-4">
            <FieldLabel htmlFor="code">Enter the 6-digit code from your app</FieldLabel>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              className="text-center font-mono text-[1.25rem] tracking-[0.3em]"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </Field>

          {status === "error" && errorMessage && (
            <FieldError className="mb-3" role="alert">
              {errorMessage}
            </FieldError>
          )}

          <button
            type="submit"
            className={BTN_PRIMARY}
            disabled={status === "submitting" || code.length !== 6}
          >
            {status === "submitting" ? "Verifying…" : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
        Partner Login
      </h1>
      <p className="text-caption text-muted-foreground mb-5 text-center">
        Sign in to manage site content and enquiries.
      </p>

      <form onSubmit={handlePasswordSubmit} noValidate>
        <Field className="mb-4">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field className="mb-4">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {status === "error" && errorMessage && (
          <FieldError className="mb-3" role="alert">
            {errorMessage}
          </FieldError>
        )}

        <button type="submit" className={BTN_PRIMARY} disabled={status === "submitting"}>
          {status === "submitting" ? "Signing in…" : "Continue"}
        </button>
      </form>

      <p className="text-caption text-muted-foreground mt-6 text-center">
        You&apos;ll be asked for your authenticator code next. Two-factor authentication is required
        for every admin account and cannot be skipped.
      </p>
    </div>
  );
}
