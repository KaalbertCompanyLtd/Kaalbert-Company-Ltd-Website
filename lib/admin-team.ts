import { randomBytes } from "node:crypto";

import { AdminRole, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { issueSetupToken } from "@/lib/auth/totp-setup";
import { getSiteUrl } from "@/lib/seo";
import { EmailSendError, sendTransactionalEmail } from "@/lib/email";

export class CreatePartnerError extends Error {}

export interface UnlinkedAuthor {
  id: number;
  name: string;
  title: string;
  photoUrl: string | null;
}

/**
 * The "link an existing partner profile" dropdown's own data source
 * (`add-partner-form.tsx`) — every real `Author` seeded before an invite/create-login flow
 * ever existed (all 5 today) has `adminUserId: null`; this is what finally lets one of them
 * get a login for the first time.
 */
export async function getUnlinkedAuthors(): Promise<UnlinkedAuthor[]> {
  const authors = await prisma.author.findMany({
    where: { adminUserId: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, title: true, photoUrl: true },
  });
  return authors;
}

interface CreatePartnerAccountInputBase {
  email: string;
  role: AdminRole;
}

export interface LinkExistingAuthorInput extends CreatePartnerAccountInputBase {
  mode: "link";
  authorId: number;
}

export interface CreateNewAuthorInput extends CreatePartnerAccountInputBase {
  mode: "create";
  name: string;
  photoUrl: string | null;
  title: string;
  practiceArea: string;
  credentials: string | null;
  personalStatement: string;
  bio: string;
}

export type CreatePartnerAccountInput = LinkExistingAuthorInput | CreateNewAuthorInput;

export interface CreatePartnerAccountResult {
  adminUserId: number;
  authorId: number;
  emailSent: boolean;
  /** Only present when `emailSent` is false — see this function's own doc-comment. */
  setupUrl?: string;
  /** Only present when `emailSent` is false — never included on the happy path. */
  password?: string;
}

const DEFAULT_TITLE = "Partner";

/** Same shape as `scripts/create-admin-user.ts`'s own `generatePassword` — 24 random bytes
 * as base64url, ~32 characters, no shell-unsafe symbols. Duplicated rather than imported
 * since that script is a standalone `tsx` entry point, not a module this app code depends
 * on (same reasoning that keeps it a script rather than a `lib/` function). */
function generatePassword(): string {
  return randomBytes(24).toString("base64url");
}

function buildInviteEmailHtml(name: string, password: string, setupUrl: string): string {
  const pine = "#0E2A22";
  const brass = "#8C6E33";
  const ink = "#121317";
  const ink600 = "#3C414A";
  const paper = "#FFFFFF";
  const muted = "#F4F1E8";
  const display = "Georgia, 'Times New Roman', serif";
  const body = "Calibri, Arial, sans-serif";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:${paper};border-radius:6px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <p style="font-family:${display};font-size:20px;color:${pine};margin:0 0 16px;font-weight:bold;">Kaalbert &amp; Company Ltd</p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 12px;">Hi ${name},</p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 20px;">
            An admin account has been created for you on the Kaalbert &amp; Company Ltd website.
            You'll need both of these to sign in for the first time:
          </p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 4px;">1. Your temporary password:</p>
          <p style="font-family:monospace;font-size:16px;color:${pine};background:${muted};padding:10px 14px;border-radius:4px;margin:0 0 20px;letter-spacing:0.5px;">${password}</p>
          <p style="font-family:${body};font-size:15px;color:${ink};margin:0 0 12px;">2. Set up your authenticator app — click the button below:</p>
          <p style="margin:0 0 24px;">
            <a href="${setupUrl}" style="display:inline-block;background:${pine};color:${paper};font-family:${body};font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:4px;">Set up two-factor authentication</a>
          </p>
          <p style="font-family:${body};font-size:13px;color:${ink600};margin:0 0 8px;">
            Once that's done, sign in at /admin/login with your email, the password above, and a
            code from your authenticator app. You can change your password any time from
            Account &amp; security once you're signed in.
          </p>
          <p style="font-family:${body};font-size:11px;color:${brass};margin:24px 0 0;word-break:break-all;">${setupUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * Creates a real login for a partner — either linking it to one of the Author profiles
 * already seeded (`mode: "link"`) or creating a brand-new profile at the same time
 * (`mode: "create"`). New at session 60, replacing `scripts/create-admin-user.ts` as the
 * normal path (that script's own doc-comment reasoning — "a developer-run script is
 * proportionate" — was the assumption the user directly overrode; see the session's plan).
 *
 * `AdminUser.passwordHash` is non-nullable and `/admin/setup-2fa` never collects a password,
 * so a real password has to be generated here, same as the script did — the invite email
 * carries both the password and the 2FA setup link, since neither alone is enough to log in.
 *
 * Email delivery failure doesn't roll back the created account (a delivery hiccup shouldn't
 * discard the real database write); instead the response carries `emailSent: false` plus the
 * one-time `setupUrl`/`password` so the Owner can relay them manually. The happy-path
 * response never exposes either value.
 */
export async function createPartnerAccount(
  input: CreatePartnerAccountInput,
): Promise<CreatePartnerAccountResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new CreatePartnerError("Email is required.");
  }

  let linkedAuthorName = "";
  if (input.mode === "link") {
    const author = await prisma.author.findUnique({ where: { id: input.authorId } });
    if (!author) {
      throw new CreatePartnerError("That partner profile no longer exists.");
    }
    if (author.adminUserId) {
      throw new CreatePartnerError("This profile is already linked to a login.");
    }
    linkedAuthorName = author.name;
  } else {
    if (!input.name.trim()) {
      throw new CreatePartnerError("Name is required.");
    }
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  let adminUserId: number;
  let authorId: number;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const adminUser = await tx.adminUser.create({
        data: {
          name: input.mode === "create" ? input.name.trim() : linkedAuthorName,
          email,
          passwordHash,
          role: input.role,
        },
      });

      if (input.mode === "create") {
        const maxOrder = await tx.author.aggregate({ _max: { order: true } });
        const author = await tx.author.create({
          data: {
            adminUserId: adminUser.id,
            name: input.name.trim(),
            photoUrl: input.photoUrl,
            title: input.title.trim() || DEFAULT_TITLE,
            practiceArea: input.practiceArea.trim(),
            credentials: input.credentials?.trim() || null,
            personalStatement: input.personalStatement.trim(),
            bio: input.bio.trim(),
            order: (maxOrder._max.order ?? 0) + 1,
          },
        });
        return { adminUserId: adminUser.id, authorId: author.id };
      }

      const linked = await tx.author.updateMany({
        where: { id: input.authorId, adminUserId: null },
        data: { adminUserId: adminUser.id },
      });
      if (linked.count === 0) {
        throw new CreatePartnerError(
          "This profile was just linked to another login — refresh and try again.",
        );
      }
      return { adminUserId: adminUser.id, authorId: input.authorId };
    });
    adminUserId = created.adminUserId;
    authorId = created.authorId;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CreatePartnerError(`An account with the email "${email}" already exists.`);
    }
    throw error;
  }

  const setupUrl = await issueSetupToken(adminUserId, { baseUrl: getSiteUrl() });

  try {
    await sendTransactionalEmail({
      to: [{ email, name: input.mode === "create" ? input.name.trim() : linkedAuthorName }],
      subject: "Your Kaalbert & Company Ltd admin account",
      htmlContent: buildInviteEmailHtml(
        input.mode === "create" ? input.name.trim() : linkedAuthorName,
        password,
        setupUrl,
      ),
    });
    return { adminUserId, authorId, emailSent: true };
  } catch (error) {
    if (error instanceof EmailSendError) {
      return { adminUserId, authorId, emailSent: false, setupUrl, password };
    }
    throw error;
  }
}
