-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "billingDate" TIMESTAMP(3),
ADD COLUMN     "billingStatus" TEXT DEFAULT 'not_billed',
ADD COLUMN     "scheduledDeletionDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL,
    "originalTaskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "billingDate" TIMESTAMP(3) NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedByName" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "clientId" TEXT,
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskHistory_clientId_idx" ON "TaskHistory"("clientId");

-- CreateIndex
CREATE INDEX "TaskHistory_billingDate_idx" ON "TaskHistory"("billingDate");

-- CreateIndex
CREATE INDEX "Task_billingStatus_idx" ON "Task"("billingStatus");
