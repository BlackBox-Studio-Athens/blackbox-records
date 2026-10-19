CREATE TABLE "SiteAnalyticsDay" (
  "siteKey" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "capturedAt" TEXT NOT NULL,
  "facts" TEXT NOT NULL CHECK(json_valid("facts") AND length(CAST("facts" AS BLOB)) <= 65536),
  PRIMARY KEY ("siteKey", "date")
);
