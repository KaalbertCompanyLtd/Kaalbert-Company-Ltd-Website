-- CreateTable
CREATE TABLE "diagnostic_score_band" (
    "id" SERIAL NOT NULL,
    "min_score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_score_band_pkey" PRIMARY KEY ("id")
);
