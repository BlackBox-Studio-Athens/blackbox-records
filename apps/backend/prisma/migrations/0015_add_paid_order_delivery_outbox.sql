PRAGMA defer_foreign_keys = ON;

CREATE TABLE "new_CheckoutOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "checkoutExpiresAt" DATETIME NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountTotalMinor" INTEGER,
    "currencyCode" TEXT,
    "recipientName" TEXT,
    "shopperEmail" TEXT,
    "shopperPhone" TEXT,
    "shippingAddressLine1" TEXT,
    "shippingAddressLine2" TEXT,
    "shippingAddressCity" TEXT,
    "shippingAddressPostalCode" TEXT,
    "shippingAddressState" TEXT,
    "shippingAddressCountryCode" TEXT,
    "newsletterOptIn" INTEGER,
    "newsletterConsentAt" DATETIME,
    "newsletterConsentCopyVersion" TEXT,
    "shippingLockerId" TEXT,
    "shippingLockerCountryCode" TEXT,
    "shippingLockerNameOrLabel" TEXT,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending_payment', 'paid', 'not_paid', 'needs_review')),
    "statusUpdatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "notPaidAt" DATETIME,
    "needsReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CHECK ("amountTotalMinor" IS NULL OR "amountTotalMinor" > 0),
    CHECK ("currencyCode" IS NULL OR "currencyCode" = 'EUR'),
    CHECK ("recipientName" IS NULL OR length(trim("recipientName")) > 0),
    CHECK ("shopperEmail" IS NULL OR length(trim("shopperEmail")) > 0),
    CHECK ("shopperPhone" IS NULL OR length(trim("shopperPhone")) > 0),
    CHECK ("shippingAddressLine1" IS NULL OR length(trim("shippingAddressLine1")) > 0),
    CHECK ("shippingAddressLine2" IS NULL OR length(trim("shippingAddressLine2")) > 0),
    CHECK ("shippingAddressCity" IS NULL OR length(trim("shippingAddressCity")) > 0),
    CHECK ("shippingAddressPostalCode" IS NULL OR length(trim("shippingAddressPostalCode")) > 0),
    CHECK ("shippingAddressState" IS NULL OR length(trim("shippingAddressState")) > 0),
    CHECK ("shippingAddressCountryCode" IS NULL OR "shippingAddressCountryCode" = 'GR'),
    CHECK (
        ("newsletterOptIn" IS NULL AND "newsletterConsentAt" IS NULL AND "newsletterConsentCopyVersion" IS NULL) OR
        ("newsletterOptIn" = 0 AND "newsletterConsentAt" IS NULL AND "newsletterConsentCopyVersion" IS NULL) OR
        ("newsletterOptIn" = 1 AND "newsletterConsentAt" IS NOT NULL AND "newsletterConsentCopyVersion" IS NOT NULL AND length(trim("newsletterConsentCopyVersion")) > 0)
    )
);

INSERT INTO "new_CheckoutOrder" (
    "id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "stripePaymentIntentId",
    "shippingLockerId", "shippingLockerCountryCode", "shippingLockerNameOrLabel", "status", "statusUpdatedAt",
    "paidAt", "notPaidAt", "needsReviewAt", "createdAt", "updatedAt"
)
SELECT
    "id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "stripePaymentIntentId",
    "shippingLockerId", "shippingLockerCountryCode", "shippingLockerNameOrLabel", "status", "statusUpdatedAt",
    "paidAt", "notPaidAt", "needsReviewAt", "createdAt", "updatedAt"
FROM "CheckoutOrder";

CREATE TABLE "new_CheckoutOrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
    "displayName" TEXT CHECK ("displayName" IS NULL OR length(trim("displayName")) > 0),
    "optionLabel" TEXT CHECK ("optionLabel" IS NULL OR length(trim("optionLabel")) > 0),
    "unitAmountMinor" INTEGER CHECK ("unitAmountMinor" IS NULL OR "unitAmountMinor" > 0),
    "lineAmountMinor" INTEGER CHECK ("lineAmountMinor" IS NULL OR "lineAmountMinor" > 0),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "new_CheckoutOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK ("lineAmountMinor" IS NULL OR "unitAmountMinor" IS NULL OR "lineAmountMinor" = "unitAmountMinor" * "quantity")
);

INSERT INTO "new_CheckoutOrderLine" (
    "id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "createdAt"
)
SELECT "id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "createdAt"
FROM "CheckoutOrderLine";

DROP TABLE "CheckoutOrderLine";
DROP TABLE "CheckoutOrder";
ALTER TABLE "new_CheckoutOrder" RENAME TO "CheckoutOrder";
ALTER TABLE "new_CheckoutOrderLine" RENAME TO "CheckoutOrderLine";

CREATE TABLE "PaidOrderDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL CHECK ("kind" IN ('shopper_confirmation', 'ops_fulfillment', 'newsletter_registration')),
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

CREATE UNIQUE INDEX "CheckoutOrder_checkoutSessionId_key" ON "CheckoutOrder"("checkoutSessionId");
CREATE INDEX "CheckoutOrder_variantId_status_idx" ON "CheckoutOrder"("variantId", "status");
CREATE INDEX "CheckoutOrder_status_createdAt_idx" ON "CheckoutOrder"("status", "createdAt");
CREATE INDEX "CheckoutOrderLine_orderId_idx" ON "CheckoutOrderLine"("orderId");
CREATE INDEX "CheckoutOrderLine_stripePriceId_idx" ON "CheckoutOrderLine"("stripePriceId");
CREATE INDEX "CheckoutOrderLine_variantId_idx" ON "CheckoutOrderLine"("variantId");
CREATE UNIQUE INDEX "CheckoutOrderLine_orderId_variantId_key" ON "CheckoutOrderLine"("orderId", "variantId");
CREATE UNIQUE INDEX "PaidOrderDelivery_orderId_kind_key" ON "PaidOrderDelivery"("orderId", "kind");
CREATE INDEX "PaidOrderDelivery_status_nextAttemptAt_createdAt_idx" ON "PaidOrderDelivery"("status", "nextAttemptAt", "createdAt");

PRAGMA defer_foreign_keys = OFF;
