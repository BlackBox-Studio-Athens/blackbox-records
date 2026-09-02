-- Production catalog readiness seed generated from Desired Catalog State.

-- This file must not overwrite existing operator-owned stock quantities.

INSERT INTO "StoreItemOption" (
    "id",
    "storeItemSlug",
    "sourceKind",
    "sourceId",
    "variantId",
    "createdAt",
    "updatedAt"
)
VALUES
    ('store_item_option_disintegration_black_vinyl_lp', 'disintegration-black-vinyl-lp', 'release', 'disintegration', 'variant_disintegration-black-vinyl-lp_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("storeItemSlug") DO UPDATE SET
    "sourceKind" = excluded."sourceKind",
    "sourceId" = excluded."sourceId",
    "variantId" = excluded."variantId",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ItemAvailability" (
    "id",
    "variantId",
    "status",
    "canBuy",
    "updatedAt"
)
VALUES
    ('item_availability_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 'available', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT("variantId") DO UPDATE SET
    "status" = excluded."status",
    "canBuy" = excluded."canBuy",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Stock" (
    "id",
    "variantId",
    "quantity",
    "onlineQuantity",
    "createdAt",
    "updatedAt"
)
VALUES
    ('stock_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 15, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("variantId") DO NOTHING;

