-- CreateTable
CREATE TABLE "CheckoutOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL,
    "statusUpdatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "notPaidAt" DATETIME,
    "needsReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutOrder_checkoutSessionId_key" ON "CheckoutOrder"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "CheckoutOrder_variantId_status_idx" ON "CheckoutOrder"("variantId", "status");

-- CreateIndex
CREATE INDEX "CheckoutOrder_status_createdAt_idx" ON "CheckoutOrder"("status", "createdAt");
