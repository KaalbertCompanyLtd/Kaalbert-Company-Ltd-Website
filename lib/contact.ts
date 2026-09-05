import { prisma } from "@/lib/prisma";

export interface ServiceContext {
  /** Stored verbatim in `enquiry_record.service_line`. */
  slug: string;
  /** Shown in the "You're asking about: …" banner. */
  label: string;
}

/**
 * Resolves `/contact`'s optional `?service=[slug]` param against real, live data —
 * `contact-and-enquiry.md`'s edge case: an unrecognised value is treated as no parameter at
 * all (`null`), same rule `capabilities-page.md` documents for the link that produces this
 * param in the first place. Replaces the mockup's own static `labels` JS object
 * (`ui/mockups/a-public-site/contact.html`) with a live lookup against the real `Offer` and
 * `Capability` tables, since both are now real DB-backed entities, not a hand-maintained list.
 *
 * A recognised slug is any real `Offer.slug`, any real `Capability.slug`, or the literal
 * `"advisory-retainer"` — the one capabilities-page link target with no entity of its own
 * (`AdvisoryRetainer` is a singleton with no `slug` field), hardcoded the same way the mockup's
 * own `labels` map hardcodes its label.
 */
export async function resolveServiceContext(
  serviceParam: string | string[] | undefined,
): Promise<ServiceContext | null> {
  if (!serviceParam || Array.isArray(serviceParam)) {
    return null;
  }

  if (serviceParam === "advisory-retainer") {
    return { slug: serviceParam, label: "The Advisory Retainer" };
  }

  const offer = await prisma.offer.findUnique({
    where: { slug: serviceParam },
    select: { slug: true, name: true },
  });
  if (offer) {
    return { slug: offer.slug, label: offer.name };
  }

  const capability = await prisma.capability.findUnique({
    where: { slug: serviceParam },
    select: { slug: true, name: true },
  });
  if (capability) {
    return { slug: capability.slug, label: capability.name };
  }

  return null;
}

/**
 * The WhatsApp link's pre-filled, context-identifying message (contact-and-enquiry.md's
 * business rule) — mirrors the mockup's own fixed greeting when there's no service context,
 * and names the service when there is one, so the firm isn't starting cold either way.
 */
export function buildWhatsAppMessage(serviceLabel: string | null): string {
  if (serviceLabel) {
    return `Hello Kaalbert & Company, I'm reaching out from your website Contact page about ${serviceLabel}.`;
  }
  return "Hello Kaalbert & Company, I'm reaching out from your website Contact page.";
}
