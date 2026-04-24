INSERT INTO "VariantStripeMapping" (
    "id",
    "variantId",
    "stripePriceId",
    "createdAt",
    "updatedAt"
)
VALUES (
    'variant_stripe_mapping_barren_point_mock',
    'variant_barren-point_standard',
    'price_mock_barren_point',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT("variantId") DO UPDATE SET
    "stripePriceId" = excluded."stripePriceId",
    "updatedAt" = CURRENT_TIMESTAMP;
