-- Persist backend-only Stripe Price IDs on checkout order lines for final paid quantity reconciliation.
ALTER TABLE "CheckoutOrderLine" ADD COLUMN "stripePriceId" TEXT;

CREATE INDEX "CheckoutOrderLine_stripePriceId_idx" ON "CheckoutOrderLine"("stripePriceId");
