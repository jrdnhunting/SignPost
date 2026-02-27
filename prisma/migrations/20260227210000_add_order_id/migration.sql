-- Add nextOrderSeq counter to Organization
ALTER TABLE "Organization" ADD COLUMN "nextOrderSeq" INTEGER NOT NULL DEFAULT 0;

-- Add orderId to WorkOrder as nullable first (for backfill)
ALTER TABLE "WorkOrder" ADD COLUMN "orderId" INTEGER;

-- Backfill orderId for existing work orders ordered by createdAt per org,
-- and set nextOrderSeq to the count of existing work orders in each org.
DO $$
DECLARE
  org_record RECORD;
  wo_record  RECORD;
  counter    INTEGER;
BEGIN
  FOR org_record IN SELECT id FROM "Organization" LOOP
    counter := 0;
    FOR wo_record IN
      SELECT id FROM "WorkOrder"
      WHERE "organizationId" = org_record.id
      ORDER BY "createdAt" ASC
    LOOP
      UPDATE "WorkOrder" SET "orderId" = counter WHERE id = wo_record.id;
      counter := counter + 1;
    END LOOP;
    UPDATE "Organization" SET "nextOrderSeq" = counter WHERE id = org_record.id;
  END LOOP;
END $$;

-- Now enforce NOT NULL and unique constraint
ALTER TABLE "WorkOrder" ALTER COLUMN "orderId" SET NOT NULL;
CREATE UNIQUE INDEX "WorkOrder_organizationId_orderId_key" ON "WorkOrder"("organizationId", "orderId");
