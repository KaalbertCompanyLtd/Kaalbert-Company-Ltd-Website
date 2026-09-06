import { prisma } from "@/lib/prisma";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/seo";

/** Thrown for a structurally-present-but-invalid submission — the route maps this to a 400. */
export class SubscriptionValidationError extends Error {}

export interface SubscribeInput {
  email: string;
  consent: boolean;
}

/**
 * Same fixed brand tokens (09.01/09.02), literal hex values (not `var()`, which email clients
 * don't reliably support) as `lib/diagnostic-request-summary.ts`'s own email template —
 * duplicated rather than shared, matching that file's own precedent (no shared "email theme"
 * module exists yet; two consumers isn't reason enough to build one preemptively).
 */
const BRAND = {
  pine: "#0E2A22",
  brass: "#8C6E33",
  ink: "#121317",
  ink600: "#3C414A",
  ivory: "#FCFAF5",
  paper: "#FFFFFF",
  muted: "#F4F1E8",
  rule: "#C9C1AE",
  display: "Georgia, 'Times New Roman', serif",
  body: "Calibri, Arial, sans-serif",
};

/**
 * The confirmation email sent on every successful subscribe/re-confirm — the concrete place
 * insights-engine.md's "a one-click link in every sent email" rule is first implemented,
 * since no bulk-newsletter-sending feature exists yet in this phase to carry it otherwise.
 * Exported so a local preview script can render the exact same HTML a real send uses.
 */
export function buildSubscriptionConfirmationEmailHtml(unsubscribeUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.muted};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${BRAND.paper};border:1px solid ${BRAND.rule};border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background:${BRAND.pine};padding:26px 32px;text-align:center;border-bottom:3px solid ${BRAND.brass};">
            <span style="font-family:${BRAND.display};font-size:15px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.ivory};">Kaalbert &amp; Company Ltd</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px;">
            <p style="margin:0 0 12px;font-family:${BRAND.body};font-size:15px;line-height:1.6;color:${BRAND.ink};">You're subscribed to Kaalbert Insights.</p>
            <p style="margin:0 0 28px;font-family:${BRAND.body};font-size:15px;line-height:1.6;color:${BRAND.ink};">Analysis from the partners themselves, on the specific problems that bring a founder to us in the first place — sent roughly twice a month, never more.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.muted};border-left:3px solid ${BRAND.brass};border-radius:4px;">
              <tr>
                <td style="padding:16px 18px;font-family:${BRAND.body};font-size:12px;line-height:1.6;color:${BRAND.ink600};">
                  Didn't request this, or changed your mind? <a href="${unsubscribeUrl}" style="color:${BRAND.ink600};">Unsubscribe</a> at any time — one click, no questions asked.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${BRAND.muted};border-top:1px solid ${BRAND.rule};padding:20px 32px;text-align:center;">
            <p style="margin:0;font-family:${BRAND.body};font-size:11px;line-height:1.6;color:${BRAND.ink600};">
              Kaalbert &amp; Company Ltd is a business advisory firm. It is not a licensed audit, tax or legal practice, and connects clients to licensed practitioners where such work is required.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * insights-engine.md's `POST /api/insights/subscribe` — validates `consent` explicitly
 * (never inferred from mere presence, same precedent as `lib/enquiries.ts`'s
 * `contactConsent` check), then upserts by `email` (the row's own `@unique` constraint backs
 * this at the database layer too) so an already-subscribed email re-confirms rather than
 * creating a second row, clearing `unsubscribedAt` if it was set — this task's own explicit
 * acceptance criterion. Deliberately does not call `pushDataLayerEvent` anywhere in this
 * function or its caller: subscribing is not one of Document 13.03's six fixed measurement
 * events, and this task's other explicit acceptance criterion is that it must not invent a
 * seventh. A failed confirmation-email send is logged, never thrown back to the visitor —
 * same fire-and-forget treatment `lib/diagnostic-request-summary.ts` gives its own email send:
 * the real, durable outcome (the `subscriber` row) already succeeded regardless of email
 * deliverability.
 */
export async function subscribeToInsights(input: SubscribeInput): Promise<void> {
  const email = input.email?.trim().toLowerCase();

  if (!email) {
    throw new SubscriptionValidationError("Email is required.");
  }
  if (input.consent !== true) {
    throw new SubscriptionValidationError(
      "We can't subscribe you without your agreement to receive Insights emails.",
    );
  }

  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: { consent: true, unsubscribedAt: null },
    create: { email, consent: true },
  });

  const unsubscribeUrl = new URL(
    `/api/insights/unsubscribe?token=${subscriber.unsubscribeToken}`,
    getSiteUrl(),
  ).toString();

  try {
    await sendTransactionalEmail({
      to: [{ email }],
      subject: "You're subscribed to Kaalbert Insights",
      htmlContent: buildSubscriptionConfirmationEmailHtml(unsubscribeUrl),
    });
  } catch (error) {
    if (error instanceof EmailSendError) {
      console.error(`[insights-subscription] ${error.message}`);
      return;
    }
    throw error;
  }
}

/**
 * insights-engine.md's `POST /api/insights/unsubscribe` — a one-click link, identified by the
 * subscriber's own opaque `unsubscribeToken` (never their `id`, see `Subscriber`'s own
 * doc-comment for why). Sets `unsubscribedAt`, never deletes the row — same "never
 * destructive, always reversible" precedent as every other consent record in this schema — so
 * a later re-subscribe finds and re-confirms the same row rather than looking like a
 * first-time signup. An unknown/already-used token is treated as a no-op success (idempotent:
 * clicking an unsubscribe link twice, or a token for a row that's since been re-subscribed and
 * re-tokenised, should never surface an error to the visitor), not a validation error.
 */
export async function unsubscribeFromInsights(token: string): Promise<void> {
  const subscriber = await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) {
    return;
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribedAt: new Date() },
  });
}
