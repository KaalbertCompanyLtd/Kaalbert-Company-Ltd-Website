-- CreateEnum
CREATE TYPE "AdminLoginAttemptKind" AS ENUM ('password', 'totp', 'setup_confirm');

-- AlterTable
ALTER TABLE "admin_session" ADD COLUMN     "last_activity_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "admin_user" ADD COLUMN     "last_verified_totp_step" INTEGER;

-- CreateTable
CREATE TABLE "admin_login_attempt" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "kind" "AdminLoginAttemptKind" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_login_attempt_identifier_kind_created_at_idx" ON "admin_login_attempt"("identifier", "kind", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_session_token_key" ON "admin_session"("token");
