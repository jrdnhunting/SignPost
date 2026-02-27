-- Migrate existing WorkOrder status values to new workflow statuses

UPDATE "WorkOrder" SET "status" = 'PENDING'              WHERE "status" IN ('DRAFT', 'SUBMITTED');
UPDATE "WorkOrder" SET "status" = 'CONFIRMED'            WHERE "status" = 'SCHEDULED';
UPDATE "WorkOrder" SET "status" = 'PENDING_INSTALLATION' WHERE "status" = 'IN_PROGRESS';
UPDATE "WorkOrder" SET "status" = 'INSTALLED'            WHERE "status" = 'COMPLETED';
