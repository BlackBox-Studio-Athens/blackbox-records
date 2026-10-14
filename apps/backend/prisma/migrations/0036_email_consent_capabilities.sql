-- Local consent capabilities. Never store the bearer token itself.
CREATE INDEX "AvailabilityAlert_email" ON "AvailabilityAlert" ("email");
CREATE TABLE "EmailConsent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "purpose" TEXT NOT NULL CHECK ("purpose" IN ('newsletter', 'availability-withdrawal')),
  "email" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "sentAt" TEXT,
  "consumedAt" TEXT
);
CREATE INDEX "EmailConsent_recipient" ON "EmailConsent" ("email", "purpose", "createdAt");
CREATE INDEX "EmailConsent_expiry" ON "EmailConsent" ("expiresAt");
CREATE TABLE "EmailConsentSendDay" (
  "day" TEXT PRIMARY KEY NOT NULL,
  "reservedCount" INTEGER NOT NULL
);
