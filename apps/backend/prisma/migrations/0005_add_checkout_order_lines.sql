-- Add additive order-line persistence for no-account multi-item cart checkout.
CREATE TABLE "CheckoutOrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "storeItemSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CheckoutOrderLine_orderId_idx" ON "CheckoutOrderLine"("orderId");
CREATE INDEX "CheckoutOrderLine_variantId_idx" ON "CheckoutOrderLine"("variantId");
