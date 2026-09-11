import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    author: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    article: { count: vi.fn() },
    adminUser: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  deactivateAdminUser: vi.fn(),
  reactivateAdminUser: vi.fn(),
}));
vi.mock("@/lib/auth/totp-setup", () => ({ issueSetupToken: vi.fn() }));
vi.mock("@/lib/auth/password-reset", () => ({ issuePasswordResetToken: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { deactivateAdminUser, reactivateAdminUser } from "@/lib/auth/session";
import { issueSetupToken } from "@/lib/auth/totp-setup";
import { issuePasswordResetToken } from "@/lib/auth/password-reset";
import {
  AdminUserActionError,
  AuthorValidationError,
  getAuthorForEdit,
  getAuthorIdForAdminUser,
  getAuthorList,
  resetAdminUserPassword,
  resetAdminUserTotp,
  setAdminUserActive,
  updateAuthor,
} from "@/lib/admin-authors";
import type { AuthorSaveInput } from "@/lib/admin-authors";

const authorFindManyMock = vi.mocked(prisma.author.findMany);
const authorFindUniqueMock = vi.mocked(prisma.author.findUnique);
const authorUpdateMock = vi.mocked(prisma.author.update);
const articleCountMock = vi.mocked(prisma.article.count);
const adminUserFindUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const deactivateAdminUserMock = vi.mocked(deactivateAdminUser);
const reactivateAdminUserMock = vi.mocked(reactivateAdminUser);
const issueSetupTokenMock = vi.mocked(issueSetupToken);
const issuePasswordResetTokenMock = vi.mocked(issuePasswordResetToken);

beforeEach(() => {
  authorFindManyMock.mockReset();
  authorFindUniqueMock.mockReset();
  authorUpdateMock.mockReset();
  articleCountMock.mockReset();
  adminUserFindUniqueMock.mockReset();
  deactivateAdminUserMock.mockReset();
  reactivateAdminUserMock.mockReset();
  issueSetupTokenMock.mockReset();
  issuePasswordResetTokenMock.mockReset();
});

function authorRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    adminUserId: null,
    name: "Ama Wiafe",
    photoUrl: null,
    title: "Partner",
    practiceArea: "Growth, Markets & Clients",
    credentials: null,
    personalStatement: "Ten years of experience.",
    bio: "Bio text.",
    order: 2,
    published: true,
    isPlaceholder: false,
    adminUser: null,
    ...overrides,
  };
}

function validInput(overrides: Partial<AuthorSaveInput> = {}): AuthorSaveInput {
  return {
    name: "Ama Wiafe",
    photoUrl: null,
    title: "Partner",
    practiceArea: "Growth, Markets & Clients",
    credentials: null,
    personalStatement: "Ten years of experience.",
    bio: "Bio text.",
    order: 2,
    ...overrides,
  };
}

describe("getAuthorList", () => {
  it("flattens each row's linked admin user status", async () => {
    authorFindManyMock.mockResolvedValueOnce([
      authorRow({ id: 1, adminUserId: 5, adminUser: { active: true } }),
      authorRow({ id: 2, adminUserId: null, adminUser: null }),
    ] as never);

    const result = await getAuthorList();

    expect(result[0]).toMatchObject({ id: 1, adminUserId: 5, adminUserActive: true });
    expect(result[1]).toMatchObject({ id: 2, adminUserId: null, adminUserActive: null });
  });
});

describe("getAuthorForEdit", () => {
  it("returns null for an unknown id", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(null);
    expect(await getAuthorForEdit(999)).toBeNull();
  });

  it("includes the linked admin user when present", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(
      authorRow({ adminUser: { id: 5, email: "ama@kaalbert.test", active: true } }) as never,
    );
    const result = await getAuthorForEdit(1);
    expect(result?.adminUser).toEqual({ id: 5, email: "ama@kaalbert.test", active: true });
  });
});

describe("getAuthorIdForAdminUser", () => {
  it("resolves the session's admin_user id to the linked author id", async () => {
    authorFindUniqueMock.mockResolvedValueOnce({ id: 1 } as never);
    expect(await getAuthorIdForAdminUser(5)).toBe(1);
  });

  it("returns null for an admin user with no linked profile", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(null);
    expect(await getAuthorIdForAdminUser(13)).toBeNull();
  });
});

describe("updateAuthor", () => {
  it("throws for an unknown author id", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(null);
    await expect(updateAuthor(999, validInput())).rejects.toThrow(AuthorValidationError);
  });

  it("computes published true when name/practiceArea/personalStatement are all set", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput());

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: true }) }),
    );
  });

  it("computes published false when personalStatement is blank and the author has no articles", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    articleCountMock.mockResolvedValueOnce(0);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ personalStatement: "   " }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: false }) }),
    );
  });

  it("rejects leaving personalStatement blank when the author already has articles", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    articleCountMock.mockResolvedValueOnce(3);

    await expect(updateAuthor(1, validInput({ personalStatement: "" }))).rejects.toThrow(
      /3 articles/,
    );
    expect(authorUpdateMock).not.toHaveBeenCalled();
  });

  it("does not gate publish on a blank bio", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ bio: "" }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: true, bio: "" }) }),
    );
  });

  it("does not gate publish on a missing photo or credentials", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ photoUrl: null, credentials: null }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: true }) }),
    );
  });

  it("falls back a blank title to the schema default rather than saving an empty string", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ title: "   " }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "Partner" }) }),
    );
  });

  it("rejects a non-positive display order", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    await expect(updateAuthor(1, validInput({ order: 0 }))).rejects.toThrow(AuthorValidationError);
  });
});

describe("setAdminUserActive / resetAdminUserTotp / resetAdminUserPassword", () => {
  it("throws for an unknown account id", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce(null);
    await expect(setAdminUserActive(999, false)).rejects.toThrow(AdminUserActionError);
  });

  it("calls deactivateAdminUser when setting active false", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    await setAdminUserActive(5, false);
    expect(deactivateAdminUserMock).toHaveBeenCalledWith(5);
  });

  it("calls reactivateAdminUser when setting active true", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    await setAdminUserActive(5, true);
    expect(reactivateAdminUserMock).toHaveBeenCalledWith(5);
  });

  it("resetAdminUserTotp returns the fresh setup link", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    issueSetupTokenMock.mockResolvedValueOnce("https://www.kaalbert.com/admin/setup-2fa?token=abc");
    const url = await resetAdminUserTotp(5);
    expect(url).toContain("/admin/setup-2fa");
  });

  it("resetAdminUserPassword returns the fresh reset link", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    issuePasswordResetTokenMock.mockResolvedValueOnce(
      "https://www.kaalbert.com/admin/reset-password?token=abc",
    );
    const url = await resetAdminUserPassword(5);
    expect(url).toContain("/admin/reset-password");
  });
});
