-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "details" JSONB;

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
