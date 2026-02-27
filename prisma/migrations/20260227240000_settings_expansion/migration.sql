-- Organization: add company profile fields
ALTER TABLE "Organization"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "country" TEXT DEFAULT 'US',
  ADD COLUMN "outOfServiceAreaMessage" TEXT;

-- ServiceArea table
CREATE TABLE "ServiceArea" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "polygon" JSONB NOT NULL,
  "pricingAdjustment" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceArea_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX "ServiceArea_organizationId_idx" ON "ServiceArea"("organizationId");

-- ServiceAreaTechnician join table
CREATE TABLE "ServiceAreaTechnician" (
  "id" TEXT NOT NULL,
  "serviceAreaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceAreaTechnician_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceAreaTechnician_serviceAreaId_fkey"
    FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE,
  CONSTRAINT "ServiceAreaTechnician_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ServiceAreaTechnician_serviceAreaId_userId_key"
  ON "ServiceAreaTechnician"("serviceAreaId", "userId");
CREATE INDEX "ServiceAreaTechnician_serviceAreaId_idx" ON "ServiceAreaTechnician"("serviceAreaId");
CREATE INDEX "ServiceAreaTechnician_userId_idx" ON "ServiceAreaTechnician"("userId");

-- WorkOrder: add service area fields
ALTER TABLE "WorkOrder"
  ADD COLUMN "serviceAreaId" TEXT,
  ADD COLUMN "serviceAreaFee" DECIMAL(10,2);
ALTER TABLE "WorkOrder"
  ADD CONSTRAINT "WorkOrder_serviceAreaId_fkey"
    FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE SET NULL;

-- Membership: allow multiple roles per user per org
DROP INDEX IF EXISTS "Membership_organizationId_userId_key";
CREATE UNIQUE INDEX "Membership_organizationId_userId_role_key"
  ON "Membership"("organizationId", "userId", "role");
