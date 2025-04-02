/*
  Warnings:

  - You are about to drop the column `userId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the `ClientHistory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `managerId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `contactPerson` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_createdById_fkey";

-- DropIndex
DROP INDEX "Client_companyName_idx";

-- DropIndex
DROP INDEX "Client_userId_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "userId",
ADD COLUMN     "managerId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "contactPerson" SET NOT NULL;

-- DropTable
DROP TABLE "ClientHistory";

-- CreateIndex
CREATE INDEX "Client_managerId_idx" ON "Client"("managerId");

-- CreateIndex
CREATE INDEX "Client_contactPerson_idx" ON "Client"("contactPerson");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
