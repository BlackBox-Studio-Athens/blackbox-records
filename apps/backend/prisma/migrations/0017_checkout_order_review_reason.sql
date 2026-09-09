ALTER TABLE "CheckoutOrder" ADD COLUMN "needsReviewReason" TEXT
  CHECK ("needsReviewReason" IS NULL OR "needsReviewReason" IN ('stock_unavailable', 'line_mismatch', 'incomplete_fulfillment'));
