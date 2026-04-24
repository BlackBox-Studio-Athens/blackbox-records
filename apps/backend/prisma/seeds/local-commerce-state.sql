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
    (
        'store_item_option_barren_point',
        'barren-point',
        'release',
        'barren-point',
        'variant_barren-point_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'store_item_option_aftermaths',
        'aftermaths',
        'distro',
        'aftermaths',
        'variant_aftermaths_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'store_item_option_afterglow_tape',
        'afterglow-tape',
        'distro',
        'afterglow-tape',
        'variant_afterglow-tape_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
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
    (
        'item_availability_barren_point',
        'variant_barren-point_standard',
        'available',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'item_availability_aftermaths',
        'variant_aftermaths_standard',
        'sold_out',
        FALSE,
        CURRENT_TIMESTAMP
    ),
    (
        'item_availability_afterglow_tape',
        'variant_afterglow-tape_standard',
        'sold_out',
        FALSE,
        CURRENT_TIMESTAMP
    )
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
    (
        'stock_barren_point',
        'variant_barren-point_standard',
        3,
        2,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'stock_aftermaths',
        'variant_aftermaths_standard',
        0,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'stock_afterglow_tape',
        'variant_afterglow-tape_standard',
        1,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT("variantId") DO UPDATE SET
    "quantity" = excluded."quantity",
    "onlineQuantity" = excluded."onlineQuantity",
    "updatedAt" = CURRENT_TIMESTAMP;
