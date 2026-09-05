import { prisma } from "@/lib/prisma";
import { resolveServiceContext } from "@/lib/contact";

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

  return prisma.enquiryRecord.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
      serviceLine: serviceContext?.slug ?? null,
      contactConsent: true,
      marketingConsent: input.marketingConsent ?? false,
    },
  });
}
