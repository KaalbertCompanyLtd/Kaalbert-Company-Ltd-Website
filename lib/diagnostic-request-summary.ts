import { prisma } from "@/lib/prisma";
import { getScoreBand, type DiagnosticScoreBand } from "@/lib/diagnostic-flow";
import type { DiagnosticScoringResult } from "@/lib/diagnostic-scoring";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";

/** Thrown for a structurally-present-but-invalid request — the route maps this to a 400. */
export class DiagnosticSummaryRequestValidationError extends Error {}

export interface DiagnosticSummaryRequestInput {
  enquiryId: number;
  name: string;
  email: string;
  phone?: string;
  contactConsent: boolean;
  marketingConsent?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ui/design-system.md's own fixed brand tokens (09.01/09.02) — literal hex values, not CSS
 * custom properties, since email clients don't reliably support `var()`. Georgia (display) /
 * Calibri (body) is that same doc's fixed typeface pairing (both system fonts, no web-font
 * loading needed — safe for email, which can't fetch stylesheets anyway).
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
 * Plain server-rendered HTML (table-based layout, inline styles throughout — the only markup
 * pattern that survives Outlook's Word rendering engine as well as modern webmail) — not a
 * shared React component with `app/diagnostic/results/page.tsx`, since an email client
 * renders neither React nor a linked stylesheet; this task's own acceptance criterion ("the
 * resulting email ... matches the on-screen result data") is about the *data* matching, not
 * the markup. Every user-supplied value is escaped (`name`, embedded directly into HTML) —
 * this is emailed content, not owner-authored copy. Exported so a local preview script can
 * render the exact same HTML a real send uses, with no risk of the two drifting apart.
 */
export function buildSummaryEmailHtml(
  name: string,
  result: DiagnosticScoringResult,
  band: DiagnosticScoreBand | null,
): string {
  const weakest = new Set(result.weakestDimensions);
  const rows = result.dimensionScores
    .map((dimension, index) => {
      const isWeak = weakest.has(dimension.name);
      const borderTop = index === 0 ? "" : `border-top:1px solid ${BRAND.rule};`;
      const label = isWeak
        ? `${escapeHtml(dimension.name)} <span style="color:${BRAND.brass};font-size:12px;">— weakest</span>`
        : escapeHtml(dimension.name);
      return `<tr>
        <td style="padding:10px 0;${borderTop}font-family:${BRAND.body};font-size:14px;color:${BRAND.ink};">${label}</td>
        <td style="padding:10px 0;${borderTop}font-family:${BRAND.body};font-size:14px;color:${BRAND.ink600};text-align:right;font-variant-numeric:tabular-nums;">${dimension.score}%</td>
      </tr>`;
    })
    .join("");

  // The email's own, fuller narrative — never `band.statement` (the short version already
  // shown on `/diagnostic/results`) — so the email is genuinely more detailed than the
  // screen, not a copy of it. Falls back to `statement` only if no detail has been authored
  // yet (a fresh/placeholder row). Split on a blank line so a multi-paragraph narrative
  // renders as real paragraphs, not one run-on block.
  const detailParagraphs = (band?.emailDetail || band?.statement || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-family:${BRAND.body};font-size:14px;line-height:1.6;color:${BRAND.ink600};max-width:420px;margin-left:auto;margin-right:auto;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const bandHtml = band
    ? `<div style="font-family:${BRAND.display};font-size:17px;font-weight:700;color:${BRAND.brass};margin:2px 0 6px;">${escapeHtml(band.label)}</div>
       ${detailParagraphs}`
    : "";

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
            <p style="margin:0 0 12px;font-family:${BRAND.body};font-size:15px;line-height:1.6;color:${BRAND.ink};">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 28px;font-family:${BRAND.body};font-size:15px;line-height:1.6;color:${BRAND.ink};">Here is the full result from your Business Health Check.</p>
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-family:${BRAND.body};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.brass};">Your result</span>
              <div style="font-family:${BRAND.display};font-size:52px;font-weight:700;color:${BRAND.pine};line-height:1;margin:8px 0 10px;">${result.score}%</div>
              ${bandHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-family:${BRAND.body};font-size:14px;line-height:1.6;color:${BRAND.ink600};">${escapeHtml(result.indicativeCostStatement)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.muted};border-left:3px solid ${BRAND.brass};border-radius:4px;">
              <tr>
                <td style="padding:16px 18px;font-family:${BRAND.body};font-size:12px;line-height:1.6;color:${BRAND.ink600};">
                  An indicative self-assessment based on user-supplied information, not a professional opinion, not to be relied upon by any third party.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 36px;">
            <p style="margin:0;font-family:${BRAND.body};font-size:15px;line-height:1.6;color:${BRAND.ink};">A partner will be in touch to discuss this result.</p>
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
 * `POST /api/diagnostic/request-summary`'s own business logic (T3.7) — validates consent,
 * updates the existing `enquiry_record` T3.5 already created (never creates a second row for
 * the same diagnostic attempt), and sends the full written summary email built from that same
 * stored `scoreSummary` this task's own results screen (T3.6) reads — the email and the
 * on-screen result can never drift apart, since both read the identical stored data.
 *
 * A second request for the same `enquiry_id` updates the row in place and re-sends the email
 * (e.g. the visitor corrects a typo'd email address, or asks again) — not rejected as a
 * duplicate; this task's own acceptance criteria don't call for rejecting a resend, and
 * silently failing a second, well-intentioned attempt would be worse than sending twice.
 *
 * A failed email send is logged, never thrown back to the visitor: the real, durable outcome
 * — the firm now has this visitor's contact details on the enquiry record — already
 * succeeded regardless of email deliverability, the same fire-and-forget treatment this
 * project already gives the Meta Conversions API call (`docs/architecture.md`'s External
 * dependencies table: "a failed call is logged, not retried inline").
 */
export async function requestDiagnosticSummary(
  input: DiagnosticSummaryRequestInput,
): Promise<void> {
  const name = input.name?.trim();
  const email = input.email?.trim();
  const phone = input.phone?.trim();

  if (!name) {
    throw new DiagnosticSummaryRequestValidationError("Name is required.");
  }
  if (!email) {
    throw new DiagnosticSummaryRequestValidationError("Email is required.");
  }
  if (input.contactConsent !== true) {
    throw new DiagnosticSummaryRequestValidationError(
      "We can't email a summary without your agreement to be contacted about this result.",
    );
  }

  const enquiry = await prisma.enquiryRecord.findUnique({ where: { id: input.enquiryId } });
  if (!enquiry?.scoreSummary) {
    throw new DiagnosticSummaryRequestValidationError(
      "No diagnostic result found for this enquiry.",
    );
  }

  await prisma.enquiryRecord.update({
    where: { id: input.enquiryId },
    data: {
      name,
      email,
      phone: phone || null,
      contactConsent: true,
      marketingConsent: input.marketingConsent ?? false,
    },
  });

  const result = enquiry.scoreSummary as unknown as DiagnosticScoringResult;
  const band = await getScoreBand(result.score);

  try {
    await sendTransactionalEmail({
      to: [{ email, name }],
      subject: "Your Business Health Check result",
      htmlContent: buildSummaryEmailHtml(name, result, band),
    });
  } catch (error) {
    if (error instanceof EmailSendError) {
      console.error(`[diagnostic-request-summary] ${error.message}`);
      return;
    }
    throw error;
  }
}
