CREATE TYPE "CatalogItemType" AS ENUM ('MAIN_SERVICE', 'ADD_ON', 'PRODUCT', 'FEE');

CREATE TABLE "CatalogItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2),
  "serviceType" "CatalogItemType" NOT NULL DEFAULT 'MAIN_SERVICE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CatalogItem_organizationId_idx" ON "CatalogItem"("organizationId");
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "triggerDays" INTEGER NOT NULL DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailTemplate_organizationId_idx" ON "EmailTemplate"("organizationId");
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailLog" (
  "id" TEXT NOT NULL,
  "emailTemplateId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailLog_emailTemplateId_workOrderId_key" UNIQUE ("emailTemplateId", "workOrderId")
);
CREATE INDEX "EmailLog_workOrderId_idx" ON "EmailLog"("workOrderId");
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_emailTemplateId_fkey"
  FOREIGN KEY ("emailTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "QRCode" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QRCode_code_key" UNIQUE ("code")
);
CREATE INDEX "QRCode_organizationId_idx" ON "QRCode"("organizationId");
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Organization" ADD COLUMN "websiteUrl" TEXT;
