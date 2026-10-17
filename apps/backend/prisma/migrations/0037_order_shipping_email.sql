-- Extend the closed delivery kinds while preserving every existing delivery and its retry history.
CREATE TABLE "new_PaidOrderDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL CHECK ("kind" IN ('shopper_confirmation', 'ops_fulfillment', 'newsletter_registration', 'shopper_shipping')),
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'delivered', 'needs_review')),
    "attemptCount" INTEGER NOT NULL DEFAULT 0 CHECK ("attemptCount" BETWEEN 0 AND 5),
    "nextAttemptAt" DATETIME,
    "leaseUntil" DATETIME,
    "providerMessageId" TEXT,
    "safeReason" TEXT,
    "deliveredAt" DATETIME,
    "needsReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaidOrderDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (
        ("status" = 'pending' AND "deliveredAt" IS NULL AND "needsReviewAt" IS NULL) OR
        ("status" = 'delivered' AND "deliveredAt" IS NOT NULL AND "needsReviewAt" IS NULL AND "nextAttemptAt" IS NULL AND "leaseUntil" IS NULL) OR
        ("status" = 'needs_review' AND "deliveredAt" IS NULL AND "needsReviewAt" IS NOT NULL AND "nextAttemptAt" IS NULL AND "leaseUntil" IS NULL)
    )
);

INSERT INTO "new_PaidOrderDelivery" (
    "id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil", "providerMessageId",
    "safeReason", "deliveredAt", "needsReviewAt", "createdAt", "updatedAt"
)
SELECT
    "id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil", "providerMessageId",
    "safeReason", "deliveredAt", "needsReviewAt", "createdAt", "updatedAt"
FROM "PaidOrderDelivery";

DROP TABLE "PaidOrderDelivery";
ALTER TABLE "new_PaidOrderDelivery" RENAME TO "PaidOrderDelivery";

CREATE UNIQUE INDEX "PaidOrderDelivery_orderId_kind_key" ON "PaidOrderDelivery"("orderId", "kind");
CREATE INDEX "PaidOrderDelivery_status_nextAttemptAt_createdAt_idx" ON "PaidOrderDelivery"("status", "nextAttemptAt", "createdAt");
