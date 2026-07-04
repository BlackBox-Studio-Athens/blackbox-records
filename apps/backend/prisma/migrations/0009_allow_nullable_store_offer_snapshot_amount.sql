CREATE TABLE "new_StoreOfferSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storeItemSlug" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "stripeLookupKey" TEXT NOT NULL,
  "amountMinor" INTEGER,
  "currencyCode" TEXT NOT NULL,
  "priceActive" BOOLEAN NOT NULL,
  "productActive" BOOLEAN NOT NULL,
  "syncedAt" DATETIME NOT NULL,
  "freshUntil" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_StoreOfferSnapshot" (
  "id",
  "storeItemSlug",
  "variantId",
  "stripePriceId",
  "stripeLookupKey",
  "amountMinor",
  "currencyCode",
  "priceActive",
  "productActive",
  "syncedAt",
  "freshUntil",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "storeItemSlug",
  "variantId",
  "stripePriceId",
  "stripeLookupKey",
  "amountMinor",
  "currencyCode",
  "priceActive",
  "productActive",
  "syncedAt",
  "freshUntil",
  "createdAt",
  "updatedAt"
FROM "StoreOfferSnapshot";

DROP TABLE "StoreOfferSnapshot";

ALTER TABLE "new_StoreOfferSnapshot" RENAME TO "StoreOfferSnapshot";

CREATE UNIQUE INDEX "StoreOfferSnapshot_storeItemSlug_key" ON "StoreOfferSnapshot"("storeItemSlug");

CREATE UNIQUE INDEX "StoreOfferSnapshot_variantId_key" ON "StoreOfferSnapshot"("variantId");

CREATE INDEX "StoreOfferSnapshot_freshUntil_idx" ON "StoreOfferSnapshot"("freshUntil");

CREATE INDEX "StoreOfferSnapshot_stripeLookupKey_idx" ON "StoreOfferSnapshot"("stripeLookupKey");
