ALTER TABLE "CheckoutOrder" ADD COLUMN "shippingLockerAddressLine" TEXT;
ALTER TABLE "CheckoutOrder" ADD COLUMN "shippingLockerPostalCode" TEXT;

ALTER TABLE "OrderDispatch" ADD COLUMN "lockerUsedId" TEXT;
ALTER TABLE "OrderDispatch" ADD COLUMN "lockerUsedName" TEXT;
ALTER TABLE "OrderDispatch" ADD COLUMN "parcelNumbers" TEXT CHECK ("parcelNumbers" IS NULL OR json_valid("parcelNumbers"));
