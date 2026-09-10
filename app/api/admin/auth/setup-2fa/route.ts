import { NextResponse } from "next/server";

import { confirmTotpSetup, TotpSetupError } from "@/lib/auth/totp-setup";

/**
 * Confirms `/admin/setup-2fa`'s TOTP enrolment (T6.2) — request: `{setup_token, code}`;
 * response: `{status: "ok", backup_codes: string[]}` on success, the one and only time those
 * codes are ever sent anywhere. Not one of `admin-authentication.md`'s three named
 * Interfaces (`login`/`verify-totp`/`verify-backup-code`, all T6.3/T6.4's login-time
 * endpoints) — this is setup-time confirmation, a different ceremony with a different
 * precondition (a `setup_token`, not a `challenge_token` from a login session that doesn't
 * exist yet). Parses the request body and shapes the response only; every real rule
 * (token/expiry/code validation, backup-code generation, `totp_enabled` flip) lives in
 * `lib/auth/totp-setup.ts` (CLAUDE.md's "business logic lives in `lib/`" rule).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.setup_token !== "string" ||
    typeof body.code !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const backupCodes = await confirmTotpSetup(body.setup_token, body.code);
    return NextResponse.json({ status: "ok", backup_codes: backupCodes }, { status: 200 });
  } catch (error) {
    if (error instanceof TotpSetupError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 400 });
    }
    throw error;
  }
}
