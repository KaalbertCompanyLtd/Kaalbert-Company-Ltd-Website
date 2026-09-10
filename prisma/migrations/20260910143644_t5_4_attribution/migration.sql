-- AlterTable
ALTER TABLE "enquiry_record" ADD COLUMN     "attribution_id" INTEGER;

-- CreateTable
CREATE TABLE "attribution" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "landing_page" TEXT NOT NULL,
    "first_seen" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attribution_session_id_key" ON "attribution"("session_id");

-- AddForeignKey
ALTER TABLE "enquiry_record" ADD CONSTRAINT "enquiry_record_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "attribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
