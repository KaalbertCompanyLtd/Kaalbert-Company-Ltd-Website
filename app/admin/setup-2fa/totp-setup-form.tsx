"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-body font-semibold text-primary-foreground transition-colors hover:bg-pine-700 disabled:cursor-not-allowed disabled:opacity-60";

export interface TotpSetupFormProps {
  /** The same `?token=` this page was reached with — not a secret being newly disclosed to
   * the client, it's already the URL the partner is looking at. */
  setupToken: string;
  qrCodeDataUrl: string;
  manualKey: string;
}

type Step = "confirm" | "backup-codes";

/**
 * The two-step client half of `/admin/setup-2fa`
 * (ui/mockups/f-admin-auth/admin-2fa-setup.html). Never imports anything from `lib/auth/`
 * (which touches `@/lib/prisma`) — CLAUDE.md's "no `use client` component may value-import a
 * `lib/` file that also imports `@/lib/prisma`" rule — everything it needs (the QR image,
 * the manual key, the setup token) arrives as props already resolved server-side by
 * `app/admin/setup-2fa/page.tsx`; this component only talks to the server again via
 * `POST /api/admin/auth/setup-2fa`.
 */
export function TotpSetupForm({ setupToken, qrCodeDataUrl, manualKey }: TotpSetupFormProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedCodesConfirmed, setSavedCodesConfirmed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/setup-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup_token: setupToken, code }),
      });
      const data: { status: string; backup_codes?: string[]; message?: string } =
        await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }

      setBackupCodes(data.backup_codes ?? []);
      setStep("backup-codes");
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — please try again.");
    }
  }

  if (step === "backup-codes") {
    return (
      <div>
        <span className="text-accent mb-2 block text-center text-[0.75rem] font-semibold tracking-[0.05em] uppercase">
          Step 2 of 2
        </span>
        <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
          Save your backup codes
        </h1>
        <p className="text-caption text-muted-foreground mb-5 text-center">
          Each code works once. Store them somewhere safe — if you lose your device and these codes,
          another partner will need to reset your 2FA enrolment.
        </p>
        <div className="bg-muted border-border mb-4 grid grid-cols-2 gap-2 rounded-sm border p-4">
          {backupCodes.map((backupCode) => (
            <span key={backupCode} className="text-body font-mono">
              {backupCode}
            </span>
          ))}
        </div>
        <Field orientation="horizontal" className="mb-4 items-start gap-2">
          <Checkbox
            id="savedCodes"
            checked={savedCodesConfirmed}
            onCheckedChange={(checked) => setSavedCodesConfirmed(checked === true)}
            className="mt-0.5"
          />
          <FieldLabel htmlFor="savedCodes" className="text-caption font-normal">
            I&apos;ve saved these backup codes somewhere secure.
          </FieldLabel>
        </Field>
        {savedCodesConfirmed ? (
          <Link href="/admin/login" className={BTN_PRIMARY}>
            Finish setup
          </Link>
        ) : (
          <button type="button" className={BTN_PRIMARY} disabled>
            Finish setup
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="text-accent mb-2 block text-center text-[0.75rem] font-semibold tracking-[0.05em] uppercase">
        Step 1 of 2
      </span>
      <h1 className="text-h3 font-display text-primary mb-1.5 text-center font-bold">
        Scan with your authenticator app
      </h1>
      <p className="text-caption text-muted-foreground mb-5 text-center">
        Google Authenticator, Authy, or your password manager&apos;s built-in TOTP support all work.
      </p>

      <Image
        src={qrCodeDataUrl}
        alt="QR code for authenticator app setup"
        width={168}
        height={168}
        unoptimized
        className="border-border mx-auto mb-3 rounded-sm border"
      />

      <details className="mb-5 text-center">
        <summary className="text-primary cursor-pointer text-[0.75rem] font-semibold">
          Can&apos;t scan? Enter the setup key manually
        </summary>
        <p className="text-caption text-muted-foreground bg-muted mt-2 rounded-sm p-2 font-mono break-all">
          {manualKey}
        </p>
      </details>

      <form onSubmit={handleSubmit} noValidate>
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
          {status === "submitting" ? "Confirming…" : "Confirm and continue"}
        </button>
      </form>
    </div>
  );
}
