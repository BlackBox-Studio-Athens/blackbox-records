ALTER TABLE "StripeCatalogWebhookEvent"
  ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'pending';

UPDATE "StripeCatalogWebhookEvent"
SET "processingStatus" = 'succeeded';

ALTER TABLE "StripeCatalogWebhookEvent"
  ADD COLUMN "processingCompletedAt" DATETIME;

ALTER TABLE "StripeCatalogWebhookEvent"
  ADD COLUMN "processingFailureReason" TEXT;

CREATE INDEX "StripeCatalogWebhookEvent_processingStatus_stripeCreatedAt_idx"
  ON "StripeCatalogWebhookEvent"("processingStatus", "stripeCreatedAt");
