/*
  Same nullable-then-backfill-then-NOT-NULL pattern as the previous migration in this task —
  2 tier rows already exist from this same session's earlier seed run.
*/

-- AlterTable
ALTER TABLE "offer_tier" ADD COLUMN "scope_cap" TEXT;

UPDATE "offer_tier" SET "scope_cap" = '' WHERE "scope_cap" IS NULL;

ALTER TABLE "offer_tier" ALTER COLUMN "scope_cap" SET NOT NULL;
