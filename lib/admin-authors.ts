import { AdminRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deactivateAdminUser, reactivateAdminUser } from "@/lib/auth/session";
import { issuePasswordResetToken } from "@/lib/auth/password-reset";
import { reissueSetupToken } from "@/lib/auth/totp-setup";
import { getSiteUrl } from "@/lib/seo";

export class AuthorValidationError extends Error {}
export class AdminUserActionError extends Error {}

export interface AuthorListRow {
  id: number;
  name: string;
  title: string;
  practiceArea: string;
  photoUrl: string | null;
  published: boolean;
  adminUserId: number | null;
  adminUserActive: boolean | null;
  adminUserRole: AdminRole | null;
}

/** `content-management-admin.md`'s Team screen (#33a, `AdminDataTable`). */
export async function getAuthorList(): Promise<AuthorListRow[]> {
  const authors = await prisma.author.findMany({
    orderBy: { order: "asc" },
    include: { adminUser: { select: { active: true, role: true } } },
  });
  return authors.map((author) => ({
    id: author.id,
    name: author.name,
    title: author.title,
    practiceArea: author.practiceArea,
    photoUrl: author.photoUrl,
    published: author.published,
    adminUserId: author.adminUserId,
    adminUserActive: author.adminUser?.active ?? null,
    adminUserRole: author.adminUser?.role ?? null,
  }));
}

export interface LinkedAdminUser {
  id: number;
  email: string;
  active: boolean;
  role: AdminRole;
}

export interface AuthorEditData {
  id: number;
  name: string;
  photoUrl: string | null;
  title: string;
  practiceArea: string;
  credentials: string | null;
  personalStatement: string;
  bio: string;
  order: number;
  published: boolean;
  adminUser: LinkedAdminUser | null;
}

export async function getAuthorForEdit(id: number): Promise<AuthorEditData | null> {
  const author = await prisma.author.findUnique({
    where: { id },
    include: { adminUser: { select: { id: true, email: true, active: true, role: true } } },
  });
  if (!author) {
    return null;
  }
  return {
    id: author.id,
    name: author.name,
    photoUrl: author.photoUrl,
    title: author.title,
    practiceArea: author.practiceArea,
    credentials: author.credentials,
    personalStatement: author.personalStatement,
    bio: author.bio,
    order: author.order,
    published: author.published,
    adminUser: author.adminUser,
  };
}

/**
 * Resolves the authenticated session's `admin_user.id` to their own `author` row, for the
 * Team list screen's "this is you" marker (`content-management-admin.md`'s "the normal path
 * is self-service"). `null` for a signed-in partner with no linked profile yet (including
 * this project's own dev/test-only admin account, deliberately not tied to a real partner).
 */
export async function getAuthorIdForAdminUser(adminUserId: number): Promise<number | null> {
  const author = await prisma.author.findUnique({
    where: { adminUserId },
    select: { id: true },
  });
  return author?.id ?? null;
}

export interface AuthorSaveInput {
  name: string;
  photoUrl: string | null;
  title: string;
  practiceArea: string;
  credentials: string | null;
  personalStatement: string;
  bio: string;
  order: number;
  published: boolean;
}

const DEFAULT_TITLE = "Partner";

/**
 * `published` was originally computed here (never a directly-editable checkbox) from exactly
 * three fields, with a save blocked outright whenever that computation would unpublish an
 * author who already has articles — revised at session 60 to a **computed guard plus a
 * manual override**, per `prisma/schema.prisma`'s `Author` doc-comment: the guard below still
 * rejects `published: true` while any of name/practiceArea/personalStatement is blank, but
 * the caller (an Owner, or the partner editing their own profile) now explicitly says what
 * the value should be, and unpublishing a partner who already has articles is now a normal,
 * intentional action (the entire point of building this toggle), not blocked — `lib/
 * insights.ts`'s byline rendering already falls back to crediting the firm itself when
 * `author.published` is false (T7.11, session 55), so this is a real, already-safe state,
 * not one that needs preventing. `photo_url`/`credentials` remain explicitly NOT gating
 * (T2.5, session 11), and `bio` never was gating (corrected at T7.6, session 49).
 */
export async function updateAuthor(id: number, input: AuthorSaveInput): Promise<void> {
  const existing = await prisma.author.findUnique({ where: { id } });
  if (!existing) {
    throw new AuthorValidationError("Author not found.");
  }

  const name = input.name.trim();
  const practiceArea = input.practiceArea.trim();
  const personalStatement = input.personalStatement.trim();
  const title = input.title.trim() || DEFAULT_TITLE;
  const bio = input.bio.trim();
  const credentials = input.credentials?.trim() || null;

  if (!Number.isInteger(input.order) || input.order < 1) {
    throw new AuthorValidationError("Display order must be a positive whole number.");
  }

  const canPublish = Boolean(name && practiceArea && personalStatement);
  if (input.published && !canPublish) {
    throw new AuthorValidationError(
      "Name, practice area, and personal statement are all required before this profile can be published.",
    );
  }

  await prisma.author.update({
    where: { id },
    data: {
      name,
      photoUrl: input.photoUrl,
      title,
      practiceArea,
      credentials,
      personalStatement,
      bio,
      order: input.order,
      published: input.published,
    },
  });
}

async function requireAdminUser(adminUserId: number) {
  const adminUser = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!adminUser) {
    throw new AdminUserActionError("Account not found.");
  }
  return adminUser;
}

/**
 * The three admin-facing account actions T7.6's own session-42 addendum names, all thin
 * wrappers over already-built, already-tested `lib/auth/*` functions
 * (`memory/technical-debt.md` → "No admin-facing way to deactivate/reactivate an account,
 * reset an existing partner's 2FA enrolment, or reset an existing partner's password") — this
 * task's job is only to add the existence check and surface a button/link for each, not to
 * build new auth mechanics. `deactivateAdminUser` only ever built the deactivate direction;
 * `reactivateAdminUser` (`lib/auth/session.ts`) is new at this same task.
 *
 * `callerId` added at session 60, alongside real Owner-only route gating for this whole
 * family of actions: a self-lockout guard specifically for deactivation — an Owner
 * deactivating *their own* account would end their own session with no other way back in
 * short of another Owner reactivating them, a real footgun with no legitimate use case (an
 * Owner who wants to stop using their own account should ask another Owner to do it, the
 * same way every other account-on-someone-else action here already works).
 */
export async function setAdminUserActive(
  adminUserId: number,
  active: boolean,
  callerId: number,
): Promise<void> {
  await requireAdminUser(adminUserId);
  if (!active && adminUserId === callerId) {
    throw new AdminUserActionError(
      "You can't deactivate your own account — ask another Owner to do it.",
    );
  }
  if (active) {
    await reactivateAdminUser(adminUserId);
  } else {
    await deactivateAdminUser(adminUserId);
  }
}

/**
 * Returns the fresh `/admin/setup-2fa` link — the admin relays it to the affected partner,
 * the same relay pattern `npm run admin:create-user` already uses for a brand-new account.
 *
 * **Real bug found and fixed at session 60**: this originally called `issueSetupToken`
 * directly, which only ever writes `setup_token`/`setup_token_expires_at` — it never clears
 * `totp_enabled`/`totp_secret`. For the account this function actually exists for (someone
 * who *already has* 2FA enabled and lost their device — the whole reason a reset is being
 * requested at all), `resolvePendingTotpSetup`/`confirmTotpSetup` both reject any token for an
 * account where `totp_enabled` is still `true`, so the link this function handed out was
 * *always* dead on arrival for its one real use case; only an account with no 2FA yet (never
 * this function's actual target) would have worked. Never caught before because the only
 * existing test mocked `issueSetupToken` directly rather than exercising the real
 * `totpEnabled` gate — the same "looks done, never reachable in practice" pattern this whole
 * session's plan is about. Now uses `reissueSetupToken` (`lib/auth/totp-setup.ts`), the same
 * reset-then-issue helper `/admin/account`'s new self-service "Set up a new device" action
 * uses, which mirrors the reset `lib/auth/login.ts`'s backup-code recovery flow already
 * performs before its own call to `issueSetupToken`.
 */
export async function resetAdminUserTotp(adminUserId: number): Promise<string> {
  await requireAdminUser(adminUserId);
  return reissueSetupToken(adminUserId, { baseUrl: getSiteUrl() });
}

/** Returns the fresh `/admin/reset-password` link — same relay pattern as `resetAdminUserTotp`. */
export async function resetAdminUserPassword(adminUserId: number): Promise<string> {
  await requireAdminUser(adminUserId);
  return issuePasswordResetToken(adminUserId, { baseUrl: getSiteUrl() });
}

/**
 * Promotes/demotes an account between Owner and Partner — session 60, the first real writer
 * of `AdminUser.role` anywhere in this codebase. Guards against the firm ever being left with
 * zero Owners (nobody left who could promote anyone back) by refusing to demote the *last*
 * remaining Owner — the same "can't remove the last one" shape as
 * `setDiagnosticQuestionActive`'s "can't deactivate the last active question in a dimension"
 * guard, applied to accounts instead of questions.
 */
export async function setAdminUserRole(adminUserId: number, role: AdminRole): Promise<void> {
  const adminUser = await requireAdminUser(adminUserId);
  if (adminUser.role === role) return;

  if (adminUser.role === AdminRole.OWNER && role === AdminRole.PARTNER) {
    const ownerCount = await prisma.adminUser.count({ where: { role: AdminRole.OWNER } });
    if (ownerCount <= 1) {
      throw new AdminUserActionError(
        "Can't demote the last Owner — promote another account to Owner first.",
      );
    }
  }

  await prisma.adminUser.update({ where: { id: adminUserId }, data: { role } });
}
