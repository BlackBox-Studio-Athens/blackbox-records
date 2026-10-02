ALTER TABLE "Stock" ADD COLUMN "preorderStartedAt" TEXT;
ALTER TABLE "Stock" ADD COLUMN "preorderShipMonth" TEXT
  CHECK ("preorderShipMonth" IS NULL OR "preorderShipMonth" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]');
ALTER TABLE "Stock" ADD COLUMN "preorderShipPart" TEXT
  CHECK ("preorderShipPart" IS NULL OR "preorderShipPart" IN ('early', 'mid', 'late'));
-- The last column carries the cross-column rule: no pre-order, or one pre-order with exactly one of month or date,
-- and a part only beside a month.
ALTER TABLE "Stock" ADD COLUMN "preorderShipDate" TEXT
  CHECK ("preorderShipDate" IS NULL OR "preorderShipDate" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]')
  CHECK (
    ("preorderStartedAt" IS NULL
      AND "preorderShipMonth" IS NULL AND "preorderShipPart" IS NULL AND "preorderShipDate" IS NULL)
    OR ("preorderStartedAt" IS NOT NULL
      AND (("preorderShipMonth" IS NOT NULL AND "preorderShipDate" IS NULL)
        OR ("preorderShipMonth" IS NULL AND "preorderShipPart" IS NULL AND "preorderShipDate" IS NOT NULL)))
  );

CREATE INDEX "Stock_preorderStartedAt_idx" ON "Stock"("preorderStartedAt") WHERE "preorderStartedAt" IS NOT NULL;
