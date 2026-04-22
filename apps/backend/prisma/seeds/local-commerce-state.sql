INSERT INTO "CatalogItemMapping" (
    "id",
    "catalogItemSlug",
    "sourceKind",
    "sourceId",
    "variantId",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        'catalog_item_mapping_barren_point',
        'barren-point',
        'release',
        'barren-point',
        'variant_barren-point_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'catalog_item_mapping_aftermaths',
        'aftermaths',
        'distro',
        'aftermaths',
        'variant_aftermaths_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'catalog_item_mapping_afterglow_tape',
        'afterglow-tape',
        'distro',
        'afterglow-tape',
        'variant_afterglow-tape_standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT("catalogItemSlug") DO UPDATE SET
    "sourceKind" = excluded."sourceKind",
    "sourceId" = excluded."sourceId",
    "variantId" = excluded."variantId",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "VariantInventorySnapshot" (
    "id",
    "variantId",
    "status",
    "canPurchase",
    "updatedAt"
)
VALUES
    (
        'variant_inventory_snapshot_barren_point',
        'variant_barren-point_standard',
        'available',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'variant_inventory_snapshot_aftermaths',
        'variant_aftermaths_standard',
        'sold_out',
        FALSE,
        CURRENT_TIMESTAMP
    ),
    (
        'variant_inventory_snapshot_afterglow_tape',
        'variant_afterglow-tape_standard',
        'sold_out',
        FALSE,
        CURRENT_TIMESTAMP
    )
ON CONFLICT("variantId") DO UPDATE SET
    "status" = excluded."status",
    "canPurchase" = excluded."canPurchase",
    "updatedAt" = CURRENT_TIMESTAMP;
