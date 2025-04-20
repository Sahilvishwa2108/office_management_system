-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTNER', 'BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending_billing', 'billed', 'paid');

-- CreateTable
CREATE TABLE "User" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(75) NOT NULL,
    "phone" VARCHAR(15),
    "password" VARCHAR(100),
    "passwordResetToken" VARCHAR(100),
    "passwordResetTokenExpiry" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'BUSINESS_EXECUTIVE',
    "avatar" VARCHAR(150),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "canApproveBilling" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" CHAR(36) NOT NULL,
    "contactPerson" VARCHAR(50) NOT NULL,
    "companyName" VARCHAR(75),
    "email" VARCHAR(75),
    "phone" VARCHAR(15),
    "address" VARCHAR(150),
    "notes" TEXT,
    "gstin" VARCHAR(15),
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "accessExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" CHAR(36) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" CHAR(36) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "billingStatus" "BillingStatus" DEFAULT 'pending_billing',
    "billingDate" TIMESTAMP(3),
    "scheduledDeletionDate" TIMESTAMP(3),
    "assignedById" CHAR(36) NOT NULL,
    "assignedToId" CHAR(36),
    "clientId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" CHAR(36) NOT NULL,
    "filename" VARCHAR(150) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "mimetype" VARCHAR(50) NOT NULL,
    "size" INTEGER NOT NULL,
    "clientId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" CHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" CHAR(36) NOT NULL,
    "title" VARCHAR(75) NOT NULL,
    "content" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "taskId" CHAR(36),
    "sentById" CHAR(36) NOT NULL,
    "sentToId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" CHAR(36) NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "details" JSONB,
    "userId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" CHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientHistory" (
    "id" CHAR(36) NOT NULL,
    "clientId" CHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" CHAR(36) NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "taskId" CHAR(36),
    "taskTitle" VARCHAR(255),
    "taskDescription" TEXT,
    "taskStatus" VARCHAR(50),
    "taskCompletedDate" TIMESTAMP(3),
    "taskBilledDate" TIMESTAMP(3),
    "billingDetails" JSONB,

    CONSTRAINT "ClientHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" CHAR(36) NOT NULL,
    "title" VARCHAR(75) NOT NULL,
    "username" VARCHAR(75) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "clientId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "active_users_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Client_managerId_idx" ON "Client"("managerId");

-- CreateIndex
CREATE INDEX "Client_contactPerson_idx" ON "Client"("contactPerson");

-- CreateIndex
CREATE INDEX "overdue_tasks_idx" ON "Task"("status", "dueDate" ASC);

-- CreateIndex
CREATE INDEX "Task_assignedById_idx" ON "Task"("assignedById");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_billingStatus_idx" ON "Task"("billingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Attachment_clientId_idx" ON "Attachment"("clientId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Notification_sentById_idx" ON "Notification"("sentById");

-- CreateIndex
CREATE INDEX "Notification_sentToId_idx" ON "Notification"("sentToId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId");

-- CreateIndex
CREATE INDEX "ClientHistory_clientId_idx" ON "ClientHistory"("clientId");

-- CreateIndex
CREATE INDEX "ClientHistory_createdById_idx" ON "ClientHistory"("createdById");

-- CreateIndex
CREATE INDEX "ClientHistory_taskId_idx" ON "ClientHistory"("taskId");

-- CreateIndex
CREATE INDEX "Credential_clientId_idx" ON "Credential"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sentToId_fkey" FOREIGN KEY ("sentToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientHistory" ADD CONSTRAINT "ClientHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientHistory" ADD CONSTRAINT "ClientHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
