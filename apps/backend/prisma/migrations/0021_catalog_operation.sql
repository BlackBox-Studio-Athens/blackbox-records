CREATE TABLE "CatalogOperation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('item_setup', 'price_change')),
  "inputFingerprint" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "expectedRevision" INTEGER NOT NULL CHECK (typeof("expectedRevision") = 'integer' AND "expectedRevision" >= 0),
  "step" TEXT NOT NULL DEFAULT 'started',
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'completed', 'needs_review')),
  "results" JSONB NOT NULL DEFAULT '{}' CHECK (json_valid("results") AND json_type("results") = 'object'),
  "claimToken" TEXT,
  "leaseUntil" TEXT,
  "safeReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (("claimToken" IS NULL) = ("leaseUntil" IS NULL)),
  CHECK (("status" = 'completed') = ("step" = 'completed'))
);
-- Uncertain provider work keeps the item reserved for explicit recovery.
CREATE UNIQUE INDEX "CatalogOperation_unresolved_variant"
  ON "CatalogOperation"("variantId") WHERE "status" <> 'completed';
