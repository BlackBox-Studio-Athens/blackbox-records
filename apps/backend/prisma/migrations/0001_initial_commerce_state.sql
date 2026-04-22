-- CreateTable
CREATE TABLE "CatalogItemMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogItemSlug" TEXT NOT NULL,
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
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VariantInventorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "canPurchase" BOOLEAN NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItemMapping_catalogItemSlug_key" ON "CatalogItemMapping"("catalogItemSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItemMapping_variantId_key" ON "CatalogItemMapping"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItemMapping_sourceKind_sourceId_key" ON "CatalogItemMapping"("sourceKind", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantStripeMapping_variantId_key" ON "VariantStripeMapping"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantInventorySnapshot_variantId_key" ON "VariantInventorySnapshot"("variantId");
