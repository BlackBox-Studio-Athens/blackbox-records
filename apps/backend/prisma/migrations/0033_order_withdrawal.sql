-- Declarations are immutable support records, independent of payment/stock state.
CREATE TABLE "OrderWithdrawal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fingerprint" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contract" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "requesterHash" TEXT NOT NULL,
  "submittedAt" TEXT NOT NULL
);
CREATE INDEX "OrderWithdrawal_email_submittedAt_idx" ON "OrderWithdrawal"("email", "submittedAt");
CREATE INDEX "OrderWithdrawal_requesterHash_submittedAt_idx" ON "OrderWithdrawal"("requesterHash", "submittedAt");
CREATE INDEX "OrderWithdrawal_submittedAt_idx" ON "OrderWithdrawal"("submittedAt");

CREATE TABLE "OrderWithdrawalDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "withdrawalId" TEXT NOT NULL REFERENCES "OrderWithdrawal"("id"),
  "kind" TEXT NOT NULL CHECK ("kind" IN ('acknowledgement', 'support')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'delivered', 'needs_review')),
  "attemptCount" INTEGER NOT NULL DEFAULT 0 CHECK ("attemptCount" BETWEEN 0 AND 5),
  "nextAttemptAt" TEXT,
  "leaseUntil" TEXT,
  "safeReason" TEXT,
  UNIQUE ("withdrawalId", "kind")
);
CREATE INDEX "OrderWithdrawalDelivery_due_idx" ON "OrderWithdrawalDelivery"("status", "nextAttemptAt");
