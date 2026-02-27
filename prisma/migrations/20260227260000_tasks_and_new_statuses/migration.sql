-- Migration: Tasks system, new WorkOrderStatus values, ownerId, remove title, removal form settings

-- ── New enum types ────────────────────────────────────────────────────────

CREATE TYPE "TaskType" AS ENUM (
  'CONFIRM_ORDER',
  'UTILITY_MARKING',
  'INSTALLATION',
  'REMOVAL',
  'REMOVAL_REQUEST',
  'SERVICE'
);

CREATE TYPE "TaskStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

-- ── Add new WorkOrderStatus values (cannot remove old ones in Postgres) ───

ALTER TYPE "WorkOrderStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "WorkOrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "WorkOrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_INSTALLATION';
ALTER TYPE "WorkOrderStatus" ADD VALUE IF NOT EXISTS 'INSTALLED';
ALTER TYPE "WorkOrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_REMOVAL';

-- ── Migrate existing work order data to new statuses ──────────────────────
-- Must happen in a separate transaction after enum values are committed

-- ── Organization: removal form fields ─────────────────────────────────────

ALTER TABLE "Organization"
  ADD COLUMN "removalFormText" TEXT,
  ADD COLUMN "removalFormUrl"  TEXT;

-- ── WorkOrder: add ownerId, remove title ──────────────────────────────────

ALTER TABLE "WorkOrder"
  ADD COLUMN "ownerId" TEXT;

ALTER TABLE "WorkOrder"
  ADD CONSTRAINT "WorkOrder_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL;

CREATE INDEX "WorkOrder_ownerId_idx" ON "WorkOrder"("ownerId");

ALTER TABLE "WorkOrder" DROP COLUMN IF EXISTS "title";

-- ── Task table ────────────────────────────────────────────────────────────

CREATE TABLE "Task" (
  "id"             TEXT NOT NULL,
  "workOrderId"    TEXT NOT NULL,
  "taskType"       "TaskType" NOT NULL,
  "taskNumber"     INTEGER NOT NULL,
  "status"         "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "assignedToId"   TEXT,
  "requesterName"  TEXT,
  "requesterPhone" TEXT,
  "requesterEmail" TEXT,
  "preferredDate"  TIMESTAMP(3),
  "scheduledDate"  TIMESTAMP(3),
  "notes"          TEXT,
  "completedAt"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Task_workOrderId_fkey"
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
  CONSTRAINT "Task_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "Task_workOrderId_taskNumber_key" ON "Task"("workOrderId", "taskNumber");
CREATE INDEX "Task_workOrderId_idx"         ON "Task"("workOrderId");
CREATE INDEX "Task_assignedToId_idx"        ON "Task"("assignedToId");
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX "Task_workOrderId_status_idx"  ON "Task"("workOrderId", "status");
