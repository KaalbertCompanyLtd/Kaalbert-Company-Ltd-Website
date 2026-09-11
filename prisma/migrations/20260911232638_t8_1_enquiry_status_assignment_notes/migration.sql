-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('new', 'contacted', 'closed', 'converted', 'not_a_fit');

-- AlterTable
ALTER TABLE "enquiry_record" ADD COLUMN     "assigned_partner_id" INTEGER,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "status" "EnquiryStatus" NOT NULL DEFAULT 'new',
ADD COLUMN     "status_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "triage_priority_level" TEXT;

-- AddForeignKey
ALTER TABLE "enquiry_record" ADD CONSTRAINT "enquiry_record_assigned_partner_id_fkey" FOREIGN KEY ("assigned_partner_id") REFERENCES "admin_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
