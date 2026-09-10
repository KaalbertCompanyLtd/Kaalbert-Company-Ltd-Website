import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { createSession, destroySession, verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const createMock = vi.mocked(prisma.adminSession.create);
const findUniqueMock = vi.mocked(prisma.adminSession.findUnique);
const updateMock = vi.mocked(prisma.adminSession.update);
const deleteMock = vi.mocked(prisma.adminSession.delete);
const deleteManyMock = vi.mocked(prisma.adminSession.deleteMany);

beforeEach(() => {
  createMock.mockReset().mockResolvedValue({} as never);
  findUniqueMock.mockReset();
  updateMock.mockReset().mockResolvedValue({} as never);
  deleteMock.mockReset().mockResolvedValue({} as never);
  deleteManyMock.mockReset().mockResolvedValue({ count: 1 } as never);
});

describe("createSession", () => {
  it("creates a session row with a random token and a ~12-hour expiry", async () => {
    const { token, expiresAt } = await createSession(7);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(createMock).toHaveBeenCalledOnce();
    const call = createMock.mock.calls[0][0];
    expect(call.data.adminUserId).toBe(7);
    expect(call.data.token).toBe(token);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 11 * 60 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 12 * 60 * 60 * 1000);
  });

  it("generates a different token on every call", async () => {
    const first = await createSession(7);
    const second = await createSession(7);

    expect(first.token).not.toBe(second.token);
  });
});

describe("verifySession", () => {
  it("returns null when no session matches the token", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(verifySession("missing")).resolves.toBeNull();
  });

  it("returns null and deletes the row when the absolute lifetime has passed", async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      adminUserId: 7,
      token: "tok",
      createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(verifySession("tok")).resolves.toBeNull();
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns null and deletes the row when idle for over 30 minutes", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      adminUserId: 7,
      token: "tok",
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
      expiresAt: new Date(Date.now() + 11 * 60 * 60 * 1000),
    } as never);

    await expect(verifySession("tok")).resolves.toBeNull();
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it("returns the session and bumps lastActivityAt when still valid", async () => {
    findUniqueMock.mockResolvedValue({
      id: 3,
      adminUserId: 7,
      token: "tok",
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 5 * 60 * 1000),
      expiresAt: new Date(Date.now() + 11 * 60 * 60 * 1000),
    } as never);

    await expect(verifySession("tok")).resolves.toEqual({ sessionId: 3, adminUserId: 7 });
    expect(updateMock).toHaveBeenCalledOnce();
    const call = updateMock.mock.calls[0][0];
    expect(call.where).toEqual({ id: 3 });
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe("destroySession", () => {
  it("deletes every session row matching the token", async () => {
    await destroySession("tok");

    expect(deleteManyMock).toHaveBeenCalledWith({ where: { token: "tok" } });
  });
});
