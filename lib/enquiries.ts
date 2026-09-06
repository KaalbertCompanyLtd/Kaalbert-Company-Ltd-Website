import { prisma } from "@/lib/prisma";
import { resolveServiceContext } from "@/lib/contact";
import { subscribeToInsights } from "@/lib/insights-subscription";

/** Thrown for a structurally-present-but-invalid submission — the route handler maps this to a 400. */
export class ContactValidationError extends Error {}

export interface ContactSubmissionInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  service?: string;
  contactConsent: boolean;
  marketingConsent?: boolean;
}

/**
 * Validates and creates a contact-form-originated `enquiry_record` row
 * (contact-and-enquiry.md's `POST /api/contact/submit`). Business logic lives here, not in
 * the route handler (CLAUDE.md) — the route only parses the request body and shapes the
 * response.
 *
 * Contact consent is required and rejected here if missing (FR-6.2, this task's own explicit
 * acceptance criterion) — separate from marketing consent, which defaults to `false` rather
 * than being required at all.
 *
 * T4.5 follow-up (session 28): this form's own checkbox copy for `marketingConsent`
 * ("I'd also like occasional Insights articles and updates from Kaalbert & Company") has,
 * since T2.6, explicitly and specifically named Insights as what a visitor is opting into —
 * a real, dedicated, unticked-by-default opt-in for exactly that, not a bundled/inferred one
 * (insights-engine.md's FR-6.2 separation principle). No `subscriber` row existed to honour
 * that promise until this task built one; a checked box before now silently did nothing
 * toward it. Subscribing here reuses the exact same `subscribeToInsights` this task's own
 * `/api/insights/subscribe` calls — same upsert-by-email, same confirmation email with its
 * unsubscribe link — so a visitor who opts in from Contact is a real Insights subscriber, not
 * a second, different kind of "yes." A failure here is logged, never thrown back to the
 * visitor: the enquiry itself already succeeded and must not be undone by a failure in this
 * secondary action (same fire-and-forget precedent as this file's own email sends elsewhere
 * in this project). See memory/decision-log.md (session 28).
 */
export async function createContactEnquiry(input: ContactSubmissionInput) {
  const name = input.name?.trim();
  const email = input.email?.trim();
  const message = input.message?.trim();
  const phone = input.phone?.trim();

  if (!name) {
    throw new ContactValidationError("Name is required.");
  }
  if (!email) {
    throw new ContactValidationError("Email is required.");
  }
  if (!message) {
    throw new ContactValidationError("Please tell us what's going on with the business.");
  }
  if (input.contactConsent !== true) {
    throw new ContactValidationError(
      "We can't act on an enquiry without your agreement to be contacted about it.",
    );
  }

  const serviceContext = await resolveServiceContext(input.service);
  const marketingConsent = input.marketingConsent ?? false;

  const enquiry = await prisma.enquiryRecord.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
      serviceLine: serviceContext?.slug ?? null,
      contactConsent: true,
      marketingConsent,
    },
  });

  if (marketingConsent) {
    try {
      await subscribeToInsights({ email, consent: true });
    } catch (error) {
      console.error(`[enquiries] Insights subscription from Contact form failed: ${error}`);
    }
  }

  return enquiry;
}
