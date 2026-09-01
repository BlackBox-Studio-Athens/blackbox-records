PRAGMA defer_foreign_keys = ON;

CREATE TABLE "new_CheckoutOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "checkoutExpiresAt" DATETIME NOT NULL,
    "stripePaymentIntentId" TEXT,
    "shippingLockerId" TEXT,
    "shippingLockerCountryCode" TEXT,
    "shippingLockerNameOrLabel" TEXT,
    "status" TEXT NOT NULL,
    "statusUpdatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "notPaidAt" DATETIME,
    "needsReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_CheckoutOrder" (
    "id",
    "storeItemSlug",
    "variantId",
    "checkoutSessionId",
    "checkoutExpiresAt",
    "stripePaymentIntentId",
    "shippingLockerId",
    "shippingLockerCountryCode",
    "shippingLockerNameOrLabel",
    "status",
    "statusUpdatedAt",
    "paidAt",
    "notPaidAt",
    "needsReviewAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "storeItemSlug",
    "variantId",
    "checkoutSessionId",
    datetime("createdAt", '+30 minutes'),
    "stripePaymentIntentId",
    "shippingLockerId",
    "shippingLockerCountryCode",
    "shippingLockerNameOrLabel",
    "status",
    "statusUpdatedAt",
    "paidAt",
    "notPaidAt",
    "needsReviewAt",
    "createdAt",
    "updatedAt"
FROM "CheckoutOrder";

CREATE TABLE "new_CheckoutOrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "new_CheckoutOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_CheckoutOrderLine" (
    "id",
    "orderId",
    "storeItemSlug",
    "variantId",
    "stripePriceId",
    "quantity",
    "createdAt"
)
SELECT
    "id",
    "orderId",
    "storeItemSlug",
    "variantId",
    "stripePriceId",
    "quantity",
    "createdAt"
FROM "CheckoutOrderLine";

DROP TABLE "CheckoutOrderLine";
DROP TABLE "CheckoutOrder";
ALTER TABLE "new_CheckoutOrder" RENAME TO "CheckoutOrder";
ALTER TABLE "new_CheckoutOrderLine" RENAME TO "CheckoutOrderLine";

CREATE UNIQUE INDEX "CheckoutOrder_checkoutSessionId_key" ON "CheckoutOrder"("checkoutSessionId");
CREATE INDEX "CheckoutOrder_variantId_status_idx" ON "CheckoutOrder"("variantId", "status");
CREATE INDEX "CheckoutOrder_status_createdAt_idx" ON "CheckoutOrder"("status", "createdAt");
CREATE INDEX "CheckoutOrderLine_orderId_idx" ON "CheckoutOrderLine"("orderId");
CREATE INDEX "CheckoutOrderLine_stripePriceId_idx" ON "CheckoutOrderLine"("stripePriceId");
CREATE INDEX "CheckoutOrderLine_variantId_idx" ON "CheckoutOrderLine"("variantId");
CREATE UNIQUE INDEX "CheckoutOrderLine_orderId_variantId_key" ON "CheckoutOrderLine"("orderId", "variantId");

PRAGMA defer_foreign_keys = OFF;
