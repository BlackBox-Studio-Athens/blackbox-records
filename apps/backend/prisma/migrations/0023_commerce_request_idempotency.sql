ALTER TABLE "CheckoutOrder" ADD COLUMN "checkoutUrl" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "checkoutCancelUrl" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "checkoutSuccessUrl" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "idempotencyKeyDigest" TEXT
  CHECK ("idempotencyKeyDigest" IS NULL OR length("idempotencyKeyDigest") = 64);
ALTER TABLE "CheckoutOrder" ADD COLUMN "idempotencyFingerprint" TEXT
  CHECK ("idempotencyFingerprint" IS NULL OR length("idempotencyFingerprint") = 64);
ALTER TABLE "CheckoutOrder" ADD COLUMN "idempotencyEnvironment" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "checkoutProviderClaimToken" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "checkoutProviderLeaseUntil" TEXT;

ALTER TABLE "StockChange" ADD COLUMN "idempotencyKeyDigest" TEXT
  CHECK ("idempotencyKeyDigest" IS NULL OR length("idempotencyKeyDigest") = 64);
ALTER TABLE "StockChange" ADD COLUMN "idempotencyFingerprint" TEXT
  CHECK ("idempotencyFingerprint" IS NULL OR length("idempotencyFingerprint") = 64);
ALTER TABLE "StockChange" ADD COLUMN "idempotencyEnvironment" TEXT;

ALTER TABLE "StockCount" ADD COLUMN "idempotencyKeyDigest" TEXT
  CHECK ("idempotencyKeyDigest" IS NULL OR length("idempotencyKeyDigest") = 64);
ALTER TABLE "StockCount" ADD COLUMN "idempotencyFingerprint" TEXT
  CHECK ("idempotencyFingerprint" IS NULL OR length("idempotencyFingerprint") = 64);
ALTER TABLE "StockCount" ADD COLUMN "idempotencyEnvironment" TEXT;

CREATE UNIQUE INDEX "CheckoutOrder_idempotency_scope_key"
  ON "CheckoutOrder"("idempotencyEnvironment", "idempotencyKeyDigest")
  WHERE "idempotencyEnvironment" IS NOT NULL AND "idempotencyKeyDigest" IS NOT NULL;
CREATE UNIQUE INDEX "StockChange_idempotency_scope_key"
  ON "StockChange"("idempotencyEnvironment", "idempotencyKeyDigest", "actorEmail")
  WHERE "idempotencyEnvironment" IS NOT NULL AND "idempotencyKeyDigest" IS NOT NULL;
CREATE UNIQUE INDEX "StockCount_idempotency_scope_key"
  ON "StockCount"("idempotencyEnvironment", "idempotencyKeyDigest", "actorEmail")
  WHERE "idempotencyEnvironment" IS NOT NULL AND "idempotencyKeyDigest" IS NOT NULL;
