import { beforeEach, describe, expect, it, vi } from "vitest";

// bcryptjs's `hash`/`compare` are overloaded (a 2-arg Promise-returning form and a 3/4-arg
// callback form) — `vi.mocked()` against the overloaded export resolves to the wrong
// (`void`-returning) signature, so the mocks are declared with their own explicit,
// non-overloaded type via `vi.hoisted` instead (hoisted so `vi.mock`'s factory, itself
// hoisted above this file's imports, can reference them).
const { hashMock, compareMock } = vi.hoisted(() => ({
  hashMock: vi.fn<(plainTextValue: string, salt: number | string) => Promise<string>>(),
  compareMock: vi.fn<(plainTextValue: string, hash: string) => Promise<boolean>>(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: hashMock,
    compare: compareMock,
  },
}));

import { PasswordHashError, hashPassword, verifyPassword } from "@/lib/auth/password";

beforeEach(() => {
  hashMock.mockReset();
  compareMock.mockReset();
});

describe("hashPassword", () => {
  it("returns the hash bcryptjs produces, not the plaintext value", async () => {
    hashMock.mockResolvedValue("$2a$12$stubbedhashvalue");

    await expect(hashPassword("Correct Horse Battery Staple")).resolves.toBe(
      "$2a$12$stubbedhashvalue",
    );
  });

  it("never includes the raw value in a thrown error, even when the underlying library fails", async () => {
    const rawPassword = "Sup3r-S3cr3t-Passw0rd!";
    hashMock.mockRejectedValue(new Error("bcrypt internal failure"));

    await expect(hashPassword(rawPassword)).rejects.toBeInstanceOf(PasswordHashError);
    try {
      await hashPassword(rawPassword);
      expect.unreachable("hashPassword should have thrown");
    } catch (error) {
      expect((error as Error).message).not.toContain(rawPassword);
    }
  });
});

describe("verifyPassword — deliberate failed login", () => {
  it("rejects an incorrect password without logging or leaking it anywhere", async () => {
    const rawPassword = "wrong-password-attempt";
    compareMock.mockResolvedValue(false);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await verifyPassword(rawPassword, "$2a$12$stubbedhashvalue");

    expect(result).toBe(false);
    for (const spy of [logSpy, errorSpy, warnSpy]) {
      for (const call of spy.mock.calls) {
        expect(call.map(String).join(" ")).not.toContain(rawPassword);
      }
    }
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("never includes the raw value in a thrown error when the underlying compare call fails", async () => {
    const rawPassword = "another-failed-attempt-!!";
    compareMock.mockRejectedValue(new Error("bcrypt internal failure"));

    try {
      await verifyPassword(rawPassword, "$2a$12$stubbedhashvalue");
      expect.unreachable("verifyPassword should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PasswordHashError);
      expect((error as Error).message).not.toContain(rawPassword);
    }
  });
});
