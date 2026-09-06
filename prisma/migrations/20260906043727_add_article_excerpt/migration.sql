/*
  Warnings:

  - Added the required column `excerpt` to the `article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "article" ADD COLUMN     "excerpt" TEXT NOT NULL;
