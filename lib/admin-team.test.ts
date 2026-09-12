import { beforeEach, describe, expect, it, vi } from "vitest";

const txMock = {
  adminUser: { create: vi.fn() },
  author: { aggregate: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    author: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn() }));
vi.mock("@/lib/auth/totp-setup", () => ({ issueSetupToken: vi.fn() }));
vi.mock("@/lib/seo", () => ({ getSiteUrl: vi.fn(() => "https://kaalbert.com") }));
vi.mock("@/lib/email", () => ({
  EmailSendError: class EmailSendError extends Error {},
  sendTransactionalEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { issueSetupToken } from "@/lib/auth/totp-setup";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";
import { AdminRole } from "@/generated/prisma/client";
import { CreatePartnerError, createPartnerAccount } from "@/lib/admin-team";
import type { CreateNewAuthorInput, LinkExistingAuthorInput } from "@/lib/admin-team";

const authorFindUniqueMock = vi.mocked(prisma.author.findUnique);
const transactionMock = vi.mocked(prisma.$transaction);
const hashPasswordMock = vi.mocked(hashPassword);
const issueSetupTokenMock = vi.mocked(issueSetupToken);
const sendTransactionalEmailMock = vi.mocked(sendTransactionalEmail);

beforeEach(() => {
  authorFindUniqueMock.mockReset();
  transactionMock.mockReset();
  hashPasswordMock.mockReset();
  issueSetupTokenMock.mockReset();
  sendTransactionalEmailMock.mockReset();
  txMock.adminUser.create.mockReset();
  txMock.author.aggregate.mockReset();
  txMock.author.create.mockReset();
  txMock.author.updateMany.mockReset();

  hashPasswordMock.mockResolvedValue("hashed-password");
  issueSetupTokenMock.mockResolvedValue("https://kaalbert.com/admin/setup-2fa?token=abc");
  transactionMock.mockImplementation((async (callback: (tx: typeof txMock) => unknown) =>
    callback(txMock)) as unknown as typeof prisma.$transaction);
});

function linkInput(overrides: Partial<LinkExistingAuthorInput> = {}): LinkExistingAuthorInput {
  return {
    mode: "link",
    email: "new-partner@kaalbert.test",
    role: AdminRole.PARTNER,
    authorId: 3,
    ...overrides,
  };
}

function createInput(overrides: Partial<CreateNewAuthorInput> = {}): CreateNewAuthorInput {
  return {
    mode: "create",
    email: "new-partner@kaalbert.test",
    role: AdminRole.PARTNER,
    name: "Kwame Boateng",
    photoUrl: null,
    title: "Partner",
    practiceArea: "Tax",
    credentials: null,
    personalStatement: "A statement.",
    bio: "A bio.",
    ...overrides,
  };
}

describe("createPartnerAccount", () => {
  describe("mode: link", () => {
    it("rejects when the author no longer exists", async () => {
      authorFindUniqueMock.mockResolvedValue(null);
      await expect(createPartnerAccount(linkInput())).rejects.toThrow(CreatePartnerError);
    });

    it("rejects when the author is already linked to a login", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: 99,
        name: "Ama Wiafe",
      } as never);
      await expect(createPartnerAccount(linkInput())).rejects.toThrow("already linked to a login");
    });

    it("creates the admin user and links the existing author", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: null,
        name: "Ama Wiafe",
      } as never);
      txMock.adminUser.create.mockResolvedValue({ id: 10 });
      txMock.author.updateMany.mockResolvedValue({ count: 1 });
      sendTransactionalEmailMock.mockResolvedValue(undefined);

      const result = await createPartnerAccount(linkInput());

      expect(txMock.adminUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Ama Wiafe", email: "new-partner@kaalbert.test" }),
        }),
      );
      expect(txMock.author.updateMany).toHaveBeenCalledWith({
        where: { id: 3, adminUserId: null },
        data: { adminUserId: 10 },
      });
      expect(result).toEqual({ adminUserId: 10, authorId: 3, emailSent: true });
    });

    it("rejects a race where the author got linked between the check and the write", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: null,
        name: "Ama Wiafe",
      } as never);
      txMock.adminUser.create.mockResolvedValue({ id: 10 });
      txMock.author.updateMany.mockResolvedValue({ count: 0 });

      await expect(createPartnerAccount(linkInput())).rejects.toThrow(
        "just linked to another login",
      );
    });
  });

  describe("mode: create", () => {
    it("rejects a blank name", async () => {
      await expect(createPartnerAccount(createInput({ name: "  " }))).rejects.toThrow(
        "Name is required",
      );
    });

    it("creates the admin user and a brand-new linked author, appended after the highest order", async () => {
      txMock.adminUser.create.mockResolvedValue({ id: 11 });
      txMock.author.aggregate.mockResolvedValue({ _max: { order: 5 } });
      txMock.author.create.mockResolvedValue({ id: 20 });
      sendTransactionalEmailMock.mockResolvedValue(undefined);

      const result = await createPartnerAccount(createInput());

      expect(txMock.author.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ adminUserId: 11, name: "Kwame Boateng", order: 6 }),
        }),
      );
      expect(result).toEqual({ adminUserId: 11, authorId: 20, emailSent: true });
    });
  });

  describe("email delivery", () => {
    it("still returns the created account when the invite email fails, with the fallback credentials", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: null,
        name: "Ama Wiafe",
      } as never);
      txMock.adminUser.create.mockResolvedValue({ id: 10 });
      txMock.author.updateMany.mockResolvedValue({ count: 1 });
      sendTransactionalEmailMock.mockRejectedValue(new EmailSendError("no api key"));

      const result = await createPartnerAccount(linkInput());

      expect(result.emailSent).toBe(false);
      expect(result.setupUrl).toBe("https://kaalbert.com/admin/setup-2fa?token=abc");
      expect(result.password).toEqual(expect.any(String));
    });

    it("never exposes the password or setup url when the email succeeds", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: null,
        name: "Ama Wiafe",
      } as never);
      txMock.adminUser.create.mockResolvedValue({ id: 10 });
      txMock.author.updateMany.mockResolvedValue({ count: 1 });
      sendTransactionalEmailMock.mockResolvedValue(undefined);

      const result = await createPartnerAccount(linkInput());

      expect(result.setupUrl).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it("propagates a non-email error from the send step instead of swallowing it", async () => {
      authorFindUniqueMock.mockResolvedValue({
        id: 3,
        adminUserId: null,
        name: "Ama Wiafe",
      } as never);
      txMock.adminUser.create.mockResolvedValue({ id: 10 });
      txMock.author.updateMany.mockResolvedValue({ count: 1 });
      sendTransactionalEmailMock.mockRejectedValue(new Error("unexpected"));

      await expect(createPartnerAccount(linkInput())).rejects.toThrow("unexpected");
    });
  });
});
