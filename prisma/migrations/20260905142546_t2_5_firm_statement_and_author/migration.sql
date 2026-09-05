-- CreateTable
CREATE TABLE "firm_statement" (
    "id" SERIAL NOT NULL,
    "standing_intro" TEXT NOT NULL,
    "values" TEXT[],
    "forward_heading" TEXT NOT NULL,
    "forward_body" TEXT NOT NULL,
    "scope_body" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firm_statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author" (
    "id" SERIAL NOT NULL,
    "admin_user_id" INTEGER,
    "name" TEXT NOT NULL,
    "photo_url" TEXT,
    "practice_area" TEXT NOT NULL,
    "credentials" TEXT,
    "personal_statement" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);
