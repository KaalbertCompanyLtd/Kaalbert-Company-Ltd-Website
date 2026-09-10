import { prisma } from "@/lib/prisma";
import type { AttributionCapture } from "@/lib/attribution-client";

export type { AttributionCapture };

/**
 * Defensive parse of whatever a route handler received as `body.attribution` — untrusted
 * client input, not a typed value yet. Returns `null` for anything malformed rather than
 * throwing: attribution capture is best-effort and must never block enquiry creation (this
 * task's own edge case), same reasoning as `lib/attribution-client.ts`'s own
 * try/catch-to-null degradation.
 */
function parseAttributionCapture(raw: unknown): AttributionCapture | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const candidate = raw as Record<string, unknown>;
  if (
    typeof candidate.sessionId !== "string" ||
    candidate.sessionId.length === 0 ||
    typeof candidate.landingPage !== "string" ||
    typeof candidate.firstSeen !== "string"
  ) {
    return null;
  }
  const firstSeen = new Date(candidate.firstSeen);
  if (Number.isNaN(firstSeen.getTime())) {
    return null;
  }

  return {
    sessionId: candidate.sessionId,
    utmSource: typeof candidate.utmSource === "string" ? candidate.utmSource : null,
    utmMedium: typeof candidate.utmMedium === "string" ? candidate.utmMedium : null,
    utmCampaign: typeof candidate.utmCampaign === "string" ? candidate.utmCampaign : null,
    landingPage: candidate.landingPage,
    firstSeen: candidate.firstSeen,
  };
}

/**
 * Resolves the `attribution_id` to link a newly-created `enquiry_record` to — called from
 * `lib/enquiries.ts`'s `createContactEnquiry` and `lib/diagnostic-submit.ts`'s
 * `submitDiagnosticResponses`. Upserts by `sessionId` (`@unique` on `Attribution`) so a
 * second enquiry from the same browsing session (e.g. the diagnostic's own
 * submit-then-request-summary sequence, or a visitor who submits the contact form twice)
 * resolves to the same row rather than creating a duplicate; the `update: {}` on an existing
 * row is deliberately a no-op — first-touch attribution (`landingPage`/`firstSeen`/utm
 * fields) is immutable once captured, never overwritten by a later touch in the same session.
 * Returns `null` (never throws) for missing/malformed input or a DB failure — this must never
 * block enquiry creation, per this task's own edge case ("a session with no campaign
 * parameters stores null/direct, never blocking the flow").
 */
export async function resolveAttributionId(raw: unknown): Promise<number | null> {
  const input = parseAttributionCapture(raw);
  if (!input) {
    return null;
  }

  try {
    const row = await prisma.attribution.upsert({
      where: { sessionId: input.sessionId },
      create: {
        sessionId: input.sessionId,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        landingPage: input.landingPage,
        firstSeen: new Date(input.firstSeen),
      },
      update: {},
    });
    return row.id;
  } catch (error) {
    console.error(`[attribution] resolveAttributionId failed: ${error}`);
    return null;
  }
}
