-- Staff dispatch record for paid orders. A null shippedAt after an update records an undone mark.
CREATE TABLE "OrderDispatch" (
  "orderId" TEXT NOT NULL PRIMARY KEY REFERENCES "CheckoutOrder"("id"),
  "shippedAt" TEXT,
  "updatedAt" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);
