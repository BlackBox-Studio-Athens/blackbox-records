CREATE TABLE "MerchantSyncRun" (
  "scope" TEXT PRIMARY KEY NOT NULL,
  "cursor" TEXT,
  "token" TEXT NOT NULL,
  "quotaBlocked" INTEGER NOT NULL DEFAULT 0 CHECK ("quotaBlocked" IN (0, 1)),
  "leaseUntil" TEXT,
  "nextRunAt" TEXT NOT NULL
);

CREATE TABLE "MerchantManagedOffer" (
  "scope" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "storeItemSlug" TEXT NOT NULL,
  "inputHash" TEXT,
  "submittedAt" TEXT,
  PRIMARY KEY ("scope", "variantId")
);
