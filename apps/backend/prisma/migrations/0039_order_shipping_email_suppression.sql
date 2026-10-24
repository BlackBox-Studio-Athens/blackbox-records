-- A skipped shipping email stays skipped after an undone dispatch is marked again.
ALTER TABLE "OrderDispatch" ADD COLUMN "shippingEmailSuppressed" INTEGER NOT NULL DEFAULT 0
  CHECK ("shippingEmailSuppressed" IN (0, 1));
