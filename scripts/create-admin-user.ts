/**
 * T6.6's developer-run initial admin account provisioning script — run via
 * `npm run admin:create-user -- --name "..." --email "..." [--password "..."]`
 * (`tsx scripts/create-admin-user.ts`, same execution convention as
 * `scripts/cleanup-attribution.ts`).
 *
 * Not a self-service `/admin` "invite a partner" UI — with a fixed five partners and new
 * accounts created rarely, a developer-run script is proportionate; a full invite-UI would
 * be more process than this firm's scale justifies (same reasoning
 * `content-management-admin.md`'s own business rules give for not building a copy-approval
 * routing layer — see `docs/tasks/06-admin-auth.md` T6.6).
 *
 * Same env-loading gotcha as `scripts/cleanup-attribution.ts`: run directly by `tsx`, nothing
 * else loads `.env.local`/`.env.production`/`.env` first, so it does so itself here, same
 * file precedence `prisma7.config.ts` uses. Every module that transitively imports
 * `lib/prisma` is imported dynamically inside `main()`, after `config()` runs — a static
 * `import` at the top of this file would be hoisted above these `config()` calls regardless
 * of where it's written, reading `process.env.DATABASE_URL` before it's populated (that
 * file's own doc-comment explains the real, previously-hit failure this avoids).
 *
 * Deliberately prints the generated password and the one-time setup link to stdout — this
 * project's standing "never log a raw credential" rule (every other `lib/auth/` module)
 * doesn't apply here: printing both is this script's literal job, the only way a developer
 * relays them to a new partner. Never write either value anywhere else — no file, no extra
 * database column, no HTTP response.
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";

config({ path: ".env.local" });
config({ path: ".env.production" });
config({ path: ".env" });

interface ParsedArgs {
  name: string;
  email: string;
  password?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const raw: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }
    raw[key] = value;
    i++;
  }

  if (!raw.name) throw new Error("Missing required --name argument.");
  if (!raw.email) throw new Error("Missing required --email argument.");

  return { name: raw.name, email: raw.email, password: raw.password };
}

/** 24 random bytes as base64url — ~32 characters, no shell-unsafe symbols, strong entropy. */
function generatePassword(): string {
  return randomBytes(24).toString("base64url");
}

async function main() {
  const { name, email: rawEmail, password: providedPassword } = parseArgs(process.argv.slice(2));
  const email = rawEmail.trim().toLowerCase();
  const password = providedPassword ?? generatePassword();

  const { prisma } = await import("../lib/prisma");
  const { Prisma } = await import("../generated/prisma/client");
  const { hashPassword } = await import("../lib/auth/password");
  const { issueSetupToken } = await import("../lib/auth/totp-setup");
  const { getSiteUrl } = await import("../lib/seo");

  try {
    const user = await prisma.adminUser.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });

    const setupUrl = await issueSetupToken(user.id, { baseUrl: getSiteUrl() });

    console.log(`Created admin_user #${user.id} (${user.email}).`);
    if (!providedPassword) {
      console.log(`Initial password (generated): ${password}`);
    }
    console.log(`Setup link (send via a secure channel — valid 7 days): ${setupUrl}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      console.error(`An admin_user with the email "${email}" already exists.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
