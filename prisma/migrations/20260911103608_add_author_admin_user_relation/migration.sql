-- CreateIndex
CREATE UNIQUE INDEX "author_admin_user_id_key" ON "author"("admin_user_id");

-- AddForeignKey
ALTER TABLE "author" ADD CONSTRAINT "author_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
