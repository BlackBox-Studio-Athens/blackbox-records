DROP INDEX IF EXISTS "CatalogItemMapping_catalogItemSlug_key";
DROP INDEX IF EXISTS "CatalogItemMapping_variantId_key";
DROP INDEX IF EXISTS "CatalogItemMapping_sourceKind_sourceId_key";
DROP INDEX IF EXISTS "VariantInventorySnapshot_variantId_key";

ALTER TABLE "CatalogItemMapping" RENAME TO "StoreItemOption";
ALTER TABLE "StoreItemOption" RENAME COLUMN "catalogItemSlug" TO "storeItemSlug";

ALTER TABLE "VariantInventorySnapshot" RENAME TO "ItemAvailability";
ALTER TABLE "ItemAvailability" RENAME COLUMN "canPurchase" TO "canBuy";

CREATE TABLE "new_VariantStripeMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_VariantStripeMapping" (
    "id",
    "variantId",
    "stripePriceId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "variantId",
    "stripePriceId",
    "createdAt",
    "updatedAt"
FROM "VariantStripeMapping"
WHERE "stripePriceId" IS NOT NULL;

DROP TABLE "VariantStripeMapping";
ALTER TABLE "new_VariantStripeMapping" RENAME TO "VariantStripeMapping";

CREATE UNIQUE INDEX "StoreItemOption_storeItemSlug_key" ON "StoreItemOption"("storeItemSlug");
CREATE UNIQUE INDEX "StoreItemOption_variantId_key" ON "StoreItemOption"("variantId");
CREATE UNIQUE INDEX "StoreItemOption_sourceKind_sourceId_key" ON "StoreItemOption"("sourceKind", "sourceId");
CREATE UNIQUE INDEX "VariantStripeMapping_variantId_key" ON "VariantStripeMapping"("variantId");
CREATE UNIQUE INDEX "ItemAvailability_variantId_key" ON "ItemAvailability"("variantId");
