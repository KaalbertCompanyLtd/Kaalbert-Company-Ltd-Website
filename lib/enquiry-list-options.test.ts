import { describe, expect, it } from "vitest";

import { resolveTriageBadge, TRIAGE_BADGE_CLASSES } from "@/lib/enquiry-list-options";

describe("resolveTriageBadge", () => {
  it("shows the real priority word and its badge class when triagePriorityLevel is set", () => {
    expect(resolveTriageBadge(true, "High")).toEqual({
      label: "High",
      className: TRIAGE_BADGE_CLASSES.High,
    });
    expect(resolveTriageBadge(true, "Medium")).toEqual({
      label: "Medium",
      className: TRIAGE_BADGE_CLASSES.Medium,
    });
  });

  it("falls back to a plain 'Flagged' badge when triageFlag is true but no priority word exists (a pre-T8.1 row)", () => {
    expect(resolveTriageBadge(true, null)).toEqual({
      label: "Flagged",
      className: TRIAGE_BADGE_CLASSES.High,
    });
  });

  it("shows 'Not flagged' with no className (caller renders its own outline variant) when not flagged at all", () => {
    expect(resolveTriageBadge(false, null)).toEqual({ label: "Not flagged", className: undefined });
  });

  it("never renders 'Not flagged' for a genuinely flagged row, even without a priority word", () => {
    const result = resolveTriageBadge(true, null);
    expect(result.label).not.toBe("Not flagged");
  });
});
