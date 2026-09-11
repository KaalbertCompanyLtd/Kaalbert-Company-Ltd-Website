-- AlterTable
ALTER TABLE "diagnostic_question" ADD COLUMN     "choice_options" JSONB,
ADD COLUMN     "is_placeholder" BOOLEAN NOT NULL DEFAULT false;

