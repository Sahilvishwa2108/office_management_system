/*
  Warnings:

  - You are about to drop the `TaskHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TaskHistory";

-- CreateTable
CREATE TABLE "ClientHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientHistory_clientId_idx" ON "ClientHistory"("clientId");

-- CreateIndex
CREATE INDEX "ClientHistory_createdById_idx" ON "ClientHistory"("createdById");

-- CreateIndex
CREATE INDEX "ClientHistory_type_idx" ON "ClientHistory"("type");

-- AddForeignKey
ALTER TABLE "ClientHistory" ADD CONSTRAINT "ClientHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientHistory" ADD CONSTRAINT "ClientHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
