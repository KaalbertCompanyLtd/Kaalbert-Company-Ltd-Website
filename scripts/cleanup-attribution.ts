/**
 * T5.4's 90-day `attribution` retention job — run via `npm run attribution:cleanup`
 * (`tsx scripts/cleanup-attribution.ts`, same execution convention as `prisma/seed.ts`).
 *
 * Unlike `prisma/seed.ts` (always invoked through `prisma db seed`, which loads env vars via
 * `prisma7.config.ts` before ever running the script), this one is run directly by `tsx` —
 * nothing else loads `.env.local`/`.env.production`/`.env` first, so it does so itself here,
 * same file precedence `prisma7.config.ts` uses (`.env.local` wins, since `dotenv.config`
 * never overrides an already-set var). `lib/prisma`/`lib/attribution-cleanup` are imported
 * dynamically, after `config()` runs — ES module `import` statements are hoisted above all
 * other top-level code (including this file's own `config()` calls, textual order
 * notwithstanding), so a static import of `lib/prisma` here would read
 * `process.env.DATABASE_URL` before `config()` ever populated it, throwing
 * `db-adapter.ts`'s "DATABASE_URL is not set" (hit for real writing this task — the fix is
 * `await import(...)`, not reordering statements that don't actually control execution order
 * here).
 *
 * Not yet wired to an actual schedule — Railway's own Cron Job feature (a schedule set on
 * a service via the Railway dashboard, running this same command) is the natural mechanism
 * per this project's hosting stack (ADR 0003), but configuring one is a Railway dashboard
 * action, not a repo file, and specifically an infrastructure step for the user to take at
 * their discretion, not something to set up unasked (see `memory/technical-debt.md`).
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env.production" });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { deleteExpiredAttributionRows } = await import("../lib/attribution-cleanup");

  try {
    const count = await deleteExpiredAttributionRows();
    console.log(`[attribution:cleanup] Deleted ${count} expired attribution row(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
