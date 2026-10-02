CREATE TABLE "PreorderEstimateDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "shipMonth" TEXT,
    "shipPart" TEXT CHECK ("shipPart" IS NULL OR "shipPart" IN ('early', 'mid', 'late')),
    "shipDate" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1 CHECK ("sequence" > 0),
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
    CONSTRAINT "PreorderEstimateDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (("shipMonth" IS NOT NULL AND "shipDate" IS NULL)
        OR ("shipMonth" IS NULL AND "shipPart" IS NULL AND "shipDate" IS NOT NULL)),
    CHECK (
        ("status" = 'pending' AND "deliveredAt" IS NULL AND "needsReviewAt" IS NULL) OR
        ("status" = 'delivered' AND "deliveredAt" IS NOT NULL AND "needsReviewAt" IS NULL AND "nextAttemptAt" IS NULL AND "leaseUntil" IS NULL) OR
        ("status" = 'needs_review' AND "deliveredAt" IS NULL AND "needsReviewAt" IS NOT NULL AND "nextAttemptAt" IS NULL AND "leaseUntil" IS NULL)
    )
);

CREATE UNIQUE INDEX "PreorderEstimateDelivery_orderId_variantId_key" ON "PreorderEstimateDelivery"("orderId", "variantId");
CREATE INDEX "PreorderEstimateDelivery_status_nextAttemptAt_createdAt_idx" ON "PreorderEstimateDelivery"("status", "nextAttemptAt", "createdAt");
