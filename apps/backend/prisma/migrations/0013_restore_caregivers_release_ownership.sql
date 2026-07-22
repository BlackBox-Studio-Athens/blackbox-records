-- Preserve the canonical Store Item and variant while restoring Release ownership.
UPDATE "StoreItemOption"
SET
  "sourceKind" = 'release',
  "sourceId" = 'caregivers',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "storeItemSlug" = 'caregivers-vinyl'
  AND "variantId" = 'variant_caregivers-vinyl_standard'
  AND ("sourceKind" <> 'release' OR "sourceId" <> 'caregivers');
