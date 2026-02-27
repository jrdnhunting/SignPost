-- Rename WorkOrder.description to WorkOrder.orderNotes
ALTER TABLE "WorkOrder" RENAME COLUMN "description" TO "orderNotes";

-- Add listingGoLiveDate to WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN "listingGoLiveDate" TIMESTAMP(3);

-- Add clientNotesPublic and clientNotesPrivate to Client
ALTER TABLE "Client" ADD COLUMN "clientNotesPublic" TEXT;
ALTER TABLE "Client" ADD COLUMN "clientNotesPrivate" TEXT;
