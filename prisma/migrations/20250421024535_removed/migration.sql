/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropIndex
DROP INDEX "Task_assignedToId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedToId";
