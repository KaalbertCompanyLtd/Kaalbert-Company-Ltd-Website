import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    attribution: { upsert: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { resolveAttributionId } from "@/lib/attribution";

const upsertMock = vi.mocked(prisma.attribution.upsert);

const VALID_CAPTURE = {
  sessionId: "11111111-1111-1111-1111-111111111111",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "launch",
  landingPage: "/lp/business-health-check",
  firstSeen: "2026-09-01T00:00:00.000Z",
};

beforeEach(() => {
  upsertMock.mockReset();
  upsertMock.mockResolvedValue({ id: 42 } as never);
});

describe("resolveAttributionId", () => {
  it("returns null without touching the database when input is undefined", async () => {
    await expect(resolveAttributionId(undefined)).resolves.toBeNull();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns null for malformed input (missing sessionId), never blocking the caller", async () => {
    await expect(
      resolveAttributionId({ landingPage: "/", firstSeen: "2026-09-01" }),
    ).resolves.toBeNull();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns null for an unparseable firstSeen date", async () => {
    await expect(
      resolveAttributionId({ ...VALID_CAPTURE, firstSeen: "not-a-date" }),
    ).resolves.toBeNull();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("upserts by sessionId and returns the row id for valid input", async () => {
    await expect(resolveAttributionId(VALID_CAPTURE)).resolves.toBe(42);

    expect(upsertMock).toHaveBeenCalledWith({
      where: { sessionId: VALID_CAPTURE.sessionId },
      create: {
        sessionId: VALID_CAPTURE.sessionId,
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "launch",
        landingPage: "/lp/business-health-check",
        firstSeen: new Date(VALID_CAPTURE.firstSeen),
      },
      update: {},
    });
  });

  it("stores null utm fields for a direct/organic visit — never blocks on missing campaign data", async () => {
    const { utmSource, utmMedium, utmCampaign, ...direct } = VALID_CAPTURE;
    void utmSource;
    void utmMedium;
    void utmCampaign;

    await expect(resolveAttributionId(direct)).resolves.toBe(42);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
        }),
      }),
    );
  });

  it("returns null (never throws) when the database call fails", async () => {
    upsertMock.mockRejectedValue(new Error("db down"));

    await expect(resolveAttributionId(VALID_CAPTURE)).resolves.toBeNull();
  });
});
