import { NextResponse } from "next/server";

import { updateSiteSettings } from "@/lib/admin-site-settings";
import type { SiteSettingsSaveInput } from "@/lib/admin-site-settings";

function parseInput(body: unknown): SiteSettingsSaveInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.phonePrimary !== "string" ||
    (b.phoneSecondary !== null && typeof b.phoneSecondary !== "string") ||
    typeof b.email !== "string" ||
    typeof b.whatsappNumber !== "string" ||
    typeof b.address !== "string" ||
    (b.responseTimeCommitment !== null && typeof b.responseTimeCommitment !== "string") ||
    !Array.isArray(b.socialProfileUrls) ||
    b.socialProfileUrls.some((url) => typeof url !== "string")
  ) {
    return null;
  }

  return {
    phonePrimary: b.phonePrimary,
    phoneSecondary: b.phoneSecondary as string | null,
    email: b.email,
    whatsappNumber: b.whatsappNumber,
    address: b.address,
    responseTimeCommitment: b.responseTimeCommitment as string | null,
    socialProfileUrls: b.socialProfileUrls as string[],
  };
}

/**
 * `PATCH /api/admin/site-settings` — request: `SiteSettingsSaveInput`; response: `{status}`.
 * No validation error to catch here — unlike every other admin save route in this codebase,
 * `lib/admin-site-settings.ts`'s `updateSiteSettings` never rejects the save itself
 * (content-management-admin.md's edge case: a blank required `site_settings` field is
 * allowed to save, and every public reader omits its own display instead).
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 },
    );
  }

  await updateSiteSettings(input);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
