-- One pending Notify me request per variant and address. A delivered, failed-out or expired alert is deleted,
-- so addresses are kept only while waiting. Email is stored lower-cased and trimmed.
CREATE TABLE "AvailabilityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "email" TEXT NOT NULL CHECK ("email" = lower(trim("email")) AND length("email") BETWEEN 3 AND 320),
    "consentCopyVersion" TEXT NOT NULL,
    "consentedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'sending')),
    "attemptCount" INTEGER NOT NULL DEFAULT 0 CHECK ("attemptCount" BETWEEN 0 AND 5),
    "nextAttemptAt" DATETIME NOT NULL,
    "leaseUntil" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CHECK (("status" = 'pending' AND "leaseUntil" IS NULL) OR ("status" = 'sending' AND "leaseUntil" IS NOT NULL))
);

CREATE UNIQUE INDEX "AvailabilityAlert_variantId_email_key" ON "AvailabilityAlert"("variantId", "email");
CREATE INDEX "AvailabilityAlert_status_nextAttemptAt_createdAt_idx" ON "AvailabilityAlert"("status", "nextAttemptAt", "createdAt");

-- Alert emails attempted per Europe/Athens day, so alerts never exhaust the provider quota order email shares.
CREATE TABLE "AvailabilityAlertSendDay" (
    "day" TEXT NOT NULL PRIMARY KEY CHECK ("day" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'),
    "sentCount" INTEGER NOT NULL DEFAULT 0 CHECK ("sentCount" >= 0)
);
