-- Update Client model: add firstName/lastName, make companyName optional,
-- make email/phone required, add profilePhotoUrl, drop contactName.
-- Add ClientPaymentMethod model.

-- 1. Add new columns as nullable first
ALTER TABLE "Client" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Client" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Client" ADD COLUMN "profilePhotoUrl" TEXT;

-- 2. Backfill firstName/lastName from companyName
--    First word → firstName, remainder → lastName (fallback to companyName if single word)
UPDATE "Client"
SET
  "firstName" = SPLIT_PART("companyName", ' ', 1),
  "lastName"  = CASE
    WHEN POSITION(' ' IN "companyName") > 0
      THEN TRIM(SUBSTRING("companyName" FROM POSITION(' ' IN "companyName") + 1))
    ELSE "companyName"
  END;

-- 3. Now enforce NOT NULL
ALTER TABLE "Client" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "lastName" SET NOT NULL;

-- 4. Make companyName optional
ALTER TABLE "Client" ALTER COLUMN "companyName" DROP NOT NULL;

-- 5. Make email and phone required (backfill NULLs first)
UPDATE "Client" SET "email" = '' WHERE "email" IS NULL;
UPDATE "Client" SET "phone" = '' WHERE "phone" IS NULL;
ALTER TABLE "Client" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "phone" SET NOT NULL;

-- 6. Drop contactName
ALTER TABLE "Client" DROP COLUMN IF EXISTS "contactName";

-- 7. Update the compound index
DROP INDEX IF EXISTS "Client_organizationId_companyName_idx";
CREATE INDEX "Client_organizationId_lastName_firstName_idx" ON "Client"("organizationId", "lastName", "firstName");

-- 8. Create ClientPaymentMethod table
CREATE TABLE "ClientPaymentMethod" (
  "id"        TEXT         NOT NULL,
  "clientId"  TEXT         NOT NULL,
  "type"      TEXT         NOT NULL,
  "label"     TEXT         NOT NULL,
  "isDefault" BOOLEAN      NOT NULL DEFAULT false,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClientPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientPaymentMethod_clientId_idx" ON "ClientPaymentMethod"("clientId");

ALTER TABLE "ClientPaymentMethod"
  ADD CONSTRAINT "ClientPaymentMethod_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
