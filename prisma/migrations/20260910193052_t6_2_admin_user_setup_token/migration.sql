-- AlterTable
ALTER TABLE "admin_user" ADD COLUMN     "setup_token" TEXT,
ADD COLUMN     "setup_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_setup_token_key" ON "admin_user"("setup_token");
