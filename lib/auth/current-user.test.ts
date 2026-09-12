import { beforeEach, describe, expect, it, vi } from "vitest";

const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: getCookie })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
  },
}));

vi.mock("./session", () => ({
  SESSION_COOKIE_NAME: "admin_session",
  verifySession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifySession } from "./session";
import { canEditAuthorProfile, getCurrentAdminUser, isOwner } from "./current-user";
import type { CurrentAdminUser } from "./current-user";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const verifySessionMock = vi.mocked(verifySession);

beforeEach(() => {
  getCookie.mockReset();
  findUniqueMock.mockReset();
  verifySessionMock.mockReset();
});

function owner(overrides: Partial<CurrentAdminUser> = {}): CurrentAdminUser {
  return {
    id: 1,
    name: "Owner Partner",
    email: "owner@kaalbert.test",
    role: "OWNER",
    author: null,
    ...overrides,
  } as CurrentAdminUser;
}

describe("getCurrentAdminUser", () => {
  it("returns null when no session cookie is present", async () => {
    getCookie.mockReturnValue(undefined);
    expect(await getCurrentAdminUser()).toBeNull();
    expect(verifySessionMock).not.toHaveBeenCalled();
  });

  it("returns null when the session cookie doesn't verify", async () => {
    getCookie.mockReturnValue({ value: "stale-token" });
    verifySessionMock.mockResolvedValueOnce(null);
    expect(await getCurrentAdminUser()).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns null when the session verifies but the admin_user row is gone", async () => {
    getCookie.mockReturnValue({ value: "real-token" });
    verifySessionMock.mockResolvedValueOnce({ sessionId: 1, adminUserId: 42 });
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getCurrentAdminUser()).toBeNull();
  });

  it("returns the resolved user, including a linked author, on a valid session", async () => {
    getCookie.mockReturnValue({ value: "real-token" });
    verifySessionMock.mockResolvedValueOnce({ sessionId: 1, adminUserId: 42 });
    findUniqueMock.mockResolvedValueOnce({
      id: 42,
      name: "Ama Wiafe",
      email: "ama@kaalbert.test",
      role: "PARTNER",
      author: { id: 2, name: "Ama Wiafe", photoUrl: null, title: "Partner" },
    } as never);

    const result = await getCurrentAdminUser();
    expect(result?.id).toBe(42);
    expect(result?.role).toBe("PARTNER");
    expect(result?.author?.id).toBe(2);
  });
});

describe("isOwner", () => {
  it("is false for null", () => {
    expect(isOwner(null)).toBe(false);
  });

  it("is false for a Partner", () => {
    expect(isOwner(owner({ role: "PARTNER" }))).toBe(false);
  });

  it("is true for an Owner", () => {
    expect(isOwner(owner({ role: "OWNER" }))).toBe(true);
  });
});

describe("canEditAuthorProfile", () => {
  it("is false for a signed-out caller", () => {
    expect(canEditAuthorProfile(null, 5)).toBe(false);
  });

  it("is true for an Owner editing anyone's profile", () => {
    expect(canEditAuthorProfile(owner({ role: "OWNER", author: null }), 5)).toBe(true);
  });

  it("is true for a Partner editing their own linked profile", () => {
    const partner = owner({
      role: "PARTNER",
      author: { id: 5, name: "Ama Wiafe", photoUrl: null, title: "Partner" },
    });
    expect(canEditAuthorProfile(partner, 5)).toBe(true);
  });

  it("is false for a Partner editing someone else's profile", () => {
    const partner = owner({
      role: "PARTNER",
      author: { id: 5, name: "Ama Wiafe", photoUrl: null, title: "Partner" },
    });
    expect(canEditAuthorProfile(partner, 6)).toBe(false);
  });

  it("is false for a Partner with no linked profile at all", () => {
    const partner = owner({ role: "PARTNER", author: null });
    expect(canEditAuthorProfile(partner, 6)).toBe(false);
  });
});
