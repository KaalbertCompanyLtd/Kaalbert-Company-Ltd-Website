import { prisma } from "@/lib/prisma";
import { deactivateAdminUser, reactivateAdminUser } from "@/lib/auth/session";
import { issuePasswordResetToken } from "@/lib/auth/password-reset";
import { issueSetupToken } from "@/lib/auth/totp-setup";
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
}

/** `content-management-admin.md`'s Team screen (#33a, `AdminDataTable`). */
export async function getAuthorList(): Promise<AuthorListRow[]> {
  const authors = await prisma.author.findMany({
    orderBy: { order: "asc" },
    include: { adminUser: { select: { active: true } } },
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
  }));
}

export interface LinkedAdminUser {
  id: number;
  email: string;
  active: boolean;
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
    include: { adminUser: { select: { id: true, email: true, active: true } } },
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
}

const DEFAULT_TITLE = "Partner";

/**
 * `published` is computed here, never a directly-editable checkbox — exactly the three
 * fields `about-and-partners-page.md`'s own edge case and this task's Input→Output contract
 * name (name, practice area, personal statement) gate it; `photo_url`/`credentials` are
 * explicitly NOT gating (revised at T2.5 per explicit firm direction, session 11 — see
 * `memory/decision-log.md`), and `bio` never was gating despite a stale schema doc-comment
 * that said otherwise (corrected at T7.6, session 49 — see this task's own decision-log
 * entry). A save that would leave the profile incomplete is rejected outright when the
 * partner already has articles crediting them as author — `lib/insights.ts`'s byline
 * rendering has no `published` check of its own (a real, separately-logged gap;
 * `memory/known-bugs.md`), so this validation is what actually keeps this task's own
 * acceptance criterion ("never appears... as an article byline") true in practice: an
 * author who already has articles simply can never reach the missing-required-field state
 * through this editor.
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

  const published = Boolean(name && practiceArea && personalStatement);
  if (!published) {
    const articleCount = await prisma.article.count({ where: { authorId: id } });
    if (articleCount > 0) {
      throw new AuthorValidationError(
        `Name, practice area, and personal statement can't be left blank — ${articleCount} ` +
          `article${articleCount === 1 ? "" : "s"} already credit this partner as author.`,
      );
    }
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
      published,
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
 */
export async function setAdminUserActive(adminUserId: number, active: boolean): Promise<void> {
  await requireAdminUser(adminUserId);
  if (active) {
    await reactivateAdminUser(adminUserId);
  } else {
    await deactivateAdminUser(adminUserId);
  }
}

/** Returns the fresh `/admin/setup-2fa` link — the admin relays it to the affected partner,
 * the same relay pattern `npm run admin:create-user` already uses for a brand-new account. */
export async function resetAdminUserTotp(adminUserId: number): Promise<string> {
  await requireAdminUser(adminUserId);
  return issueSetupToken(adminUserId, { baseUrl: getSiteUrl() });
}

/** Returns the fresh `/admin/reset-password` link — same relay pattern as `resetAdminUserTotp`. */
export async function resetAdminUserPassword(adminUserId: number): Promise<string> {
  await requireAdminUser(adminUserId);
  return issuePasswordResetToken(adminUserId, { baseUrl: getSiteUrl() });
}
