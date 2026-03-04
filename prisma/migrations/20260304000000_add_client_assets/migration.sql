-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('SIGN_PANEL', 'SIGN_RIDER', 'INFO_BOX', 'YARD_SIGN');

-- CreateTable
CREATE TABLE "ClientAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "locationWorkOrderId" TEXT,
    "locationUserId" TEXT,
    "locationLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientAsset_organizationId_idx" ON "ClientAsset"("organizationId");

-- CreateIndex
CREATE INDEX "ClientAsset_clientId_idx" ON "ClientAsset"("clientId");

-- CreateIndex
CREATE INDEX "ClientAsset_locationWorkOrderId_idx" ON "ClientAsset"("locationWorkOrderId");

-- CreateIndex
CREATE INDEX "ClientAsset_locationUserId_idx" ON "ClientAsset"("locationUserId");

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_locationWorkOrderId_fkey" FOREIGN KEY ("locationWorkOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_locationUserId_fkey" FOREIGN KEY ("locationUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
