-- CreateTable
CREATE TABLE "page" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "hero_kicker" TEXT NOT NULL,
    "hero_heading" TEXT NOT NULL,
    "hero_lead" TEXT NOT NULL,
    "intro_copy" TEXT,
    "meta_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisory_retainer" (
    "id" SERIAL NOT NULL,
    "fee_amount" INTEGER NOT NULL,
    "fee_currency" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisory_retainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_slug_key" ON "page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "capability_slug_key" ON "capability"("slug");
