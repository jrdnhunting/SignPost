-- WorkOrder: add scheduled removal date
ALTER TABLE "WorkOrder"
  ADD COLUMN "scheduledRemovalDate" TIMESTAMP(3);
