-- CreateTable
CREATE TABLE "StoreItemOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeItemSlug" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VariantStripeMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "canBuy" BOOLEAN NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreItemOption_storeItemSlug_key" ON "StoreItemOption"("storeItemSlug");

-- CreateIndex
CREATE UNIQUE INDEX "StoreItemOption_variantId_key" ON "StoreItemOption"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreItemOption_sourceKind_sourceId_key" ON "StoreItemOption"("sourceKind", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantStripeMapping_variantId_key" ON "VariantStripeMapping"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAvailability_variantId_key" ON "ItemAvailability"("variantId");
