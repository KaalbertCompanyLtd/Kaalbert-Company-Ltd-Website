import { beforeEach, describe, expect, it } from "vitest";

import {
  ChallengeTokenError,
  issueChallengeToken,
  verifyChallengeToken,
} from "@/lib/auth/challenge-token";

beforeEach(() => {
  process.env.ADMIN_CHALLENGE_TOKEN_SECRET = "test-secret-value-not-a-real-one";
});

describe("issueChallengeToken / verifyChallengeToken", () => {
  it("round-trips a real admin_user id", () => {
    const token = issueChallengeToken(42);

    expect(verifyChallengeToken(token)).toBe(42);
  });

  it("rejects a tampered token without revealing anything about why", () => {
    const token = issueChallengeToken(42);
    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");

    expect(() => verifyChallengeToken(tampered)).toThrow(ChallengeTokenError);
  });

  it("rejects a token signed with a different secret", () => {
    const token = issueChallengeToken(42);
    process.env.ADMIN_CHALLENGE_TOKEN_SECRET = "a-completely-different-secret";

    expect(() => verifyChallengeToken(token)).toThrow(ChallengeTokenError);
  });

  it("rejects a malformed token (no signature segment)", () => {
    expect(() => verifyChallengeToken("not-a-real-token")).toThrow(ChallengeTokenError);
  });

  it("rejects an expired token", () => {
    const realNow = Date.now;
    Date.now = () => realNow() - 6 * 60 * 1000; // issue as if 6 minutes ago
    const token = issueChallengeToken(42);
    Date.now = realNow;

    expect(() => verifyChallengeToken(token)).toThrow(ChallengeTokenError);
  });

  it("throws a clear error when the secret is not configured", () => {
    delete process.env.ADMIN_CHALLENGE_TOKEN_SECRET;

    expect(() => issueChallengeToken(42)).toThrow(ChallengeTokenError);
  });
});
