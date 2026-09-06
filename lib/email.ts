import { BrevoClient } from "@getbrevo/brevo";

/**
 * Thrown for any failure sending a transactional email — missing configuration (no API key/
 * sender set yet) or a real send failure from Brevo's API. The caller decides how to surface
 * this (T3.7's route logs it and still returns success to the visitor for the
 * `enquiry_record` update itself, since a delivery failure shouldn't undo a real database
 * write the visitor already completed — see `lib/diagnostic-request-summary.ts`).
 */
export class EmailSendError extends Error {}

let client: BrevoClient | undefined;

function getClient(): BrevoClient {
  if (!client) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new EmailSendError(
        "BREVO_API_KEY is not set — cannot send transactional email. See CLAUDE.local.md.",
      );
    }
    client = new BrevoClient({ apiKey });
  }
  return client;
}

export interface SendEmailInput {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
}

/**
 * The shared transactional email send utility (T3.7, `docs/tasks/03-diagnostic.md`'s own
 * note: build this once, here, as its first consumer — Milestone 4's subscriber confirmation
 * and Milestone 8's enquiry notifications reuse it rather than each re-implementing their own
 * send mechanism). Brevo (`@getbrevo/brevo`) chosen over Resend/Postmark/SES specifically
 * because it supports single-sender verification (a 6-digit code to the sender's own inbox)
 * without a registered domain — `kaalbert.com` isn't registered yet
 * (`memory/technical-debt.md`).
 */
export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
}: SendEmailInput): Promise<void> {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    throw new EmailSendError(
      "BREVO_SENDER_EMAIL is not set — cannot send transactional email. See CLAUDE.local.md.",
    );
  }
  const senderName = process.env.BREVO_SENDER_NAME || "Kaalbert & Company Ltd";

  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: senderName, email: senderEmail },
      to,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new EmailSendError(`Failed to send transactional email: ${message}`);
  }
}
