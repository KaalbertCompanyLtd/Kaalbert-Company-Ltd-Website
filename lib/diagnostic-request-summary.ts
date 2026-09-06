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
 * Plain server-rendered HTML — not a shared React component with `app/diagnostic/results/
 * page.tsx`, since an email client renders neither React nor most CSS; this task's own
 * acceptance criterion ("the resulting email ... matches the on-screen result data") is about
 * the *data* matching, not the markup. Every user-supplied value is escaped (`name`, embedded
 * directly into HTML) — this is emailed content, not owner-authored copy.
 */
function buildSummaryEmailHtml(
  name: string,
  result: DiagnosticScoringResult,
  band: DiagnosticScoreBand | null,
): string {
  const weakest = new Set(result.weakestDimensions);
  const rows = result.dimensionScores
    .map((dimension) => {
      const isWeak = weakest.has(dimension.name);
      const label = isWeak
        ? `${escapeHtml(dimension.name)} <span style="color:#a9853f;">— weakest</span>`
        : escapeHtml(dimension.name);
      return `<tr><td style="padding:6px 0;">${label}</td><td style="padding:6px 0;text-align:right;">${dimension.score}%</td></tr>`;
    })
    .join("");

  const bandHtml = band
    ? `<p style="font-weight:700;color:#a9853f;margin:0 0 4px;">${escapeHtml(band.label)}</p>
       <p style="margin:0 0 16px;">${escapeHtml(band.statement)}</p>`
    : "";

  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#0e2a22;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Here is the full result from your Business Health Check.</p>
      <h1 style="font-size:2.5rem;margin:16px 0 4px;">${result.score}%</h1>
      ${bandHtml}
      <p>${escapeHtml(result.indicativeCostStatement)}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <p style="font-size:0.8125rem;color:#6b6b6b;">
        An indicative self-assessment based on user-supplied information, not a professional
        opinion, not to be relied upon by any third party.
      </p>
      <p>A partner will be in touch to discuss this result.</p>
    </div>
  `;
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
