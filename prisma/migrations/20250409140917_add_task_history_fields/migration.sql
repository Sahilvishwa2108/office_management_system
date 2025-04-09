/*
  Warnings:

  - You are about to drop the column `metadata` on the `ClientHistory` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClientHistory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ClientHistory_type_idx";

-- AlterTable
ALTER TABLE "ClientHistory" DROP COLUMN "metadata",
DROP COLUMN "updatedAt",
ADD COLUMN     "billingDetails" JSONB,
ADD COLUMN     "taskBilledDate" TIMESTAMP(3),
ADD COLUMN     "taskCompletedDate" TIMESTAMP(3),
ADD COLUMN     "taskDescription" TEXT,
ADD COLUMN     "taskId" TEXT,
ADD COLUMN     "taskStatus" TEXT,
ADD COLUMN     "taskTitle" TEXT;

-- CreateIndex
CREATE INDEX "ClientHistory_taskId_idx" ON "ClientHistory"("taskId");
