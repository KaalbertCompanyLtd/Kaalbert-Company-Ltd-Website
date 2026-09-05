/*
  T2.1 already seeded 3 real `offer` rows (home-page card fields only). This migration adds
  T2.2's remaining required columns to that non-empty table, so a plain `ADD COLUMN ... NOT
  NULL` (which Prisma's own diff produces) can't run as-is. Columns are added nullable, then
  backfilled with an empty placeholder value, then set NOT NULL in the same migration —
  `prisma/seed.ts`'s `seedOffers()` (updated at T2.2 to a real `update:` clause, not the
  previous no-op `update: {}`) overwrites these placeholders with real content immediately
  after this migration runs, before the app ever serves a request against them.
*/

-- AlterTable
ALTER TABLE "offer" ADD COLUMN     "client_inputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cta_href" TEXT,
ADD COLUMN     "cta_label" TEXT,
ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "indicative_timeline" TEXT,
ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "meta_title" TEXT,
ADD COLUMN     "method_stages" JSONB,
ADD COLUMN     "out_of_scope_note" TEXT,
ADD COLUMN     "problem_statement" TEXT,
ADD COLUMN     "who_for" TEXT,
ADD COLUMN     "who_not_for" TEXT;

-- Backfill placeholder for the 3 existing rows, immediately overwritten by prisma/seed.ts.
UPDATE "offer" SET
  "cta_href" = '',
  "cta_label" = '',
  "faqs" = '[]'::jsonb,
  "meta_description" = '',
  "meta_title" = '',
  "method_stages" = '[]'::jsonb,
  "out_of_scope_note" = '',
  "problem_statement" = '',
  "who_for" = '',
  "who_not_for" = ''
WHERE "problem_statement" IS NULL;

-- AlterTable: now safe to enforce NOT NULL
ALTER TABLE "offer"
  ALTER COLUMN "cta_href" SET NOT NULL,
  ALTER COLUMN "cta_label" SET NOT NULL,
  ALTER COLUMN "faqs" SET NOT NULL,
  ALTER COLUMN "meta_description" SET NOT NULL,
  ALTER COLUMN "meta_title" SET NOT NULL,
  ALTER COLUMN "method_stages" SET NOT NULL,
  ALTER COLUMN "out_of_scope_note" SET NOT NULL,
  ALTER COLUMN "problem_statement" SET NOT NULL,
  ALTER COLUMN "who_for" SET NOT NULL,
  ALTER COLUMN "who_not_for" SET NOT NULL;

-- CreateTable
CREATE TABLE "offer_tier" (
    "id" SERIAL NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "duration_label" TEXT NOT NULL,
    "scope_label" TEXT NOT NULL,
    "fee_amount_min" INTEGER NOT NULL,
    "fee_amount_max" INTEGER NOT NULL,
    "fee_currency" TEXT NOT NULL,
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_inputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offer_tier_offer_id_sort_order_key" ON "offer_tier"("offer_id", "sort_order");

-- AddForeignKey
ALTER TABLE "offer_tier" ADD CONSTRAINT "offer_tier_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
