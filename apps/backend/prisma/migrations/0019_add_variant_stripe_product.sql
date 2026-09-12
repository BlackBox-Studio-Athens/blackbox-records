ALTER TABLE "VariantStripeMapping" ADD COLUMN "stripeProductId" TEXT;
CREATE UNIQUE INDEX "VariantStripeMapping_stripeProductId_key" ON "VariantStripeMapping"("stripeProductId");
