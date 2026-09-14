-- Additive only: the reviewed backfill supplies catalog data and CMS linkage.
-- Price amounts, provider bindings, stock, holds, and orders retain their owners.
ALTER TABLE "StoreItemOption" ADD COLUMN "cmsSourceId" TEXT
  CHECK ("cmsSourceId" IS NULL OR length(trim("cmsSourceId")) BETWEEN 1 AND 128);
ALTER TABLE "StoreItemOption" ADD COLUMN "itemType" TEXT
  CHECK ("itemType" IS NULL OR length(trim("itemType")) BETWEEN 1 AND 128);
ALTER TABLE "StoreItemOption" ADD COLUMN "priceKind" TEXT
  CHECK ("priceKind" IS NULL OR "priceKind" IN ('fixed', 'pay_what_you_want'));
ALTER TABLE "StoreItemOption" ADD COLUMN "productProjection" JSONB
  CHECK ("productProjection" IS NULL OR (json_valid("productProjection") AND json_type("productProjection") = 'object'));
ALTER TABLE "StoreItemOption" ADD COLUMN "catalogAvailability" TEXT NOT NULL DEFAULT 'withheld'
  CHECK ("catalogAvailability" IN ('published', 'retired', 'withheld'));
ALTER TABLE "StoreItemOption" ADD COLUMN "catalogRevision" INTEGER NOT NULL DEFAULT 0
  CHECK (typeof("catalogRevision") = 'integer' AND "catalogRevision" >= 0);
CREATE UNIQUE INDEX "StoreItemOption_sourceKind_cmsSourceId_key"
  ON "StoreItemOption"("sourceKind", "cmsSourceId");
