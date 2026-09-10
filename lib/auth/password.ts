import bcrypt from "bcryptjs";

/**
 * Thrown when hashing or verifying a credential fails. The message is built only from the
 * underlying library's own error text — never from the raw credential itself (see
 * `docs/tasks/06-admin-auth.md` T6.1's literal acceptance criterion: no plaintext password
 * is ever written to logs, including via an uncaught error's own message).
 */
export class PasswordHashError extends Error {}

const SALT_ROUNDS = 12;

/**
 * One-way hash for `admin_user.password_hash` (T6.1) and `admin_backup_code.code_hash`
 * (T6.2/T6.4) — both are credentials verified by comparison only, never recovered in
 * plaintext, unlike the TOTP secret (`lib/auth/totp-encryption.ts`).
 */
export async function hashPassword(plainTextValue: string): Promise<string> {
  try {
    return await bcrypt.hash(plainTextValue, SALT_ROUNDS);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new PasswordHashError(`Failed to hash credential: ${message}`);
  }
}

export async function verifyPassword(plainTextValue: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainTextValue, hash);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new PasswordHashError(`Failed to verify credential: ${message}`);
  }
}
