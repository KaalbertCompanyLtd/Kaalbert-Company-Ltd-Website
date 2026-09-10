import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Thrown for a malformed, tampered, or expired challenge token. The message is generic —
 * never distinguishes "tampered" from "expired" to the caller, and never includes the token
 * itself or any admin data.
 */
export class ChallengeTokenError extends Error {}

// Long enough to type a 6-digit code, short enough that this isn't a standing credential in
// its own right — it only proves "the password step just succeeded," nothing more.
const CHALLENGE_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

interface ChallengePayload {
  adminUserId: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_CHALLENGE_TOKEN_SECRET;
  if (!secret) {
    throw new ChallengeTokenError(
      "ADMIN_CHALLENGE_TOKEN_SECRET is not set — cannot issue/verify login challenge tokens. See CLAUDE.local.md.",
    );
  }
  return secret;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

/**
 * Between `POST /api/admin/auth/login`'s password step and `verify-totp`'s code step, there
 * is no session yet to carry state in — this HMAC-signed, self-contained token is that
 * state instead. Uses Node's own `crypto.createHmac`/`timingSafeEqual` directly (a standard
 * signed-token pattern, not a hand-rolled cipher or hash — same "vetted primitive, not
 * invented" category as `lib/auth/totp-encryption.ts`'s AES-256-GCM use, ADR 0007). Reuses
 * `ADMIN_CHALLENGE_TOKEN_SECRET` (renamed at this task from its original `NEXTAUTH_SECRET`
 * placeholder — see `.env.example`'s own comment). Deliberately stateless (no database row):
 * this token's entire lifetime is under 5 minutes and it carries no information worth
 * auditing or revoking early, unlike the real session `lib/auth/session.ts` issues after
 * TOTP succeeds.
 */
export function issueChallengeToken(adminUserId: number): string {
  const payload: ChallengePayload = { adminUserId, exp: Date.now() + CHALLENGE_TOKEN_LIFETIME_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Returns the `admin_user.id` the token was issued for, or throws `ChallengeTokenError`. */
export function verifyChallengeToken(token: string): number {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    throw new ChallengeTokenError("Invalid or expired login attempt — please sign in again.");
  }

  const expectedSignature = sign(payloadB64);
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    throw new ChallengeTokenError("Invalid or expired login attempt — please sign in again.");
  }

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    throw new ChallengeTokenError("Invalid or expired login attempt — please sign in again.");
  }

  if (typeof payload.adminUserId !== "number" || typeof payload.exp !== "number") {
    throw new ChallengeTokenError("Invalid or expired login attempt — please sign in again.");
  }
  if (Date.now() > payload.exp) {
    throw new ChallengeTokenError("Invalid or expired login attempt — please sign in again.");
  }

  return payload.adminUserId;
}
