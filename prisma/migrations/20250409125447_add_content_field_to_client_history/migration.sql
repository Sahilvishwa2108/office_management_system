/*
  Warnings:

  - Added the required column `content` to the `ClientHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClientHistory" ADD COLUMN     "content" TEXT NOT NULL;
