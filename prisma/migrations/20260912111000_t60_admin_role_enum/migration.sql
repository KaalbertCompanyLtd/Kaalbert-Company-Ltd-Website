-- Session 60: AdminUser.role becomes a real enum (OWNER/PARTNER) instead of a plain string
-- that was never read by any authorization check. Hand-written (not `prisma migrate dev`
-- autogeneration) so the existing "partner" string values are explicitly cast rather than
-- lost to a blind column-type change.

-- 1. Create the enum type.
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'PARTNER');

-- 2. Add a new column of the enum type, defaulting every row to PARTNER.
ALTER TABLE "admin_user" ADD COLUMN "role_new" "AdminRole" NOT NULL DEFAULT 'PARTNER';

-- 3. Backfill from the old string column's real values.
UPDATE "admin_user" SET "role_new" = 'PARTNER' WHERE "role" = 'partner';
UPDATE "admin_user" SET "role_new" = 'OWNER' WHERE "role" = 'owner';

-- 4. Drop the old string column and rename the new one into its place.
ALTER TABLE "admin_user" DROP COLUMN "role";
ALTER TABLE "admin_user" RENAME COLUMN "role_new" TO "role";
