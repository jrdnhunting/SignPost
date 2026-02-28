-- Make workOrderId nullable (for unlinked anonymous removal requests)
ALTER TABLE "Task" ALTER COLUMN "workOrderId" DROP NOT NULL;

-- Drop the cascade FK and recreate with SET NULL on delete
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_workOrderId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop unique index that included workOrderId (now nullable, can't be unique with NULLs this way)
DROP INDEX IF EXISTS "Task_workOrderId_taskNumber_key";

-- Add new columns
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "completionData" JSONB;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "submissionAddress" TEXT;
