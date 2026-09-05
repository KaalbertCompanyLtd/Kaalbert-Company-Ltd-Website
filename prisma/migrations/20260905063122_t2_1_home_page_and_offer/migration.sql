-- CreateTable
CREATE TABLE "home_page_content" (
    "id" SERIAL NOT NULL,
    "hero_statement" TEXT NOT NULL,
    "primary_cta_label" TEXT NOT NULL,
    "primary_cta_href" TEXT NOT NULL,
    "senior_attention_copy" TEXT NOT NULL,
    "featured_article_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "meta_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "fee_amount_min" INTEGER NOT NULL,
    "fee_amount_max" INTEGER NOT NULL,
    "fee_currency" TEXT NOT NULL,
    "scope_cap" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offer_slug_key" ON "offer"("slug");
