-- Retire the duplicate Distro readiness identity only when the canonical Store Item exists.
-- Historical orders, stock ledger rows, webhook evidence, and Stripe objects remain untouched.
DELETE FROM "StoreOfferSnapshot"
WHERE ("storeItemSlug" = 'chronoboros-caregivers-vinyl'
       OR "variantId" = 'variant_chronoboros-caregivers-vinyl_standard')
  AND EXISTS (
    SELECT 1
    FROM "StoreItemOption"
    WHERE "storeItemSlug" = 'caregivers-vinyl'
      AND "variantId" = 'variant_caregivers-vinyl_standard'
  );

DELETE FROM "VariantStripeMapping"
WHERE "variantId" = 'variant_chronoboros-caregivers-vinyl_standard'
  AND EXISTS (
    SELECT 1
    FROM "StoreItemOption"
    WHERE "storeItemSlug" = 'caregivers-vinyl'
      AND "variantId" = 'variant_caregivers-vinyl_standard'
  );

DELETE FROM "ItemAvailability"
WHERE "variantId" = 'variant_chronoboros-caregivers-vinyl_standard'
  AND EXISTS (
    SELECT 1
    FROM "StoreItemOption"
    WHERE "storeItemSlug" = 'caregivers-vinyl'
      AND "variantId" = 'variant_caregivers-vinyl_standard'
  );

DELETE FROM "Stock"
WHERE "variantId" = 'variant_chronoboros-caregivers-vinyl_standard'
  AND EXISTS (
    SELECT 1
    FROM "StoreItemOption"
    WHERE "storeItemSlug" = 'caregivers-vinyl'
      AND "variantId" = 'variant_caregivers-vinyl_standard'
  );

-- Free the unique (sourceKind, sourceId) tuple before assigning it to the canonical option.
DELETE FROM "StoreItemOption"
WHERE "storeItemSlug" = 'chronoboros-caregivers-vinyl'
  AND "sourceKind" = 'distro'
  AND "sourceId" = 'chronoboros-caregivers-vinyl'
  AND "variantId" = 'variant_chronoboros-caregivers-vinyl_standard'
  AND EXISTS (
    SELECT 1
    FROM "StoreItemOption" canonical
    WHERE canonical."storeItemSlug" = 'caregivers-vinyl'
      AND canonical."variantId" = 'variant_caregivers-vinyl_standard'
  );

UPDATE "StoreItemOption"
SET
  "sourceKind" = 'distro',
  "sourceId" = 'chronoboros-caregivers-vinyl',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "storeItemSlug" = 'caregivers-vinyl'
  AND "variantId" = 'variant_caregivers-vinyl_standard';
