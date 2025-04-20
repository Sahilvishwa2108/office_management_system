/*
  Warnings:

  - The primary key for the `Activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Activity` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `userId` on the `Activity` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `Attachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Attachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `filename` on the `Attachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `path` on the `Attachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `mimetype` on the `Attachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `clientId` on the `Attachment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `contactPerson` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `companyName` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `email` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `phone` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `address` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `gstin` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `managerId` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `ClientHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `clientId` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `type` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `createdById` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `taskId` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `taskTitle` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `taskStatus` on the `ClientHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - The primary key for the `Credential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Credential` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `title` on the `Credential` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `username` on the `Credential` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `password` on the `Credential` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `clientId` on the `Credential` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `senderId` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `Notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `title` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `taskId` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `sentById` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `sentToId` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `title` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `billingStatus` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `assignedById` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `assignedToId` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `clientId` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `TaskAssignee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `TaskAssignee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `taskId` on the `TaskAssignee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `userId` on the `TaskAssignee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `TaskComment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `TaskComment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `taskId` on the `TaskComment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `userId` on the `TaskComment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(36)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `phone` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `passwordResetToken` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `avatar` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending_billing', 'billed', 'paid');

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_managerId_fkey";

-- DropForeignKey
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_sentById_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_sentToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_clientId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskComment" DROP CONSTRAINT "TaskComment_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskComment" DROP CONSTRAINT "TaskComment_userId_fkey";

-- DropIndex
DROP INDEX "Client_email_idx";

-- DropIndex
DROP INDEX "Client_phone_idx";

-- AlterTable
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "userId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Activity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "filename" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "path" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "mimetype" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "clientId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "contactPerson" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "companyName" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "gstin" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "managerId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "clientId" SET DATA TYPE CHAR(36),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "createdById" SET DATA TYPE CHAR(36),
ALTER COLUMN "taskId" SET DATA TYPE CHAR(36),
ALTER COLUMN "taskTitle" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "taskStatus" SET DATA TYPE VARCHAR(50),
ADD CONSTRAINT "ClientHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "clientId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Credential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "senderId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "taskId" SET DATA TYPE CHAR(36),
ALTER COLUMN "sentById" SET DATA TYPE CHAR(36),
ALTER COLUMN "sentToId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Task" DROP CONSTRAINT "Task_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(150),
DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "priority",
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
DROP COLUMN "billingStatus",
ADD COLUMN     "billingStatus" "BillingStatus" DEFAULT 'pending_billing',
ALTER COLUMN "assignedById" SET DATA TYPE CHAR(36),
ALTER COLUMN "assignedToId" SET DATA TYPE CHAR(36),
ALTER COLUMN "clientId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "taskId" SET DATA TYPE CHAR(36),
ALTER COLUMN "userId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TaskComment" DROP CONSTRAINT "TaskComment_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "taskId" SET DATA TYPE CHAR(36),
ALTER COLUMN "userId" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(36),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(75),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "passwordResetToken" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "avatar" SET DATA TYPE VARCHAR(150),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "overdue_tasks_idx" ON "Task"("status", "dueDate" ASC);

-- CreateIndex
CREATE INDEX "Task_billingStatus_idx" ON "Task"("billingStatus");

-- CreateIndex
CREATE INDEX "active_users_idx" ON "User"("isActive");

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
