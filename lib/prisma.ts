import { PrismaClient } from "../generated/prisma/client";
import { createDatabaseAdapter } from "./db-adapter";

// Prisma 7 requires an explicit driver adapter rather than reading DATABASE_URL itself.
const adapter = createDatabaseAdapter(process.env.DATABASE_URL);

// Next.js hot-reloads modules in dev, which would otherwise create a new PrismaClient
// (and a new DB connection pool) on every edit. Cache the instance on `globalThis` in
// development so it survives reloads; in production each server process gets exactly one.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
