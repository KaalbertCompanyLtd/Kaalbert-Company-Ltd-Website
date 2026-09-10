import { describe, expect, it } from "vitest";

import { generateTotpSecret } from "@/lib/auth/totp";

describe("generateTotpSecret", () => {
  it("returns a non-empty Base32 secret", () => {
    const secret = generateTotpSecret();

    expect(secret.length).toBeGreaterThan(0);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it("returns a different secret on every call", () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});
