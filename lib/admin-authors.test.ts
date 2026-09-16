import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    author: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    article: { count: vi.fn() },
    adminUser: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  deactivateAdminUser: vi.fn(),
  reactivateAdminUser: vi.fn(),
}));
vi.mock("@/lib/auth/totp-setup", () => ({ reissueSetupToken: vi.fn() }));
vi.mock("@/lib/auth/password-reset", () => ({ issuePasswordResetToken: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { deactivateAdminUser, reactivateAdminUser } from "@/lib/auth/session";
import { reissueSetupToken } from "@/lib/auth/totp-setup";
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
  setAdminUserRole,
  updateAuthor,
} from "@/lib/admin-authors";
import type { AuthorSaveInput } from "@/lib/admin-authors";

const authorFindManyMock = vi.mocked(prisma.author.findMany);
const authorFindUniqueMock = vi.mocked(prisma.author.findUnique);
const authorUpdateMock = vi.mocked(prisma.author.update);
const articleCountMock = vi.mocked(prisma.article.count);
const adminUserFindUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const adminUserUpdateMock = vi.mocked(prisma.adminUser.update);
const adminUserCountMock = vi.mocked(prisma.adminUser.count);
const deactivateAdminUserMock = vi.mocked(deactivateAdminUser);
const reactivateAdminUserMock = vi.mocked(reactivateAdminUser);
const reissueSetupTokenMock = vi.mocked(reissueSetupToken);
const issuePasswordResetTokenMock = vi.mocked(issuePasswordResetToken);

beforeEach(() => {
  authorFindManyMock.mockReset();
  authorFindUniqueMock.mockReset();
  authorUpdateMock.mockReset();
  articleCountMock.mockReset();
  adminUserFindUniqueMock.mockReset();
  adminUserUpdateMock.mockReset();
  adminUserCountMock.mockReset();
  deactivateAdminUserMock.mockReset();
  reactivateAdminUserMock.mockReset();
  reissueSetupTokenMock.mockReset();
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
    published: true,
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

  it("saves published: true as submitted when all three required fields are set", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ published: true }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: true }) }),
    );
  });

  it("saves published: false as submitted, independent of field completeness", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ published: false }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: false }) }),
    );
  });

  it("rejects publishing while personalStatement is blank", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);

    await expect(
      updateAuthor(1, validInput({ personalStatement: "", published: true })),
    ).rejects.toThrow(/required before this profile can be published/);
    expect(authorUpdateMock).not.toHaveBeenCalled();
  });

  it("allows saving with a blank personalStatement as long as published is false", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ personalStatement: "", published: false }));

    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: false }) }),
    );
  });

  it("allows unpublishing a partner who already has articles crediting them — the whole point of the toggle", async () => {
    authorFindUniqueMock.mockResolvedValueOnce(authorRow() as never);
    authorUpdateMock.mockResolvedValueOnce({} as never);

    await updateAuthor(1, validInput({ published: false }));

    expect(articleCountMock).not.toHaveBeenCalled();
    expect(authorUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ published: false }) }),
    );
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
    await expect(setAdminUserActive(999, false, 1)).rejects.toThrow(AdminUserActionError);
  });

  it("calls deactivateAdminUser when setting active false for someone else", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    await setAdminUserActive(5, false, 1);
    expect(deactivateAdminUserMock).toHaveBeenCalledWith(5);
  });

  it("calls reactivateAdminUser when setting active true", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    await setAdminUserActive(5, true, 1);
    expect(reactivateAdminUserMock).toHaveBeenCalledWith(5);
  });

  it("rejects an Owner deactivating their own account", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    await expect(setAdminUserActive(5, false, 5)).rejects.toThrow(/own account/);
    expect(deactivateAdminUserMock).not.toHaveBeenCalled();
  });

  it("resetAdminUserTotp returns the fresh setup link", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    reissueSetupTokenMock.mockResolvedValueOnce("https://kaalbert.com/admin/setup-2fa?token=abc");
    const url = await resetAdminUserTotp(5);
    expect(url).toContain("/admin/setup-2fa");
  });

  it("resetAdminUserPassword returns the fresh reset link", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5 } as never);
    issuePasswordResetTokenMock.mockResolvedValueOnce(
      "https://kaalbert.com/admin/reset-password?token=abc",
    );
    const url = await resetAdminUserPassword(5);
    expect(url).toContain("/admin/reset-password");
  });
});

describe("setAdminUserRole", () => {
  it("throws for an unknown account id", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce(null);
    await expect(setAdminUserRole(999, "OWNER" as never)).rejects.toThrow(AdminUserActionError);
  });

  it("is a no-op when the account already holds the requested role", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5, role: "PARTNER" } as never);
    await setAdminUserRole(5, "PARTNER" as never);
    expect(adminUserCountMock).not.toHaveBeenCalled();
    expect(adminUserUpdateMock).not.toHaveBeenCalled();
  });

  it("promotes a Partner to Owner without needing an Owner-count check", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5, role: "PARTNER" } as never);
    adminUserUpdateMock.mockResolvedValueOnce({} as never);

    await setAdminUserRole(5, "OWNER" as never);

    expect(adminUserCountMock).not.toHaveBeenCalled();
    expect(adminUserUpdateMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { role: "OWNER" },
    });
  });

  it("demotes an Owner to Partner when other Owners still exist", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5, role: "OWNER" } as never);
    adminUserCountMock.mockResolvedValueOnce(2);
    adminUserUpdateMock.mockResolvedValueOnce({} as never);

    await setAdminUserRole(5, "PARTNER" as never);

    expect(adminUserUpdateMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { role: "PARTNER" },
    });
  });

  it("rejects demoting the last remaining Owner", async () => {
    adminUserFindUniqueMock.mockResolvedValueOnce({ id: 5, role: "OWNER" } as never);
    adminUserCountMock.mockResolvedValueOnce(1);

    await expect(setAdminUserRole(5, "PARTNER" as never)).rejects.toThrow(/last Owner/);
    expect(adminUserUpdateMock).not.toHaveBeenCalled();
  });
});
