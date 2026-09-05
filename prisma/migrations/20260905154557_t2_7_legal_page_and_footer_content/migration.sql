-- CreateTable
CREATE TABLE "legal_page" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "meta_description" TEXT NOT NULL,
    "last_revised_at" TIMESTAMP(3),
    "is_placeholder" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_content" (
    "id" SERIAL NOT NULL,
    "scope_of_practice_statement" TEXT NOT NULL,
    "company_registration_details" TEXT,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_page_slug_key" ON "legal_page"("slug");
