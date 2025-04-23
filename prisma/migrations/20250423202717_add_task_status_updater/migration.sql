-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastStatusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lastStatusUpdatedById" CHAR(36);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_lastStatusUpdatedById_fkey" FOREIGN KEY ("lastStatusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
