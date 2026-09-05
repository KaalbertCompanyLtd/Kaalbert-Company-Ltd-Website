-- CreateEnum
CREATE TYPE "DiagnosticResponseType" AS ENUM ('scale', 'boolean', 'choice');

-- CreateTable
CREATE TABLE "diagnostic_dimension" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_question" (
    "id" SERIAL NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "dimension_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "response_type" "DiagnosticResponseType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_threshold" (
    "id" SERIAL NOT NULL,
    "dimension_id" INTEGER,
    "threshold_value" DOUBLE PRECISION NOT NULL,
    "triage_priority_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_threshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_response" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_value" TEXT NOT NULL,
    "enquiry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_question_dimension_id_order_key" ON "diagnostic_question"("dimension_id", "order");

-- CreateIndex
CREATE INDEX "diagnostic_response_session_id_idx" ON "diagnostic_response"("session_id");

-- AddForeignKey
ALTER TABLE "diagnostic_question" ADD CONSTRAINT "diagnostic_question_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "diagnostic_dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_threshold" ADD CONSTRAINT "diagnostic_threshold_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "diagnostic_dimension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_response" ADD CONSTRAINT "diagnostic_response_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "diagnostic_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_response" ADD CONSTRAINT "diagnostic_response_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiry_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
