CREATE TABLE "StripeCatalogWebhookEvent" (
  "eventId" TEXT NOT NULL PRIMARY KEY,
  "eventType" TEXT NOT NULL,
  "catalogObjectId" TEXT NOT NULL,
  "catalogObjectKind" TEXT NOT NULL,
  "variantId" TEXT,
  "stripeCreatedAt" DATETIME NOT NULL,
  "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "StripeCatalogWebhookEvent_catalogObjectKind_catalogObjectId_idx"
  ON "StripeCatalogWebhookEvent"("catalogObjectKind", "catalogObjectId");

CREATE INDEX "StripeCatalogWebhookEvent_variantId_stripeCreatedAt_idx"
  ON "StripeCatalogWebhookEvent"("variantId", "stripeCreatedAt");
