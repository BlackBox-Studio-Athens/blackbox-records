UPDATE "StripeCatalogWebhookEvent"
SET
  "processingStatus" = 'failed',
  "processingFailureReason" = 'legacy_processing_outcome_unknown'
WHERE
  "processingStatus" = 'succeeded'
  AND "processingCompletedAt" IS NULL;
