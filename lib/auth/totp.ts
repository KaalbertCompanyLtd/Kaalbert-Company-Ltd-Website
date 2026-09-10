import { generateSecret } from "otplib";

/**
 * `otplib` is this project's vetted RFC 6238 library (ADR 0007) — the single function this
 * task needs from it (a raw secret to store, encrypted, in `admin_user.totp_secret`). QR/
 * `otpauth://` URI generation and code verification are T6.2's (`/admin/setup-2fa`) and
 * T6.3's (login) jobs, both built directly against `otplib`'s `generateURI`/`verify` — not
 * wrapped here ahead of need.
 */
export function generateTotpSecret(): string {
  return generateSecret();
}
