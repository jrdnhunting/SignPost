ALTER TABLE "Organization"
  ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN "billingCycle"        TEXT NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "monthlyRate"         DECIMAL(10,2),
  ADD COLUMN "trialEndsAt"         TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd"    TIMESTAMP(3),
  ADD COLUMN "stripeCustomerId"    TEXT,
  ADD COLUMN "billingEmail"        TEXT,
  ADD COLUMN "billingNotes"        TEXT;
