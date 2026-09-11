-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminLoginAttemptKind" ADD VALUE 'password_reset_request';
ALTER TYPE "AdminLoginAttemptKind" ADD VALUE 'password_reset_confirm';

-- AlterTable
ALTER TABLE "admin_user" ADD COLUMN     "password_reset_token" TEXT,
ADD COLUMN     "password_reset_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_password_reset_token_key" ON "admin_user"("password_reset_token");
