-- CreateTable
CREATE TABLE "method_stage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "what_happens" TEXT NOT NULL,
    "client_sees" TEXT NOT NULL,
    "decision_point" TEXT NOT NULL,
    "capability_transfer_note" TEXT,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "method_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "method_stage_order_key" ON "method_stage"("order");
