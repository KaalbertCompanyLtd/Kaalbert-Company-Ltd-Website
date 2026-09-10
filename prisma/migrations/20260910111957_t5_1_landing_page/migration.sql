-- CreateTable
CREATE TABLE "landing_page" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "kicker" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "opening_paragraph" TEXT NOT NULL,
    "body_content" JSONB NOT NULL,
    "cta_label" TEXT NOT NULL,
    "cta_href" TEXT NOT NULL,
    "campaign_reference" TEXT NOT NULL,
    "meta_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_page_slug_key" ON "landing_page"("slug");
