-- What shoppers see once online stock runs out; replaces the restockPlanned flag (Restock planned becomes Coming Soon).
ALTER TABLE "Stock" ADD COLUMN "zeroStockState" TEXT NOT NULL DEFAULT 'sold_out'
  CHECK ("zeroStockState" IN ('coming_soon', 'repressing', 'sold_out'));
ALTER TABLE "Stock" ADD COLUMN "expectedMonth" TEXT
  CHECK ("expectedMonth" IS NULL OR "expectedMonth" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]');
UPDATE "Stock" SET "zeroStockState" = 'coming_soon' WHERE "restockPlanned" = 1;
-- restockPlanned has no index or constraint, so SQLite drops it in place and keeps every other column and row.
ALTER TABLE "Stock" DROP COLUMN "restockPlanned";
