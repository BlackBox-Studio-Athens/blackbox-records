-- Add nullable BOX NOW locker snapshot fields for existing checkout orders.
ALTER TABLE "CheckoutOrder" ADD COLUMN "shippingLockerId" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "shippingLockerCountryCode" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "shippingLockerNameOrLabel" TEXT;
